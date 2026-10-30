import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initialFields, initialRegions, initialTrends } from './initialData.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let dbClient = null;
export function getDbClient() {
  if (dbClient) return dbClient;
  const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;
  if (dbUrl) {
    const sanitizedUrl = dbUrl.replace(/\/\/[^@]*@/, '//***@');
    console.log(`[Database] Connecting to hosted libSQL database: ${sanitizedUrl}`);
    dbClient = createClient({
      url: dbUrl,
      authToken: authToken || undefined,
    });
  } else {
    if (process.env.VERCEL) {
      throw new Error(
        'Missing database configuration: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured in Vercel environment variables.'
      );
    }
    const localDbPath = path.resolve(__dirname, 'database.sqlite');
    console.log(`[Database] Using local SQLite file: ${localDbPath}`);
    const dbDir = path.dirname(localDbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    dbClient = createClient({
      url: `file:${localDbPath}`,
    });
  }
  return dbClient;
}
export const db = {
  all: async (sql, params, callback) => {
    try {
      const rows = await queryAll(sql, params);
      if (typeof callback === 'function') callback(null, rows);
      return rows;
    } catch (err) {
      if (typeof callback === 'function') callback(err);
      else throw err;
    }
  },
  get: async (sql, params, callback) => {
    try {
      const row = await queryGet(sql, params);
      if (typeof callback === 'function') callback(null, row);
      return row;
    } catch (err) {
      if (typeof callback === 'function') callback(err);
      else throw err;
    }
  },
  run: async (sql, params, callback) => {
    try {
      const res = await execute(sql, params);
      if (typeof callback === 'function') callback.call(res, null);
      return res;
    } catch (err) {
      if (typeof callback === 'function') callback(err);
      else throw err;
    }
  }
};
export async function queryAll(sql, params = []) {
  const client = getDbClient();
  const res = await client.execute({ sql, args: params });
  return res.rows;
}
export async function queryGet(sql, params = []) {
  const client = getDbClient();
  const res = await client.execute({ sql, args: params });
  return res.rows[0] || null;
}
export async function execute(sql, params = []) {
  const client = getDbClient();
  const res = await client.execute({ sql, args: params });
  return {
    rowsAffected: res.rowsAffected,
    lastInsertRowid: res.lastInsertRowid,
  };
}
let initPromise = null;
export function initializeDB() {
  if (!initPromise) {
    initPromise = runInitialization().catch(err => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
async function runInitialization() {
  const client = getDbClient();
  console.log('[Database] Checking schema & initializing tables...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      farmerName TEXT,
      location TEXT,
      lat NUMERIC,
      lng NUMERIC,
      area NUMERIC,
      cropType TEXT,
      soilType TEXT,
      drainageQuality TEXT,
      irrigationMethod TEXT,
      sensorConnected INTEGER DEFAULT 1,
      riskLevel TEXT,
      riskScore NUMERIC,
      stressProbability NUMERIC,
      soilStrain NUMERIC,
      soilRecovery NUMERIC,
      notes TEXT,
      lastUpdated TEXT
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fieldId TEXT,
      message TEXT,
      FOREIGN KEY(fieldId) REFERENCES fields(id)
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS metrics (
      fieldId TEXT PRIMARY KEY,
      ec NUMERIC,
      waterTable NUMERIC,
      rainfall NUMERIC,
      FOREIGN KEY(fieldId) REFERENCES fields(id)
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY,
      state TEXT,
      district TEXT,
      lat NUMERIC,
      lng NUMERIC,
      riskScore NUMERIC,
      riskLevel TEXT,
      trend TEXT,
      avgEC NUMERIC,
      waterTableDepth NUMERIC,
      affectedArea NUMERIC,
      dominantCrop TEXT,
      farmersAffected NUMERIC
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS waterTableTrends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT,
      depthGanganagar NUMERIC,
      depthLudhiana NUMERIC
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS seasonalTrends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT,
      avgSalinity NUMERIC,
      criticalFields INTEGER
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS rainfallECTrends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT,
      rainfall NUMERIC,
      avgEC NUMERIC
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS yoyTrends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT,
      year2024 NUMERIC,
      year2025 NUMERIC,
      year2026 NUMERIC
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS riskScoreTrends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT,
      avgRisk NUMERIC
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ecTrends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT,
      safeThreshold NUMERIC,
      ludhiana NUMERIC,
      hisar NUMERIC,
      ganganagar NUMERIC
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fieldId TEXT,
      sensorId TEXT,
      ec NUMERIC,
      waterTable NUMERIC,
      soilMoisture NUMERIC,
      timestamp TEXT,
      source TEXT,
      FOREIGN KEY(fieldId) REFERENCES fields(id)
    )
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_readings_field_time ON readings(fieldId, timestamp)
  `);
  try {
    const tableInfo = await client.execute('PRAGMA table_info(fields)');
    const existingCols = (tableInfo.rows || []).map(r => r.name);
    const requiredCols = [
      { name: 'farmerName', type: 'TEXT' },
      { name: 'lat', type: 'NUMERIC' },
      { name: 'lng', type: 'NUMERIC' },
      { name: 'drainageQuality', type: 'TEXT' },
      { name: 'irrigationMethod', type: 'TEXT' },
      { name: 'stressProbability', type: 'NUMERIC' },
      { name: 'soilStrain', type: 'NUMERIC' },
      { name: 'soilRecovery', type: 'NUMERIC' },
      { name: 'notes', type: 'TEXT' },
      { name: 'lastUpdated', type: 'TEXT' }
    ];
    for (const col of requiredCols) {
      if (!existingCols.includes(col.name)) {
        console.log(`[Database] Adding missing column fields.${col.name}`);
        await client.execute(`ALTER TABLE fields ADD COLUMN ${col.name} ${col.type}`);
      }
    }
  } catch (migErr) {
    console.warn('[Database] Column migration check notice:', migErr.message);
  }
  try {
    const fieldCountRes = await client.execute('SELECT COUNT(*) as count FROM fields');
    const fieldCount = fieldCountRes.rows[0]?.count ?? 0;
    if (Number(fieldCount) === 0) {
      console.log('[Database] Empty fields table detected. Seeding initial baseline farms...');
      for (const field of initialFields) {
        await client.execute({
          sql: `INSERT INTO fields (id, name, farmerName, location, lat, lng, area, cropType, soilType, drainageQuality, irrigationMethod, sensorConnected, riskLevel, riskScore, stressProbability, soilStrain, soilRecovery, notes, lastUpdated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            field.id,
            field.name,
            field.farmerName || 'Village Farmer',
            field.location,
            field.lat || 30.9,
            field.lng || 75.8,
            field.area,
            field.cropType,
            field.soilType,
            field.drainageQuality || 'moderate',
            field.irrigationMethod || 'flood',
            field.sensorConnected ?? 1,
            field.riskLevel,
            field.riskScore,
            field.stressProbability || 0,
            field.soilStrain || 12.0,
            field.soilRecovery || 50,
            field.notes || '',
            field.lastUpdated || 'Recently'
          ]
        });
        await client.execute({
          sql: 'INSERT INTO metrics (fieldId, ec, waterTable, rainfall) VALUES (?, ?, ?, ?)',
          args: [field.id, field.groundwaterEC, field.waterTableDepth, field.rainfallLast30Days]
        });
        if (Array.isArray(field.alerts)) {
          for (const alert of field.alerts) {
            await client.execute({
              sql: 'INSERT INTO alerts (fieldId, message) VALUES (?, ?)',
              args: [field.id, alert]
            });
          }
        }
      }
    }
    const regCountRes = await client.execute('SELECT COUNT(*) as count FROM regions');
    const regCount = regCountRes.rows[0]?.count ?? 0;
    if (Number(regCount) === 0) {
      console.log('[Database] Empty regions table detected. Seeding regional dataset...');
      for (const r of initialRegions) {
        await client.execute({
          sql: `INSERT INTO regions (id, state, district, lat, lng, riskScore, riskLevel, trend, avgEC, waterTableDepth, affectedArea, dominantCrop, farmersAffected)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [r.id, r.state, r.district, r.lat, r.lng, r.riskScore, r.riskLevel, r.trend, r.avgEC, r.waterTableDepth, r.affectedArea, r.dominantCrop, r.farmersAffected]
        });
      }
    }
    const wtCountRes = await client.execute('SELECT COUNT(*) as count FROM waterTableTrends');
    const wtCount = wtCountRes.rows[0]?.count ?? 0;
    if (Number(wtCount) === 0) {
      console.log('[Database] Empty trends table detected. Seeding historical trend datasets...');
      for (const d of initialTrends.waterTableData) {
        await client.execute({
          sql: 'INSERT INTO waterTableTrends (month, depthGanganagar, depthLudhiana) VALUES (?, ?, ?)',
          args: [d.month, d.depthGanganagar, d.depthLudhiana]
        });
      }
      for (const d of initialTrends.seasonalData) {
        await client.execute({
          sql: 'INSERT INTO seasonalTrends (month, avgSalinity, criticalFields) VALUES (?, ?, ?)',
          args: [d.month, d.avgSalinity, d.criticalFields]
        });
      }
      for (const d of initialTrends.rainfallECData) {
        await client.execute({
          sql: 'INSERT INTO rainfallECTrends (month, rainfall, avgEC) VALUES (?, ?, ?)',
          args: [d.month, d.rainfall, d.avgEC]
        });
      }
      for (const d of initialTrends.yoyData) {
        await client.execute({
          sql: 'INSERT INTO yoyTrends (month, year2024, year2025, year2026) VALUES (?, ?, ?, ?)',
          args: [d.month, d.year2024, d.year2025, d.year2026]
        });
      }
      for (const d of initialTrends.riskScoreTrend) {
        await client.execute({
          sql: 'INSERT INTO riskScoreTrends (month, avgRisk) VALUES (?, ?)',
          args: [d.month, d.avgRisk]
        });
      }
      for (const d of initialTrends.ecTrendData) {
        await client.execute({
          sql: 'INSERT INTO ecTrends (month, safeThreshold, ludhiana, hisar, ganganagar) VALUES (?, ?, ?, ?, ?)',
          args: [d.month, d.safeThreshold, d.ludhiana, d.hisar, d.ganganagar]
        });
      }
    }
    console.log('[Database] Schema checked and initialized successfully.');
  } catch (seedErr) {
    console.error('[Database] Seeding notice:', seedErr.message);
  }
}