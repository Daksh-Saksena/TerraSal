import { db, initializeDB } from './schema.js';

// No mock data: this script only initializes the schema and clears all tables.
async function seed() {
  await initializeDB();
  console.log('Database initialized. Clearing existing data...');

  db.serialize(() => {
    const tables = ['fields', 'alerts', 'metrics', 'regions', 'waterTableTrends', 'seasonalTrends', 'rainfallECTrends', 'yoyTrends', 'riskScoreTrends', 'ecTrends'];
    tables.forEach(table => {
      db.run(`DELETE FROM ${table}`);
    });
    console.log('Done. Database is empty.');
  });

  setTimeout(() => {
    db.close();
  }, 1000);
}

seed();
