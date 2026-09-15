# MAUSAM360 — Weather Aware Activity Planner

**Course**: DSC3153: Software Development Lab  
**Team**: INFINITE LOOP (G2-T2)  
**Project ID**: G2-12  
**Roles (Iteration 1)**:
- **Scrum Master**: Mudrika
- **Product Owner**: Anurag
- **Developers**: Arpan, Lakshya, Mudrika, Anurag

---

## 🌤️ Overview & 13 Core Features

MAUSAM360 is a premier full-stack weather intelligence and contextual activity planning web application designed to fulfill all requirements across Labs 01 to 04:

1. **Live Weather**: Real-time temperature, feels like, humidity, wind speed, pressure, UV index, sunrise/sunset.
2. **Hourly Weather**: 24-hour commuter timeline with temperature curves, condition badges, and rain probabilities.
3. **7 / 15-Day Forecast**: Multi-day outlook with daily high/low temperature bars and rain chances for outdoor planning.
4. **Live Interactive Radar**: Interactive Leaflet map with live RainViewer Doppler radar tiles, time animation slider, and opacity controls.
5. **Live Location Weather**: Auto-detects GPS coordinates with one click and reverse-geocodes to the local city.
6. **Smart Weather Advice & Notifications**: Proactive contextual advice for umbrellas, sunscreen (UV ≥ 5), clothing (jackets, heavy winter layers, breathable cotton), and heat index alerts.
7. **City-Aware Activity Planner**: Authentic, geographically sound recommendations for specific cities (e.g. Kolkata: Victoria Memorial gardens, Park Street cafes, Princep Ghat; Jaipur: Hawa Mahal, Amer Fort, rooftop havelis — strictly avoiding impossible suggestions like beaches in desert regions!). Automatically shifts to indoor spots during rain or high heat.
8. **Vivid Weather-Reactive UI/UX**: Aesthetic glassmorphic interface whose color palettes adapt to current weather conditions (Sunny Amber, Rainy Slate Indigo, Thunderstorm Violet, Cloudy Gray, Snow Azure).
9. **City Landmark Background Artwork**: Stylized monument illustrations dynamically appearing behind searched cities (Howrah Bridge/Victoria Memorial for Kolkata, Hawa Mahal for Jaipur, Gateway of India for Mumbai, India Gate for Delhi, Big Ben for London, Eiffel Tower for Paris).
10. **Day & Night Mode**: Clean toggle button with smooth CSS transitions and local storage persistence.
11. **Favorite Cities**: Bookmark favorite cities with live temperatures and one-click quick switching.
12. **Real Relational Database & Authentication**: Working user registration and login with bcrypt password hashing, JWT bearer tokens, and persistent storage of favorites and weather reports adhering to the Lab 3 ER Schema.
13. **3D Perspective Tilt & Micro-Animations**: Realistic 3D card tilt tracking cursor coordinates, floating condition icons, and weather particle canvas (falling rain, drifting snow, solar specks).

---

## 🚀 Quickstart (Run Locally in 3 Commands)

```bash
# 1. Install root, backend, and frontend dependencies
npm run install:all

# 2. Run automated Lab 4 Exercise C2 contract tests
npm run test:server

# 3. Launch full-stack application concurrently (Backend on :5000, Frontend on :5173)
npm run dev
```

---

## 🗄️ Relational Database Schema (Lab 03 Specification)

The database schema strictly adheres to the Lab 3 ER Schema with dual MySQL & zero-config SQLite support:

- `users` (`user_id` PK, `username` UNIQUE NOT NULL, `email` UNIQUE NOT NULL, `password_hash` NOT NULL, `created_at`)
- `locations` (`location_id` PK, `city_name` NOT NULL, `country_code` NOT NULL, `latitude` NOT NULL, `longitude` NOT NULL, `created_at`, UNIQUE(`city_name`, `country_code`))
- `weather_reports` (`report_id` PK, `temperature` NOT NULL, `humidity` NOT NULL, `wind_speed` NOT NULL, `condition_text` NOT NULL, `recorded_at` NOT NULL, `location_id` FK → `locations`)
- `favourite_locations` (`user_id` FK → `users`, `location_id` FK → `locations`, `saved_at`, **PRIMARY KEY (`user_id`, `location_id`)** to prevent race conditions and duplicate entries)

Pure MySQL DDL script is located in `server/schema.sql`.

---

## 📋 API Contract (Lab 03 & Lab 04)

| Method | Path | Request / Query | Response / Status | Auth |
|---|---|---|---|---|
| `GET` | `/api/weather/current` | `lat` (decimal), `lon` (decimal) | `200 OK` with `city_name, country_code, temperature, humidity, wind_speed, condition_text, recorded_at` (400 if missing) | Public |
| `GET` | `/api/weather/history` | `location_id` (int), `duration_hours` (int) | `200 OK` Array of `[{ recorded_at, temperature, humidity, condition_text }]` (404 if not found) | Public |
| `GET` | `/api/weather/search` | `q` (string) | `200 OK` Array of matching geocoded cities | Public |
| `POST` | `/api/users/favorites` | Body: `{ "location_id": 12 }` | `201 Created` `{ status: "success", favorite_added, saved_at }` (401 unauth, 409 duplicate) | Registered User |
| `GET` | `/api/users/favorites` | None | `200 OK` Array of `[{ location_id, city_name, country_code, current_temp }]` in &lt; 1.5s | Registered User |
| `DELETE` | `/api/users/favorites/:id`| Path param `location_id` | `200 OK` `{ status: "success" }` | Registered User |
| `POST` | `/api/auth/register` | Body: `{ username, email, password }` | `201 Created` with JWT token and user info | Public |
| `POST` | `/api/auth/login` | Body: `{ emailOrUsername, password }` | `200 OK` with JWT token and user info | Public |

---

## ✅ Definition of Done (DoD) Checklist

- [x] **Code Review**: Structured modular architecture with clean separation of concerns.
- [x] **CI Pipeline**: 100% passing automated test suite (`tests/contract.test.js`).
- [x] **Local Testing**: Runs on developer machine with zero crashes.
- [x] **Database Integrity**: Exact match to Lab 3 ER schema with composite primary keys.
- [x] **API Alignment**: Endpoint paths, query params, status codes match contract.
- [x] **NFR Compliance**: Dashboard renders in &lt; 1.5s; GPS coordinates are protected.
