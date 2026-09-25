import axios from 'axios';
import { db } from '../db/schema.js';

const API_URL = 'http://localhost:3000/api/telemetry';

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

async function simulateSensors() {
  console.log('[SensorSimulator] Starting IoT sensor simulation...');
  
  // Only fields that have connected sensors
  const fields = await queryAll('SELECT id FROM fields WHERE sensorConnected = 1');
  
  if (fields.length === 0) {
    console.log('[SensorSimulator] No connected sensors found. Exiting.');
    return;
  }

  // Every 10 seconds, send telemetry for one of the sensors (round-robin)
  let currentIndex = 0;

  setInterval(async () => {
    const fieldId = fields[currentIndex].id;
    currentIndex = (currentIndex + 1) % fields.length;

    try {
      // Get current metrics to base the fluctuation on
      const currentMetrics = await queryGet('SELECT ec, waterTable FROM metrics WHERE fieldId = ?', [fieldId]);
      if (!currentMetrics) return;

      // Add a slight random fluctuation (+/- 0.05 for EC, +/- 0.02 for water table)
      const ecFluctuation = (Math.random() * 0.1) - 0.05;
      const wtFluctuation = (Math.random() * 0.04) - 0.02;

      const newEC = Math.max(0.1, parseFloat((currentMetrics.ec + ecFluctuation).toFixed(2)));
      const newWT = Math.max(0.1, parseFloat((currentMetrics.waterTable + wtFluctuation).toFixed(2)));

      const payload = {
        sensorId: `TS-Node-${fieldId.split('-')[1]}`,
        fieldId,
        metrics: {
          ec: newEC,
          waterTable: newWT
        },
        timestamp: new Date().toISOString()
      };

      await axios.post(API_URL, payload);
      console.log(`[SensorSimulator] Sent payload for ${fieldId} | EC: ${newEC} | WT: ${newWT}`);
    } catch (err) {
      console.error(`[SensorSimulator] Failed to send telemetry for ${fieldId}:`, err.response?.data || err.message);
    }
  }, 10000); // 10 seconds
}

// Start simulation
setTimeout(simulateSensors, 3000); // Wait for server to be up
