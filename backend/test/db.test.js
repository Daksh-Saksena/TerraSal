import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeDB, queryAll, queryGet, execute } from '../db/index.js';
test('Database: Schema initialization and baseline seeding', async () => {
  await initializeDB();
  const fields = await queryAll('SELECT * FROM fields');
  assert.ok(Array.isArray(fields));
  assert.ok(fields.length >= 1, 'Should have at least 1 field');
  const regions = await queryAll('SELECT * FROM regions');
  assert.ok(Array.isArray(regions));
  assert.ok(regions.length >= 1, 'Should have at least 1 region');
  const trends = await queryAll('SELECT * FROM waterTableTrends');
  assert.ok(Array.isArray(trends));
  assert.ok(trends.length >= 1, 'Should have trend data');
});
test('Database: CRUD operations on fields', async () => {
  const testId = `test-farm-${Date.now()}`;
  await execute(
    `INSERT INTO fields (id, name, farmerName, location, lat, lng, area, cropType, soilType, drainageQuality, irrigationMethod, sensorConnected, riskLevel, riskScore, stressProbability, soilStrain, soilRecovery, notes, lastUpdated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      testId,
      'Automated Test Farm',
      'Test Farmer',
      'Punjab',
      30.5,
      75.5,
      12.5,
      'wheat',
      'loamy',
      'moderate',
      'drip',
      1,
      'LOW',
      25,
      15,
      5.5,
      85,
      'Test notes',
      'Now'
    ]
  );
  const fetched = await queryGet('SELECT * FROM fields WHERE id = ?', [testId]);
  assert.ok(fetched, 'Field should be found');
  assert.equal(fetched.name, 'Automated Test Farm');
  assert.equal(fetched.cropType, 'wheat');
  await execute('UPDATE fields SET riskScore = ? WHERE id = ?', [45, testId]);
  const updated = await queryGet('SELECT riskScore FROM fields WHERE id = ?', [testId]);
  assert.equal(updated.riskScore, 45);
  await execute('DELETE FROM fields WHERE id = ?', [testId]);
  const deleted = await queryGet('SELECT * FROM fields WHERE id = ?', [testId]);
  assert.equal(deleted, null, 'Field should be deleted');
});