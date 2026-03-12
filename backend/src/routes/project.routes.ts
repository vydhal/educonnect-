import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Create project (Ideais que Inspiram)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, content, image, images, attachments, etapa, componente, category } = req.body;

    if (!title || !description || !content || !etapa || !componente) {
      throw new AppError('Campos obrigatórios ausentes', 400);
    }

    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Verify user exists to avoid 500 error on referential integrity
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      throw new AppError('Usuário não encontrado. Por favor, faça login novamente.', 401);
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        content,
        image,
        images: images || [],
        attachments: attachments || [],
        etapa,
        componente,
        category: category || 'Geral',
        authorId: req.userId
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all projects with filters
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { etapa, componente, search } = req.query;

    const where: any = {};
    if (etapa && etapa !== 'TODOS') where.etapa = String(etapa);
    if (componente && componente !== 'TODOS') where.componente = String(componente);
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { content: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, school: true }
        },
        _count: {
          select: { likes: true, favorites: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project by id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, school: true }
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { likes: true, favorites: true, comments: true }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.json(project);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Like/Unlike project
router.post('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId!;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existingLike = await prisma.projectLike.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });

    if (existingLike) {
      await prisma.projectLike.delete({ where: { id: existingLike.id } });
      return res.json({ liked: false });
    }

    await prisma.projectLike.create({
      data: { projectId, userId }
    });

    // Create notification for the author
    if (project.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_LIKE',
          recipientId: project.authorId,
          senderId: userId,
          relatedId: projectId,
          content: `curtiu sua inspiração: "${project.title}"`
        }
      });
    }

    res.json({ liked: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Favorite/Unfavorite project
router.post('/:id/favorite', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId!;

    const existingFav = await prisma.projectFavorite.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });

    if (existingFav) {
      await prisma.projectFavorite.delete({ where: { id: existingFav.id } });
      return res.json({ favorited: false });
    }

    await prisma.projectFavorite.create({
      data: { projectId, userId }
    });

    res.json({ favorited: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to project
router.post('/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    const projectId = req.params.id;
    const authorId = req.userId!;

    if (!content) throw new AppError('Content is required', 400);

    const comment = await prisma.projectComment.create({
      data: { content, projectId, authorId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        project: { select: { title: true, authorId: true } }
      }
    });

    // Create notification for the author
    if (comment.project.authorId !== authorId) {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_COMMENT',
          recipientId: comment.project.authorId,
          senderId: authorId,
          relatedId: projectId,
          content: `comentou em sua inspiração: "${comment.project.title}"`
        }
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (project.authorId !== req.userId && req.userRole !== 'ADMIN') {
      throw new AppError('Not authorized', 403);
    }

    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Project deleted' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
