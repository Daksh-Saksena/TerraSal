import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');

export const db = new sqlite3.Database(dbPath);

export function initializeDB() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Fields table
      db.run(`
        CREATE TABLE IF NOT EXISTS fields (
          id TEXT PRIMARY KEY,
          name TEXT,
          farmerName TEXT,
          location TEXT,
          lat NUMERIC,
          lng NUMERIC,
          area NUMERIC,
          cropType TEXT,
          soilType TEXT,
          drainageQuality TEXT,
          irrigationMethod TEXT,
          sensorConnected INTEGER,
          riskLevel TEXT,
          riskScore NUMERIC,
          stressProbability NUMERIC,
          soilStrain NUMERIC,
          soilRecovery NUMERIC,
          notes TEXT,
          lastUpdated TEXT
        )
      `);

      // Alerts table (linked to fields)
      db.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fieldId TEXT,
          message TEXT,
          FOREIGN KEY(fieldId) REFERENCES fields(id)
        )
      `);

      // Metrics table (linked to fields)
      db.run(`
        CREATE TABLE IF NOT EXISTS metrics (
          fieldId TEXT PRIMARY KEY,
          ec NUMERIC,
          waterTable NUMERIC,
          rainfall NUMERIC,
          FOREIGN KEY(fieldId) REFERENCES fields(id)
        )
      `);

      // Regions table
      db.run(`
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

      // Trends: Water Table
      db.run(`
        CREATE TABLE IF NOT EXISTS waterTableTrends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT,
          depthGanganagar NUMERIC,
          depthLudhiana NUMERIC
        )
      `);

      // Trends: Seasonal
      db.run(`
        CREATE TABLE IF NOT EXISTS seasonalTrends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT,
          avgSalinity NUMERIC,
          criticalFields INTEGER
        )
      `);

      // Trends: Rainfall vs EC
      db.run(`
        CREATE TABLE IF NOT EXISTS rainfallECTrends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT,
          rainfall NUMERIC,
          avgEC NUMERIC
        )
      `);

      // Trends: YoY
      db.run(`
        CREATE TABLE IF NOT EXISTS yoyTrends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT,
          year2024 NUMERIC,
          year2025 NUMERIC,
          year2026 NUMERIC
        )
      `);

      // Trends: Risk Score
      db.run(`
        CREATE TABLE IF NOT EXISTS riskScoreTrends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT,
          avgRisk NUMERIC
        )
      `);

      // Trends: EC Trend Data
      db.run(`
        CREATE TABLE IF NOT EXISTS ecTrends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month TEXT,
          safeThreshold NUMERIC,
          ludhiana NUMERIC,
          hisar NUMERIC,
          ganganagar NUMERIC
        )
      `);
      
      resolve();
    });
  });
}
