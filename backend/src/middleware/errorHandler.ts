import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request<any, any, any, any> {
  userId?: string;
  userRole?: string;
  [key: string]: any; // Permite body, query, params etc mesmo se o IntelliSense falhar
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError || err.statusCode) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }

  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};
