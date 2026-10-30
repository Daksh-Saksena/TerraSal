import { db, initializeDB } from './schema.js';
import { analyzeSalinity } from '../services/salinityEngine.js';
export const fieldsData = [
  {
    id: 'field-001',
    name: 'Ludhiana North Block',
    farmerName: 'Sardar Gurpreet Singh',
    location: 'Ludhiana, Punjab',
    lat: 30.9010,
    lng: 75.8573,
    area: 45,
    cropType: 'wheat',
    soilType: 'loam',
    drainageQuality: 'poor',
    irrigationMethod: 'flood',
    sensorConnected: 1,
    groundwaterEC: 4.6,
    waterTableDepth: 1.8,
    rainfallLast30Days: 14,
    notes: 'Canal branch 4 inlet side. Rising groundwater causing salt rings after heavy winter watering.',
    alerts: [
      'EC has reached 4.6 dS/m: exceeding safe threshold for wheat',
      'Water table at 1.8m: Risk of secondary capillary salinization'
    ]
  },
  {
    id: 'field-002',
    name: 'Hisar Agro Research',
    farmerName: 'Chaudhary Harpal Singh',
    location: 'Hisar, Haryana',
    lat: 29.1492,
    lng: 75.7217,
    area: 60,
    cropType: 'mustard',
    soilType: 'sandy-loam',
    drainageQuality: 'moderate',
    irrigationMethod: 'sprinkler',
    sensorConnected: 1,
    groundwaterEC: 3.2,
    waterTableDepth: 3.1,
    rainfallLast30Days: 8,
    notes: 'Well-maintained sprinkler line; minor salt crusting during dry spell.',
    alerts: [
      'Moderate EC accumulation detected in root zone'
    ]
  },
  {
    id: 'field-003',
    name: 'Ganganagar South Block',
    farmerName: 'Chaudhary Ram Kumar',
    location: 'Sri Ganganagar, Rajasthan',
    lat: 29.9167,
    lng: 73.8833,
    area: 80,
    cropType: 'cotton',
    soilType: 'clay',
    drainageQuality: 'very-poor',
    irrigationMethod: 'flood',
    sensorConnected: 1,
    groundwaterEC: 6.8,
    waterTableDepth: 1.2,
    rainfallLast30Days: 3,
    notes: 'Emergency plot. Heavy clay soil with very poor infiltration. Surface salt crusting visible across 60% of plot.',
    alerts: [
      'CRITICAL: Groundwater EC reached 6.8 dS/m: severe root zone damage',
      'Shallow water table (1.2m) actively pumping salts to surface',
      'Switch from flood to drip irrigation immediately'
    ]
  },
  {
    id: 'field-004',
    name: 'Amritsar Golden Farm',
    farmerName: 'Balwinder Singh Sandhu',
    location: 'Amritsar, Punjab',
    lat: 31.6340,
    lng: 74.8723,
    area: 35,
    cropType: 'rice',
    soilType: 'sandy',
    drainageQuality: 'good',
    irrigationMethod: 'drip',
    sensorConnected: 1,
    groundwaterEC: 1.4,
    waterTableDepth: 4.5,
    rainfallLast30Days: 45,
    notes: 'Deep water table and sandy soil provide high natural leaching capacity. Prime soil health.',
    alerts: []
  },
  {
    id: 'field-005',
    name: 'Bathinda Pilot Project',
    farmerName: 'Karamjit Singh Dhillon',
    location: 'Bathinda, Punjab',
    lat: 30.2110,
    lng: 74.9455,
    area: 50,
    cropType: 'cotton',
    soilType: 'clay-loam',
    drainageQuality: 'poor',
    irrigationMethod: 'flood',
    sensorConnected: 1,
    groundwaterEC: 3.9,
    waterTableDepth: 2.2,
    rainfallLast30Days: 11,
    notes: 'Cotton showing leaf tip chlorosis and delayed flowering. Testing gypsum treatment.',
    alerts: [
      'High EC and poor drainage impeding cotton root development',
      'Collect soil samples for EC & SAR testing'
    ]
  },
  {
    id: 'field-006',
    name: 'Bikaner Desert Oasis',
    farmerName: 'Rawat Singh Rathore',
    location: 'Bikaner, Rajasthan',
    lat: 28.0229,
    lng: 73.3119,
    area: 120,
    cropType: 'barley',
    soilType: 'sandy',
    drainageQuality: 'good',
    irrigationMethod: 'drip',
    sensorConnected: 1,
    groundwaterEC: 2.1,
    waterTableDepth: 5.2,
    rainfallLast30Days: 5,
    notes: 'Model drip irrigation site powered by solar tubewell. Highly resilient barley crop.',
    alerts: []
  }
];
export const regionsData = [
  { id: 'reg-pun-01', state: 'Punjab', district: 'Ludhiana', lat: 30.9010, lng: 75.8573, riskScore: 72, riskLevel: 'HIGH', trend: 'worsening', avgEC: 4.6, waterTableDepth: 1.8, affectedArea: 38000, dominantCrop: 'Wheat', farmersAffected: 24500 },
  { id: 'reg-pun-02', state: 'Punjab', district: 'Bathinda', lat: 30.2110, lng: 74.9455, riskScore: 65, riskLevel: 'HIGH', trend: 'worsening', avgEC: 3.9, waterTableDepth: 2.2, affectedArea: 42000, dominantCrop: 'Cotton', farmersAffected: 28000 },
  { id: 'reg-pun-03', state: 'Punjab', district: 'Amritsar', lat: 31.6340, lng: 74.8723, riskScore: 28, riskLevel: 'LOW', trend: 'improving', avgEC: 1.4, waterTableDepth: 4.5, affectedArea: 12000, dominantCrop: 'Rice (Paddy)', farmersAffected: 11000 },
  { id: 'reg-pun-04', state: 'Punjab', district: 'Fazilka', lat: 30.4039, lng: 74.0277, riskScore: 82, riskLevel: 'CRITICAL', trend: 'critical', avgEC: 6.1, waterTableDepth: 1.4, affectedArea: 49000, dominantCrop: 'Cotton', farmersAffected: 31000 },
  { id: 'reg-pun-05', state: 'Punjab', district: 'Muktsar', lat: 30.4762, lng: 74.5152, riskScore: 78, riskLevel: 'HIGH', trend: 'worsening', avgEC: 5.3, waterTableDepth: 1.6, affectedArea: 44000, dominantCrop: 'Wheat', farmersAffected: 29000 },
  { id: 'reg-har-01', state: 'Haryana', district: 'Hisar', lat: 29.1492, lng: 75.7217, riskScore: 54, riskLevel: 'MODERATE', trend: 'stable', avgEC: 3.2, waterTableDepth: 3.1, affectedArea: 31000, dominantCrop: 'Mustard', farmersAffected: 22000 },
  { id: 'reg-har-02', state: 'Haryana', district: 'Sirsa', lat: 29.5334, lng: 75.0177, riskScore: 76, riskLevel: 'HIGH', trend: 'worsening', avgEC: 5.0, waterTableDepth: 2.0, affectedArea: 47000, dominantCrop: 'Cotton', farmersAffected: 33500 },
  { id: 'reg-har-03', state: 'Haryana', district: 'Fatehabad', lat: 29.5148, lng: 75.4542, riskScore: 58, riskLevel: 'MODERATE', trend: 'stable', avgEC: 3.6, waterTableDepth: 2.8, affectedArea: 26000, dominantCrop: 'Wheat', farmersAffected: 19000 },
  { id: 'reg-raj-01', state: 'Rajasthan', district: 'Sri Ganganagar', lat: 29.9167, lng: 73.8833, riskScore: 88, riskLevel: 'CRITICAL', trend: 'critical', avgEC: 6.8, waterTableDepth: 1.2, affectedArea: 68000, dominantCrop: 'Cotton', farmersAffected: 46000 },
  { id: 'reg-raj-02', state: 'Rajasthan', district: 'Hanumangarh', lat: 29.5817, lng: 74.3294, riskScore: 81, riskLevel: 'CRITICAL', trend: 'worsening', avgEC: 5.9, waterTableDepth: 1.5, affectedArea: 53000, dominantCrop: 'Wheat', farmersAffected: 36000 },
  { id: 'reg-raj-03', state: 'Rajasthan', district: 'Bikaner', lat: 28.0229, lng: 73.3119, riskScore: 32, riskLevel: 'LOW', trend: 'stable', avgEC: 2.1, waterTableDepth: 5.2, affectedArea: 18000, dominantCrop: 'Mustard', farmersAffected: 14000 }
];
export const waterTableData = [
  { month: 'Sep 24', depthGanganagar: 1.8, depthLudhiana: 2.4 },
  { month: 'Oct 24', depthGanganagar: 1.75, depthLudhiana: 2.35 },
  { month: 'Nov 24', depthGanganagar: 1.7, depthLudhiana: 2.3 },
  { month: 'Dec 24', depthGanganagar: 1.65, depthLudhiana: 2.25 },
  { month: 'Jan 25', depthGanganagar: 1.6, depthLudhiana: 2.2 },
  { month: 'Feb 25', depthGanganagar: 1.55, depthLudhiana: 2.15 },
  { month: 'Mar 25', depthGanganagar: 1.5, depthLudhiana: 2.1 },
  { month: 'Apr 25', depthGanganagar: 1.48, depthLudhiana: 2.05 },
  { month: 'May 25', depthGanganagar: 1.45, depthLudhiana: 2.0 },
  { month: 'Jun 25', depthGanganagar: 1.42, depthLudhiana: 1.98 },
  { month: 'Jul 25', depthGanganagar: 1.38, depthLudhiana: 1.95 },
  { month: 'Aug 25', depthGanganagar: 1.35, depthLudhiana: 1.92 },
  { month: 'Sep 25', depthGanganagar: 1.32, depthLudhiana: 1.9 },
  { month: 'Oct 25', depthGanganagar: 1.3, depthLudhiana: 1.88 },
  { month: 'Nov 25', depthGanganagar: 1.28, depthLudhiana: 1.86 },
  { month: 'Dec 25', depthGanganagar: 1.27, depthLudhiana: 1.85 },
  { month: 'Jan 26', depthGanganagar: 1.26, depthLudhiana: 1.84 },
  { month: 'Feb 26', depthGanganagar: 1.25, depthLudhiana: 1.83 },
  { month: 'Mar 26', depthGanganagar: 1.24, depthLudhiana: 1.82 },
  { month: 'Apr 26', depthGanganagar: 1.23, depthLudhiana: 1.81 },
  { month: 'May 26', depthGanganagar: 1.22, depthLudhiana: 1.8 },
  { month: 'Jun 26', depthGanganagar: 1.21, depthLudhiana: 1.8 },
  { month: 'Jul 26', depthGanganagar: 1.2, depthLudhiana: 1.79 },
  { month: 'Aug 26', depthGanganagar: 1.2, depthLudhiana: 1.8 }
];
export const seasonalData = [
  { month: 'Jan', avgSalinity: 3.8, criticalFields: 2 },
  { month: 'Feb', avgSalinity: 4.1, criticalFields: 2 },
  { month: 'Mar', avgSalinity: 4.6, criticalFields: 3 },
  { month: 'Apr', avgSalinity: 5.2, criticalFields: 4 },
  { month: 'May', avgSalinity: 5.8, criticalFields: 5 },
  { month: 'Jun', avgSalinity: 5.4, criticalFields: 4 },
  { month: 'Jul', avgSalinity: 2.8, criticalFields: 2 },
  { month: 'Aug', avgSalinity: 2.1, criticalFields: 1 },
  { month: 'Sep', avgSalinity: 2.5, criticalFields: 1 },
  { month: 'Oct', avgSalinity: 3.2, criticalFields: 2 },
  { month: 'Nov', avgSalinity: 3.6, criticalFields: 2 },
  { month: 'Dec', avgSalinity: 3.7, criticalFields: 2 }
];
export const rainfallECData = [
  { month: 'Jan', rainfall: 18, avgEC: 4.2 },
  { month: 'Feb', rainfall: 22, avgEC: 4.4 },
  { month: 'Mar', rainfall: 14, avgEC: 4.8 },
  { month: 'Apr', rainfall: 8, avgEC: 5.4 },
  { month: 'May', rainfall: 12, avgEC: 5.9 },
  { month: 'Jun', rainfall: 38, avgEC: 5.1 },
  { month: 'Jul', rainfall: 145, avgEC: 2.8 },
  { month: 'Aug', rainfall: 190, avgEC: 2.1 },
  { month: 'Sep', rainfall: 95, avgEC: 2.6 },
  { month: 'Oct', rainfall: 15, avgEC: 3.4 },
  { month: 'Nov', rainfall: 7, avgEC: 3.8 },
  { month: 'Dec', rainfall: 11, avgEC: 4.1 }
];
export const yoyData = [
  { month: 'Jan', year2024: 3.2, year2025: 3.6, year2026: 4.2 },
  { month: 'Feb', year2024: 3.4, year2025: 3.8, year2026: 4.4 },
  { month: 'Mar', year2024: 3.7, year2025: 4.1, year2026: 4.8 },
  { month: 'Apr', year2024: 4.2, year2025: 4.7, year2026: 5.4 },
  { month: 'May', year2024: 4.6, year2025: 5.1, year2026: 5.9 },
  { month: 'Jun', year2024: 4.3, year2025: 4.8, year2026: 5.1 },
  { month: 'Jul', year2024: 2.2, year2025: 2.5, year2026: 2.8 },
  { month: 'Aug', year2024: 1.7, year2025: 1.9, year2026: 2.1 },
  { month: 'Sep', year2024: 2.0, year2025: 2.3, year2026: 2.6 },
  { month: 'Oct', year2024: 2.7, year2025: 3.0, year2026: 3.4 },
  { month: 'Nov', year2024: 3.0, year2025: 3.4, year2026: 3.8 },
  { month: 'Dec', year2024: 3.1, year2025: 3.5, year2026: 4.1 }
];
export const riskScoreTrend = [
  { month: 'Sep 24', avgRisk: 48 },
  { month: 'Oct 24', avgRisk: 50 },
  { month: 'Nov 24', avgRisk: 52 },
  { month: 'Dec 24', avgRisk: 53 },
  { month: 'Jan 25', avgRisk: 55 },
  { month: 'Feb 25', avgRisk: 56 },
  { month: 'Mar 25', avgRisk: 59 },
  { month: 'Apr 25', avgRisk: 63 },
  { month: 'May 25', avgRisk: 66 },
  { month: 'Jun 25', avgRisk: 64 },
  { month: 'Jul 25', avgRisk: 54 },
  { month: 'Aug 25', avgRisk: 51 },
  { month: 'Sep 25', avgRisk: 53 },
  { month: 'Oct 25', avgRisk: 56 },
  { month: 'Nov 25', avgRisk: 58 },
  { month: 'Dec 25', avgRisk: 60 },
  { month: 'Jan 26', avgRisk: 61 },
  { month: 'Feb 26', avgRisk: 62 },
  { month: 'Mar 26', avgRisk: 65 },
  { month: 'Apr 26', avgRisk: 69 },
  { month: 'May 26', avgRisk: 73 },
  { month: 'Jun 26', avgRisk: 70 },
  { month: 'Jul 26', avgRisk: 60 },
  { month: 'Aug 26', avgRisk: 58 }
];
export const ecTrendData = [
  { month: 'Sep 24', safeThreshold: 2.0, ludhiana: 3.4, hisar: 2.5, ganganagar: 4.8 },
  { month: 'Oct 24', safeThreshold: 2.0, ludhiana: 3.5, hisar: 2.6, ganganagar: 5.0 },
  { month: 'Nov 24', safeThreshold: 2.0, ludhiana: 3.7, hisar: 2.7, ganganagar: 5.2 },
  { month: 'Dec 24', safeThreshold: 2.0, ludhiana: 3.8, hisar: 2.8, ganganagar: 5.3 },
  { month: 'Jan 25', safeThreshold: 2.0, ludhiana: 3.9, hisar: 2.8, ganganagar: 5.5 },
  { month: 'Feb 25', safeThreshold: 2.0, ludhiana: 4.0, hisar: 2.9, ganganagar: 5.7 },
  { month: 'Mar 25', safeThreshold: 2.0, ludhiana: 4.2, hisar: 3.0, ganganagar: 6.0 },
  { month: 'Apr 25', safeThreshold: 2.0, ludhiana: 4.5, hisar: 3.2, ganganagar: 6.4 },
  { month: 'May 25', safeThreshold: 2.0, ludhiana: 4.7, hisar: 3.4, ganganagar: 6.8 },
  { month: 'Jun 25', safeThreshold: 2.0, ludhiana: 4.5, hisar: 3.3, ganganagar: 6.5 },
  { month: 'Jul 25', safeThreshold: 2.0, ludhiana: 3.6, hisar: 2.8, ganganagar: 5.6 },
  { month: 'Aug 25', safeThreshold: 2.0, ludhiana: 3.3, hisar: 2.5, ganganagar: 5.2 },
  { month: 'Sep 25', safeThreshold: 2.0, ludhiana: 3.6, hisar: 2.7, ganganagar: 5.5 },
  { month: 'Oct 25', safeThreshold: 2.0, ludhiana: 3.8, hisar: 2.8, ganganagar: 5.8 },
  { month: 'Nov 25', safeThreshold: 2.0, ludhiana: 4.0, hisar: 2.9, ganganagar: 6.0 },
  { month: 'Dec 25', safeThreshold: 2.0, ludhiana: 4.1, hisar: 3.0, ganganagar: 6.2 },
  { month: 'Jan 26', safeThreshold: 2.0, ludhiana: 4.2, hisar: 3.0, ganganagar: 6.3 },
  { month: 'Feb 26', safeThreshold: 2.0, ludhiana: 4.3, hisar: 3.1, ganganagar: 6.5 },
  { month: 'Mar 26', safeThreshold: 2.0, ludhiana: 4.4, hisar: 3.2, ganganagar: 6.7 },
  { month: 'Apr 26', safeThreshold: 2.0, ludhiana: 4.7, hisar: 3.3, ganganagar: 7.1 },
  { month: 'May 26', safeThreshold: 2.0, ludhiana: 4.9, hisar: 3.5, ganganagar: 7.4 },
  { month: 'Jun 26', safeThreshold: 2.0, ludhiana: 4.8, hisar: 3.4, ganganagar: 7.2 },
  { month: 'Jul 26', safeThreshold: 2.0, ludhiana: 4.0, hisar: 2.9, ganganagar: 6.2 },
  { month: 'Aug 26', safeThreshold: 2.0, ludhiana: 4.6, hisar: 3.2, ganganagar: 6.8 }
];
export async function runSeed() {
  await initializeDB();
  console.log('[Seed] Populating TerraSal SQLite database...');
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const tables = ['fields', 'alerts', 'metrics', 'regions', 'waterTableTrends', 'seasonalTrends', 'rainfallECTrends', 'yoyTrends', 'riskScoreTrends', 'ecTrends'];
      tables.forEach(table => {
        db.run(`DELETE FROM ${table}`);
      });
      const insertField = db.prepare(`
        INSERT INTO fields (
          id, name, farmerName, location, lat, lng, area, cropType, soilType, drainageQuality, irrigationMethod,
          sensorConnected, riskLevel, riskScore, stressProbability, soilStrain, soilRecovery, notes, lastUpdated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertAlert = db.prepare('INSERT INTO alerts (fieldId, message) VALUES (?, ?)');
      const insertMetric = db.prepare('INSERT INTO metrics (fieldId, ec, waterTable, rainfall) VALUES (?, ?, ?, ?)');
      fieldsData.forEach(f => {
        const diag = analyzeSalinity({
          groundwaterEC: f.groundwaterEC,
          waterTableDepth: f.waterTableDepth,
          soilType: f.soilType,
          drainageQuality: f.drainageQuality,
          rainfallLast30Days: f.rainfallLast30Days,
          irrigationMethod: f.irrigationMethod,
          cropType: f.cropType,
          terrain: 'flat'
        });
        insertField.run(
          f.id,
          f.name,
          f.farmerName,
          f.location,
          f.lat,
          f.lng,
          f.area,
          f.cropType,
          f.soilType,
          f.drainageQuality,
          f.irrigationMethod,
          f.sensorConnected,
          diag.riskLevel,
          diag.riskScore,
          diag.stressProbability,
          diag.soilStrain,
          diag.soilRecovery,
          f.notes,
          'Active'
        );
        f.alerts.forEach(a => insertAlert.run(f.id, a));
        insertMetric.run(f.id, f.groundwaterEC, f.waterTableDepth, f.rainfallLast30Days);
      });
      insertField.finalize();
      insertAlert.finalize();
      insertMetric.finalize();
      const insertRegion = db.prepare(`
        INSERT INTO regions (id, state, district, lat, lng, riskScore, riskLevel, trend, avgEC, waterTableDepth, affectedArea, dominantCrop, farmersAffected)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      regionsData.forEach(r => {
        insertRegion.run(r.id, r.state, r.district, r.lat, r.lng, r.riskScore, r.riskLevel, r.trend, r.avgEC, r.waterTableDepth, r.affectedArea, r.dominantCrop, r.farmersAffected);
      });
      insertRegion.finalize();
      const insertWT = db.prepare('INSERT INTO waterTableTrends (month, depthGanganagar, depthLudhiana) VALUES (?, ?, ?)');
      waterTableData.forEach(d => insertWT.run(d.month, d.depthGanganagar, d.depthLudhiana));
      insertWT.finalize();
      const insertSeasonal = db.prepare('INSERT INTO seasonalTrends (month, avgSalinity, criticalFields) VALUES (?, ?, ?)');
      seasonalData.forEach(d => insertSeasonal.run(d.month, d.avgSalinity, d.criticalFields));
      insertSeasonal.finalize();
      const insertRain = db.prepare('INSERT INTO rainfallECTrends (month, rainfall, avgEC) VALUES (?, ?, ?)');
      rainfallECData.forEach(d => insertRain.run(d.month, d.rainfall, d.avgEC));
      insertRain.finalize();
      const insertYoy = db.prepare('INSERT INTO yoyTrends (month, year2024, year2025, year2026) VALUES (?, ?, ?, ?)');
      yoyData.forEach(d => insertYoy.run(d.month, d.year2024, d.year2025, d.year2026));
      insertYoy.finalize();
      const insertRisk = db.prepare('INSERT INTO riskScoreTrends (month, avgRisk) VALUES (?, ?)');
      riskScoreTrend.forEach(d => insertRisk.run(d.month, d.avgRisk));
      insertRisk.finalize();
      const insertEc = db.prepare('INSERT INTO ecTrends (month, safeThreshold, ludhiana, hisar, ganganagar) VALUES (?, ?, ?, ?, ?)');
      ecTrendData.forEach(d => insertEc.run(d.month, d.safeThreshold, d.ludhiana, d.hisar, d.ganganagar));
      insertEc.finalize();
      console.log(`[Seed] Seeded ${fieldsData.length} fields, ${regionsData.length} regions, and trend matrices.`);
      resolve();
    });
  });
}
if (process.argv[1]?.endsWith('seedData.js')) {
  runSeed().then(() => {
    setTimeout(() => process.exit(0), 500);
  });
}