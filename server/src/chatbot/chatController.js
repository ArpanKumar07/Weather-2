import { fetchFullWeather } from '../services/weatherService.js';

export async function handleChatMessage(req, res) {
  try {
    const { query, ageGroup = 'adult', lat, lon, weatherData } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    let weather = weatherData;
    if (!weather && lat !== undefined && lon !== undefined) {
      try {
        weather = await fetchFullWeather(parseFloat(lat), parseFloat(lon));
      } catch (err) {
        console.warn('Chat controller: failed to fetch live weather:', err.message);
      }
    }

    // Return structured acknowledgment and metrics
    return res.status(200).json({
      status: 'success',
      query: query.trim(),
      ageGroup,
      timestamp: new Date().toISOString(),
      weatherContext: weather
        ? {
            city: weather.city_name,
            temp: weather.temperature,
            condition: weather.condition_text,
            rainProb: weather.precipitation_probability || 0,
            uv: weather.uv_index || 0,
          }
        : null,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Failed to process chat query.' });
  }
}
