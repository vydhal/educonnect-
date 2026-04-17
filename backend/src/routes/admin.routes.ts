
import { Router, Response, Request } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';
import { hashPassword } from '../utils/auth.js';

const router = Router();

// Get dashboard statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [
            usersCount,
            postsCount,
            pendingModerationCount,
            likesCount,
            commentsCount
        ] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.moderationItem.count({
                where: { status: 'PENDENTE' }
            }),
            prisma.like.count(),
            prisma.comment.count()
        ]);

        const totalInteractions = likesCount + commentsCount;
        const totalBadges = await prisma.badge.count();

        // Get top 5 users with most badges received
        const topUsersWithBadges = await prisma.badge.groupBy({
            by: ['receiverId'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 5
        });

        // Get details for these users
        const topRankedUsers = await Promise.all(
            topUsersWithBadges.map(async (item) => {
                const user = await prisma.user.findUnique({
                    where: { id: item.receiverId },
                    select: { name: true, avatar: true, school: true, worksAt: { select: { name: true } } }
                });
                return {
                    id: item.receiverId,
                    name: user?.name || 'Desconhecido',
                    avatar: user?.avatar,
                    school: user?.worksAt?.name || user?.school || 'Sem unidade',
                    badgesCount: item._count.id
                };
            })
        );

        res.json({
            users: { total: usersCount, trend: '+12%' },
            posts: { total: postsCount, trend: '+5.4%' },
            interactions: { total: totalInteractions, trend: '+8%' },
            moderation: { pending: pendingModerationCount, trend: pendingModerationCount > 0 ? '+1' : '0' },
            badges: {
                total: totalBadges,
                topUsers: topRankedUsers
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Settings Endpoints
router.get('/settings', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const settings = await prisma.systemSettings.findMany();
        const settingsMap = settings.reduce((acc: Record<string, any>, curr) => ({
            ...acc,
            [curr.key]: curr.value
        }), {});
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/settings', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const settings = req.body;
        await Promise.all(
            Object.entries(settings).map(([key, value]) =>
                prisma.systemSettings.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) }
                })
            )
        );
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Management Endpoints
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const role = req.query.role as string;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { school: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) {
            where.role = role.toUpperCase();
        }

        const [usersRaw, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: { 
                    id: true, 
                    name: true, 
                    email: true, 
                    role: true, 
                    school: true,
                    schoolId: true,
                    createdAt: true, 
                    avatar: true,
                    worksAt: { select: { name: true } },
                    memberOfSchools: { select: { id: true, name: true } }
                }
            }),
            prisma.user.count({ where })
        ]);

        const users = usersRaw.map(u => {
            // Join all member schools names if they exist, otherwise fallback to primary school
            const multiSchools = u.memberOfSchools && u.memberOfSchools.length > 0 
                ? u.memberOfSchools.map(s => s.name).join(', ')
                : null;

            return {
                ...u,
                school: multiSchools || u.worksAt?.name || u.school
            };
        });

        res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/users', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, email, password, role, school, schoolId } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await hashPassword(password);
        const newUser = await prisma.user.create({
            data: {
                name, email,
                password: hashedPassword,
                role: role ? role.toUpperCase() : 'ALUNO',
                school, schoolId: schoolId || null,
                verified: true
            }
        });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, email, role, school, schoolId, inep, zone, address, phone, schoolType } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                name, email,
                role: role ? role.toUpperCase() : undefined,
                school, 
                schoolId: schoolId || (schoolId === null ? null : undefined),
                inep,
                zone,
                address,
                phone,
                schoolType
            }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reports Endpoints
