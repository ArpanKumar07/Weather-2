/**
 * Commute Weather Intelligence & Best Departure Time Calculation
 *
 * The commute is evaluated using TWO real selected places:
 * - origin weather at departure time
 * - destination weather at arrival time
 */

import { calculateOutdoorScore } from './outdoorScore';

/**
 * Calculates a commute score from 0 to 100.
 * Higher is better.
 */
export function calculateCommuteScore(startWeather, endWeather = null) {
  if (!startWeather) return 50;

  let startScore = calculateOutdoorScore(startWeather);
  let endScore = calculateOutdoorScore(endWeather || startWeather);

  if (startScore === null) startScore = 70;
  if (endScore === null) endScore = 70;

  let score = Math.round((startScore + endScore) / 2);

  const startRain = startWeather.precipitation_prob || 0;
  const endRain = endWeather?.precipitation_prob || 0;
  const maxRain = Math.max(startRain, endRain);

  const startWind = startWeather.wind_speed || 0;
  const endWind = endWeather?.wind_speed || 0;
  const maxWind = Math.max(startWind, endWind);

  if (maxRain > 60) score -= 15;
  if (maxWind > 35) score -= 15;

  const startCondition = (startWeather.condition_text || '').toLowerCase();
  const endCondition = (endWeather?.condition_text || '').toLowerCase();

  if (
    startCondition.includes('storm') ||
    endCondition.includes('storm') ||
    startCondition.includes('thunder') ||
    endCondition.includes('thunder')
  ) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Finds the closest forecast entry to a target timestamp.
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
 * Analyzes weather from a real origin to a real destination.
 */
export function analyzeCommute(
  originHourly,
  destinationHourly,
  departureDate,
  durationMins = 30
) {
  if (!Array.isArray(originHourly) || originHourly.length === 0) {
    return {
      available: false,
      message: 'No origin forecast data available for commute analysis.',
    };
  }

  if (!Array.isArray(destinationHourly) || destinationHourly.length === 0) {
    return {
      available: false,
      message: 'No destination forecast data available for commute analysis.',
    };
  }

  const depTime =
    departureDate instanceof Date ? departureDate : new Date(departureDate);

  const arrivalTime = new Date(
    depTime.getTime() + durationMins * 60 * 1000
  );

  // Origin = weather when leaving
  const startWeather = getHourForecastForTime(originHourly, depTime);

  // Destination = weather when arriving
  const endWeather = getHourForecastForTime(destinationHourly, arrivalTime);

  if (!startWeather || !endWeather) {
    return {
      available: false,
      message: 'Could not match the selected commute time to the forecast.',
    };
  }

  const rainRisk = Math.max(
    startWeather.precipitation_prob || 0,
    endWeather.precipitation_prob || 0
  );

  const avgTemp = Math.round(
    ((startWeather.temperature ?? 25) +
      (endWeather.temperature ?? 25)) /
      2
  );

  const avgFeelsLike = Math.round(
    ((startWeather.feels_like ?? startWeather.temperature ?? 25) +
      (endWeather.feels_like ?? endWeather.temperature ?? 25)) /
      2
  );

  const maxWind = Math.round(
    Math.max(
      startWeather.wind_speed || 0,
      endWeather.wind_speed || 0
    )
  );

  const startCondition = startWeather.condition_text || 'Clear Sky';
  const endCondition = endWeather.condition_text || 'Clear Sky';

  const condition =
    startCondition === endCondition
      ? startCondition
      : `${startCondition} → ${endCondition}`;

  let recommendation = 'Comfortable transit conditions.';
  let recType = 'positive';

  const startConditionLower = startCondition.toLowerCase();
  const endConditionLower = endCondition.toLowerCase();

  if (
    rainRisk >= 60 ||
    startConditionLower.includes('storm') ||
    endConditionLower.includes('storm') ||
    startConditionLower.includes('rain') ||
    endConditionLower.includes('rain') ||
    startConditionLower.includes('thunder') ||
    endConditionLower.includes('thunder')
  ) {
    recommendation =
      'Carry an umbrella or raincoat. Wet road conditions expected.';
    recType = 'danger';
  } else if (rainRisk >= 35) {
    recommendation =
      'Moderate chance of scattered rain. Keep a compact umbrella handy.';
    recType = 'warning';
  } else if (avgFeelsLike >= 35) {
    recommendation =
      'Hot and humid conditions expected during your commute. Stay hydrated.';
    recType = 'warning';
  } else if (avgFeelsLike <= 10) {
    recommendation =
      'Brisk and cold commute. Wear warm layers.';
    recType = 'info';
  } else if (maxWind >= 30) {
    recommendation =
      'Strong wind gusts expected. Extra caution required if traveling by bike or two-wheeler.';
    recType = 'warning';
  } else {
    recommendation =
      'Low rain risk. Smooth and dry commute expected.';
    recType = 'positive';
  }

  // Look one hour after arrival for weather changes at destination.
  const postCommuteTime = new Date(
    arrivalTime.getTime() + 60 * 60 * 1000
  );

  const postWeather = getHourForecastForTime(
    destinationHourly,
    postCommuteTime
  );

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

      weatherShift =
        `⚠️ Rain probability increases to ${postPop}% around ${postHourLabel}.`;
    } else if (rainRisk >= 50 && postPop <= 20) {
      const postHourLabel = new Date(postWeather.time).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      weatherShift =
        `🌤️ Rain expected to clear up around ${postHourLabel}.`;
    } else if (postTemp - avgTemp >= 5 && postTemp >= 32) {
      weatherShift =
        '🌡️ Temperatures rise rapidly later in the morning.';
    }
  }

  const commuteScore = calculateCommuteScore(
    startWeather,
    endWeather
  );

  return {
    available: true,
    departureTimeLabel: depTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    arrivalTimeLabel: arrivalTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
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
 * Candidate offsets: -30m, -15m, 0m, +15m, +30m.
 */
export function findBestDepartureTime(
  originHourly,
  destinationHourly,
  baseDepartureDate,
  durationMins = 30
) {
  if (
    !Array.isArray(originHourly) ||
    originHourly.length === 0 ||
    !Array.isArray(destinationHourly) ||
    destinationHourly.length === 0
  ) {
    return null;
  }

  const baseTime =
    baseDepartureDate instanceof Date
      ? baseDepartureDate
      : new Date(baseDepartureDate);

  const offsets = [-30, -15, 0, 15, 30];
  const candidateOptions = [];

  for (const offset of offsets) {
    const candidateDate = new Date(
      baseTime.getTime() + offset * 60 * 1000
    );

    const analysis = analyzeCommute(
      originHourly,
      destinationHourly,
      candidateDate,
      durationMins
    );

    if (analysis.available) {
      candidateOptions.push({
        offsetMinutes: offset,
        departureDate: candidateDate,
        timeLabel: candidateDate.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        analysis,
        score: analysis.score,
      });
    }
  }

  if (candidateOptions.length === 0) return null;

  let best = candidateOptions[0];

  for (const option of candidateOptions) {
    if (option.score > best.score) {
      best = option;
    }
  }

  const selectedOption =
    candidateOptions.find((c) => c.offsetMinutes === 0) ||
    candidateOptions[0];

  const scoreDiff = best.score - selectedOption.score;
  const isSelectedBest =
    best.offsetMinutes === 0 || scoreDiff < 8;

  let reason = '';

  if (isSelectedBest) {
    reason =
      `Your selected departure at ${selectedOption.timeLabel} has the most favorable weather conditions among nearby windows.`;
  } else {
    const rainDiff =
      selectedOption.analysis.rainRisk -
      best.analysis.rainRisk;

    const feelsDiff =
      selectedOption.analysis.feelsLike -
      best.analysis.feelsLike;

    if (rainDiff >= 15) {
      reason =
        `Lower rain probability (${best.analysis.rainRisk}% vs ${selectedOption.analysis.rainRisk}%) compared to ${selectedOption.timeLabel}.`;
    } else if (feelsDiff >= 3) {
      reason =
        `Cooler feels-like temperature (${best.analysis.feelsLike}°C vs ${selectedOption.analysis.feelsLike}°C) than later departure times.`;
    } else {
      reason =
        `More stable and comfortable meteorological conditions than ${selectedOption.timeLabel}.`;
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

/**
 * Multi-Modal Transit Intelligence Engine
 * Evaluates mode-specific weather safety ratings, risk factors,
 * travel delay penalties, and safety gear requirements.
 */
export function evaluateMultiModalTransit(commuteAnalysis, baseDurationMins = 30) {
  if (!commuteAnalysis || !commuteAnalysis.available) return null;

  const { rainRisk = 0, windSpeed = 0, feelsLike = 25, temperature = 25, conditionText = '' } = commuteAnalysis;
  const condLower = (conditionText || '').toLowerCase();
  const isStormy =
    condLower.includes('storm') ||
    condLower.includes('thunder') ||
    condLower.includes('violent') ||
    condLower.includes('heavy rain');

  // 1. CAR / CAB / RIDESHARE (Enclosed & Climate Controlled)
  let carScore = 96;
  if (rainRisk >= 60) carScore -= 14;
  else if (rainRisk >= 30) carScore -= 6;
  if (isStormy) carScore -= 16;
  if (windSpeed >= 45) carScore -= 12;
  carScore = Math.max(45, Math.min(100, carScore));

  // 2. PUBLIC TRANSIT (METRO / BUS / TRAIN)
  let transitScore = 95;
  if (rainRisk >= 50) transitScore -= 8;
  if (isStormy) transitScore -= 14;
  transitScore = Math.max(55, Math.min(100, transitScore));

  // 3. TWO-WHEELER (MOTORCYCLE / SCOOTER)
  let twoWheelerScore = 90;
  if (rainRisk >= 15) twoWheelerScore -= Math.round(rainRisk * 0.88);
  if (isStormy) twoWheelerScore -= 45;
  if (windSpeed >= 28) twoWheelerScore -= Math.round((windSpeed - 28) * 2.4);
  if (temperature <= 14) twoWheelerScore -= Math.round((14 - temperature) * 1.8);
  twoWheelerScore = Math.max(10, Math.min(100, twoWheelerScore));

  // 4. BICYCLE / CYCLING
  let bikeScore = 92;
  if (rainRisk >= 15) bikeScore -= Math.round(rainRisk * 0.82);
  if (isStormy) bikeScore -= 40;
  if (windSpeed >= 18) bikeScore -= Math.round((windSpeed - 18) * 2.2);
  if (feelsLike >= 33) bikeScore -= Math.round((feelsLike - 33) * 3.2);
  if (feelsLike <= 8) bikeScore -= Math.round((8 - feelsLike) * 2.2);
  bikeScore = Math.max(10, Math.min(100, bikeScore));

  // 5. WALKING / ON FOOT
  let walkScore = 94;
  if (rainRisk >= 15) walkScore -= Math.round(rainRisk * 0.75);
  if (isStormy) walkScore -= 30;
  if (windSpeed >= 25) walkScore -= Math.round((windSpeed - 25) * 1.5);
  if (feelsLike >= 33) walkScore -= Math.round((feelsLike - 33) * 3.5);
  if (feelsLike <= 5) walkScore -= Math.round((5 - feelsLike) * 2.5);
  walkScore = Math.max(10, Math.min(100, walkScore));

  const getRatingInfo = (score) => {
    if (score >= 85) return { status: 'Optimal', badgeClass: 'safe', color: '#10b981', label: 'Highly Recommended' };
    if (score >= 70) return { status: 'Good', badgeClass: 'good', color: '#38bdf8', label: 'Good Conditions' };
    if (score >= 50) return { status: 'Caution', badgeClass: 'caution', color: '#f59e0b', label: 'Proceed with Caution' };
    return { status: 'High Hazard', badgeClass: 'danger', color: '#ef4444', label: 'Not Recommended' };
  };

  const modes = [
    {
      id: 'car',
      name: 'Car / Cab',
      category: 'Enclosed Motor',
      icon: 'Car',
      score: carScore,
      rating: getRatingInfo(carScore),
      travelTimeEst: rainRisk >= 60 ? Math.round(baseDurationMins * 1.35) : Math.round(baseDurationMins),
      delayNote: rainRisk >= 60 ? `+${Math.round(baseDurationMins * 0.35)}m (Rain traffic delay)` : 'On schedule (Normal flow)',
      comfortLevel: 'Climate Controlled (High)',
      roadTraction: rainRisk >= 50 ? 'Moderate (Wet pavement)' : 'Optimal tire grip',
      verdict: rainRisk >= 50
        ? 'Safest & most comfortable motorized option in wet conditions. Expect city traffic slowdowns.'
        : 'Smooth and effortless transit. Optimal windshield visibility.',
      precautions: [
        'Turn on defogger and wipers at appropriate speed',
        'Maintain a 3-second braking distance on damp asphalt',
        'Watch out for waterlogged low-lying underpasses',
      ],
      gearChecklist: ['Wiper blades check', 'Windshield defogger', 'Toll Fastag ready'],
    },
    {
      id: 'public_transit',
      name: 'Metro / Bus',
      category: 'Mass Transit',
      icon: 'Train',
      score: transitScore,
      rating: getRatingInfo(transitScore),
      travelTimeEst: Math.round(baseDurationMins * 1.05),
      delayNote: rainRisk >= 60 ? '+3–5m (Station transfer delay)' : 'Highly reliable schedule',
      comfortLevel: 'High (Air conditioned)',
      roadTraction: 'Fully immune (Protected tracks)',
      verdict: rainRisk >= 40
        ? 'Excellent choice during downpours. Avoids street traffic and keeps you 95% dry.'
        : 'Eco-friendly, cost-effective, and immune to surface traffic jams.',
      precautions: [
        'Carry a compact umbrella for the first/last mile walk to the station',
        'Watch for slippery polished station floor tiles',
        'Check metro transit alerts for potential surface water delays',
      ],
      gearChecklist: ['Metro transit pass', 'Compact umbrella', 'Light jacket for AC cars'],
    },
    {
      id: 'two_wheeler',
      name: '2-Wheeler (Motorcycle/Scooter)',
      category: 'Motorized Open',
      icon: 'Scooter',
      score: twoWheelerScore,
      rating: getRatingInfo(twoWheelerScore),
      travelTimeEst: rainRisk >= 50 ? Math.round(baseDurationMins * 1.2) : Math.round(baseDurationMins * 0.9),
      delayNote: rainRisk >= 50 ? '+15–20% (Cautious slow riding)' : 'Zippy (Filters city traffic)',
      comfortLevel: rainRisk >= 40 ? 'Wet / Exposed' : feelsLike >= 34 ? 'Hot & Humid' : 'Comfortable',
      roadTraction: rainRisk >= 40 ? '⚠️ High skidding risk on road markings' : 'Normal tire friction',
      verdict: rainRisk >= 40
        ? 'Caution advised. Wet asphalt reduces emergency braking grip by ~40%.'
        : windSpeed >= 28
        ? 'Crosswinds detected. Stay cautious on elevated flyovers and bridges.'
        : 'Pleasant riding conditions. Fast city mobility with good road grip.',
      precautions: [
        'Avoid painted zebra crossings & metal manhole covers when wet',
        'Brake with progressive rear + front pressure; avoid abrupt grabs',
        'Use anti-fog visor spray or keep visor cracked one notch',
      ],
      gearChecklist: ['Full-face helmet with clear visor', 'Waterproof rain slicker', 'Traction riding gloves'],
    },
    {
      id: 'bicycle',
      name: 'Bicycle / Cycling',
      category: 'Active Transit',
      icon: 'Bike',
      score: bikeScore,
      rating: getRatingInfo(bikeScore),
      travelTimeEst: Math.round(baseDurationMins * 1.4),
      delayNote: windSpeed >= 20 ? '+15% (Headwind resistance)' : 'Active cadence',
      comfortLevel: feelsLike >= 33 ? 'Sweat hazard / Heat stress' : 'Fresh & Active',
      roadTraction: rainRisk >= 35 ? 'Slippery rim brakes' : 'Smooth rolling',
      verdict: rainRisk >= 35
        ? 'Not recommended. Rim brakes lose initial bite in wet spray; road splatter.'
        : windSpeed >= 22
        ? 'Headwinds will demand extra pedal effort. Choose sheltered avenues.'
        : 'Great cycling weather! Low wind resistance and comfortable temperature.',
      precautions: [
        'Pump tires 5 PSI lower for extra wet-road footprint',
        'Use flashing front & rear LED lights for contrast visibility',
        'Carry electrolyte hydration if temperature is elevated',
      ],
      gearChecklist: ['Cycling helmet', 'Mudguards / Fenders', 'High-visibility windbreaker'],
    },
    {
      id: 'walking',
      name: 'Walking / On Foot',
      category: 'Pedestrian',
      icon: 'Footprints',
      score: walkScore,
      rating: getRatingInfo(walkScore),
      travelTimeEst: Math.round(baseDurationMins * 2.2),
      delayNote: rainRisk >= 40 ? 'Puddle detours expected' : 'Brisk pedestrian pace',
      comfortLevel: rainRisk >= 30 ? 'Umbrella needed' : feelsLike >= 33 ? 'Heavy perspiration' : 'Pleasant',
      roadTraction: rainRisk >= 40 ? 'Waterlogged sidewalks' : 'Dry sidewalks',
      verdict: rainRisk >= 50
        ? 'Heavy rain exposure. Sturdy wind-resistant umbrella and waterproof footwear needed.'
        : feelsLike >= 35
        ? 'High heat index. Walk on shaded sides of avenues and drink cold water.'
        : 'Invigorating walking weather! Perfect for a healthy walking commute.',
      precautions: [
        'Stick to elevated sidewalks to avoid curb splash from passing cars',
        'Use UV-protective umbrella or sunglasses in bright sun',
        'Stay clear of open roadside drains during heavy downpours',
      ],
      gearChecklist: ['Windproof umbrella', 'Waterproof walking shoes', 'UV sunglasses / Hat'],
    },
  ];

  const sortedModes = [...modes].sort((a, b) => b.score - a.score);
  const bestMode = sortedModes[0];

  return {
    modes,
    bestMode,
  };
}

