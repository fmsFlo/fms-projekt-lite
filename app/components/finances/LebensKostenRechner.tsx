"use client"

import { calculateLebensKosten, formatEuro } from './utils'
import type { FinanzielleSituation } from './types'
import { AlertCircle, Coffee, Film } from 'lucide-react'

interface LebensKostenRechnerProps {
  situation: FinanzielleSituation
  aktuellesAlter?: number
  rentenAlter?: number
}

export default function LebensKostenRechner({
  situation,
  aktuellesAlter = 30,
  rentenAlter = 67,
}: LebensKostenRechnerProps) {
  const alleKosten = [...situation.fixkosten, ...situation.variableKosten].filter((k) => k.betrag > 0)

  const schockEffekte: Record<string, string> = {
    'Restaurants/Essen gehen': 'Dein täglicher Kaffee to go (4€/Tag) kostet dich bis zur Rente: 64.680€',
    'Streaming/Abos': 'Deine Streaming-Abos (40€/Monat) kosten dich bis zur Rente: 17.760€',
    'Shopping/Kleidung': 'Dein Shopping (150€/Monat) kostet dich bis zur Rente: 66.600€',
    'Freizeit/Hobbys': 'Deine Freizeitausgaben (200€/Monat) kosten dich bis zur Rente: 88.800€',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-6 w-6 text-orange-600" />
        <h3 className="text-xl font-semibold text-gray-900">Kosten-auf-Lebenszeit-Rechner</h3>
      </div>

      <p className="text-sm text-gray-600">
        Sieh, wie sich kleine monatliche Ausgaben über Jahrzehnte summieren. Diese Zahlen können
        schockierend sein!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alleKosten.map((kategorie) => {
          const ergebnis = calculateLebensKosten(kategorie.betrag, aktuellesAlter, rentenAlter)
          const schockEffekt = schockEffekte[kategorie.name]

          return (
            <div
              key={kategorie.id}
              className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-4 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900 mb-2">{kategorie.name}</h4>
              <p className="text-xs text-gray-600 mb-3">
                {formatEuro(kategorie.betrag)}/Monat
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nach 10 Jahren:</span>
                  <span className="font-semibold text-gray-900">
                    {formatEuro(ergebnis.nach10Jahren)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nach 20 Jahren:</span>
                  <span className="font-semibold text-gray-900">
                    {formatEuro(ergebnis.nach20Jahren)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nach 30 Jahren:</span>
                  <span className="font-semibold text-gray-900">
                    {formatEuro(ergebnis.nach30Jahren)}
                  </span>
                </div>
                <div className="pt-2 border-t border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bis zur Rente:</span>
                    <span className="font-bold text-lg text-orange-700">
                      {formatEuro(ergebnis.bisRente)}
                    </span>
                  </div>
                </div>
              </div>

              {schockEffekt && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-orange-800 italic flex items-start gap-1">
                    <Coffee className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {schockEffekt}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>Denk daran:</strong> Diese Beträge könnten stattdessen investiert werden und
          durch Zinseszins noch deutlich mehr wert sein!
        </p>
      </div>
    </div>
  )
}

