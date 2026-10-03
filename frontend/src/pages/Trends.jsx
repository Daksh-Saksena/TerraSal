import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ECTrendChart from '../components/charts/ECTrendChart';
import RainfallECChart from '../components/charts/RainfallECChart';
import SeasonalChart from '../components/charts/SeasonalChart';
import './Trends.css';

// Only shows charts when the backend actually has recorded history.
// No placeholder numbers: with no data, an honest empty state is shown.
export default function Trends() {
  const { state } = useApp();
  const t = state.trends || {};
  const hasHistory = [t.ecTrendData, t.rainfallECData, t.seasonalData]
    .some(arr => Array.isArray(arr) && arr.length > 0);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Trends</h1>
        <p>How salinity, rainfall and water table change over time</p>
      </div>

      {!hasHistory ? (
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
            <ECTrendChart height={280} />
          </div>
          <div className="card chart-card"><RainfallECChart height={260} /></div>
          <div className="card chart-card"><SeasonalChart height={260} /></div>
        </div>
      )}
    </div>
  );
}
