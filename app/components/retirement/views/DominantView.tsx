"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import type { RetirementData } from '../types'

interface DominantViewProps {
  data: RetirementData
  onActionClick?: () => void
}

export default function DominantView({ data, onActionClick }: DominantViewProps) {
  const [showDetails, setShowDetails] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const standardLoss = Math.round((data.gap / data.targetPension) * 100)

  return (
    <div className="w-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: '#DC2626' }}
          >
            DEINE RENTENLÜCKE
          </h2>
        </div>

        {/* Giant Number */}
        <div className="text-center mb-8">
          <div 
            className="text-5xl md:text-7xl font-bold mb-2"
            style={{ color: '#DC2626' }}
          >
            {formatCurrency(data.gap)}
          </div>
          <div className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>
            / Monat
          </div>
        </div>

        {/* Bottom Line */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
            <span className="text-2xl">✗</span>
            <div>
              <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Ohne Handeln: -{standardLoss}% Lebensstandard
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <span className="text-2xl">✓</span>
            <div>
              <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Mit Lösung: Lebensstandard gesichert
              </div>
            </div>
          </div>
        </div>

        {/* Big Action Button */}
        <div className="mb-6">
          <button
            onClick={onActionClick}
            className="w-full py-4 px-6 rounded-lg font-bold text-lg text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: '#DC2626' }}
          >
            <div className="flex items-center justify-center gap-2">
              Jetzt Lösung sichern
              <ArrowRight size={20} />
            </div>
          </button>
        </div>

        {/* Details Toggle */}
        <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span>Details anzeigen</span>
            {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showDetails && (
            <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="flex justify-between">
                <span>Zielrente:</span>
                <span className="font-medium">{formatCurrency(data.targetPension)}</span>
              </div>
              <div className="flex justify-between">
                <span>Aktuelle Deckung:</span>
                <span className="font-medium">{formatCurrency(data.currentCoverage)}</span>
              </div>
              <div className="flex justify-between">
                <span>Deckungsgrad:</span>
                <span className="font-medium">{data.coveragePercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Erforderliche Sparrate:</span>
                <span className="font-medium">{formatCurrency(data.requiredMonthlySavings)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Stand: {formatDate()}
        </div>
      </div>
    </div>
  )
}

