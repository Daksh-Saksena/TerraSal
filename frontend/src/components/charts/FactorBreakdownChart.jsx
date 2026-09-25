import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="custom-tooltip">
      <div className="label">{d.name}</div>
      <div className="entry">
        <strong>{d.contribution}</strong> pts contribution
      </div>
      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>
        Score: {d.score.toFixed(1)}/10 · Weight: {(d.weight * 100).toFixed(0)}%
      </div>
    </div>
  );
};

const getSeverityColor = (severity) => {
  const colors = {
    critical: '#ef4444',
    high: '#f97316',
    moderate: '#f59e0b',
    low: '#22c55e',
  };
  return colors[severity] ?? '#94a3b8';
};

export default function FactorBreakdownChart({ factors = [], height = 260 }) {
  const data = factors.map(f => ({
    name: f.name,
    contribution: f.contribution,
    score: f.score,
    weight: f.weight,
    severity: f.severity,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
        barSize={12}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 30]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          tickFormatter={(v) => `${v}pts`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={getSeverityColor(entry.severity)}
              style={{ filter: `drop-shadow(0 0 4px ${getSeverityColor(entry.severity)}60)` }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
