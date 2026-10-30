import { useState, useEffect } from 'react';
import { TrendingUp, Droplets, CloudRain, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getApiUrl } from '../utils/api';
import ECTrendChart from '../components/charts/ECTrendChart';
import RainfallECChart from '../components/charts/RainfallECChart';
import SeasonalChart from '../components/charts/SeasonalChart';
import './Trends.css';

export default function Trends() {
  const { state, role, activeFarm, userFields } = useApp();
  const isFarmer = role === 'farmer';
  const [selectedFieldId, setSelectedFieldId] = useState(activeFarm?.id || (userFields[0]?.id || null));
  const [trendsData, setTrendsData] = useState(state.trends);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFarmer && activeFarm?.id) {
      setSelectedFieldId(activeFarm.id);
    }
  }, [isFarmer, activeFarm?.id]);

  useEffect(() => {
    let isCancelled = false;
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const query = selectedFieldId ? `?fieldId=${selectedFieldId}` : '';
        const res = await fetch(getApiUrl(`/api/trends${query}`));
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setTrendsData(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic trends:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchTrends();
    return () => {
      isCancelled = true;
    };
  }, [selectedFieldId]);

  const t = trendsData || state.trends || {};
  const hasHistory = Boolean(
    (t.fieldTrend && t.fieldTrend.points?.length > 0) ||
    (Array.isArray(t.ecTrendData) && t.ecTrendData.length > 0)
  );

  const currentField = (isFarmer ? userFields : state.fields).find(f => f.id === selectedFieldId) || activeFarm;

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>{isFarmer ? `My Field Trends: ${currentField?.name || 'My Plot'}` : 'Village Salinity & Groundwater Trends'}</h1>
          <p>
            {isFarmer
              ? `Real-time root-zone salinity, capillary salt rise, and monsoon leaching history for your ${currentField?.cropType || 'wheat'} field.`
              : 'Dynamic multi-season telemetry and root-zone salinity monitoring across all registered village plots.'}
          </p>
        </div>

        {!isFarmer && state.fields?.length > 1 && (
          <div className="trends-field-selector" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`pill-btn ${!selectedFieldId ? 'active' : ''}`}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
                background: !selectedFieldId ? 'var(--color-primary)' : 'var(--bg-hover)',
                color: !selectedFieldId ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedFieldId(null)}
            >
              All Village Plots
            </button>
            {state.fields.map(f => (
              <button
                key={f.id}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-subtle)',
                  background: selectedFieldId === f.id ? 'var(--color-primary)' : 'var(--bg-hover)',
                  color: selectedFieldId === f.id ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedFieldId(f.id)}
              >
                {f.name} ({f.farmerName || 'Plot'})
              </button>
            ))}
          </div>
        )}
      </div>

      {isFarmer && currentField && (
        <div className="card farmer-trend-banner" style={{ marginBottom: 20, padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 14 }}>
            <div style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Current Salt (EC)</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: (currentField.groundwaterEC || 0) > 4.5 ? '#ef4444' : '#008a50' }}>
                {currentField.groundwaterEC || 0} dS/m
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>Safe limit for {currentField.cropType || 'wheat'}: 6.0 dS/m</span>
            </div>
            <div style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Water Table Depth</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: (currentField.waterTableDepth || 0) < 2.0 ? '#ef4444' : '#008a50' }}>
                {currentField.waterTableDepth || 0} m
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>{(currentField.waterTableDepth || 0) < 2.0 ? 'Elevated risk of capillary salt rise' : 'Safe root buffer depth'}</span>
            </div>
            <div style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Monsoon Natural Flush</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#0284c7' }}>
                -22% Salt
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>Monsoon rains leach surface salts</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, background: 'rgba(0,138,80,0.06)', border: '1px solid rgba(0,138,80,0.2)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
            <Info size={16} color="#008a50" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>How salt changes through the year on your field:</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                In the hot summer months (May & June), intense heat evaporates surface moisture and pulls underground salt up into the root zone.
                When monsoon arrives in July to August, rainfall dissolves and flushes the salt downward into deeper soil.
                Before sowing your winter {currentField.cropType || 'wheat'} crop in October to November, ensure tubewell water is tested to avoid root burn.
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasHistory && !loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <TrendingUp size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3 style={{ marginBottom: 8 }}>No history recorded yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto' }}>
            Trends will appear here once readings are logged over time for your farms.
            Nothing is shown until there is real data.
          </p>
        </div>
      ) : (
        <div className="trends-grid">
          <div className="card chart-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title">
                <div className="section-title-icon"><TrendingUp size={16} /></div>
                {t.fieldTrend ? `${t.fieldTrend.fieldName} • 12-Month Salinity & Crop Threshold Evolution` : '12-Month Salinity Evolution (All Monitored Village Fields)'}
              </div>
              <span className="chip" style={{ background: 'var(--bg-hover)' }}>
                {t.fieldTrend ? `Target: ${t.fieldTrend.cropType || 'Wheat'}` : `${state.fields?.length || 0} Registered Plots`}
              </span>
            </div>
            <ECTrendChart height={300} customData={t.ecTrendData} fieldTrend={t.fieldTrend} />
            <div className="chart-insight">
              <Info size={14} />
              <span>
                {t.fieldTrend
                  ? `Dotted line shows safe threshold (${t.fieldTrend.safeThreshold} dS/m) for ${t.fieldTrend.cropType}. Any point above this requires leaching or gypsum amendment.`
                  : 'Curves show seasonal salt variations across registered farmer plots. All points are generated from registered groundwater & soil metrics.'}
              </span>
            </div>
          </div>

          <div className="card chart-card">
            <div className="card-header">
              <div className="section-title">
                <div className="section-title-icon"><CloudRain size={16} /></div>
                Rainfall vs Root-Zone Salt Flushing
              </div>
            </div>
            <RainfallECChart height={260} />
            <div className="chart-insight">
              <CloudRain size={14} color="#0284c7" />
              <span>Heavy rainfall (&gt;40mm) naturally dissolves rootzone salts and drains them below root depth.</span>
            </div>
          </div>

          <div className="card chart-card">
            <div className="card-header">
              <div className="section-title">
                <div className="section-title-icon"><Droplets size={16} /></div>
                Salinity by Crop Season (Rabi / Zaid / Kharif)
              </div>
            </div>
            <SeasonalChart height={260} />
            <div className="chart-insight">
              <Droplets size={14} color="#008a50" />
              <span>Summer (Zaid) carries peak capillary salt risk. Post-monsoon winter (Rabi) offers the cleanest soil conditions.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
