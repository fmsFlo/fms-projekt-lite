"use client"

import { generateSzenarioVergleich, formatEuro, calculateGesamtAusgaben } from './utils'
import type { FinanzielleSituation } from './types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Target, Zap } from 'lucide-react'

interface SzenarioVergleichProps {
  situation: FinanzielleSituation
  rendite?: number
}

export default function SzenarioVergleich({ situation, rendite = 5 }: SzenarioVergleichProps) {
  const optimiertEinsparung = calculateGesamtAusgaben(situation) * 0.15 // 15% Einsparung
  const maximumEinsparung = calculateGesamtAusgaben(situation) * 0.35 // 35% Einsparung

  const vergleich = generateSzenarioVergleich(situation, optimiertEinsparung, maximumEinsparung, rendite)

  const chartData = [
    {
      name: 'Nach 10 Jahren',
      Jetzt: vergleich.jetzt.nach10Jahren,
      Optimiert: vergleich.optimiert.nach10Jahren,
      Maximum: vergleich.maximum.nach10Jahren,
    },
    {
      name: 'Nach 20 Jahren',
      Jetzt: vergleich.jetzt.nach20Jahren,
      Optimiert: vergleich.optimiert.nach20Jahren,
      Maximum: vergleich.maximum.nach20Jahren,
    },
    {
      name: 'Nach 30 Jahren',
      Jetzt: vergleich.jetzt.nach30Jahren,
      Optimiert: vergleich.optimiert.nach30Jahren,
      Maximum: vergleich.maximum.nach30Jahren,
    },
  ]

  const getVermoegensZiel = (betrag: number): string => {
    if (betrag >= 500000) return 'Eine Eigentumswohnung'
    if (betrag >= 300000) return '10 Jahre früher in Rente'
    if (betrag >= 200000) return 'Finanzielle Freiheit'
    if (betrag >= 100000) return 'Ein neues Auto'
    return 'Ein schöner Urlaub'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-6 w-6 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-900">Szenario-Vergleich</h3>
      </div>

      <p className="text-sm text-gray-600">
        Vergleiche deine aktuelle Situation mit optimierten Szenarien. Was könntest du dir mit dem
        zusätzlichen Vermögen leisten?
      </p>

      {/* 3 Spalten Vergleich */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* JETZT */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <h4 className="font-semibold text-gray-900">JETZT</h4>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Monatliche Sparrate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatEuro(vergleich.jetzt.monatlicheSparrate)}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Nach 10 Jahren</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatEuro(vergleich.jetzt.nach10Jahren)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nach 20 Jahren</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatEuro(vergleich.jetzt.nach20Jahren)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nach 30 Jahren</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatEuro(vergleich.jetzt.nach30Jahren)}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">Damit könntest du dir leisten:</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {getVermoegensZiel(vergleich.jetzt.nach30Jahren)}
              </p>
            </div>
          </div>
        </div>

        {/* OPTIMIERT */}
        <div className="bg-blue-50 rounded-lg border-2 border-blue-300 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h4 className="font-semibold text-gray-900">OPTIMIERT</h4>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
              -15% Ausgaben
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Monatliche Sparrate</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatEuro(vergleich.optimiert.monatlicheSparrate)}
              </p>
            </div>
            <div className="pt-3 border-t border-blue-200 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Nach 10 Jahren</p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatEuro(vergleich.optimiert.nach10Jahren)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nach 20 Jahren</p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatEuro(vergleich.optimiert.nach20Jahren)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nach 30 Jahren</p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatEuro(vergleich.optimiert.nach30Jahren)}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600">Damit könntest du dir leisten:</p>
              <p className="text-sm font-semibold text-blue-900 mt-1">
                {getVermoegensZiel(vergleich.optimiert.nach30Jahren)}
              </p>
            </div>
          </div>
        </div>

        {/* MAXIMUM */}
        <div className="bg-green-50 rounded-lg border-2 border-green-300 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h4 className="font-semibold text-gray-900">MAXIMUM</h4>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
              -35% Ausgaben
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Monatliche Sparrate</p>
              <p className="text-2xl font-bold text-green-700">
                {formatEuro(vergleich.maximum.monatlicheSparrate)}
              </p>
            </div>
            <div className="pt-3 border-t border-green-200 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Nach 10 Jahren</p>
                <p className="text-lg font-semibold text-green-700">
                  {formatEuro(vergleich.maximum.nach10Jahren)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nach 20 Jahren</p>
                <p className="text-lg font-semibold text-green-700">
                  {formatEuro(vergleich.maximum.nach20Jahren)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nach 30 Jahren</p>
                <p className="text-lg font-semibold text-green-700">
                  {formatEuro(vergleich.maximum.nach30Jahren)}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-green-200">
              <p className="text-xs text-gray-600">Damit könntest du dir leisten:</p>
              <p className="text-sm font-semibold text-green-900 mt-1">
                {getVermoegensZiel(vergleich.maximum.nach30Jahren)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Vergleich über die Zeit</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatEuro(value)} />
            <Legend />
            <Bar dataKey="Jetzt" fill="#9ca3af" />
            <Bar dataKey="Optimiert" fill="#3b82f6" />
            <Bar dataKey="Maximum" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

