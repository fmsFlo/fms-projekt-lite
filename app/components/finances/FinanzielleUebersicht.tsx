"use client"

import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import KPICard from './KPICard'
import AusgabenKategorieCard from './AusgabenKategorieCard'
import {
  calculateSparrate,
  calculateSparquote,
  calculateGesamtAusgaben,
  calculateGesamtEinkommen,
  formatEuro,
} from './utils'
import type { FinanzielleSituation } from './types'

interface FinanzielleUebersichtProps {
  situation: FinanzielleSituation
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export default function FinanzielleUebersicht({ situation }: FinanzielleUebersichtProps) {
  const [filterTyp, setFilterTyp] = useState<'alle' | 'fix' | 'variabel'>('alle')

  const gesamtEinkommen = calculateGesamtEinkommen(situation)
  const gesamtAusgaben = calculateGesamtAusgaben(situation)
  const sparrate = calculateSparrate(situation)
  const sparquote = calculateSparquote(situation)

  // Chart-Daten für Ausgabenverteilung
  const alleAusgaben = [...situation.fixkosten, ...situation.variableKosten]
    .filter((k) => k.betrag > 0)
    .filter((k) => filterTyp === 'alle' || k.typ === filterTyp)
    .sort((a, b) => b.betrag - a.betrag)

  const pieData = alleAusgaben.map((k) => ({
    name: k.name,
    value: k.betrag,
  }))

  // Bar Chart Daten
  const barData = [
    {
      name: 'Einnahmen',
      Wert: gesamtEinkommen,
      Typ: 'Einnahmen',
    },
    {
      name: 'Ausgaben',
      Wert: -gesamtAusgaben,
      Typ: 'Ausgaben',
    },
    {
      name: 'Sparrate',
      Wert: sparrate,
      Typ: sparrate >= 0 ? 'Sparrate' : 'Defizit',
    },
  ]

  // Gestapelte Ausgaben für Bar Chart
  const ausgabenKategorien = alleAusgaben.slice(0, 5) // Top 5
  const gestapelteAusgaben = ausgabenKategorien.map((k) => ({
    name: k.name,
    Wert: k.betrag,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Deine Zahlen auf einen Blick</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Nettoeinkommen"
          value={gesamtEinkommen}
          unit="euro"
          icon="euro"
          color="green"
          subtitle="Monatlich"
        />
        <KPICard
          title="Gesamtausgaben"
          value={gesamtAusgaben}
          unit="euro"
          icon="euro"
          color="red"
          subtitle="Monatlich"
        />
        <KPICard
          title="Sparrate"
          value={sparrate}
          unit="euro"
          icon={sparrate >= 0 ? 'trend-up' : 'trend-down'}
          color={sparrate >= 0 ? 'green' : 'red'}
          trend={sparrate >= 0 ? 'up' : 'down'}
          subtitle="Monatlich"
        />
        <KPICard
          title="Sparquote"
          value={sparquote}
          unit="percent"
          icon="percent"
          color={sparquote >= 10 ? 'green' : sparquote >= 5 ? 'orange' : 'red'}
          subtitle="Vom Nettoeinkommen"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Ausgabenverteilung */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ausgabenverteilung</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterTyp('alle')}
                className={`px-3 py-1 text-xs rounded-lg ${
                  filterTyp === 'alle' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterTyp('fix')}
                className={`px-3 py-1 text-xs rounded-lg ${
                  filterTyp === 'fix' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Fix
              </button>
              <button
                onClick={() => setFilterTyp('variabel')}
                className={`px-3 py-1 text-xs rounded-lg ${
                  filterTyp === 'variabel' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Variabel
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="40%"
                labelLine={false}
                label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${name}: ${formatEuro(value)}`,
                  '',
                ]}
                labelFormatter={(label) => ''}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={150}
                iconSize={12}
                formatter={(value, entry) => {
                  const data = pieData.find((d) => d.name === value)
                  if (!data) return value
                  const percent = (data.value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100
                  return `${value} (${percent.toFixed(1)}%)`
                }}
                wrapperStyle={{
                  fontSize: '11px',
                  paddingTop: '20px',
                  lineHeight: '1.6',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Cashflow */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monatlicher Cashflow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => formatEuro(Math.abs(value))}
              />
              <Tooltip
                formatter={(value: number) => formatEuro(Math.abs(value))}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Bar
                dataKey="Wert"
                radius={[8, 8, 0, 0]}
              >
                {barData.map((entry, index) => {
                  let fillColor = '#93c5fd' // Default hellblau
                  if (entry.Typ === 'Einnahmen') {
                    fillColor = '#34d399' // Grün für Einnahmen
                  } else if (entry.Typ === 'Ausgaben') {
                    fillColor = '#f87171' // Rot für Ausgaben
                  } else if (entry.Typ === 'Sparrate' || entry.Typ === 'Defizit') {
                    fillColor = entry.Wert >= 0 ? '#60a5fa' : '#fb7185' // Blau wenn positiv, Rosa wenn negativ
                  }
                  return <Cell key={`cell-${index}`} fill={fillColor} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Ausgaben Kategorien */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Ausgaben-Kategorien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alleAusgaben.slice(0, 6).map((kategorie) => (
            <AusgabenKategorieCard
              key={kategorie.id}
              kategorie={kategorie}
              gesamtAusgaben={gesamtAusgaben}
              showVergleich={true}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

