import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AppError } from './errorHandler.js';

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Auth Middleware: No Authorization header');
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth Middleware: No token found in header');
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    console.log('Auth Middleware: Token verified for user', decoded.userId, 'role', decoded.role);

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth Middleware: Invalid token', error);
    throw new AppError('Invalid token', 401);
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }
  next();
};
