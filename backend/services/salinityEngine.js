/**
 * TerraSal Salinity Prediction Engine — V1
 *
 * This module implements a weighted multi-factor scoring algorithm
 * to predict soil salinity risk and crop stress probability.
 *
 * Design notes:
 * - Each factor contributes to an overall 0–100 risk score
 * - Weights are research-informed (FAO/ICAR soil management guidelines)
 * - Replace `computeFactorScore()` internals with ML model output in V2
 * - All inputs are normalized to 0–10 subscores before weighting
 */

// Factor weights must sum to 1.0
const FACTOR_WEIGHTS = {
  groundwaterEC: 0.25,
  waterTableDepth: 0.20,
  soilType: 0.15,
  drainageQuality: 0.15,
  rainfallLast30Days: 0.10,
  irrigationMethod: 0.08,
  cropTolerance: 0.05,
  terrain: 0.02,
};

// ─── Scoring Functions ─────────────────────────────────────────────────────

/**
 * Score groundwater EC (electrical conductivity)
 * Higher EC → higher risk
 * @param {number} ec - dS/m
 * @returns {number} 0–10
 */
const scoreEC = (ec) => {
  if (ec <= 0.5) return 0;
  if (ec <= 1.5) return 1;
  if (ec <= 2.0) return 2.5;
  if (ec <= 3.0) return 4;
  if (ec <= 4.0) return 5.5;
  if (ec <= 5.0) return 7;
  if (ec <= 6.0) return 8.5;
  if (ec <= 7.0) return 9.2;
  return 10;
};

/**
 * Score water table depth
 * Shallower water table → higher risk (salts rise via capillary action)
 * @param {number} depth - meters below surface
 * @returns {number} 0–10
 */
const scoreWaterTable = (depth) => {
  if (depth >= 6.0) return 0;
  if (depth >= 5.0) return 1;
  if (depth >= 4.0) return 2.5;
  if (depth >= 3.0) return 4;
  if (depth >= 2.5) return 5.5;
  if (depth >= 2.0) return 7;
  if (depth >= 1.5) return 8.5;
  if (depth >= 1.0) return 9.5;
  return 10;
};

/**
 * Score soil type (capillary rise potential)
 * Clay > Loam > Sandy in terms of salt accumulation risk
 */
const scoreSoilType = (soilType) => {
  const scores = {
    'clay': 10,
    'clay-loam': 8,
    'loamy': 6,
    'sandy-loam': 4,
    'sandy': 2,
  };
  return scores[soilType] ?? 5;
};

/**
 * Score drainage quality
 * Poor drainage → salts accumulate, higher risk
 */
const scoreDrainage = (drainage) => {
  const scores = {
    'very-poor': 10,
    'poor': 8,
    'moderate': 5,
    'good': 2,
    'excellent': 0,
  };
  return scores[drainage] ?? 5;
};

/**
 * Score rainfall over last 30 days
 * Higher rainfall → leaching effect → lower salinity risk
 * @param {number} mm - millimeters
 * @returns {number} 0–10 (inverted — more rain = lower score)
 */
const scoreRainfall = (mm) => {
  if (mm >= 100) return 0;
  if (mm >= 60) return 1.5;
  if (mm >= 40) return 3;
  if (mm >= 25) return 5;
  if (mm >= 15) return 6.5;
  if (mm >= 8) return 8;
  if (mm >= 3) return 9;
  return 10;
};

/**
 * Score irrigation method
 * Flood irrigation → salt accumulation; drip/sprinkler → controlled
 */
const scoreIrrigation = (method) => {
  const scores = {
    'flood': 9,
    'canal': 8,
    'furrow': 7,
    'sprinkler': 4,
    'drip': 2,
    'none': 5,
  };
  return scores[method] ?? 5;
};

/**
 * Score based on crop salt tolerance
 * Sensitive crops → higher risk at same salinity level
 */
const scoreCropTolerance = (cropType) => {
  const scores = {
    'rice': 9,
    'sugarcane': 9,
    'chickpea': 9,
    'lentil': 8.5,
    'mustard': 7,
    'sunflower': 6,
    'wheat': 5.5,
    'sorghum': 5,
    'cotton': 4,
    'safflower': 3.5,
    'barley': 2,
    'sugar-beet': 1.5,
  };
  return scores[cropType] ?? 5;
};

/**
 * Score terrain/elevation (flat terrain → waterlogging risk)
 * This is a simplified proxy; replace with DEM data in V2
 */
