import { Router } from 'express';
import {
  getCurrentWeather,
  getWeatherHistory,
  handleSearchCities,
  handleGetActivities,
} from '../controllers/weatherController.js';

const router = Router();

// Lab 3 & Lab 4 Endpoints
router.get('/current', getCurrentWeather);
router.get('/history', getWeatherHistory);
router.get('/search', handleSearchCities);
router.get('/activities', handleGetActivities);

export default router;
