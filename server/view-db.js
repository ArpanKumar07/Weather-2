import { db } from './src/config/db.js';

async function displayDatabase() {
  console.log('================================================================');
  console.log('       MAUSAM360 - LIVE DATABASE INSPECTION (Lab 03 ER Schema)  ');
  console.log('================================================================\n');

  await db.init();

  console.log('👤 [1] USERS TABLE (`users`):');
  const users = await db.query(
    "SELECT user_id, username, email, (SUBSTR(password_hash, 1, 22) || '...') AS bcrypt_hash, created_at FROM users"
  );
  if (users.length === 0) console.log('  (No users registered yet)');
  else console.table(users);

  console.log('\n📍 [2] LOCATIONS TABLE (`locations`):');
  const locations = await db.query(
    'SELECT location_id, city_name, country_code, latitude, longitude, created_at FROM locations LIMIT 10'
  );
  if (locations.length === 0) console.log('  (No locations cached yet)');
  else console.table(locations);

  console.log('\n⭐ [3] FAVOURITE LOCATIONS JUNCTION TABLE (`favourite_locations`):');
  const favorites = await db.query(`
    SELECT 
      fl.user_id,
      u.username,
      fl.location_id,
      l.city_name,
      l.country_code,
      fl.saved_at
    FROM favourite_locations fl
    JOIN users u ON fl.user_id = u.user_id
    JOIN locations l ON fl.location_id = l.location_id
    ORDER BY fl.saved_at DESC
  `);
  if (favorites.length === 0) console.log('  (No favorites saved yet)');
  else console.table(favorites);

  console.log('\n🌤️ [4] WEATHER REPORTS HISTORY TABLE (`weather_reports`):');
  const reports = await db.query(`
    SELECT 
      wr.report_id,
      l.city_name,
      (wr.temperature || ' °C') AS temp,
      (wr.humidity || ' %') AS humidity,
      (wr.wind_speed || ' km/h') AS wind,
      wr.condition_text,
      wr.recorded_at
    FROM weather_reports wr
    JOIN locations l ON wr.location_id = l.location_id
    ORDER BY wr.recorded_at DESC
    LIMIT 10
  `);
  if (reports.length === 0) console.log('  (No reports recorded yet)');
  else console.table(reports);

  console.log('\n================================================================');
  console.log(' Physical DB File: ' + (db.isMySQL ? 'MySQL Server Database' : 'server/mausam360.db'));
  console.log(' Schema Specification: server/schema.sql (Lab 03 ER Schema)');
  console.log('================================================================\n');

  process.exit(0);
}

displayDatabase().catch((err) => {
  console.error('Inspection error:', err);
  process.exit(1);
});
