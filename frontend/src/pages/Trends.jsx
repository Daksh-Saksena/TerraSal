import React from 'react';
import {
  TrendingUp, BarChart2, Droplets, CloudRain,
  ArrowDownUp, Info
} from 'lucide-react';
import ECTrendChart from '../components/charts/ECTrendChart';
import RainfallECChart from '../components/charts/RainfallECChart';
import SeasonalChart from '../components/charts/SeasonalChart';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useApp } from '../context/AppContext';
import './Trends.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map(entry => entry.value !== null && (
        <div key={entry.name} className="entry">
          <span className="dot" style={{ background: entry.color || entry.fill }} />
          <span style={{ color: entry.color || '#94a3b8' }}>{entry.name}:</span>
          <strong>{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Trends() {
  const { state } = useApp();
  const waterTableData = state.trends?.waterTableData || [];
  const yoyData = state.trends?.yoyData || [];
  const riskScoreTrend = state.trends?.riskScoreTrend || [];
  
  const trendStats = {
    ecChangeYoY: '+14.2%',
    avgEC2026: '4.6 dS/m',
    peakECMonth: 'May',
    lowestECMonth: 'August',
    rainfallDeficit: '-22%',
    waterTableDropRate: '0.07 m/mo',
    avgECChange: '+1.2%',
    criticalAlertsUp: '+4',
    waterTableDrop: '-0.3m',
    highestRiskRegion: 'Sri Ganganagar'
  };

  // Sample data for performance
  const wtData = waterTableData.filter((_, i) => i % 2 === 0);
  const yoyFiltered = yoyData;
  const riskTrend = riskScoreTrend.filter((_, i) => i % 2 === 0);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Historical Trends & Analytics</h1>
        <p>Time-series analysis of soil salinity indicators across monitored regions</p>
      </div>

      {/* Summary Stats Strip */}
      <div className="trends-stats-strip fade-in-delay-1">
        {[
          { label: 'EC Change YoY', value: trendStats.ecChangeYoY, color: '#ef4444', icon: TrendingUp },
          { label: 'Avg EC 2026', value: trendStats.avgEC2026, color: '#f97316', icon: Droplets },
          { label: 'Peak EC Month', value: trendStats.peakECMonth, color: '#f59e0b', icon: BarChart2 },
          { label: 'Lowest EC Month', value: trendStats.lowestECMonth, color: '#22c55e', icon: BarChart2 },
          { label: 'Rainfall Deficit', value: trendStats.rainfallDeficit, color: '#63b3ed', icon: CloudRain },
          { label: 'Water Table Drop', value: trendStats.waterTableDropRate, color: '#a78bfa', icon: ArrowDownUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="trends-stat card card-sm">
            <div className="trends-stat-icon" style={{ background: `${color}15`, color }}>
              <Icon size={15} />
            </div>
            <div>
              <div className="trends-stat-val" style={{ color }}>{value}</div>
              <div className="trends-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid of charts */}
      <div className="trends-grid">

        {/* EC Trend */}
        <div className="card chart-card fade-in-delay-1" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><TrendingUp size={16} /></div>
              Groundwater EC Trend — 3 Key Fields (24 Months)
            </div>
            <div className="chip"><Info size={11} /> dS/m — Higher is worse</div>
          </div>
          <ECTrendChart height={280} />
        </div>

        {/* Rainfall vs EC */}
        <div className="card chart-card fade-in-delay-2">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><CloudRain size={16} /></div>
              Rainfall vs EC Correlation
            </div>
          </div>
          <RainfallECChart height={260} />
          <div className="chart-insight">
            <Info size={13} />
            Inverse correlation evident: EC drops during monsoon months (Jul–Sep) when leaching occurs naturally.
          </div>
        </div>

        {/* Seasonal Analysis */}
        <div className="card chart-card fade-in-delay-2">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><BarChart2 size={16} /></div>
              Seasonal Salinity Pattern
            </div>
          </div>
          <SeasonalChart height={260} />
          <div className="chart-insight">
            <Info size={13} />
            Peak salinity occurs in April–May (pre-monsoon, high evaporation). Safe levels only in Jul–Sep.
          </div>
        </div>

        {/* Water Table Depth Trend */}
        <div className="card chart-card fade-in-delay-3">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><ArrowDownUp size={16} /></div>
              Water Table Depth Trend
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={wtData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradGanganagar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLudhiana" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                reversed
                tick={{ fontSize: 11 }}
                tickLine={false}
                label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', offset: 15, style: { fill: '#64748b', fontSize: 10 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>} />
              <ReferenceLine y={2} stroke="rgba(239,68,68,0.5)" strokeDasharray="4 3" label={{ value: 'Critical <2m', position: 'right', fill: '#ef4444', fontSize: 9 }} />
              <Area type="monotone" dataKey="depthGanganagar" name="Ganganagar" stroke="#ef4444" fill="url(#gradGanganagar)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="depthLudhiana" name="Ludhiana" stroke="#f97316" fill="url(#gradLudhiana)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <Info size={13} />
            Water table rising at 0.07m/month in Ganganagar. At this rate, it will reach critically shallow levels by Q1 2027.
          </div>
        </div>

        {/* YoY Comparison */}
        <div className="card chart-card fade-in-delay-3">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><BarChart2 size={16} /></div>
              Year-over-Year EC Comparison
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yoyFiltered} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>} />
              <Bar dataKey="year2024" name="2024" fill="rgba(0,201,177,0.5)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="year2025" name="2025" fill="rgba(249,115,22,0.5)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="year2026" name="2026 (YTD)" fill="rgba(239,68,68,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <Info size={13} />
            Each year EC levels trend higher. 2026 YTD average is 14% above 2024, indicating systematic degradation.
          </div>
        </div>

        {/* Risk Score Trend */}
        <div className="card chart-card fade-in-delay-4" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                <TrendingUp size={16} />
              </div>
              Platform Average Risk Score — 24 Months
            </div>
            <div className="chip" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
              ↑ Trending Critical
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={riskTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={35} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 3" label={{ value: 'Moderate threshold', position: 'right', fill: '#f59e0b', fontSize: 9 }} />
              <ReferenceLine y={60} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 3" label={{ value: 'High threshold', position: 'right', fill: '#f97316', fontSize: 9 }} />
              <ReferenceLine y={80} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 3" label={{ value: 'Critical threshold', position: 'right', fill: '#ef4444', fontSize: 9 }} />
              <Area type="monotone" dataKey="avgRisk" name="Avg Risk Score" stroke="#ef4444" fill="url(#riskGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
