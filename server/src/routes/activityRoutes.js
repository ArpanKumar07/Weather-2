import express from 'express';
import {
  createActivity,
  suggestAndMoveActivity,
} from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, createActivity);

router.post(
  '/:id/reschedule',
  authenticateToken,
  suggestAndMoveActivity
);

export default router;
