import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbClientType = process.env.DB_TYPE || 'sqlite';
let sqliteDb = null;
let mysqlPool = null;

// Database Adapter Interface
export const db = {
  isMySQL: false,

  async init() {
    if (dbClientType === 'mysql') {
      try {
        const mysql = await import('mysql2/promise');
        mysqlPool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306', 10),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'mausam360_db',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });

        // Test connection
        await mysqlPool.query('SELECT 1');
        this.isMySQL = true;
        console.log('✅ Connected to MySQL Database');
        await this.initMySQLSchema();
        return;
      } catch (err) {
        console.warn('⚠️ MySQL connection failed, falling back to embedded SQLite:', err.message);
        this.isMySQL = false;
        dbClientType = 'sqlite';
      }
    }

    // Native Node.js 24 SQLite setup
    try {
      const { DatabaseSync } = await import('node:sqlite');
      const dbPath = path.resolve(__dirname, '../../mausam360.db');
      sqliteDb = new DatabaseSync(dbPath);
      this.isMySQL = false;
      console.log(`✅ Connected to SQLite Database (${dbPath})`);
      this.initSQLiteSchema();
    } catch (err) {
      console.error('❌ Failed to initialize database:', err);
      throw err;
    }
  },

  initSQLiteSchema() {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS locations (
        location_id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_name TEXT NOT NULL,
        country_code TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(city_name, country_code)
      );

      CREATE TABLE IF NOT EXISTS weather_reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperature REAL NOT NULL,
        humidity INTEGER NOT NULL,
        wind_speed REAL NOT NULL,
        condition_text TEXT NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        location_id INTEGER NOT NULL,
        FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS favourite_locations (
        user_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, location_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
      );
    `);
    console.log('✅ SQLite Schema initialized according to Lab 3 specifications');
  },

  async initMySQLSchema() {
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        location_id INT AUTO_INCREMENT PRIMARY KEY,
        city_name VARCHAR(100) NOT NULL,
        country_code VARCHAR(10) NOT NULL,
        latitude DECIMAL(9, 6) NOT NULL,
        longitude DECIMAL(9, 6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_city_country (city_name, country_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS weather_reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        temperature DECIMAL(5, 2) NOT NULL,
        humidity INT NOT NULL,
        wind_speed DECIMAL(5, 2) NOT NULL,
        condition_text VARCHAR(100) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        location_id INT NOT NULL,
        FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS favourite_locations (
        user_id INT NOT NULL,
        location_id INT NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, location_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ MySQL Schema verified according to Lab 3 specifications');
  },

  async query(sql, params = []) {
    if (this.isMySQL) {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    } else {
      const stmt = sqliteDb.prepare(sql);
      return stmt.all(...params);
    }
  },

  async get(sql, params = []) {
    if (this.isMySQL) {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows[0] || null;
    } else {
      const stmt = sqliteDb.prepare(sql);
      return stmt.get(...params) || null;
    }
  },

  async run(sql, params = []) {
    if (this.isMySQL) {
      const [result] = await mysqlPool.execute(sql, params);
      return { lastInsertRowid: result.insertId, changes: result.affectedRows };
    } else {
      const stmt = sqliteDb.prepare(sql);
      const result = stmt.run(...params);
      return { lastInsertRowid: Number(result.lastInsertRowid), changes: Number(result.changes) };
    }
  }
};
