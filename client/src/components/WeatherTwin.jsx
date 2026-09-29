import React, { useMemo, useState } from 'react';
import { Brain, Copy, Plus, Trash2, ArrowDown, Sun, CloudRain, Wind, AlertTriangle } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

const DEFAULT_PLAN = [
  { time: '08:00', activity: 'College' },
  { time: '13:00', activity: 'Lunch outside' },
  { time: '17:00', activity: 'Cricket' },
  { time: '20:00', activity: 'Return home' },
];

function getWeatherForTime(hourly, time) {
  if (!hourly?.length || !time) return null;
  const targetHour = Number(time.slice(0, 2));

  return hourly.reduce((closest, item) => {
    const hour = Number(String(item.time || '').slice(11, 13));
    if (!Number.isFinite(hour)) return closest;
    const distance = Math.min(Math.abs(hour - targetHour), 24 - Math.abs(hour - targetHour));
    return !closest || distance < closest.distance ? { item, distance } : closest;
  }, null)?.item || null;
}

function getConditionMeta(weather) {
  if (!weather) return { icon: <CloudRain size={15} />, tone: 'neutral' };
  const text = (weather.condition_text || '').toLowerCase();
  if (text.includes('rain') || text.includes('drizzle') || text.includes('storm')) {
    return { icon: <CloudRain size={15} />, tone: 'bad' };
  }
  if ((weather.uv_index ?? 0) >= 6) return { icon: <Sun size={15} />, tone: 'warn' };
  return { icon: <Sun size={15} />, tone: 'good' };
}

function getWarning(weather, activity) {
  if (!weather) return null;
  const rain = weather.precipitation_prob ?? 0;
  const uv = weather.uv_index ?? 0;
  const temp = weather.temperature ?? 0;
  const text = (weather.condition_text || '').toLowerCase();

  if (text.includes('storm') || rain >= 70) return `${activity} may be affected by rain or storms.`;
  if (uv >= 8) return `${activity} has very high UV conditions.`;
  if (temp >= 35) return `${activity} may feel very hot at ${Math.round(temp)}°C.`;
  if (rain >= 50) return `${activity} has unfavorable rain conditions.`;
  return null;
}

export default function WeatherTwin() {
  const { currentWeather, tempUnit, convertTemp } = useWeather();
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [copied, setCopied] = useState(false);

  const simulation = useMemo(() => {
    return plan.map((entry) => ({
      ...entry,
      weather: getWeatherForTime(currentWeather?.hourly, entry.time),
    }));
  }, [plan, currentWeather?.hourly]);

  const warning = simulation.find((entry) => getWarning(entry.weather, entry.activity));

  const updatePlan = (index, field, value) => {
    setPlan((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addPlanItem = () => setPlan((current) => [...current, { time: '18:00', activity: 'New activity' }]);

  const removePlanItem = (index) => {
    setPlan((current) => current.filter((_, i) => i !== index));
  };

  const copySimulation = async () => {
    const text = simulation
      .map((item) => `${item.time} - ${item.activity}: ${item.weather ? `${convertTemp(item.weather.temperature)}°${tempUnit}, ${item.weather.condition_text}` : 'Weather unavailable'}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  if (!currentWeather?.hourly) return null;

  return (
    <section className="weather-twin" id="weather-twin">
      <div className="section-title-row weather-twin-heading">
        <div>
          <h2 className="section-title">
            <Brain size={22} color="var(--theme-accent)" />
            <span>Weather Twin — Digital Twin of Your Day</span>
          </h2>
          <div className="weather-twin-subtitle">
            Enter your plan and MAUSAM360 simulates the weather you are likely to experience throughout the day.
          </div>
        </div>
      </div>

      <div className="weather-twin-layout">
        <div className="weather-twin-planner">
          <div className="weather-twin-plan-header">
            <span>Your day</span>
            <button type="button" className="weather-twin-add" onClick={addPlanItem}>
              <Plus size={14} /> Add activity
            </button>
          </div>

          {plan.map((item, index) => (
            <div className="weather-twin-input-row" key={`${index}-${item.time}`}>
              <input
                type="time"
                value={item.time}
                onChange={(e) => updatePlan(index, 'time', e.target.value)}
                aria-label="Activity time"
              />
              <input
                type="text"
                value={item.activity}
                onChange={(e) => updatePlan(index, 'activity', e.target.value)}
                placeholder="Activity"
                aria-label="Activity name"
              />
              {plan.length > 1 && (
                <button type="button" className="weather-twin-delete" onClick={() => removePlanItem(index)} aria-label="Remove activity">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="weather-twin-result">
          <div className="weather-twin-result-top">
            <span>YOUR DAY WEATHER SIMULATION</span>
            <button type="button" className="weather-twin-copy" onClick={copySimulation} title="Copy simulation">
              <Copy size={17} />
            </button>
          </div>

          <div className="weather-twin-timeline">
            {simulation.map((item, index) => {
              const weather = item.weather;
              const meta = getConditionMeta(weather);
              return (
                <React.Fragment key={`${item.time}-${index}`}>
                  <div className="weather-twin-row">
                    <span className="weather-twin-time">{item.time}</span>
                    <span className={`weather-twin-dot ${meta.tone}`}>{meta.icon}</span>
                    <span className="weather-twin-activity">{item.activity}</span>
                    <span className="weather-twin-temp">
                      {weather ? `${convertTemp(weather.temperature)}°${tempUnit}` : '--'}
                    </span>
                    {weather && (weather.precipitation_prob ?? 0) >= 50 && <CloudRain size={14} className="weather-twin-rain" />}
                    {weather && (weather.uv_index ?? 0) >= 6 && <Sun size={14} className="weather-twin-uv" />}
                  </div>
                  {index < simulation.length - 1 && <div className="weather-twin-arrow"><ArrowDown size={13} /></div>}
                </React.Fragment>
              );
            })}
          </div>

          <div className={`weather-twin-notice ${warning ? 'warning' : 'good'}`}>
            {warning ? <AlertTriangle size={16} /> : <Wind size={16} />}
            <span>{warning ? getWarning(warning.weather, warning.activity) : 'Your planned day currently has favorable weather conditions.'}</span>
          </div>

          {copied && <div className="weather-twin-copied">Simulation copied.</div>}
        </div>
      </div>
    </section>
  );
}
