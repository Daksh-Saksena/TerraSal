import { initializeDB, queryAll } from './index.js';
async function seed() {
  console.log('[Seed] Initializing database and checking baseline datasets...');
  try {
    await initializeDB();
    const fields = await queryAll('SELECT id, name FROM fields');
    console.log(`[Seed] Success! Database currently has ${fields.length} field(s) registered.`);
  } catch (err) {
    console.error('[Seed] Error during database seeding:', err.message);
    process.exit(1);
  }
}
seed();