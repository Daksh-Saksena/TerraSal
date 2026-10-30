import express from 'express';
import { queryGet, execute } from '../db/index.js';
import { analyzeSalinity } from '../services/salinityEngine.js';
const router = express.Router();
router.post('/', async (req, res) => {
  try {
    const expectedKey = process.env.SENSOR_API_KEY;
    if (expectedKey) {
      const providedKey = req.headers['x-sensor-key'] || req.query.key;
      if (providedKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-sensor-key header' });
      }
    }
    const { fieldId, sensorId, metrics, timestamp } = req.body || {};
    if (!fieldId || !metrics || typeof metrics.ec !== 'number' || typeof metrics.waterTable !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: fieldId, metrics.ec (number), and metrics.waterTable (number) are required' });
    }
    const field = await queryGet('SELECT * FROM fields WHERE id = ?', [fieldId]);
    if (!field) {
      return res.status(404).json({ error: `Field '${fieldId}' not found` });
    }
    const currentMetrics = await queryGet('SELECT rainfall FROM metrics WHERE fieldId = ?', [fieldId]);
    const currentRainfall = currentMetrics ? (parseFloat(currentMetrics.rainfall) || 0) : 0;
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
    const readingTime = timestamp || new Date().toISOString();
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
    try {
      await execute(
        'INSERT INTO readings (fieldId, sensorId, ec, waterTable, soilMoisture, timestamp, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [fieldId, sensorId || 'TS-Node-Generic', metrics.ec, metrics.waterTable, metrics.soilMoisture ?? null, readingTime, 'sensor']
      );
    } catch (dbErr) {
      console.warn('[Telemetry] Readings insert notice:', dbErr.message);
    }
    if (analysisResult.riskScore >= 60) {
      const recentAlert = await queryGet(
        'SELECT id FROM alerts WHERE fieldId = ? AND message LIKE ? ORDER BY id DESC LIMIT 1',
        [fieldId, `%EC reached ${metrics.ec} dS/m%`]
      );
      if (!recentAlert) {
        const alertMsg = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] Sensor Alert: EC reached ${metrics.ec} dS/m, Water Table at ${metrics.waterTable}m (${analysisResult.riskLevel} risk).`;
        await execute('INSERT INTO alerts (fieldId, message) VALUES (?, ?)', [fieldId, alertMsg]);
      }
    }
    console.log(`[Telemetry] Processed sensor reading for field ${fieldId}. Updated Risk Score: ${analysisResult.riskScore}`);
    res.status(200).json({
      success: true,
      fieldId,
      riskScore: analysisResult.riskScore,
      riskLevel: analysisResult.riskLevel,
      soilStrain: analysisResult.soilStrain,
      soilRecovery: analysisResult.soilRecovery,
      recordedAt: readingTime
    });
  } catch (error) {
    console.error('[Telemetry] Error processing reading:', error.message);
    res.status(500).json({ error: error.message });
  }
});
export default router;