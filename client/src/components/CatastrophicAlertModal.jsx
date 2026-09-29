import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Waves,
  CloudLightning,
  Wind,
  ThermometerSnowflake,
  Activity,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  Info,
} from 'lucide-react';
import { analyzeWeatherHazards, getSimulatedScenario } from '../utils/catastrophicAlerts';

export default function CatastrophicAlertModal({
  isOpen,
  onClose,
  weather,
}) {
  const [selectedScenario, setSelectedScenario] = useState('live'); // 'live' | 'flood' | 'heatstroke' | 'storm' | 'relief'

  // Determine current evaluation based on scenario selection
  const evaluation = useMemo(() => {
    if (selectedScenario === 'live') {
      return analyzeWeatherHazards(weather);
    }
    return getSimulatedScenario(selectedScenario, weather?.city_name || 'Kolkata');
  }, [selectedScenario, weather]);

  if (!isOpen) return null;

  const { hasCatastrophicEvent, hazards, relief, cityName, timestamp } = evaluation;

  // Icon mapping
  const renderHazardIcon = (iconName) => {
    switch (iconName) {
      case 'Waves':
        return <Waves size={26} color="#ef4444" />;
      case 'Flame':
        return <Flame size={26} color="#f97316" />;
      case 'CloudLightning':
        return <CloudLightning size={26} color="#a855f7" />;
      case 'Wind':
        return <Wind size={26} color="#38bdf8" />;
      case 'ThermometerSnowflake':
        return <ThermometerSnowflake size={26} color="#67e8f9" />;
      default:
        return <AlertTriangle size={26} color="#ef4444" />;
    }
  };

  const renderMetricIcon = (iconName) => {
    switch (iconName) {
      case 'Waves':
        return <Waves size={18} color="#10b981" />;
      case 'Flame':
        return <Flame size={18} color="#10b981" />;
      case 'CloudLightning':
        return <CloudLightning size={18} color="#10b981" />;
      case 'Wind':
        return <Wind size={18} color="#10b981" />;
      default:
        return <CheckCircle2 size={18} color="#10b981" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content alert-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="modal-close" onClick={onClose} title="Close Alert Center">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="alert-modal-header">
          <div
            className={`alert-modal-badge-icon ${
              hasCatastrophicEvent ? 'danger-glow' : 'safe-glow'
            }`}
          >
            {hasCatastrophicEvent ? (
              <ShieldAlert size={28} color="#ef4444" />
            ) : (
              <ShieldCheck size={28} color="#10b981" />
            )}
          </div>
          <div>
            <div className="alert-modal-pretitle">
              <span className="live-radar-dot" style={{ background: hasCatastrophicEvent ? '#ef4444' : '#10b981' }} />
              {cityName} • {hasCatastrophicEvent ? 'ACTIVE HAZARD WARNING' : 'ATMOSPHERIC RELIEF'} • {timestamp}
            </div>
            <h2 className="alert-modal-title">
              {hasCatastrophicEvent
                ? 'Catastrophic Weather Advisory'
                : 'Weather Relief & Safety Status'}
            </h2>
          </div>
        </div>

        {/* Scenario Preview Controls (Lets user/evaluator test Flood, Heatstroke, & Relief immediately) */}
        <div className="alert-scenario-bar">
          <span className="scenario-label">Simulation Test:</span>
          <div className="scenario-chips">
            <button
              className={`scenario-chip ${selectedScenario === 'live' ? 'active' : ''}`}
              onClick={() => setSelectedScenario('live')}
              title="Real-time telemetry for current city"
            >
              📡 Live Radar
            </button>
            <button
              className={`scenario-chip ${selectedScenario === 'flood' ? 'active-danger' : ''}`}
              onClick={() => setSelectedScenario('flood')}
              title="Simulate severe urban flood warning"
            >
              🌊 Flood Alert
            </button>
            <button
              className={`scenario-chip ${selectedScenario === 'heatstroke' ? 'active-warning' : ''}`}
              onClick={() => setSelectedScenario('heatstroke')}
              title="Simulate extreme heatstroke warning"
            >
              ☀️ Heatstroke Alert
            </button>
            <button
              className={`scenario-chip ${selectedScenario === 'storm' ? 'active-storm' : ''}`}
              onClick={() => setSelectedScenario('storm')}
              title="Simulate violent storm warning"
            >
              ⚡ Storm Alert
            </button>
            <button
              className={`scenario-chip ${selectedScenario === 'relief' ? 'active-safe' : ''}`}
              onClick={() => setSelectedScenario('relief')}
              title="Simulate pure relief state"
            >
              🟢 Relief State
            </button>
          </div>
        </div>

        {/* Content Body: Danger Alerts OR Relief State */}
        <div className="alert-modal-body">
          {hasCatastrophicEvent ? (
            /* ================= CATASTROPHIC ALERT STATE ================= */
            <div className="hazards-list">
              <div className="emergency-broadcast-banner">
                <AlertTriangle size={20} className="alert-siren-anim" />
                <span>
                  <strong>CRITICAL ADVISORY:</strong> One or more life-threatening weather thresholds exceeded in {cityName}!
                </span>
              </div>

              {hazards.map((hazard) => (
                <div
                  key={hazard.id}
                  className="hazard-card"
                  style={{
                    background: hazard.bgGradient,
                    borderColor: hazard.borderColor,
                  }}
                >
                  <div className="hazard-card-header">
                    <div className="hazard-icon-box">
                      {renderHazardIcon(hazard.icon)}
                    </div>
                    <div className="hazard-header-text">
                      <div className="hazard-severity-tag" style={{ color: hazard.color }}>
                        {hazard.badge}
                      </div>
                      <h3 className="hazard-title">{hazard.title}</h3>
                    </div>
                  </div>

                  <div className="hazard-summary">
                    <p><strong>Condition:</strong> {hazard.summary}</p>
                    <div className="hazard-threshold-pill">
                      <Activity size={14} color={hazard.color} />
                      <span>{hazard.thresholdExceeded}</span>
                    </div>
                  </div>

                  <div className="hazard-impact-box">
                    <span className="impact-label">⚠️ Imminent Threat & Impact:</span>
                    <p>{hazard.impact}</p>
                  </div>

                  <div className="hazard-precautions-box">
                    <div className="precautions-title">
                      <ShieldAlert size={16} color={hazard.color} />
                      <span>Life-Saving Safety Precautions:</span>
                    </div>
                    <ul className="precautions-list">
                      {hazard.precautions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {hazard.emergencyCallout && (
                    <div className="hazard-callout">
                      <Info size={16} />
                      <span>{hazard.emergencyCallout}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* ================= RELIEF STATE (NO DANGER) ================= */
            <div className="relief-container">
              <div className="relief-hero-banner">
                <div className="relief-icon-pulse">
                  <CheckCircle2 size={44} color="#10b981" />
                </div>
                <div className="relief-hero-text">
                  <div className="relief-badge">{relief.badge}</div>
                  <h3 className="relief-headline">{relief.headline}</h3>
                  <p className="relief-message">{relief.message}</p>
                </div>
              </div>

              {/* Metrics Status Grid */}
              <div className="relief-grid">
                {relief.metrics.map((metric) => (
                  <div key={metric.id} className="relief-metric-card">
                    <div className="relief-metric-header">
                      <div className="relief-metric-icon">
                        {renderMetricIcon(metric.icon)}
                      </div>
                      <span className="relief-metric-status">{metric.status}</span>
                    </div>
                    <div className="relief-metric-name">{metric.label}</div>
                    <div className="relief-metric-val">{metric.value}</div>
                    <div className="relief-metric-detail">{metric.detail}</div>
                  </div>
                ))}
              </div>

              {/* Relief Reassurance Card */}
              <div className="relief-reassurance-card">
                <Sparkles size={20} color="#10b981" />
                <div>
                  <strong>Atmospheric Stability Verified:</strong> Ambient temperatures, moisture density, and barometric trends pose zero imminent flood or heatstroke hazard. Enjoy your commute, exercise, or outdoor schedule safely!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Emergency Contacts */}
        <div className="alert-modal-footer">
          <div className="alert-emergency-helpline">
            <PhoneCall size={16} color="var(--text-muted)" />
            <span>Emergency Services: <strong>112</strong> / National Disaster Response: <strong>1078</strong></span>
          </div>
          <button className="btn-pill btn-pill-primary" onClick={onClose}>
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
