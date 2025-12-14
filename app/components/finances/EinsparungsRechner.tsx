"use client"

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { calculateAnlageErgebnis, formatEuro } from './utils'
import type { FinanzielleSituation, Ausgabenkategorie } from './types'
import { TrendingUp, Target } from 'lucide-react'

interface EinsparungsRechnerProps {
  situation: FinanzielleSituation
}

export default function EinsparungsRechner({ situation }: EinsparungsRechnerProps) {
  const [selectedKategorie, setSelectedKategorie] = useState<string>('')
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const [aktuellerBetrag, setAktuellerBetrag] = useState(200)
  const [zielBetrag, setZielBetrag] = useState(100)
  const [anlagehorizont, setAnlagehorizont] = useState(10)
  const [rendite, setRendite] = useState(7)

  const einsparung = Math.max(0, aktuellerBetrag - zielBetrag)
  const ergebnis = calculateAnlageErgebnis(einsparung, anlagehorizont, rendite)

  const alleKategorien = [...situation.fixkosten, ...situation.variableKosten].filter(
    (k) => k.betrag > 0
  )

  const handleKategorieSelect = (kategorie: Ausgabenkategorie) => {
    setSelectedKategorie(kategorie.id)
    setCustomMode(false)
    setCustomName('')
    setAktuellerBetrag(kategorie.betrag)
    setZielBetrag(Math.round(kategorie.betrag * 0.5)) // 50% als Vorschlag
  }

  const handleCustomMode = () => {
    setCustomMode(true)
    setSelectedKategorie('')
    setCustomName('')
    setAktuellerBetrag(0)
    setZielBetrag(0)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Einsparungs-Rechner mit Anlage</h3>
      </div>

      <p className="text-sm text-gray-600">
        Berechne, wie viel Vermögen du aufbauen kannst, wenn du bei einer Kategorie sparst und das
        Geld stattdessen anlegst.
      </p>

      {/* Kategorie auswählen */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Kategorie auswählen
          </label>
          <button
            onClick={handleCustomMode}
            className={`text-sm px-3 py-1 rounded-lg border transition-all ${
              customMode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
            }`}
          >
            + Individueller Betrag
          </button>
        </div>
        
        {customMode ? (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bezeichnung (z.B. "Rauchen", "Kaffee to go")
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="z.B. Rauchen"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monatlicher Betrag (€)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={aktuellerBetrag || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  setAktuellerBetrag(val)
                  setZielBetrag(Math.round(val * 0.5))
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="200"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {alleKategorien.slice(0, 8).map((kategorie) => (
              <button
                key={kategorie.id}
                onClick={() => handleKategorieSelect(kategorie)}
                className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                  selectedKategorie === kategorie.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {kategorie.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Eingaben */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aktueller Betrag: {formatEuro(aktuellerBetrag)}/Monat
          </label>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={aktuellerBetrag}
            onChange={(e) => setAktuellerBetrag(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ziel-Betrag: {formatEuro(zielBetrag)}/Monat
          </label>
          <input
            type="range"
            min="0"
            max={aktuellerBetrag}
            step="10"
            value={zielBetrag}
            onChange={(e) => setZielBetrag(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anlagehorizont: {anlagehorizont} Jahre
          </label>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={anlagehorizont}
            onChange={(e) => setAnlagehorizont(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Erwartete Rendite: {rendite.toFixed(1)}% p.a.
          </label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.1"
            value={rendite}
            onChange={(e) => setRendite(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Ergebnis */}
      {einsparung > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border-2 border-blue-200 p-6">
          <p className="text-sm text-gray-600 mb-4">
            Wenn du <strong>{formatEuro(einsparung)}</strong> weniger für{' '}
            <strong>{customMode ? customName || 'diesen Posten' : alleKategorien.find(k => k.id === selectedKategorie)?.name || 'diese Kategorie'}</strong> ausgibst
            und stattdessen anlegst...
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Nach {anlagehorizont} Jahren</p>
              <p className="text-3xl font-bold text-blue-700">{formatEuro(ergebnis.endkapital)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Einzahlungen</p>
              <p className="text-2xl font-semibold text-gray-700">{formatEuro(ergebnis.einzahlungen)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Zinsen/Rendite</p>
              <p className="text-2xl font-semibold text-green-600">{formatEuro(ergebnis.zinsenGewinn)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Monatliche Ersparnis</p>
              <p className="text-2xl font-semibold text-purple-600">{formatEuro(einsparung)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Verlauf über die Zeit</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={ergebnis.verlaufDaten}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jahr" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatEuro(value)}
                  labelFormatter={(label) => `Jahr ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="kapital"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  name="Gesamtkapital"
                />
                <Area
                  type="monotone"
                  dataKey="einzahlungen"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  name="Einzahlungen"
                />
                <Area
                  type="monotone"
                  dataKey="zinsen"
                  stackId="2"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  name="Zinsen/Rendite"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

