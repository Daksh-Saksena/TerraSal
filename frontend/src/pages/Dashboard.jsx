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
import './Dashboard.css';

export default function Dashboard() {
  const { state } = useApp();
  const { fields, summaryStats } = state;

  const criticalAlerts = fields.flatMap(f =>
    f.alerts.map(a => ({ ...a, fieldName: f.name, level: f.riskLevel, fieldId: f.id }))
  ).filter((_, i) => i < 5);

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Salinity Command Center</h1>
        <p>Real-time monitoring across 6 fields in Punjab, Haryana & Rajasthan</p>
      </div>

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
          iconColor="#00c9b1"
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
              <span className="badge badge-critical">{fields.reduce((s, f) => s + f.alerts.length, 0)}</span>
            </div>
            <div className="alerts-list">
              {fields.filter(f => f.alerts.length > 0).map(field =>
                field.alerts.map((alert, i) => (
                  <div key={`${field.id}-${i}`} className={`alert-row level-${field.riskLevel.toLowerCase()}`}>
                    <div className={`alert-level-dot ${field.riskLevel.toLowerCase()}`} />
                    <div className="alert-content">
                      <div className="alert-msg">{alert}</div>
                      <div className="alert-field">{field.name} · {field.location}</div>
                    </div>
                    <span className={`badge badge-${field.riskLevel.toLowerCase()}`}>{field.riskLevel}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="card fade-in-delay-3">
            <div className="card-header">
              <div className="section-title">
                <div className="section-title-icon"><Activity size={16} /></div>
                Priority Actions
              </div>
            </div>
            <div className="quick-rec-list">
              {[
                { priority: 'URGENT', action: 'Switch Sri Ganganagar from flood to drip irrigation', field: 'Ganganagar South Block', color: '#ef4444' },
                { priority: 'HIGH', action: 'Apply leaching irrigation at Ludhiana North Block before next sowing', field: 'Ludhiana North Block', color: '#f97316' },
                { priority: 'HIGH', action: 'Install subsurface drainage in Sirsa district fields', field: 'Sirsa Central', color: '#f97316' },
                { priority: 'MEDIUM', action: 'Collect soil samples for EC & SAR testing — Bathinda', field: 'Bathinda Pilot Project', color: '#f59e0b' },
              ].map((rec, i) => (
                <div key={i} className="quick-rec-item">
                  <span className="rec-priority" style={{ color: rec.color, borderColor: `${rec.color}40`, background: `${rec.color}15` }}>
                    {rec.priority}
                  </span>
                  <div className="rec-content">
                    <div className="rec-action">{rec.action}</div>
                    <div className="rec-field">{rec.field}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Metrics Strip */}
          <div className="card card-sm fade-in-delay-4">
            <div className="card-header">
              <span className="card-title">Live Readings — Ganganagar (Critical)</span>
              <span className="live-dot" />
            </div>
            <div className="live-metrics-strip">
              {[
                { label: 'EC', value: '6.8', unit: 'dS/m', color: '#ef4444' },
                { label: 'Water Table', value: '1.2', unit: 'm', color: '#ef4444' },
                { label: 'Soil Temp', value: '28.4', unit: '°C', color: '#f59e0b' },
                { label: 'Humidity', value: '52', unit: '%', color: '#00c9b1' },
              ].map((m, i) => (
                <div key={i} className="live-metric-item">
                  <div className="live-metric-val" style={{ color: m.color }}>{m.value}</div>
                  <div className="live-metric-unit">{m.unit}</div>
                  <div className="live-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
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
