import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mausam360_super_secret_jwt_key_2026';

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields (username, email, password) are required.' });
    }

    // Check existing
    const existing = await db.get(
      'SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing) {
      return res.status(400).json({ error: 'Username or email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ user_id: userId, username: username.trim(), email: email.trim().toLowerCase() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        user_id: userId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to register user.' });
  }
}

export async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [emailOrUsername.trim(), emailOrUsername.trim().toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to process login.' });
  }
}

export async function getMe(req, res) {
  try {
    const user = await db.get(
      'SELECT user_id, username, email, created_at FROM users WHERE user_id = ? LIMIT 1',
      [req.user.user_id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}