const scoreTerrain = (terrain) => {
  const scores = {
    'depression': 10,
    'flat': 7,
    'gentle-slope': 4,
    'moderate-slope': 2,
    'steep': 0,
  };
  return scores[terrain] ?? 5;
};

// ─── Factor Descriptors ─────────────────────────────────────────────────────

const getECDescription = (ec, score) => {
  if (score <= 2) return `Groundwater EC of ${ec} dS/m is within safe limits — low salinity risk.`;
  if (score <= 5) return `Groundwater EC of ${ec} dS/m indicates moderate salinity — monitor trends.`;
  if (score <= 7) return `Groundwater EC of ${ec} dS/m is elevated — crops showing early stress.`;
  return `Groundwater EC of ${ec} dS/m is critically high — most crops will experience severe yield loss.`;
};

const getWaterTableDescription = (depth, score) => {
  if (score <= 2) return `Water table at ${depth}m depth is adequately deep — capillary rise not a concern.`;
  if (score <= 5) return `Water table at ${depth}m is at a moderate depth — some capillary salt rise possible.`;
  if (score <= 7) return `Water table at ${depth}m is dangerously shallow — active capillary salt rise occurring.`;
  return `Water table at ${depth}m is critically shallow — severe waterlogging and salt accumulation risk.`;
};

// ─── Main Engine ────────────────────────────────────────────────────────────

/**
 * Main salinity risk prediction function
 *
 * @param {Object} inputs
 * @param {number} inputs.groundwaterEC - dS/m
 * @param {number} inputs.waterTableDepth - meters
 * @param {string} inputs.soilType - clay|clay-loam|loamy|sandy-loam|sandy
 * @param {string} inputs.drainageQuality - very-poor|poor|moderate|good|excellent
 * @param {number} inputs.rainfallLast30Days - mm
 * @param {string} inputs.irrigationMethod - flood|canal|furrow|sprinkler|drip|none
 * @param {string} inputs.cropType - wheat|rice|cotton|...
 * @param {string} inputs.terrain - depression|flat|gentle-slope|moderate-slope|steep
 * @returns {Object} Full risk assessment result
 */
