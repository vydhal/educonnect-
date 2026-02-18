
import { Router, Response, Request } from 'express';
import { prisma } from '../server.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../middleware/errorHandler.js';

const router = Router();

// Get Public Settings (No Auth Required)
router.get('/', async (req: Request, res: Response) => {
    try {
        const settings = await prisma.systemSettings.findMany({
            where: {
                key: { in: ['APP_NAME', 'PRIMARY_COLOR', 'LOGO_URL', 'FAVICON_URL'] }
            }
        });

        const settingsMap = settings.reduce((acc, curr) => ({
            ...acc,
            [curr.key]: curr.value
        }), {});

        res.json(settingsMap);
    } catch (error) {
        console.error('Error fetching public settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Settings (Admin Only) - Moved logic here or keep in admin.routes?
// Let's keep specific setting updates here for consistency if we want, 
// but admin.routes.ts already has it. We can leave the admin update there or move it.
// For now, let's keep admin.routes.ts as the "admin panel" API, 
// and this one purely for "consuming" settings widely.
// But valid to have settings management here too. 
// Let's rely on admin.routes for updates for now to avoid duplication, 
// or maybe specific public endpoints here.

export default router;
