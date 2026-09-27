/**
 * Commute Weather Intelligence & Best Departure Time Calculation
 * 
 * Smart Commute evaluates weather at:
 * 1. Origin when the user leaves
 * 2. Destination when the user arrives
 *
 * It also compares nearby departure times to find
 * a better weather window.
 */

import { calculateOutdoorScore } from './outdoorScore';

/**
 * Calculates a commute score from 0 to 100.
 * Higher score = better weather conditions.
 *
 * The score combines weather at the origin
 * and destination.
 */
export function calculateCommuteScore(
  startWeather,
  endWeather = null
) {
  if (!startWeather) {
    return 50;
  }

  const startScore =
    calculateOutdoorScore(
      startWeather
    );

  const endScore =
    calculateOutdoorScore(
      endWeather || startWeather
    );

  const safeStartScore =
    startScore === null
      ? 70
      : startScore;

  const safeEndScore =
    endScore === null
      ? 70
      : endScore;

  // Combine both locations
  let score = Math.round(
    (safeStartScore +
      safeEndScore) /
      2
  );

  const startPop =
    startWeather.precipitation_prob ||
    0;

  const endPop =
    endWeather?.precipitation_prob ||
    0;

  const maxRain = Math.max(
    startPop,
    endPop
  );

  const startWind =
    startWeather.wind_speed || 0;

  const endWind =
    endWeather?.wind_speed || 0;

  const maxWind = Math.max(
    startWind,
    endWind
  );

  /*
   * Additional commute-specific
   * road/weather penalties.
   */
  if (maxRain > 60) {
    score -= 15;
  }

  if (maxWind > 35) {
    score -= 15;
  }

  const startCondition =
    (
      startWeather.condition_text ||
      ''
    ).toLowerCase();

  const endCondition =
    (
      endWeather?.condition_text ||
      ''
    ).toLowerCase();

  if (
    startCondition.includes(
      'storm'
    ) ||
    endCondition.includes(
      'storm'
    ) ||
    startCondition.includes(
      'thunder'
    ) ||
    endCondition.includes(
      'thunder'
    )
  ) {
    score -= 15;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

/**
 * Finds the closest hourly forecast
 * entry to a target date/time.
 */
export function getHourForecastForTime(
  hourlyData,
  targetDate
) {
  if (
    !Array.isArray(hourlyData) ||
    hourlyData.length === 0
  ) {
    return null;
  }

  const targetMs =
    targetDate.getTime();

  let closest = hourlyData[0];
  let minDiff = Infinity;

  for (const h of hourlyData) {
    if (!h.time) continue;

    const diff = Math.abs(
      new Date(h.time).getTime() -
        targetMs
    );

    if (diff < minDiff) {
      minDiff = diff;
      closest = h;
    }
  }

  return closest;
}

/**
 * Analyzes weather during the complete commute.
 *
 * Origin:
 *     departure weather
 *
 * Destination:
 *     arrival weather
 */
export function analyzeCommute(
  originHourly,
  destinationHourly,
  departureDate,
  durationMins = 30
) {
  if (
    !Array.isArray(originHourly) ||
    originHourly.length === 0
  ) {
    return {
      available: false,
      message:
        'No origin forecast data available.',
    };
  }

  if (
    !Array.isArray(destinationHourly) ||
    destinationHourly.length === 0
  ) {
    return {
      available: false,
      message:
        'No destination forecast data available.',
    };
  }

  const depTime =
    departureDate instanceof Date
      ? departureDate
      : new Date(departureDate);

  const arrivalTime =
    new Date(
      depTime.getTime() +
        durationMins *
          60 *
          1000
    );

  /*
   * Weather at origin when leaving
   */
  const startWeather =
    getHourForecastForTime(
      originHourly,
      depTime
    );

  /*
   * Weather at destination
   * when arriving.
   */
  const endWeather =
    getHourForecastForTime(
      destinationHourly,
      arrivalTime
    );

  if (!startWeather) {
    return {
      available: false,
      message:
        'Could not match departure time to origin forecast.',
    };
  }

  if (!endWeather) {
    return {
      available: false,
      message:
        'Could not match arrival time to destination forecast.',
    };
  }

  /*
   * Rain risk considers both ends
   * of the commute.
   */
  const rainRisk =
    Math.max(
      startWeather.precipitation_prob ||
        0,
      endWeather.precipitation_prob ||
        0
    );

  /*
   * Average temperature
   */
  const startTemp =
    startWeather.temperature ??
    25;

  const endTemp =
    endWeather.temperature ??
    25;

  const avgTemp =
    Math.round(
      (startTemp + endTemp) / 2
    );

  /*
   * Average feels-like temperature
   */
  const startFeels =
    startWeather.feels_like ??
    startTemp;

  const endFeels =
    endWeather.feels_like ??
    endTemp;

  const avgFeelsLike =
    Math.round(
      (startFeels +
        endFeels) /
        2
    );

  /*
   * Worst wind during commute
   */
  const maxWind =
    Math.round(
      Math.max(
        startWeather.wind_speed ||
          0,
        endWeather.wind_speed ||
          0
      )
    );

  /*
   * Conditions at both ends
   */
  const startCondition =
    startWeather.condition_text ||
    'Clear';

  const endCondition =
    endWeather.condition_text ||
    'Clear';

  const condition =
    startCondition ===
    endCondition
      ? startCondition
      : `${startCondition} → ${endCondition}`;

  /*
   * Recommendation
   */
  let recommendation =
    'Comfortable transit conditions.';

  let recType =
    'positive';

  const startConditionLower =
    startCondition.toLowerCase();

  const endConditionLower =
    endCondition.toLowerCase();

  if (
    rainRisk >= 60 ||
    startConditionLower.includes(
      'storm'
    ) ||
    endConditionLower.includes(
      'storm'
    ) ||
    startConditionLower.includes(
      'rain'
    ) ||
    endConditionLower.includes(
      'rain'
    )
  ) {
    recommendation =
      'Carry an umbrella or raincoat. Wet road conditions expected.';

    recType = 'danger';
  } else if (
    rainRisk >= 35
  ) {
    recommendation =
      'Moderate chance of scattered rain. Keep a compact umbrella handy.';

    recType = 'warning';
  } else if (
    avgFeelsLike >= 35
  ) {
    recommendation =
      'Hot and humid conditions expected during your commute. Stay hydrated.';

    recType = 'warning';
  } else if (
    avgFeelsLike <= 10
  ) {
    recommendation =
      'Brisk and cold commute. Wear warm layers.';

    recType = 'info';
  } else if (
    maxWind >= 30
  ) {
    recommendation =
      'Strong wind gusts expected. Extra caution required if traveling by bike or two-wheeler.';

    recType = 'warning';
  } else {
    recommendation =
      'Low rain risk. Smooth and dry commute expected.';

    recType = 'positive';
  }

  /*
   * Check weather one hour after
   * reaching destination.
   */
  const postCommuteTime =
    new Date(
      arrivalTime.getTime() +
        60 *
          60 *
          1000
    );

  const postWeather =
    getHourForecastForTime(
      destinationHourly,
      postCommuteTime
    );

  let weatherShift = null;

  if (postWeather) {
    const postPop =
      postWeather.precipitation_prob ||
      0;

    const postTemp =
      postWeather.temperature ||
      0;

    /*
     * Rain increasing later
     */
    if (
      postPop - rainRisk >=
        25 &&
      postPop >= 45
    ) {
      const postHourLabel =
        new Date(
          postWeather.time
        ).toLocaleTimeString(
          [],
          {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }
        );

      weatherShift =
        `⚠️ Rain probability increases to ${postPop}% around ${postHourLabel}.`;
    }

    /*
     * Rain clearing later
     */
    else if (
      rainRisk >= 50 &&
      postPop <= 20
    ) {
      const postHourLabel =
        new Date(
          postWeather.time
        ).toLocaleTimeString(
          [],
          {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }
        );

      weatherShift =
        `🌤️ Rain expected to clear up around ${postHourLabel}.`;
    }

    /*
     * Temperature increase
     */
    else if (
      postTemp -
        avgTemp >=
        5 &&
      postTemp >= 32
    ) {
      weatherShift =
        '🌡️ Temperatures rise rapidly later in the morning.';
    }
  }

  /*
   * Final commute score
   */
  const commuteScore =
    calculateCommuteScore(
      startWeather,
      endWeather
    );

  return {
    available: true,

    departureTimeLabel:
      depTime.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      ),

    arrivalTimeLabel:
      arrivalTime.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      ),

    rainRisk,

    windSpeed:
      maxWind,

    feelsLike:
      avgFeelsLike,

    temperature:
      avgTemp,

    conditionText:
      condition,

    recommendation,

    recType,

    weatherShift,

    score:
      commuteScore,
  };
}