export const analyzeSalinity = (inputs) => {
  const {
    groundwaterEC,
    waterTableDepth,
    soilType,
    drainageQuality,
    rainfallLast30Days,
    irrigationMethod,
    cropType,
    terrain = 'flat',
  } = inputs;

  // Compute individual factor scores (0–10)
  const factorScores = {
    groundwaterEC: scoreEC(groundwaterEC),
    waterTableDepth: scoreWaterTable(waterTableDepth),
    soilType: scoreSoilType(soilType),
    drainageQuality: scoreDrainage(drainageQuality),
    rainfallLast30Days: scoreRainfall(rainfallLast30Days),
    irrigationMethod: scoreIrrigation(irrigationMethod),
    cropTolerance: scoreCropTolerance(cropType),
    terrain: scoreTerrain(terrain),
  };

  // Weighted risk score (0–100)
  const riskScore = Math.round(
    Object.entries(factorScores).reduce((total, [key, score]) => {
      return total + score * FACTOR_WEIGHTS[key] * 10;
    }, 0)
  );

  // Risk level classification
  const riskLevel =
    riskScore >= 80 ? 'CRITICAL' :
    riskScore >= 60 ? 'HIGH' :
    riskScore >= 35 ? 'MODERATE' : 'LOW';

  // Crop stress probability (correlated with risk score, weighted by crop sensitivity)
  const cropSensitivityFactor = factorScores.cropTolerance / 10;
  const stressProbability = Math.min(100, Math.round(
    riskScore * 0.7 + factorScores.groundwaterEC * 2.5 * cropSensitivityFactor
  ));

  // Factor breakdown for visualization
  const factors = [
    {
      name: 'Groundwater EC',
      key: 'groundwaterEC',
      score: factorScores.groundwaterEC,
      weight: FACTOR_WEIGHTS.groundwaterEC,
      contribution: Math.round(factorScores.groundwaterEC * FACTOR_WEIGHTS.groundwaterEC * 10),
      description: getECDescription(groundwaterEC, factorScores.groundwaterEC),
      severity: factorScores.groundwaterEC >= 7 ? 'critical' : factorScores.groundwaterEC >= 5 ? 'high' : factorScores.groundwaterEC >= 3 ? 'moderate' : 'low',
    },
    {
      name: 'Water Table Depth',
      key: 'waterTableDepth',
      score: factorScores.waterTableDepth,
      weight: FACTOR_WEIGHTS.waterTableDepth,
      contribution: Math.round(factorScores.waterTableDepth * FACTOR_WEIGHTS.waterTableDepth * 10),
      description: getWaterTableDescription(waterTableDepth, factorScores.waterTableDepth),
      severity: factorScores.waterTableDepth >= 7 ? 'critical' : factorScores.waterTableDepth >= 5 ? 'high' : factorScores.waterTableDepth >= 3 ? 'moderate' : 'low',
    },
    {
      name: 'Soil Type',
      key: 'soilType',
      score: factorScores.soilType,
      weight: FACTOR_WEIGHTS.soilType,
      contribution: Math.round(factorScores.soilType * FACTOR_WEIGHTS.soilType * 10),
      description: `${soilType.replace('-', ' ')} soil — ${factorScores.soilType >= 7 ? 'high capillary rise potential' : factorScores.soilType >= 4 ? 'moderate salt retention' : 'good drainage characteristics'}.`,
      severity: factorScores.soilType >= 7 ? 'high' : factorScores.soilType >= 4 ? 'moderate' : 'low',
    },
    {
      name: 'Drainage Quality',
      key: 'drainageQuality',
      score: factorScores.drainageQuality,
      weight: FACTOR_WEIGHTS.drainageQuality,
      contribution: Math.round(factorScores.drainageQuality * FACTOR_WEIGHTS.drainageQuality * 10),
      description: `${drainageQuality.replace('-', ' ')} drainage — ${factorScores.drainageQuality >= 7 ? 'salts unable to leach, accumulating in root zone' : factorScores.drainageQuality >= 4 ? 'partial leaching occurring' : 'good salt flushing capacity'}.`,
      severity: factorScores.drainageQuality >= 7 ? 'critical' : factorScores.drainageQuality >= 4 ? 'moderate' : 'low',
    },
    {
      name: 'Recent Rainfall',
      key: 'rainfallLast30Days',
      score: factorScores.rainfallLast30Days,
      weight: FACTOR_WEIGHTS.rainfallLast30Days,
      contribution: Math.round(factorScores.rainfallLast30Days * FACTOR_WEIGHTS.rainfallLast30Days * 10),
      description: `${rainfallLast30Days}mm rainfall in last 30 days — ${factorScores.rainfallLast30Days >= 7 ? 'insufficient for leaching, salt build-up continuing' : factorScores.rainfallLast30Days >= 4 ? 'partial leaching' : 'adequate rainfall providing natural leaching'}.`,
      severity: factorScores.rainfallLast30Days >= 7 ? 'high' : factorScores.rainfallLast30Days >= 4 ? 'moderate' : 'low',
    },
    {
      name: 'Irrigation Method',
      key: 'irrigationMethod',
      score: factorScores.irrigationMethod,
      weight: FACTOR_WEIGHTS.irrigationMethod,
      contribution: Math.round(factorScores.irrigationMethod * FACTOR_WEIGHTS.irrigationMethod * 10),
      description: `${irrigationMethod} irrigation — ${factorScores.irrigationMethod >= 7 ? 'high water volumes promoting salt accumulation' : factorScores.irrigationMethod >= 4 ? 'moderate impact on salinity' : 'efficient water use reducing salt stress'}.`,
      severity: factorScores.irrigationMethod >= 7 ? 'high' : factorScores.irrigationMethod >= 4 ? 'moderate' : 'low',
    },
    {
      name: 'Crop Tolerance',
      key: 'cropTolerance',
      score: factorScores.cropTolerance,
      weight: FACTOR_WEIGHTS.cropTolerance,
      contribution: Math.round(factorScores.cropTolerance * FACTOR_WEIGHTS.cropTolerance * 10),
      description: `${cropType} has ${factorScores.cropTolerance >= 7 ? 'low' : factorScores.cropTolerance >= 4 ? 'moderate' : 'high'} salt tolerance — ${factorScores.cropTolerance >= 7 ? 'highly vulnerable to current salinity levels' : factorScores.cropTolerance >= 4 ? 'showing manageable stress' : 'well-suited for these conditions'}.`,
      severity: factorScores.cropTolerance >= 7 ? 'critical' : factorScores.cropTolerance >= 4 ? 'moderate' : 'low',
    },
    {
      name: 'Terrain',
      key: 'terrain',
      score: factorScores.terrain,
      weight: FACTOR_WEIGHTS.terrain,
      contribution: Math.round(factorScores.terrain * FACTOR_WEIGHTS.terrain * 10),
      description: `${terrain.replace('-', ' ')} terrain — ${factorScores.terrain >= 7 ? 'low-lying area promotes waterlogging' : factorScores.terrain >= 4 ? 'moderate drainage potential' : 'good natural drainage via slope'}.`,
      severity: factorScores.terrain >= 7 ? 'high' : factorScores.terrain >= 4 ? 'moderate' : 'low',
    },
  ].sort((a, b) => b.contribution - a.contribution);

  // Generate explanation
  const topFactors = factors.slice(0, 3).map(f => f.name.toLowerCase()).join(', ');
  const explanation = generateExplanation(riskLevel, riskScore, inputs, factorScores, topFactors);

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, inputs, factorScores);

  return {
    riskScore,
    riskLevel,
    stressProbability,
    factors,
    explanation,
    recommendations,
    metadata: {
      computedAt: new Date().toISOString(),
      modelVersion: '1.0.0',
      inputs,
    },
  };
};

