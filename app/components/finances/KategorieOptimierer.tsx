"use client"

import { compareWithDurchschnitt, formatEuro } from './utils'
import type { FinanzielleSituation } from './types'
import { TrendingDown, Lightbulb, ArrowRight } from 'lucide-react'

interface KategorieOptimiererProps {
  situation: FinanzielleSituation
}

export default function KategorieOptimierer({ situation }: KategorieOptimiererProps) {
  const alleKategorien = [...situation.fixkosten, ...situation.variableKosten].filter(
    (k) => k.betrag > 0
  )

  const vergleiche = alleKategorien
    .map((k) => compareWithDurchschnitt(k.name, k.betrag, k.durchschnitt))
    .filter((v) => v.differenz > 0) // Nur Kategorien über dem Durchschnitt
    .sort((a, b) => b.potenzial - a.potenzial) // Höchstes Potenzial zuerst

  const gesamtPotenzial = vergleiche.reduce((sum, v) => sum + v.potenzial, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-6 w-6 text-yellow-600" />
        <h3 className="text-xl font-semibold text-gray-900">Kategorie-Optimierer</h3>
      </div>

      <p className="text-sm text-gray-600">
        Finde heraus, wo du im Vergleich zum Durchschnitt mehr ausgibst und wie viel du
        potenziell sparen könntest.
      </p>

      {/* Gesamt-Potenzial */}
      {gesamtPotenzial > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Gesamt-Sparpotenzial</p>
              <p className="text-3xl font-bold text-orange-700">{formatEuro(gesamtPotenzial)}</p>
              <p className="text-xs text-gray-600 mt-1">pro Monat</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Pro Jahr</p>
              <p className="text-2xl font-semibold text-orange-600">
                {formatEuro(gesamtPotenzial * 12)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Kategorien */}
      <div className="space-y-4">
        {vergleiche.length > 0 ? (
          vergleiche.map((vergleich) => (
            <div
              key={vergleich.kategorie}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-orange-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">{vergleich.kategorie}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Aktuell</p>
                      <p className="font-semibold text-gray-900">{formatEuro(vergleich.aktuell)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Durchschnitt</p>
                      <p className="font-semibold text-gray-700">{formatEuro(vergleich.durchschnitt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Potenzial</p>
                      <p className="font-bold text-orange-600">
                        -{formatEuro(vergleich.potenzial)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                    +{vergleich.prozentAbweichung.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (vergleich.aktuell / (vergleich.durchschnitt * 2)) * 100)}%`,
                  }}
                />
              </div>

              {/* Call-to-Action */}
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                <Lightbulb className="h-4 w-4" />
                Tipps zum Sparen in dieser Kategorie
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingDown className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Super! Du liegst bei allen Kategorien unter dem Durchschnitt.</p>
          </div>
        )}
      </div>
    </div>
  )
}

