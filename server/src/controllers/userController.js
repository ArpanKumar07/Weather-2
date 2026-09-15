import { db } from '../config/db.js';

/**
 * POST /api/users/favorites
 * Auth: Registered user
 * Body: { "location_id": integer }
 * Fulfills Lab 3 & Lab 4 Contract Test W-03
 */
export async function addFavorite(req, res) {
  try {
    const userId = req.user.user_id;
    const { location_id } = req.body;

    if (!location_id || isNaN(Number(location_id))) {
      return res.status(400).json({ error: 'Valid location_id is required in request body.' });
    }

    const locId = parseInt(location_id, 10);

    // Verify location exists
    const location = await db.get('SELECT * FROM locations WHERE location_id = ? LIMIT 1', [locId]);
    if (!location) {
      return res.status(404).json({ error: 'Location not found.' });
    }

    // Check for duplicate favorite (Lab 3 Gap 2 resolution: returns 409 Conflict)
    const existing = await db.get(
      'SELECT * FROM favourite_locations WHERE user_id = ? AND location_id = ? LIMIT 1',
      [userId, locId]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This location is already saved in your favorites list.',
      });
    }

    const savedAt = new Date().toISOString();
    await db.run(
      'INSERT INTO favourite_locations (user_id, location_id, saved_at) VALUES (?, ?, ?)',
      [userId, locId, savedAt]
    );

    // Matches Lab 4 Contract Test expectation:
    // Status 201 Created or 200 OK. Response: { "status": "success", "favorite_added": 12, "saved_at": "<timestamp>" }
    return res.status(201).json({
      status: 'success',
      favorite_added: locId,
      saved_at: savedAt,
    });
  } catch (err) {
    console.error('addFavorite error:', err);
    return res.status(500).json({ error: 'Failed to add favorite location.' });
  }
}

/**
 * GET /api/users/favorites
 * Auth: Registered user
 * Fulfills Lab 3 & Lab 4 Contract Test W-04:
 * Returns Array of: [ { location_id, city_name, country_code, current_temp } ]
 * (Resolving Lab 3 Gap 1: joins Favorite_Location with Location and newest Weather_Report)
 */
export async function getFavorites(req, res) {
  try {
    const userId = req.user.user_id;

    // Join favourite_locations with locations and latest weather report temperature
    const favorites = await db.query(
      `SELECT 
         l.location_id,
         l.city_name,
         l.country_code,
         l.latitude,
         l.longitude,
         COALESCE(
           (SELECT wr.temperature 
            FROM weather_reports wr 
            WHERE wr.location_id = l.location_id 
            ORDER BY wr.recorded_at DESC 
            LIMIT 1), 
           24.0
         ) AS current_temp
       FROM favourite_locations fl
       JOIN locations l ON fl.location_id = l.location_id
       WHERE fl.user_id = ?
       ORDER BY fl.saved_at DESC`,
      [userId]
    );

    // Format current_temp to number or rounded float
    const formatted = favorites.map((item) => ({
      location_id: item.location_id,
      city_name: item.city_name,
      country_code: item.country_code,
      latitude: item.latitude,
      longitude: item.longitude,
      current_temp: Number(item.current_temp),
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('getFavorites error:', err);
    return res.status(500).json({ error: 'Failed to fetch user favorites.' });
  }
}

/**
 * DELETE /api/users/favorites/:location_id
 * Auth: Registered user
 */
export async function removeFavorite(req, res) {
  try {
    const userId = req.user.user_id;
    const { location_id } = req.params;

    if (!location_id) {
      return res.status(400).json({ error: 'location_id parameter is required.' });
    }

    const locId = parseInt(location_id, 10);
    await db.run('DELETE FROM favourite_locations WHERE user_id = ? AND location_id = ?', [
      userId,
      locId,
    ]);

    return res.status(200).json({
      status: 'success',
      message: `Location ${locId} removed from favorites.`,
    });
  } catch (err) {
    console.error('removeFavorite error:', err);
    return res.status(500).json({ error: 'Failed to remove favorite location.' });
  }
}
