import React from 'react';
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

export default function ECTrendChart({ height = 280 }) {
  const { state } = useApp();
  const ecTrendData = state.trends?.ecTrendData || [];
  // Sample every 3rd point for performance
  const data = ecTrendData.filter((_, i) => i % 3 === 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          domain={[0, 'dataMax + 1']}
          tickFormatter={(v) => `${v}`}
          label={{ value: 'EC (dS/m)', angle: -90, position: 'insideLeft', offset: 15, style: { fill: '#64748b', fontSize: 11 } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
        />
        {/* Safe threshold reference */}
        <Line
          dataKey="__safe"
          stroke="rgba(34,197,94,0.3)"
          strokeDasharray="4 4"
          dot={false}
          activeDot={false}
          legendType="none"
        />
        <Line
          type="monotone"
          dataKey="ludhiana"
          name="Ludhiana"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#f97316' }}
        />
        <Line
          type="monotone"
          dataKey="hisar"
          name="Hisar"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#f59e0b' }}
        />
        <Line
          type="monotone"
          dataKey="ganganagar"
          name="Ganganagar"
          stroke="#ef4444"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#ef4444' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
