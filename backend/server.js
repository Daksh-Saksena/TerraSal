import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';

import telemetryRoutes from './routes/telemetry.js';
import { updateWeatherForAllFields } from './services/weatherService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Setup background jobs
// In a real production app, use node-cron or Agenda.
// For this prototype, we'll run weather update on startup, then every 24 hours.
setTimeout(async () => {
  await updateWeatherForAllFields();
  setInterval(updateWeatherForAllFields, 24 * 60 * 60 * 1000); // 24 hours
}, 2000); // delay 2 seconds to ensure DB is ready

app.listen(PORT, () => {
  console.log(`TerraSal Backend running on http://localhost:${PORT}`);
});
