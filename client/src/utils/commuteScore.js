/**
 * Commute Weather Intelligence & Best Departure Time Calculation
 * Fulfills Feature 2 ("Smart Commute") and Feature 4 ("Best Departure Time")
 */

import { calculateOutdoorScore } from './outdoorScore';

/**
 * Calculates a weather commute penalty/score (0 to 100).
 * Higher is better (safer, drier, more comfortable).
 */
export function calculateCommuteScore(hour) {
  if (!hour) return 50;
  // An outdoor score serves as a solid baseline, with extra weight on rain/roads and visibility
  let score = calculateOutdoorScore(hour);
  if (score === null) score = 70;

  const pop = hour.precipitation_prob || 0;
  const wind = hour.wind_speed || 0;

  // Road safety penalties
  if (pop > 60) score -= 15;
  if (wind > 35) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Parses an ISO date or time string into minutes from start of day
 */
function getMinutesFromMidnight(dateObj) {
  return dateObj.getHours() * 60 + dateObj.getMinutes();
}

/**
 * Finds the closest hourly forecast entry matching a specific timestamp or minutes offset
 */
export function getHourForecastForTime(hourlyData, targetDate) {
  if (!Array.isArray(hourlyData) || hourlyData.length === 0) return null;

  const targetMs = targetDate.getTime();
  let closest = hourlyData[0];
  let minDiff = Infinity;

  for (const h of hourlyData) {
    if (!h.time) continue;
    const diff = Math.abs(new Date(h.time).getTime() - targetMs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = h;
    }
  }

  return closest;
}

/**
 * Analyzes weather during the commute window.
 * Evaluates conditions at departure and through the transit duration.
 */
export function analyzeCommute(hourlyData, departureDate, durationMins = 30) {
  if (!Array.isArray(hourlyData) || hourlyData.length === 0) {
    return {
      available: false,
      message: 'No forecast data available for commute analysis.',
    };
  }

  const depTime = departureDate instanceof Date ? departureDate : new Date(departureDate);
  const arrivalTime = new Date(depTime.getTime() + durationMins * 60 * 1000);

  const startWeather = getHourForecastForTime(hourlyData, depTime);
  const endWeather = getHourForecastForTime(hourlyData, arrivalTime);

  if (!startWeather) {
    return { available: false, message: 'Could not match departure time to forecast.' };
  }

  const rainRisk = Math.max(startWeather.precipitation_prob || 0, endWeather?.precipitation_prob || 0);
  const avgTemp = Math.round(
    ((startWeather.temperature || 25) + (endWeather?.temperature || startWeather.temperature || 25)) / 2
  );
  const avgFeelsLike = Math.round(
    ((startWeather.feels_like ?? startWeather.temperature ?? 25) +
      (endWeather?.feels_like ?? endWeather?.temperature ?? startWeather.feels_like ?? 25)) /
      2
  );
  const maxWind = Math.round(Math.max(startWeather.wind_speed || 0, endWeather?.wind_speed || 0));
  const condition = startWeather.condition_text || 'Clear';

  // Recommendation generation
  let recommendation = 'Comfortable transit conditions.';
  let recType = 'positive'; // 'positive' | 'warning' | 'danger' | 'info'

  if (rainRisk >= 60 || condition.toLowerCase().includes('storm') || condition.toLowerCase().includes('rain')) {
    recommendation = 'Carry an umbrella or raincoat. Wet road conditions expected.';
    recType = 'danger';
  } else if (rainRisk >= 35) {
    recommendation = 'Moderate chance of scattered rain. Keep a compact umbrella handy.';
    recType = 'warning';
  } else if (avgFeelsLike >= 35) {
    recommendation = 'Hot and humid conditions expected during your commute. Stay hydrated.';
    recType = 'warning';
  } else if (avgFeelsLike <= 10) {
    recommendation = 'Brisk and cold commute. Wear warm layers.';
    recType = 'info';
  } else if (maxWind >= 30) {
    recommendation = 'Strong wind gusts expected. Extra caution required if traveling by bike or two-wheeler.';
    recType = 'warning';
  } else {
    recommendation = 'Low rain risk. Smooth and dry commute expected.';
    recType = 'positive';
  }

  // Trend detection during or shortly after commute window
  // Look 1-2 hours after arrival to spot incoming weather changes
  const postCommuteTime = new Date(arrivalTime.getTime() + 60 * 60 * 1000);
  const postWeather = getHourForecastForTime(hourlyData, postCommuteTime);

  let weatherShift = null;
  if (postWeather) {
    const postPop = postWeather.precipitation_prob || 0;
    const postTemp = postWeather.temperature || 0;

    if (postPop - rainRisk >= 25 && postPop >= 45) {
      const postHourLabel = new Date(postWeather.time).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      weatherShift = `⚠️ Rain probability increases to ${postPop}% around ${postHourLabel}.`;
    } else if (rainRisk >= 50 && postPop <= 20) {
      const postHourLabel = new Date(postWeather.time).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      weatherShift = `🌤️ Rain expected to clear up around ${postHourLabel}.`;
    } else if (postTemp - avgTemp >= 5 && postTemp >= 32) {
      weatherShift = `🌡️ Temperatures rise rapidly later in the morning.`;
    }
  }

  const commuteScore = calculateCommuteScore(startWeather);

  return {
    available: true,
    departureTimeLabel: depTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    arrivalTimeLabel: arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    rainRisk,
    windSpeed: maxWind,
    feelsLike: avgFeelsLike,
    temperature: avgTemp,
    conditionText: condition,
    recommendation,
    recType,
    weatherShift,
    score: commuteScore,
  };
}

/**
 * Compares nearby departure times to find the optimal commute window.
 * Candidate offsets: -30m, -15m, 0m (selected), +15m, +30m.
 */
export function findBestDepartureTime(hourlyData, baseDepartureDate, durationMins = 30) {
  if (!Array.isArray(hourlyData) || hourlyData.length === 0) return null;

  const baseTime = baseDepartureDate instanceof Date ? baseDepartureDate : new Date(baseDepartureDate);
  const offsets = [-30, -15, 0, 15, 30]; // minutes

  const candidateOptions = [];

  for (const offset of offsets) {
    const candidateDate = new Date(baseTime.getTime() + offset * 60 * 1000);
    const analysis = analyzeCommute(hourlyData, candidateDate, durationMins);

    if (analysis.available) {
      candidateOptions.push({
        offsetMinutes: offset,
        departureDate: candidateDate,
        timeLabel: candidateDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        analysis,
        score: analysis.score,
      });
    }
  }

  if (candidateOptions.length === 0) return null;

  // Find candidate with best score
  let best = candidateOptions[0];
  for (const option of candidateOptions) {
    if (option.score > best.score) {
      best = option;
    }
  }

  const selectedOption = candidateOptions.find((c) => c.offsetMinutes === 0) || candidateOptions[0];

  const scoreDiff = best.score - selectedOption.score;
  const isSelectedBest = best.offsetMinutes === 0 || scoreDiff < 8;

  let reason = '';
  if (isSelectedBest) {
    reason = `Your selected departure at ${selectedOption.timeLabel} has the most favorable weather conditions among nearby windows.`;
  } else {
    const rainDiff = selectedOption.analysis.rainRisk - best.analysis.rainRisk;
    const feelsDiff = selectedOption.analysis.feelsLike - best.analysis.feelsLike;

    if (rainDiff >= 15) {
      reason = `Lower rain probability (${best.analysis.rainRisk}% vs ${selectedOption.analysis.rainRisk}%) compared to ${selectedOption.timeLabel}.`;
    } else if (feelsDiff >= 3) {
      reason = `Cooler feels-like temperature (${best.analysis.feelsLike}°C vs ${selectedOption.analysis.feelsLike}°C) than later departure times.`;
    } else {
      reason = `More stable and comfortable meteorological conditions than ${selectedOption.timeLabel}.`;
    }
  }

  return {
    recommendedTime: best.timeLabel,
    recommendedDate: best.departureDate,
    isCurrentSelected: isSelectedBest,
    reason,
    bestScore: best.score,
    selectedScore: selectedOption.score,
    candidates: candidateOptions,
  };
}
