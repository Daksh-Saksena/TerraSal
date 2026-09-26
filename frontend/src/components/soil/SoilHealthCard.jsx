import React from 'react';
import {
  Droplets, Layers, CloudRain, Zap, Gauge,
  AlertTriangle, CheckCircle2, Info, MapPin, User, Clock
} from 'lucide-react';
import './SoilHealthCard.css';

const CROP_LABELS = {
  wheat: 'Wheat', rice: 'Rice', cotton: 'Cotton', barley: 'Barley',
  mustard: 'Mustard', sugarcane: 'Sugarcane', chickpea: 'Chickpea',
  lentil: 'Lentil', sorghum: 'Jowar', sunflower: 'Sunflower',
  safflower: 'Safflower', 'sugar-beet': 'Sugar Beet',
};

// FAO/ICAR EC thresholds per crop (dS/m)
const CROP_EC_THRESHOLD = {
  wheat: 6.0, barley: 8.0, cotton: 7.7, safflower: 5.3,
  sorghum: 4.0, sunflower: 4.8, mustard: 5.0, rice: 3.0,
  sugarcane: 1.7, chickpea: 1.1, lentil: 1.5, 'sugar-beet': 7.0,
};

const scoreColor = (s) => s <= 3 ? '#22c55e' : s <= 6 ? '#f59e0b' : '#ef4444';
const riskColor  = (s) => s < 35 ? '#22c55e' : s < 60 ? '#f59e0b' : s < 80 ? '#f97316' : '#ef4444';
const riskLabel  = (s) =>
  s < 35 ? { text: 'Healthy',  short: 'Low Risk'      } :
  s < 60 ? { text: 'Caution',  short: 'Moderate Risk' } :
  s < 80 ? { text: 'Stressed', short: 'High Risk'     } :
           { text: 'Critical', short: 'Critical Risk'  };

const buildMetrics = (farm, vitals) => {
  const ec   = farm.groundwaterEC      ?? 0;
  const wt   = farm.waterTableDepth    ?? 0;
  const rain = farm.rainfallLast30Days ?? 0;
  const thr  = CROP_EC_THRESHOLD[farm.cropType] ?? 3.0;

  const ecScore    = Math.min(10, Math.round((ec / thr) * 5));
  const wtScore    = wt <= 0 ? 5 : Math.min(10, Math.round(Math.max(0, (4.5 - wt)) * 2.2));
  const rainScore  = rain >= 100 ? 0 : rain >= 60 ? 2 : rain >= 30 ? 4 : rain >= 15 ? 6 : rain >= 5 ? 8 : 10;
  const leachReq   = vitals?.leachingRequirement ?? 0;
  const leachScore = leachReq > 50 ? 9 : leachReq > 30 ? 7 : leachReq > 15 ? 5 : leachReq > 5 ? 3 : 1;
  const osmP       = vitals?.osmoticPressure ?? parseFloat((ec * 0.36).toFixed(2));
  const osmScore   = osmP > 3.5 ? 10 : osmP > 2.0 ? 7 : osmP > 1.0 ? 5 : osmP > 0.5 ? 3 : 1;

  const cropName = CROP_LABELS[farm.cropType] || farm.cropType;

  return [
    {
      key: 'ec', icon: Droplets, iconClass: 'metric-icon-blue',
      label: 'Salt in Water', score: ecScore,
      value: `${ec} dS/m`,
      safeValue: `Safe for ${cropName}: ${thr} dS/m`,
      barPct: Math.min(100, Math.round((ec / Math.max(ec, thr * 1.5)) * 100)),
      plain: ec > thr
        ? `Your well water is too salty for ${cropName} (${ec} vs safe limit ${thr} dS/m). Salt is entering the soil with every irrigation.`
        : `Well water salinity (${ec} dS/m) is within safe limits for ${cropName}.`,
    },
    {
      key: 'wt', icon: Layers, iconClass: 'metric-icon-teal',
      label: 'Water Table Depth', score: wtScore,
      value: `${wt} m`,
      safeValue: 'Ideal: deeper than 3 m',
      barPct: Math.min(100, Math.round(Math.max(0, (4.5 - wt) / 4.5) * 100)),
      plain: wt < 2.0
        ? `Underground water is only ${wt}m below the surface — very close. It is rising and pulling dissolved salts up into your root zone.`
        : wt < 3.0
        ? `Water table at ${wt}m is somewhat close. Some salt rise is possible during hot dry periods.`
        : `Water table is deep (${wt}m) — low risk of salts rising to the surface.`,
    },
    {
      key: 'rain', icon: CloudRain, iconClass: 'metric-icon-amber',
      label: 'Recent Rainfall', score: rainScore,
      value: `${rain} mm`,
      safeValue: 'Good leaching needs ≥ 40 mm/month',
      barPct: Math.min(100, Math.round((rain / 100) * 100)),
      plain: rain < 15
        ? `Very little rain this month (${rain}mm). Without rain to flush salts, they are building up in the root zone.`
        : rain < 40
        ? `Rainfall is below ideal (${rain}mm). Some natural flushing is happening but not enough to prevent build-up.`
        : `Good rainfall (${rain}mm) is washing salts deeper below the roots — a positive sign.`,
    },
    {
      key: 'leach', icon: Zap, iconClass: 'metric-icon-orange',
      label: 'Extra Flush Needed', score: leachScore,
      value: `+${leachReq}%`,
      safeValue: 'Extra water beyond crop dose to flush salts',
      barPct: Math.min(100, leachReq),
      plain: leachReq > 30
        ? `You need ${leachReq}% more water than the crop needs just to flush out salt. This is a high leaching requirement — a sign of heavy salt accumulation.`
        : leachReq > 10
        ? `Apply about ${leachReq}% extra water each irrigation to prevent salt from building up in the root zone.`
        : `Salt flush needed is low (${leachReq}%). Conditions are manageable with normal irrigation.`,
    },
    {
      key: 'osmotic', icon: Gauge, iconClass: 'metric-icon-red',
      label: 'Root Water Stress', score: osmScore,
      value: `${osmP.toFixed(2)} atm`,
      safeValue: 'Ideal: below 1.0 atm',
      barPct: Math.min(100, Math.round((osmP / 5.0) * 100)),
      plain: osmP > 2.5
        ? `Salt in the soil is creating very high resistance for roots (${osmP.toFixed(2)} atm). Plants cannot absorb water properly even when soil is wet.`
        : osmP > 1.0
        ? `Roots face moderate resistance from salt (${osmP.toFixed(2)} atm). Crop growth and yield are being reduced.`
        : `Roots are absorbing water normally — low osmotic resistance.`,
    },
  ];
};

