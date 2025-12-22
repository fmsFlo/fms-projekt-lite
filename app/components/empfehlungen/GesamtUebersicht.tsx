'use client'

import { useState } from 'react'
import { TrendingDown, TrendingUp, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { Empfehlung } from './types'
import { calculateGesamtErgebnis, formatEuro, calculateEinsparungUeberJahre, calculateEinsparungMitZinseszins } from './utils'

interface GesamtUebersichtProps {
  empfehlungen: Empfehlung[]
}

export default function GesamtUebersicht({ empfehlungen }: GesamtUebersichtProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const {
    gesamtDifferenzMonatlich,
    gesamtDifferenzJaehrlich,
    gesamtEinsparungMonatlich,
    gesamtMehrkostenMonatlich,
    anzahlOptimierungen,
  } = calculateGesamtErgebnis(empfehlungen)

  const istEinsparung = gesamtDifferenzMonatlich < 0
  const istMehrkosten = gesamtDifferenzMonatlich > 0

  const einsparung10Jahre = calculateEinsparungUeberJahre(Math.abs(gesamtDifferenzMonatlich), 10)
  const einsparung20Jahre = calculateEinsparungUeberJahre(Math.abs(gesamtDifferenzMonatlich), 20)
  const einsparung10JahreMitZins = calculateEinsparungMitZinseszins(Math.abs(gesamtDifferenzMonatlich), 10)
  const einsparung20JahreMitZins = calculateEinsparungMitZinseszins(Math.abs(gesamtDifferenzMonatlich), 20)

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {anzahlOptimierungen} {anzahlOptimierungen === 1 ? 'Optimierung' : 'Optimierungen'}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-1 rounded hover:opacity-80"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <span className="text-sm">Details anzeigen</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header mit Ausblenden-Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Gesamtübersicht
        </h2>
        <button
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-2 px-3 py-1 rounded hover:opacity-80"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-sm">Ausblenden</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gesamt-Differenz (Einsparung oder Mehrkosten) */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: istEinsparung ? '#ECFDF5' : istMehrkosten ? '#FEF2F2' : '#F3F4F6',
            borderColor: istEinsparung ? '#10B981' : istMehrkosten ? '#DC2626' : '#6B7280',
            borderWidth: '2px',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-3 rounded-full"
              style={{
                backgroundColor: istEinsparung ? '#10B981' : istMehrkosten ? '#DC2626' : '#6B7280',
                color: 'white',
              }}
            >
              {istEinsparung ? (
                <TrendingDown className="w-6 h-6" />
              ) : istMehrkosten ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{
                  color: istEinsparung ? '#059669' : istMehrkosten ? '#DC2626' : '#6B7280',
                }}
              >
                {istEinsparung
                  ? 'Ihr Gesamt-Einsparpotenzial'
                  : istMehrkosten
                  ? 'Ihre Gesamt-Mehrkosten'
                  : 'Keine Änderung'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p
              className="text-3xl font-bold"
              style={{
                color: istEinsparung ? '#059669' : istMehrkosten ? '#DC2626' : '#6B7280',
              }}
            >
              {istEinsparung ? '-' : istMehrkosten ? '+' : ''}
              {formatEuro(Math.abs(gesamtDifferenzMonatlich))}
              <span className="text-lg font-normal ml-1">/Monat</span>
            </p>
            <p
              className="text-sm"
              style={{
                color: istEinsparung ? '#059669' : istMehrkosten ? '#DC2626' : '#6B7280',
              }}
            >
              {istEinsparung ? 'Ersparnis: ' : istMehrkosten ? 'Mehrkosten: ' : ''}
              {formatEuro(Math.abs(gesamtDifferenzJaehrlich))} pro Jahr
            </p>
          </div>
          {istEinsparung && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: '#10B981' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#059669' }}>
                    Nach 10 Jahren:
                  </p>
                  <p className="font-semibold" style={{ color: '#059669' }}>
                    {formatEuro(einsparung10Jahre)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#059669' }}>
                    Mit 6% Zins: {formatEuro(einsparung10JahreMitZins)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#059669' }}>
                    Nach 20 Jahren:
                  </p>
                  <p className="font-semibold" style={{ color: '#059669' }}>
                    {formatEuro(einsparung20Jahre)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#059669' }}>
                    Mit 6% Zins: {formatEuro(einsparung20JahreMitZins)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Anzahl Optimierungen */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Anzahl der Optimierungen
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {anzahlOptimierungen}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {anzahlOptimierungen === 1 ? 'Bereich optimierbar' : 'Bereiche optimierbar'}
            </p>
          </div>
        </div>
      </div>

      {/* Info-Box */}
      {istEinsparung && gesamtEinsparungMonatlich > 0 && (
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: '#FEF3C7',
            borderColor: '#F59E0B',
          }}
        >
          <p className="text-sm" style={{ color: '#92400E' }}>
            💡 Wenn Sie die {formatEuro(gesamtEinsparungMonatlich)} monatliche Ersparnis anlegen,
            haben Sie in 20 Jahren über {formatEuro(einsparung20JahreMitZins)} mehr Vermögen!
          </p>
        </div>
      )}
      {istMehrkosten && (
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: '#FEF2F2',
            borderColor: '#DC2626',
          }}
        >
          <p className="text-sm" style={{ color: '#991B1B' }}>
            ⚠️ Die Mehrkosten von {formatEuro(gesamtMehrkostenMonatlich)}/Monat führen zu einer
            besseren Absicherung und höheren Leistungen.
          </p>
        </div>
      )}
    </div>
  )
}

