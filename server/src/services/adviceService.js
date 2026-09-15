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
      message: `Active precipitation detected (${condition_text}). Roads may be slippery; carry a sturdy umbrella or raincoat before stepping outside.`,
      urgency: 'high',
    });
  } else if (weather.hourly && weather.hourly.slice(0, 8).some((h) => h.precipitation_prob > 35)) {
    const rainyHour = weather.hourly.slice(0, 8).find((h) => h.precipitation_prob > 35);
    const hourLabel = rainyHour?.time ? new Date(rainyHour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'soon';
    notifications.push({
      id: 'rain-soon',
      type: 'info',
      icon: 'Umbrella',
      title: 'Rain Expected Later',
      message: `Rain probability peaks at ${rainyHour?.precipitation_prob}% around ${hourLabel}. Better keep a compact umbrella in your bag!`,
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

  // 3. Clothing & Gear Advisory
  if (temperature <= 8) {
    notifications.push({
      id: 'clothing-heavy',
      type: 'warning',
      icon: 'ThermometerSnowflake',
      title: 'Wear Thick Winter Clothes',
      message: `Brisk chill at ${Math.round(temperature)}°C (feels like ${Math.round(feels_like)}°C). Wear a heavy jacket, thermal layers, and a woolen cap.`,
      urgency: 'high',
    });
  } else if (temperature <= 17) {
    notifications.push({
      id: 'clothing-jacket',
      type: 'info',
      icon: 'Shirt',
      title: 'Wear a Light Jacket or Sweater',
      message: `Pleasant but cool at ${Math.round(temperature)}°C. A light jacket, hoodie, or knit sweater is recommended for comfort.`,
      urgency: 'medium',
    });
  } else if (temperature >= 35) {
    notifications.push({
      id: 'clothing-hot',
      type: 'warning',
      icon: 'Flame',
      title: 'Wear Breathable Cotton',
      message: `Intense heat at ${Math.round(temperature)}°C! Wear loose, light-colored cotton clothing, stay hydrated with electrolytes, and avoid prolonged sun exposure.`,
      urgency: 'high',
    });
  } else {
    notifications.push({
      id: 'clothing-comfort',
      type: 'positive',
      icon: 'Smile',
      title: 'Comfortable Daily Attire',
      message: `Temperature is mild at ${Math.round(temperature)}°C. Regular casual or formal wear is completely suitable.`,
      urgency: 'low',
    });
  }

  // 4. Wind Alert
  if (wind_speed >= 30) {
    notifications.push({
      id: 'wind-alert',
      type: 'warning',
      icon: 'Wind',
      title: 'Strong Wind Warning',
      message: `Gusty winds at ${Math.round(wind_speed)} km/h. Secure loose items, take care while cycling or driving on highways.`,
      urgency: 'medium',
    });
  }

  // 5. Humidity & Heat Index
  if (temperature >= 28 && humidity >= 75) {
    notifications.push({
      id: 'muggy-alert',
      type: 'info',
      icon: 'Droplets',
      title: 'High Humidity & Muggy Conditions',
      message: `Relative humidity is high at ${humidity}%, making it feel like ${Math.round(feels_like)}°C. Drink plenty of water throughout the day.`,
      urgency: 'medium',
    });
  }

  return notifications;
}