const getTopAction = (farm, riskScore) => {
  const ec  = farm.groundwaterEC ?? 0;
  const wt  = farm.waterTableDepth ?? 0;
  const thr = CROP_EC_THRESHOLD[farm.cropType] ?? 3.0;
  const m   = farm.irrigationMethod;
  const cn  = CROP_LABELS[farm.cropType] || farm.cropType;

  if (riskScore >= 80) {
    return (m === 'flood' || m === 'canal')
      ? { urgency: 'urgent', text: `Stop flood irrigation immediately and switch to drip. Apply a heavy leaching flush (25–40% extra water over crop dose) before the next crop cycle to push salts down.` }
      : { urgency: 'urgent', text: `Apply emergency leaching irrigation (30–40% extra water over crop dose) to push salts below the root zone. Get soil EC tested at the nearest KVK right away.` };
  }
  if (riskScore >= 60) {
    if (ec > thr)
      return { urgency: 'high', text: `Your well water EC (${ec} dS/m) is above the safe limit for ${cn} (${thr} dS/m). Do a pre-sowing leaching irrigation and consider applying gypsum to the soil.` };
    if (wt < 2.0)
      return { urgency: 'high', text: `Water table is too shallow (${wt}m). Over-irrigating raises it further and pulls more salt to the surface. Reduce irrigation frequency and consider subsurface drainage.` };
    return { urgency: 'high', text: `Schedule a leaching irrigation before the next crop. Monitor soil EC monthly. Reduce irrigation volume by 20–25%.` };
  }
  if (riskScore >= 35)
    return { urgency: 'medium', text: `Conditions are manageable. Do a preventive leaching irrigation before sowing. Consider switching to drip irrigation to reduce long-term salt build-up.` };
  return { urgency: 'good', text: `Your field is healthy. Keep up current practices and do a routine soil EC test each season to catch any early changes.` };
};

