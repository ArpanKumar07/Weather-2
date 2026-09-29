import React, { useState } from 'react';
import { getChatbotPreferences } from './chatbot/chatbotPreferences';
import {
  Compass,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Landmark,
  Trees,
  Sparkles,
  Search,
  Home,
  CloudRain,
  Sun,
  AlertTriangle,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

export default function ActivityPlanner() {
  const { currentWeather } = useWeather();
  const { ageGroup } = getChatbotPreferences();
  const [filter, setFilter] = useState('all'); // 'all' | 'outdoor' | 'indoor' | 'at_risk'

  if (!currentWeather || !currentWeather.activities) return null;

  const { city, region, recommendations } = currentWeather.activities;

  const atRiskCount = recommendations.filter((r) => (r.rain ?? 0) > 50).length;
  const outdoorCount = recommendations.filter((r) => !r.indoor).length;
  const indoorCount = recommendations.filter((r) => r.indoor).length;
  const allCount = recommendations.length;

  // Filter activities based on weather risk / indoor vs outdoor.
  // Selecting "At-risk only" shows activities with rain >50% and hides the others.
  const filtered = recommendations.filter((item) => {
    const rain = item.rain ?? 0;
    if (filter === 'at_risk') return rain > 50;
    if (filter === 'outdoor') return !item.indoor;
    if (filter === 'indoor') return item.indoor;
    return true;
  });

  return (
    <div id="activity-planner" style={{ marginBottom: '2.5rem', scrollMarginTop: '80px' }}>
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

      {/* Weather-Risk Filtering Controls */}
      <div className="activity-filter-bar">
        <div className="activity-filter-label">
          <Search size={14} color="var(--theme-accent)" />
          <span>Weather-Risk Filtering:</span>
        </div>

        <div className="activity-filter-tabs">
          <button
            type="button"
            className={`activity-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span>All</span>
            <span className="activity-filter-count">{allCount}</span>
          </button>

          <button
            type="button"
            className={`activity-filter-btn ${filter === 'outdoor' ? 'active' : ''}`}
            onClick={() => setFilter('outdoor')}
          >
            <Trees size={13} />
            <span>Outdoor</span>
            <span className="activity-filter-count">{outdoorCount}</span>
          </button>

          <button
            type="button"
            className={`activity-filter-btn ${filter === 'indoor' ? 'active' : ''}`}
            onClick={() => setFilter('indoor')}
          >
            <Home size={13} />
            <span>Indoor</span>
            <span className="activity-filter-count">{indoorCount}</span>
          </button>

          <button
            type="button"
            className={`activity-filter-btn at-risk-btn ${filter === 'at_risk' ? 'active' : ''}`}
            onClick={() => setFilter('at_risk')}
            title="Selecting 'At-risk only' shows activities with rain >50% and hides the others"
          >
            <AlertTriangle size={13} />
            <span>At-risk only</span>
            <span className="activity-filter-count at-risk-count">{atRiskCount}</span>
          </button>
        </div>
      </div>

      {/* Notice when At-Risk filter is active */}
      {filter === 'at_risk' && (
        <div className="activity-at-risk-banner">
          <AlertCircle size={15} />
          <span>
            Selecting <strong>&ldquo;At-risk only&rdquo;</strong> shows activities with <strong>rain &gt; 50%</strong> ({filtered.length} visible) and hides the others.
          </span>
        </div>
      )}

      {/* Activity Grid */}
      <div className="activity-grid">
        {filtered.map((item) => {
          const isCaution = item.suitability.includes('Caution') || item.suitability.includes('Not');
          const isAtRisk = (item.rain ?? 0) > 50;

          return (
            <div key={item.id} className={`activity-card ${isAtRisk ? 'at-risk-card' : ''}`}>
              <div>
                <div className="activity-badge-row">
                  <span className="activity-category-badge">{item.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`activity-venue-badge ${item.indoor ? 'indoor' : 'outdoor'}`}>
                      {item.indoor ? '🏠 Indoor' : '🌳 Outdoor'}
                    </span>
                    <span className={`activity-risk-pill ${isAtRisk ? 'risk-high' : 'risk-low'}`}>
                      {isAtRisk ? <CloudRain size={12} /> : <Sun size={12} />}
                      <span>Rain: {item.rain}% {isAtRisk ? '• At-Risk' : '• Low Risk'}</span>
                    </span>
                  </div>
                </div>

                <div className="activity-title" style={{ marginTop: '0.4rem' }}>{item.title}</div>
                <div className="activity-age-tip" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{
                  ageGroup === 'child' ? '👶 Kid-friendly spot with safe play area.' :
                  ageGroup === 'teen' ? '🎧 Trendy hangout popular among teens.' :
                  ageGroup === 'senior' ? '🧓 Gentle walk with benches and shade.' :
                  '💼 Ideal for adults, good for work-life balance.'
                }</div>

                <div className="activity-location">
                  <MapPin size={13} />
                  <span>{item.location}</span>
                </div>

                <p className="activity-desc" style={{ marginTop: '0.65rem' }}>
                  {item.description}
                </p>
              </div>

              <div className="activity-rationale-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', fontWeight: 600 }}>
                  <span className={`activity-suitability ${isCaution ? 'caution' : ''}`} style={{ padding: 0 }}>
                    {isCaution ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                    <span>{item.suitability}</span>
                  </span>
                </div>
                <div>{item.rationale}</div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="activity-empty-state">
            <CheckCircle2 size={24} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No activities found</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {filter === 'at_risk'
                  ? 'No activities currently have rain > 50%. Conditions are clear and favorable!'
                  : 'No activities match the current filter.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
