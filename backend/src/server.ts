import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { prisma } from './prisma/client.js';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import adminRoutes from './routes/admin.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import socialRoutes from './routes/social.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import supportRoutes from './routes/support.routes.js';
import badgeTypesRoutes from './routes/badgetypes.routes.js';
import externalRoutes from './routes/external.routes.js';
import auditRoutes from './routes/audit.routes.js';
import path from 'path';

import helmet from 'helmet';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Express = express();
app.enable('trust proxy');
const port = parseInt(process.env.PORT || '5000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Prisma is initialized in ./prisma/client.js

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Global API Rate Limiter
app.use('/api', generalLimiter);

// Middleware CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://172.20.160.1:3000',
  'http://172.20.160.1:3001'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      return origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ''));
    });

    if (isAllowed || !isProduction) {
      return callback(null, true);
    }

    return callback(new Error(`Origem ${origin} não autorizada pela política de CORS`));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Routes
app.use('/api/badge-types', badgeTypesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/admin/audit-logs', auditRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
