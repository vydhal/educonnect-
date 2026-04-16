import { Router, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../middleware/errorHandler.js';

const router = Router();

// Get all notifications for current user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: req.userId },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const notification = await prisma.notification.update({
            where: {
                id: req.params.id,
                recipientId: req.userId // Security check
            },
            data: { isRead: true }
        });

        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: {
                recipientId: req.userId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
