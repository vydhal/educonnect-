import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Create post
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, image } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: req.userId
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all posts (feed)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true, school: true }
        },
        _count: {
          select: { comments: true, likes: true }
        },
        likes: req.userId ? {
          where: { userId: req.userId },
          select: { id: true }
        } : false
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      likes: post._count.likes,
      comments: post._count.comments,
      liked: req.userId ? (post.likes as any)?.length > 0 : false
    }));

    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get post by id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    res.json(post);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Like post
router.post('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: req.params.id,
          userId: req.userId
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      return res.json({ liked: false });
    }

    await prisma.like.create({
      data: {
        postId: req.params.id,
        userId: req.userId
      }
    });

    res.json({ liked: true });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Add comment
router.post('/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      throw new AppError('Comment content is required', 400);
    }

    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: req.params.id,
        authorId: req.userId
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const post = await prisma.post.findUnique({
      where: { id: req.params.id }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.authorId !== req.userId && req.userRole !== 'ADMIN') {
      throw new AppError('Not authorized', 403);
    }

    await prisma.post.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
