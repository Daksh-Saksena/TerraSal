import express from 'express';
import { queryAll, queryGet, execute } from '../db/index.js';
import {
  analyzeSalinity,
  simulateCropSwitch,
  evaluateLabSoilReport,
  FAO_CROP_PARAMETERS
} from '../services/salinityEngine.js';
import { cropDatabase } from '../services/cropDatabase.js';
import {
  getWeatherForCoordinates,
  get7DayForecastForCoordinates,
  updateWeatherForAllFields
} from '../services/weatherService.js';
import { aiService } from '../services/aiService.js';

const router = express.Router();

// Helper to safely parse numeric inputs without swallowing 0
const parseNum = (val, def) => (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : def;

/**
 * Health check endpoint
 * Used by Vercel deployment checks and monitoring.
 */
router.get('/health', async (req, res) => {
  try {
    const ping = await queryGet('SELECT 1 as ok');
    const fieldCount = await queryGet('SELECT COUNT(*) as count FROM fields');
    res.json({
      status: 'healthy',
      database: 'connected',
      tablesReady: true,
      fieldsCount: fieldCount?.count ?? 0,
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Health] Check failed:', err.message);
    res.status(503).json({
      status: 'degraded',
      database: 'error',
      message: err.message,
      hint: process.env.VERCEL && !process.env.TURSO_DATABASE_URL
        ? 'Please configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel project environment variables.'
        : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Weather by coordinates (for pin-drop on map)
 */
router.get('/weather/coords', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon || req.query.lng);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon query parameters required' });
    }
    const weather = await getWeatherForCoordinates(lat, lon);
    res.json(weather);
  } catch (err) {
    console.error('[API] /weather/coords error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7-Day Weather Forecast & Leaching Recommendation
 */
router.get('/weather/forecast', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 30.9;
    const lon = parseFloat(req.query.lon || req.query.lng) || 75.85;
    const forecast = await get7DayForecastForCoordinates(lat, lon);
    res.json(forecast);
  } catch (err) {
    console.error('[API] /weather/forecast error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all fields (Optimized batch query to prevent N+1 overhead)
 */
router.get('/fields', async (req, res) => {
  try {
    const [fields, allMetrics, allAlerts] = await Promise.all([
      queryAll('SELECT * FROM fields'),
      queryAll('SELECT * FROM metrics'),
      queryAll('SELECT fieldId, message FROM alerts')
    ]);

    const metricsMap = new Map();
    for (const m of allMetrics) {
      metricsMap.set(m.fieldId, m);
    }

    const alertsMap = new Map();
    for (const a of allAlerts) {
      if (!alertsMap.has(a.fieldId)) alertsMap.set(a.fieldId, []);
      alertsMap.get(a.fieldId).push(a.message);
    }

    for (const field of fields) {
      field.sensorConnected = Boolean(field.sensorConnected);
      const metrics = metricsMap.get(field.id);

      if (metrics) {
        field.metrics = {
          ec: metrics.ec ?? 0,
          waterTable: metrics.waterTable ?? 0,
          rainfall: metrics.rainfall ?? 0
        };
        field.groundwaterEC = metrics.ec ?? 0;
        field.waterTableDepth = metrics.waterTable ?? 0;
        field.rainfallLast30Days = metrics.rainfall ?? 0;
      } else {
        field.metrics = { ec: 0, waterTable: 0, rainfall: 0 };
        field.groundwaterEC = 0;
        field.waterTableDepth = 0;
        field.rainfallLast30Days = 0;
      }

      field.stressProbability = field.stressProbability ?? Math.round((field.riskScore || 50) * 0.95);
      field.lastUpdated = field.lastUpdated || 'Recently';

      // Attach diagnostic & soil health metrics
      const analysis = analyzeSalinity({
        groundwaterEC: field.groundwaterEC,
        waterTableDepth: field.waterTableDepth,
        soilType: field.soilType || 'loamy',
        drainageQuality: field.drainageQuality || 'moderate',
        rainfallLast30Days: field.rainfallLast30Days,
        irrigationMethod: field.irrigationMethod || 'flood',
        cropType: field.cropType || 'wheat',
        terrain: 'flat'
      });

      field.whoopMetrics = analysis.whoopMetrics;
      field.soilStrain = field.soilStrain ?? analysis.soilStrain;
      field.soilRecovery = field.soilRecovery ?? analysis.soilRecovery;
      field.alerts = alertsMap.get(field.id) || [];
    }

    res.json(fields);
  } catch (error) {
    console.error('[API] /fields error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register new farm (pin drop or manual entry)
 */
router.post('/fields', async (req, res) => {
  try {
    const {
      name,
      farmerName,
      location,
      lat,
      lng,
      area,
      cropType,
      soilType,
      drainageQuality,
      irrigationMethod,
      groundwaterEC,
      waterTableDepth,
      rainfallLast30Days,
      notes
    } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Farm name is required' });
    }
    if (!cropType || typeof cropType !== 'string') {
      return res.status(400).json({ error: 'Crop type is required' });
    }
    if (!soilType || typeof soilType !== 'string') {
      return res.status(400).json({ error: 'Soil type is required' });
    }

    const id = `field-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const ec = parseNum(groundwaterEC, 3.0);
    const wt = parseNum(waterTableDepth, 2.5);
    const rain = parseNum(rainfallLast30Days, 15);
    const fieldLat = parseNum(lat, 30.9);
    const fieldLng = parseNum(lng, 75.85);
    const farmArea = Math.max(0.1, parseNum(area, 10));

    // Run salinity diagnostic
    const analysis = analyzeSalinity({
      groundwaterEC: ec,
      waterTableDepth: wt,
      soilType,
      drainageQuality: drainageQuality || 'moderate',
      rainfallLast30Days: rain,
      irrigationMethod: irrigationMethod || 'flood',
      cropType,
      terrain: 'flat'
    });

    const now = 'Just now';

    await execute(
      `INSERT INTO fields (id, name, farmerName, location, lat, lng, area, cropType, soilType, drainageQuality, irrigationMethod, sensorConnected, riskLevel, riskScore, stressProbability, soilStrain, soilRecovery, notes, lastUpdated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        (farmerName && farmerName.trim()) || 'Village Farmer',
        location || `${fieldLat.toFixed(4)}°N, ${fieldLng.toFixed(4)}°E`,
        fieldLat,
        fieldLng,
        farmArea,
        cropType.trim(),
        soilType.trim(),
        drainageQuality || 'moderate',
        irrigationMethod || 'flood',
        1,
        analysis.riskLevel,
        analysis.riskScore,
        analysis.stressProbability,
        analysis.soilStrain,
        analysis.soilRecovery,
        notes || '',
        now
      ]
    );

    // Insert metric
    await execute('INSERT INTO metrics (fieldId, ec, waterTable, rainfall) VALUES (?, ?, ?, ?)', [id, ec, wt, rain]);

    // Initial alert if risk is elevated
    if (analysis.riskScore >= 60) {
      await execute('INSERT INTO alerts (fieldId, message) VALUES (?, ?)', [
        id,
        `Initial assessment: Elevated salinity risk (${analysis.riskScore}/100) - Soil Strain at ${analysis.soilStrain}`
      ]);
    }

    res.status(201).json({
      success: true,
      fieldId: id,
      analysis
    });
  } catch (err) {
    console.error('[API] Error creating field:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete a field
 */
router.delete('/fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Field ID parameter is required' });
    }

    const field = await queryGet('SELECT id FROM fields WHERE id = ?', [id]);
    if (!field) {
      return res.status(404).json({ error: `Field '${id}' not found` });
    }

    await execute('DELETE FROM metrics WHERE fieldId = ?', [id]);
    await execute('DELETE FROM alerts WHERE fieldId = ?', [id]);
    await execute('DELETE FROM fields WHERE id = ?', [id]);

    res.json({ success: true, message: `Field ${id} removed successfully` });
  } catch (err) {
    console.error(`[API] Error deleting field ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Cross-field Village Benchmarking & Community Intelligence
 */
router.get('/village/benchmarks', async (req, res) => {
  try {
    const fields = await queryAll('SELECT * FROM fields');
    if (!fields.length) {
      return res.json({ villageStats: null, fields: [], advisories: [] });
    }

    for (const f of fields) {
      const m = await queryGet('SELECT * FROM metrics WHERE fieldId = ?', [f.id]);
      f.groundwaterEC = m?.ec ?? 0;
      f.waterTableDepth = m?.waterTable ?? 0;

      const diag = analyzeSalinity({
        groundwaterEC: f.groundwaterEC,
        waterTableDepth: f.waterTableDepth,
        soilType: f.soilType || 'loamy',
        drainageQuality: f.drainageQuality || 'moderate',
        rainfallLast30Days: m?.rainfall || 10,
        irrigationMethod: f.irrigationMethod || 'flood',
        cropType: f.cropType || 'wheat',
        terrain: 'flat'
      });

      f.soilRecovery = diag.soilRecovery;
      f.soilStrain = diag.soilStrain;
      f.recoveryZone = diag.whoopMetrics?.recoveryZone || 'YELLOW';
    }

    const totalAcres = fields.reduce((sum, f) => sum + (parseFloat(f.area) || 0), 0);
    const avgRecovery = Math.round(fields.reduce((sum, f) => sum + (f.soilRecovery || 50), 0) / fields.length);
    const avgStrain = parseFloat((fields.reduce((sum, f) => sum + (f.soilStrain || 10), 0) / fields.length).toFixed(1));
    const greenFarms = fields.filter(f => f.soilRecovery >= 67).length;
    const yellowFarms = fields.filter(f => f.soilRecovery >= 34 && f.soilRecovery < 67).length;
    const redFarms = fields.filter(f => f.soilRecovery < 34).length;

    const avgEC = fields.reduce((sum, f) => sum + (parseFloat(f.groundwaterEC) || 0), 0) / fields.length;
    const villageSaltTons = parseFloat((totalAcres * avgEC * 0.18).toFixed(1));

    const villageStats = {
      totalFields: fields.length,
      totalAcres,
      avgRecovery,
      avgStrain,
      greenFarms,
      yellowFarms,
      redFarms,
      villageSaltTons
    };

    // AI-Powered Cross-field peer advisories using GPT-4o-mini (or smart dynamic fallback)
    const aiResult = await aiService.generateVillagePeerIntelligence(fields, villageStats);

    res.json({
      villageStats,
      fields: fields.map(f => ({
        id: f.id,
        name: f.name,
        farmerName: f.farmerName,
        location: f.location,
        lat: f.lat,
        lng: f.lng,
        area: f.area,
        cropType: f.cropType,
        soilType: f.soilType,
        irrigationMethod: f.irrigationMethod,
        riskLevel: f.riskLevel,
        riskScore: f.riskScore,
        groundwaterEC: f.groundwaterEC,
        waterTableDepth: f.waterTableDepth,
        soilStrain: f.soilStrain,
        soilRecovery: f.soilRecovery,
        recoveryZone: f.recoveryZone
      })),
      advisories: aiResult.advisories || [],
      aiMeta: {
        source: aiResult.source,
        model: aiService.model,
        configured: aiService.isConfigured()
      }
    });
  } catch (err) {
    console.error('[API] /village/benchmarks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Force regenerate village advisories via AI
router.post('/village/regenerate-ai', async (req, res) => {
  try {
    const fields = await queryAll('SELECT * FROM fields');
    for (let f of fields) {
      const m = await queryGet('SELECT * FROM metrics WHERE fieldId = ?', [f.id]);
      f.groundwaterEC = m?.ec || 0;
      f.waterTableDepth = m?.waterTable || 0;
      const diag = analyzeSalinity({
        groundwaterEC: f.groundwaterEC,
        waterTableDepth: f.waterTableDepth,
        soilType: f.soilType,
        drainageQuality: f.drainageQuality,
        rainfallLast30Days: m?.rainfall || 10,
        irrigationMethod: f.irrigationMethod,
        cropType: f.cropType
      });
      f.soilRecovery = diag.soilRecovery;
      f.soilStrain = diag.soilStrain;
    }

    const totalAcres = fields.reduce((sum, f) => sum + (f.area || 0), 0);
    const avgRecovery = Math.round(fields.reduce((sum, f) => sum + (f.soilRecovery || 50), 0) / (fields.length || 1));
    const avgStrain = parseFloat((fields.reduce((sum, f) => sum + (f.soilStrain || 10), 0) / (fields.length || 1)).toFixed(1));
    const villageSaltTons = parseFloat((totalAcres * (fields.reduce((sum, f) => sum + f.groundwaterEC, 0) / (fields.length || 1)) * 0.18).toFixed(1));

    const villageStats = {
      totalFields: fields.length,
      totalAcres,
      avgRecovery,
      avgStrain,
      villageSaltTons
    };

    const aiResult = await aiService.generateVillagePeerIntelligence(fields, villageStats);
    res.json({
      success: true,
      advisories: aiResult.advisories,
      aiMeta: {
        source: aiResult.source,
        model: aiService.model,
        configured: aiService.isConfigured()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Configuration routes
router.get('/ai/status', (req, res) => {
  res.json(aiService.getStatus());
});

router.post('/ai/set-key', (req, res) => {
  const { apiKey, model } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Valid apiKey string is required' });
  }
  aiService.setApiKey(apiKey);
  if (model) aiService.model = model;
  res.json({
    success: true,
    message: 'OpenAI API key saved successfully',
    status: aiService.getStatus()
  });
});
router.get('/regions', async (req, res) => {
  try {
    const regions = await queryAll('SELECT * FROM regions');
    res.json(regions);
  } catch (error) {
    console.error('[API] /regions error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all trends
 */
router.get('/trends', async (req, res) => {
  try {
    const waterTableData = await queryAll('SELECT * FROM waterTableTrends');
    const seasonalData = await queryAll('SELECT * FROM seasonalTrends');
    const rainfallECData = await queryAll('SELECT * FROM rainfallECTrends');
    const yoyData = await queryAll('SELECT * FROM yoyTrends');
    const riskScoreTrend = await queryAll('SELECT * FROM riskScoreTrends');
    const ecTrendData = await queryAll('SELECT * FROM ecTrends');

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
    console.error('[API] /trends error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get crop database
 */
router.get('/crops', (req, res) => {
  res.json(cropDatabase);
});

/**
 * Run salinity analysis
 */
router.post('/analyze', (req, res) => {
  try {
    const inputs = req.body;
    if (!inputs) {
      return res.status(400).json({ error: 'No inputs provided' });
    }
    const result = analyzeSalinity(inputs);
    res.json(result);
  } catch (error) {
    console.error('[API] /analyze error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * What-If Crop Switch & Leaching Simulator (FAO Maas-Hoffman Model)
 */
router.post('/simulate-crop', (req, res) => {
  try {
    const { currentCrop, proposedCrop, groundwaterEC, leachingFraction } = req.body || {};
    const result = simulateCropSwitch({
      currentCrop,
      proposedCrop,
      groundwaterEC: parseFloat(groundwaterEC) || 3.5,
      leachingFraction: parseFloat(leachingFraction) || 0.15
    });
    res.json(result);
  } catch (err) {
    console.error('[API] /simulate-crop error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Soil Lab Report Calibration (pH, ECe, SAR, Gypsum Requirement)
 */
router.post('/lab-calibrate', (req, res) => {
  try {
    const { labSoilEC, labPH, labSAR, soilType } = req.body || {};
    const result = evaluateLabSoilReport({
      labSoilEC,
      labPH,
      labSAR,
      soilType
    });
    res.json(result);
  } catch (err) {
    console.error('[API] /lab-calibrate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * FAO Crop Tolerance Parameters Reference Table
 */
router.get('/fao-crops', (req, res) => {
  res.json(FAO_CROP_PARAMETERS);
});

/**
 * Vercel Cron endpoint for scheduled weather refresh
 * Secured via CRON_SECRET if configured.
 */
router.get('/cron/weather', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
  }

  try {
    const result = await updateWeatherForAllFields();
    res.json({
      success: true,
      message: 'Weather update completed',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Cron] Weather update failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