/**
 * Compares nearby departure times
 * to find the optimal commute window.
 *
 * Candidates:
 * -30 minutes
 * -15 minutes
 * selected time
 * +15 minutes
 * +30 minutes
 */
export function findBestDepartureTime(
  originHourly,
  destinationHourly,
  baseDepartureDate,
  durationMins = 30
) {
  if (
    !Array.isArray(originHourly) ||
    originHourly.length === 0
  ) {
    return null;
  }

  if (
    !Array.isArray(destinationHourly) ||
    destinationHourly.length === 0
  ) {
    return null;
  }

  const baseTime =
    baseDepartureDate instanceof Date
      ? baseDepartureDate
      : new Date(baseDepartureDate);

  const offsets = [
    -30,
    -15,
    0,
    15,
    30,
  ];

  const candidateOptions =
    [];

  for (
    const offset of offsets
  ) {
    const candidateDate =
      new Date(
        baseTime.getTime() +
          offset *
            60 *
            1000
      );

    const analysis =
      analyzeCommute(
        originHourly,
        destinationHourly,
        candidateDate,
        durationMins
      );

    if (
      analysis.available
    ) {
      candidateOptions.push({
        offsetMinutes:
          offset,

        departureDate:
          candidateDate,

        timeLabel:
          candidateDate.toLocaleTimeString(
            [],
            {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }
          ),

        analysis,

        score:
          analysis.score,
      });
    }
  }

  if (
    candidateOptions.length ===
    0
  ) {
    return null;
  }

  /*
   * Find highest score.
   */
  let best =
    candidateOptions[0];

  for (
    const option of
    candidateOptions
  ) {
    if (
      option.score >
      best.score
    ) {
      best = option;
    }
  }

  /*
   * Selected time = offset 0
   */
  const selectedOption =
    candidateOptions.find(
      (c) =>
        c.offsetMinutes === 0
    ) ||
    candidateOptions[0];

  const scoreDiff =
    best.score -
    selectedOption.score;

  /*
   * If the difference is small,
   * keep selected time as optimal.
   */
  const isSelectedBest =
    best.offsetMinutes === 0 ||
    scoreDiff < 8;

  let reason = '';

  if (
    isSelectedBest
  ) {
    reason =
      `Your selected departure at ${selectedOption.timeLabel} has the most favorable weather conditions among nearby windows.`;
  } else {
    const rainDiff =
      selectedOption.analysis
        .rainRisk -
      best.analysis.rainRisk;

    const feelsDiff =
      selectedOption.analysis
        .feelsLike -
      best.analysis.feelsLike;

    if (
      rainDiff >= 15
    ) {
      reason =
        `Lower rain probability (${best.analysis.rainRisk}% vs ${selectedOption.analysis.rainRisk}%) compared to ${selectedOption.timeLabel}.`;
    } else if (
      feelsDiff >= 3
    ) {
      reason =
        `Cooler feels-like temperature (${best.analysis.feelsLike}°C vs ${selectedOption.analysis.feelsLike}°C) than later departure times.`;
    } else {
      reason =
        `More stable and comfortable meteorological conditions than ${selectedOption.timeLabel}.`;
    }
  }

  return {
    recommendedTime:
      best.timeLabel,

    recommendedDate:
      best.departureDate,

    isCurrentSelected:
      isSelectedBest,

    reason,

    bestScore:
      best.score,

    selectedScore:
      selectedOption.score,

    candidates:
      candidateOptions,
  };
}
