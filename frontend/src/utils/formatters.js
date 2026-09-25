// Utility formatters for TerraSal

export const formatEC = (value) => `${Number(value).toFixed(1)} dS/m`;

export const formatDepth = (value) => `${Number(value).toFixed(1)}m`;

export const formatRainfall = (value) => `${Math.round(value)}mm`;

export const formatArea = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k ha`;
  return `${value} ha`;
};

export const formatNumber = (value) => {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
};

export const formatScore = (value) => Math.round(value);

export const formatPercent = (value) => `${Math.round(value)}%`;

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const getRiskColor = (level) => {
  const colors = {
    LOW: '#22c55e',
    MODERATE: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };
  return colors[level] ?? '#94a3b8';
};

export const getRiskBg = (level) => {
  const colors = {
    LOW: 'rgba(34,197,94,0.15)',
    MODERATE: 'rgba(245,158,11,0.15)',
    HIGH: 'rgba(249,115,22,0.15)',
    CRITICAL: 'rgba(239,68,68,0.15)',
  };
  return colors[level] ?? 'rgba(148,163,184,0.15)';
};

export const getScoreGradient = (score) => {
  if (score >= 80) return 'var(--color-critical)';
  if (score >= 60) return 'var(--color-high)';
  if (score >= 35) return 'var(--color-moderate)';
  return 'var(--color-safe)';
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const getRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffHours = Math.round((now - date) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};
