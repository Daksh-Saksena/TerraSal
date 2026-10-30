import axios from 'axios';
import { queryAll, queryGet } from '../db/index.js';
const API_URL = process.env.API_URL || 'http://localhost:3000/api/telemetry';
async function simulateSensors() {
  console.log(`[SensorSimulator] Starting IoT sensor simulation targeting ${API_URL}...`);
  const fields = await queryAll('SELECT id FROM fields WHERE sensorConnected = 1');
  if (fields.length === 0) {
    console.log('[SensorSimulator] No connected sensors found. Exiting.');
    return;
  }
  let currentIndex = 0;
  setInterval(async () => {
    const fieldId = fields[currentIndex].id;
    currentIndex = (currentIndex + 1) % fields.length;
    try {
      const currentMetrics = await queryGet('SELECT ec, waterTable FROM metrics WHERE fieldId = ?', [fieldId]);
      if (!currentMetrics) return;
      const ecFluctuation = (Math.random() * 0.1) - 0.05;
      const wtFluctuation = (Math.random() * 0.04) - 0.02;
      const newEC = Math.max(0.1, parseFloat((currentMetrics.ec + ecFluctuation).toFixed(2)));
      const newWT = Math.max(0.5, parseFloat((currentMetrics.waterTable + wtFluctuation).toFixed(2)));
      const payload = {
        sensorId: `TS-Sensor-${fieldId.slice(-4).toUpperCase()}`,
        fieldId,
        metrics: {
          ec: newEC,
          waterTable: newWT
        },
        timestamp: new Date().toISOString()
      };
      const res = await axios.post(API_URL, payload);
      console.log(`[SensorSimulator] Sent data for ${fieldId}: EC=${newEC}, WT=${newWT}. Response: ${res.data.riskLevel} (${res.data.riskScore})`);
    } catch (err) {
      console.error(`[SensorSimulator] Failed sending data for ${fieldId}:`, err.message);
    }
  }, 10000);
}
simulateSensors();