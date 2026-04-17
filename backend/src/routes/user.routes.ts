import { Router, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';
import { hashPassword } from '../utils/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Get all users (Network suggestions)
router.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, schoolType, schoolId, search, category } = req.query;
    const and: any[] = [];

    if (category === 'ESCOLAS') {
      and.push({ role: 'ESCOLA' });
      and.push({
        OR: [
          { name: { startsWith: 'EMEF', mode: 'insensitive' } },
          { name: { startsWith: 'EMEIF', mode: 'insensitive' } },
          { name: { startsWith: 'CEAI', mode: 'insensitive' } }
        ]
      });
    } else if (category === 'CRECHES') {
      and.push({ role: 'ESCOLA' });
      and.push({
        OR: [
          { name: { startsWith: 'CM', mode: 'insensitive' } },
          { name: { startsWith: 'CASA DA CRIANÇA', mode: 'insensitive' } }
        ]
      });
    } else if (category === 'USUARIOS') {
      and.push({ role: { not: 'ESCOLA' } });
    } else if (role && role !== 'TODAS') {
      and.push({ role: (role as string).toUpperCase() });
    }

    if (schoolType && !category) {
      and.push({ schoolType });
    }

    if (schoolId) {
      and.push({ schoolId });
    }

    if (search) {
      and.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { school: { contains: search as string, mode: 'insensitive' } }
        ]
      });
    }

    if (req.userId) {
      and.push({ id: { not: req.userId } });
    }

    const where = and.length > 0 ? { AND: and } : {};

    const currentUserId = req.userId;
    console.log('GET /users: currentUserId identified as:', currentUserId);

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        school: true,
        schoolType: true,
        schoolId: true,
        verified: true,
        _count: {
          select: { followers: true }
        },
        ...(currentUserId ? {
            followers: {
                where: { followerId: currentUserId },
                select: { id: true }
            }
        } : {})
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map((u: any) => {
        const isFollowing = currentUserId ? (u.followers ? u.followers.length > 0 : false) : false;
        if (currentUserId) {
            console.log(`User ${u.name} (${u.id}): followers_found=${u.followers?.length}, isFollowing=${isFollowing}`);
        }
        return {
            ...u,
            isFollowing
        };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Featured Schools (Ranking)
router.get('/featured-schools', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    console.log('GET /featured-schools: currentUserId identified as:', currentUserId);

    const schools = await prisma.user.findMany({
      where: { role: 'ESCOLA' },
      select: {
        id: true,
        name: true,
        avatar: true,
        schoolType: true,
        verified: true,
        _count: {
          select: {
            posts: true,
            projects: true,
            followers: true
          }
        },
        ...(currentUserId ? {
            followers: {
                where: { followerId: currentUserId },
                select: { id: true }
            }
        } : {})
      },
      take: 20
    });

    const rankedSchools = schools.map((school: any) => {
      const isFollowing = currentUserId ? (school.followers ? school.followers.length > 0 : false) : false;
      if (currentUserId) {
          console.log(`Featured School ${school.name} (${school.id}): followers_found=${school.followers?.length}, isFollowing=${isFollowing}`);
      }
      return {
        id: school.id,
        name: school.name,
        avatar: school.avatar,
        schoolType: school.schoolType,
        verified: school.verified,
        isFollowing,
        engagement: (school._count.posts * 1) + (school._count.projects * 3) + (school._count.followers * 1)
      };
    })
      .sort((a: any, b: any) => b.engagement - a.engagement)
      .slice(0, 5);

    res.json(rankedSchools);
  } catch (error) {
    console.error('Error fetching featured schools:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Update own profile
router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, avatar, bio, password, school, theme } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (bio) updateData.bio = bio;
    if (school) updateData.school = school;

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        school: true,
        verified: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        school: true,
        verified: true,
        memberOfSchools: { select: { id: true, name: true } },
        _count: {
          select: { followers: true, following: true, posts: true, projects: true }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if current user is following this profile
    let isFollowing = false;
    let friendship = null;

    if (req.userId) {
        const follow = await prisma.userFollow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: req.userId,
                    followingId: req.params.id
                }
            }
        });
        isFollowing = !!follow;

        // Check friendship status
        friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: req.userId, receiverId: req.params.id },
                    { senderId: req.params.id, receiverId: req.userId }
                ]
            }
        });
    }

    // Friend count
    const friendsCount = await prisma.friendship.count({
        where: {
            status: 'ACCEPTED',
            OR: [
                { senderId: req.params.id },
                { receiverId: req.params.id }
            ]
        }
    });

    res.json({
      ...user,
      schools: user.memberOfSchools,
      isFollowing,
      friendship,
      friendsCount
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Follow user (only for roles ESCOLA)
router.post('/:id/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.userId === req.params.id) {
      throw new AppError('Cannot follow yourself', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'ESCOLA') {
      throw new AppError('Somente Unidades e Escolas podem ser seguidas. Para outros usuários, envie solicitação de amizade.', 400);
    }

    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: req.params.id
        }
      }
    });

    if (existingFollow) {
      await prisma.userFollow.delete({
        where: { id: existingFollow.id }
      });
      // Return real count after unfollow
      const followersCount = await prisma.userFollow.count({ where: { followingId: req.params.id } });
      return res.json({ following: false, followersCount });
    }

    await prisma.userFollow.create({
      data: {
        followerId: req.userId,
        followingId: req.params.id
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        recipientId: req.params.id,
        senderId: req.userId,
        relatedId: req.userId,
        content: 'começou a te seguir'
      }
    }).catch(err => console.error('Failed to create follow notification', err));

    // Return real count after follow
    const followersCount = await prisma.userFollow.count({ where: { followingId: req.params.id } });
    res.json({ following: true, followersCount });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get followers
router.get('/:id/followers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followers = await prisma.userFollow.findMany({
      where: { followingId: req.params.id },
      include: {
        follower: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });

    res.json(followers.map((f: any) => f.follower));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get following
router.get('/:id/following', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const following = await prisma.userFollow.findMany({
      where: { followerId: req.params.id },
      include: {
        following: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });

    res.json(following.map((f: any) => f.following));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
router.get('/search/:query', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.params.query;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { school: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        school: true,
        schoolType: true,
        schoolId: true,
        verified: true
      },
      take: 20
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
