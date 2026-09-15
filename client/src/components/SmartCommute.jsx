import React, { useState, useMemo } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  Timer,
  Droplets,
  Wind,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  Umbrella,
  Eye,
  CloudRain,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { analyzeCommute, findBestDepartureTime } from '../utils/commuteScore';

export default function SmartCommute() {
  const { currentWeather, convertTemp } = useWeather();

  // Inputs
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // Default to current local time formatted as HH:mm
  const defaultTimeStr = useMemo(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  const [timeInput, setTimeInput] = useState(defaultTimeStr);
  const [durationMins, setDurationMins] = useState(30);

  // Compute actual departure Date object from timeInput
  const departureDate = useMemo(() => {
    const [h, m] = timeInput.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }, [timeInput]);

  // Display labels
  const originDisplay = origin.trim() || currentWeather?.city_name || 'Home / Current';
  const destinationDisplay = destination.trim() || 'Work / College';

  // Commute Analysis using REAL forecast data
  const commuteAnalysis = useMemo(() => {
    if (!currentWeather || !currentWeather.hourly) return null;
    return analyzeCommute(currentWeather.hourly, departureDate, durationMins);
  }, [currentWeather, departureDate, durationMins]);

  // Optimal Departure Recommendation (Feature 4)
  const departureRecommendation = useMemo(() => {
    if (!currentWeather || !currentWeather.hourly) return null;
    return findBestDepartureTime(currentWeather.hourly, departureDate, durationMins);
  }, [currentWeather, departureDate, durationMins]);

  if (!currentWeather || !currentWeather.hourly) return null;

  return (
    <div id="smart-commute" style={{ marginBottom: '2.5rem', scrollMarginTop: '80px' }}>
      <div className="card-glass">
        {/* Section Header */}
        <div className="section-title-row" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem' }}>
              <Navigation size={22} color="var(--theme-accent)" />
              <span>Smart Commute Planner</span>
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Real-time transit weather intelligence & departure optimization for <strong style={{ color: 'var(--theme-accent)' }}>{currentWeather.city_name}</strong>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} color="#f59e0b" />
            <span>Data-Driven Forecast</span>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1.15rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--card-border)',
          }}
        >
          {/* Origin */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={13} color="var(--theme-accent)" />
              <span>From</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={currentWeather.city_name || 'Home / Current'}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>

          {/* Destination */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={13} color="#f59e0b" />
              <span>To</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="College / Office"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {/* Departure Time */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} color="var(--theme-accent)" />
              <span>Departure Time</span>
            </label>
            <input
              type="time"
              className="form-input"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
            />
          </div>

          {/* Duration Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Timer size={13} color="var(--theme-accent)" />
              <span>Duration</span>
            </label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[15, 30, 45, 60].map((mins) => {
                const isActive = durationMins === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMins(mins)}
                    style={{
                      flex: 1,
                      padding: '0.55rem 0',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--theme-accent)' : 'var(--card-border)',
                      background: isActive ? 'var(--badge-bg)' : 'rgba(15, 23, 42, 0.4)',
                      color: isActive ? 'var(--theme-accent)' : 'var(--text-muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                    }}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Handling Missing or Out of Range Data */}
        {!commuteAnalysis || !commuteAnalysis.available ? (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>
              {commuteAnalysis?.message ||
                'Commute analysis unavailable: hourly forecast records for this time window could not be retrieved.'}
            </span>
          </div>
        ) : (
          <div>
            {/* Top Route & Score Banner */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--card-border)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '1.1rem' }}>
                  <span>{originDisplay}</span>
                  <ArrowRight size={16} color="var(--theme-accent)" />
                  <span>{destinationDisplay}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Transit Window: <strong>{commuteAnalysis.departureTimeLabel}</strong> → <strong>{commuteAnalysis.arrivalTimeLabel}</strong> ({durationMins} minutes)
                </div>
              </div>

              {/* Deterministic Score Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.45rem 1rem',
                  borderRadius: '999px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${commuteAnalysis.scoreColor}`,
                }}
              >
                <ShieldCheck size={18} color={commuteAnalysis.scoreColor} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: commuteAnalysis.scoreColor }}>
                  Score: {commuteAnalysis.score}/100
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {commuteAnalysis.scoreTier}
                </span>
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.9rem',
                marginBottom: '1.25rem',
              }}
            >
              {/* Rain Risk */}
              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Droplets size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Rain Risk</span>
                  <span className="metric-val">{commuteAnalysis.rainRisk}%</span>
                </div>
              </div>

              {/* Rain Amount */}
              <div className="metric-pill">
                <div className="metric-icon-box">
                  <CloudRain size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Precip</span>
                  <span className="metric-val">{commuteAnalysis.rainAmount} mm</span>
                </div>
              </div>

              {/* Feels Like */}
              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Thermometer size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Feels Like</span>
                  <span className="metric-val">{convertTemp(commuteAnalysis.feelsLike)}°</span>
                </div>
              </div>

              {/* Wind & Gusts */}
              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Wind size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Wind</span>
                  <span className="metric-val">{commuteAnalysis.windSpeed} km/h</span>
                </div>
              </div>

              {/* Visibility */}
              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Eye size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Visibility</span>
                  <span className="metric-val">{commuteAnalysis.visibility} km</span>
                </div>
              </div>

              {/* Condition */}
              <div className="metric-pill">
                <div className="metric-icon-box">
                  <Sparkles size={18} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Condition</span>
                  <span className="metric-val" style={{ fontSize: '0.92rem' }}>
                    {commuteAnalysis.conditionText}
                  </span>
                </div>
              </div>
            </div>

            {/* Deterministic Umbrella Notice Box */}
            <div
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background:
                  commuteAnalysis.rainRisk >= 60
                    ? 'rgba(239, 68, 68, 0.15)'
                    : commuteAnalysis.rainRisk >= 30
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${
                  commuteAnalysis.rainRisk >= 60
                    ? 'rgba(239, 68, 68, 0.35)'
                    : commuteAnalysis.rainRisk >= 30
                    ? 'rgba(245, 158, 11, 0.35)'
                    : 'rgba(16, 185, 129, 0.3)'
                }`,
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Umbrella
                size={20}
                color={
                  commuteAnalysis.rainRisk >= 60
                    ? '#ef4444'
                    : commuteAnalysis.rainRisk >= 30
                    ? '#f59e0b'
                    : '#10b981'
                }
                style={{ flexShrink: 0 }}
              />
              <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 500 }}>
                {commuteAnalysis.umbrellaNotice}
              </div>
            </div>

            {/* Transit Conditions Recommendation */}
            <div
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 23, 42, 0.45)',
                border: '1px solid var(--card-border)',
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <ShieldCheck size={18} color="var(--theme-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transit Recommendation
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                  {commuteAnalysis.recommendation}
                </div>
              </div>
            </div>

            {/* Extreme Condition Warnings (if any) */}
            {commuteAnalysis.extremeAlerts && commuteAnalysis.extremeAlerts.length > 0 && (
              <div style={{ marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {commuteAnalysis.extremeAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                    }}
                  >
                    <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>⚠️ {alert.title}:</strong> {alert.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Weather Shift Notification */}
            {commuteAnalysis.weatherShift && (
              <div
                style={{
                  padding: '0.85rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fef08a',
                  fontSize: '0.88rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                <Info size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span>{commuteAnalysis.weatherShift}</span>
              </div>
            )}

            {/* Feature 4: Best Departure Time Highlight */}
            {departureRecommendation && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: departureRecommendation.isCurrentSelected
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(56, 189, 248, 0.1)',
                  border: `1px solid ${
                    departureRecommendation.isCurrentSelected
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(56, 189, 248, 0.3)'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles
                      size={18}
                      color={departureRecommendation.isCurrentSelected ? '#10b981' : 'var(--theme-accent)'}
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: departureRecommendation.isCurrentSelected ? '#6ee7b7' : 'var(--theme-accent)',
                      }}
                    >
                      {departureRecommendation.isCurrentSelected
                        ? 'Selected Time Is Optimal'
                        : `Recommended Departure: ${departureRecommendation.recommendedTime}`}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Departure Comparison (±30m)
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {departureRecommendation.reason}
                </p>

                {/* Nearby Alternatives Offset Buttons */}
                {!departureRecommendation.isCurrentSelected && departureRecommendation.candidates && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: '0.85rem',
                    }}
                  >
                    {departureRecommendation.candidates.map((cand) => {
                      const isRec = cand.timeLabel === departureRecommendation.recommendedTime;
                      const isCurrent = cand.offsetMinutes === 0;

                      return (
                        <button
                          key={cand.offsetMinutes}
                          type="button"
                          onClick={() => {
                            const hours = String(cand.departureDate.getHours()).padStart(2, '0');
                            const mins = String(cand.departureDate.getMinutes()).padStart(2, '0');
                            setTimeInput(`${hours}:${mins}`);
                          }}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: isRec
                              ? 'var(--theme-accent)'
                              : isCurrent
                              ? 'var(--card-border)'
                              : 'transparent',
                            background: isRec ? 'var(--badge-bg)' : 'rgba(15, 23, 42, 0.5)',
                            color: isRec ? 'var(--theme-accent)' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: isRec ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'var(--transition-smooth)',
                          }}
                        >
                          <span>{cand.timeLabel}</span>
                          <span style={{ opacity: 0.75 }}>({cand.score} pts)</span>
                          {isRec && <CheckCircle2 size={12} color="var(--theme-accent)" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
