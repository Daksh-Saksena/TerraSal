import express from 'express';
import { db } from '../db/schema.js';
import { analyzeSalinity } from '../services/salinityEngine.js';
import { cropDatabase } from '../services/cropDatabase.js'; // fallback if not in DB

const router = express.Router();

// Helper to wrap db.all into a promise
const queryAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Helper to wrap db.get into a promise
const queryGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Get all fields
router.get('/fields', async (req, res) => {
  try {
    const fields = await queryAll('SELECT * FROM fields');
    
    // Attach metrics and alerts
    for (let field of fields) {
      field.sensorConnected = !!field.sensorConnected;
      const metrics = await queryGet('SELECT * FROM metrics WHERE fieldId = ?', [field.id]);
      if (metrics) {
        field.metrics = {
          ec: metrics.ec,
          waterTable: metrics.waterTable,
          rainfall: metrics.rainfall
        };
      } else {
        field.metrics = { ec: 0, waterTable: 0, rainfall: 0 };
      }

      const alerts = await queryAll('SELECT message FROM alerts WHERE fieldId = ?', [field.id]);
      field.alerts = alerts.map(a => a.message);
    }
    
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all regions
router.get('/regions', async (req, res) => {
  try {
    const regions = await queryAll('SELECT * FROM regions');
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all trends
router.get('/trends', async (req, res) => {
  try {
    const waterTableData = await queryAll('SELECT * FROM waterTableTrends');
    const seasonalData = await queryAll('SELECT * FROM seasonalTrends');
    const rainfallECData = await queryAll('SELECT * FROM rainfallECTrends');
    const yoyData = await queryAll('SELECT * FROM yoyTrends');
    const riskScoreTrend = await queryAll('SELECT * FROM riskScoreTrends');
    const ecTrendData = await queryAll('SELECT * FROM ecTrends');
    
    // format ecTrendData __safe
    const formattedEcTrendData = ecTrendData.map(d => ({
      ...d,
      __safe: d.safeThreshold
    }));

    res.json({
      waterTableData,
      seasonalData,
      rainfallECData,
      yoyData,
      riskScoreTrend,
      ecTrendData: formattedEcTrendData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get crop database
router.get('/crops', (req, res) => {
  // Since cropDatabase is static in this V1, we just return the imported list
  res.json(cropDatabase);
});

// Run salinity analysis
router.post('/analyze', (req, res) => {
  try {
    const inputs = req.body;
    // Ensure inputs are valid before processing
    if (!inputs) {
      return res.status(400).json({ error: "No inputs provided" });
    }
    const result = analyzeSalinity(inputs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
