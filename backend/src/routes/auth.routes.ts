import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { hashPassword, generateToken, comparePassword } from '../utils/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ... existing code ...

// Register
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      throw new AppError('Missing required fields', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Login
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('GET /profile called for user:', req.userId);
    if (!req.userId) {
      console.log('GET /profile: No userId in request');
      throw new AppError('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        _count: {
          select: { followers: true, following: true, posts: true }
        }
      }
    });

    if (!user) {
      console.log('GET /profile: User not found in DB');
      throw new AppError('User not found', 404);
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      school: user.school,
      verified: user.verified,
      stats: user._count
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
