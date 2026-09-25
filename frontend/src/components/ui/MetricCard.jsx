import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './MetricCard.css';

export default function MetricCard({
  title,
  value,
  unit = '',
  change,
  changeType = 'neutral', // up | down | neutral
  icon: Icon,
  iconColor,
  description,
  className = '',
  size = 'default',
}) {
  const TrendIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;

  return (
    <div className={`card metric-card ${size === 'sm' ? 'card-sm' : ''} ${className} fade-in`}>
      <div className="metric-card-header">
        {Icon && (
          <div className="metric-icon" style={{ background: `${iconColor}20`, color: iconColor }}>
            <Icon size={18} />
          </div>
        )}
        <span className="card-title">{title}</span>
      </div>

      <div className="metric-body">
        <div className="metric-value">
          {value}
          {unit && <span className="metric-unit">{unit}</span>}
        </div>

        {change && (
          <div className={`metric-change ${changeType}`}>
            <TrendIcon size={11} />
            {change}
          </div>
        )}

        {description && (
          <div className="metric-desc">{description}</div>
        )}
      </div>
    </div>
  );
}
