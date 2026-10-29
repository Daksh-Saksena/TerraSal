import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import { initializeDB } from '../db/index.js';

let server;
let baseUrl;

test.before(async () => {
  await initializeDB();
  await new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

test('API: GET /api/health returns healthy status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.database, 'connected');
  assert.ok(data.fieldsCount >= 1);
});

test('API: GET /api/fields returns all registered fields', async () => {
  const res = await fetch(`${baseUrl}/api/fields`);
  assert.equal(res.status, 200);
  const fields = await res.json();
  assert.ok(Array.isArray(fields));
  assert.ok(fields.length >= 1);
  assert.ok(fields[0].whoopMetrics);
  assert.ok(fields[0].metrics);
});

test('API: GET /api/village/benchmarks returns community intelligence', async () => {
  const res = await fetch(`${baseUrl}/api/village/benchmarks`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.villageStats);
  assert.ok(data.villageStats.totalFields >= 1);
  assert.ok(Array.isArray(data.fields));
  assert.ok(Array.isArray(data.advisories));
});

test('API: POST /api/analyze computes risk analysis', async () => {
  const res = await fetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      groundwaterEC: 4.2,
      waterTableDepth: 2.0,
      soilType: 'clay-loam',
      cropType: 'wheat'
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data.riskScore === 'number');
  assert.ok(data.riskLevel);
  assert.ok(data.whoopMetrics);
});

test('API: POST and DELETE /api/fields flow', async () => {
  const newFarm = {
    name: 'CI Test Farm',
    farmerName: 'Tester',
    location: '30.1234°N, 75.1234°E',
    lat: 30.1234,
    lng: 75.1234,
    area: 20,
    cropType: 'barley',
    soilType: 'sandy',
    drainageQuality: 'good',
    irrigationMethod: 'drip',
    groundwaterEC: 2.1,
    waterTableDepth: 4.0,
    rainfallLast30Days: 25
  };

  const createRes = await fetch(`${baseUrl}/api/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newFarm)
  });
  assert.equal(createRes.status, 201);
  const createData = await createRes.json();
  assert.ok(createData.fieldId);

  // Delete it
  const deleteRes = await fetch(`${baseUrl}/api/fields/${createData.fieldId}`, {
    method: 'DELETE'
  });
  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.success, true);
});

test('API: POST /api/telemetry processes sensor update', async () => {
  const fieldsRes = await fetch(`${baseUrl}/api/fields`);
  const fields = await fieldsRes.json();
  const targetId = fields[0]?.id || 'field-001';

  const telemetryRes = await fetch(`${baseUrl}/api/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fieldId: targetId,
      metrics: {
        ec: 4.8,
        waterTable: 1.6
      }
    })
  });
  assert.equal(telemetryRes.status, 200);
  const data = await telemetryRes.json();
  assert.equal(data.success, true);
  assert.ok(typeof data.riskScore === 'number');
});
