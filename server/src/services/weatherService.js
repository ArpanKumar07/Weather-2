import axios from 'axios';
import { db } from '../config/db.js';

// In-memory cache for fast response times (< 1.5s SLA)
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// WMO Weather Interpretation Codes
export function interpretWeatherCode(code) {
  const codeMap = {
    0: { text: 'Clear Sky', icon: 'Sun', group: 'clear' },
    1: { text: 'Mainly Clear', icon: 'SunDim', group: 'clear' },
    2: { text: 'Partly Cloudy', icon: 'CloudSun', group: 'clouds' },
    3: { text: 'Overcast', icon: 'Cloud', group: 'clouds' },
    45: { text: 'Foggy', icon: 'CloudFog', group: 'atmosphere' },
    48: { text: 'Depositing Rime Fog', icon: 'CloudFog', group: 'atmosphere' },
    51: { text: 'Light Drizzle', icon: 'CloudDrizzle', group: 'rain' },
    53: { text: 'Moderate Drizzle', icon: 'CloudDrizzle', group: 'rain' },
    55: { text: 'Dense Drizzle', icon: 'CloudRain', group: 'rain' },
    61: { text: 'Slight Rain', icon: 'CloudRain', group: 'rain' },
    63: { text: 'Moderate Rain', icon: 'CloudRain', group: 'rain' },
    65: { text: 'Heavy Rain', icon: 'CloudRainWind', group: 'rain' },
    71: { text: 'Slight Snow Fall', icon: 'Snowflake', group: 'snow' },
    73: { text: 'Moderate Snow Fall', icon: 'Snowflake', group: 'snow' },
    75: { text: 'Heavy Snow Fall', icon: 'Snowflake', group: 'snow' },
    80: { text: 'Slight Rain Showers', icon: 'CloudRain', group: 'rain' },
    81: { text: 'Moderate Rain Showers', icon: 'CloudRainWind', group: 'rain' },
    82: { text: 'Violent Rain Showers', icon: 'CloudLightning', group: 'rain' },
    85: { text: 'Slight Snow Showers', icon: 'Snowflake', group: 'snow' },
    86: { text: 'Heavy Snow Showers', icon: 'Snowflake', group: 'snow' },
    95: { text: 'Thunderstorm', icon: 'CloudLightning', group: 'storm' },
    96: { text: 'Thunderstorm with Slight Hail', icon: 'CloudLightning', group: 'storm' },
    99: { text: 'Thunderstorm with Heavy Hail', icon: 'CloudLightning', group: 'storm' },
  };

  return codeMap[code] || { text: 'Moderate Weather', icon: 'Cloud', group: 'clouds' };
}

/**
 * Reverse geocode latitude/longitude to a real city name and country code
 */
export async function reverseGeocode(lat, lon) {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat,
        lon,
        format: 'json',
        zoom: 10,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'MAUSAM360-WeatherApp/1.0',
      },
      timeout: 3000,
    });

    if (res.data && res.data.address) {
      const addr = res.data.address;
      const city = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || addr.state || 'Local Station';
      const countryCode = (addr.country_code || 'IN').toUpperCase();
      return { city, countryCode };
    }
  } catch (err) {
    // Fallback to approximate naming
  }
  return { city: `Coord (${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)})`, countryCode: 'GLOBAL' };
}

/**
 * Search cities by query text
 */
export async function searchCities(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();

  try {
    const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
      params: {
        name: q,
        count: 8,
        language: 'en',
        format: 'json',
      },
      timeout: 3000,
    });

    if (res.data && res.data.results) {
      return res.data.results.map((item) => ({
        name: item.name,
        country: item.country || '',
        country_code: (item.country_code || '').toUpperCase(),
        latitude: item.latitude,
        longitude: item.longitude,
        admin1: item.admin1 || '',
      }));
    }
  } catch (err) {
    console.warn('Geocoding API error:', err.message);
  }

  return [];
}

/**
 * Get or create location in relational database (Lab 3 ER Schema)
 */
export async function getOrCreateLocation(cityName, countryCode, lat, lon) {
  const existing = await db.get(
    'SELECT * FROM locations WHERE city_name = ? AND country_code = ? LIMIT 1',
    [cityName, countryCode]
  );

  if (existing) {
    return existing;
  }

  const result = await db.run(
    'INSERT INTO locations (city_name, country_code, latitude, longitude) VALUES (?, ?, ?, ?)',
    [cityName, countryCode, parseFloat(lat), parseFloat(lon)]
  );

  return {
    location_id: result.lastInsertRowid,
    city_name: cityName,
    country_code: countryCode,
    latitude: parseFloat(lat),
    longitude: parseFloat(lon),
  };
}

