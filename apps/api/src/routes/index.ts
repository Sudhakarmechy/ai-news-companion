import { Router } from 'express';
import { getFeed, getReels } from '../controllers/feedController';
import { getPreferences, putPreferences } from '../controllers/preferencesController';
import { getMonetizationPolicy } from '../controllers/subscriptionController';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ ok: true }));
apiRouter.get('/feed', getFeed);
apiRouter.get('/reels', getReels);
apiRouter.get('/preferences', getPreferences);
apiRouter.put('/preferences', putPreferences);
apiRouter.get('/monetization', getMonetizationPolicy);
