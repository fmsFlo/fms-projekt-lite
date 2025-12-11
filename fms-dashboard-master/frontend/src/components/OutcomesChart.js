import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const OutcomesChart = ({ data }) => {
  const outcomeLabels = {
    'Termin vereinbart': 'Termin vereinbart',
    'Interesse - Termin folgt': 'Interesse - Termin folgt',
    'Infomaterial gewünscht': 'Infomaterial gewünscht',
    'Rückruf vereinbart': 'Rückruf vereinbart',
    'Später interessant': 'Später interessant',
    'Kein Interesse': 'Kein Interesse',
    'Budget fehlt': 'Budget fehlt',
    'Bereits versorgt': 'Bereits versorgt',
    'Falsche Zielgruppe': 'Falsche Zielgruppe',
    'Mailbox': 'Mailbox',
    'Nicht erreicht': 'Nicht erreicht',
    'Kann jetzt nicht': 'Kann jetzt nicht',
    'Falsche Nummer': 'Falsche Nummer',
    'Im Urlaub': 'Im Urlaub',
    'Partner einbeziehen': 'Partner einbeziehen',
    'Hat sich nicht eingetragen': 'Hat sich nicht eingetragen',
    'Unknown': 'Unknown'
  };

  const cleanOutcomeName = (outcome) => {
    if (!outcome) return 'Unknown';
    let cleaned = outcome.replace(/\([^)]*\)/g, '').trim();
    cleaned = cleaned.replace(/Custom Activity[^!]*!/g, '').trim();
    cleaned = cleaned.replace(/ausfüllen[^!]*!/g, '').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned || outcome;
  };

  const chartData = data.map(item => ({
    name: cleanOutcomeName(outcomeLabels[item.outcome] || item.outcome),
    value: item.count
  }));

  // Professional Corporate Colors
  const COLORS = [
    '#4a90e2', '#0ea66e', '#e3a008', '#dc2626', '#06b6d4',
    '#8b5cf6', '#9ca3af', '#64748b', '#475569', '#334155'
  ];

  // Professional Dark Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: '#1a1f2e',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}>
          <p style={{ marginBottom: '4px', fontWeight: 600, color: '#e5e7eb', fontSize: '12px' }}>
            {data.name}
          </p>
          <p style={{ color: data.payload.fill, margin: 0, fontSize: '11px' }}>
            Anzahl: <strong style={{ color: '#e5e7eb' }}>{data.value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => {
            if (percent < 0.05) return '';
            return `${(percent * 100).toFixed(0)}%`;
          }}
          outerRadius={70}
          innerRadius={42}
          fill="#8884d8"
          dataKey="value"
          stroke="#0a0e14"
          strokeWidth={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default OutcomesChart;
