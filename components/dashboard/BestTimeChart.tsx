"use client"

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface BestTimeChartProps {
  data: Array<{
    hour: number
    total_calls: number
    reached: number
    success_rate: number
  }>
}

const BestTimeChart: React.FC<BestTimeChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    uhrzeit: `${item.hour}:00`,
    erreichbarkeit: Math.round(item.success_rate * 10) / 10,
    anrufe: item.total_calls,
    erreicht: item.reached
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#1a1f2e',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}>
          <p style={{ marginBottom: '4px', fontWeight: 600, color: '#e5e7eb', fontSize: '12px' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, margin: '2px 0', fontSize: '11px' }}>
              {entry.name}: <strong style={{ color: '#e5e7eb' }}>{entry.value}</strong>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-400 text-sm">
        Keine Daten verfügbar
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" />
        <XAxis 
          dataKey="uhrzeit" 
          stroke="rgba(255, 255, 255, 0.4)"
          style={{ fontSize: '11px' }}
          tick={{ fill: 'rgba(255, 255, 255, 0.4)' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
        />
        <YAxis 
          yAxisId="left" 
          stroke="rgba(255, 255, 255, 0.4)"
          style={{ fontSize: '11px' }}
          tick={{ fill: 'rgba(255, 255, 255, 0.4)' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          stroke="rgba(255, 255, 255, 0.4)"
          style={{ fontSize: '11px' }}
          tick={{ fill: 'rgba(255, 255, 255, 0.4)' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
        />
        <Bar 
          yAxisId="left"
          dataKey="erreichbarkeit" 
          fill="#4a90e2" 
          name="Erfolgsrate (%)"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          yAxisId="right"
          dataKey="anrufe" 
          fill="#0ea66e" 
          name="Anzahl Anrufe"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BestTimeChart




