/**
 * Outdoor Activity Scoring & Best Time Window Calculation
 * Fulfills Feature 1: "Best Time Today"
 */

/**
 * Calculates an outdoor activity score from 0 to 100 for a single hour forecast.
 */
export function calculateOutdoorScore(hour) {
  if (!hour || typeof hour.temperature !== 'number') return null;

  let score = 100;
  const temp = hour.temperature;
  const feelsLike = typeof hour.feels_like === 'number' ? hour.feels_like : temp;
  const pop = typeof hour.precipitation_prob === 'number' ? hour.precipitation_prob : 0;
  const wind = typeof hour.wind_speed === 'number' ? hour.wind_speed : 0;
  const uv = typeof hour.uv_index === 'number' ? hour.uv_index : 0;
  const humidity = typeof hour.humidity === 'number' ? hour.humidity : 50;
  const condition = (hour.condition_text || '').toLowerCase();

  // 1. Temperature & Feels-Like Scoring
  // Ideal comfortable band: 18°C to 25°C
  if (feelsLike >= 18 && feelsLike <= 25) {
    // Perfect range, 0 deduction
  } else if (feelsLike > 25 && feelsLike <= 28) {
    score -= 6;
  } else if (feelsLike > 28 && feelsLike <= 32) {
    score -= 16;
  } else if (feelsLike > 32 && feelsLike <= 36) {
    score -= 28;
  } else if (feelsLike > 36) {
    score -= 42;
  } else if (feelsLike >= 14 && feelsLike < 18) {
    score -= 8;
  } else if (feelsLike >= 8 && feelsLike < 14) {
    score -= 18;
  } else if (feelsLike < 8) {
    score -= 35;
  }

  // Extra penalty if feels-like is substantially higher than actual temp due to humidity
  if (feelsLike - temp >= 4 && humidity >= 70) {
    score -= 8;
  }

  // 2. Precipitation Probability & Weather Conditions (Strongest factor)
  if (condition.includes('thunder') || condition.includes('storm')) {
    score -= 55;
  } else if (condition.includes('heavy rain') || condition.includes('violent')) {
    score -= 50;
  } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('snow')) {
    score -= 30;
  }

  if (pop > 65) {
    score -= 45;
  } else if (pop > 40) {
    score -= 28;
  } else if (pop > 20) {
    score -= 14;
  } else if (pop > 10) {
    score -= 5;
  }

  // 3. Wind Speed
  if (wind >= 32) {
    score -= 25;
  } else if (wind >= 22) {
    score -= 12;
  } else if (wind >= 16) {
    score -= 5;
  }

  // 4. UV Index (Daytime exposure)
  if (uv >= 8) {
    score -= 14;
  } else if (uv >= 6) {
    score -= 7;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Finds the optimal 2-hour window today for outdoor activities.
 * Evaluates available hourly forecast points for today.
 */
export function findBestTimeToday(hourlyData) {
  if (!Array.isArray(hourlyData) || hourlyData.length < 2) {
    return {
      available: false,
      message: 'Insufficient hourly forecast data available to compute best outdoor time.',
    };
  }

  // Filter for hours corresponding to today (or the next 16 hours ahead)
  const now = new Date();
  const currentISOString = now.toISOString().slice(0, 10);

  // Consider daytime/evening hours (e.g. between 05:00 and 22:00)
  const candidates = hourlyData.filter((h) => {
    if (!h.time) return false;
    const hDate = new Date(h.time);
    const hourNum = hDate.getHours();
    // Prefer reasonable active hours between 5 AM and 9 PM
    return hourNum >= 5 && hourNum <= 21;
  });

  const searchPool = candidates.length >= 2 ? candidates : hourlyData.slice(0, 16);

  if (searchPool.length < 2) {
    return {
      available: false,
      message: 'Not enough daytime hours remaining today to analyze.',
    };
  }

  let bestWindow = null;
  let highestScore = -1;

  // Evaluate rolling 2-hour windows
  for (let i = 0; i < searchPool.length - 1; i++) {
    const h1 = searchPool[i];
    const h2 = searchPool[i + 1];

    const score1 = calculateOutdoorScore(h1);
    const score2 = calculateOutdoorScore(h2);

    if (score1 === null || score2 === null) continue;

    const avgScore = Math.round((score1 + score2) / 2);

    if (avgScore > highestScore) {
      highestScore = avgScore;

      const date1 = new Date(h1.time);
      const date2 = new Date(h2.time);
      // End time is 1 hour after h2
      const endDate = new Date(date2.getTime() + 60 * 60 * 1000);

      const formatTime = (d) =>
        d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      const timeWindow = `${formatTime(date1)} – ${formatTime(endDate)}`;

      const avgTemp = Math.round((h1.temperature + h2.temperature) / 2);
      const avgFeels = Math.round(
        ((h1.feels_like ?? h1.temperature) + (h2.feels_like ?? h2.temperature)) / 2
      );
      const maxPop = Math.max(h1.precipitation_prob || 0, h2.precipitation_prob || 0);
      const avgWind = Math.round(((h1.wind_speed || 0) + (h2.wind_speed || 0)) / 2);
      const condition = h1.condition_text || h2.condition_text || 'Mild Weather';

      let summary = 'Great conditions for outdoor activities.';
      if (avgScore >= 85) {
        summary = 'Optimal window with comfortable temperature and low rain risk.';
      } else if (avgScore >= 70) {
        summary = 'Favorable outdoor conditions with light breeze.';
      } else if (avgScore >= 55) {
        summary = 'Moderate conditions. Keep hydration and light rain layers in mind.';
      } else {
        summary = 'Suboptimal conditions throughout today; plan indoor alternatives if possible.';
      }

      bestWindow = {
        available: true,
        timeWindow,
        score: avgScore,
        temperature: avgTemp,
        feels_like: avgFeels,
        precipitation_prob: maxPop,
        wind_speed: avgWind,
        condition_text: condition,
        summary,
      };
    }
  }

  if (!bestWindow || highestScore < 30) {
    return {
      available: false,
      message: 'Unfavorable outdoor conditions today due to high rain, storms, or extreme temperatures.',
    };
  }

  return bestWindow;
}
