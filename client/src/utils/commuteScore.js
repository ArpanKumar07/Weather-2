/**
 * Commute Weather Intelligence & Best Departure Time Calculation
 * Fulfills Feature: Real Data-Driven Smart Commute
 *
 * Deterministic, formula-based scoring and advisory engine.
 * STRICT RULE: No random numbers, no mock data, no fabricated recommendations.
 */

/**
 * Parses and validates an input date/time against available forecast data
 */
export function getHourForecastForTime(hourlyData, targetDate) {
  if (!Array.isArray(hourlyData) || hourlyData.length === 0) return null;

  const targetMs = targetDate.getTime();
  let closest = null;
  let minDiff = Infinity;

  for (const h of hourlyData) {
    if (!h.time) continue;
    const diff = Math.abs(new Date(h.time).getTime() - targetMs);
    // Allow matching within 3 hours of target
    if (diff < minDiff && diff <= 3 * 3600 * 1000) {
      minDiff = diff;
      closest = h;
    }
  }

  return closest;
}

/**
 * Extracts and aggregates all hourly forecast records covering the commute window [t_dep, t_arr].
 *
 * @param {Array} hourlyData - Real hourly forecast points from WeatherContext
 * @param {Date|string} departureDate - Commute departure timestamp
 * @param {number} durationMins - Commute duration (15, 30, 45, 60 min)
 */
export function getCommuteWeatherWindow(hourlyData, departureDate, durationMins = 30) {
  if (!Array.isArray(hourlyData) || hourlyData.length === 0) {
    return {
      available: false,
      message: 'Commute analysis unavailable: hourly forecast data is not available.',
    };
  }

  const depTime = departureDate instanceof Date ? departureDate : new Date(departureDate);
  const arrTime = new Date(depTime.getTime() + durationMins * 60 * 1000);

  // Check if depTime is wildly out of range (> 36 hours ahead or > 2 hours in the past)
  const firstPointMs = new Date(hourlyData[0]?.time || Date.now()).getTime() - 2 * 3600 * 1000;
  const lastPointMs = new Date(hourlyData[hourlyData.length - 1]?.time || Date.now()).getTime() + 2 * 3600 * 1000;

  if (depTime.getTime() < firstPointMs || depTime.getTime() > lastPointMs) {
    return {
      available: false,
      message: 'Selected departure time is outside the available 36-hour forecast horizon.',
    };
  }

  // Find all hourly data points intersecting [depTime - 30m, arrTime + 30m]
  const intersectingHours = hourlyData.filter((h) => {
    if (!h.time) return false;
    const hTime = new Date(h.time).getTime();
    return hTime >= depTime.getTime() - 30 * 60 * 1000 && hTime <= arrTime.getTime() + 30 * 60 * 1000;
  });

  // Fallback to closest point if transit duration is shorter than hourly step
  const sampleHours = intersectingHours.length > 0 ? intersectingHours : [getHourForecastForTime(hourlyData, depTime)].filter(Boolean);

  if (sampleHours.length === 0) {
    return {
      available: false,
      message: 'No forecast points could be matched to the selected commute window.',
    };
  }

  // Exact departure point and arrival point
  const startWeather = getHourForecastForTime(hourlyData, depTime) || sampleHours[0];
  const endWeather = getHourForecastForTime(hourlyData, arrTime) || sampleHours[sampleHours.length - 1];

  // Aggregated meteorological metrics across the transit window
  const maxRainProb = Math.max(...sampleHours.map((h) => h.precipitation_prob || 0));
  const maxPrecip = Math.max(...sampleHours.map((h) => h.precipitation || 0));
  const avgTemp = Math.round(sampleHours.reduce((sum, h) => sum + (h.temperature || 0), 0) / sampleHours.length);
  const avgFeelsLike = Math.round(
    sampleHours.reduce((sum, h) => sum + (typeof h.feels_like === 'number' ? h.feels_like : h.temperature || 0), 0) /
      sampleHours.length
  );
  const avgHumidity = Math.round(sampleHours.reduce((sum, h) => sum + (h.humidity || 50), 0) / sampleHours.length);
  const maxWind = Math.round(Math.max(...sampleHours.map((h) => h.wind_speed || 0)));
  const maxGust = Math.round(Math.max(...sampleHours.map((h) => h.wind_gusts || h.wind_speed || 0)));
  const minVisibility = Math.min(...sampleHours.map((h) => (typeof h.visibility === 'number' ? h.visibility : 10)));
  const conditionText = startWeather.condition_text || sampleHours[0].condition_text || 'Clear';

  return {
    available: true,
    depTime,
    arrTime,
    durationMins,
    departureTimeLabel: depTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    arrivalTimeLabel: arrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    startWeather,
    endWeather,
    sampleHours,
    maxRainProb,
    maxPrecip,
    avgTemp,
    avgFeelsLike,
    avgHumidity,
    maxWind,
    maxGust,
    minVisibility,
    conditionText,
  };
}

