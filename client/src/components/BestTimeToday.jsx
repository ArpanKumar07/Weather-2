import React, { useMemo } from 'react';
import {
  SunMedium,
  Clock,
  Sparkles,
  Droplets,
  Wind,
  Thermometer,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { findBestTimeToday } from '../utils/outdoorScore';

export default function BestTimeToday() {
  const { currentWeather, convertTemp } = useWeather();

  const bestWindow = useMemo(() => {
    if (!currentWeather || !currentWeather.hourly) return null;
    return findBestTimeToday(currentWeather.hourly);
  }, [currentWeather]);

  if (!currentWeather || !currentWeather.hourly) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="card-glass">
        {/* Section Title Header */}
        <div className="section-title-row" style={{ marginBottom: '1.2rem' }}>
          <h2 className="section-title" style={{ fontSize: '1.25rem' }}>
            <SunMedium size={22} color="var(--theme-accent)" />
            <span>Best Time Today</span>
          </h2>
          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} color="#f59e0b" />
            <span>Optimal 2-Hour Outdoor Window</span>
          </span>
        </div>

        {!bestWindow || !bestWindow.available ? (
          <div
            style={{
              padding: '1.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>
              {bestWindow?.message ||
                'No optimal outdoor window detected today due to prevailing rain or extreme temperatures.'}
            </span>
          </div>
        ) : (
          <div>
            {/* Primary Banner: Time Window + Score */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: '0.2rem',
                  }}
                >
                  Recommended Outdoor Slot
                </div>
                <div
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Clock size={22} color="var(--theme-accent)" />
                  <span>{bestWindow.timeWindow}</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: 'var(--badge-bg)',
                  border: '1px solid var(--card-border)',
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                }}
              >
                <ShieldCheck size={18} color="var(--theme-accent)" />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--badge-text)',
                  }}
                >
                  Outdoor Score: {bestWindow.score}/100
                </span>
              </div>
            </div>

            {/* Meteorological Summary Text */}
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              {bestWindow.summary} Expected condition:{' '}
              <strong style={{ color: 'var(--text-main)' }}>{bestWindow.condition_text}</strong>.
            </p>

            {/* Metrics Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.9rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--card-border)',
              }}
            >
              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Thermometer size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Avg Temp</span>
                  <span className="metric-val">{convertTemp(bestWindow.temperature)}°</span>
                </div>
              </div>

              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Sparkles size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Feels Like</span>
                  <span className="metric-val">{convertTemp(bestWindow.feels_like)}°</span>
                </div>
              </div>

              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Droplets size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Rain Risk</span>
                  <span className="metric-val">{bestWindow.precipitation_prob}%</span>
                </div>
              </div>

              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Wind size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Wind</span>
                  <span className="metric-val">{bestWindow.wind_speed} km/h</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
