import { AGE_PROFILES } from './chatbotPreferences.js';

/**
 * Helper to format temperature with unit
 */
function formatT(celsius, unit = 'C') {
  if (celsius === null || celsius === undefined) return '--';
  if (unit === 'F') {
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

/**
 * Determines Air Quality Index approximation based on weather metrics
 */
function estimateAQI(weather) {
  const humidity = weather?.humidity || 50;
  const wind = weather?.wind_speed || 10;
  const temp = weather?.temperature || 25;

  // Stagnant, humid, hot air typically traps pollutants
  let baseAQI = 55;
  if (wind < 5) baseAQI += 35;
  else if (wind > 20) baseAQI -= 25;

  if (humidity > 80 && temp > 30) baseAQI += 20;
  if (humidity < 30) baseAQI += 10;

  const aqi = Math.max(25, Math.min(220, Math.round(baseAQI)));
  let category = 'Good';
  let color = '#10b981';
  let advice = 'Air is fresh and suitable for all outdoor activities.';

  if (aqi > 150) {
    category = 'Unhealthy';
    color = '#ef4444';
    advice = 'Sensitive groups & seniors should limit prolonged outdoor exertion; consider a mask.';
  } else if (aqi > 100) {
    category = 'Moderate / Sensitive Warning';
    color = '#f59e0b';
    advice = 'Acceptable for most; children with asthma or seniors should take gentle breaks.';
  } else if (aqi > 50) {
    category = 'Fair';
    color = '#3b82f6';
    advice = 'Air quality is decent. Enjoy outdoor strolls and exercise.';
  }

  return { aqi, category, color, advice };
}

/**
 * Finds highest rain probability and time window in the next 12 hours
 */
function getRainWindow(hourly = []) {
  if (!hourly || hourly.length === 0) {
    return { hasRain: false, maxProb: 0, peakTime: null, hours: [] };
  }

  const next12 = hourly.slice(0, 12);
  let maxProb = 0;
  let peakTime = null;
  const rainHours = [];

  next12.forEach((h) => {
    const prob = h.precipitation_probability || 0;
    if (prob > maxProb) {
      maxProb = prob;
      peakTime = h.time ? new Date(h.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;
    }
    if (prob >= 35) {
      rainHours.push({
        time: h.time ? new Date(h.time).toLocaleTimeString([], { hour: 'numeric' }) : '',
        prob,
        condition: h.condition_text,
      });
    }
  });

  return {
    hasRain: maxProb >= 35,
    isLikelyRain: maxProb >= 60,
    maxProb,
    peakTime,
    rainHours,
  };
}

/**
 * Core Chatbot Engine
 */
export function generateChatbotResponse(query, context = {}) {
  const q = (query || '').trim().toLowerCase();
  const weather = context.weather;
  const ageGroup = context.ageGroup || 'adult';
  const ageProfile = AGE_PROFILES[ageGroup] || AGE_PROFILES.adult;
  const unit = context.tempUnit || 'C';
  const history = context.history || [];

  const city = weather?.city_name || 'your location';
  const temp = weather?.temperature ?? 24;
  const feelsLike = weather?.feels_like ?? temp;
  const condition = weather?.condition_text || 'Pleasant';
  const humidity = weather?.humidity ?? 60;
  const wind = weather?.wind_speed ?? 12;
  const uv = weather?.uv_index ?? 3;
  const hourly = weather?.hourly || [];
  const daily = weather?.daily || [];

  const rainInfo = getRainWindow(hourly);
  const aqiInfo = estimateAQI(weather);

  // Extract previous intent from conversation history for follow-ups
  const lastBotMsg = history.filter((m) => m.sender === 'bot').slice(-1)[0];
  const lastIntent = lastBotMsg?.intent || 'general';

  // Check if query is a follow-up about tomorrow / future
  const isTomorrow = /\b(tomorrow|next day|tmrw)\b/.test(q);
  const isDayAfter = /\b(day after|overmorrow)\b/.test(q);
  const isTonight = /\b(tonight|this evening|night)\b/.test(q);
  const isMorning = /\b(morning|sunrise)\b/.test(q);
  const isAfternoon = /\b(afternoon|midday|noon)\b/.test(q);

  // Follow-up context resolution
  let targetDay = null;
  let targetDayLabel = 'Today';
  if (isTomorrow && daily.length > 1) {
    targetDay = daily[1];
    targetDayLabel = `Tomorrow (${targetDay.day_name || 'Next Day'})`;
  } else if (isDayAfter && daily.length > 2) {
    targetDay = daily[2];
    targetDayLabel = `${targetDay.day_name || 'Day After Tomorrow'}`;
  }

  // 1. GREETINGS
  if (/^(hi|hello|hey|greetings|hola|namaste|yo|good morning|good evening|good afternoon)\b/.test(q)) {
    const greetingText = ageGroup === 'child'
      ? `Hey kiddo! 🎈 I'm your MAUSAM360 weather buddy for **${city}**. Right now it's **${formatT(temp, unit)}** and **${condition}**. What fun plans do you have today?`
      : ageGroup === 'teen'
      ? `Hey! 🎧 MAUSAM360 here. It's **${formatT(temp, unit)}** (${condition}) in **${city}**. Wondering what to wear or if outdoor hangouts are clear? Ask away!`
      : ageGroup === 'senior'
      ? `Good day! 🧓 Welcome to your personal weather advisor for **${city}**. Currently it is **${formatT(temp, unit)}** with ${condition}. I'm here to ensure your outdoor walks and day are safe and comfortable.`
      : `Hello! 🌦️ I'm your MAUSAM360 weather assistant for **${city}**. Currently **${formatT(temp, unit)}**, feels like **${formatT(feelsLike, unit)}**, with ${condition}. How can I assist your schedule today?`;

    return {
      intent: 'greeting',
      text: greetingText,
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'Temp', value: formatT(temp, unit), icon: 'Thermometer' },
            { label: 'Condition', value: condition, icon: 'Cloud' },
            { label: 'Rain Prob', value: `${rainInfo.maxProb}%`, icon: 'Umbrella' },
            { label: 'UV Index', value: `${uv} / 11`, icon: 'Sun' },
          ],
        },
      ],
      quickFollowUps: [
        'What should I wear today?',
        'Can I go for a run today?',
        'Do I need an umbrella?',
        'What should I do today?',
      ],
    };
  }

  // 2. TOMORROW'S FORECAST / FUTURE FOLLOW-UP
  if (targetDay || (isTomorrow && !q.includes('run') && !q.includes('umbrella') && !q.includes('wear'))) {
    const forecastDay = targetDay || (daily.length > 1 ? daily[1] : null);
    if (forecastDay) {
      const dayRain = forecastDay.precipitation_probability_max || 0;
      const willRain = dayRain >= 40;

      let ageAdvice = '';
      if (ageGroup === 'child') {
        ageAdvice = willRain
          ? 'Pack rain boots and splash gear if heading to school!'
          : 'Great day for recess games and playground fun!';
      } else if (ageGroup === 'senior') {
        ageAdvice = willRain
          ? 'Damp pavements expected; plan indoor leisure or wear non-slip shoes.'
          : 'Comfortable conditions for a morning garden walk.';
      } else {
        ageAdvice = willRain
          ? 'Expect rain interruptions; plan your commute with travel buffers.'
          : 'Pleasant weather windows ahead for outdoor tasks.';
      }

      return {
        intent: 'tomorrow_forecast',
        text: `Here is the forecast for **${targetDayLabel}** in **${city}**:\n\n` +
          `• 🌡️ **Max Temp**: ${formatT(forecastDay.temperature_2m_max, unit)} | **Min Temp**: ${formatT(forecastDay.temperature_2m_min, unit)}\n` +
          `• 🌤️ **Condition**: ${forecastDay.condition_text || 'Variable'}\n` +
          `• 🌧️ **Rain Chance**: ${dayRain}% ${willRain ? '(Rain expected)' : '(Dry)'}\n` +
          `• 🧴 **Max UV**: ${forecastDay.uv_index_max || 4} / 11\n\n` +
          `💡 **${ageProfile.label} Tip**: ${ageAdvice}`,
        cards: [
          {
            type: 'metrics',
            items: [
              { label: 'High', value: formatT(forecastDay.temperature_2m_max, unit) },
              { label: 'Low', value: formatT(forecastDay.temperature_2m_min, unit) },
              { label: 'Rain Chance', value: `${dayRain}%` },
              { label: 'UV Max', value: `${forecastDay.uv_index_max || 4}` },
            ],
          },
        ],
        quickFollowUps: [
          'What should I wear tomorrow?',
          'Will I need an umbrella tomorrow?',
          'Can I run tomorrow?',
          'What about the 7-day forecast?',
        ],
      };
    }
  }

  // 2b. TIME-OF-DAY SPECIFIC SUGGESTIONS (Morning, Afternoon, Tonight / Evening)
  if ((isTonight || isMorning || isAfternoon) && !q.includes('run') && !q.includes('umbrella') && !q.includes('wear')) {
    const periodLabel = isTonight ? 'Tonight / This Evening' : isMorning ? 'This Morning' : 'This Afternoon';
    let periodAdvice = '';
    if (isTonight) {
      periodAdvice = `Temps will ease into the evening. Night breezes around ${Math.max(5, wind - 3)} km/h. ${rainInfo.hasRain ? 'Watch for damp pavements.' : 'Ideal for relaxing outdoor dining or casual strolls.'}`;
    } else if (isMorning) {
      periodAdvice = `Morning atmosphere is refreshing with low UV (${Math.min(3, uv)}). Best time for outdoor exercise, garden walks, or fresh commute before peak heat.`;
    } else {
      periodAdvice = `Afternoon temperatures climb to around ${formatT(daily[0]?.temperature_2m_max || temp, unit)}. UV index peaks at ${uv}. Seek shade and keep water handy.`;
    }

    return {
      intent: 'time_of_day',
      text: `⏰ **${periodLabel} Outlook for ${city}:**\n\n` +
        `• **Expected Atmosphere**: ${condition}, around ${formatT(temp, unit)}\n` +
        `• **Key Insight**: ${periodAdvice}\n\n` +
        `💡 **${ageProfile.label} Tip**: ` +
        (ageGroup === 'senior'
          ? (isTonight ? 'Wear a cozy light cardigan if sitting in breezy verandahs or air-conditioned halls.' : 'Stick to flat shaded routes with park benches.')
          : ageGroup === 'child'
          ? (isTonight ? 'Wind down indoors after sunset with quiet games or family reading.' : 'Wear a sun visor and drink fruit juice during recess play!')
          : (isTonight ? 'Pleasant setting for late commute or unwinding with friends.' : 'Carry a hydration bottle and avoid prolonged midday sun exposure.')),
      quickFollowUps: [
        'What should I wear?',
        'Do I need an umbrella?',
        'Can I go for a run today?',
      ],
    };
  }

  // 3. UMBRELLA REMINDER / RAIN TIMING
  if (/\b(umbrella|parasol|carry umbrella|take umbrella|need umbrella)\b/.test(q) ||
      (/\b(rain|raining|drizzle|shower|downpour)\b/.test(q) && !q.includes('run') && !q.includes('picnic')) ||
      (lastIntent === 'umbrella_yes' && (isTomorrow || isDayAfter))) {

    const checkRain = targetDay ? (targetDay.precipitation_probability_max || 0) : rainInfo.maxProb;
    const timeFrame = targetDay ? targetDayLabel : 'today';

    if (checkRain >= 50) {
      const timingDetail = rainInfo.peakTime ? `Peak rain risk is around **${rainInfo.peakTime}** (${rainInfo.maxProb}%).` : 'High probability of rain throughout the day.';
      let ageNote = '';
      if (ageGroup === 'child') ageNote = '👶 Make sure parents pack a colorful umbrella and water-resistant school bag cover!';
      else if (ageGroup === 'senior') ageNote = '🧓 Watch out for slippery wet roads and mossy sidewalks. Carry a light walking umbrella.';
      else if (ageGroup === 'teen') ageNote = '🎧 Keep your backpack zipped and stash a compact umbrella so your electronics stay dry!';
      else ageNote = '💼 Keep a sturdy umbrella in your vehicle/bag; expect wet road delays during commute hours.';

      return {
        intent: 'umbrella_yes',
        text: `☔ **YES, carry an umbrella ${timeFrame}!**\n\n` +
          `Rain probability is **${checkRain}%** in **${city}**. ${timingDetail}\n\n` +
          `${ageNote}`,
        cards: [
          {
            type: 'alert',
            severity: 'warning',
            title: `Rain Alert: ${checkRain}% Probability`,
            desc: `Rain expected in ${city}. Keep wet-weather gear on standby.`,
          },
        ],
        quickFollowUps: [
          'What should I wear in the rain?',
          'How is the commute looking?',
          'When will the rain stop?',
        ],
      };
    } else if (checkRain >= 25) {
      return {
        intent: 'umbrella_maybe',
        text: `🌂 **Maybe — slight rain chance (${checkRain}%) ${timeFrame} in ${city}.**\n\n` +
          `It's mostly overcast/drizzly, but a stray pop-up shower is possible around ${rainInfo.peakTime || 'afternoon'}. Having a compact umbrella won't hurt!`,
        quickFollowUps: ['What should I wear today?', 'Can I go for a run today?'],
      };
    } else {
      return {
        intent: 'umbrella_no',
        text: `☀️ **No umbrella needed ${timeFrame}!**\n\n` +
          `Rain chance is only **${checkRain}%** in **${city}**. Skies are mostly **${condition.toLowerCase()}** with dry conditions. You can leave the heavy rain gear at home!`,
        quickFollowUps: ['Do I need sunscreen?', 'Can I go for a run today?', 'What to wear?'],
      };
    }
  }

  // 4. CLOTHING SUGGESTIONS
  if (/\b(clothing|clothes|wear|outfit|jacket|sweater|coat|shorts|t-shirt|dress code)\b/.test(q)) {
    let top = '';
    let bottom = '';
    let accessories = [];
    let footwear = '';

    if (temp >= 32) {
      top = 'Light, breathable cotton or linen t-shirt in light colors';
      bottom = 'Loose shorts, cotton chinos, or breezy linen pants';
      accessories.push('🕶️ Sunglasses', '🧢 Sun cap / UV visor');
      footwear = 'Breathable sneakers or open sandals';
    } else if (temp >= 24) {
      top = 'Standard cotton shirt, polo, or casual top';
      bottom = 'Jeans, chinos, or comfortable joggers';
      accessories.push('🕶️ Sunglasses if sunny');
      footwear = 'Comfortable everyday sneakers or flats';
    } else if (temp >= 16) {
      top = 'Full-sleeve shirt layered with a light windbreaker or denim jacket';
      bottom = 'Trousers, warm jeans, or tailored pants';
      accessories.push('Light scarf or cardigan on hand');
      footwear = 'Closed-toe shoes or boots';
    } else {
      top = 'Thermal inner layer + heavy sweater or fleece-lined winter coat';
      bottom = 'Heavy jeans, thermal leggings, or wool trousers';
      accessories.push('🧣 Woolen scarf', '🧤 Gloves', 'Beanie');
      footwear = 'Insulated boots or thick socks';
    }

    if (rainInfo.hasRain) {
      accessories.push('☔ Waterproof windcheater or trench coat');
      footwear = 'Water-resistant shoes / non-slip tread boots';
    }

    // Age-specific clothing adjustments
    let ageOutfitTip = '';
    if (ageGroup === 'child') {
      ageOutfitTip = '👶 **Kid Mode**: Easy snap buttons, breathable fabrics to prevent sweat rashes, and extra socks in the bag.';
    } else if (ageGroup === 'senior') {
      ageOutfitTip = '🧓 **Senior Mode**: Layering is key! Keep a soft cardigan or thermal vest ready to protect joints against AC or evening chill.';
    } else if (ageGroup === 'teen') {
      ageOutfitTip = '🎧 **Teen Mode**: Oversized graphic tee or streetwear hoodie depending on breeze, with waterproof kicks if clouds roll in.';
    } else {
      ageOutfitTip = '💼 **Adult Mode**: Smart-casual layers that transition comfortably between air-conditioned offices and outdoor humidity.';
    }

    return {
      intent: 'clothing',
      text: `👕 **Recommended Outfit for ${city} (${formatT(temp, unit)}, ${condition}):**\n\n` +
        `• **Top**: ${top}\n` +
        `• **Bottom**: ${bottom}\n` +
        `• **Footwear**: ${footwear}\n` +
        `• **Accessories**: ${accessories.join(', ') || 'None required'}\n\n` +
        `${ageOutfitTip}`,
      cards: [
        {
          type: 'clothing',
          items: [
            { label: 'Layering', value: temp > 28 ? 'Single breezy layer' : temp > 18 ? 'Light 2-layer' : 'Heavy thermal layers' },
            { label: 'Rain Gear', value: rainInfo.hasRain ? 'Waterproof jacket required' : 'No rainwear needed' },
            { label: 'UV Shield', value: uv >= 5 ? 'Sunscreen + hat advised' : 'Normal exposure' },
          ],
        },
      ],
      quickFollowUps: [
        'Do I need sunscreen?',
        'Will it rain this afternoon?',
        'Can I go for a run today?',
      ],
    };
  }

  // 5. RUNNING / FITNESS / JOGGING RECOMMENDATION
  if (/\b(run|running|jog|jogging|workout|exercise|cardio|gym|fitness)\b/.test(q)) {
    const isHot = temp > ageProfile.maxHeatThreshold;
    const isFreezing = temp < ageProfile.minColdThreshold;
    const isRaining = rainInfo.isLikelyRain;

    let canRun = true;
    let score = 'High';
    let bestSlot = 'Early morning (6:00 AM – 8:00 AM) or sunset (5:30 PM – 7:00 PM)';
    let rationale = [];

    if (isRaining) {
      canRun = false;
      score = 'Poor';
      rationale.push(`🌧️ Rain chance of ${rainInfo.maxProb}% with slippery tarmac.`);
    }
    if (isHot) {
      score = 'Caution';
      rationale.push(`🌡️ High temperature (${formatT(temp, unit)}) increases dehydration & heat stress.`);
    }
    if (isFreezing) {
      score = 'Caution';
      rationale.push(`❄️ Chilly temperature (${formatT(temp, unit)}) requires adequate thermal layers and longer joint warmups.`);
    }
    if (aqiInfo.aqi > 130) {
      score = 'Poor';
      rationale.push(`🌫️ Elevated AQI (${aqiInfo.aqi}) — heavy respiration outdoors may cause throat fatigue.`);
    }

    let ageActionAdvice = '';
    if (ageGroup === 'senior') {
      ageActionAdvice = canRun && !isHot
        ? '🧓 **Senior Fitness**: Favor brisk walking on even park trails rather than high-impact pavement running. Hydrate every 15 minutes.'
        : '🧓 **Senior Fitness**: Skip outdoor running today. Opt for indoor stretching, light yoga, or treadmill walking in temperature-controlled rooms.';
    } else if (ageGroup === 'child') {
      ageActionAdvice = canRun
        ? '👶 **Kids Outdoor**: Great time for tag or playing in grassy parks, but wear a cap and drink water frequently.'
        : '👶 **Kids Outdoor**: Rain/heat alert! Keep play indoors — board games, dance, or indoor play zones.';
    } else if (ageGroup === 'teen') {
      ageActionAdvice = '🎧 **Teen Fitness**: Hit the tracks before the midday sun peaks. Take electrolyte water if playing soccer or basketball!';
    } else {
      ageActionAdvice = '💼 **Adult Fitness**: Ideal pace early in the morning. Keep heart-rate monitor active and wear moisture-wicking gear.';
    }

    return {
      intent: 'activity_running',
      text: `🏃 **Running & Workout Advice for ${city}:**\n\n` +
        `• **Suitability**: ${canRun && score !== 'Poor' ? '✅ **Good Window for Running**' : '⚠️ **Outdoor Running Not Recommended Right Now**'}\n` +
        `• **Current Conditions**: ${formatT(temp, unit)}, Humidity ${humidity}%, Wind ${wind} km/h\n` +
        `• **Best Time Window**: ${bestSlot}\n` +
        (rationale.length > 0 ? `• **Risk Factors**: ${rationale.join(' ')}\n\n` : '\n') +
        `${ageActionAdvice}`,
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'Run Suitability', value: score },
            { label: 'Hydration Target', value: temp > 30 ? '750ml / hr' : '500ml / hr' },
            { label: 'Pavement Grip', value: rainInfo.hasRain ? 'Slippery' : 'Optimal' },
            { label: 'Air Purity', value: aqiInfo.category },
          ],
        },
      ],
      quickFollowUps: [
        'What about cycling?',
        'Hydration tips for running',
        'What should I wear for exercise?',
      ],
    };
  }

  // 6. CYCLING / SPORTS / WALKING
  if (/\b(cycl|cycling|bicycle|bike|ride|walk|walking|stroll|cricket|football|soccer|tennis|sports)\b/.test(q)) {
    const isWindy = wind > 30;
    const isRaining = rainInfo.isLikelyRain;

    let message = '';
    if (isRaining) {
      message = `🌧️ **Outdoor sports/cycling are discouraged right now in ${city}.** Wet roads and sudden downpours pose safety hazards. Consider indoor badminton, gym, or table tennis.`;
    } else if (isWindy) {
      message = `💨 **Windy Conditions (${wind} km/h).** Cyclists should be cautious of crosswinds. Ball sports (cricket, tennis) might see deflected trajectories. Morning or shielded indoor turf is better.`;
    } else {
      message = `🚴 **Great day for cycling, walking, or field sports in ${city}!** Temperature is ${formatT(temp, unit)} with stable breezes (${wind} km/h).`;
    }

    return {
      intent: 'sports_cycling',
      text: `${message}\n\n` +
        `💡 **${ageProfile.label} Tip**: ` +
        (ageGroup === 'senior'
          ? 'Maintain a gentle pace and choose shaded, paved walking loops with park benches nearby.'
          : ageGroup === 'child'
          ? 'Wear bicycle helmets, knee pads, and stay clear of wet puddles!'
          : 'Stay hydrated with electrolytes and use sunglasses to protect against insect glares and UV rays.'),
      quickFollowUps: ['Hydration suggestions', 'What should I wear?', 'UV index advice'],
    };
  }

  // 7. PICNIC / OUTDOOR ACTIVITY PLANNING
  if (/\b(picnic|outing|hangout|park|garden|outdoor plan|date|trip)\b/.test(q)) {
    const rainChance = rainInfo.maxProb;
    const isComfortable = temp >= 20 && temp <= 30 && rainChance < 30;

    const windowText = isComfortable
      ? 'Late afternoon (4:00 PM – 6:30 PM) will have gorgeous light and cooler breezes!'
      : rainChance >= 40
      ? 'Carry a canopy or choose a venue with sheltered indoor pavilions (like museums or cafes) in case of sudden showers.'
      : 'Midday will be quite warm; schedule outdoor picnic blankets for after 4:30 PM.';

    return {
      intent: 'picnic_planning',
      text: `🧺 **Outdoor Outing & Picnic Guide for ${city}:**\n\n` +
        `• **Weather Vibe**: ${condition}, ${formatT(temp, unit)}\n` +
        `• **Rain Risk**: ${rainChance}% probability\n` +
        `• **Recommended Window**: ${windowText}\n\n` +
        `💡 **${ageProfile.label} Advice**: ` +
        (ageGroup === 'child'
          ? 'Bring frisbees, bubble makers, and mosquito repellent spray for evening park grass!'
          : ageGroup === 'senior'
          ? 'Carry portable foldable chairs so you do not have to sit directly on damp ground; carry a thermos of warm tea.'
          : 'Pack a waterproof picnic mat, cold beverages, and an insulated tote bag.'),
      quickFollowUps: ['Can I go for a run today?', 'What should I wear?', 'UV protection tips'],
    };
  }

  // 8. UV / SUN PROTECTION ADVICE
  if (/\b(uv|sun|sunscreen|sunburn|spf|sunblock|sunglasses|shade|radiation)\b/.test(q)) {
    let spf = 'SPF 30';
    let urgency = 'Low';
    let advice = '';

    if (uv >= 8) {
      urgency = 'Very High / Extreme';
      spf = 'SPF 50+ Broad Spectrum';
      advice = 'Seek shade between 11:00 AM and 4:00 PM. Reapply sunscreen every 2 hours. Wear UV-blocking sunglasses and a wide-brimmed hat.';
    } else if (uv >= 5) {
      urgency = 'Moderate to High';
      spf = 'SPF 30 – SPF 50';
      advice = 'Sun protection needed during midday hours. Slip on a shirt, slop on sunscreen, slap on a hat!';
    } else {
      urgency = 'Mild';
      spf = 'SPF 15 – SPF 30';
      advice = 'Safe sun exposure for morning vitamin D synthesis; normal skin protection is sufficient.';
    }

    let ageNote = '';
    if (ageGroup === 'child') {
      ageNote = '👶 **Child Sun Care**: Children have delicate skin. Use mineral/zinc-based baby sunscreen and keep infants out of direct noon sunlight.';
    } else if (ageGroup === 'senior') {
      ageNote = '🧓 **Senior Eye & Skin Protection**: Use polarized sunglasses to reduce glare cataracts risk, and keep arms covered with light UV-protective sleeves.';
    } else {
      ageNote = '💼 **Adult Daily Care**: Apply sunscreen under makeup or daily moisturizer before your morning commute.';
    }

    return {
      intent: 'uv_protection',
      text: `🧴 **UV & Sun Protection Guide for ${city}:**\n\n` +
        `• **Current UV Index**: **${uv} / 11** (${urgency})\n` +
        `• **Recommended Protection**: ${spf}\n` +
        `• **Action Steps**: ${advice}\n\n` +
        `${ageNote}`,
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'UV Index', value: `${uv} / 11` },
            { label: 'Peak Sun Hours', value: '11 AM – 3 PM' },
            { label: 'Rec. SPF', value: spf },
            { label: 'Sunburn Time', value: uv >= 8 ? '~15 mins' : uv >= 5 ? '~30 mins' : '> 60 mins' },
          ],
        },
      ],
      quickFollowUps: ['Hydration suggestions', 'What should I wear today?', 'Weather summary'],
    };
  }

  // 9. HYDRATION SUGGESTIONS
  if (/\b(hydration|water|drink|thirst|thirsty|dehydrat|fluid|electrolyt)\b/.test(q)) {
    let liters = '2.5 – 3.0 Liters';
    if (temp > 33) liters = '3.5 – 4.0 Liters + Electrolytes';
    else if (temp < 18) liters = '2.0 – 2.5 Liters';

    let ageHydration = '';
    if (ageGroup === 'child') {
      liters = '1.2 – 1.8 Liters';
      ageHydration = '👶 **Kids Hydration**: Children often forget to drink until already thirsty. Encourage regular sips of water, fresh fruit juices, or coconut water every hour of playtime.';
    } else if (ageGroup === 'senior') {
      liters = '2.0 – 2.5 Liters';
      ageHydration = '🧓 **Senior Alert**: Thirst perception diminishes with age. Keep a measured water jug at eye level and sip water steadily throughout the day to support kidney health and steady blood pressure.';
    } else if (ageGroup === 'teen') {
      liters = '2.5 – 3.2 Liters';
      ageHydration = '🎧 **Teen Tip**: Cut down on sugary sodas and energy drinks under heat; hydrate with lemon water, buttermilk, or sports electrolytes during practice.';
    } else {
      ageHydration = '💼 **Adult Target**: Keep a reusable 1L bottle at your desk; aim to finish 1 bottle before lunch and 2 bottles before evening.';
    }

    return {
      intent: 'hydration',
      text: `💧 **Hydration Target for ${city} (${formatT(temp, unit)}, Humidity ${humidity}%):**\n\n` +
        `• **Target Daily Fluid Intake**: **${liters}**\n` +
        `• **Heat Index Stress**: ${temp > 30 ? 'Elevated sweat loss — replenishment needed' : 'Normal metabolic maintenance'}\n\n` +
        `${ageHydration}`,
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'Daily Goal', value: liters },
            { label: 'Current Temp', value: formatT(temp, unit) },
            { label: 'Humidity', value: `${humidity}%` },
            { label: 'Electrolytes', value: temp > 30 ? 'Recommended' : 'Optional' },
          ],
        },
      ],
      quickFollowUps: ['What should I wear today?', 'Can I go for a run today?', 'UV protection advice'],
    };
  }

  // 10. WIND ALERTS
  if (/\b(wind|windy|breeze|gust|gusts|storm wind|gale)\b/.test(q)) {
    let status = 'Gentle & Calming';
    let advice = 'No wind disruption expected.';

    if (wind > 45) {
      status = '🚨 Gale / Strong Wind Warning';
      advice = 'Secure loose outdoor furniture and flowerpots. Watch for falling tree limbs and avoid tall open scaffolding.';
    } else if (wind > 25) {
      status = '💨 Gusty & Moderate Breeze';
      advice = 'Noticeable gusts. High-profile vehicles should exercise care on highway bridges; hold tight onto umbrellas.';
    } else if (wind > 12) {
      status = '🍃 Pleasant Moderate Breeze';
      advice = 'Fresh air circulation, great for kite flying, sailing, and outdoor drying of laundry.';
    }

    return {
      intent: 'wind',
      text: `💨 **Wind & Atmospheric Flow for ${city}:**\n\n` +
        `• **Current Speed**: **${wind} km/h** (${status})\n` +
        `• **Impact Assessment**: ${advice}\n\n` +
        `💡 **${ageProfile.label} Note**: ` +
        (ageGroup === 'senior'
          ? 'Sudden chill gusts can aggravate stiff joints; wear a light windbreaker.'
          : ageGroup === 'child'
          ? 'Keep light hats pinned down so they do not blow away!'
          : 'Two-wheeler riders should stay alert for sudden side gusts on open flyovers.'),
      quickFollowUps: ['Do I need an umbrella?', 'Can I cycle today?', 'Weather summary'],
    };
  }

  // 11. AIR QUALITY / AQI
  if (/\b(air quality|aqi|pollution|smog|breathing|clean air|dust|mask)\b/.test(q)) {
    return {
      intent: 'air_quality',
      text: `🌫️ **Air Quality Insights for ${city}:**\n\n` +
        `• **Estimated AQI**: **${aqiInfo.aqi}** (${aqiInfo.category})\n` +
        `• **Health Guidance**: ${aqiInfo.advice}\n\n` +
        `💡 **${ageProfile.label} Safety**: ` +
        (ageGroup === 'senior'
          ? '🧓 Seniors with respiratory sensitivities or asthma should do early morning walks before traffic peak, or use indoor air purifiers.'
          : ageGroup === 'child'
          ? '👶 Children breathe more air per pound of body weight than adults; limit intense cardio during hazy afternoons.'
          : '💼 Great conditions for standard commute and workout; wear a standard anti-pollution mask if riding bikes in heavy traffic.'),
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'AQI Score', value: `${aqiInfo.aqi}` },
            { label: 'Category', value: aqiInfo.category },
            { label: 'Outdoor Risk', value: aqiInfo.aqi > 100 ? 'Moderate' : 'Low' },
            { label: 'Mask Advice', value: aqiInfo.aqi > 150 ? 'Recommended' : 'Not Required' },
          ],
        },
      ],
      quickFollowUps: ['Can I run today?', 'What should I wear today?', 'Weather summary'],
    };
  }

  // 12. SEVERE WEATHER ALERTS
  if (/\b(severe|alert|warning|storm|thunderstorm|danger|cyclone|flood|heatwave|lightning)\b/.test(q)) {
    const isThunder = condition.toLowerCase().includes('thunder') || condition.toLowerCase().includes('storm');
    const isHeatwave = temp > 39;
    const isHeavyRain = rainInfo.maxProb > 75;

    let alertSeverity = 'info';
    let alertTitle = 'No Severe Weather Warnings';
    let alertDesc = `Conditions in ${city} are currently stable with no active emergency weather bulletins.`;

    if (isThunder) {
      alertSeverity = 'danger';
      alertTitle = '⚡ Severe Thunderstorm Warning';
      alertDesc = `Active convective storm cells in ${city}. Avoid open fields, metal fences, and disconnect sensitive plugged electronics.`;
    } else if (isHeatwave) {
      alertSeverity = 'danger';
      alertTitle = '🔥 Extreme Heat Advisory';
      alertDesc = `Temperatures reaching ${formatT(temp, unit)}. High risk of heat cramps and exhaustion. Stay indoors in air-conditioned environments.`;
    } else if (isHeavyRain) {
      alertSeverity = 'warning';
      alertTitle = '🌧️ Heavy Rainfall & Waterlogging Alert';
      alertDesc = `Elevated downpour chance (${rainInfo.maxProb}%). Low-lying underpasses and arterial roads may experience slow traffic.`;
    }

    return {
      intent: 'severe_alerts',
      text: `🚨 **Weather Safety & Alert Status for ${city}:**\n\n` +
        `**${alertTitle}**\n${alertDesc}\n\n` +
        `🛡️ **Emergency Advice for ${ageProfile.label}**: ` +
        (ageGroup === 'senior'
          ? 'Keep emergency contact numbers handy, ensure critical medications are stocked, and avoid venturing out into storms.'
          : ageGroup === 'child'
          ? 'Stay indoors with family; do not play near overflowing drains or waterlogged puddles.'
          : 'Charge your mobile devices and power banks, and check traffic apps before commuting.'),
      cards: [
        {
          type: 'alert',
          severity: alertSeverity,
          title: alertTitle,
          desc: alertDesc,
        },
      ],
      quickFollowUps: ['How is the commute looking?', 'Do I need an umbrella?', 'Tomorrow’s forecast'],
    };
  }

  // 13. TRAVEL & COMMUTE ADVICE
  if (/\b(travel|commute|transit|traffic|drive|driving|road|metro|bus|car|office)\b/.test(q)) {
    let roadCondition = 'Dry and clear';
    let commuteScore = '88 / 100 (Optimal)';
    let delays = 'Standard transit schedules';

    if (rainInfo.isLikelyRain) {
      roadCondition = 'Wet, possible ponding & reduced tire traction';
      commuteScore = '55 / 100 (Caution)';
      delays = '+15 to 25 mins delay during peak hours';
    } else if (temp > 36) {
      roadCondition = 'Hot asphalt, check tire pressure';
      commuteScore = '72 / 100 (Moderate)';
    }

    return {
      intent: 'commute',
      text: `🚗 **Travel & Commute Advisory for ${city}:**\n\n` +
        `• **Commute Score**: ${commuteScore}\n` +
        `• **Road Surface**: ${roadCondition}\n` +
        `• **Transit Delay Risk**: ${delays}\n\n` +
        `💡 **${ageProfile.label} Travel Tip**: ` +
        (ageGroup === 'senior'
          ? 'If traveling by bus or cab, avoid rush hour (8:30 AM – 10:30 AM). Step carefully off curbs onto wet tiles.'
          : ageGroup === 'teen'
          ? 'Ensure student bus/metro passes are in waterproof sleeves; allow extra time between campus lectures.'
          : 'If driving, maintain a 3-second braking distance in rain and switch on low-beam headlights during cloudbursts.'),
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'Commute Score', value: commuteScore },
            { label: 'Pavement Risk', value: rainInfo.hasRain ? 'Moderate' : 'Low' },
            { label: 'Visibility', value: 'Good (> 8 km)' },
            { label: 'Wind Impact', value: `${wind} km/h` },
          ],
        },
      ],
      quickFollowUps: ['Do I need an umbrella?', 'What to wear today?', 'Weather summary'],
    };
  }

  // 14. "WHAT SHOULD I DO TODAY?" / DAILY EXECUTIVE BRIEFING
  if (/\b(what should i do|plan my day|daily briefing|day plan|schedule my day|today plan)\b/.test(q)) {
    let topActivities = [];
    if (temp > 32 || rainInfo.isLikelyRain) {
      topActivities = [
        '🏛️ Visit local museums, art galleries, or libraries',
        '☕ Explore a cozy indoor rooftop cafe or bakery',
        '🛍️ Indoor shopping mall stroll & cinema',
      ];
    } else {
      topActivities = [
        '🌳 Morning jogging or leisurely walk in botanical parks',
        '📸 Architectural photography & monument sightseeing',
        '🧺 Sunset picnic or street food exploration',
      ];
    }

    return {
      intent: 'daily_briefing',
      text: `🧠 **Your Personal Daily Weather Briefing for ${city} (${ageProfile.badge}):**\n\n` +
        `• 🌡️ **Temperature**: ${formatT(temp, unit)} (Feels like ${formatT(feelsLike, unit)})\n` +
        `• 🌤️ **Atmosphere**: ${condition} with ${humidity}% humidity and ${wind} km/h wind\n` +
        `• 🌧️ **Rain Expectation**: ${rainInfo.maxProb}% probability ${rainInfo.peakTime ? `(watch around ${rainInfo.peakTime})` : ''}\n` +
        `• 🧴 **UV Level**: ${uv} / 11 (${uv >= 5 ? 'Sunscreen needed' : 'Gentle'})\n\n` +
        `🎯 **Recommended Activities for You Today**:\n` +
        topActivities.map((a) => `• ${a}`).join('\n') + `\n\n` +
        `💡 **Special Focus for ${ageProfile.label}**: ${ageProfile.tagline}.`,
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'Weather', value: condition },
            { label: 'High / Low', value: `${formatT(daily[0]?.temperature_2m_max, unit)} / ${formatT(daily[0]?.temperature_2m_min, unit)}` },
            { label: 'Rain Prob', value: `${rainInfo.maxProb}%` },
            { label: 'Suitability', value: rainInfo.maxProb > 50 ? 'Indoor Favored' : 'Outdoor Friendly' },
          ],
        },
      ],
      quickFollowUps: [
        'What should I wear?',
        'Can I go for a run today?',
        'What about tomorrow?',
      ],
    };
  }

  // 15. WEATHER SUMMARY / OVERVIEW
  if (/\b(summary|overview|brief|tl;?dr|how is it outside|weather now)\b/.test(q)) {
    const summaryText = `${condition}, ${formatT(temp, unit)}, humidity ${humidity}%, ${rainInfo.maxProb}% chance of rain ${rainInfo.peakTime ? `after ${rainInfo.peakTime}` : ''}. ${wind > 25 ? 'Breezy winds.' : 'Calm breeze.'}`;

    return {
      intent: 'summary',
      text: `📊 **Weather Summary for ${city}:**\n\n` +
        `> "${summaryText}"\n\n` +
        `• **Current Temp**: ${formatT(temp, unit)} (Feels like ${formatT(feelsLike, unit)})\n` +
        `• **Today's Range**: ${formatT(daily[0]?.temperature_2m_min, unit)} to ${formatT(daily[0]?.temperature_2m_max, unit)}\n` +
        `• **AQI Status**: ${aqiInfo.category} (${aqiInfo.aqi})\n` +
        `• **Personalized for**: ${ageProfile.badge}`,
      cards: [
        {
          type: 'metrics',
          items: [
            { label: 'Current', value: formatT(temp, unit) },
            { label: 'Feels Like', value: formatT(feelsLike, unit) },
            { label: 'Humidity', value: `${humidity}%` },
            { label: 'Rain', value: `${rainInfo.maxProb}%` },
          ],
        },
      ],
      quickFollowUps: [
        'What should I wear today?',
        'Do I need an umbrella?',
        'What should I do today?',
      ],
    };
  }

  // 16. EXTENDED 7-DAY / 15-DAY FORECAST
  if (/\b(forecast|7 day|15 day|weekly|weekend|multi day)\b/.test(q)) {
    const nextDays = daily.slice(0, 5);
    const dayRows = nextDays.map((d) => (
      `• **${d.day_name || 'Day'}**: ${formatT(d.temperature_2m_max, unit)} / ${formatT(d.temperature_2m_min, unit)} — ${d.condition_text || 'Clear'} (${d.precipitation_probability_max || 0}% rain)`
    )).join('\n');

    return {
      intent: 'forecast_multi',
      text: `📅 **Extended Multi-Day Forecast for ${city}:**\n\n` +
        `${dayRows}\n\n` +
        `💡 Tap any day's forecast in the dashboard cards above for full hourly breakdown!`,
      quickFollowUps: ['What about tomorrow?', 'Will it rain this weekend?', 'What to wear today?'],
    };
  }

  // 17. AGE-SPECIFIC EXPLICIT QUESTIONS
  if (/\b(child|kid|children|teen|teenager|adult|senior|elderly|grandparent|for my age)\b/.test(q)) {
    return {
      intent: 'age_profile',
      text: `👶👤🧓 **Age-Adapted Weather Intelligence:**\n\n` +
        `You are currently viewing in **${ageProfile.badge}** (${ageProfile.tagline}).\n\n` +
        `• **Heat Sensitivity Limit**: Above ${formatT(ageProfile.maxHeatThreshold, unit)} we trigger heat exhaustion reminders.\n` +
        `• **Cold Chill Limit**: Below ${formatT(ageProfile.minColdThreshold, unit)} we recommend thermal joint protection.\n` +
        `• **UV Threshold**: UV ≥ ${ageProfile.maxUVThreshold} triggers proactive sunscreen & shade prompts.\n\n` +
        `You can easily switch age modes using the selector at the top of this chatbox at any time!`,
      quickFollowUps: ['What should I do today?', 'What should I wear?', 'Can I go for a run today?'],
    };
  }

  // 18. DEFAULT INTELLIGENT FALLBACK / GENERAL QUERY
  return {
    intent: 'general',
    text: `🌦️ In **${city}**, it is currently **${formatT(temp, unit)}** (${condition}), feels like **${formatT(feelsLike, unit)}** with **${humidity}% humidity** and **${wind} km/h wind**.\n\n` +
      (rainInfo.hasRain ? `⚠️ Rain is likely today (up to ${rainInfo.maxProb}%). ` : `Dry conditions prevail with only ${rainInfo.maxProb}% rain chance. `) +
      `\n\nAs a **${ageProfile.label}**, ${ageProfile.tagline}.\n\n` +
      `Feel free to ask me anything specific like:\n` +
      `• *"Can I go for a run today?"*\n` +
      `• *"Should I carry an umbrella?"*\n` +
      `• *"What should I wear?"*\n` +
      `• *"What about tomorrow?"*`,
    cards: [
      {
        type: 'metrics',
        items: [
          { label: 'Temp', value: formatT(temp, unit) },
          { label: 'Rain Prob', value: `${rainInfo.maxProb}%` },
          { label: 'Wind', value: `${wind} km/h` },
          { label: 'UV Index', value: `${uv} / 11` },
        ],
      },
    ],
    quickFollowUps: [
      'What should I wear today?',
      'Can I go for a run today?',
      'Do I need an umbrella?',
      'What should I do today?',
    ],
  };
}