/**
 * Calculates a deterministic, reproducible commute weather score from 0 to 100.
 *
 * Scoring Scale:
 *   100        = Optimal, crystal clear conditions
 *   80 to 99   = Very Good / Smooth commute
 *   60 to 79   = Acceptable transit conditions
 *   40 to 59   = Caution / Moderate weather impedance
 *   20 to 39   = Poor / High weather risk
 *   0 to 19    = Severe / Hazardous conditions
 *
 * STRICT RULE: No random numbers. The same inputs ALWAYS produce the exact same score.
 */
export function calculateCommuteScore(metrics) {
  if (!metrics || !metrics.available) return 50;

  let score = 100;
  const { maxRainProb, maxPrecip, avgFeelsLike, maxWind, maxGust, minVisibility, conditionText } = metrics;
  const cond = (conditionText || '').toLowerCase();

  // 1. Precipitation Probability Deduction (Up to -40 pts)
  if (maxRainProb >= 80) {
    score -= 40;
  } else if (maxRainProb >= 60) {
    score -= 28;
  } else if (maxRainProb >= 40) {
    score -= 16;
  } else if (maxRainProb >= 20) {
    score -= 8;
  }

  // 2. Active Precipitation / Rain Amount in mm (Up to -25 pts)
  if (maxPrecip >= 5.0) {
    score -= 25; // Heavy rain pooling
  } else if (maxPrecip >= 2.0) {
    score -= 16; // Moderate rain
  } else if (maxPrecip >= 0.4) {
    score -= 8; // Light rain / drizzle
  }

  // 3. Severe Weather Phenomena (Up to -50 pts)
  if (cond.includes('thunder') || cond.includes('storm')) {
    score -= 50;
  } else if (cond.includes('heavy rain') || cond.includes('violent') || cond.includes('torrential')) {
    score -= 35;
  } else if (cond.includes('snow') || cond.includes('sleet') || cond.includes('ice') || cond.includes('hail')) {
    score -= 30;
  } else if (cond.includes('fog') || cond.includes('mist')) {
    score -= 15;
  }

  // 4. Thermal Comfort & Heat/Chill Index (Up to -25 pts)
  // Ideal comfortable band: 18°C to 26°C
  if (avgFeelsLike >= 38) {
    score -= 25; // Extreme sweltering heat
  } else if (avgFeelsLike >= 34) {
    score -= 15; // Uncomfortable muggy heat
  } else if (avgFeelsLike >= 30) {
    score -= 6; // Warm
  } else if (avgFeelsLike <= 5) {
    score -= 25; // Bitter freezing cold
  } else if (avgFeelsLike <= 12) {
    score -= 12; // Chilly
  } else if (avgFeelsLike <= 16) {
    score -= 5; // Cool
  }

  // 5. Wind Speed & Gusts (Up to -20 pts)
  if (maxWind >= 35 || maxGust >= 50) {
    score -= 20; // Dangerous crosswinds
  } else if (maxWind >= 24 || maxGust >= 36) {
    score -= 10; // Gusty breeze
  }

  // 6. Road Visibility (Up to -25 pts)
  if (minVisibility <= 2) {
    score -= 25; // Dense fog / very poor visibility
  } else if (minVisibility <= 5) {
    score -= 12; // Moderate haze / reduced visibility
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let tier = 'Optimal';
  let tierColor = 'var(--theme-accent)';
  if (finalScore >= 80) {
    tier = 'Very Good';
    tierColor = '#10b981';
  } else if (finalScore >= 60) {
    tier = 'Acceptable';
    tierColor = '#38bdf8';
  } else if (finalScore >= 40) {
    tier = 'Caution';
    tierColor = '#f59e0b';
  } else if (finalScore >= 20) {
    tier = 'Poor';
    tierColor = '#f97316';
  } else {
    tier = 'Severe';
    tierColor = '#ef4444';
  }

  return { score: finalScore, tier, tierColor };
}

/**
 * Generates factual, forecast-based recommendations with strict umbrella logic.
 *
 * @param {Object} metrics - Output of getCommuteWeatherWindow()
 */
export function generateCommuteRecommendation(metrics) {
  const { maxRainProb, maxPrecip, avgFeelsLike, maxWind, conditionText, departureTimeLabel, arrivalTimeLabel } = metrics;
  const cond = (conditionText || '').toLowerCase();

  let recommendation = '';
  let umbrellaNotice = '';
  let recType = 'positive'; // 'positive' | 'warning' | 'danger' | 'info'

  // Deterministic Umbrella Logic
  if (maxRainProb >= 60 || maxPrecip >= 0.5 || cond.includes('rain') || cond.includes('storm')) {
    umbrellaNotice = `Carry an umbrella or raincoat — precipitation probability reaches ${maxRainProb}% during transit (${departureTimeLabel} – ${arrivalTimeLabel}).`;
    recType = 'danger';
  } else if (maxRainProb >= 30) {
    umbrellaNotice = `Consider packing a compact umbrella — ${maxRainProb}% chance of scattered showers during your commute.`;
    recType = 'warning';
  } else {
    umbrellaNotice = `No umbrella needed — dry conditions expected with low rain probability (${maxRainProb}%).`;
  }

  // Transit conditions advice
  if (cond.includes('storm') || cond.includes('thunder')) {
    recommendation = `Thunderstorm risk detected during your commute. Plan for wet roads and potential transit delays.`;
    recType = 'danger';
  } else if (maxWind >= 32) {
    recommendation = `Strong wind gusts up to ${metrics.maxGust} km/h forecast. Exercise extra caution if commuting on bike or two-wheeler.`;
    recType = 'warning';
  } else if (avgFeelsLike >= 35) {
    recommendation = `Hot and humid commute (feels like ${avgFeelsLike}°C). Stay hydrated and prefer air-conditioned transit if available.`;
    recType = 'warning';
  } else if (avgFeelsLike <= 8) {
    recommendation = `Brisk cold transit (feels like ${avgFeelsLike}°C). Wear an insulated jacket and gloves.`;
    recType = 'info';
  } else if (recType === 'positive') {
    recommendation = `Favorable weather conditions throughout your commute window. Smooth travel expected.`;
  } else {
    recommendation = `Exercise general transit caution and stay aware of ambient road conditions.`;
  }

  return { recommendation, umbrellaNotice, recType };
}

/**
 * Detects factual weather changes occurring during transit or shortly thereafter.
 */
export function detectWeatherChanges(metrics, hourlyData) {
  const { startWeather, endWeather, arrTime, maxRainProb, avgTemp } = metrics;

  if (!startWeather || !endWeather) return null;

  const startPop = startWeather.precipitation_prob || 0;
  const endPop = endWeather.precipitation_prob || 0;
  const startWind = startWeather.wind_speed || 0;
  const endWind = endWeather.wind_speed || 0;

  // Check 1 hour after arrival to detect incoming weather shifts
  const postTime = new Date(arrTime.getTime() + 60 * 60 * 1000);
  const postWeather = getHourForecastForTime(hourlyData, postTime);

  const postPop = postWeather?.precipitation_prob || 0;
  const postTemp = postWeather?.temperature || avgTemp;

  // Scenario 1: Rain risk escalates during commute
  if (endPop - startPop >= 25 && endPop >= 50) {
    return `⚠️ Rain risk increases significantly during your commute (${startPop}% at departure → ${endPop}% upon arrival).`;
  }

  // Scenario 2: Rain begins near arrival
  if (startPop < 25 && endPop >= 45) {
    const arrLabel = arrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `🌧️ Rain is expected near the end of your commute around ${arrLabel}.`;
  }

  // Scenario 3: Rain clearing up
  if (startPop >= 50 && endPop <= 20) {
    const arrLabel = arrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `🌤️ Rain expected to taper off near arrival around ${arrLabel}.`;
  }

  // Scenario 4: Significant temperature climb after commute
  if (postTemp - avgTemp >= 5 && postTemp >= 32) {
    return `🌡️ Temperatures rise rapidly later in the morning (reaching ${postTemp}°C shortly after arrival).`;
  }

  // Scenario 5: Wind increases noticeably
  if (endWind - startWind >= 12 && endWind >= 25) {
    return `💨 Wind speeds pick up during transit, increasing from ${Math.round(startWind)} km/h to ${Math.round(endWind)} km/h.`;
  }

  // Scenario 6: Incoming rain 1-2 hours after commute
  if (postPop - maxRainProb >= 30 && postPop >= 60) {
    const postLabel = postTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `ℹ️ Rain probability jumps to ${postPop}% around ${postLabel} after your commute.`;
  }

  // Stable conditions
  return `✅ Weather conditions remain relatively stable throughout your commute window.`;
}

/**
 * Detects severe/extreme meteorological events.
 */
export function detectExtremeConditions(metrics) {
  const { conditionText, maxPrecip, maxWind, maxGust, minVisibility, avgFeelsLike } = metrics;
  const cond = (conditionText || '').toLowerCase();

  const alerts = [];

  if (cond.includes('thunder') || cond.includes('storm')) {
    alerts.push({
      title: 'Thunderstorm Warning',
      message: 'Active thunderstorms or lightning forecast in the area during transit.',
    });
  }

  if (maxPrecip >= 5.0 || cond.includes('heavy rain') || cond.includes('torrential')) {
    alerts.push({
      title: 'Heavy Precipitation Alert',
      message: 'Heavy rain intensity forecast. Expect reduced visibility and water accumulation on roadways.',
    });
  }

  if (maxWind >= 38 || maxGust >= 50) {
    alerts.push({
      title: 'High Wind Warning',
      message: `Severe wind gusts up to ${maxGust} km/h forecast during transit window.`,
    });
  }

  if (minVisibility <= 2) {
    alerts.push({
      title: 'Dense Fog & Low Visibility',
      message: `Road visibility drops to ${minVisibility} km. Turn on low beams and maintain safe following distances.`,
    });
  }

  if (avgFeelsLike >= 40) {
    alerts.push({
      title: 'Extreme Heat Index',
      message: `Dangerous heat index (feels like ${avgFeelsLike}°C). Minimize prolonged outdoor transit exposure.`,
    });
  }

  return alerts;
}

/**
 * Full commute analysis coordinator.
 */
export function analyzeCommute(hourlyData, departureDate, durationMins = 30) {
  const windowData = getCommuteWeatherWindow(hourlyData, departureDate, durationMins);
  if (!windowData.available) {
    return windowData;
  }

  const scoreData = calculateCommuteScore(windowData);
  const recData = generateCommuteRecommendation(windowData);
  const weatherShift = detectWeatherChanges(windowData, hourlyData);
  const extremeAlerts = detectExtremeConditions(windowData);

  return {
    available: true,
    departureTimeLabel: windowData.departureTimeLabel,
    arrivalTimeLabel: windowData.arrivalTimeLabel,
    durationMins,
    rainRisk: windowData.maxRainProb,
    rainAmount: windowData.maxPrecip,
    feelsLike: windowData.avgFeelsLike,
    temperature: windowData.avgTemp,
    humidity: windowData.avgHumidity,
    windSpeed: windowData.maxWind,
    windGust: windowData.maxGust,
    visibility: windowData.minVisibility,
    conditionText: windowData.conditionText,
    score: scoreData.score,
    scoreTier: scoreData.tier,
    scoreColor: scoreData.tierColor,
    recommendation: recData.recommendation,
    umbrellaNotice: recData.umbrellaNotice,
    recType: recData.recType,
    weatherShift,
    extremeAlerts,
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
  const isSelectedBest = best.offsetMinutes === 0 || scoreDiff < 6;

  let reason = '';
  if (isSelectedBest) {
    reason = `Your selected departure at ${selectedOption.timeLabel} has the most favorable meteorological conditions among nearby windows (Score: ${selectedOption.score}/100).`;
  } else {
    const rainDiff = selectedOption.analysis.rainRisk - best.analysis.rainRisk;
    const feelsDiff = selectedOption.analysis.feelsLike - best.analysis.feelsLike;
    const windDiff = selectedOption.analysis.windSpeed - best.analysis.windSpeed;

    if (rainDiff >= 15) {
      reason = `Leaving at ${best.timeLabel} (${Math.abs(best.offsetMinutes)}m ${best.offsetMinutes < 0 ? 'earlier' : 'later'}) has significantly lower rain probability (${best.analysis.rainRisk}% vs ${selectedOption.analysis.rainRisk}%).`;
    } else if (feelsDiff >= 3) {
      reason = `Leaving at ${best.timeLabel} offers a more comfortable feels-like temperature (${best.analysis.feelsLike}°C vs ${selectedOption.analysis.feelsLike}°C).`;
    } else if (windDiff >= 8) {
      reason = `Leaving at ${best.timeLabel} experiences lighter winds (${best.analysis.windSpeed} km/h vs ${selectedOption.analysis.windSpeed} km/h).`;
    } else {
      reason = `Leaving at ${best.timeLabel} provides a higher overall transit comfort score (${best.score} pts vs ${selectedOption.score} pts).`;
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
