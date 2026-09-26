import React from 'react';
import {
  AlertTriangle, Droplets, ArrowDownUp, CloudRain,
  Activity, Zap, TrendingUp, Cpu, MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import RiskGauge from '../components/ui/RiskGauge';
import MetricCard from '../components/ui/MetricCard';
import FieldCard from '../components/ui/FieldCard';
import ECTrendChart from '../components/charts/ECTrendChart';
import SoilHealthCard from '../components/soil/SoilHealthCard';
import './Dashboard.css';

export default function Dashboard() {
  const { state, activeFarm, openPinDropModal } = useApp();
  const { fields, summaryStats } = state;

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Salinity Command Center</h1>
        <p>Panchayat Village Kiosk — Real-time salinity & soil health monitoring across village fields</p>
      </div>

      {/* Active Farm Soil Health Card */}
      {activeFarm && (
        <SoilHealthCard farm={activeFarm} onOpenPinDrop={openPinDropModal} />
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
          title="Sensors Online"
          value={summaryStats.connectedSensors}
          unit={`/${summaryStats.totalFields}`}
          change="1 offline"
          changeType="stable"
          icon={Cpu}
          iconColor="#22c55e"
          description="Live data streaming"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">

        {/* Left: Risk Overview + Chart */}
        <div className="dashboard-left">

          {/* Regional Risk Summary */}
          <div className="card fade-in-delay-2">
            <div className="card-header">
              <span className="card-title">Overall Platform Risk</span>
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
                EC Trend — Last 24 Months
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

          {/* Priority Actions — derived from real field data */}
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
                      ? `Apply emergency leaching irrigation and get soil EC tested at KVK — ${field.name}`
                      : field.riskLevel === 'HIGH'
                      ? `Schedule pre-sowing leaching irrigation before next crop cycle at ${field.name}`
                      : `Monitor soil EC monthly and apply preventive leaching at ${field.name}`;
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
                <div className="alerts-empty">All fields are at low risk — no urgent actions needed.</div>
              )}
            </div>
          </div>

          {/* Live Readings — worst field from real data */}
          {(() => {
            const worst = fields.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0];
            if (!worst) return null;
            const readings = [
              { label: 'EC', value: worst.groundwaterEC ?? worst.metrics?.ec ?? '—', unit: 'dS/m', color: (worst.groundwaterEC || 0) > 4 ? '#ef4444' : '#f59e0b' },
              { label: 'Water Table', value: worst.waterTableDepth ?? worst.metrics?.waterTable ?? '—', unit: 'm', color: (worst.waterTableDepth || 3) < 2 ? '#ef4444' : '#f59e0b' },
              { label: 'Rainfall 30d', value: worst.rainfallLast30Days ?? worst.metrics?.rainfall ?? '—', unit: 'mm', color: '#008a50' },
              { label: 'Risk Score', value: worst.riskScore ?? '—', unit: '/100', color: worst.riskLevel === 'CRITICAL' ? '#ef4444' : '#f97316' },
            ];
            return (
              <div className="card card-sm fade-in-delay-4">
                <div className="card-header">
                  <span className="card-title">Live Readings — {worst.name}</span>
                  <span className="live-dot" />
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
