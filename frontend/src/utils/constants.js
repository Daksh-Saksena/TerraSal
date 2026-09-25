// Utility constants for TerraSal

export const RISK_LEVELS = {
  LOW: { label: 'Low', color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)', border: '#22c55e' },
  MODERATE: { label: 'Moderate', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)', border: '#f59e0b' },
  HIGH: { label: 'High', color: '#f97316', bgColor: 'rgba(249,115,22,0.15)', border: '#f97316' },
  CRITICAL: { label: 'Critical', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', border: '#ef4444' },
};

export const TREND_ICONS = {
  improving: '↓',
  stable: '→',
  worsening: '↑',
  critical: '⚠',
};

export const SOIL_TYPES = [
  { value: 'sandy', label: 'Sandy' },
  { value: 'sandy-loam', label: 'Sandy Loam' },
  { value: 'loamy', label: 'Loamy' },
  { value: 'clay-loam', label: 'Clay Loam' },
  { value: 'clay', label: 'Clay' },
];

export const CROP_TYPES = [
  { value: 'wheat', label: 'Wheat' },
  { value: 'rice', label: 'Rice (Paddy)' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'mustard', label: 'Mustard' },
  { value: 'barley', label: 'Barley' },
  { value: 'sorghum', label: 'Sorghum (Jowar)' },
  { value: 'sunflower', label: 'Sunflower' },
  { value: 'safflower', label: 'Safflower' },
  { value: 'chickpea', label: 'Chickpea (Gram)' },
  { value: 'lentil', label: 'Lentil (Masoor)' },
  { value: 'sugar-beet', label: 'Sugar Beet' },
];

export const IRRIGATION_METHODS = [
  { value: 'flood', label: 'Flood Irrigation' },
  { value: 'canal', label: 'Canal Irrigation' },
  { value: 'furrow', label: 'Furrow Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'none', label: 'Rainfed / None' },
];

export const DRAINAGE_QUALITIES = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'poor', label: 'Poor' },
  { value: 'very-poor', label: 'Very Poor' },
];

export const TERRAIN_TYPES = [
  { value: 'depression', label: 'Depression / Low-lying' },
  { value: 'flat', label: 'Flat' },
  { value: 'gentle-slope', label: 'Gentle Slope' },
  { value: 'moderate-slope', label: 'Moderate Slope' },
  { value: 'steep', label: 'Steep' },
];

export const EC_THRESHOLDS = {
  safe: 2.0,        // Below this: generally safe for most crops
  caution: 4.0,     // Between safe and caution: monitor
  critical: 6.0,    // Above this: most crops at risk
};

export const CHART_COLORS = {
  teal: '#00C9B1',
  amber: '#F4A261',
  crimson: '#E63946',
  blue: '#4ECDC4',
  purple: '#9B59B6',
  green: '#22c55e',
  navy: '#1a3a5c',
};

export const APP_VERSION = '1.0.0-beta';
export const DATA_LAST_UPDATED = '2026-08-04';
