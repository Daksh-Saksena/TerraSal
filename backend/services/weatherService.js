import axios from 'axios';
import { db } from '../db/schema.js';

// OpenWeatherMap API Key provided by user
const API_KEY = '4983b22c89d9b72d5cf93ca85172d6ed';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Helper to wrap db queries
const queryAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const queryGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const execute = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export async function updateWeatherForAllFields() {
  try {
    console.log('[WeatherService] Starting weather update for all fields...');
    
    // In a real database, we would extract coordinates from the location or store them directly.
    // For this prototype, we'll map location strings to approximate coordinates.
    const coordinatesMap = {
      'Ludhiana, Punjab': { lat: 30.9010, lon: 75.8573 },
      'Hisar, Haryana': { lat: 29.1492, lon: 75.7217 },
      'Sri Ganganagar, Rajasthan': { lat: 29.9167, lon: 73.8833 },
      'Amritsar, Punjab': { lat: 31.6340, lon: 74.8723 },
      'Bathinda, Punjab': { lat: 30.2110, lon: 74.9455 },
      'Bikaner, Rajasthan': { lat: 28.0229, lon: 73.3119 }
    };

    const fields = await queryAll('SELECT id, location FROM fields');

    for (const field of fields) {
      const coords = coordinatesMap[field.location];
      if (!coords) continue;

      try {
        const response = await axios.get(BASE_URL, {
          params: {
            lat: coords.lat,
            lon: coords.lon,
            appid: API_KEY,
            units: 'metric'
          }
        });

        const weatherData = response.data;
        // OpenWeatherMap provides rain in mm over the last 1h or 3h
        // e.g. weatherData.rain && weatherData.rain['1h']
        const recentRain = (weatherData.rain && (weatherData.rain['1h'] || weatherData.rain['3h'])) || 0;
        
        if (recentRain > 0) {
          console.log(`[WeatherService] Rain detected at ${field.location}: ${recentRain}mm`);
          
          // Add this recent rain to the field's accumulated 30-day rainfall
          // In a real production system, we'd have a time-series DB and sum the last 30 days.
          // Here, we just add it to the existing metric.
          const metrics = await queryGet('SELECT rainfall FROM metrics WHERE fieldId = ?', [field.id]);
          if (metrics) {
            const newRainfall = parseFloat((metrics.rainfall + recentRain).toFixed(2));
            await execute('UPDATE metrics SET rainfall = ? WHERE fieldId = ?', [newRainfall, field.id]);
          }
        }
      } catch (err) {
        console.error(`[WeatherService] Error fetching weather for ${field.location}:`, err.message);
      }
    }
    
    console.log('[WeatherService] Weather update complete.');
  } catch (error) {
    console.error('[WeatherService] Critical failure:', error);
  }
}
