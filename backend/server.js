import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import telemetryRoutes from './routes/telemetry.js';
import { initializeDB } from './db/schema.js';
import { updateWeatherForAllFields } from './services/weatherService.js';

// Load .env if present
try {
  process.loadEnvFile();
} catch {
  // .env is optional if env vars provided in container/environment
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Initialize DB and start server
async function startServer() {
  try {
    await initializeDB();
    console.log('[Database] Schema checked and initialized.');

    app.listen(PORT, () => {
      console.log(`TerraSal Backend running on http://localhost:${PORT}`);
    });

    // Run weather update job safely in background
    setTimeout(async () => {
      try {
        await updateWeatherForAllFields();
      } catch (err) {
        console.warn('[WeatherService] Initial weather check failed or skipped:', err.message);
      }
      setInterval(async () => {
        try {
          await updateWeatherForAllFields();
        } catch (err) {
          console.warn('[WeatherService] Periodic weather check skipped:', err.message);
        }
      }, 24 * 60 * 60 * 1000);
    }, 2000);

  } catch (err) {
    console.error('[Server] Failed to initialize database:', err);
    process.exit(1);
  }
}

startServer();
