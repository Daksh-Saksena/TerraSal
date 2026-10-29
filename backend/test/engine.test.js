import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSalinity } from '../services/salinityEngine.js';

test('Salinity Engine: High risk scenario computation', () => {
  const result = analyzeSalinity({
    groundwaterEC: 6.5,
    waterTableDepth: 1.2,
    soilType: 'clay',
    drainageQuality: 'very-poor',
    rainfallLast30Days: 4,
    irrigationMethod: 'flood',
    cropType: 'rice'
  });

  assert.ok(result.riskScore >= 70, `Expected riskScore >= 70, got ${result.riskScore}`);
  assert.ok(result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL');
  assert.ok(result.whoopMetrics);
  assert.ok(result.whoopMetrics.soilStrain >= 12);
  assert.ok(result.whoopMetrics.soilRecovery <= 40);
  assert.equal(result.whoopMetrics.recoveryZone, 'RED');
  assert.ok(Array.isArray(result.recommendations.immediate));
  assert.ok(result.recommendations.immediate.length > 0);
});

test('Salinity Engine: Low risk scenario computation', () => {
  const result = analyzeSalinity({
    groundwaterEC: 0.8,
    waterTableDepth: 5.5,
    soilType: 'sandy',
    drainageQuality: 'excellent',
    rainfallLast30Days: 120,
    irrigationMethod: 'drip',
    cropType: 'barley'
  });

  assert.ok(result.riskScore <= 35, `Expected riskScore <= 35, got ${result.riskScore}`);
  assert.equal(result.riskLevel, 'LOW');
  assert.equal(result.whoopMetrics.recoveryZone, 'GREEN');
  assert.ok(result.whoopMetrics.soilRecovery >= 67);
});

test('Salinity Engine: Resilient against empty and null inputs', () => {
  assert.doesNotThrow(() => {
    const emptyResult = analyzeSalinity({});
    assert.ok(emptyResult.riskScore >= 0);
  });

  assert.doesNotThrow(() => {
    const nullResult = analyzeSalinity({
      groundwaterEC: null,
      waterTableDepth: undefined,
      soilType: null,
      drainageQuality: null,
      cropType: null,
      irrigationMethod: null
    });
    assert.ok(nullResult.riskScore >= 0);
    assert.ok(typeof nullResult.explanation === 'string');
  });
});
