import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import { aiChatRateLimiter } from '../middlewares/ai-chat-rate-limit.middleware';
import { getWelcome, postMessage } from '../controllers/ai-chat.controller';

const router = Router();

router.get('/welcome', optionalAuthenticate, getWelcome);
router.post('/message', optionalAuthenticate, aiChatRateLimiter, postMessage);

export default router;
