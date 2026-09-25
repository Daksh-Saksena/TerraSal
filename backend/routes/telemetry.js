import express from 'express';
import { db } from '../db/schema.js';
import { analyzeSalinity } from '../services/salinityEngine.js';

const router = express.Router();

// Helper to wrap db.get into a promise
const queryGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to wrap db.run into a promise
const execute = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

/**
 * POST /api/telemetry
 * 
 * Endpoint for IoT sensors to push real-time data.
 * Expected body:
 * {
 *   "sensorId": "TS-Node-LUD-01",
 *   "fieldId": "field-001",
 *   "metrics": {
 *     "ec": 4.5,
 *     "waterTable": 1.7
 *   },
 *   "timestamp": "2026-08-15T10:00:00Z"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { fieldId, metrics } = req.body;

    if (!fieldId || !metrics || typeof metrics.ec !== 'number' || typeof metrics.waterTable !== 'number') {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    // 1. Fetch current field profile and rainfall
    const field = await queryGet('SELECT * FROM fields WHERE id = ?', [fieldId]);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const currentMetrics = await queryGet('SELECT rainfall FROM metrics WHERE fieldId = ?', [fieldId]);
    const currentRainfall = currentMetrics ? currentMetrics.rainfall : 0;

    // 2. Run the salinity prediction engine with the new live data
    const analysisInputs = {
      groundwaterEC: metrics.ec,
      waterTableDepth: metrics.waterTable,
      soilType: field.soilType,
      drainageQuality: field.drainageQuality || 'moderate', // default if missing
      rainfallLast30Days: currentRainfall,
      irrigationMethod: field.irrigationMethod || 'flood',
      cropType: field.cropType,
      terrain: 'flat' // Simplified
    };

    const analysisResult = analyzeSalinity(analysisInputs);

    // 3. Update the database
    // Update metrics
    await execute(
      'UPDATE metrics SET ec = ?, waterTable = ? WHERE fieldId = ?', 
      [metrics.ec, metrics.waterTable, fieldId]
    );

    // Update field risk scores
    await execute(
      'UPDATE fields SET riskScore = ?, riskLevel = ? WHERE id = ?',
      [analysisResult.riskScore, analysisResult.riskLevel, fieldId]
    );

    // 4. Generate alerts if risk is high/critical
    if (analysisResult.riskScore > 60) {
      const alertMsg = `[${new Date().toISOString()}] Sensor alert: EC reached ${metrics.ec} dS/m, WT at ${metrics.waterTable}m. Risk level: ${analysisResult.riskLevel}`;
      await execute('INSERT INTO alerts (fieldId, message) VALUES (?, ?)', [fieldId, alertMsg]);
    }

    console.log(`[Telemetry] Received data for ${fieldId}. New Risk Score: ${analysisResult.riskScore}`);

    res.status(200).json({ 
      success: true, 
      riskScore: analysisResult.riskScore, 
      riskLevel: analysisResult.riskLevel 
    });

  } catch (error) {
    console.error('[Telemetry] Error processing sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
