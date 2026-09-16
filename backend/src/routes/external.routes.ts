import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { getEngagementAnalytics } from '../controllers/externalAnalytics.controller.js';

const router = Router();

// Endpoint seguro para o EduCampina
router.get('/analytics/engagement', requireApiKey, getEngagementAnalytics);

export default router;
