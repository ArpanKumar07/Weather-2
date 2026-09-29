import React, { useMemo, useState } from 'react';
import { CalendarClock, Sparkles, X, CheckCircle2, AlertTriangle, Umbrella, Dumbbell, GraduationCap, Car } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

const DEFAULTS = {
  wake: '07:00',
  collegeStart: '09:00',
  collegeEnd: '15:00',
  gym: '17:00',
  travel: '19:00',
};

function getForecast(hourly, time) {
  if (!Array.isArray(hourly) || !hourly.length || !time) return null;
  const targetHour = Number(time.slice(0, 2));
  const targetMinute = Number(time.slice(3, 5));

  return hourly.reduce((closest, item) => {
    if (!item?.time) return closest;
    const date = new Date(item.time);
    if (Number.isNaN(date.getTime())) return closest;
    const minutes = date.getHours() * 60 + date.getMinutes();
    const target = targetHour * 60 + targetMinute;
    const distance = Math.abs(minutes - target);
    return !closest || distance < closest.distance ? { item, distance } : closest;
  }, null)?.item || null;
}

function label(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function weatherFlags(weather) {
  if (!weather) return { rain: 0, temp: 25, uv: 0, wind: 0, storm: false };
  const condition = (weather.condition_text || '').toLowerCase();
  return {
    rain: weather.precipitation_prob ?? 0,
    temp: weather.feels_like ?? weather.temperature ?? 25,
    uv: weather.uv_index ?? 0,
    wind: weather.wind_speed ?? 0,
    storm: condition.includes('storm') || condition.includes('thunder'),
  };
}

function commuteMessage(weather) {
  const f = weatherFlags(weather);
  if (!weather) return { text: 'Forecast unavailable', tone: 'neutral', icon: <AlertTriangle size={15} /> };
  if (f.storm || f.rain >= 60) return { text: 'Rain possible → carry umbrella', tone: 'bad', icon: <Umbrella size={15} /> };
  if (f.rain >= 35) return { text: 'Some rain possible → keep an umbrella handy', tone: 'warn', icon: <Umbrella size={15} /> };
  if (f.temp >= 35) return { text: 'Hot commute → stay hydrated', tone: 'warn', icon: <AlertTriangle size={15} /> };
  return { text: 'Comfortable commute', tone: 'good', icon: <CheckCircle2 size={15} /> };
}

function outdoorMessage(weather) {
  const f = weatherFlags(weather);
  if (!weather) return { text: 'Forecast unavailable', tone: 'neutral', icon: <AlertTriangle size={15} /> };
  if (f.storm || f.rain >= 50) return { text: 'Outdoor exercise not recommended', tone: 'bad', icon: <AlertTriangle size={15} /> };
  if (f.temp >= 35 || f.uv >= 8) return { text: 'High heat/UV → exercise with caution', tone: 'warn', icon: <Dumbbell size={15} /> };
  return { text: 'Good conditions for outdoor exercise', tone: 'good', icon: <Dumbbell size={15} /> };
}

function wakeMessage(weather) {
  const f = weatherFlags(weather);
  if (!weather) return { text: 'Forecast unavailable', tone: 'neutral', icon: <AlertTriangle size={15} /> };
  if (f.storm || f.rain >= 50) return { text: 'Rain risk → keep outdoor plans flexible', tone: 'bad', icon: <Umbrella size={15} /> };
  if (f.temp >= 34 || f.uv >= 7) return { text: 'Warm start → outdoor activity with care', tone: 'warn', icon: <AlertTriangle size={15} /> };
  return { text: 'Great for outdoor activity', tone: 'good', icon: <Sparkles size={15} /> };
}

export default function PlanMyDay() {
  const { currentWeather, convertTemp, tempUnit } = useWeather();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState(DEFAULTS);

  const analysis = useMemo(() => {
    const hourly = currentWeather?.hourly;
    if (!hourly?.length) return null;

    const wake = getForecast(hourly, plan.wake);
    const collegeStart = getForecast(hourly, plan.collegeStart);
    const collegeEnd = getForecast(hourly, plan.collegeEnd);
    const gym = getForecast(hourly, plan.gym);
    const travel = getForecast(hourly, plan.travel);

    const college = commuteMessage(collegeStart);
    const lunchTime = (() => {
      const start = Number(plan.collegeStart.slice(0, 2)) * 60 + Number(plan.collegeStart.slice(3));
      const end = Number(plan.collegeEnd.slice(0, 2)) * 60 + Number(plan.collegeEnd.slice(3));
      const middle = Math.round((start + end) / 2);
      return `${String(Math.floor(middle / 60)).padStart(2, '0')}:${String(middle % 60).padStart(2, '0')}`;
    })();
    const lunch = getForecast(hourly, lunchTime);
    const gymAdvice = outdoorMessage(gym);
    const travelAdvice = commuteMessage(travel);

    let recommendation = 'Your schedule is already well aligned with the forecast.';
    let recommendationType = 'good';

    if (gym && (weatherFlags(gym).rain >= 50 || weatherFlags(gym).storm || weatherFlags(gym).temp >= 35 || weatherFlags(gym).uv >= 8)) {
      const morningOptions = hourly
        .filter((item) => {
          const hour = new Date(item.time).getHours();
          return hour >= 5 && hour <= 10;
        })
        .map((item) => {
          const f = weatherFlags(item);
          const score = (f.rain * 2) + Math.max(0, f.temp - 28) * 5 + Math.max(0, f.uv - 5) * 4 + (f.storm ? 100 : 0);
          return { item, score };
        })
        .sort((a, b) => a.score - b.score);

      const best = morningOptions[0];
      if (best) {
        const bestTime = new Date(best.item.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        recommendation = `Move your workout to ${bestTime}.`;
        recommendationType = 'warn';
      } else {
        recommendation = 'Consider moving your workout indoors because of the forecast.';
        recommendationType = 'warn';
      }
    } else if (travel && (weatherFlags(travel).rain >= 60 || weatherFlags(travel).storm)) {
      recommendation = `Keep your ${label(plan.travel)} travel flexible and carry an umbrella.`;
      recommendationType = 'warn';
    } else if (lunch && weatherFlags(lunch).temp >= 35) {
      recommendation = `Make lunch an indoor break around ${label(lunchTime)} to avoid peak heat.`;
      recommendationType = 'warn';
    }

    return {
      rows: [
        { time: plan.wake, icon: <Sparkles size={15} />, title: 'Wake up', message: wakeMessage(wake) },
        { time: plan.collegeStart, icon: <GraduationCap size={15} />, title: 'College', message: college },
        { time: lunchTime, icon: <Sparkles size={15} />, title: 'Midday', message: (() => {
          const f = weatherFlags(lunch);
          if (f.rain >= 50) return { text: 'Rain possible → plan an indoor lunch', tone: 'bad', icon: <Umbrella size={15} /> };
          if (f.temp >= 35) return { text: `High heat → stay hydrated (${convertTemp(f.temp)}°${tempUnit})`, tone: 'warn', icon: <AlertTriangle size={15} /> };
          return { text: `Comfortable midday conditions (${convertTemp(f.temp)}°${tempUnit})`, tone: 'good', icon: <CheckCircle2 size={15} /> };
        })() },
        { time: plan.gym, icon: <Dumbbell size={15} />, title: 'Gym', message: gymAdvice },
        { time: plan.travel, icon: <Car size={15} />, title: 'Travel', message: travelAdvice },
      ],
      recommendation,
      recommendationType,
      collegeEnd,
    };
  }, [currentWeather?.hourly, plan, convertTemp, tempUnit]);

  const update = (key, value) => setPlan((current) => ({ ...current, [key]: value }));

  if (!currentWeather?.hourly) return null;

  return (
    <div className="plan-my-day">
      <button type="button" className="plan-my-day-trigger" onClick={() => setOpen((value) => !value)}>
        <CalendarClock size={16} />
        <span>✨ PLAN MY DAY</span>
      </button>

      {open && (
        <div className="plan-my-day-panel">
          <div className="plan-my-day-panel-header">
            <div>
              <h3>Your Weather-Optimized Day</h3>
              <p>Tell MAUSAM360 your schedule and it will compare each activity with the forecast.</p>
            </div>
            <button type="button" className="plan-my-day-close" onClick={() => setOpen(false)} aria-label="Close Plan My Day">
              <X size={17} />
            </button>
          </div>

          <div className="plan-my-day-form">
            <label>Wake up<input type="time" value={plan.wake} onChange={(e) => update('wake', e.target.value)} /></label>
            <label>College starts<input type="time" value={plan.collegeStart} onChange={(e) => update('collegeStart', e.target.value)} /></label>
            <label>College ends<input type="time" value={plan.collegeEnd} onChange={(e) => update('collegeEnd', e.target.value)} /></label>
            <label>Gym<input type="time" value={plan.gym} onChange={(e) => update('gym', e.target.value)} /></label>
            <label>Travel<input type="time" value={plan.travel} onChange={(e) => update('travel', e.target.value)} /></label>
          </div>

          {analysis && (
            <div className="plan-my-day-results">
              {analysis.rows.map((row) => (
                <div className="plan-my-day-row" key={`${row.title}-${row.time}`}>
                  <span className="plan-my-day-time">{label(row.time)}</span>
                  <span className={`plan-my-day-icon ${row.message.tone}`}>{row.icon}</span>
                  <strong>{row.title}</strong>
                  <span className={`plan-my-day-message ${row.message.tone}`}>
                    {row.message.icon}
                    {row.message.text}
                  </span>
                </div>
              ))}

              <div className={`plan-my-day-recommendation ${analysis.recommendationType}`}>
                <Sparkles size={16} />
                <span><strong>One change recommended:</strong> {analysis.recommendation}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
