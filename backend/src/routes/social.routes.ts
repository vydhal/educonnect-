
import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../middleware/errorHandler.js';

const router = Router();

// --- Badges (Selos) ---

// Give a badge
router.post('/badge/:receiverId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { type } = req.body; // 'PROATIVO' | 'ESPECIAL' | 'HARMONIOSO'
        const giverId = req.userId!;
        const receiverId = req.params.receiverId;

        if (giverId === receiverId) {
            return res.status(400).json({ error: 'You cannot give a badge to yourself' });
        }

        const validTypes = ['PROATIVO', 'ESPECIAL', 'HARMONIOSO'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid badge type' });
        }

        const badge = await prisma.badge.upsert({
            where: {
                giverId_receiverId_type: {
                    giverId,
                    receiverId,
                    type
                }
            },
            update: {},
            create: {
                giverId,
                receiverId,
                type
            }
        });

        // Create notification for badge
        await prisma.notification.create({
            data: {
                type: 'BADGE',
                recipientId: receiverId,
                senderId: giverId,
                relatedId: badge.id,
                content: `te deu um selo de ${type.toLowerCase()}`
            }
        }).catch((err: any) => console.error('Failed to create badge notification', err));

        res.status(201).json(badge);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get badge counts for a user
router.get('/badges/:userId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const badges = await prisma.badge.groupBy({
            by: ['type'],
            where: { receiverId: userId },
            _count: {
                id: true
            }
        });

        const counts = {
            PROATIVO: badges.find((b: any) => b.type === 'PROATIVO')?._count.id || 0,
            ESPECIAL: badges.find((b: any) => b.type === 'ESPECIAL')?._count.id || 0,
            HARMONIOSO: badges.find((b: any) => b.type === 'HARMONIOSO')?._count.id || 0,
        };

        res.json(counts);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Profile Views ---

// Record a view
router.post('/profile-view/:profileId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const viewerId = req.userId!;
        const profileId = req.params.profileId;

        if (viewerId === profileId) return res.send();

        await prisma.profileView.create({
            data: {
                viewerId,
                profileId
            }
        });

        res.status(201).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent visitors
router.get('/profile-visitors', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const visitors = await prisma.profileView.findMany({
            where: { profileId: userId },
            distinct: ['viewerId'],
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                viewer: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });

        res.json(visitors.map((v: any) => v.viewer));
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Testimonials (Depoimentos) ---

// Send a testimonial
router.post('/testimonial', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { content, receiverId } = req.body;
        const senderId = req.userId!;

        if (!content || !receiverId) {
            return res.status(400).json({ error: 'Content and receiverId are required' });
        }

        const testimonial = await prisma.testimonial.create({
            data: {
                content,
                senderId,
                receiverId,
                status: 'PENDING'
            }
        });

        // Create notification for testimonial
        await prisma.notification.create({
            data: {
                type: 'TESTIMONIAL',
                recipientId: receiverId,
                senderId: senderId,
                relatedId: testimonial.id,
                content: 'te enviou um novo depoimento para aprovação'
            }
        }).catch((err: any) => console.error('Failed to create testimonial notification', err));

        res.status(201).json(testimonial);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get pending testimonials (for owner)
router.get('/testimonials/pending', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const pending = await prisma.testimonial.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get approved testimonials for a user
router.get('/testimonials/:userId', async (req, res: Response) => {
    try {
        const { userId } = req.params;
        if (userId === 'pending') return res.json([]);

        const testimonials = await prisma.testimonial.findMany({
            where: {
                receiverId: userId,
                status: 'APPROVED'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve/Reject testimonial
router.put('/testimonial/:id/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userId!;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const testimonial = await prisma.testimonial.findUnique({ where: { id } });
        if (!testimonial || testimonial.receiverId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await prisma.testimonial.update({
            where: { id },
            data: { status }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Trending Tags ---

router.get('/trending-tags', async (req, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            select: { tags: true }
        });

        const tagCounts: { [key: string]: number } = {};
        posts.forEach((post: any) => {
            post.tags.forEach((tag: string) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const sortedTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        res.json(sortedTags);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Weekly Events ---

// Get all events
router.get('/events', async (req, res: Response) => {
    try {
        const events = await prisma.weeklyEvent.findMany({
            where: {
                date: {
                    gte: new Date()
                }
            },
            orderBy: { date: 'asc' },
            take: 5
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create event (Admin only)
router.post('/events', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can create events' });
        }

        const { name, date, link } = req.body;
        if (!name || !date) {
            return res.status(400).json({ error: 'Name and date are required' });
        }

        const event = await prisma.weeklyEvent.create({
            data: {
                name,
                date: new Date(date),
                link
            }
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete event (Admin only)
router.delete('/events/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can delete events' });
        }

        await prisma.weeklyEvent.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
