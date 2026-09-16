import React, { useRef, useState } from 'react';
import {
  Sun,
  SunDim,
  CloudSun,
  Cloud,
  CloudRain,
  CloudRainWind,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Snowflake,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Star,
  Clock,
  Sunrise,
  Sunset,
  History,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

// Map icon name string to Lucide component
const iconMap = {
  Sun,
  SunDim,
  CloudSun,
  Cloud,
  CloudRain,
  CloudRainWind,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Snowflake,
};

export default function WeatherHero() {
  const {
    currentWeather,
    convertTemp,
    tempUnit,
    toggleTempUnit,
    toggleFavorite,
    isFavorited,
    setHistoryLocation,
  } = useWeather();

  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');

  if (!currentWeather) return null;

  const {
    location_id,
    city_name,
    country_code,
    temperature,
    feels_like,
    humidity,
    wind_speed,
    pressure,
    condition_text,
    weather_icon,
    uv_index,
    latitude,
    longitude,
    daily,
  } = currentWeather;

  const favorited = isFavorited(location_id);
  const WeatherIconComponent = iconMap[weather_icon] || CloudSun;

  // Today's sunrise / sunset from daily array
  const todayDaily = daily && daily.length > 0 ? daily[0] : null;
  const sunriseTime = todayDaily?.sunrise
    ? new Date(todayDaily.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '05:45 AM';
  const sunsetTime = todayDaily?.sunset
    ? new Date(todayDaily.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '06:15 PM';

  // 3D Perspective Tilt on Mouse Move
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
    const rotateY = ((x - centerX) / centerX) * 6;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`
    );
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      className="card-glass hero-main-card card-3d"
      style={{ transform: transformStyle, transition: transformStyle ? 'transform 0.1s ease-out' : 'var(--transition-smooth)' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Header Row */}
      <div className="hero-top-row">
        <div className="location-badge-group">
          <div className="location-name-row">
            <h1 className="location-title">
              {city_name}, {country_code}
            </h1>
            <button
              className={`btn-favorite-star ${favorited ? 'favorited' : ''}`}
              onClick={() => toggleFavorite(location_id)}
              title={favorited ? 'Favorited' : 'Add to Favorites'}
            >
              <Star size={26} fill={favorited ? '#f59e0b' : 'none'} />
            </button>

            <button
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              onClick={() => setHistoryLocation(currentWeather)}
              title="View Stored Weather History"
            >
              <History size={16} color="var(--theme-accent)" />
            </button>
          </div>

          <div className="location-coords">
            <span>Latitude: {Number(latitude).toFixed(2)}°</span> •
            <span>Longitude: {Number(longitude).toFixed(2)}°</span>
          </div>
        </div>

        <div className="hero-condition-badge">
          <WeatherIconComponent size={18} />
          <span>{condition_text}</span>
        </div>
      </div>

      {/* Center Temperature & Graphic Row */}
      <div className="hero-center-row">
        <div className="temperature-display">
          <span className="temperature-value">{convertTemp(temperature)}</span>
          <span
            className="temperature-unit"
            onClick={toggleTempUnit}
            title="Click to toggle °C / °F"
          >
            °{tempUnit}
          </span>
        </div>

        <div className="hero-condition-graphic">
          <WeatherIconComponent className="hero-weather-icon" />
          <div className="hero-feels-like">
            Feels like {convertTemp(feels_like)}°{tempUnit}
          </div>
        </div>
      </div>

      {/* Bottom Metrics Grid */}
      <div className="hero-metrics-grid">
        {/* Humidity */}
        <div className="metric-pill">
          <div className="metric-icon-box">
            <Droplets size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Humidity</span>
            <span className="metric-val">{humidity}%</span>
          </div>
        </div>

        {/* Wind */}
        <div className="metric-pill">
          <div className="metric-icon-box">
            <Wind size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Wind Speed</span>
            <span className="metric-val">{Math.round(wind_speed)} km/h</span>
          </div>
        </div>

        {/* UV Index */}
        <div className="metric-pill">
          <div className="metric-icon-box">
            <SunDim size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">UV Index</span>
            <span className="metric-val">{uv_index || 3} of 10</span>
          </div>
        </div>

        {/* Pressure / Sunrise */}
        <div className="metric-pill">
          <div className="metric-icon-box">
            <Gauge size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pressure</span>
            <span className="metric-val">{Math.round(pressure || 1012)} hPa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
