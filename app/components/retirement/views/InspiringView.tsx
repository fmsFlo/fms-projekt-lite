"use client"

import { useState } from 'react'
import { Sparkles, Plane, Sun, Users, Target } from 'lucide-react'
import type { RetirementData } from '../types'

interface InspiringViewProps {
  data: RetirementData
  onActionClick?: () => void
}

export default function InspiringView({ data, onActionClick }: InspiringViewProps) {
  const [scenario, setScenario] = useState<'without' | 'with'>('without')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const progressPercentage = data.coveragePercentage

  return (
    <div className="w-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        {/* Header with Emoji */}
        <div className="text-center mb-8">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2"
            style={{ 
              background: 'linear-gradient(135deg, #FDB913 0%, #FF8C42 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            DEINE MÖGLICHKEITEN IM RUHESTAND <Sun size={28} className="inline" style={{ color: '#FDB913' }} />
          </h2>
        </div>

        {/* Active Retirement Visual */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ 
            background: 'linear-gradient(135deg, #FDB913 0%, #FF8C42 100%)',
          }}>
            <Sun size={40} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Deine Freiheit im Ruhestand
          </h3>
        </div>

        {/* Numbers */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(253, 185, 19, 0.1)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Für aktiven Lifestyle:</span>
            <span className="text-xl font-bold" style={{ color: '#FDB913' }}>
              {formatCurrency(data.targetPension)} / Monat
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Garantiert sicher:</span>
            <span className="text-xl font-bold" style={{ color: '#3B82F6' }}>
              {formatCurrency(data.currentCoverage)} / Monat
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Gestaltungsspielraum:</span>
            <span className="text-xl font-bold" style={{ color: '#FF8C42' }}>
              {formatCurrency(data.gap)} / Monat
            </span>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: scenario === 'without' ? '#DC2626' : 'var(--color-text-secondary)' }}>
              ← Ohne zusätzliche Vorsorge
            </span>
            <span className="text-sm font-medium" style={{ color: scenario === 'with' ? '#10B981' : 'var(--color-text-secondary)' }}>
              Mit Vorsorge →
            </span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={scenario === 'without' ? 0 : 100}
              onChange={(e) => setScenario(e.target.value === '0' ? 'without' : 'with')}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: scenario === 'without' 
                  ? 'linear-gradient(to right, #DC2626 0%, #DC2626 50%, #E5E7EB 50%, #E5E7EB 100%)'
                  : 'linear-gradient(to right, #E5E7EB 0%, #E5E7EB 50%, #10B981 50%, #10B981 100%)',
              }}
            />
          </div>
          
          <div className="mt-4 p-4 rounded-lg text-center" style={{ 
            backgroundColor: scenario === 'without' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          }}>
            <div className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {scenario === 'without' 
                ? `Erforderliche Sparrate: ${formatCurrency(data.requiredMonthlySavings)} / Monat`
                : `${formatCurrency(data.targetPension)} / Monat gesichert`}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {scenario === 'without' 
                ? `Um die Lücke von ${formatCurrency(data.gap)} / Monat zu schließen`
                : 'Deine Möglichkeiten sind gesichert!'}
            </div>
          </div>
        </div>

        {/* Motivational Copy */}
        <div className="mb-8 p-6 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(253, 185, 19, 0.1) 0%, rgba(255, 140, 66, 0.1) 100%)',
        }}>
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Mehr Möglichkeiten:
            </p>
            <div className="space-y-2 text-base" style={{ color: 'var(--color-text-primary)' }}>
              <p>
                <Plane className="inline mx-1" size={18} style={{ color: '#FDB913' }} /> 
                Spontane Reisen und neue Erlebnisse
              </p>
              <p>
                <Target className="inline mx-1" size={18} style={{ color: '#FF8C42' }} /> 
                Hobbys und Aktivitäten ohne Einschränkungen
              </p>
              <p>
                <Users className="inline mx-1" size={18} style={{ color: '#FDB913' }} /> 
                Großzügigkeit für Familie und Freunde
              </p>
            </div>
            <p className="text-base font-medium mt-4" style={{ color: 'var(--color-text-primary)' }}>
              So schließt du die Lücke und gewinnst Gestaltungsfreiheit.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={onActionClick}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #FDB913 0%, #FF8C42 100%)',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              Freiheit sichern <Sparkles size={20} />
            </div>
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Dein Fortschritt:
            </span>
            <span className="text-sm font-bold" style={{ color: '#FDB913' }}>
              {progressPercentage.toFixed(1)}% gedeckt
            </span>
          </div>
          <div className="w-full h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercentage}%`,
                background: 'linear-gradient(90deg, #FDB913 0%, #FF8C42 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

