import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Zap } from 'lucide-react';

const CONFIG = {
  LOW: { label: 'Low Risk', icon: CheckCircle, className: 'badge badge-low' },
  MODERATE: { label: 'Moderate Risk', icon: AlertCircle, className: 'badge badge-moderate' },
  HIGH: { label: 'High Risk', icon: AlertTriangle, className: 'badge badge-high' },
  CRITICAL: { label: 'Critical', icon: Zap, className: 'badge badge-critical' },
};

export default function RiskBadge({ level, size = 'default', showIcon = true }) {
  const config = CONFIG[level] ?? CONFIG.LOW;
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <span className={config.className} style={size === 'lg' ? { fontSize: '0.875rem', padding: '5px 14px' } : {}}>
      {showIcon && <Icon size={iconSize} />}
      {config.label}
    </span>
  );
}
