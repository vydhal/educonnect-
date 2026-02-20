import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Get all users (Network suggestions)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.query.role as string;
    const schoolType = req.query.schoolType as string;
    const schoolId = req.query.schoolId as string;
    const where: any = {};

    if (role && role !== 'TODAS') {
      where.role = role.toUpperCase();
    }

    if (schoolType) {
      where.schoolType = schoolType;
    }

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (req.userId) {
      where.id = { not: req.userId };
    }

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
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Featured Schools (Ranking)
router.get('/featured-schools', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Logic: Fetch schools and calculate engagement
    // engagement = (posts * 1) + (projects * 3) + (likes_received * 0.5) + (followers * 1)

    // For simplicity with Prisma and current model, we'll fetch schools with their counts
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
        }
      },
      take: 20 // Get more and filter/sort in memory or use raw query for complex ranking
    });

    // We can't easily count "likes received" across all posts in a single simple Prisma query without complex relations
    // Let's stick to posts, projects and followers for now
    const rankedSchools = schools.map(school => ({
      id: school.id,
      name: school.name,
      avatar: school.avatar,
      schoolType: school.schoolType,
      verified: school.verified,
      engagement: (school._count.posts * 1) + (school._count.projects * 3) + (school._count.followers * 1)
    }))
      .sort((a, b) => b.engagement - a.engagement)
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
    // Theme is likely client-side only, but if we add it to schema later we can save it.
    // For now, we'll focus on the fields that exist in schema.

    if (password) {
      // Dynamic import for hashPassword if not available in this scope, 
      // OR better yet, we just import it at the top if we haven't already.
      // Checking imports... hashPassword is NOT imported in the original file view.
      // I will add the import in a separate block or assume it needs to be added.
      // For safety, let's use the same bcrypt logic or import util.
      // admin.routes.ts uses hashPassword from ../utils/auth.js
      const { hashPassword } = await import('../utils/auth.js');
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
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
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
        _count: {
          select: { followers: true, following: true, posts: true, projects: true }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let isFollowing = false;
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
    }

    res.json({ ...user, isFollowing });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Follow user
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
      return res.json({ following: false });
    }

    await prisma.userFollow.create({
      data: {
        followerId: req.userId,
        followingId: req.params.id
      }
    });

    res.json({ following: true });
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

    res.json(followers.map(f => f.follower));
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

    res.json(following.map(f => f.following));
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
