import { Router, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/badge-types - List all active badge types
router.get('/', async (req, res: Response) => {
  try {
    const types = await prisma.badgeType.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { badges: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/badge-types - Create a new badge type (Admin only)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  console.log('POST /api/badge-types hit with body:', req.body);
  try {
    const { name, icon, description, color } = req.body;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (!name || !icon) {
      return res.status(400).json({ error: 'Name and icon are required' });
    }

    const badgeType = await prisma.badgeType.create({
      data: {
        name,
        icon,
        description,
        color: color || '#7C3AED'
      }
    });

    res.status(201).json(badgeType);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Badge type name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/badge-types/:id - Update a badge type (Admin only)
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, icon, description, color, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const badgeType = await prisma.badgeType.update({
      where: { id },
      data: {
        name,
        icon,
        description,
        color,
        isActive
      }
    });

    res.json(badgeType);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/badge-types/:id - Deactivate a badge type (Admin only)
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.badgeType.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Badge type deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