export default function SoilHealthCard({ farm, onOpenPinDrop }) {
  if (!farm) return null;

  const riskScore = farm.riskScore ?? 50;
  const vitals    = farm.whoopMetrics?.vitals ?? null;
  const metrics   = buildMetrics(farm, vitals);
  const mainColor = riskColor(riskScore);
  const label     = riskLabel(riskScore);
  const action    = getTopAction(farm, riskScore);

  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (riskScore / 100) * circ;

  const URGENCY = {
    urgent: { border: 'rgba(239,68,68,0.35)', bg: 'rgba(239,68,68,0.08)', Icon: AlertTriangle, color: '#ef4444', label: 'Urgent Action'    },
    high:   { border: 'rgba(249,115,22,0.35)', bg: 'rgba(249,115,22,0.08)', Icon: AlertTriangle, color: '#f97316', label: 'Action Required' },
    medium: { border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)', Icon: Info,          color: '#f59e0b', label: 'Recommended'     },
    good:   { border: 'rgba(34,197,94,0.35)',  bg: 'rgba(34,197,94,0.08)',  Icon: CheckCircle2,  color: '#22c55e', label: 'All Clear'       },
  };
  const us         = URGENCY[action.urgency];
  const ActionIcon = us.Icon;
  const badMetrics = metrics.filter(m => m.score >= 6);

  return (
    <div className="shc-card fade-in">
      <div className="shc-accent-bar" style={{ background: `linear-gradient(90deg, ${mainColor}, ${mainColor}44)` }} />

      {/* Header */}
      <div className="shc-header">
        <div className="shc-identity">
          <div className="shc-live-dot" style={{ background: mainColor }} />
          <div>
            <div className="shc-farm-name">{farm.name}</div>
            <div className="shc-meta">
              <span className="shc-meta-item"><User size={12} /> {farm.farmerName || 'Village Farmer'}</span>
              <span className="shc-dot">·</span>
              <span className="shc-meta-item"><MapPin size={12} /> {farm.location}</span>
              <span className="shc-dot">·</span>
              <span className="shc-crop-pill">
                {CROP_LABELS[farm.cropType] || farm.cropType} · {farm.area} ac
              </span>
            </div>
          </div>
        </div>
        <button className="shc-new-btn" onClick={onOpenPinDrop}>
          <MapPin size={13} /><span>New Farm</span>
        </button>
      </div>

      {/* Body: score ring + metric tiles */}
      <div className="shc-body">
        <div className="shc-score-panel">
          <div className="shc-ring-wrap">
            <svg width="130" height="130" className="shc-ring-svg">
              <circle className="shc-ring-track" cx="65" cy="65" r={radius} strokeWidth="11" />
              <circle
                className="shc-ring-fill"
                cx="65" cy="65" r={radius}
                strokeWidth="11"
                stroke={mainColor}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ filter: `drop-shadow(0 0 10px ${mainColor}88)` }}
              />
            </svg>
            <div className="shc-ring-inner">
              <span className="shc-score-num" style={{ color: mainColor }}>{riskScore}</span>
              <span className="shc-score-sub">/ 100</span>
            </div>
          </div>
          <div className="shc-score-label" style={{ color: mainColor }}>{label.text}</div>
          <div className="shc-score-risk">Risk Score · {label.short}</div>
          <div className="shc-irr-tip">
            <Clock size={12} />
            <span>Irrigate 5–8 AM to cut evaporation and salt crusting</span>
          </div>
        </div>

        <div className="shc-metrics-grid">
          {metrics.map(m => {
            const Icon   = m.icon;
            const mColor = scoreColor(m.score);
            return (
              <div key={m.key} className="shc-metric-tile">
                <div className="shc-metric-top">
                  <div className="shc-metric-label-group">
                    <Icon size={14} className={`shc-metric-icon ${m.iconClass}`} />
                    <span className="shc-metric-label">{m.label}</span>
                  </div>
                  <span className="shc-metric-score" style={{ color: mColor }}>{m.score}/10</span>
                </div>
                <div className="shc-metric-value">{m.value}</div>
                <div className="shc-metric-bar-track">
                  <div className="shc-metric-bar-fill" style={{ width: `${m.barPct}%`, background: mColor }} />
                </div>
                <div className="shc-metric-safe">{m.safeValue}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plain-English summary + recommended action */}
      <div className="shc-summary-row">
        <div className="shc-summary-left">
          <div className="shc-summary-title">What's happening in your field?</div>
          <div className="shc-summary-text">
            {badMetrics.length > 0
              ? badMetrics.map(m => m.plain).join(' ')
              : 'All readings are within safe limits. Your field is in good health.'}
          </div>
        </div>
        <div className="shc-action-box" style={{ borderColor: us.border, background: us.bg }}>
          <div className="shc-action-header" style={{ color: us.color }}>
            <ActionIcon size={14} />
            <span>{us.label}</span>
          </div>
          <div className="shc-action-text">{action.text}</div>
        </div>
      </div>
    </div>
  );
}
