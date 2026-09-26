import React, { useState } from 'react';
import {
  FlaskConical, ChevronRight, AlertTriangle, CheckCircle,
  Info, Droplets, ArrowDownUp, CloudRain, Layers, Waves,
  Sprout, Lightbulb, RefreshCw, MapPin, Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';

import RiskGauge from '../components/ui/RiskGauge';
import RiskBadge from '../components/ui/RiskBadge';
import FactorBreakdownChart from '../components/charts/FactorBreakdownChart';
import {
  SOIL_TYPES, CROP_TYPES, IRRIGATION_METHODS,
  DRAINAGE_QUALITIES, TERRAIN_TYPES
} from '../utils/constants';
import './Analyzer.css';

const DEFAULT_INPUTS = {
  groundwaterEC: 3.5,
  waterTableDepth: 2.5,
  soilType: 'loamy',
  drainageQuality: 'moderate',
  rainfallLast30Days: 15,
  irrigationMethod: 'flood',
  cropType: 'wheat',
  terrain: 'flat',
};

const PRESETS = [
  { name: 'Punjab Wheat Farm', inputs: { groundwaterEC: 4.2, waterTableDepth: 1.8, soilType: 'loamy', drainageQuality: 'poor', rainfallLast30Days: 12, irrigationMethod: 'flood', cropType: 'wheat', terrain: 'flat' } },
  { name: 'Rajasthan Cotton', inputs: { groundwaterEC: 6.8, waterTableDepth: 1.2, soilType: 'clay', drainageQuality: 'very-poor', rainfallLast30Days: 3, irrigationMethod: 'canal', cropType: 'cotton', terrain: 'flat' } },
  { name: 'Haryana Drip Farm', inputs: { groundwaterEC: 2.8, waterTableDepth: 3.1, soilType: 'sandy-loam', drainageQuality: 'moderate', rainfallLast30Days: 8, irrigationMethod: 'drip', cropType: 'cotton', terrain: 'gentle-slope' } },
  { name: 'Low Risk Amritsar', inputs: { groundwaterEC: 1.4, waterTableDepth: 4.5, soilType: 'sandy', drainageQuality: 'good', rainfallLast30Days: 45, irrigationMethod: 'sprinkler', cropType: 'rice', terrain: 'gentle-slope' } },
];

export default function Analyzer() {
  const { state, activeFarm, openPinDropModal, setAnalyzerResult } = useApp();
  const [inputs, setInputs] = useState(state.analyzerInputs ?? DEFAULT_INPUTS);
  const [result, setResult] = useState(state.analyzerResult ?? null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('whoop');

  const loadActiveFarm = () => {
    if (!activeFarm) return;
    setInputs({
      groundwaterEC: activeFarm.groundwaterEC ?? 3.5,
      waterTableDepth: activeFarm.waterTableDepth ?? 2.5,
      soilType: activeFarm.soilType ?? 'loamy',
      drainageQuality: activeFarm.drainageQuality ?? 'moderate',
      rainfallLast30Days: activeFarm.rainfallLast30Days ?? 15,
      irrigationMethod: activeFarm.irrigationMethod ?? 'flood',
      cropType: activeFarm.cropType ?? 'wheat',
      terrain: 'flat',
    });
    setResult(null);
  };

  const handleChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      const analysisResult = await response.json();
      setResult(analysisResult);
      setAnalyzerResult(analysisResult, inputs);
    } catch (error) {
      console.error('Failed to run analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setInputs(preset.inputs);
    setResult(null);
  };

  const getSeverityIcon = (severity) => {
    const icons = { critical: '🔴', high: '🟠', moderate: '🟡', low: '🟢' };
    return icons[severity] ?? '⚪';
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Salinity Risk Analyzer</h1>
        <p>Enter field parameters to generate a full soil salinity risk assessment and crop advisory</p>
      </div>

      {/* Presets & Active Farm */}
      <div className="analyzer-presets">
        <span className="preset-label"><Layers size={13} /> Quick Load:</span>
        {activeFarm && (
          <button
            className="preset-btn active-farm-load-btn"
            onClick={loadActiveFarm}
            title="Load data from currently active village farm"
          >
            ⚡ Active Farm: {activeFarm.name}
          </button>
        )}
        <button
          className="preset-btn pin-drop-quick-btn"
          onClick={openPinDropModal}
        >
          <MapPin size={12} /> Drop Pin on Map
        </button>
        {PRESETS.map((preset, i) => (
          <button
            key={i}
            className="preset-btn"
            onClick={() => applyPreset(preset)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="analyzer-layout">
        {/* Input Panel */}
        <div className="analyzer-inputs card">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><FlaskConical size={16} /></div>
              Field Parameters
            </div>
          </div>

          <div className="input-grid">
            {/* Groundwater EC */}
            <div className="form-group">
              <label className="form-label">
                <Droplets size={12} /> Groundwater EC (dS/m)
              </label>
              <input
                type="number"
                className="form-input"
                value={inputs.groundwaterEC}
                min="0" max="15" step="0.1"
                onChange={e => handleChange('groundwaterEC', parseFloat(e.target.value) || 0)}
              />
              <span className="form-hint">Electrical conductivity of irrigation water (0–15 dS/m)</span>
            </div>

            {/* Water Table Depth */}
            <div className="form-group">
              <label className="form-label">
                <ArrowDownUp size={12} /> Water Table Depth (m)
              </label>
              <input
                type="number"
                className="form-input"
                value={inputs.waterTableDepth}
                min="0.5" max="10" step="0.1"
                onChange={e => handleChange('waterTableDepth', parseFloat(e.target.value) || 0)}
              />
              <span className="form-hint">Depth to groundwater table in meters</span>
            </div>

            {/* Soil Type */}
            <div className="form-group">
              <label className="form-label"><Layers size={12} /> Soil Type</label>
              <select
                className="form-select"
                value={inputs.soilType}
                onChange={e => handleChange('soilType', e.target.value)}
              >
                {SOIL_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Drainage Quality */}
            <div className="form-group">
              <label className="form-label"><Waves size={12} /> Drainage Quality</label>
              <select
                className="form-select"
                value={inputs.drainageQuality}
                onChange={e => handleChange('drainageQuality', e.target.value)}
              >
                {DRAINAGE_QUALITIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Rainfall */}
            <div className="form-group">
              <label className="form-label"><CloudRain size={12} /> Rainfall Last 30 Days (mm)</label>
              <input
                type="number"
                className="form-input"
                value={inputs.rainfallLast30Days}
                min="0" max="300" step="1"
                onChange={e => handleChange('rainfallLast30Days', parseInt(e.target.value) || 0)}
              />
              <span className="form-hint">Total precipitation in last 30 days</span>
            </div>

            {/* Irrigation Method */}
            <div className="form-group">
              <label className="form-label"><Droplets size={12} /> Irrigation Method</label>
              <select
                className="form-select"
                value={inputs.irrigationMethod}
                onChange={e => handleChange('irrigationMethod', e.target.value)}
              >
                {IRRIGATION_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {/* Crop Type */}
            <div className="form-group">
              <label className="form-label"><Sprout size={12} /> Crop Type</label>
              <select
                className="form-select"
                value={inputs.cropType}
                onChange={e => handleChange('cropType', e.target.value)}
              >
                {CROP_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Terrain */}
            <div className="form-group">
              <label className="form-label">Terrain / Slope</label>
              <select
                className="form-select"
                value={inputs.terrain}
                onChange={e => handleChange('terrain', e.target.value)}
              >
                {TERRAIN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg w-full analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spinning-icon" />
                Analyzing Field...
              </>
            ) : (
              <>
                <FlaskConical size={16} />
                Run Salinity Analysis
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="analyzer-results">
          {!result && !loading && (
            <div className="results-placeholder card">
              <div className="placeholder-icon">
                <FlaskConical size={48} />
              </div>
              <h3>Ready to Analyze</h3>
              <p>Enter your field parameters and click "Run Salinity Analysis" to get a complete risk assessment with recommendations.</p>
              <div className="placeholder-features">
                <div className="placeholder-feature"><CheckCircle size={14} color="#22c55e" /> Risk score & level</div>
                <div className="placeholder-feature"><CheckCircle size={14} color="#22c55e" /> Factor breakdown</div>
                <div className="placeholder-feature"><CheckCircle size={14} color="#22c55e" /> Crop advisory</div>
                <div className="placeholder-feature"><CheckCircle size={14} color="#22c55e" /> Mitigation strategies</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="results-placeholder card analyzing">
              <div className="analyzing-animation">
                <div className="analyzing-ring" />
                <FlaskConical size={28} />
              </div>
              <h3>Analyzing Field Data...</h3>
              <p>Computing weighted risk scores across 8 environmental factors</p>
            </div>
          )}

          {result && !loading && (
            <div className="results-content fade-in">
              {/* Score Summary */}
              <div className="card result-summary">
                <div className="result-summary-grid">
                  <div className="result-gauge">
                    <RiskGauge score={result.riskScore} size={200} />
                    <RiskBadge level={result.riskLevel} size="lg" />
                  </div>
                  <div className="result-meta">
                    <div className="result-meta-item">
                      <span className="result-meta-label">Crop Stress Probability</span>
                      <div className="result-stress-wrap">
                        <span className="result-stress-val" style={{
                          color: result.stressProbability >= 75 ? '#ef4444' :
                            result.stressProbability >= 50 ? '#f97316' : '#f59e0b'
                        }}>
                          {result.stressProbability}%
                        </span>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${result.stressProbability}%`,
                              background: result.stressProbability >= 75 ? '#ef4444' :
                                result.stressProbability >= 50 ? '#f97316' : '#f59e0b',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="result-explanation">
                      <div className="explanation-header">
                        <Info size={14} />
                        <strong>Analysis Summary</strong>
                      </div>
                      <p>{result.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="result-tabs">
                {[
                  { key: 'whoop', label: '⚡ WHOOP Vitals' },
                  { key: 'factors', label: 'Factor Breakdown' },
                  { key: 'recommendations', label: 'Recommendations' },
                  { key: 'crops', label: 'Crop Advisory' },
                  { key: 'treatment', label: 'Soil Treatment' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`result-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* WHOOP Vitals Tab */}
              {activeTab === 'whoop' && result.whoopMetrics && (
                <div className="card fade-in whoop-tab-card">
                  <div className="card-header">
                    <div className="section-title">
                      <div className="section-title-icon"><Activity size={16} /></div>
                      WHOOP Soil Strain & Recovery Diagnostic
                    </div>
                    <span className="chip" style={{
                      color: result.whoopMetrics.recoveryZone === 'GREEN' ? '#22c55e' : result.whoopMetrics.recoveryZone === 'YELLOW' ? '#f59e0b' : '#ef4444',
                      borderColor: result.whoopMetrics.recoveryZone === 'GREEN' ? 'rgba(34,197,94,0.3)' : result.whoopMetrics.recoveryZone === 'YELLOW' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)',
                      background: result.whoopMetrics.recoveryZone === 'GREEN' ? 'rgba(34,197,94,0.1)' : result.whoopMetrics.recoveryZone === 'YELLOW' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
                    }}>
                      {result.whoopMetrics.recoveryZone} RECOVERY ({result.whoopMetrics.soilRecovery}%)
                    </span>
                  </div>

                  <div className="whoop-tab-grid">
                    <div className="whoop-tab-item">
                      <span className="whoop-tab-lbl">Soil Strain Score</span>
                      <div className="whoop-tab-val" style={{ color: result.whoopMetrics.soilStrain >= 14 ? '#f97316' : '#22c55e' }}>
                        {result.whoopMetrics.soilStrain} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ 21.0</span>
                      </div>
                      <div className="whoop-tab-sub">{result.whoopMetrics.strainCategory} (Target: &lt; {result.whoopMetrics.targetStrainMax})</div>
                    </div>

                    <div className="whoop-tab-item">
                      <span className="whoop-tab-lbl">Soil Resilience Index</span>
                      <div className="whoop-tab-val" style={{ color: '#008a50' }}>
                        {result.whoopMetrics.vitals.soilResilienceIndex} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ 100</span>
                      </div>
                      <div className="whoop-tab-sub">Natural buffering and flushing capacity</div>
                    </div>

                    <div className="whoop-tab-item">
                      <span className="whoop-tab-lbl">Osmotic Root Suction</span>
                      <div className="whoop-tab-val">{result.whoopMetrics.vitals.osmoticPressure} <span style={{ fontSize: '12px', color: '#94a3b8' }}>atm</span></div>
                      <div className="whoop-tab-sub">{result.whoopMetrics.vitals.osmoticStatus}</div>
                    </div>

                    <div className="whoop-tab-item">
                      <span className="whoop-tab-lbl">Capillary Salt Influx</span>
                      <div className="whoop-tab-val">{result.whoopMetrics.vitals.capillaryFlux} <span style={{ fontSize: '12px', color: '#94a3b8' }}>mm/day</span></div>
                      <div className="whoop-tab-sub">{result.whoopMetrics.vitals.capillaryStatus}</div>
                    </div>
                  </div>

                  <div className="whoop-tab-window">
                    <div className="whoop-tab-window-title">
                      Optimal Irrigation Window: <strong>{result.whoopMetrics.irrigationWindow.optimalTime}</strong>
                    </div>
                    <p>{result.whoopMetrics.irrigationWindow.reason}</p>
                    <div className="whoop-tab-window-action">
                      <strong>Daily Advisory:</strong> {result.whoopMetrics.irrigationWindow.actionToday}
                    </div>
                  </div>
                </div>
              )}

              {/* Factor Breakdown Tab */}
              {activeTab === 'factors' && (
                <div className="card fade-in">
                  <div className="card-header">
                    <span className="card-title">Contributing Factors (Sorted by Impact)</span>
                  </div>
                  <FactorBreakdownChart factors={result.factors} height={280} />
                  <div className="factor-details">
                    {result.factors.map((f, i) => (
                      <div key={i} className="factor-detail-row">
                        <span className="factor-icon">{getSeverityIcon(f.severity)}</span>
                        <div className="factor-detail-content">
                          <div className="factor-detail-name">{f.name}</div>
                          <div className="factor-detail-desc">{f.description}</div>
                        </div>
                        <div className="factor-detail-score">
                          <span style={{ color: f.severity === 'critical' ? '#ef4444' : f.severity === 'high' ? '#f97316' : f.severity === 'moderate' ? '#f59e0b' : '#22c55e' }}>
                            {f.contribution}pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="recommendations-content fade-in">
                  {result.recommendations.immediate.length > 0 && (
                    <div className="card rec-section">
                      <div className="card-header">
                        <div className="section-title">
                          <div className="section-title-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}><AlertTriangle size={15} /></div>
                          Immediate Actions
                        </div>
                      </div>
                      {result.recommendations.immediate.map((r, i) => (
                        <div key={i} className="rec-item immediate">
                          <span className="rec-num">!</span>
                          {r}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.recommendations.shortTerm.length > 0 && (
                    <div className="card rec-section">
                      <div className="card-header">
                        <div className="section-title">
                          <div className="section-title-icon"><ChevronRight size={15} /></div>
                          Short-Term (1–3 months)
                        </div>
                      </div>
                      {result.recommendations.shortTerm.map((r, i) => (
                        <div key={i} className="rec-item short-term">
                          <span className="rec-num">{i + 1}</span>
                          {r}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.recommendations.longTerm.length > 0 && (
                    <div className="card rec-section">
                      <div className="card-header">
                        <div className="section-title">
                          <div className="section-title-icon"><Lightbulb size={15} /></div>
                          Long-Term Strategy
                        </div>
                      </div>
                      {result.recommendations.longTerm.map((r, i) => (
                        <div key={i} className="rec-item long-term">
                          <span className="rec-num">{i + 1}</span>
                          {r}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.recommendations.irrigationChanges.length > 0 && (
                    <div className="card rec-section">
                      <div className="card-header">
                        <div className="section-title">
                          <div className="section-title-icon"><Droplets size={15} /></div>
                          Irrigation Changes
                        </div>
                      </div>
                      {result.recommendations.irrigationChanges.map((irr, i) => (
                        <div key={i} className="irrigation-card">
                          <h4>{irr.title}</h4>
                          <p>{irr.description}</p>
                          <div className="irr-benefit">✅ {irr.benefit}</div>
                          {irr.subsidy && <div className="irr-subsidy">💰 {irr.subsidy}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Crop Advisory Tab */}
              {activeTab === 'crops' && (
                <div className="card fade-in">
                  <div className="card-header">
                    <div className="section-title">
                      <div className="section-title-icon"><Sprout size={15} /></div>
                      Recommended Alternatives for EC {inputs.groundwaterEC} dS/m
                    </div>
                  </div>
                  <div className="crop-alternatives">
                    {result.recommendations.alternativeCrops.map((crop, i) => (
                      <div key={i} className="crop-alt-item">
                        <span className="crop-alt-num">{i + 1}</span>
                        <span>{crop}</span>
                      </div>
                    ))}
                  </div>
                  <div className="crop-note">
                    <Info size={14} />
                    <span>EC thresholds based on FAO Irrigation and Drainage Paper No. 29. Actual performance may vary based on soil SAR, climate, and management practices.</span>
                  </div>
                </div>
              )}

              {/* Soil Treatment Tab */}
              {activeTab === 'treatment' && (
                <div className="fade-in">
                  {result.recommendations.soilTreatment.map((t, i) => (
                    <div key={i} className="card treatment-card">
                      <div className="treatment-header">
                        <h4>{t.title}</h4>
                        <span className="chip">{t.timing}</span>
                      </div>
                      <p>{t.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