router.get('/reports', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { days = '180', schoolId } = req.query;
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - Number(days));

        // Base filters
        const userWhere: any = { createdAt: { gte: startDate } };
        const postWhere: any = { createdAt: { gte: startDate } };

        if (schoolId) {
            userWhere.schoolId = String(schoolId);
            postWhere.author = { schoolId: String(schoolId) };
        }

        const [users, posts] = await Promise.all([
            prisma.user.findMany({ 
                where: userWhere, 
                select: { createdAt: true } 
            }),
            prisma.post.findMany({ 
                where: postWhere, 
                select: { createdAt: true } 
            })
        ]);

        // Helper to format month name
        const getMonthName = (date: Date) => date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        
        // Dynamic time bins
        const lastMonths: { name: string, month: number, year: number, users: number, posts: number }[] = [];
        const numMonths = Math.ceil(Number(days) / 30);
        
        for (let i = numMonths - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            lastMonths.push({ name: getMonthName(d), month: d.getMonth(), year: d.getFullYear(), users: 0, posts: 0 });
        }

        users.forEach(u => {
            const found = lastMonths.find(l => l.month === u.createdAt.getMonth() && l.year === u.createdAt.getFullYear());
            if (found) found.users++;
        });

        posts.forEach(p => {
            const found = lastMonths.find(l => l.month === p.createdAt.getMonth() && l.year === p.createdAt.getFullYear());
            if (found) found.posts++;
        });

        // Engagement ranking - Use explicit include to help TS
        const postsWithEngagement = await prisma.post.findMany({
            where: postWhere,
            include: {
                author: { select: { school: true, worksAt: { select: { name: true } } } },
                _count: { select: { likes: true, comments: true } }
            }
        });

        const engagementByUnit: Record<string, { name: string, engagement: number, posts: number }> = {};
        postsWithEngagement.forEach(post => {
            const unitName = post.author?.worksAt?.name || post.author?.school || 'Sem Unidade';
            if (!engagementByUnit[unitName]) engagementByUnit[unitName] = { name: unitName, engagement: 0, posts: 0 };
            engagementByUnit[unitName].engagement += (post._count?.likes || 0) + (post._count?.comments || 0);
            engagementByUnit[unitName].posts += 1;
        });

        const sortedUnits = Object.values(engagementByUnit).sort((a, b) => b.engagement - a.engagement).slice(0, 5);
        
        const topPosts = postsWithEngagement.map(p => ({
            id: p.id,
            author: p.author?.worksAt?.name || p.author?.school || 'Usuário',
            label: p.content.substring(0, 50) + (p.content.length > 50 ? '...' : ''),
            val: (p._count?.likes || 0) + (p._count?.comments || 0),
            icon: 'analytics'
        })).sort((a, b) => b.val - a.val).slice(0, 5);

        const allTags = postsWithEngagement.flatMap(p => p.tags || []);
        const tagCounts: Record<string, number> = {};
        allTags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
        const topTags = Object.entries(tagCounts).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count).slice(0, 8);

        res.json({ growth: lastMonths, unitEngagement: sortedUnits, topPosts, topTags });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export Reports CSV