// ─── Explanation Generator ──────────────────────────────────────────────────

const generateExplanation = (riskLevel, riskScore, inputs, factorScores, topFactors) => {
  const levelDescriptions = {
    CRITICAL: `The soil salinity risk assessment for this field is CRITICAL (score: ${riskScore}/100). Immediate intervention is required. The primary drivers are ${topFactors}. At groundwater EC of ${inputs.groundwaterEC} dS/m with a water table only ${inputs.waterTableDepth}m deep, salts are actively accumulating in the root zone through capillary rise. The ${inputs.drainageQuality.replace('-', ' ')} drainage is unable to leach accumulated salts. ${inputs.cropType} — which has relatively low salt tolerance — is at severe risk of yield failure this season if conditions remain unchanged.`,
    HIGH: `The soil salinity risk assessment is HIGH (score: ${riskScore}/100). The combination of ${topFactors} creates conditions where significant crop stress is likely. Groundwater EC of ${inputs.groundwaterEC} dS/m is above safe thresholds for ${inputs.cropType}. With ${inputs.drainageQuality.replace('-', ' ')} drainage and only ${inputs.rainfallLast30Days}mm of rainfall in the past 30 days, natural salt leaching is insufficient. Without intervention, expect 20–40% yield reduction this season.`,
    MODERATE: `The soil salinity risk assessment is MODERATE (score: ${riskScore}/100). Conditions are manageable but trending in a concerning direction. Key factors are ${topFactors}. Groundwater EC of ${inputs.groundwaterEC} dS/m is within tolerable limits for ${inputs.cropType} but leaving little buffer. Proactive management now can prevent escalation to a high-risk scenario.`,
    LOW: `The soil salinity risk assessment is LOW (score: ${riskScore}/100). Current conditions are favorable. Groundwater EC of ${inputs.groundwaterEC} dS/m is well within safe limits for ${inputs.cropType}. Continue current management practices and monitor quarterly. Preventive measures will maintain this healthy status.`,
  };
  return levelDescriptions[riskLevel];
};

// ─── Recommendation Generator ───────────────────────────────────────────────

