import axios from 'axios';
import { queryAll, queryGet, execute } from '../db/index.js';

// OpenWeatherMap API Key loaded from environment
const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function updateWeatherForAllFields() {
  try {
    console.log('[WeatherService] Starting weather update for all fields...');

    if (!API_KEY) {
      console.warn('[WeatherService] Notice: OPENWEATHER_API_KEY is not set. Skipping live external weather fetch.');
      return { updated: 0, reason: 'OPENWEATHER_API_KEY not configured' };
    }

    const coordinatesMap = {
      'Ludhiana, Punjab': { lat: 30.9010, lon: 75.8573 },
      'Hisar, Haryana': { lat: 29.1492, lon: 75.7217 },
      'Sri Ganganagar, Rajasthan': { lat: 29.9167, lon: 73.8833 },
      'Amritsar, Punjab': { lat: 31.6340, lon: 74.8723 },
      'Bathinda, Punjab': { lat: 30.2110, lon: 74.9455 },
      'Bikaner, Rajasthan': { lat: 28.0229, lon: 73.3119 }
    };

    const fields = await queryAll('SELECT id, location, lat, lng FROM fields');
    let updatedCount = 0;

    for (const field of fields) {
      const coords = (field.lat && field.lng)
        ? { lat: field.lat, lon: field.lng }
        : coordinatesMap[field.location];

      if (!coords) continue;

      try {
        const response = await axios.get(BASE_URL, {
          params: {
            lat: coords.lat,
            lon: coords.lon,
            appid: API_KEY,
            units: 'metric'
          },
          timeout: 6000
        });

        const weatherData = response.data;
        const recentRain = (weatherData.rain && (weatherData.rain['1h'] || weatherData.rain['3h'])) || 0;

        if (recentRain > 0) {
          const metrics = await queryGet('SELECT rainfall FROM metrics WHERE fieldId = ?', [field.id]);
          if (metrics) {
            const currentRain = parseFloat(metrics.rainfall) || 0;
            const newRainfall = parseFloat((currentRain + recentRain).toFixed(2));
            await execute('UPDATE metrics SET rainfall = ? WHERE fieldId = ?', [newRainfall, field.id]);
            updatedCount++;
          }
        }
      } catch (err) {
        console.warn(`[WeatherService] Error fetching weather for field ${field.id}:`, err.message);
      }
    }

    console.log(`[WeatherService] Weather update complete. Updated ${updatedCount} field(s).`);
    return { updated: updatedCount };
  } catch (error) {
    console.error('[WeatherService] Weather update failed:', error.message);
    throw error;
  }
}

/**
 * Fetch live weather from OpenWeatherMap for any latitude and longitude (pin-drop)
 * Returns temperature, humidity, rainfall, wind speed, and meteorological condition.
 * Falls back safely to realistic regional climatological averages if offline or API key absent.
 */
export async function getWeatherForCoordinates(lat, lon) {
  if (!API_KEY) {
    return getRealisticWeatherFallback(lat, lon);
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric'
      },
      timeout: 5000
    });

    const d = response.data;
    const rain = (d.rain && (d.rain['1h'] || d.rain['3h'])) || 0;

    return {
      cityName: d.name || 'Pinned Location',
      temperature: Math.round(d.main?.temp ?? 28),
      humidity: d.main?.humidity ?? 52,
      rainfallRecent: rain,
      rainfallLast30DaysEst: Math.round(rain * 10 + 12),
      weatherDesc: d.weather?.[0]?.description ?? 'Clear skies',
      weatherMain: d.weather?.[0]?.main ?? 'Clear',
      windSpeed: d.wind?.speed ?? 3.5,
    };
  } catch (err) {
    console.warn(`[WeatherService] Live weather request failed for (${lat}, ${lon}):`, err.message);
    return getRealisticWeatherFallback(lat, lon);
  }
}

function getRealisticWeatherFallback(lat, lon) {
  // Approximate seasonal estimates for Northern India agricultural belt
  return {
    cityName: (lat && lon) ? `${Number(lat).toFixed(2)}°N, ${Number(lon).toFixed(2)}°E` : 'Pinned Location',
    temperature: 29,
    humidity: 46,
    rainfallRecent: 0,
    rainfallLast30DaysEst: 14,
    weatherDesc: 'Sunny & Dry',
    weatherMain: 'Clear',
    windSpeed: 4.2
  };
}
