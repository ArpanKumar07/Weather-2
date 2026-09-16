import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mausam360_super_secret_jwt_key_2026';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure user exists in database (handles Render ephemeral SQLite restarts)
    let user = await db.get('SELECT user_id, username, email FROM users WHERE user_id = ? LIMIT 1', [decoded.user_id]);
    if (!user && decoded.username) {
      const existingByName = await db.get('SELECT user_id, username, email FROM users WHERE username = ? LIMIT 1', [decoded.username]);
      if (existingByName) {
        user = existingByName;
      } else {
        try {
          await db.run(
            'INSERT INTO users (user_id, username, email, password_hash) VALUES (?, ?, ?, ?)',
            [decoded.user_id, decoded.username, decoded.email || `${decoded.username}@mausam360.local`, 'RESTORED_SESSION']
          );
          user = { user_id: decoded.user_id, username: decoded.username, email: decoded.email };
        } catch {
          user = await db.get('SELECT user_id, username, email FROM users WHERE username = ? LIMIT 1', [decoded.username]);
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session user not found. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token.',
    });
  }
}
