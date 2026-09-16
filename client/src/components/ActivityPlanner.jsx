import React from 'react';
import {
  Compass,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Landmark,
  Trees,
  Sparkles,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

export default function ActivityPlanner() {
  const { currentWeather } = useWeather();
  if (!currentWeather || !currentWeather.activities) return null;

  const { city, region, recommendations } = currentWeather.activities;

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div className="section-title-row">
        <div>
          <h2 className="section-title">
            <Compass size={22} color="var(--theme-accent)" />
            <span>Weather-Aware Activity Planner</span>
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Authentic, geographically tailored plans for <strong style={{ color: 'var(--theme-accent)' }}>{city}</strong> ({region})
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Sparkles size={14} color="#f59e0b" />
          <span>Synced with current weather</span>
        </div>
      </div>

      <div className="activity-grid">
        {recommendations.map((item) => {
          const isCaution = item.suitability.includes('Caution') || item.suitability.includes('Not');

          return (
            <div key={item.id} className="activity-card">
              <div>
                <div className="activity-badge-row">
                  <span className="activity-category-badge">{item.category}</span>
                  <span className={`activity-suitability ${isCaution ? 'caution' : ''}`}>
                    {isCaution ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                    <span>{item.suitability}</span>
                  </span>
                </div>

                <div className="activity-title">{item.title}</div>

                <div className="activity-location">
                  <MapPin size={13} />
                  <span>{item.location}</span>
                </div>

                <p className="activity-desc" style={{ marginTop: '0.65rem' }}>
                  {item.description}
                </p>
              </div>

              <div className="activity-rationale-box">
                {item.rationale}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
