/**
 * Smart Weather Advice & Notification Engine
 * Generates proactive contextual notifications based on real weather metrics:
 * - Umbrella need (precipitation probability / current rain)
 * - Sunscreen & sunglasses advisory (UV index)
 * - Clothing recommendations (jacket/sweater/light cotton/windbreaker)
 * - Health & commute alerts (high heat/humidity, storm warnings)
 */

export function generateWeatherAdvice(weather) {
  const notifications = [];
  const {
    temperature,
    feels_like,
    humidity,
    wind_speed,
    precipitation,
    uv_index,
    weather_group,
    condition_text,
  } = weather;

  // 1. Umbrella / Rain Advisory
  if (precipitation > 0 || weather_group === 'rain' || weather_group === 'storm') {
    notifications.push({
      id: 'rain-alert',
      type: 'warning',
      icon: 'Umbrella',
      title: 'Carry an Umbrella',
      message: `Active precipitation detected (${condition_text}). Roads may be slick; carry a sturdy umbrella or raincoat before stepping outside.`,
      urgency: 'high',
    });
  } else if (weather.hourly && weather.hourly.slice(0, 4).some((h) => h.precipitation_prob >= 40)) {
    const rainyHour = weather.hourly.slice(0, 4).find((h) => h.precipitation_prob >= 40);
    const hourLabel = rainyHour?.time ? new Date(rainyHour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'soon';
    notifications.push({
      id: 'rain-soon',
      type: 'warning',
      icon: 'Umbrella',
      title: 'Rain Expected Shortly',
      message: `Rain probability spikes to ${rainyHour?.precipitation_prob}% around ${hourLabel}. Keep an umbrella ready before leaving.`,
      urgency: 'high',
    });
  } else if (weather.hourly && weather.hourly.slice(0, 8).some((h) => h.precipitation_prob >= 25)) {
    const rainyHour = weather.hourly.slice(0, 8).find((h) => h.precipitation_prob >= 25);
    const hourLabel = rainyHour?.time ? new Date(rainyHour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'later today';
    notifications.push({
      id: 'rain-later',
      type: 'info',
      icon: 'Umbrella',
      title: 'Scattered Rain Possible',
      message: `Rain probability peaks at ${rainyHour?.precipitation_prob}% around ${hourLabel}. Having a compact umbrella in your bag is recommended.`,
      urgency: 'medium',
    });
  } else {
    notifications.push({
      id: 'no-umbrella',
      type: 'positive',
      icon: 'Sun',
      title: 'No Umbrella Needed',
      message: 'Dry conditions expected across your immediate travel window.',
      urgency: 'low',
    });
  }

  // 2. Sunscreen & UV Protection
  if (uv_index >= 8) {
    notifications.push({
      id: 'uv-extreme',
      type: 'danger',
      icon: 'SunDim',
      title: 'High UV Alert (UV ' + uv_index + ')',
      message: 'Very high solar radiation! Apply broad-spectrum SPF 50+ sunscreen, wear UV-blocking sunglasses, and seek shade between 11 AM and 4 PM.',
      urgency: 'high',
    });
  } else if (uv_index >= 5) {
    notifications.push({
      id: 'uv-moderate',
      type: 'warning',
      icon: 'SunDim',
      title: 'Apply Sunscreen (UV ' + uv_index + ')',
      message: 'Moderate-to-high UV levels. Apply SPF 30+ sunscreen and consider sunglasses if planning outdoor activities.',
      urgency: 'medium',
    });
  }

  // 3. Context-Aware Clothing & Thermal Comfort (evaluates feels_like + humidity + wind)
  const roundTemp = Math.round(temperature);
  const roundFeels = Math.round(feels_like);

  if (roundFeels >= 33 || (roundTemp >= 26 && humidity >= 70 && roundFeels >= 30)) {
    notifications.push({
      id: 'clothing-humid-heat',
      type: 'warning',
      icon: 'Flame',
      title: 'Feels Hot & Humid',
      message: `Although it's ${roundTemp}°C, high humidity (${humidity}%) makes it feel closer to ${roundFeels}°C. Light, breathable clothing is recommended.`,
      urgency: 'medium',
    });
  } else if (roundTemp >= 35 || roundFeels >= 38) {
    notifications.push({
      id: 'clothing-hot',
      type: 'warning',
      icon: 'Flame',
      title: 'Wear Breathable Cotton',
      message: `Intense heat at ${roundTemp}°C (feels like ${roundFeels}°C)! Wear loose, light-colored cotton clothing, stay hydrated, and limit direct sun exposure.`,
      urgency: 'high',
    });
  } else if (roundFeels <= 8 || roundTemp <= 8) {
    notifications.push({
      id: 'clothing-heavy',
      type: 'warning',
      icon: 'ThermometerSnowflake',
      title: 'Wear Thick Winter Clothes',
      message: `Brisk chill at ${roundTemp}°C (feels like ${roundFeels}°C). Wear a heavy jacket, thermal layers, and warm headwear.`,
      urgency: 'high',
    });
  } else if (roundFeels <= 16 || roundTemp <= 16) {
    notifications.push({
      id: 'clothing-jacket',
      type: 'info',
      icon: 'Shirt',
      title: 'Wear a Light Jacket or Sweater',
      message: `Cool ambient conditions at ${roundTemp}°C (feels like ${roundFeels}°C). A light jacket, hoodie, or knit sweater is recommended for comfort.`,
      urgency: 'medium',
    });
  } else {
    notifications.push({
      id: 'clothing-comfort',
      type: 'positive',
      icon: 'Smile',
      title: 'Comfortable Daily Attire',
      message: `Comfortable and mild at ${roundTemp}°C (feels like ${roundFeels}°C with ${humidity}% humidity). Regular casual or work attire is well suited.`,
      urgency: 'low',
    });
  }

  // 4. Wind & Chill Alert
  if (wind_speed >= 30) {
    notifications.push({
      id: 'wind-alert',
      type: 'warning',
      icon: 'Wind',
      title: 'Strong Wind Warning',
      message: `Gusty winds at ${Math.round(wind_speed)} km/h. Secure loose outdoor items; extra care needed on highways and bridges.`,
      urgency: 'medium',
    });
  } else if (wind_speed >= 20 && roundFeels <= 15) {
    notifications.push({
      id: 'wind-chill',
      type: 'info',
      icon: 'Wind',
      title: 'Wind Chill Notice',
      message: `Breezy conditions (${Math.round(wind_speed)} km/h) make it feel cooler (${roundFeels}°C). A windbreaker will keep you comfortable.`,
      urgency: 'low',
    });
  }

  // 5. Humidity & Hydration (if not already highlighted in clothing)
  if (roundTemp >= 28 && humidity >= 80 && !notifications.some((n) => n.id === 'clothing-humid-heat')) {
    notifications.push({
      id: 'muggy-alert',
      type: 'info',
      icon: 'Droplets',
      title: 'High Humidity & Muggy Air',
      message: `Relative humidity is elevated at ${humidity}%, elevating the heat index to ${roundFeels}°C. Drink plenty of water throughout the day.`,
      urgency: 'medium',
    });
  }

  return notifications;
}
