import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/db.js';

test('MAUSAM360 - Lab 4 Exercise C2 Contract Test Suite', async (t) => {
  // Ensure DB is initialized
  await db.init();

  let authToken = '';
  let testUserId = null;
  let testLocationId = null;

  await t.test('Setup test user & location', async () => {
    const unique = Date.now();
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testuser_${unique}`,
        email: `test_${unique}@infinite-loop.org`,
        password: 'password123',
      });

    assert.equal(regRes.status, 201);
    authToken = regRes.body.token;
    testUserId = regRes.body.user.user_id;
    assert.ok(authToken, 'Auth token should be generated');

    // Create a known test location
    const locResult = await db.run(
      'INSERT INTO locations (city_name, country_code, latitude, longitude) VALUES (?, ?, ?, ?)',
      [`TestCity_${unique}`, 'IN', 28.61, 77.20]
    );
    testLocationId = locResult.lastInsertRowid;

    // Add a weather report record for that location
    await db.run(
      `INSERT INTO weather_reports (temperature, humidity, wind_speed, condition_text, recorded_at, location_id)
       VALUES (?, ?, ?, ?, datetime('now'), ?)`,
      [27.5, 65, 12.0, 'Partly Cloudy', testLocationId]
    );
  });

  // Story W-01 Contract Tests
  await t.test('W-01: GET /api/weather/current with valid query params returns 200 OK and expected fields', async () => {
    const res = await request(app).get('/api/weather/current?lat=51.50&lon=-0.12');
    assert.equal(res.status, 200);
    assert.ok(res.body.city_name, 'Response must have city_name');
    assert.ok(res.body.country_code, 'Response must have country_code');
    assert.ok(typeof res.body.temperature === 'number', 'Response must have numeric temperature');
    assert.ok(typeof res.body.humidity === 'number', 'Response must have numeric humidity');
    assert.ok(typeof res.body.wind_speed === 'number', 'Response must have numeric wind_speed');
    assert.ok(res.body.condition_text, 'Response must have condition_text');
    assert.ok(res.body.recorded_at, 'Response must have recorded_at');
  });

  await t.test('W-01: GET /api/weather/current with invalid or missing params returns 400 Bad Request', async () => {
    const res = await request(app).get('/api/weather/current?lat=51.50'); // missing lon
    assert.equal(res.status, 400);
    assert.ok(res.body.error || res.body.message, 'Response contains error message');
  });

  // Story W-02 Contract Tests
  await t.test('W-02: GET /api/weather/history with valid location_id returns 200 and history array', async () => {
    const res = await request(app).get(`/api/weather/history?location_id=${testLocationId}&duration_hours=24`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Response must be an array');
    assert.ok(res.body.length > 0, 'History should contain at least one record');
    const first = res.body[0];
    assert.ok(first.recorded_at, 'Record should have recorded_at');
    assert.ok(first.temperature !== undefined, 'Record should have temperature');
    assert.ok(first.humidity !== undefined, 'Record should have humidity');
    assert.ok(first.condition_text, 'Record should have condition_text');
  });

  await t.test('W-02: GET /api/weather/history with nonexistent location_id returns 404 Not Found', async () => {
    const res = await request(app).get('/api/weather/history?location_id=999999&duration_hours=24');
    assert.equal(res.status, 404);
    assert.ok(res.body.error, 'Response should contain error description');
  });

  // Story W-03 Contract Tests
  await t.test('W-03: POST /api/users/favorites authenticated adds favorite location (201 Created)', async () => {
    const res = await request(app)
      .post('/api/users/favorites')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ location_id: testLocationId });

    assert.ok(res.status === 200 || res.status === 201, 'Status should be 200 or 201');
    assert.equal(res.body.status, 'success');
    assert.equal(res.body.favorite_added, testLocationId);
    assert.ok(res.body.saved_at, 'Response must include saved_at timestamp');
  });

  await t.test('W-03: POST /api/users/favorites unauthenticated returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/users/favorites')
      .send({ location_id: testLocationId });

    assert.equal(res.status, 401);
  });

  await t.test('W-03: POST /api/users/favorites duplicate returns 409 Conflict (Lab 3 Gap 2)', async () => {
    const res = await request(app)
      .post('/api/users/favorites')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ location_id: testLocationId });

    assert.equal(res.status, 409);
  });

  // Story W-04 Contract Tests
  await t.test('W-04: GET /api/users/favorites authenticated returns array with current_temp under 1.5s', async () => {
    const start = Date.now();
    const res = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${authToken}`);

    const duration = Date.now() - start;
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Response must be an array');
    assert.ok(res.body.length >= 1, 'Should contain saved favorite');
    const fav = res.body[0];
    assert.ok(fav.location_id, 'Must contain location_id');
    assert.ok(fav.city_name, 'Must contain city_name');
    assert.ok(fav.country_code, 'Must contain country_code');
    assert.ok(fav.current_temp !== undefined, 'Must contain current_temp');
    assert.ok(duration < 1500, `Must respond in under 1.5s (Actual: ${duration}ms)`);
  });

  await t.test('W-04: GET /api/users/favorites unauthenticated returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/users/favorites');
    assert.equal(res.status, 401);
  });
});
