"use client"

import { getIcon } from '@/app/components/finances/iconHelper'
import { formatEuro } from './utils'
import type { Ausgabenkategorie } from './types'

interface AusgabenKategorieCardProps {
  kategorie: Ausgabenkategorie
  gesamtAusgaben: number
  onEdit?: (id: string) => void
  showVergleich?: boolean
}

export default function AusgabenKategorieCard({
  kategorie,
  gesamtAusgaben,
  onEdit,
  showVergleich = false,
}: AusgabenKategorieCardProps) {
  const prozent = gesamtAusgaben > 0 ? (kategorie.betrag / gesamtAusgaben) * 100 : 0
  const IconComponent = kategorie.icon ? getIcon(kategorie.icon) : null

  const vergleich =
    showVergleich && kategorie.durchschnitt
      ? {
          differenz: kategorie.betrag - kategorie.durchschnitt,
          prozentAbweichung: kategorie.durchschnitt > 0 ? ((kategorie.betrag - kategorie.durchschnitt) / kategorie.durchschnitt) * 100 : 0,
        }
      : null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {IconComponent && (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-gray-600" />
            </div>
          )}
          <div>
            <h4 className="font-semibold text-gray-900">{kategorie.name}</h4>
            {kategorie.beschreibung && (
              <p className="text-xs text-gray-500">{kategorie.beschreibung}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">{formatEuro(kategorie.betrag)}</p>
          <p className="text-xs text-gray-500">{prozent.toFixed(1)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(100, prozent)}%` }}
        />
      </div>

      {/* Vergleich mit Durchschnitt */}
      {showVergleich && vergleich && kategorie.durchschnitt && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Durchschnitt: {formatEuro(kategorie.durchschnitt)}</span>
            {vergleich.differenz !== 0 && (
              <span
                className={`font-semibold ${
                  vergleich.differenz > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {vergleich.differenz > 0 ? '+' : ''}
                {formatEuro(vergleich.differenz)} ({vergleich.prozentAbweichung > 0 ? '+' : ''}
                {vergleich.prozentAbweichung.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {onEdit && (
        <button
          onClick={() => onEdit(kategorie.id)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Bearbeiten
        </button>
      )}
    </div>
  )
}

