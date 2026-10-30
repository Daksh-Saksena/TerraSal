import app from './app.js';
import { initializeDB } from './db/index.js';
import { updateWeatherForAllFields } from './services/weatherService.js';
const PORT = process.env.PORT || 3000;
async function startServer() {
  try {
    await initializeDB();
    console.log('[Database] Ready.');
    app.listen(PORT, () => {
      console.log(`TerraSal Backend running on http://localhost:${PORT}`);
    });
    if (!process.env.VERCEL) {
      setTimeout(async () => {
        try {
          await updateWeatherForAllFields();
        } catch (err) {
          console.warn('[WeatherService] Initial weather check notice:', err.message);
        }
      }, 3000);
    }
  } catch (err) {
    console.error('[Server] Failed to initialize:', err.message);
    process.exit(1);
  }
}
startServer();