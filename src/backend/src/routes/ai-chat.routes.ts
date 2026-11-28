import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.middleware';
import {
  aiChatRateLimiter,
  aiWelcomeRateLimiter,
} from '../middlewares/ai-chat-rate-limit.middleware';
import { getMetrics, getWelcome, postMessage } from '../controllers/ai-chat.controller';

const router = Router();

router.get('/welcome', optionalAuthenticate, aiWelcomeRateLimiter, getWelcome);
router.post('/message', optionalAuthenticate, aiChatRateLimiter, postMessage);
router.get('/metrics', authenticate, authorize('ADMIN', 'MANAGER'), getMetrics);

export default router;
