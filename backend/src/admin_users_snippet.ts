
// ... (previous code)

// User Management Endpoints

// Get all users (with pagination and search)
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
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) {
            where.role = role.toUpperCase();
        }

        const [users, total] = await Promise.all([
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
                    createdAt: true,
                    avatar: true
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create User (Admin)
router.post('/users', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    // Reuse logic from auth.register or call it
    // Implementation needed
    // For now skipping to keep it short as Register exists
    res.status(501).json({ error: 'Not implemented' });
});

// Update User
router.put('/users/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, email, role, school } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name, email, role, school }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete User
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