/**
 * Fetch complete live, hourly, and daily weather forecast
 */
export async function fetchFullWeather(lat, lon, cityName = null, countryCode = null) {
  const roundedLat = parseFloat(Number(lat).toFixed(4));
  const roundedLon = parseFloat(Number(lon).toFixed(4));
  const cacheKey = `${roundedLat},${roundedLon}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // If city/country not provided, reverse geocode
  let city = cityName;
  let country = countryCode;
  if (!city || !country) {
    const geo = await reverseGeocode(roundedLat, roundedLon);
    city = geo.city;
    country = geo.countryCode;
  }

  // Call Open-Meteo Free Global Forecast API
  const url = 'https://api.open-meteo.com/v1/forecast';
  const response = await axios.get(url, {
    params: {
      latitude: roundedLat,
      longitude: roundedLon,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'weather_code',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation_probability',
        'weather_code',
        'wind_speed_10m',
        'uv_index',
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'precipitation_probability_max',
        'sunrise',
        'sunset',
        'uv_index_max',
      ].join(','),
      timezone: 'auto',
      forecast_days: 16,
    },
    timeout: 5000,
  });

  const data = response.data;
  const current = data.current || {};
  const hourly = data.hourly || {};
  const daily = data.daily || {};

  const weatherMeta = interpretWeatherCode(current.weather_code || 0);

  // Sync with DB
  const locationRecord = await getOrCreateLocation(city, country, roundedLat, roundedLon);

  // Record weather report in database for history tracking (Lab 3 ER Schema & Story W-02)
  await db.run(
    `INSERT INTO weather_reports (temperature, humidity, wind_speed, condition_text, recorded_at, location_id)
     VALUES (?, ?, ?, ?, datetime('now'), ?)`,
    [
      current.temperature_2m || 0,
      current.relative_humidity_2m || 0,
      current.wind_speed_10m || 0,
      weatherMeta.text,
      locationRecord.location_id,
    ]
  );

  // Format 48-hour timeline
  const formattedHourly = [];
  const currentHourISO = new Date().toISOString().slice(0, 13);
  let startIndex = 0;
  if (hourly.time) {
    const foundIdx = hourly.time.findIndex((t) => t.startsWith(currentHourISO));
    if (foundIdx !== -1) startIndex = foundIdx;

    for (let i = startIndex; i < Math.min(startIndex + 36, hourly.time.length); i++) {
      const code = hourly.weather_code[i];
      const hMeta = interpretWeatherCode(code);
      formattedHourly.push({
        time: hourly.time[i],
        temperature: Math.round(hourly.temperature_2m[i]),
        feels_like: hourly.apparent_temperature ? Math.round(hourly.apparent_temperature[i]) : Math.round(hourly.temperature_2m[i]),
        humidity: hourly.relative_humidity_2m[i],
        precipitation_prob: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
        wind_speed: hourly.wind_speed_10m[i],
        uv_index: hourly.uv_index ? hourly.uv_index[i] : 0,
        condition_text: hMeta.text,
        icon: hMeta.icon,
      });
    }
  }

  // Format 15-day daily forecast
  const formattedDaily = [];
  if (daily.time) {
    for (let i = 0; i < daily.time.length; i++) {
      const code = daily.weather_code[i];
      const dMeta = interpretWeatherCode(code);
      formattedDaily.push({
        date: daily.time[i],
        temp_max: Math.round(daily.temperature_2m_max[i]),
        temp_min: Math.round(daily.temperature_2m_min[i]),
        precipitation_sum: daily.precipitation_sum[i],
        precipitation_prob: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
        uv_index_max: daily.uv_index_max ? daily.uv_index_max[i] : 0,
        sunrise: daily.sunrise ? daily.sunrise[i] : null,
        sunset: daily.sunset ? daily.sunset[i] : null,
        condition_text: dMeta.text,
        icon: dMeta.icon,
      });
    }
  }

  const resultPayload = {
    location_id: locationRecord.location_id,
    city_name: city,
    country_code: country,
    latitude: roundedLat,
    longitude: roundedLon,
    temperature: current.temperature_2m,
    feels_like: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    wind_speed: current.wind_speed_10m,
    wind_direction: current.wind_direction_10m,
    pressure: current.surface_pressure,
    precipitation: current.precipitation,
    condition_text: weatherMeta.text,
    weather_icon: weatherMeta.icon,
    weather_group: weatherMeta.group,
    weather_code: current.weather_code,
    uv_index: formattedHourly[0]?.uv_index || 0,
    recorded_at: new Date().toISOString(),
    hourly: formattedHourly,
    daily: formattedDaily,
  };

  cache.set(cacheKey, { timestamp: Date.now(), data: resultPayload });
  return resultPayload;
}
