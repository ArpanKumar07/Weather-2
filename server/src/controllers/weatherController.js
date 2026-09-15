import { fetchFullWeather, searchCities } from '../services/weatherService.js';
import { generateWeatherAdvice } from '../services/adviceService.js';
import { getRecommendedActivities } from '../services/activityService.js';
import { db } from '../config/db.js';

/**
 * GET /api/weather/current
 * Validates lat/lon; returns 400 Bad Request if missing/invalid (Lab 4 Contract Test W-01)
 */
export async function getCurrentWeather(req, res) {
  try {
    const { lat, lon, city, country } = req.query;

    if (lat === undefined || lon === undefined || isNaN(Number(lat)) || isNaN(Number(lon))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid query parameters lat (decimal) and lon (decimal) are required.',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude must be between -90 and 90, and longitude between -180 and 180.',
      });
    }

    const weatherData = await fetchFullWeather(latitude, longitude, city, country);
    const advice = generateWeatherAdvice(weatherData);
    const activities = getRecommendedActivities(weatherData.city_name, weatherData);

    // Matches Lab 3/4 API Contract fields exactly, plus enriched payload for rich UI
    return res.status(200).json({
      city_name: weatherData.city_name,
      country_code: weatherData.country_code,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      wind_speed: weatherData.wind_speed,
      condition_text: weatherData.condition_text,
      recorded_at: weatherData.recorded_at,
      location_id: weatherData.location_id,
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      feels_like: weatherData.feels_like,
      pressure: weatherData.pressure,
      precipitation: weatherData.precipitation,
      weather_icon: weatherData.weather_icon,
      weather_group: weatherData.weather_group,
      weather_code: weatherData.weather_code,
      uv_index: weatherData.uv_index,
      hourly: weatherData.hourly,
      daily: weatherData.daily,
      advice,
      activities,
    });
  } catch (err) {
    console.error('getCurrentWeather error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve current weather data.' });
  }
}

/**
 * GET /api/weather/history
 * Query params: location_id, duration_hours
 * Returns 404 Not Found if location_id does not exist (Lab 4 Contract Test W-02)
 */
export async function getWeatherHistory(req, res) {
  try {
    const { location_id, duration_hours } = req.query;

    if (!location_id || isNaN(Number(location_id))) {
      return res.status(400).json({ error: 'Valid location_id query parameter is required.' });
    }

    const locId = parseInt(location_id, 10);
    const hours = duration_hours ? parseInt(duration_hours, 10) : 24;

    // Check location existence
    const location = await db.get('SELECT * FROM locations WHERE location_id = ? LIMIT 1', [locId]);

    if (!location) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Location with ID ${locId} does not exist in the system records.`,
      });
    }

    const reports = await db.query(
      `SELECT recorded_at, temperature, humidity, condition_text
       FROM weather_reports
       WHERE location_id = ?
       ORDER BY recorded_at DESC
       LIMIT ?`,
      [locId, Math.max(1, Math.min(hours, 100))]
    );

    return res.status(200).json(reports);
  } catch (err) {
    console.error('getWeatherHistory error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve weather history.' });
  }
}

/**
 * GET /api/weather/search
 * Autocomplete / city query
 */
export async function handleSearchCities(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(200).json([]);
    }

    const results = await searchCities(q);
    return res.status(200).json(results);
  } catch (err) {
    console.error('searchCities error:', err.message);
    return res.status(500).json({ error: 'Failed to search cities.' });
  }
}

/**
 * GET /api/weather/activities
 */
export async function handleGetActivities(req, res) {
  try {
    const { city, temp, condition, rain } = req.query;
    const weatherMock = {
      temperature: temp ? parseFloat(temp) : 25,
      condition_text: condition || 'Clear',
      weather_group: rain === 'true' ? 'rain' : 'clear',
      precipitation: rain === 'true' ? 2 : 0,
    };

    const activities = getRecommendedActivities(city || 'Local', weatherMock);
    return res.status(200).json(activities);
  } catch (err) {
    console.error('handleGetActivities error:', err.message);
    return res.status(500).json({ error: 'Failed to generate activities.' });
  }
}
