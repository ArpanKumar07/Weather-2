import { Router } from 'express';
import { handleChatMessage } from './chatController.js';

const router = Router();

router.post('/', handleChatMessage);

export default router;
