import express from 'express';
import { queryGet, execute } from '../db/index.js';
import { analyzeSalinity } from '../services/salinityEngine.js';

const router = express.Router();

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
    const { fieldId, metrics } = req.body || {};

    if (!fieldId || !metrics || typeof metrics.ec !== 'number' || typeof metrics.waterTable !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: fieldId, metrics.ec (number), and metrics.waterTable (number) are required' });
    }

    // 1. Fetch current field profile and rainfall
    const field = await queryGet('SELECT * FROM fields WHERE id = ?', [fieldId]);
    if (!field) {
      return res.status(404).json({ error: `Field '${fieldId}' not found` });
    }

    const currentMetrics = await queryGet('SELECT rainfall FROM metrics WHERE fieldId = ?', [fieldId]);
    const currentRainfall = currentMetrics ? (parseFloat(currentMetrics.rainfall) || 0) : 0;

    // 2. Run the salinity prediction engine with the new live data
    const analysisInputs = {
      groundwaterEC: metrics.ec,
      waterTableDepth: metrics.waterTable,
      soilType: field.soilType || 'loamy',
      drainageQuality: field.drainageQuality || 'moderate',
      rainfallLast30Days: currentRainfall,
      irrigationMethod: field.irrigationMethod || 'flood',
      cropType: field.cropType || 'wheat',
      terrain: 'flat'
    };

    const analysisResult = analyzeSalinity(analysisInputs);

    // 3. Update the database
    await execute(
      'UPDATE metrics SET ec = ?, waterTable = ? WHERE fieldId = ?', 
      [metrics.ec, metrics.waterTable, fieldId]
    );

    await execute(
      'UPDATE fields SET riskScore = ?, riskLevel = ?, stressProbability = ?, soilStrain = ?, soilRecovery = ?, lastUpdated = ? WHERE id = ?',
      [
        analysisResult.riskScore,
        analysisResult.riskLevel,
        analysisResult.stressProbability,
        analysisResult.soilStrain,
        analysisResult.soilRecovery,
        'Just now (Sensor)',
        fieldId
      ]
    );

    // 4. Generate alerts if risk is high/critical
    if (analysisResult.riskScore >= 60) {
      const alertMsg = `[${new Date().toISOString()}] Live Sensor Alert: EC reached ${metrics.ec} dS/m, Water Table at ${metrics.waterTable}m (${analysisResult.riskLevel} risk).`;
      await execute('INSERT INTO alerts (fieldId, message) VALUES (?, ?)', [fieldId, alertMsg]);
    }

    console.log(`[Telemetry] Processed sensor reading for field ${fieldId}. Updated Risk Score: ${analysisResult.riskScore}`);

    res.status(200).json({ 
      success: true, 
      fieldId,
      riskScore: analysisResult.riskScore, 
      riskLevel: analysisResult.riskLevel,
      soilStrain: analysisResult.soilStrain,
      soilRecovery: analysisResult.soilRecovery
    });

  } catch (error) {
    console.error('[Telemetry] Error processing reading:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
