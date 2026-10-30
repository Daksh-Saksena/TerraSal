import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useApp } from '../../context/AppContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="entry">
          <span className="dot" style={{ background: entry.color }} />
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <strong>{entry.value} dS/m</strong>
        </div>
      ))}
    </div>
  );
};

export default function ECTrendChart({ height = 280, customData = null, fieldTrend = null }) {
  const { state } = useApp();
  
  // Prefer explicit props or context trends
  const activeFieldTrend = fieldTrend || state.trends?.fieldTrend;
  
  if (activeFieldTrend && activeFieldTrend.points?.length) {
    const data = activeFieldTrend.points;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #dfdfdf)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} stroke="var(--text-muted, #737373)" />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            stroke="var(--text-muted, #737373)"
            domain={[0, 'dataMax + 1.5']}
            tickFormatter={(v) => `${v}`}
            label={{ value: 'EC (dS/m)', angle: -90, position: 'insideLeft', offset: 15, style: { fill: '#64748b', fontSize: 11 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            formatter={(value) => <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>{value}</span>}
          />
          <Line
            dataKey="safeThreshold"
            name={`Safe Limit for ${activeFieldTrend.cropType || 'Crop'} (${activeFieldTrend.safeThreshold} dS/m)`}
            stroke="#22c55e"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="ec"
            name={`${activeFieldTrend.fieldName} (${activeFieldTrend.farmerName || 'Plot'})`}
            stroke="#008a50"
            strokeWidth={3}
            dot={{ r: 3, fill: '#008a50' }}
            activeDot={{ r: 6, fill: '#008a50' }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const rawData = customData || state.trends?.ecTrendData || [];
  const data = rawData;
  const fields = state.trends?.fields || state.fields || [];

  const COLOR_PALETTE = ['#008a50', '#f97316', '#2563eb', '#9333ea', '#db2777', '#0891b2', '#eab308'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #dfdfdf)" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} stroke="var(--text-muted, #737373)" />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          stroke="var(--text-muted, #737373)"
          domain={[0, 'dataMax + 1']}
          tickFormatter={(v) => `${v}`}
          label={{ value: 'EC (dS/m)', angle: -90, position: 'insideLeft', offset: 15, style: { fill: '#64748b', fontSize: 11 } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          formatter={(value) => <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>{value}</span>}
        />
        <Line
          dataKey="safeThreshold"
          name="Safe Threshold (4.0 dS/m)"
          stroke="rgba(34,197,94,0.6)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          dot={false}
          activeDot={false}
        />
        {fields.map((f, i) => (
          <Line
            key={f.id || f.name}
            type="monotone"
            dataKey={f.name}
            name={`${f.name} (${f.farmerName || 'Farmer'})`}
            stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: COLOR_PALETTE[i % COLOR_PALETTE.length] }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
