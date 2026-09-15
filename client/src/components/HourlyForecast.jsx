import React from 'react';
import {
  Clock,
  Droplets,
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
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

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

export default function HourlyForecast() {
  const { currentWeather, convertTemp } = useWeather();
  if (!currentWeather || !currentWeather.hourly) return null;

  const hourlyData = currentWeather.hourly.slice(0, 24);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="section-title-row">
        <h2 className="section-title">
          <Clock size={20} color="var(--theme-accent)" />
          <span>Hourly Commuter Forecast</span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Next 24 Hours
        </span>
      </div>

      <div className="hourly-scroll">
        {hourlyData.map((hour, index) => {
          const IconComp = iconMap[hour.icon] || CloudSun;
          const timeDate = new Date(hour.time);
          const timeLabel = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isNow = index === 0;

          return (
            <div
              key={hour.time}
              className={`hourly-card ${isNow ? 'active-hour' : ''}`}
            >
              <span className="hourly-time">{isNow ? 'Now' : timeLabel}</span>
              <IconComp size={28} color="var(--theme-accent)" />
              <span className="hourly-temp">{convertTemp(hour.temperature)}°</span>

              {hour.precipitation_prob > 0 && (
                <span className="hourly-pop">
                  <Droplets size={10} />
                  <span>{hour.precipitation_prob}%</span>
                </span>
              )}

              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Wind size={10} />
                <span>{Math.round(hour.wind_speed)}k</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
