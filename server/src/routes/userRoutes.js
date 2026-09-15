import { Router } from 'express';
import { addFavorite, getFavorites, removeFavorite } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Lab 3 & Lab 4 Favorites Endpoints (Protected by JWT)
router.post('/favorites', authenticateToken, addFavorite);
router.get('/favorites', authenticateToken, getFavorites);
router.delete('/favorites/:location_id', authenticateToken, removeFavorite);

export default router;
