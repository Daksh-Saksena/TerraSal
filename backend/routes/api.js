import express from 'express';
import { queryAll, queryGet, execute } from '../db/index.js';
import { analyzeSalinity } from '../services/salinityEngine.js';
import { cropDatabase } from '../services/cropDatabase.js';
import { getWeatherForCoordinates, updateWeatherForAllFields } from '../services/weatherService.js';

const router = express.Router();

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
 * Get all fields (with farmer name, coords, whoop metrics, and alerts)
 */
router.get('/fields', async (req, res) => {
  try {
    const fields = await queryAll('SELECT * FROM fields');

    // Attach metrics and alerts
    for (const field of fields) {
      field.sensorConnected = Boolean(field.sensorConnected);
      const metrics = await queryGet('SELECT * FROM metrics WHERE fieldId = ?', [field.id]);

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

      // Attach diagnostic & WHOOP metrics
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

      const alerts = await queryAll('SELECT message FROM alerts WHERE fieldId = ?', [field.id]);
      field.alerts = alerts.map(a => a.message);
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
    const ec = parseFloat(groundwaterEC) || 3.0;
    const wt = parseFloat(waterTableDepth) || 2.5;
    const rain = parseFloat(rainfallLast30Days) || 15;
    const fieldLat = parseFloat(lat) || 30.9;
    const fieldLng = parseFloat(lng) || 75.85;

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
        parseFloat(area) || 10,
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
        `Initial assessment: Elevated salinity risk (${analysis.riskScore}/100) — Soil Strain at ${analysis.soilStrain}`
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

    // Peer Learning / Cross-field advisories
    const advisories = [];
    const dripFarmers = fields.filter(f => f.irrigationMethod === 'drip' && f.soilRecovery > 60);
    const floodFarmers = fields.filter(f => (f.irrigationMethod === 'flood' || f.irrigationMethod === 'canal') && f.soilRecovery < 40);

    if (dripFarmers.length > 0 && floodFarmers.length > 0) {
      advisories.push({
        type: 'peer_irrigation',
        title: 'Community Drip Transition Opportunity',
        message: `${dripFarmers[0].farmerName || dripFarmers[0].name} is maintaining a ${dripFarmers[0].soilRecovery}% Soil Recovery on ${dripFarmers[0].cropType} using Drip, while ${floodFarmers[0].farmerName || floodFarmers[0].name} is suffering at ${floodFarmers[0].soilRecovery}% on flood irrigation. Adopting drip could reduce village canal salt burden by ~35%.`,
        sourceFarmer: dripFarmers[0].farmerName || dripFarmers[0].name,
        targetFarmer: floodFarmers[0].farmerName || floodFarmers[0].name
      });
    }

    if (redFarms > 0) {
      advisories.push({
        type: 'critical_drainage',
        title: 'Subsurface Drainage Collective',
        message: `${redFarms} village fields are in Red Recovery Zone due to water table shallower than 1.8m. A shared community tile drainage pipe along the village boundary canal could lower water table by 0.6m across all ${fields.length} plots.`
      });
    }

    res.json({
      villageStats: {
        totalFields: fields.length,
        totalAcres,
        avgRecovery,
        avgStrain,
        greenFarms,
        yellowFarms,
        redFarms,
        villageSaltTons
      },
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
      advisories
    });
  } catch (err) {
    console.error('[API] /village/benchmarks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all regions
 */
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
