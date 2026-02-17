import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Get moderation items
router.get('/', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await prisma.moderationItem.findMany({
      include: {
        post: {
          include: {
            author: {
              select: { name: true, school: true }
            }
          }
        },
        moderator: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Flag post for moderation
router.post('/flag/:postId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const post = await prisma.post.findUnique({
      where: { id: req.params.postId }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const existingModeration = await prisma.moderationItem.findUnique({
      where: { postId: req.params.postId }
    });

    if (existingModeration) {
      throw new AppError('Post already flagged', 400);
    }

    const moderation = await prisma.moderationItem.create({
      data: {
        postId: req.params.postId,
        reason: reason || 'User report'
      },
      include: {
        post: true
      }
    });

    res.status(201).json(moderation);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Approve moderation item
router.put('/:id/approve', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const moderation = await prisma.moderationItem.update({
      where: { id: req.params.id },
      data: {
        status: 'APROVADO',
        moderatorId: req.userId
      },
      include: {
        post: true
      }
    });

    res.json(moderation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject moderation item
router.put('/:id/reject', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { reason } = req.body;

    const moderation = await prisma.moderationItem.update({
      where: { id: req.params.id },
      data: {
        status: 'REPROVADO',
        reason: reason,
        moderatorId: req.userId
      },
      include: {
        post: true
      }
    });

    // Optionally delete the post if rejected
    if (req.body.deletePost) {
      await prisma.post.delete({
        where: { id: moderation.postId }
      });
    }

    res.json(moderation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
