"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Calculator } from 'lucide-react'
import type { RetirementData } from '../types'

interface ConscientiousViewProps {
  data: RetirementData
  onActionClick?: () => void
}

export default function ConscientiousView({ data, onActionClick }: ConscientiousViewProps) {
  const [showMethodology, setShowMethodology] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="w-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-2xl md:text-3xl font-semibold mb-2"
            style={{ color: '#3B82F6' }}
          >
            Detaillierte Rentenanalyse
          </h2>
        </div>

        {/* Quick Preview */}
        <div className="mb-8 p-6 rounded-lg border-2" style={{ 
          borderColor: '#3B82F6',
          backgroundColor: 'var(--color-bg-secondary)',
        }}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Deckungsgrad deiner Zielrente:
              </span>
              <span className="text-lg font-bold" style={{ color: '#3B82F6' }}>
                {data.coveragePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${data.coveragePercentage}%`,
                  backgroundColor: '#3B82F6',
                }}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Bisher gedeckt
                </div>
                <div className="text-lg font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(data.currentCoverage)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  gesetzlich + privat
                </div>
              </div>
              
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Aktuelle Lücke
                </div>
                <div className="text-lg font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(data.gap)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  vor neuer Sparrate
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Ziel (Netto)
                </div>
                <div className="text-lg font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(data.targetPension)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  monatl. Wunschziel
                </div>
              </div>
              
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Kapitalbedarf
                </div>
                <div className="text-lg font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(data.capitalNeeded)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  für {data.yearsInRetirement} J. Ruhestand
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Calculation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Calculator size={20} style={{ color: '#3B82F6' }} />
            Detaillierte Berechnung
          </h3>
          <div className="space-y-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Gesetzliche Rente:</span>
              <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(data.statutoryNetFuture)}
              </span>
            </div>
            {data.privateNetFuture > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Private Vorsorge:</span>
                <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(data.privateNetFuture)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Inflation:</span>
              <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {(data.inflationRate * 100).toFixed(1)}% p.a. berücksichtigt
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Rentendauer:</span>
              <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {data.yearsInRetirement} Jahre (bis Alter {data.lifeExpectancy})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Kapitalverzinsung:</span>
              <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {(data.returnRate * 100).toFixed(1)}% p.a.
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Erforderliche Sparrate:</span>
              <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(data.requiredMonthlySavings)} / Monat
              </span>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="mb-6">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div className="flex items-center gap-2">
              <FileText size={18} style={{ color: '#3B82F6' }} />
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Berechnungsmethodik
              </span>
            </div>
            {showMethodology ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showMethodology && (
            <div className="mt-2 p-4 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <div className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <p>• Kapitalbedarf = Zielrente × 12 × Rentendauer (inflationsbereinigt)</p>
                <p>• Erforderliche Sparrate basiert auf Annuitätenmethode</p>
                <p>• Steuerliche Behandlung nach aktueller Gesetzgebung</p>
                <p>• Inflation: {(data.inflationRate * 100).toFixed(1)}% p.a. (historischer Durchschnitt)</p>
                <p>• Rendite: {(data.returnRate * 100).toFixed(1)}% p.a. (konservativ geschätzt)</p>
              </div>
            </div>
          )}
        </div>

        {/* Data Sources */}
        <div className="mb-6">
          <button
            onClick={() => setShowSources(!showSources)}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div className="flex items-center gap-2">
              <FileText size={18} style={{ color: '#3B82F6' }} />
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Datenquellen
              </span>
            </div>
            {showSources ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showSources && (
            <div className="mt-2 p-4 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <div className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <p>• Deutsche Rentenversicherung (Stand: {new Date().getFullYear()})</p>
                <p>• Statistisches Bundesamt (Lebenserwartung)</p>
                <p>• Bundesministerium der Finanzen (Steuersätze)</p>
                <p>• Aktuelle Gesetzgebung (Rentenrecht, Steuerrecht)</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs space-y-1" style={{ color: 'var(--color-text-tertiary)' }}>
          <div>Stand: {formatDate()}</div>
          <div>Nächste Aktualisierung: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}</div>
        </div>
      </div>
    </div>
  )
}

