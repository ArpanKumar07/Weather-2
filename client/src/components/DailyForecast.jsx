import React, { useState } from 'react';
import {
  Calendar,
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

export default function DailyForecast() {
  const { currentWeather, convertTemp } = useWeather();
  const [viewCount, setViewCount] = useState(7); // 7 or 15 days

  if (!currentWeather || !currentWeather.daily) return null;

  const dailyData = currentWeather.daily.slice(0, viewCount);

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div className="section-title-row">
        <h2 className="section-title">
          <Calendar size={20} color="var(--theme-accent)" />
          <span>Extended Weather Forecast</span>
        </h2>

        {/* 7-Day / 15-Day View Toggle */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={`btn-pill ${viewCount === 7 ? 'btn-pill-primary' : ''}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setViewCount(7)}
          >
            7 Days
          </button>
          <button
            className={`btn-pill ${viewCount === 15 ? 'btn-pill-primary' : ''}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setViewCount(15)}
          >
            15 Days
          </button>
        </div>
      </div>

      <div className="daily-forecast-grid">
        {dailyData.map((day, idx) => {
          const IconComp = iconMap[day.icon] || CloudSun;
          const dateObj = new Date(day.date);
          const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <div key={day.date} className="daily-card">
              <div className="daily-header">
                <span className="daily-day">{dayName}</span>
                <span className="daily-date">{dateFormatted}</span>
              </div>

              <div className="daily-weather-info">
                <IconComp size={32} color="var(--theme-accent)" />
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{day.condition_text}</div>
                  {day.precipitation_prob > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Droplets size={11} />
                      <span>{day.precipitation_prob}% rain</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="daily-temp-range">
                <span className="daily-high">{convertTemp(day.temp_max)}°</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>High / Low</span>
                <span className="daily-low">{convertTemp(day.temp_min)}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