router.get('/reports/export', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { days = '180', schoolId } = req.query;
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - Number(days));

        const userWhere: any = { createdAt: { gte: startDate } };
        const postWhere: any = { createdAt: { gte: startDate } };
        if (schoolId) {
            userWhere.schoolId = String(schoolId);
            postWhere.author = { schoolId: String(schoolId) };
        }

        const [usersCount, postsCount] = await Promise.all([
            prisma.user.count({ where: userWhere }),
            prisma.post.count({ where: postWhere })
        ]);

        let csvContent = '\ufeff'; // UTF-8 BOM
        csvContent += 'EduConnect CG - Relatório de Desempenho Administrativo\n';
        csvContent += `Filtro:;${schoolId ? 'Unidade Específica' : 'Todas as Unidades'}\n`;
        csvContent += `Período:;Últimos ${days} dias\n`;
        csvContent += `Data de Exportação:;${new Date().toLocaleString('pt-BR')}\n\n`;
        
        csvContent += 'MÉTRICAS NO PERÍODO\n';
        csvContent += 'Métrica;Valor\n';
        csvContent += `Novos Usuários;${usersCount}\n`;
        csvContent += `Novas Postagens;${postsCount}\n\n`;

        // Ranking units / Detail for specific unit
        const postsWithEngagement = await prisma.post.findMany({
            where: postWhere,
            include: {
                author: { select: { school: true, worksAt: { select: { name: true } } } },
                _count: { select: { likes: true, comments: true } }
            }
        });

        const engagementByUnit: Record<string, { engagement: number, posts: number }> = {};
        postsWithEngagement.forEach(post => {
            const unitName = post.author?.worksAt?.name || post.author?.school || 'Sem Unidade';
            if (!engagementByUnit[unitName]) engagementByUnit[unitName] = { engagement: 0, posts: 0 };
            engagementByUnit[unitName].engagement += (post._count?.likes || 0) + (post._count?.comments || 0);
            engagementByUnit[unitName].posts += 1;
        });

        csvContent += 'ENGAJAMENTO POR UNIDADE\n';
        csvContent += 'Unidade;Postagens;Interações\n';
        Object.entries(engagementByUnit).sort((a, b) => b[1].engagement - a[1].engagement).forEach(([name, data]) => {
            csvContent += `"${name}";${data.posts};${data.engagement}\n`;
        });

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', 'attachment; filename="relatorio_educonnect.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- School Management Routes ---

// Get Schools (with filters)
router.get('/schools', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { page = 1, limit = 10, search, zone } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = { role: 'ESCOLA' };

        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { inep: { contains: String(search) } }
            ];
        }

        if (zone) {
            where.zone = zone;
        }

        const [schools, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    school: true, // This is the 'school name' field in User, but for Role=ESCOLA it is the name itself usually.
                    role: true,
                    avatar: true,
                    inep: true,
                    zone: true,
                    address: true,
                    phone: true,
                    schoolType: true,
                    verified: true
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            schools,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create School
router.post('/schools', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, email, password, inep, zone, address, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newSchool = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'ESCOLA',
                inep,
                zone,
                address,
                phone,
                schoolType: req.body.schoolType, // Add schoolType
                verified: true // Schools created by admin are verified
            }
        });

        res.status(201).json(newSchool);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Import Schools
router.post('/schools/import', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { schools } = req.body; // Array of school objects

        if (!Array.isArray(schools)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        let importedCount = 0;
        const errors: any[] = [];

        for (const item of schools) {
            try {
                // Basic validation
                if (!item.name || !item.email) {
                    errors.push({ item, error: 'Missing name or email' });
                    continue;
                }

                const existing = await prisma.user.findUnique({ where: { email: item.email } });
                if (existing) {
                    // Update existing? Or skip. For now, skip or log.
                    errors.push({ item, error: 'Email already exists' });
                    continue;
                }

                const hashedPassword = await hashPassword(item.password || 'muda1234'); // Default password

                await prisma.user.create({
                    data: {
                        name: item.name,
                        email: item.email,
                        role: 'ESCOLA',
                        inep: item.inep ? String(item.inep) : null,
                        zone: item.zone,
                        address: item.address,
                        phone: item.phone,
                        verified: true,
                        password: hashedPassword
                    }
                });
                importedCount++;
            } catch (err: any) {
                errors.push({ item, error: err.message });
            }
        }

        res.json({ message: 'Import processed', imported: importedCount, errors });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download School Import Template
router.get('/schools/template', (_req, res) => {
    const csvHeader = 'Name,Email,INEP,Zone,SchoolType,Address,Phone,Password\n';
    const csvExample = 'EMEF Exemplo,contato@exemplo.edu.br,12345678,URBANA,ESCOLA,"Rua Exemplo, 123",83999999999,muda1234\n';

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="modelo_importacao_escolas.csv"');
    res.send(csvHeader + csvExample);
});

export default router;
