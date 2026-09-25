import { db, initializeDB } from './schema.js';
import { mockFields } from '../../frontend/src/data/mockFields.js';
import { mockRegions } from '../../frontend/src/data/mockRegions.js';
import { 
  waterTableData, 
  seasonalData, 
  rainfallECData, 
  yoyData, 
  riskScoreTrend,
  ecTrendData 
} from '../../frontend/src/data/mockTrends.js';

async function seed() {
  await initializeDB();
  console.log('Database initialized. Seeding data...');

  db.serialize(() => {
    // Clean up existing data
    const tables = ['fields', 'alerts', 'metrics', 'regions', 'waterTableTrends', 'seasonalTrends', 'rainfallECTrends', 'yoyTrends', 'riskScoreTrends', 'ecTrends'];
    tables.forEach(table => {
      db.run(`DELETE FROM ${table}`);
    });

    // Seed Fields
    const insertField = db.prepare('INSERT INTO fields (id, name, location, area, cropType, soilType, sensorConnected, riskLevel, riskScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertAlert = db.prepare('INSERT INTO alerts (fieldId, message) VALUES (?, ?)');
    const insertMetric = db.prepare('INSERT INTO metrics (fieldId, ec, waterTable, rainfall) VALUES (?, ?, ?, ?)');

    mockFields.forEach(field => {
      insertField.run(field.id, field.name, field.location, field.area, field.cropType, field.soilType, field.sensorConnected ? 1 : 0, field.riskLevel, field.riskScore);
      
      field.alerts.forEach(alert => {
        insertAlert.run(field.id, alert);
      });

      insertMetric.run(field.id, field.groundwaterEC, field.waterTableDepth, field.rainfallLast30Days);
    });
    insertField.finalize();
    insertAlert.finalize();
    insertMetric.finalize();

    // Seed Regions
    const insertRegion = db.prepare('INSERT INTO regions (id, state, district, lat, lng, riskScore, riskLevel, trend, avgEC, waterTableDepth, affectedArea, dominantCrop, farmersAffected) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    mockRegions.forEach(region => {
      insertRegion.run(region.id, region.state, region.district, region.lat, region.lng, region.riskScore, region.riskLevel, region.trend, region.avgEC, region.waterTableDepth, region.affectedArea, region.dominantCrop, region.farmersAffected);
    });
    insertRegion.finalize();

    // Seed Trends
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
    ecTrendData.forEach(d => insertEc.run(d.month, d.__safe, d.ludhiana, d.hisar, d.ganganagar));
    insertEc.finalize();

    console.log('Seeding complete!');
  });

  // Wait a moment for transactions to finish before closing
  setTimeout(() => {
    db.close();
  }, 1000);
}

seed();
