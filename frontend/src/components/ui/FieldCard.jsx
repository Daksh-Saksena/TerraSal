import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Droplets, ArrowDownUp, CloudRain, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import RiskBadge from './RiskBadge';
import { formatEC, formatDepth, formatRainfall, getRelativeTime } from '../../utils/formatters';
import { getScoreGradient } from '../../utils/formatters';
import './FieldCard.css';

export default function FieldCard({ field }) {
  const {
    id, name, location, area, cropType, riskScore, riskLevel,
    groundwaterEC, waterTableDepth, rainfallLast30Days,
    alerts, lastUpdated, sensorConnected, stressProbability,
  } = field;

  return (
    <div className={`field-card card ${riskLevel.toLowerCase()}-border fade-in`}>
      {/* Header */}
      <div className="field-card-header">
        <div className="field-card-meta">
          <h3 className="field-name">{name}</h3>
          <div className="field-location">
            <MapPin size={12} />
            <span>{location}</span>
          </div>
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      {/* Score bar */}
      <div className="field-score-section">
        <div className="field-score-row">
          <span className="field-score-label">Risk Score</span>
          <span className="field-score-val" style={{ color: getScoreGradient(riskScore) }}>
            {riskScore}/100
          </span>
        </div>
        <div className="progress-bar-wrap">
          <div
            className="progress-bar-fill"
            style={{
              width: `${riskScore}%`,
              background: getScoreGradient(riskScore),
              boxShadow: `0 0 8px ${getScoreGradient(riskScore)}60`,
            }}
          />
        </div>
        <div className="field-stress">
          Crop Stress Probability: <strong style={{ color: getScoreGradient(stressProbability) }}>{stressProbability}%</strong>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="field-metrics">
        <div className="field-metric">
          <div className="field-metric-icon ec"><Droplets size={14} /></div>
          <div>
            <div className="field-metric-val">{formatEC(groundwaterEC)}</div>
            <div className="field-metric-label">Groundwater EC</div>
          </div>
        </div>
        <div className="field-metric">
          <div className="field-metric-icon wt"><ArrowDownUp size={14} /></div>
          <div>
            <div className="field-metric-val">{formatDepth(waterTableDepth)}</div>
            <div className="field-metric-label">Water Table</div>
          </div>
        </div>
        <div className="field-metric">
          <div className="field-metric-icon rain"><CloudRain size={14} /></div>
          <div>
            <div className="field-metric-val">{formatRainfall(rainfallLast30Days)}</div>
            <div className="field-metric-label">30d Rainfall</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="field-alerts">
          {alerts.slice(0, 2).map((alert, i) => (
            <div key={i} className="field-alert-item">
              <span className="field-alert-dot" style={{
                background: riskLevel === 'CRITICAL' ? 'var(--color-critical)' :
                  riskLevel === 'HIGH' ? 'var(--color-high)' : 'var(--color-moderate)'
              }} />
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="field-card-footer">
        <div className="field-footer-left">
          <span className="field-area">{area} ac · {cropType}</span>
          <span className={`sensor-status ${sensorConnected ? 'connected' : 'disconnected'}`}>
            {sensorConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {sensorConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        <Link to="/analyze" className="field-detail-btn">
          Analyze <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
