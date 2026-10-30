import { useState, useEffect } from 'react';
import {
  AlertTriangle, Droplets,
  Activity, Zap, TrendingUp, Cpu, MapPin,
  CloudRain, Sun, Printer, Shield, User, Info,
  Volume2, VolumeX, CheckCircle, ArrowRight, Sprout
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import RiskGauge from '../components/ui/RiskGauge';
import MetricCard from '../components/ui/MetricCard';
import FieldCard from '../components/ui/FieldCard';
import ECTrendChart from '../components/charts/ECTrendChart';
import SoilHealthCard from '../components/soil/SoilHealthCard';
import { getApiUrl } from '../utils/api';
import './Dashboard.css';
export default function Dashboard() {
  const { state, activeFarm, openPinDropModal, openLoginModal, role, t } = useApp();
  const { fields, summaryStats } = state;
  const navigate = useNavigate();
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [speaking, setSpeaking] = useState(false);
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
  const handleToggleSpeech = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio is not supported in this browser.');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  return (
    <div className="page-container fade-in">
      <div className={`portal-banner ${role === 'farmer' ? 'farmer-mode' : 'panchayat-mode'}`}>
        <div className="portal-banner-content">
          <div className="portal-mode-badge">
            {role === 'farmer' ? <User size={14} /> : <Shield size={14} />}
            <span>{role === 'farmer' ? 'Individual Farmer View' : 'Panchayat Officer View'}</span>
          </div>
          <h2>
            {role === 'farmer'
              ? (activeFarm ? `My Farm: ${activeFarm.name} · ${activeFarm.farmerName || 'Farmer'} (${activeFarm.area} Acres, ${activeFarm.cropType})` : 'Farmer Soil Health Portal')
              : 'Panchayat Soil Portal: Village-wide root zone salinity tracking'}
          </h2>
          <p>
            {role === 'farmer'
              ? `Displaying verified sensor and root-zone salinity data exclusively for your ${activeFarm?.cropType || 'wheat'} field at ${activeFarm?.location || 'your plot'}.`
              : 'Community-level salinity diagnostic, plume tracking, and cross-plot reclamation across village.'}
          </p>
        </div>
        <div className="portal-banner-actions">
          {role === 'farmer' && activeFarm && (
            <button className="portal-action-btn" onClick={handlePrint} title="Print Advisory Sheet for Farmer">
              <Printer size={15} />
              <span>Print Advisory</span>
            </button>
          )}
          <button className="portal-action-btn outline" onClick={openLoginModal} title="Switch User / Login Portal">
            <User size={15} />
            <span>Switch Role / User</span>
          </button>
        </div>
      </div>
      {weatherForecast && (
        <div className="card weather-forecast-card fade-in">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="weather-forecast-title">
              <CloudRain size={20} className="text-primary" />
              <span>7-Day Tubewell & Salinity Leaching Forecast</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="chip"><MapPin size={12} /> {weatherForecast.location}</span>
              <button
                className={`icon-btn speech-btn ${speaking ? 'active-speaking' : ''}`}
                onClick={() => handleToggleSpeech(weatherForecast.audioScript || weatherForecast.simpleReason || weatherForecast.leachingAdvice)}
                title={speaking ? 'Stop Voice Reading' : 'Listen to Audio Advisory (Voice Readout)'}
              >
                {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span className="speech-btn-label">{speaking ? 'Stop Audio' : 'Listen Aloud'}</span>
              </button>
            </div>
          </div>
          <div
            className={`leaching-advice-banner ${weatherForecast.directiveIcon === 'stop' ? 'banner-alert' : 'banner-safe'}`}
          >
            <div className="advice-icon-wrap" style={{ color: weatherForecast.directiveIcon === 'stop' ? 'var(--color-critical)' : 'var(--color-safe)' }}>
              {weatherForecast.directiveIcon === 'stop' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
            </div>
            <div className="advice-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    color: weatherForecast.directiveIcon === 'stop' ? 'var(--color-critical)' : 'var(--color-safe)',
                    textTransform: 'uppercase'
                  }}
                >
                  {weatherForecast.simpleDirective || 'Today\'s Tubewell Decision'}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {weatherForecast.simpleReason || weatherForecast.leachingAdvice}
              </p>
            </div>
          </div>
          <div className="forecast-days-strip">
            {weatherForecast.forecast.map((d, i) => (
              <div key={i} className={`forecast-day-item ${d.willRain ? 'rain-expected' : ''}`}>
                <span className="fday-name">{d.day}</span>
                <span className="fday-date">{d.date}</span>
                <div className="fday-icon">
                  {d.willRain ? <CloudRain size={22} style={{ color: '#0284c7' }} /> : <Sun size={22} style={{ color: '#d97706' }} />}
                </div>
                <span className="fday-temp">{d.tempMax}° / {d.tempMin}°</span>
                <span className={`fday-rain ${d.rainMm > 0 ? 'has-rain' : ''}`}>
                  {d.rainMm > 0 ? `${d.rainMm} mm` : '0 mm'}
                </span>
                <span
                  className="fday-action-tag"
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 6px',
                    borderRadius: '4px',
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    background: d.actionType === 'stop' ? 'var(--color-critical-bg)' : d.actionType === 'flush' ? 'rgba(56,189,248,0.12)' : 'var(--color-safe-bg)',
                    color: d.actionType === 'stop' ? 'var(--color-critical)' : d.actionType === 'flush' ? '#0284c7' : 'var(--color-safe)',
                    border: `1px solid ${d.actionType === 'stop' ? 'rgba(220,38,38,0.25)' : d.actionType === 'flush' ? 'rgba(56,189,248,0.25)' : 'rgba(22,163,74,0.25)'}`
                  }}
                >
                  {d.actionBadge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeFarm && (
        <SoilHealthCard farm={activeFarm} onOpenPinDrop={openPinDropModal} />
      )}
      {role === 'farmer' && activeFarm && (
        <div className="farmer-characteristics-section fade-in">
          <div className="section-header">
            <div className="section-title">
              <div className="section-title-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                <Sprout size={18} />
              </div>
              What Must I Do on My Field Today?
            </div>
            <span className="chip">Target: {activeFarm.cropType}</span>
          </div>
          <div className="farmer-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div className="card farmer-action-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="step-number" style={{ background: '#22c55e', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>1</span>
                <strong style={{ fontSize: '0.95rem' }}>Agricultural Gypsum</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {(activeFarm.groundwaterEC || 0) > 4
                  ? `Spread 1.5 to 2.0 tons per acre of powdered Gypsum before the next watering to break soil sodium crust.`
                  : `Normal calcium balance. No heavy gypsum needed right now; maintain organic compost.`}
              </p>
              <button
                className="btn-link"
                style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => navigate('/recommendations')}
              >
                <span>View Full Treatment Guide</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="card farmer-action-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="step-number" style={{ background: '#38bdf8', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>2</span>
                <strong style={{ fontSize: '0.95rem' }}>Watering Rule</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {(activeFarm.waterTableDepth || 3) < 2
                  ? `Water table is only ${activeFarm.waterTableDepth}m deep! Do NOT flood irrigate. Water only in shallow furrows strictly between 5:00 AM - 8:00 AM.`
                  : `Irrigate early morning to prevent evaporation. Avoid stagnant water puddles.`}
              </p>
              <button
                className="btn-link"
                style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => navigate('/analyze')}
              >
                <span>Check Water Leaching Needs</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="card farmer-action-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="step-number" style={{ background: '#f59e0b', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>3</span>
                <strong style={{ fontSize: '0.95rem' }}>Field Drainage</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Dig a shallow 2.5 to 3-foot ditch along the lowest edge of your {activeFarm.area} acre plot to let salty runoff drain out of the root zone.
              </p>
              <button
                className="btn-link"
                style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => navigate('/map')}
              >
                <span>View Plot on Satellite Map</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
      {role === 'panchayat' && (
        <>
          <div className="grid-4 fade-in-delay-1">
            <MetricCard
              title="Village Avg Risk Score"
              value={summaryStats.avgRiskScore}
              unit="/100"
              change="Village Average"
              changeType={summaryStats.avgRiskScore >= 60 ? 'up' : 'down'}
              icon={Activity}
              iconColor="#f97316"
              description="Across all registered village plots"
            />
            <MetricCard
              title="Village Avg Groundwater EC"
              value={summaryStats.avgEC}
              unit="dS/m"
              change="Tubewell Average"
              changeType="up"
              icon={Droplets}
              iconColor="#008a50"
              description="Safe threshold: 2.0 dS/m"
            />
            <MetricCard
              title="High Salinity Plots"
              value={summaryStats.criticalFields + summaryStats.highRiskFields}
              unit={`/${summaryStats.totalFields}`}
              change="Urgent Leaching Needed"
              changeType="up"
              icon={AlertTriangle}
              iconColor="#ef4444"
              description={`${summaryStats.criticalFields} Critical, ${summaryStats.highRiskFields} High Risk`}
            />
            <MetricCard
              title="Connected Telemetry Plots"
              value={summaryStats.connectedSensors}
              unit={`/${summaryStats.totalFields}`}
              change="Sensors Active"
              changeType="stable"
              icon={Cpu}
              iconColor="#22c55e"
              description="Real-time root-zone monitoring"
            />
          </div>
          <div className="dashboard-main-grid">
            <div className="dashboard-left">
              <div className="card fade-in-delay-2">
                <div className="card-header">
                  <span className="card-title">Village Salinity Overview</span>
                  <span className="chip"><MapPin size={11} /> {fields.length} Registered Plots</span>
                </div>
                <div className="risk-overview">
                  <div className="risk-gauge-wrap">
                    <RiskGauge score={summaryStats.avgRiskScore} size={200} />
                    <p className="risk-overview-desc">
                      Village average soil risk is <strong>{summaryStats.avgRiskScore >= 60 ? 'Elevated' : 'Moderate'}</strong> across {fields.length} monitored plots.
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
              <div className="card fade-in-delay-3">
                <div className="card-header">
                  <div className="section-title">
                    <div className="section-title-icon"><TrendingUp size={16} /></div>
                    Village Plots Salinity Trends
                  </div>
                  <div className="chip">
                    12-Month Trajectory
                  </div>
                </div>
                <ECTrendChart height={250} />
              </div>
            </div>
            <div className="dashboard-right">
              <div className="card fade-in-delay-2">
                <div className="card-header">
                  <div className="section-title">
                    <div className="section-title-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                      <Zap size={16} />
                    </div>
                    Plot Alerts
                  </div>
                  <span className="badge badge-critical">{fields.reduce((s, f) => s + (f.alerts?.length ?? 0), 0)}</span>
                </div>
                <div className="alerts-list">
                  {fields.filter(f => (f.alerts?.length ?? 0) > 0).length === 0 ? (
                    <div className="alerts-empty">No active salinity alerts across village plots.</div>
                  ) : (
                    fields.filter(f => (f.alerts?.length ?? 0) > 0).map(field =>
                      (field.alerts || []).map((alert, i) => (
                        <div key={`${field.id}-${i}`} className={`alert-row level-${(field.riskLevel || 'low').toLowerCase()}`}>
                          <div className="alert-dot" />
                          <div className="alert-content">
                            <div className="alert-title">{field.name} ({field.farmerName || 'Farmer'})</div>
                            <div className="alert-msg">{alert}</div>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="section-header">
            <div className="section-title">
              <div className="section-title-icon"><MapPin size={16} /></div>
              Registered Village Plots ({fields.length})
            </div>
            <button className="btn btn-primary btn-sm" onClick={openPinDropModal}>
              + Register New Plot
            </button>
          </div>
          <div className="grid-auto">
            {fields.map(field => (
              <FieldCard key={field.id} field={field} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}