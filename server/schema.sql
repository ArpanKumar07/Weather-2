-- ====================================================================
-- MAUSAM360 - Database Schema (MySQL Compatible)
-- Fulfilling Lab 03 ER Schema Specification & Lab 04 Stack Decision
-- Team: INFINITE LOOP (G2-T2, Project ID: G2-12)
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_city_country (city_name, country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Weather Reports Table (Tracks history for locations - 1:*)
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

-- 4. Favourite Locations Table (Composite Primary Key to prevent race conditions as resolved in Lab 3 Gap 2)
CREATE TABLE IF NOT EXISTS favourite_locations (
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, location_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
