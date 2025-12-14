"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import type { VersicherungsCheck } from './types'
import { calculateGesamtErgebnis } from './utils'
import { formatEuro } from '../finances/utils'
import { CheckCircle, XCircle, Plus, AlertTriangle } from 'lucide-react'

interface GesamtUebersichtProps {
  check: VersicherungsCheck
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function GesamtUebersicht({ check }: GesamtUebersichtProps) {
  const ergebnis = calculateGesamtErgebnis(check)

  // KPI Cards
  const kpiCards = [
    {
      title: 'AKTUELL',
      value: ergebnis.beitragVorher,
      subtitle: `${ergebnis.anzahlVorher} Versicherungen`,
      color: 'gray',
    },
    {
      title: 'EMPFOHLEN',
      value: ergebnis.beitragNachher,
      subtitle: `${ergebnis.anzahlNachher} Versicherungen`,
      color: 'blue',
    },
    {
      title: 'DIFFERENZ',
      value: ergebnis.differenz,
      subtitle: ergebnis.differenz < 0 ? '💰 GESPART' : '⚠️ MEHRKOSTEN',
      color: ergebnis.differenz < 0 ? 'green' : 'red',
    },
  ]

  // Chart Daten
  const versicherungsVergleich = check.versicherungen
    .filter((v) => v.vorher || v.nachher)
    .map((v) => ({
      name: v.typ.substring(0, 10),
      vorher: v.vorher?.beitragMonatlich || 0,
      nachher: v.nachher?.beitragMonatlich || 0,
    }))

  const pieData = [
    {
      name: 'Existenziell',
      value: check.versicherungen
        .filter((v) => ['phv', 'bu', 'rlv'].includes(v.typ))
        .reduce((sum, v) => sum + (v.nachher?.beitragMonatlich || v.vorher?.beitragMonatlich || 0), 0),
    },
    {
      name: 'Sach',
      value: check.versicherungen
        .filter((v) => ['hausrat', 'wohngebaeude', 'kfz', 'rechtsschutz'].includes(v.typ))
        .reduce((sum, v) => sum + (v.nachher?.beitragMonatlich || v.vorher?.beitragMonatlich || 0), 0),
    },
    {
      name: 'Optional',
      value: check.versicherungen
        .filter((v) => !['phv', 'bu', 'rlv', 'hausrat', 'wohngebaeude', 'kfz', 'rechtsschutz'].includes(v.typ))
        .reduce((sum, v) => sum + (v.nachher?.beitragMonatlich || v.vorher?.beitragMonatlich || 0), 0),
    },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.title}
            className={`rounded-xl border-2 p-6 ${
              kpi.color === 'gray'
                ? 'bg-gray-50 border-gray-200'
                : kpi.color === 'blue'
                ? 'bg-blue-50 border-blue-200'
                : kpi.color === 'green'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-2">
              {kpi.title}
            </h3>
            <p className={`text-4xl font-bold ${
              kpi.color === 'gray' ? 'text-gray-700' :
              kpi.color === 'blue' ? 'text-blue-700' :
              kpi.color === 'green' ? 'text-green-700' : 'text-red-700'
            }`}>
              {formatEuro(kpi.value)}
            </p>
            <p className="text-xs mt-2 opacity-70">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Einsparungs-Hochrechnung */}
      {ergebnis.anlageGesamt.monatlicheBeitrag > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Einsparungs-Hochrechnung
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">OHNE ANLAGE (nur gespart)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1 Jahr:</span>
                  <span className="font-semibold">{formatEuro(ergebnis.anlageGesamt.monatlicheBeitrag * 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span>5 Jahre:</span>
                  <span className="font-semibold">{formatEuro(ergebnis.anlageGesamt.monatlicheBeitrag * 12 * 5)}</span>
                </div>
                <div className="flex justify-between">
                  <span>10 Jahre:</span>
                  <span className="font-semibold">{formatEuro(ergebnis.anlageGesamt.monatlicheBeitrag * 12 * 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span>20 Jahre:</span>
                  <span className="font-semibold">{formatEuro(ergebnis.anlageGesamt.monatlicheBeitrag * 12 * 20)}</span>
                </div>
                <div className="flex justify-between">
                  <span>30 Jahre:</span>
                  <span className="font-semibold">{formatEuro(ergebnis.anlageGesamt.monatlicheBeitrag * 12 * 30)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">MIT ANLAGE (6% p.a.)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1 Jahr:</span>
                  <span className="font-semibold text-green-600">{formatEuro(ergebnis.anlageGesamt.nach1Jahr)}</span>
                </div>
                <div className="flex justify-between">
                  <span>5 Jahre:</span>
                  <span className="font-semibold text-green-600">{formatEuro(ergebnis.anlageGesamt.nach5Jahren)}</span>
                </div>
                <div className="flex justify-between">
                  <span>10 Jahre:</span>
                  <span className="font-semibold text-green-600">{formatEuro(ergebnis.anlageGesamt.nach10Jahren)}</span>
                </div>
                <div className="flex justify-between">
                  <span>20 Jahre:</span>
                  <span className="font-semibold text-green-600">{formatEuro(ergebnis.anlageGesamt.nach20Jahren)}</span>
                </div>
                <div className="flex justify-between">
                  <span>30 Jahre:</span>
                  <span className="font-semibold text-green-600">{formatEuro(ergebnis.anlageGesamt.nach30Jahren)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ergebnis.anlageGesamt.verlaufDaten}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="jahr" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatEuro(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="ohneAnlage"
                stackId="1"
                stroke="#9ca3af"
                fill="#9ca3af"
                name="Ohne Anlage"
              />
              <Area
                type="monotone"
                dataKey="mitAnlage"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                name="Mit Anlage (6%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Zusammenfassung */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Zusammenfassung der Optimierungen</h3>
        
        {ergebnis.optimierungen.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Optimiert (behalten/verbessert):
            </h4>
            <ul className="space-y-1 text-sm">
              {ergebnis.optimierungen.map((opt, idx) => (
                <li key={idx} className="text-gray-600">
                  • {opt.name}: {opt.highlights.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ergebnis.einsparungen.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600" />
              Nicht mehr nötig (einsparen):
            </h4>
            <ul className="space-y-1 text-sm">
              {ergebnis.einsparungen.map((einsparung, idx) => (
                <li key={idx} className="text-gray-600">
                  • {einsparung.name}: {formatEuro(Math.abs(einsparung.differenz))}/Monat
                </li>
              ))}
            </ul>
          </div>
        )}

        {ergebnis.neuEmpfehlungen.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              Wichtige Lücken schließen:
            </h4>
            <ul className="space-y-1 text-sm">
              {ergebnis.neuEmpfehlungen.map((neu, idx) => (
                <li key={idx} className="text-gray-600">
                  • {neu.name}: +{formatEuro(neu.differenz)}/Monat
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gesamt-Ergebnis */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">GESAMT-ERGEBNIS:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Einsparung bei bestehenden:</span>
                <span className="font-semibold text-green-700">
                  {formatEuro(Math.abs(ergebnis.einsparungen.reduce((sum, e) => sum + e.differenz, 0)))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Neue sinnvolle Absicherungen:</span>
                <span className="font-semibold text-blue-700">
                  +{formatEuro(ergebnis.neuEmpfehlungen.reduce((sum, n) => sum + n.differenz, 0))}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between font-bold">
                <span>NETTO-MEHRKOSTEN:</span>
                <span className={ergebnis.differenz < 0 ? 'text-green-700' : 'text-red-700'}>
                  {ergebnis.differenz < 0 ? '-' : '+'}
                  {formatEuro(Math.abs(ergebnis.differenz))}/Monat
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Versicherungs-Budget-Verteilung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatEuro(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kosten-Vergleich pro Versicherung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={versicherungsVergleich}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatEuro(value)} />
              <Legend />
              <Bar dataKey="vorher" fill="#9ca3af" name="Vorher" />
              <Bar dataKey="nachher" fill="#10b981" name="Nachher" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

