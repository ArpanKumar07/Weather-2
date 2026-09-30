import { db } from '../config/db.js';
import { fetchFullWeather } from '../services/weatherService.js';

export async function createActivity(req, res) {
  try {
    const {
      title,
      activity_type,
      scheduled_at,
      indoor = false,
      latitude,
      longitude,
      city_name = null,
    } = req.body;

    if (
      !title ||
      !activity_type ||
      !scheduled_at ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        error: 'Missing required activity fields.',
      });
    }

    const result = await db.run(
      `INSERT INTO activities
       (user_id, title, activity_type, scheduled_at, indoor, latitude, longitude, city_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        title,
        activity_type,
        scheduled_at,
        indoor ? 1 : 0,
        Number(latitude),
        Number(longitude),
        city_name,
      ]
    );

    const activity = await db.get(
      `SELECT * FROM activities
       WHERE activity_id = ? AND user_id = ?`,
      [result.lastInsertRowid, req.user.user_id]
    );

    return res.status(201).json({
      message: 'Activity scheduled successfully.',
      activity,
    });
  } catch (err) {
    console.error('Create activity error:', err);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function suggestAndMoveActivity(req, res) {
  try {
    const activityId = Number(req.params.id);

    const activity = await db.get(
      `SELECT *
       FROM activities
       WHERE activity_id = ? AND user_id = ?`,
      [activityId, req.user.user_id]
    );

    if (!activity) {
      return res.status(404).json({
        error: 'Activity not found.',
      });
    }

    // WA-06 state-machine constraint
    if (activity.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot reschedule completed activity',
      });
    }

    if (activity.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cannot reschedule cancelled activity',
      });
    }

    if (Number(activity.indoor) === 1) {
      return res.status(400).json({
        error: 'Only outdoor activities can be rescheduled by weather.',
      });
    }

    const weather = await fetchFullWeather(
      activity.latitude,
      activity.longitude,
      activity.city_name
    );

    const hourly = weather.hourly || [];

    // Find the first future slot with rain probability < 20%.
    const now = Date.now();

    const goodSlot = hourly.find((slot) => {
      const slotTime = new Date(slot.time).getTime();

      return (
        Number.isFinite(slotTime) &&
        slotTime > now &&
        Number(slot.precipitation_prob ?? 100) < 20
      );
    });

    if (!goodSlot) {
      return res.status(404).json({
        error: 'No suitable weather slot found.',
      });
    }

    const oldScheduledAt = activity.scheduled_at;

    await db.run(
      `UPDATE activities
       SET scheduled_at = ?
       WHERE activity_id = ? AND user_id = ?`,
      [
        goodSlot.time,
        activityId,
        req.user.user_id,
      ]
    );

    const updatedActivity = await db.get(
      `SELECT *
       FROM activities
       WHERE activity_id = ? AND user_id = ?`,
      [activityId, req.user.user_id]
    );

    return res.status(200).json({
      message: 'Activity rescheduled successfully.',
      previous_time: oldScheduledAt,
      new_time: goodSlot.time,
      rain_probability: Number(goodSlot.precipitation_prob),
      activity: updatedActivity,
    });
  } catch (err) {
    console.error('Suggest & Move error:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
