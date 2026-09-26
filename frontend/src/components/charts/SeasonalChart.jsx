import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="entry">
        <span className="dot" style={{ background: '#008a50' }} />
        Avg EC: <strong>{d.avgSalinity} dS/m</strong>
      </div>
      <div style={{ color: '#f97316', fontSize: '12px', marginTop: 3 }}>
        Critical fields: {d.criticalFields}
      </div>
    </div>
  );
};

export default function SeasonalChart({ height = 280 }) {
  const { state } = useApp();
  const seasonalData = state.trends?.seasonalData || [];
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={seasonalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle, #dfdfdf)" />
        <XAxis dataKey="month" stroke="var(--text-muted, #737373)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
        <YAxis stroke="var(--text-muted, #737373)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover, #ededed)', opacity: 0.5 }} />
        <ReferenceLine y={4} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Threshold', fill: '#ef4444', fontSize: 11 }} />
        
        <Bar dataKey="avgSalinity" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {seasonalData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.avgSalinity > 4 ? '#ef4444' : entry.avgSalinity > 3 ? '#f97316' : '#008a50'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
