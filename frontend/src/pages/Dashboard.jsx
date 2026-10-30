import { useState, useEffect } from 'react';
import {
  AlertTriangle, Droplets,
  Activity, Zap, TrendingUp, Cpu, MapPin,
  CloudRain, Sun, Printer, Shield, User, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import RiskGauge from '../components/ui/RiskGauge';
import MetricCard from '../components/ui/MetricCard';
import FieldCard from '../components/ui/FieldCard';
import ECTrendChart from '../components/charts/ECTrendChart';
import SoilHealthCard from '../components/soil/SoilHealthCard';
import { getApiUrl } from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const { state, activeFarm, openPinDropModal, role, t } = useApp();
  const { fields, summaryStats } = state;
  const [weatherForecast, setWeatherForecast] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchForecast = async () => {
      try {
        const lat = activeFarm?.lat || 30.9;
        const lon = activeFarm?.lng || 75.85;
        const res = await fetch(getApiUrl(`/api/weather/forecast?lat=${lat}&lon=${lon}`));
        if (res.ok && active) {
          const data = await res.json();
          setWeatherForecast(data);
        }
      } catch (err) {
        console.warn('Forecast fetch notice:', err);
      }
    };
    fetchForecast();
    return () => { active = false; };
  }, [activeFarm]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container fade-in">
      {/* Mode Banner */}
      <div className={`portal-banner ${role === 'farmer' ? 'farmer-mode' : 'panchayat-mode'}`}>
        <div className="portal-banner-content">
          <div className="portal-mode-badge">
            {role === 'farmer' ? <User size={14} /> : <Shield size={14} />}
            <span>{role === 'farmer' ? t('roleFarmer') : t('rolePanchayat')}</span>
          </div>
          <h2>
            {role === 'farmer'
              ? (activeFarm ? `Plot: ${activeFarm.name} · ${activeFarm.farmerName || 'Farmer'} (${activeFarm.area} ${t('acres')})` : t('farmerPortal'))
              : t('panchayatPortal')}
          </h2>
          <p>
            {role === 'farmer'
              ? `Real-time root-zone salinity and soil recovery guidance for your ${activeFarm?.cropType || 'crop'} plot.`
              : 'Community-level salinity diagnostic, plume tracking, and cross-plot reclamation across village.'}
          </p>
        </div>
        <div className="portal-banner-actions">
          {role === 'farmer' && activeFarm && (
            <button className="portal-action-btn" onClick={handlePrint} title="Print Advisory Sheet for Kisan">
              <Printer size={15} />
              <span>{t('printReport')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Farm Soil Health Card */}
      {activeFarm && (
        <SoilHealthCard farm={activeFarm} onOpenPinDrop={openPinDropModal} />
      )}

      {/* 7-Day Weather & Salinity Leaching Forecast Widget */}
      {weatherForecast && (
        <div className="card weather-forecast-card fade-in">
          <div className="card-header">
            <div className="weather-forecast-title">
              <CloudRain size={18} className="text-primary" />
              <span>{t('weatherForecast')}</span>
            </div>
            <span className="chip">{weatherForecast.location}</span>
          </div>

          {/* Smart Leaching Advice Callout */}
          <div className={`leaching-advice-banner ${weatherForecast.adviceType}`}>
            <Info size={18} className="advice-icon" />
            <div className="advice-text">
              <strong>Agro-Climatic Irrigation & Leaching Advice:</strong>
              <p>{weatherForecast.leachingAdvice}</p>
            </div>
          </div>

          {/* 7-Day Strip */}
          <div className="forecast-days-strip">
            {weatherForecast.forecast.map((d, i) => (
              <div key={i} className={`forecast-day-item ${d.willRain ? 'rain-expected' : ''}`}>
                <span className="fday-name">{d.day}</span>
                <span className="fday-date">{d.date}</span>
                <div className="fday-icon">
                  {d.willRain ? <CloudRain size={20} className="text-primary" /> : <Sun size={20} className="text-secondary" />}
                </div>
                <span className="fday-temp">{d.tempMax}° / {d.tempMin}°</span>
                <span className={`fday-rain ${d.rainMm > 0 ? 'has-rain' : ''}`}>
                  {d.rainMm > 0 ? `${d.rainMm} mm` : '0 mm'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top KPI Row */}
      <div className="grid-4 fade-in-delay-1">
        <MetricCard
          title="Avg Risk Score"
          value={summaryStats.avgRiskScore}
          unit="/100"
          change="+8 vs last month"
          changeType="up"
          icon={Activity}
          iconColor="#f97316"
          description="Across all monitored fields"
        />
        <MetricCard
          title="Avg Groundwater EC"
          value={summaryStats.avgEC}
          unit="dS/m"
          change="+14% YoY"
          changeType="up"
          icon={Droplets}
          iconColor="#008a50"
          description="Safe threshold: 2.0 dS/m"
        />
        <MetricCard
          title="Critical Fields"
          value={summaryStats.criticalFields + summaryStats.highRiskFields}
          unit={`/${summaryStats.totalFields}`}
          change="Action needed"
          changeType="up"
          icon={AlertTriangle}
          iconColor="#ef4444"
          description={`${summaryStats.criticalFields} critical, ${summaryStats.highRiskFields} high risk`}
        />
        <MetricCard
          title="Monitored Plots"
          value={summaryStats.connectedSensors}
          unit={`/${summaryStats.totalFields}`}
          change="Telemetry active"
          changeType="stable"
          icon={Cpu}
          iconColor="#22c55e"
          description="In-situ sensor telemetry"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">

        {/* Left: Risk Overview + Chart */}
        <div className="dashboard-left">

          {/* Regional Risk Summary */}
          <div className="card fade-in-delay-2">
            <div className="card-header">
              <span className="card-title">Regional Salinity Summary</span>
              <span className="chip"><MapPin size={11} /> 3 states · 6 fields</span>
            </div>
            <div className="risk-overview">
              <div className="risk-gauge-wrap">
                <RiskGauge score={summaryStats.avgRiskScore} size={200} />
                <p className="risk-overview-desc">
                  Platform risk is <strong style={{ color: '#f97316' }}>elevated</strong> due to
                  critical conditions in Sri Ganganagar and rising EC trends in Ludhiana.
                </p>
              </div>
              <div className="risk-breakdown">
                <div className="risk-breakdown-item">
                  <div className="risk-bd-dot critical" />
                  <div>
                    <div className="risk-bd-val">{summaryStats.criticalFields}</div>
                    <div className="risk-bd-label">Critical</div>
                  </div>
                </div>
                <div className="risk-breakdown-item">
                  <div className="risk-bd-dot high" />
                  <div>
                    <div className="risk-bd-val">{summaryStats.highRiskFields}</div>
                    <div className="risk-bd-label">High</div>
                  </div>
                </div>
                <div className="risk-breakdown-item">
                  <div className="risk-bd-dot moderate" />
                  <div>
                    <div className="risk-bd-val">{summaryStats.moderateFields}</div>
                    <div className="risk-bd-label">Moderate</div>
                  </div>
                </div>
                <div className="risk-breakdown-item">
                  <div className="risk-bd-dot low" />
                  <div>
                    <div className="risk-bd-val">{summaryStats.lowRiskFields}</div>
                    <div className="risk-bd-label">Low</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EC Trend Chart */}
          <div className="card fade-in-delay-3">
            <div className="card-header">
              <div className="section-title">
                <div className="section-title-icon"><TrendingUp size={16} /></div>
                EC Trend (Last 24 Months)
              </div>
              <div className="chip">
                <span style={{ color: '#ef4444' }}>↑</span> Worsening
              </div>
            </div>
            <ECTrendChart height={250} />
          </div>
        </div>

        {/* Right: Alerts + Quick Stats */}
        <div className="dashboard-right">

          {/* Active Alerts */}
          <div className="card fade-in-delay-2">
            <div className="card-header">
              <div className="section-title">
                <div className="section-title-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  <Zap size={16} />
                </div>
                Active Alerts
              </div>
              <span className="badge badge-critical">{fields.reduce((s, f) => s + (f.alerts?.length ?? 0), 0)}</span>
            </div>
            <div className="alerts-list">
              {fields.filter(f => (f.alerts?.length ?? 0) > 0).length === 0 ? (
                <div className="alerts-empty">No active alerts across monitored fields.</div>
              ) : (
                fields.filter(f => (f.alerts?.length ?? 0) > 0).map(field =>
                  (field.alerts || []).map((alert, i) => (
                    <div key={`${field.id}-${i}`} className={`alert-row level-${(field.riskLevel || 'low').toLowerCase()}`}>
                      <div className={`alert-level-dot ${(field.riskLevel || 'low').toLowerCase()}`} />
                      <div className="alert-content">
                        <div className="alert-msg">{alert}</div>
                        <div className="alert-field">{field.name} · {field.location}</div>
                      </div>
                      <span className={`badge badge-${(field.riskLevel || 'low').toLowerCase()}`}>{field.riskLevel || 'LOW'}</span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Priority Actions */}
          <div className="card fade-in-delay-3">
            <div className="card-header">
              <div className="section-title">
                <div className="section-title-icon"><Activity size={16} /></div>
                Priority Actions
              </div>
            </div>
            <div className="quick-rec-list">
              {fields
                .filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'HIGH' || f.riskLevel === 'MODERATE')
                .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
                .slice(0, 4)
                .map(field => {
                  const color = field.riskLevel === 'CRITICAL' ? '#ef4444' : field.riskLevel === 'HIGH' ? '#f97316' : '#f59e0b';
                  const action =
                    field.riskLevel === 'CRITICAL' && (field.irrigationMethod === 'flood' || field.irrigationMethod === 'canal')
                      ? `Switch ${field.name} from ${field.irrigationMethod} to drip irrigation immediately and apply leaching flush`
                      : field.riskLevel === 'CRITICAL'
                      ? `Apply emergency leaching irrigation and get soil EC tested at KVK: ${field.name}`
                      : field.riskLevel === 'HIGH'
                      ? `Schedule pre-sowing leaching irrigation and reduce volume by 20% to 25% at ${field.name}`
                      : `Sensor telemetry active: apply preventive leaching flush at ${field.name}`;
                  return (
                    <div key={field.id} className="quick-rec-item">
                      <span className="rec-priority" style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
                        {field.riskLevel}
                      </span>
                      <div className="rec-content">
                        <div className="rec-action">{action}</div>
                        <div className="rec-field">{field.name} · {field.location}</div>
                      </div>
                    </div>
                  );
                })}
              {fields.filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'HIGH' || f.riskLevel === 'MODERATE').length === 0 && (
                <div className="alerts-empty">All fields are at low risk: no urgent actions needed.</div>
              )}
            </div>
          </div>

          {/* Live Readings */}
          {(() => {
            const worst = fields.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0];
            if (!worst) return null;
            const readings = [
              { label: 'EC', value: worst.groundwaterEC ?? worst.metrics?.ec ?? '-', unit: 'dS/m', color: (worst.groundwaterEC || 0) > 4 ? '#ef4444' : '#f59e0b' },
              { label: 'Water Table', value: worst.waterTableDepth ?? worst.metrics?.waterTable ?? '-', unit: 'm', color: (worst.waterTableDepth || 3) < 2 ? '#ef4444' : '#f59e0b' },
              { label: 'Rainfall 30d', value: worst.rainfallLast30Days ?? worst.metrics?.rainfall ?? '-', unit: 'mm', color: '#008a50' },
              { label: 'Risk Score', value: worst.riskScore ?? '-', unit: '/100', color: worst.riskLevel === 'CRITICAL' ? '#ef4444' : '#f97316' },
            ];
            return (
              <div className="card card-sm fade-in-delay-4">
                <div className="card-header">
                  <span className="card-title">Field Metrics: {worst.name}</span>
                  <span className="chip">{worst.location}</span>
                </div>
                <div className="live-metrics-strip">
                  {readings.map((m, i) => (
                    <div key={i} className="live-metric-item">
                      <div className="live-metric-val" style={{ color: m.color }}>{m.value}</div>
                      <div className="live-metric-unit">{m.unit}</div>
                      <div className="live-metric-label">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Field Cards Grid */}
      <div className="section-header">
        <div className="section-title">
          <div className="section-title-icon"><MapPin size={16} /></div>
          Monitored Fields
        </div>
        <span className="chip">{fields.length} fields</span>
      </div>
      <div className="grid-auto">
        {fields.map(field => (
          <FieldCard key={field.id} field={field} />
        ))}
      </div>
    </div>
  );
}
