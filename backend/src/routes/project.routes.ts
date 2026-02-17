import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Create project
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, image, category } = req.body;

    if (!title || !description) {
      throw new AppError('Title and description are required', 400);
    }

    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        image,
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
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all projects
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, school: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(projects);
  } catch (error) {
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

// Get projects by category
router.get('/category/:category', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        category: {
          contains: req.params.category,
          mode: 'insensitive'
        }
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
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
