import { Router, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Middleware: Teachers, School Staff and Admins can moderate
const moderatorMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const allowedRoles = ['ADMIN', 'PROFESSOR', 'EQUIPE_ESCOLAR'];
  if (!req.userRole || !allowedRoles.includes(req.userRole.toUpperCase())) {
    throw new AppError('Acesso restrito a professores, equipe escolar ou administradores', 403);
  }
  next();
};

// Get moderation items with filtering by school, class and status
router.get('/', authMiddleware, moderatorMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, classId, search } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    // Role-based scope: Teachers and School Staff only see their school's students
    if (req.userRole !== 'ADMIN') {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { memberOfSchools: { select: { id: true } } }
      });

      const schoolIds = [
        ...(currentUser?.schoolId ? [currentUser.schoolId] : []),
        ...(currentUser?.memberOfSchools?.map(s => s.id) || [])
      ].filter(Boolean);

      if (schoolIds.length > 0) {
        where.post = {
          ...where.post,
          OR: [
            { schoolId: { in: schoolIds } },
            { author: { schoolId: { in: schoolIds } } }
          ]
        };
      }
    }

    if (classId) {
      where.post = {
        ...where.post,
        classId: classId as string
      };
    }

    if (search) {
      where.post = {
        ...where.post,
        OR: [
          { content: { contains: search as string, mode: 'insensitive' } },
          { author: { name: { contains: search as string, mode: 'insensitive' } } },
          { author: { registration: { contains: search as string, mode: 'insensitive' } } }
        ]
      };
    }

    const items = await prisma.moderationItem.findMany({
      where,
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
                school: true,
                schoolId: true,
                className: true,
                registration: true
              }
            }
          }
        },
        moderator: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching moderation items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Moderation Stats for badge and dashboard
router.get('/stats', authMiddleware, moderatorMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let schoolFilter: any = {};
    if (req.userRole !== 'ADMIN') {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { memberOfSchools: { select: { id: true } } }
      });

      const schoolIds = [
        ...(currentUser?.schoolId ? [currentUser.schoolId] : []),
        ...(currentUser?.memberOfSchools?.map(s => s.id) || [])
      ].filter(Boolean);

      if (schoolIds.length > 0) {
        schoolFilter = {
          post: {
            OR: [
              { schoolId: { in: schoolIds } },
              { author: { schoolId: { in: schoolIds } } }
            ]
          }
        };
      }
    }

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.moderationItem.count({ where: { ...schoolFilter, status: 'PENDENTE' } }),
      prisma.moderationItem.count({ where: { ...schoolFilter, status: 'APROVADO' } }),
      prisma.moderationItem.count({ where: { ...schoolFilter, status: 'REPROVADO' } })
    ]);

    res.json({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: pendingCount + approvedCount + rejectedCount
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Flag post for moderation (Community or Self-report)
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
      throw new AppError('Post already in moderation', 400);
    }

    const moderation = await prisma.moderationItem.create({
      data: {
        postId: req.params.postId,
        status: 'PENDENTE',
        reason: reason || 'Denúncia de conteúdo'
      },
      include: {
        post: true
      }
    });

    // Mark post as pending
    await prisma.post.update({
      where: { id: req.params.postId },
      data: { status: 'PENDENTE' }
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
router.put('/:id/approve', authMiddleware, moderatorMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const currentItem = await prisma.moderationItem.findUnique({
      where: { id: req.params.id },
      include: { post: true }
    });

    if (!currentItem) {
      throw new AppError('Item de moderação não encontrado', 404);
    }

    // 1. Update Moderation item
    const moderation = await prisma.moderationItem.update({
      where: { id: req.params.id },
      data: {
        status: 'APROVADO',
        moderatorId: req.userId
      },
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true } }
          }
        },
        moderator: {
          select: { id: true, name: true }
        }
      }
    });

    // 2. Publish the post
    await prisma.post.update({
      where: { id: moderation.postId },
      data: { status: 'PUBLICADO' }
    });

    // 3. Send notification to student author
    if (moderation.post?.authorId) {
      const moderatorName = moderation.moderator?.name || 'Seu professor';
      prisma.notification.create({
        data: {
          type: 'MODERATION_APPROVED',
          recipientId: moderation.post.authorId,
          senderId: req.userId,
          relatedId: moderation.postId,
          content: `Sua publicação foi aprovada por ${moderatorName} e já está disponível no mural!`
        }
      }).catch(err => console.error('Failed to notify student:', err));
    }

    res.json(moderation);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Reject moderation item
router.put('/:id/reject', authMiddleware, moderatorMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { reason, deletePost } = req.body;

    const currentItem = await prisma.moderationItem.findUnique({
      where: { id: req.params.id },
      include: { post: true }
    });

    if (!currentItem) {
      throw new AppError('Item de moderação não encontrado', 404);
    }

    // 1. Update Moderation item
    const moderation = await prisma.moderationItem.update({
      where: { id: req.params.id },
      data: {
        status: 'REPROVADO',
        reason: reason || 'Conteúdo não aprovado na moderação pedagógica',
        moderatorId: req.userId
      },
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true } }
          }
        },
        moderator: {
          select: { id: true, name: true }
        }
      }
    });

    // 2. Set post status as REPROVADO or delete if explicitly requested
    if (deletePost) {
      await prisma.post.delete({
        where: { id: moderation.postId }
      });
    } else {
      await prisma.post.update({
        where: { id: moderation.postId },
        data: { status: 'REPROVADO' }
      });
    }

    // 3. Send notification to student author with the feedback reason
    if (moderation.post?.authorId) {
      const moderatorName = moderation.moderator?.name || 'Seu professor';
      const feedbackText = reason ? ` Motivo: "${reason}"` : '';
      prisma.notification.create({
        data: {
          type: 'MODERATION_REJECTED',
          recipientId: moderation.post.authorId,
          senderId: req.userId,
          relatedId: moderation.postId,
          content: `Sua publicação foi analisada por ${moderatorName} e não foi aprovada.${feedbackText}`
        }
      }).catch(err => console.error('Failed to notify student:', err));
    }

    res.json(moderation);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
