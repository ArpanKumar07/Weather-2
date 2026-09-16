import React from 'react';
import {
  Umbrella,
  SunDim,
  Sun,
  Shirt,
  Flame,
  Wind,
  Droplets,
  ThermometerSnowflake,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

const adviceIconMap = {
  Umbrella,
  SunDim,
  Sun,
  Shirt,
  Flame,
  Wind,
  Droplets,
  ThermometerSnowflake,
  Smile,
};

export default function SmartAdvice() {
  const { currentWeather } = useWeather();
  if (!currentWeather) return null;

  const adviceList = currentWeather.advice || [];

  return (
    <div className="card-glass" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-title-row" style={{ marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ fontSize: '1.2rem' }}>
          <ShieldCheck size={20} color="var(--theme-accent)" />
          <span>Smart Weather Advice</span>
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Live Advisories
        </span>
      </div>

      <div className="advice-container">
        {adviceList.map((item) => {
          const IconComp = adviceIconMap[item.icon] || ShieldCheck;
          return (
            <div key={item.id} className={`advice-card ${item.type}`}>
              <div className="advice-icon-wrap">
                <IconComp size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="advice-title">{item.title}</div>
                <p className="advice-message">{item.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
