
import { Router, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../middleware/errorHandler.js';

const router = Router();

// --- Badges (Selos) ---

// --- Badges (Selos) ---

// Give a badge
router.post('/badge/:receiverId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { badgeTypeId } = req.body;
        const giverId = req.userId!;
        const receiverId = req.params.receiverId;

        if (giverId === receiverId) {
            return res.status(400).json({ error: 'You cannot give a badge to yourself' });
        }

        // Check if badge type exists and is active
        const badgeType = await prisma.badgeType.findUnique({
            where: { id: badgeTypeId, isActive: true }
        });

        if (!badgeType) {
            return res.status(400).json({ error: 'Invalid or inactive badge type' });
        }

        const badge = await prisma.badge.upsert({
            where: {
                giverId_receiverId_badgeTypeId: {
                    giverId,
                    receiverId,
                    badgeTypeId
                }
            },
            update: {},
            create: {
                giverId,
                receiverId,
                badgeTypeId
            }
        });

        // Create notification for badge
        await prisma.notification.create({
            data: {
                type: 'BADGE',
                recipientId: receiverId,
                senderId: giverId,
                relatedId: badge.id,
                content: `te deu um selo de ${badgeType.name.toLowerCase()}`
            }
        }).catch((err: any) => console.error('Failed to create badge notification', err));

        res.status(201).json(badge);
    } catch (error) {
        console.error('Error giving badge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get badge counts for a user
router.get('/badges/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId; // Will be available if using optionalAuthMiddleware
        
        // Find all badges for user and include badge type info
        const badges = await prisma.badge.findMany({
            where: { receiverId: userId },
            include: {
                badgeType: true
            }
        });

        // Aggregate counts by badge type
        const aggregates: Record<string, { typeId: string, name: string, icon: string, color: string, count: number, isGivenByMe: boolean }> = {};
        
        badges.forEach(b => {
            if (!aggregates[b.badgeTypeId]) {
                aggregates[b.badgeTypeId] = {
                    typeId: b.badgeTypeId,
                    name: b.badgeType.name,
                    icon: b.badgeType.icon,
                    color: b.badgeType.color,
                    count: 0,
                    isGivenByMe: false
                };
            }
            aggregates[b.badgeTypeId].count++;
            if (currentUserId && b.giverId === currentUserId) {
                aggregates[b.badgeTypeId].isGivenByMe = true;
            }
        });

        res.json(Object.values(aggregates));
    } catch (error) {
        console.error('Error getting badges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove a badge
router.delete('/badge/:receiverId/:badgeTypeId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { receiverId, badgeTypeId } = req.params;
        const giverId = req.userId!;

        const deleted = await prisma.badge.deleteMany({
            where: {
                giverId,
                receiverId,
                badgeTypeId
            }
        });

        res.json({ message: 'Badge removed', deletedCount: deleted.count });
    } catch (error) {
        console.error('Error removing badge:', error);
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

// --- Friendship (Amizades) ---

// Send friend request
router.post('/friend-request/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const senderId = req.userId!;
        const receiverId = req.params.id;

        if (senderId === receiverId) {
            return res.status(400).json({ error: 'Você não pode ser amigo de si mesmo' });
        }

        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (!receiver) return res.status(404).json({ error: 'Usuário não encontrado' });

        if (receiver.role === 'ESCOLA') {
            return res.status(400).json({ error: 'Unidades e Escolas recebem seguidores, não solicitações de amizade' });
        }

        // Check if already friends or pending
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') return res.status(400).json({ error: 'Vocês já são amigos' });
            if (existing.status === 'PENDING') return res.status(400).json({ error: 'Solicitação já pendente' });
            
            // If REJECTED, allow resending by updating status
            const updated = await prisma.friendship.update({
                where: { id: existing.id },
                data: { status: 'PENDING', senderId, receiverId } // Reverse if needed
            });
            return res.status(201).json(updated);
        }

        const friendship = await prisma.friendship.create({
            data: {
                senderId,
                receiverId,
                status: 'PENDING'
            }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                type: 'FRIEND_REQUEST',
                recipientId: receiverId,
                senderId: senderId,
                relatedId: friendship.id,
                content: 'te enviou uma solicitação de amizade'
            }
        }).catch(err => console.error('Failed to create friend notification', err));

        res.status(201).json(friendship);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao processar pedido' });
    }
});

// Update friend request status (Accept/Reject)
router.put('/friend-request/:id/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status } = req.body; // 'ACCEPTED' | 'REJECTED'
        const userId = req.userId!;
        const friendshipId = req.params.id;

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship || friendship.receiverId !== userId) {
            return res.status(403).json({ error: 'Ação não permitida ou pedido não encontrado' });
        }

        const updated = await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status }
        });

        if (status === 'ACCEPTED') {
            // Create notification for acceptance
            await prisma.notification.create({
                data: {
                    type: 'FRIEND_REQUEST',
                    recipientId: friendship.senderId,
                    senderId: userId,
                    relatedId: friendship.id,
                    content: 'aceitou sua solicitação de amizade'
                }
            }).catch(err => console.error('Failed notification', err));
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar amizade' });
    }
});

// Get pending requests
router.get('/friend-requests/pending', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const pending = await prisma.friendship.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true, role: true, school: true }
                }
            }
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
});

// Get friends of a user
router.get('/friends/:userId', async (req, res: Response) => {
    try {
        const { userId } = req.params;
        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true, role: true, school: true }
                },
                receiver: {
                    select: { id: true, name: true, avatar: true, role: true, school: true }
                }
            }
        });

        const friends = friendships.map((f: any) => f.senderId === userId ? f.receiver : f.sender);
        res.json(friends);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar amigos' });
    }
});

// Remove friend
router.delete('/friend/:friendId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const friendId = req.params.friendId;

        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            }
        });

        res.json({ message: 'Amizade removida' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover amizade' });
    }
});

export default router;
