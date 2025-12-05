"use client"

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface CallStatsChartProps {
  data: Array<{
    period: string
    total_calls: number
    reached: number
    not_reached: number
  }>
}

const CallStatsChart: React.FC<CallStatsChartProps> = ({ data }) => {
  const chartData = data.map(item => {
    let periodDisplay = item.period
    if (item.period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = item.period.split('-')
      periodDisplay = `${day}.${month}`
    } else if (item.period.match(/^\d{4}-\d{2}$/)) {
      periodDisplay = item.period
    }
    
    return {
      period: periodDisplay,
      total: item.total_calls,
      erreicht: item.reached,
      nicht_erreicht: item.not_reached
    }
  }).reverse()

  const CustomTooltip = ({ active, payload }: any) => {
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
            {payload[0].payload.period}
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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" />
        <XAxis 
          dataKey="period" 
          stroke="rgba(255, 255, 255, 0.4)"
          style={{ fontSize: '11px' }}
          tick={{ fill: 'rgba(255, 255, 255, 0.4)' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
        />
        <YAxis 
          stroke="rgba(255, 255, 255, 0.4)"
          style={{ fontSize: '11px' }}
          tick={{ fill: 'rgba(255, 255, 255, 0.4)' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.05)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
          iconType="line"
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#4a90e2" 
          name="Gesamt"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="erreicht" 
          stroke="#0ea66e" 
          name="Erreicht"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="nicht_erreicht" 
          stroke="#e3a008" 
          name="Nicht Erreicht"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default CallStatsChart

