/**
 * Catastrophic Weather & Hazard Detection Engine
 * Detects severe, life-threatening weather events:
 * - Flash Floods, Inundation & Torrential Downpours
 * - Extreme Heatstroke, Hyperthermia & Lethal Heatwaves
 * - Severe Thunderstorms, Lightning & Cloud-to-Ground Discharges
 * - Destructive Gale-Force Windstorms & Cyclonic Gusts
 * - Severe Cold Waves & Rapid-Onset Frostbite
 *
 * If no catastrophic conditions are detected, produces an encouraging "Relief" state.
 */

export function analyzeWeatherHazards(weather) {
  if (!weather) {
    return {
      hasCatastrophicEvent: false,
      hazards: [],
      relief: {
        status: 'Awaiting Meteorological Telemetry',
        badge: 'Standby',
        headline: 'No Active Threats Detected',
        message: 'Weather data is currently synchronizing with ground radar.',
        metrics: [],
      },
    };
  }

  const {
    city_name = 'Local Station',
    temperature = 22,
    feels_like = 22,
    humidity = 50,
    wind_speed = 10,
    precipitation = 0,
    weather_code = 0,
    weather_group = 'clear',
    condition_text = 'Clear',
    hourly = [],
    daily = [],
  } = weather;

  const hazards = [];

  // 1. FLOOD & WATERLOGGING HAZARD
  // WMO codes: 65 (Heavy Rain), 81 (Moderate Showers), 82 (Violent Rain Showers), 95/96/99 (Thunderstorm with rain/hail)
  const isViolentRainCode = [65, 81, 82, 96, 99].includes(weather_code);
  const isHighPrecip = precipitation >= 10;
  const hasImminentTorrentialRain = hourly.slice(0, 6).some(
    (h) => h.precipitation_prob >= 75 && (h.condition_text?.toLowerCase().includes('rain') || [65, 81, 82].includes(h.weather_code))
  );
  const highDailyRain = daily[0]?.precipitation_sum >= 35;

  if (isViolentRainCode || isHighPrecip || hasImminentTorrentialRain || highDailyRain) {
    hazards.push({
      id: 'flood-hazard',
      type: 'flood',
      severity: 'CRITICAL',
      badge: 'Flash Flood & Waterlogging Warning',
      title: 'Catastrophic Flash Flood & Waterlogging Hazard',
      icon: 'Waves',
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.15))',
      borderColor: 'rgba(239, 68, 68, 0.5)',
      summary: `Severe torrential downpours detected in ${city_name} (${precipitation > 0 ? `${precipitation} mm/h active rain` : condition_text}). High inundation risk.`,
      impact: 'Rapid stormwater runoff leading to submerged road underpasses, localized flash floods, sewer overflows, and severe vehicular stalls.',
      thresholdExceeded: precipitation >= 10 ? `Active precipitation: ${precipitation} mm/hr (Threshold: 10 mm/hr)` : `Severe WMO precipitation pattern (${condition_text})`,
      precautions: [
        'Avoid driving or walking through flooded underpasses and low-lying roadways ("Turn Around, Don’t Drown").',
        'Disconnect electrical mains and ground-level electronics if water encroaches living spaces.',
        'Keep smartphones, power banks, and emergency flashlights charged.',
        'Store bottled drinking water and keep emergency evacuation contacts on speed dial.'
      ],
      emergencyCallout: 'Keep away from storm drains, drainage culverts, and submerged electrical poles.'
    });
  }

  // 2. EXTREME HEATSTROKE & HYPERTHERMIA HAZARD
  // Triggered when real temp >= 38°C OR feels_like >= 42°C OR (temp >= 35°C AND humidity >= 65%)
  const isLethalHeat = feels_like >= 42 || temperature >= 38;
  const isMuggyHeatwave = temperature >= 35 && humidity >= 65; // Dangerous wet-bulb temperature

  if (isLethalHeat || isMuggyHeatwave) {
    hazards.push({
      id: 'heatstroke-hazard',
      type: 'heatstroke',
      severity: 'CRITICAL',
      badge: 'Lethal Heatstroke & Hyperthermia Emergency',
      title: 'Extreme Heatstroke & Heatwave Alert',
      icon: 'Flame',
      color: '#f97316',
      bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(220, 38, 38, 0.15))',
      borderColor: 'rgba(249, 115, 22, 0.5)',
      summary: `Lethal heat index registered! Ambient temperature is ${Math.round(temperature)}°C, but apparent "feels-like" reaches ${Math.round(feels_like)}°C with ${humidity}% humidity.`,
      impact: 'High danger of heat exhaustion, rapid physiological hyperthermia, heat cramps, and cardiovascular collapse within 20-30 minutes of direct sun exposure.',
      thresholdExceeded: `Heat Index / Feels-like: ${Math.round(feels_like)}°C (Dangerous Threshold: 41°C+)`,
      precautions: [
        'Strictly stay indoors in air-conditioned or well-ventilated spaces between 11:00 AM and 4:30 PM.',
        'Drink ORS (Oral Rehydration Solution), coconut water, or salted lemonade continuously—do not wait to feel thirsty.',
        'Wear loose, ultra-light, breathable cotton clothing and UV-rated headwear.',
        'Watch for symptoms of heatstroke: cessation of sweating, dizziness, confusion, nausea, or rapid pulse. Seek immediate medical ER assistance.'
      ],
      emergencyCallout: 'Never leave children or pets inside stationary parked vehicles under any circumstance.'
    });
  }

  // 3. SEVERE THUNDERSTORM & LIGHTNING HAZARD
  if ([95, 96, 99].includes(weather_code) || weather_group === 'storm') {
    hazards.push({
      id: 'storm-hazard',
      type: 'storm',
      severity: 'SEVERE',
      badge: 'Severe Thunderstorm & Lightning Strike Hazard',
      title: 'Active Thunderstorm & Ground Lightning Warning',
      icon: 'CloudLightning',
      color: '#a855f7',
      bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(126, 34, 206, 0.15))',
      borderColor: 'rgba(168, 85, 247, 0.5)',
      summary: `Intense convective thunderstorm cells active over ${city_name} with severe cloud-to-ground electrical discharge potential.`,
      impact: 'Lethal lightning strikes, hail damage, sudden torrential downpours, and power grid disruption.',
      thresholdExceeded: `Active WMO Code ${weather_code} (${condition_text})`,
      precautions: [
        'Move indoors into substantial concrete buildings immediately; open sheds offer zero lightning protection.',
        'Avoid contact with plumbing fixtures, metal pipes, and wired electronics.',
        'Stay clear of isolated tall trees, metal fences, and open rooftop terraces.',
        'If caught in a car, keep windows fully rolled up and avoid touching exterior metallic body panels.'
      ],
      emergencyCallout: 'Remember the 30-30 rule: If thunder follows lightning in under 30 seconds, seek immediate enclosed shelter.'
    });
  }

  // 4. DESTRUCTIVE GALE / HIGH-WIND HAZARD
  if (wind_speed >= 40) {
    hazards.push({
      id: 'gale-hazard',
      type: 'wind',
      severity: 'HIGH',
      badge: 'Destructive Gale & Windstorm Warning',
      title: 'High Gale-Force Wind Warning',
      icon: 'Wind',
      color: '#38bdf8',
      bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.15))',
      borderColor: 'rgba(56, 189, 248, 0.5)',
      summary: `Sustained wind velocities recorded at ${Math.round(wind_speed)} km/h in ${city_name}.`,
      impact: 'High danger of falling tree limbs, unsecured commercial hoardings, flying debris, and two-wheeler instability.',
      thresholdExceeded: `Wind Speed: ${Math.round(wind_speed)} km/h (Hazard Threshold: 40+ km/h)`,
      precautions: [
        'Clear rooftop terraces and balconies of unsecured flower pots and loose objects.',
        'Exercise high caution while driving high-profile vehicles or motorcycles on flyovers and bridges.',
        'Stay away from temporary scaffolding, billboards, and aged trees.'
      ],
      emergencyCallout: 'Report snapped power cables or dangerous fallen branches to municipal disaster helplines immediately.'
    });
  }

  // 5. EXTREME FREEZING & COLD WAVE HAZARD
  if (temperature <= 3 || feels_like <= 0) {
    hazards.push({
      id: 'freeze-hazard',
      type: 'cold',
      severity: 'DANGEROUS',
      badge: 'Severe Freezing & Hypothermia Alert',
      title: 'Extreme Cold Wave & Frostbite Warning',
      icon: 'ThermometerSnowflake',
      color: '#67e8f9',
      bgGradient: 'linear-gradient(135deg, rgba(103, 232, 249, 0.25), rgba(6, 182, 212, 0.15))',
      borderColor: 'rgba(103, 232, 249, 0.5)',
      summary: `Dangerous sub-normal temperatures (${Math.round(temperature)}°C, feels like ${Math.round(feels_like)}°C) in ${city_name}.`,
      impact: 'Rapid hypothermia onset, frostbite danger on exposed skin, and hazardous black ice formation on road bridges.',
      thresholdExceeded: `Feels-like temperature: ${Math.round(feels_like)}°C (Freezing hazard limit: <= 0°C)`,
      precautions: [
        'Wear multi-layer insulated thermal clothing, windproof jacket, insulated gloves, and fleece cap.',
        'Keep skin exposure under 15 minutes in windy conditions.',
        'Ensure heated indoor shelters for infants, seniors, and domestic pets.'
      ],
      emergencyCallout: 'Keep warm liquids and thermal blankets readily accessible.'
    });
  }

  const hasCatastrophicEvent = hazards.length > 0;

  // RELIEF STATE: Generated when no catastrophic events exist!
  const relief = {
    status: 'All Clear — Atmospheric Relief',
    badge: 'Relief / Normalcy Confirmed',
    headline: `All Clear: No Catastrophic Threats for ${city_name}`,
    message: `Atmospheric parameters for ${city_name} are stable and well within safe ecological thresholds. There are no active flash flood warnings, lethal heatstroke hazards, violent storms, or cyclone wind threats detected in the current forecast window. You can carry on with outdoor commutes and activities in complete comfort and safety.`,
    metrics: [
      {
        id: 'flood-metric',
        label: 'Flood Threat',
        status: 'Safe / Low',
        value: `${precipitation || 0} mm/h`,
        detail: 'No waterlogging or riverine flood risks detected.',
        icon: 'Waves',
        safe: true,
      },
      {
        id: 'heat-metric',
        label: 'Heatstroke Threat',
        status: 'Safe Comfort Band',
        value: `Feels like ${Math.round(feels_like)}°C`,
        detail: 'Thermal comfort within normal physiological range.',
        icon: 'Flame',
        safe: true,
      },
      {
        id: 'storm-metric',
        label: 'Thunderstorm Threat',
        status: 'Clear / Inactive',
        value: condition_text,
        detail: 'No convective lightning or hail cells recorded.',
        icon: 'CloudLightning',
        safe: true,
      },
      {
        id: 'wind-metric',
        label: 'Wind Severity',
        status: 'Calm / Normal',
        value: `${Math.round(wind_speed)} km/h`,
        detail: 'Safe wind speeds for transit and outdoor structures.',
        icon: 'Wind',
        safe: true,
      },
    ],
  };

  return {
    hasCatastrophicEvent,
    hazards,
    relief,
    cityName: city_name,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Pre-configured Simulation Scenarios for Instant Testing & Demo
 */
export function getSimulatedScenario(type, cityName = 'Kolkata') {
  if (type === 'flood') {
    return analyzeWeatherHazards({
      city_name: cityName,
      temperature: 26,
      feels_like: 29,
      humidity: 95,
      wind_speed: 34,
      precipitation: 38, // High torrential rain
      weather_code: 82, // Violent Rain Showers
      weather_group: 'rain',
      condition_text: 'Violent Rain Showers & Inundation',
      hourly: [
        { precipitation_prob: 95, weather_code: 82, condition_text: 'Violent Rain' },
        { precipitation_prob: 90, weather_code: 82, condition_text: 'Heavy Rain' }
      ],
      daily: [{ precipitation_sum: 85 }],
    });
  }

  if (type === 'heatstroke') {
    return analyzeWeatherHazards({
      city_name: cityName,
      temperature: 42,
      feels_like: 48,
      humidity: 72,
      wind_speed: 12,
      precipitation: 0,
      weather_code: 0,
      weather_group: 'clear',
      condition_text: 'Blistering Sun & Extreme Heatwave',
      hourly: [],
      daily: [],
    });
  }

  if (type === 'storm') {
    return analyzeWeatherHazards({
      city_name: cityName,
      temperature: 24,
      feels_like: 25,
      humidity: 88,
      wind_speed: 46,
      precipitation: 18,
      weather_code: 99, // Thunderstorm with Heavy Hail
      weather_group: 'storm',
      condition_text: 'Thunderstorm with Heavy Hail',
      hourly: [],
      daily: [],
    });
  }

  if (type === 'relief') {
    return analyzeWeatherHazards({
      city_name: cityName,
      temperature: 24,
      feels_like: 24,
      humidity: 55,
      wind_speed: 11,
      precipitation: 0,
      weather_code: 1,
      weather_group: 'clear',
      condition_text: 'Mainly Clear & Pleasant',
      hourly: [
        { precipitation_prob: 5, weather_code: 1, condition_text: 'Mainly Clear' }
      ],
      daily: [{ precipitation_sum: 0 }],
    });
  }

  return null;
}
