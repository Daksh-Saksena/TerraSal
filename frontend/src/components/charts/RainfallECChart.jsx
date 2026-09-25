import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useApp } from '../../context/AppContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map(entry => (
        <div key={entry.name} className="entry">
          <span className="dot" style={{ background: entry.color }} />
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <strong>{entry.value}{entry.name === 'Rainfall' ? 'mm' : ' dS/m'}</strong>
        </div>
      ))}
    </div>
  );
};

export default function RainfallECChart({ height = 280 }) {
  const { state } = useApp();
  const rainfallECData = state.trends?.rainfallECData || [];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rainfallECData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis
          yAxisId="rain"
          orientation="left"
          tick={{ fontSize: 11 }}
          tickLine={false}
          label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', offset: 15, style: { fill: '#64748b', fontSize: 10 } }}
        />
        <YAxis
          yAxisId="ec"
          orientation="right"
          domain={[0, 7]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          label={{ value: 'EC (dS/m)', angle: 90, position: 'insideRight', offset: 10, style: { fill: '#64748b', fontSize: 10 } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          formatter={(v) => <span style={{ color: '#94a3b8' }}>{v}</span>}
        />
        <Bar yAxisId="rain" dataKey="rainfall" name="Rainfall" fill="rgba(99,179,237,0.4)" radius={[3, 3, 0, 0]} />
        <Line
          yAxisId="ec"
          type="monotone"
          dataKey="avgEC"
          name="Avg EC"
          stroke="#ef4444"
          strokeWidth={2.5}
          dot={{ fill: '#ef4444', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
