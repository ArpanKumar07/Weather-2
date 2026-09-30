import React, { useMemo, useState } from 'react';
import { Brain, Copy, Plus, Trash2, ArrowDown, Sun, CloudRain, Wind, AlertTriangle, Sparkles, Clock3 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

function getWeatherForTime(hourly, time) {
  if (!hourly?.length || !time) return null;
  const target = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

  return hourly.reduce((closest, item) => {
    if (!item?.time) return closest;
    const date = new Date(item.time);
    if (Number.isNaN(date.getTime())) return closest;
    const minutes = date.getHours() * 60 + date.getMinutes();
    const distance = Math.abs(minutes - target);
    return !closest || distance < closest.distance ? { item, distance } : closest;
  }, null)?.item || null;
}

function formatTime12(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
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

function weatherFlags(weather) {
  if (!weather) return { rain: 0, temp: 25, uv: 0, storm: false };
  const condition = (weather.condition_text || '').toLowerCase();
  return {
    rain: weather.precipitation_prob ?? 0,
    temp: weather.feels_like ?? weather.temperature ?? 25,
    uv: weather.uv_index ?? 0,
    storm: condition.includes('storm') || condition.includes('thunder'),
  };
}

function activityType(activity = '') {
  const text = activity.toLowerCase();
  if (/cricket|football|soccer|tennis|run|running|jog|walk|walking|cycling|bike|gym|exercise|workout|sport/.test(text)) return 'outdoor';
  if (/travel|commute|return|college|school|office|drive|ride|bus|metro/.test(text)) return 'travel';
  return 'general';
}

function getWarning(weather, activity) {
  if (!weather) return null;
  const f = weatherFlags(weather);
  const type = activityType(activity);

  if (f.storm || f.rain >= 70) return 'Rain/storm risk';
  if (type === 'outdoor' && f.rain >= 50) return 'Outdoor activity may be affected by rain';
  if (type === 'outdoor' && (f.temp >= 35 || f.uv >= 8)) return 'High heat/UV for outdoor activity';
  if (type === 'travel' && f.rain >= 50) return 'Rain may affect your travel';
  if (f.temp >= 38) return 'Very high heat';
  return null;
}

function scoreWeather(weather, type) {
  const f = weatherFlags(weather);
  let score = f.rain * 1.5 + Math.max(0, f.temp - 30) * 7 + Math.max(0, f.uv - 6) * 5;
  if (f.storm) score += 120;
  if (type === 'outdoor') score += f.rain * 1.2 + Math.max(0, f.temp - 33) * 8;
  if (type === 'travel') score += f.rain * 1.8 + (f.storm ? 40 : 0);
  return score;
}

function getActivityWindow(activity = '', currentMinutes) {
  const text = activity.toLowerCase();

  // Suggestions should stay realistic for the activity. In particular,
  // meals should never be moved to unreasonable hours such as 5 AM.
  if (/lunch|luncheon/.test(text)) return [11 * 60, 14 * 60 + 30];
  if (/breakfast/.test(text)) return [6 * 60, 10 * 60 + 30];
  if (/dinner|supper/.test(text)) return [18 * 60, 21 * 60 + 30];
  if (/sleep|bed/.test(text)) return [21 * 60, 24 * 60];
  if (/college|school|class|lecture|lab|office|work/.test(text)) return [7 * 60, 19 * 60];
  if (/cricket|football|soccer|tennis|run|running|jog|walk|walking|cycling|bike|gym|exercise|workout|sport/.test(text)) {
    // Keep outdoor activities in normal active hours.
    return [6 * 60, 21 * 60];
  }
  if (/travel|commute|return|drive|ride|bus|metro/.test(text)) return [6 * 60, 23 * 60];

  // For a generic activity, stay close to the original time rather than
  // proposing a completely different part of the day.
  return [Math.max(0, currentMinutes - 180), Math.min(23 * 60 + 30, currentMinutes + 180)];
}

function findBetterTime(hourly, currentTime, activity) {
  if (!hourly?.length || !currentTime) return null;

  const type = activityType(activity);
  const current = Number(currentTime.slice(0, 2)) * 60 + Number(currentTime.slice(3, 5));
  const currentWeather = getWeatherForTime(hourly, currentTime);
  if (!currentWeather) return null;
  const currentScore = scoreWeather(currentWeather, type);
  const [windowStart, windowEnd] = getActivityWindow(activity, current);

  const options = hourly
    .filter((item) => item?.time)
    .map((item) => {
      const date = new Date(item.time);
      if (Number.isNaN(date.getTime())) return null;
      const minutes = date.getHours() * 60 + date.getMinutes();
      const distance = Math.abs(minutes - current);
      return { item, minutes, distance, score: scoreWeather(item, type) };
    })
    .filter(Boolean)
    .filter((item) => item.minutes >= windowStart && item.minutes <= windowEnd)
    // Keep recommendations practical: don't move an activity more than
    // three hours unless there is no reasonable nearby alternative.
    .filter((item) => item.distance >= 45 && item.distance <= 180)
    .filter((item) => item.score + 12 < currentScore)
    .sort((a, b) => (a.score - b.score) || (a.distance - b.distance));

  if (!options.length) return null;

  const best = options[0];
  const bestTime = `${String(Math.floor(best.minutes / 60)).padStart(2, '0')}:${String(best.minutes % 60).padStart(2, '0')}`;
  return formatTime12(bestTime);
}

function TimePicker({ value, onChange }) {
  const [hour, minute, period] = (() => {
    const [h, m] = value.split(':').map(Number);
    return [h % 12 || 12, m, h >= 12 ? 'PM' : 'AM'];
  })();

  const update = (nextHour = hour, nextMinute = minute, nextPeriod = period) => {
    let h = nextHour % 12;
    if (nextPeriod === 'PM') h += 12;
    onChange(`${String(h).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);
  };

  return (
    <div className="weather-twin-time-picker" aria-label="Activity time">
      <Clock3 size={14} />
      <select value={hour} onChange={(e) => update(Number(e.target.value))} aria-label="Hour">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span>:</span>
      <select value={minute} onChange={(e) => update(hour, Number(e.target.value))} aria-label="Minute">
        {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
      </select>
      <select value={period} onChange={(e) => update(hour, minute, e.target.value)} aria-label="AM or PM">
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  );
}

export default function WeatherTwin() {
  const { currentWeather, tempUnit, convertTemp } = useWeather();
  const [plan, setPlan] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [copied, setCopied] = useState(false);
    // =========================
  // WHAT-IF WEATHER SIMULATOR
  // =========================
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [whatIfActivityIndex, setWhatIfActivityIndex] = useState(0);
  const [whatIfRain, setWhatIfRain] = useState(0);
  const [whatIfTemp, setWhatIfTemp] = useState(0);
  const [whatIfWind, setWhatIfWind] = useState(0);
  const [whatIfTimeShift, setWhatIfTimeShift] = useState(0);

  const simulation = useMemo(() => plan.map((entry) => {
    const weather = getWeatherForTime(currentWeather?.hourly, entry.time);
    const warning = getWarning(weather, entry.activity);
    return {
      ...entry,
      weather,
      warning,
      betterTime: warning ? findBetterTime(currentWeather?.hourly, entry.time, entry.activity) : null,
    };
  }).sort((a, b) => {
    const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    return toMinutes(a.time) - toMinutes(b.time);
  }), [plan, currentWeather?.hourly]);

  const updatePlan = (index, field, value) => {
    setAnalyzed(false);
    setPlan((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addPlanItem = () => {
    setAnalyzed(false);
    setPlan((current) => [...current, { time: '18:00', activity: '' }]);
  };

  const removePlanItem = (index) => {
    setAnalyzed(false);
    setPlan((current) => current.filter((_, i) => i !== index));
  };

  const runSimulation = () => {
    if (!plan.length || plan.some((item) => !item.activity.trim())) return;
    setAnalyzed(true);
    setCopied(false);
  };

  const copySimulation = async () => {
    const text = simulation.map((item) => {
      const weather = item.weather;
      const suggestion = item.betterTime ? ` — Suggested: ${item.betterTime}` : '';
      return `${formatTime12(item.time)} - ${item.activity}: ${weather ? `${convertTemp(weather.temperature)}°${tempUnit}, ${weather.condition_text}` : 'Weather unavailable'}${suggestion}`;
    }).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { setCopied(false); }
  };
    // =========================
  // WHAT-IF CALCULATIONS
  // =========================
  const selectedWhatIfActivity = simulation[whatIfActivityIndex];

  const baseWeather = selectedWhatIfActivity?.weather;

  const baseRain = baseWeather?.precipitation_prob ?? 20;
  const baseTemp = baseWeather?.feels_like ?? baseWeather?.temperature ?? 28;
  const baseWind = baseWeather?.wind_speed ?? 12;

  const simulatedRain = Math.max(
    0,
    Math.min(100, baseRain + whatIfRain)
  );

  const simulatedTemp = baseTemp + whatIfTemp;

  const simulatedWind = Math.max(
    0,
    baseWind + whatIfWind
  );

  const calculateWhatIfScore = () => {
    let risk = 0;

    risk += simulatedRain * 1.2;

    if (simulatedTemp > 30) {
      risk += (simulatedTemp - 30) * 6;
    }

    if (simulatedTemp > 35) {
      risk += 20;
    }

    if (simulatedWind > 20) {
      risk += (simulatedWind - 20) * 2;
    }

    if (simulatedRain >= 70) {
      risk += 25;
    }

    return Math.max(
      0,
      Math.min(100, Math.round(100 - risk))
    );
  };

  const currentWhatIfScore = baseWeather
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            100 -
              baseRain * 1.2 -
              Math.max(0, baseTemp - 30) * 6 -
              Math.max(0, baseWind - 20) * 2
          )
        )
      )
    : 70;

  const whatIfScore = calculateWhatIfScore();

  const scoreDifference =
    whatIfScore - currentWhatIfScore;

  const getWhatIfStatus = () => {
    if (whatIfScore >= 80) {
      return {
        icon: '🟢',
        title: 'Excellent conditions',
        className: 'good',
      };
    }

    if (whatIfScore >= 60) {
      return {
        icon: '🟡',
        title: 'Mostly suitable',
        className: 'moderate',
      };
    }

    if (whatIfScore >= 40) {
      return {
        icon: '🟠',
        title: 'Use caution',
        className: 'warning',
      };
    }

    return {
      icon: '🔴',
      title: 'Poor conditions',
      className: 'danger',
    };
  };

  const whatIfStatus = getWhatIfStatus();

  const applyWhatIfPreset = (preset) => {
    if (preset === 'rain') {
      setWhatIfRain(60);
      setWhatIfTemp(0);
      setWhatIfWind(5);
    }

    if (preset === 'heat') {
      setWhatIfRain(0);
      setWhatIfTemp(7);
      setWhatIfWind(0);
    }

    if (preset === 'wind') {
      setWhatIfRain(0);
      setWhatIfTemp(0);
      setWhatIfWind(20);
    }

    if (preset === 'better') {
      setWhatIfRain(-15);
      setWhatIfTemp(-2);
      setWhatIfWind(-5);
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
            Add your activities and MAUSAM360 will simulate the weather you are likely to experience throughout your day.
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

          {plan.length === 0 && (
            <div className="weather-twin-empty-plan">Add activities to build your day.</div>
          )}

          {plan.map((item, index) => (
            <div className="weather-twin-input-row" key={`${index}-${item.time}`}>
              <TimePicker value={item.time} onChange={(value) => updatePlan(index, 'time', value)} />
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

          <button
            type="button"
            className="weather-twin-plan-button"
            onClick={runSimulation}
            disabled={!plan.length || plan.some((item) => !item.activity.trim())}
          >
            <Sparkles size={15} />
            PLAN MY DAY
          </button>
        </div>

        <div className="weather-twin-result">
          <div className="weather-twin-result-top">
            <span>YOUR DAY WEATHER SIMULATION</span>
            {analyzed && (
              <button type="button" className="weather-twin-copy" onClick={copySimulation} title="Copy simulation">
                <Copy size={17} />
              </button>
            )}
          </div>

          {!analyzed ? (
            <div className="weather-twin-result-empty">
              <Sparkles size={25} />
              <span>Your simulation will appear here.</span>
              <small>Add your activities, then click <strong>PLAN MY DAY</strong>.</small>
            </div>
          ) : (
            <>
              <div className="weather-twin-timeline">
                {simulation.map((item, index) => {
                  const weather = item.weather;
                  const meta = getConditionMeta(weather);
                  return (
                    <React.Fragment key={`${item.time}-${index}`}>
                      <div className="weather-twin-row">
                        <span className="weather-twin-time">{formatTime12(item.time)}</span>
                        <span className={`weather-twin-dot ${meta.tone}`}>{meta.icon}</span>
                        <span className="weather-twin-activity">{item.activity}</span>
                        <span className="weather-twin-temp">{weather ? `${convertTemp(weather.temperature)}°${tempUnit}` : '--'}</span>
                        {weather && (weather.precipitation_prob ?? 0) >= 50 && <CloudRain size={14} className="weather-twin-rain" />}
                        {weather && (weather.uv_index ?? 0) >= 6 && <Sun size={14} className="weather-twin-uv" />}
                      </div>
                      {item.warning && (
                        <div className={`weather-twin-suggestion ${item.betterTime ? 'has-time' : ''}`}>
                          <AlertTriangle size={13} />
                          <span>{item.warning}{item.betterTime ? ` → Consider moving it to ${item.betterTime}.` : '.'}</span>
                        </div>
                      )}
                      {index < simulation.length - 1 && <div className="weather-twin-arrow"><ArrowDown size={13} /></div>}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="weather-twin-notice warning">
                <Wind size={16} />
                <span>
                  {simulation.some((item) => item.betterTime)
                    ? 'MAUSAM360 found timing changes that may make your day more weather-friendly.'
                    : 'Your planned activities currently have no major timing changes recommended.'}
                </span>
              </div>

              {copied && <div className="weather-twin-copied">Simulation copied.</div>}
            </>
          )}
        </div>
      </div>
            {/* =========================================
          WHAT-IF WEATHER SIMULATOR
      ========================================= */}

      <div className="what-if-simulator">

        <div className="what-if-title-row">

          <div>
            <span className="what-if-kicker">
              SCENARIO LAB
            </span>

            <h3>
              🔮 What-If Weather Simulator
            </h3>

            <p>
              Change weather conditions and see how your
              activity would be affected.
            </p>
          </div>

          <button
            type="button"
            className="what-if-toggle"
            onClick={() => setWhatIfOpen(!whatIfOpen)}
          >
            {whatIfOpen
              ? 'Close Simulator'
              : 'Try What-If'}
          </button>

        </div>


        {whatIfOpen && (

          <div className="what-if-body">

            {/* Activity selector */}

            <div className="what-if-field">

              <label>
                Select Activity
              </label>

              <select
                value={whatIfActivityIndex}
                onChange={(e) =>
                  setWhatIfActivityIndex(
                    Number(e.target.value)
                  )
                }
              >

                {simulation.length === 0 ? (
                  <option value={0}>
                    Plan an activity first
                  </option>
                ) : (
                  simulation.map((item, index) => (
                    <option
                      key={`${item.time}-${index}`}
                      value={index}
                    >
                      {formatTime12(item.time)} — {item.activity}
                    </option>
                  ))
                )}

              </select>

            </div>


            {/* Quick scenarios */}

            <div className="what-if-section">

              <div className="what-if-section-title">
                Quick Scenarios
              </div>

              <div className="what-if-presets">

                <button
                  type="button"
                  className="what-if-preset"
                  onClick={() =>
                    applyWhatIfPreset('rain')
                  }
                >
                  🌧️ Heavy Rain
                </button>

                <button
                  type="button"
                  className="what-if-preset"
                  onClick={() =>
                    applyWhatIfPreset('heat')
                  }
                >
                  🔥 Heatwave
                </button>

                <button
                  type="button"
                  className="what-if-preset"
                  onClick={() =>
                    applyWhatIfPreset('wind')
                  }
                >
                  💨 Strong Wind
                </button>

                <button
                  type="button"
                  className="what-if-preset"
                  onClick={() =>
                    applyWhatIfPreset('better')
                  }
                >
                  🌤️ Better Conditions
                </button>

              </div>

            </div>


            {/* Sliders */}

            <div className="what-if-controls">

              <div className="what-if-control">

                <div className="what-if-control-head">
                  <span>
                    🌧️ Rain Probability
                  </span>

                  <strong>
                    {whatIfRain > 0 ? '+' : ''}
                    {whatIfRain}%
                  </strong>
                </div>

                <input
                  type="range"
                  min="-30"
                  max="80"
                  value={whatIfRain}
                  onChange={(e) =>
                    setWhatIfRain(
                      Number(e.target.value)
                    )
                  }
                />

              </div>


              <div className="what-if-control">

                <div className="what-if-control-head">
                  <span>
                    🌡️ Temperature
                  </span>

                  <strong>
                    {whatIfTemp > 0 ? '+' : ''}
                    {whatIfTemp}°C
                  </strong>
                </div>

                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={whatIfTemp}
                  onChange={(e) =>
                    setWhatIfTemp(
                      Number(e.target.value)
                    )
                  }
                />

              </div>


              <div className="what-if-control">

                <div className="what-if-control-head">
                  <span>
                    💨 Wind Speed
                  </span>

                  <strong>
                    {whatIfWind > 0 ? '+' : ''}
                    {whatIfWind} km/h
                  </strong>
                </div>

                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={whatIfWind}
                  onChange={(e) =>
                    setWhatIfWind(
                      Number(e.target.value)
                    )
                  }
                />

              </div>


              <div className="what-if-control">

                <div className="what-if-control-head">
                  <span>
                    🕐 Move Activity
                  </span>

                  <strong>
                    {whatIfTimeShift > 0 ? '+' : ''}
                    {whatIfTimeShift} hour
                  </strong>
                </div>

                <input
                  type="range"
                  min="-2"
                  max="3"
                  step="1"
                  value={whatIfTimeShift}
                  onChange={(e) =>
                    setWhatIfTimeShift(
                      Number(e.target.value)
                    )
                  }
                />

              </div>

            </div>


            {/* Current vs What-If */}

            <div className="what-if-comparison">

              <div className="what-if-card current">

                <span className="what-if-card-label">
                  CURRENT PLAN
                </span>

                <div className="what-if-score">
                  {currentWhatIfScore}
                  <small>/100</small>
                </div>

                <div className="what-if-metrics">

                  <span>
                    🌧️ Rain: {baseRain}%
                  </span>

                  <span>
                    🌡️ Temp: {Math.round(baseTemp)}°C
                  </span>

                  <span>
                    💨 Wind: {Math.round(baseWind)} km/h
                  </span>

                </div>

              </div>


              <div className="what-if-arrow">
                →
              </div>


              <div className="what-if-card scenario">

                <span className="what-if-card-label">
                  WHAT-IF SCENARIO
                </span>

                <div className="what-if-score">
                  {whatIfScore}
                  <small>/100</small>
                </div>

                <div className="what-if-metrics">

                  <span>
                    🌧️ Rain: {simulatedRain}%
                  </span>

                  <span>
                    🌡️ Temp: {Math.round(simulatedTemp)}°C
                  </span>

                  <span>
                    💨 Wind: {Math.round(simulatedWind)} km/h
                  </span>

                </div>

              </div>

            </div>


            {/* Result */}

            <div
              className={`what-if-result ${whatIfStatus.className}`}
            >

              <div className="what-if-result-icon">
                {whatIfStatus.icon}
              </div>

              <div>

                <strong>

                  {scoreDifference > 0
                    ? `Scenario improves your score by ${scoreDifference} points`
                    : scoreDifference < 0
                    ? `Scenario reduces your score by ${Math.abs(scoreDifference)} points`
                    : 'Scenario keeps the same score'}

                </strong>

                <p>
                  {whatIfStatus.title}
                </p>

              </div>

            </div>

          </div>

        )}

      </div>
    </section>
  );
}
