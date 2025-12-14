"use client"

import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  unit?: 'euro' | 'percent'
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  icon?: 'euro' | 'percent' | 'trend-up' | 'trend-down'
  color?: 'green' | 'red' | 'blue' | 'purple' | 'orange'
}

const iconMap = {
  euro: DollarSign,
  percent: Percent,
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
}

const colorClasses = {
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
}

export default function KPICard({
  title,
  value,
  unit = 'euro',
  trend,
  subtitle,
  icon,
  color = 'blue',
}: KPICardProps) {
  const formatValue = () => {
    if (unit === 'percent') {
      return new Intl.NumberFormat('de-DE', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value / 100)
    }
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' €'
  }

  const IconComponent = icon ? iconMap[icon] : iconMap.euro
  const isPositive = value >= 0
  const displayColor = isPositive ? 'green' : 'red'

  return (
    <div
      className={`rounded-xl border-2 p-6 shadow-sm transition-all hover:shadow-md ${
        color === 'auto' ? colorClasses[displayColor] : colorClasses[color]
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-80">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-bold">{formatValue()}</p>
        {trend && (
          <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs mt-2 opacity-70">{subtitle}</p>}
    </div>
  )
}

