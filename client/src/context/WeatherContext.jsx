import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentWeather, getFavorites, addFavorite, removeFavorite } from '../services/api';
import { useAuth } from './AuthContext';

const WeatherContext = createContext();

export function WeatherProvider({ children }) {
  const { token, isAuthenticated, openAuthModal } = useAuth();

  // Default starting city: Kolkata (as emphasized in user prompt!)
  const [currentWeather, setCurrentWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempUnit, setTempUnit] = useState('C');
  const [mode, setMode] = useState(() => localStorage.getItem('mausam360_mode') || 'dark');
  const [favorites, setFavorites] = useState([]);
  const [historyLocation, setHistoryLocation] = useState(null);

  // Load weather for coordinates
  const loadWeather = useCallback(async (lat, lon, city = null, country = null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCurrentWeather(lat, lon, city, country);
      setCurrentWeather(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch favorites when authenticated
  const loadFavorites = useCallback(async () => {
    if (token) {
      try {
        const favs = await getFavorites(token);
        setFavorites(favs);
      } catch (err) {
        console.warn('Failed to load favorites:', err);
      }
    } else {
      setFavorites([]);
    }
  }, [token]);

  // Initial load: Kolkata by default
  useEffect(() => {
    loadWeather(22.5726, 88.3639, 'Kolkata', 'IN');
  }, [loadWeather]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Apply theme & weather attributes to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('mausam360_mode', mode);
  }, [mode]);

  useEffect(() => {
    if (currentWeather?.weather_group) {
      document.documentElement.setAttribute('data-weather', currentWeather.weather_group);
    } else {
      document.documentElement.setAttribute('data-weather', 'clear');
    }
  }, [currentWeather]);

  // Toggle Day / Night mode
  const toggleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'day' : 'dark'));
  };

  // Toggle C / F
  const toggleTempUnit = () => {
    setTempUnit((prev) => (prev === 'C' ? 'F' : 'C'));
  };

  // Helper to convert C to F
  const convertTemp = (celsius) => {
    if (celsius === null || celsius === undefined) return '--';
    if (tempUnit === 'F') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  };

  // Detect Live Location (Story W-03)
  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadWeather(latitude, longitude);
      },
      (geoErr) => {
        console.warn('Geolocation error:', geoErr);
        alert('Could not access your location. Please check browser permissions.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // Toggle favorite city
  const toggleFavorite = async (locationId) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const isFav = favorites.some((f) => f.location_id === locationId);
    try {
      if (isFav) {
        await removeFavorite(locationId, token);
      } else {
        await addFavorite(locationId, token);
      }
      await loadFavorites();
    } catch (err) {
      alert(err.message);
    }
  };

  const isFavorited = (locationId) => {
    return favorites.some((f) => f.location_id === locationId);
  };

  return (
    <WeatherContext.Provider
      value={{
        currentWeather,
        loading,
        error,
        tempUnit,
        mode,
        favorites,
        historyLocation,
        setHistoryLocation,
        toggleMode,
        toggleTempUnit,
        convertTemp,
        loadWeather,
        detectLiveLocation,
        toggleFavorite,
        isFavorited,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
