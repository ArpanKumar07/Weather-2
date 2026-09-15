// Dynamic API Base: Automatically normalizes Vercel environment variable or defaults to localhost
let rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
if (!rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}
const API_BASE = rawBase;

export async function getCurrentWeather(lat, lon, city = null, country = null) {
  const params = new URLSearchParams({ lat, lon });
  if (city) params.append('city', city);
  if (country) params.append('country', country);

  const startTime = performance.now();
  const res = await fetch(`${API_BASE}/weather/current?${params.toString()}`);
  const latency = Math.round(performance.now() - startTime);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to fetch weather');
  }

  const data = await res.json();
  data.clientLatencyMs = latency;
  return data;
}

export async function searchCities(query) {
  if (!query || query.trim().length === 0) return [];
  const res = await fetch(`${API_BASE}/weather/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getWeatherHistory(locationId, durationHours = 24) {
  const res = await fetch(`${API_BASE}/weather/history?location_id=${locationId}&duration_hours=${durationHours}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch weather history');
  }
  return res.json();
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(emailOrUsername, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function getFavorites(token) {
  if (!token) return [];
  const res = await fetch(`${API_BASE}/users/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function addFavorite(locationId, token) {
  const res = await fetch(`${API_BASE}/users/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ location_id: locationId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to add favorite');
  return data;
}

export async function removeFavorite(locationId, token) {
  const res = await fetch(`${API_BASE}/users/favorites/${locationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove favorite');
  return data;
}