const generateRecommendations = (riskLevel, inputs, factorScores) => {
  const immediate = [];
  const shortTerm = [];
  const longTerm = [];
  const alternativeCrops = [];
  const irrigationChanges = [];
  const soilTreatment = [];

  // Immediate actions based on risk level
  if (riskLevel === 'CRITICAL') {
    immediate.push('Stop flood irrigation immediately — switch to drip or sprinkler to reduce salt loading');
    immediate.push('Apply a heavy leaching irrigation (30–40% excess) to flush salts below root zone');
    immediate.push('Collect soil samples for laboratory EC and SAR (Sodium Adsorption Ratio) analysis');
    immediate.push('Contact local agriculture department or KVK for emergency soil health intervention');
  } else if (riskLevel === 'HIGH') {
    immediate.push('Reduce irrigation frequency and volume by 25–30%');
    immediate.push('Apply pre-sowing leaching irrigation before next crop cycle');
    immediate.push('Get groundwater quality tested at certified laboratory');
  } else if (riskLevel === 'MODERATE') {
    immediate.push('Monitor soil EC monthly using portable EC meter');
    immediate.push('Schedule preventive leaching irrigation before next sowing');
  }

  // Drainage-based recommendations
  if (factorScores.drainageQuality >= 7) {
    shortTerm.push('Install subsurface tile drains at 1–1.5m depth to remove saline water');
    shortTerm.push('Construct field drainage channels along field boundaries');
    longTerm.push('Consider bio-drainage using Eucalyptus or Prosopis along field edges');
  } else if (factorScores.drainageQuality >= 4) {
    shortTerm.push('Clear and deepen existing drainage channels');
    shortTerm.push('Ensure field has minimum 0.2% surface slope for runoff');
  }

  // Soil treatment
  if (factorScores.groundwaterEC >= 5 || factorScores.drainageQuality >= 7) {
    soilTreatment.push({
      title: 'Gypsum Application',
      description: 'Apply agricultural gypsum (calcium sulfate) at 2–5 tonnes/hectare to replace sodium with calcium in soil. Most effective for sodic soils (high SAR).',
      timing: 'Before monsoon or pre-sowing',
    });
    soilTreatment.push({
      title: 'Organic Matter Amendment',
      description: 'Incorporate farmyard manure or compost at 10–15 tonnes/hectare to improve soil structure and reduce salt stress on root systems.',
      timing: 'Post-harvest / pre-sowing',
    });
  }

  if (factorScores.drainageQuality >= 5) {
    soilTreatment.push({
      title: 'Leaching Irrigation Protocol',
      description: 'Apply 50–75cm of good quality water (EC < 0.5 dS/m) before crop establishment to leach salts below root zone. Requires adequate drainage.',
      timing: 'Pre-sowing (15–20 days before)',
    });
  }

  soilTreatment.push({
    title: 'Green Manuring',
    description: 'Grow Dhaincha (Sesbania bispinosa) or Sunhemp as green manure. Plough in at flowering stage to improve organic matter and reduce soil salinity over time.',
    timing: 'Between crop cycles (June–July)',
  });

  // Irrigation recommendations
  if (inputs.irrigationMethod === 'flood' || inputs.irrigationMethod === 'canal') {
    irrigationChanges.push({
      title: 'Switch to Drip Irrigation',
      description: 'Drip irrigation reduces water consumption by 40–60% and prevents salt accumulation by delivering water directly to the root zone without wetting the soil surface.',
      benefit: '40-60% water savings, significant EC reduction',
      subsidy: 'PM-KUSUM / PMKSY subsidy available: up to 90% for small farmers',
    });
    irrigationChanges.push({
      title: 'Deficit Irrigation Scheduling',
      description: 'Irrigate at 70–80% of ETc (crop evapotranspiration) to maintain mild water stress that concentrates less salt in the root zone than over-irrigation.',
      benefit: 'Reduces salt accumulation, saves water',
      subsidy: null,
    });
  }

  if (factorScores.waterTableDepth >= 6) {
    irrigationChanges.push({
      title: 'Skip Irrigation During Monsoon',
      description: 'Leverage monsoon rainfall for leaching. Avoid irrigation when water table is rising — this brings additional salts to the surface.',
      benefit: 'Natural salt leaching, reduced irrigation cost',
      subsidy: null,
    });
  }

  // Alternative crops based on EC levels
  const ec = inputs.groundwaterEC;
  if (ec >= 6) {
    alternativeCrops.push('Sugar Beet (tolerates up to 7.0 dS/m)', 'Barley (tolerates up to 8.0 dS/m)', 'Safflower (tolerates up to 5.3 dS/m)');
  } else if (ec >= 4) {
    alternativeCrops.push('Barley', 'Cotton (with drip irrigation)', 'Safflower', 'Sorghum (Jowar)');
  } else if (ec >= 2.5) {
    alternativeCrops.push('Wheat', 'Cotton', 'Sunflower', 'Mustard');
  } else {
    alternativeCrops.push('All major crops suitable — maintain current practices');
  }

  // Long-term strategies
  longTerm.push('Install automated soil EC sensors for continuous monitoring (connect to TerraSal platform)');
  longTerm.push('Adopt crop rotation with salt-tolerant species every 3rd season to break salt cycle');
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    longTerm.push('Partner with local KVK (Krishi Vigyan Kendra) for soil health card analysis');
    longTerm.push('Explore participation in ICAR salt-tolerant variety trials');
  }

  return {
    immediate,
    shortTerm,
    longTerm,
    alternativeCrops,
    irrigationChanges,
    soilTreatment,
  };
};
