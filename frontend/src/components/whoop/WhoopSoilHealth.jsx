import React from 'react';
import {
  Activity, Droplets, Zap, Clock, ShieldAlert,
  ArrowUpRight, Info, Sparkles, MapPin, User, CheckCircle
} from 'lucide-react';
import './WhoopSoilHealth.css';

export default function WhoopSoilHealth({ farm, onOpenPinDrop }) {
  if (!farm) return null;

  const whoop = farm.whoopMetrics || {
    soilStrain: farm.soilStrain || 12.0,
    strainCategory: (farm.soilStrain || 12.0) >= 18 ? 'All-Out Strain' : (farm.soilStrain || 12.0) >= 14 ? 'High Strain' : (farm.soilStrain || 12.0) >= 10 ? 'Moderate Strain' : 'Light Strain',
    targetStrainMax: 14.0,
    soilRecovery: farm.soilRecovery || 55,
    recoveryZone: (farm.soilRecovery || 55) >= 67 ? 'GREEN' : (farm.soilRecovery || 55) >= 34 ? 'YELLOW' : 'RED',
    vitals: {
      osmoticPressure: parseFloat(((farm.groundwaterEC || 3.0) * 0.36).toFixed(2)),
      osmoticUnit: 'atm',
      osmoticStatus: (farm.groundwaterEC || 3.0) > 4.5 ? 'High Root Suction Lock' : (farm.groundwaterEC || 3.0) > 2.5 ? 'Moderate Resistance' : 'Normal Root Absorption',
      capillaryFlux: (farm.waterTableDepth || 2.5) < 2.0 ? 2.4 : 0.6,
      capillaryUnit: 'mm/day',
      capillaryStatus: (farm.waterTableDepth || 2.5) < 2.0 ? 'Active Capillary Influx' : 'Stable Buffer',
      leachingRequirement: 18,
      leachingUnit: '% extra water',
      soilResilienceIndex: Math.round((farm.soilRecovery || 55) * 0.92)
    },
    irrigationWindow: {
      optimalTime: '05:30 AM – 08:30 AM',
      reason: 'Low vapor-pressure deficit prevents surface salt crusting',
      actionToday: (farm.soilRecovery || 55) < 34 
        ? 'High Strain warning: Avoid flood irrigation today. Flush via drip or apply pre-dawn gypsum.'
        : (farm.soilRecovery || 55) < 67
        ? 'Soil strain is moderate. Standard irrigation allowed; keep moisture above 65% capacity.'
        : 'Soil in prime recovery zone. Optimal nutrient absorption and leaching potential.'
    }
  };

  const recovery = whoop.soilRecovery;
  const strain = whoop.soilStrain;
  const zone = whoop.recoveryZone; // GREEN, YELLOW, RED

  // Circular progress calculations for Recovery Ring
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (recovery / 100) * circumference;

  const zoneColors = {
    GREEN: { primary: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', glow: 'rgba(34, 197, 94, 0.4)' },
    YELLOW: { primary: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', glow: 'rgba(245, 158, 11, 0.4)' },
    RED: { primary: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', glow: 'rgba(239, 68, 68, 0.4)' },
  };
  const currentColor = zoneColors[zone] || zoneColors.YELLOW;

  // Strain bar percentage (0 to 21 scale)
  const strainPercent = Math.min(100, Math.round((strain / 21) * 100));

  return (
    <div className="whoop-soil-card fade-in">
      {/* Top Bar: Farmer Identity & Quick Switch */}
      <div className="whoop-header">
        <div className="whoop-farmer-info">
          <div className="whoop-badge">
            <span className="whoop-pulse" style={{ background: currentColor.primary }} />
            <span>WHOOP SOIL VITALITY</span>
          </div>
          <div className="whoop-farmer-meta">
            <h2 className="whoop-farm-name">{farm.name}</h2>
            <div className="whoop-meta-sub">
              <span className="whoop-farmer-name">
                <User size={13} />
                <strong>{farm.farmerName || 'Village Farmer'}</strong>
              </span>
              <span className="whoop-divider">·</span>
              <span className="whoop-location">
                <MapPin size={13} />
                {farm.location}
              </span>
              <span className="whoop-divider">·</span>
              <span className="whoop-crop-chip">{farm.cropType} · {farm.area} ac</span>
            </div>
          </div>
        </div>

        <button className="whoop-pin-btn" onClick={onOpenPinDrop}>
          <MapPin size={14} />
          <span>Drop Pin / New Farm</span>
        </button>
      </div>

      {/* Main WHOOP Dual-Engine: Recovery Ring + Day Strain Dial */}
      <div className="whoop-dual-grid">
        {/* Left: WHOOP Recovery Ring */}
        <div className="whoop-recovery-box">
          <div className="whoop-ring-wrapper">
            <svg className="whoop-ring-svg" width="140" height="140">
              <circle
                className="whoop-ring-bg"
                cx="70"
                cy="70"
                r={radius}
                strokeWidth="10"
              />
              <circle
                className="whoop-ring-progress"
                cx="70"
                cy="70"
                r={radius}
                strokeWidth="10"
                stroke={currentColor.primary}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  filter: `drop-shadow(0 0 10px ${currentColor.glow})`
                }}
              />
            </svg>
            <div className="whoop-ring-content">
              <span className="whoop-ring-num" style={{ color: currentColor.primary }}>
                {recovery}%
              </span>
              <span className="whoop-ring-label">RECOVERY</span>
            </div>
          </div>

          <div className="whoop-recovery-details">
            <div className="whoop-status-pill" style={{
              background: currentColor.bg,
              color: currentColor.primary,
              borderColor: `${currentColor.primary}40`
            }}>
              {zone} SOIL RECOVERY
            </div>
            <p className="whoop-recovery-desc">
              {zone === 'GREEN' && 'Soil osmotic buffer is optimal. Roots can extract water with minimal salt expenditure.'}
              {zone === 'YELLOW' && 'Moderate salt load. Plant transpiratory pull is expending extra metabolic energy.'}
              {zone === 'RED' && 'Critical root osmotic stress. Salt accumulation impeding hydraulic uptake.'}
            </p>
            <div className="whoop-resilience-stat">
              <span>Soil Resilience Index (SRI):</span>
              <strong style={{ color: currentColor.primary }}>{whoop.vitals?.soilResilienceIndex || 70}/100</strong>
            </div>
          </div>
        </div>

        {/* Right: WHOOP Soil Strain Gauge (0–21) */}
        <div className="whoop-strain-box">
          <div className="whoop-strain-header">
            <div>
              <div className="whoop-metric-label">CURRENT SOIL STRAIN</div>
              <div className="whoop-strain-score-row">
                <span className="whoop-strain-val">{strain}</span>
                <span className="whoop-strain-max">/ 21.0</span>
                <span className="whoop-strain-badge">{whoop.strainCategory}</span>
              </div>
            </div>
            <div className="whoop-target-pill">
              <span>Target: &lt; {whoop.targetStrainMax}</span>
            </div>
          </div>

          {/* Strain Progress Bar */}
          <div className="whoop-strain-bar-track">
            <div
              className="whoop-strain-bar-fill"
              style={{
                width: `${strainPercent}%`,
                background: strain >= 18 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' :
                  strain >= 14 ? 'linear-gradient(90deg, #00c9b1, #f97316)' :
                  'linear-gradient(90deg, #00c9b1, #22c55e)'
              }}
            />
          </div>
          <div className="whoop-strain-scale">
            <span>0.0 Light</span>
            <span>10.0 Moderate</span>
            <span>14.0 High</span>
            <span>18.0 All-Out</span>
            <span>21.0</span>
          </div>

          {/* Daily Irrigation Recovery Window */}
          <div className="whoop-coach-strip">
            <div className="whoop-coach-icon">
              <Clock size={16} />
            </div>
            <div className="whoop-coach-text">
              <div className="whoop-coach-title">
                Optimal Irrigation Window: <strong>{whoop.irrigationWindow?.optimalTime}</strong>
              </div>
              <div className="whoop-coach-desc">
                {whoop.irrigationWindow?.actionToday}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip: WHOOP Soil Health Vitals */}
      <div className="whoop-vitals-grid">
        <div className="whoop-vital-item">
          <div className="whoop-vital-top">
            <span className="whoop-vital-name">Osmotic Suction Pressure</span>
            <Droplets size={14} className="whoop-vital-icon blue" />
          </div>
          <div className="whoop-vital-value">
            {whoop.vitals?.osmoticPressure} <span className="whoop-vital-unit">atm</span>
          </div>
          <div className="whoop-vital-status">{whoop.vitals?.osmoticStatus}</div>
        </div>

        <div className="whoop-vital-item">
          <div className="whoop-vital-top">
            <span className="whoop-vital-name">Capillary Salt Flux</span>
            <Activity size={14} className="whoop-vital-icon amber" />
          </div>
          <div className="whoop-vital-value">
            {whoop.vitals?.capillaryFlux} <span className="whoop-vital-unit">mm/day</span>
          </div>
          <div className="whoop-vital-status">{whoop.vitals?.capillaryStatus}</div>
        </div>

        <div className="whoop-vital-item">
          <div className="whoop-vital-top">
            <span className="whoop-vital-name">Leaching Requirement</span>
            <Zap size={14} className="whoop-vital-icon teal" />
          </div>
          <div className="whoop-vital-value">
            +{whoop.vitals?.leachingRequirement}% <span className="whoop-vital-unit">flush water</span>
          </div>
          <div className="whoop-vital-status">To maintain root-zone balance</div>
        </div>

        <div className="whoop-vital-item">
          <div className="whoop-vital-top">
            <span className="whoop-vital-name">Groundwater Salinity</span>
            <ShieldAlert size={14} className="whoop-vital-icon red" />
          </div>
          <div className="whoop-vital-value">
            {farm.groundwaterEC} <span className="whoop-vital-unit">dS/m</span>
          </div>
          <div className="whoop-vital-status">
            Threshold for {farm.cropType}: {farm.cropType === 'barley' ? '8.0' : farm.cropType === 'cotton' ? '7.7' : farm.cropType === 'wheat' ? '6.0' : '2.0'} dS/m
          </div>
        </div>
      </div>
    </div>
  );
}
