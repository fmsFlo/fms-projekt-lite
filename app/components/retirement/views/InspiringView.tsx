"use client"

import { useState } from 'react'
import { Sparkles, Plane, Heart, Users } from 'lucide-react'
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
              background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            DEINE RENTEN-GESCHICHTE <Sparkles size={28} className="inline" style={{ color: '#F59E0B' }} />
          </h2>
        </div>

        {/* Dream Retirement Visual */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ 
            background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)',
          }}>
            <Heart size={40} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Dein Traum-Ruhestand
          </h3>
        </div>

        {/* Numbers */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Du willst:</span>
            <span className="text-xl font-bold" style={{ color: '#F59E0B' }}>
              {formatCurrency(data.targetPension)} / Monat
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Du bekommst:</span>
            <span className="text-xl font-bold" style={{ color: '#3B82F6' }}>
              {formatCurrency(data.currentCoverage)} / Monat
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Deine Lücke:</span>
            <span className="text-xl font-bold" style={{ color: '#EC4899' }}>
              {formatCurrency(data.gap)} / Monat
            </span>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: scenario === 'without' ? '#DC2626' : 'var(--color-text-secondary)' }}>
              ← Ohne Vorsorge
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
                ? `Nur ${formatCurrency(data.currentCoverage)} / Monat verfügbar`
                : `${formatCurrency(data.targetPension)} / Monat gesichert`}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {scenario === 'without' 
                ? 'Lebensstandard muss reduziert werden'
                : 'Dein Traum-Ruhestand ist möglich!'}
            </div>
          </div>
        </div>

        {/* Emotional Copy */}
        <div className="mb-8 p-6 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        }}>
          <div className="space-y-3 text-center">
            <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
              Stell dir vor: <Plane className="inline mx-1" size={20} style={{ color: '#F59E0B' }} /> Reisen wohin du willst. 
              <Users className="inline mx-1" size={20} style={{ color: '#EC4899' }} /> Zeit mit deinen Liebsten. 
              Hobbys ohne finanzielle Sorgen.
            </p>
            <p className="text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Das ist möglich! Lass uns gemeinsam deinen Weg dorthin gestalten.
            </p>
          </div>
        </div>

        {/* Colorful Action Button */}
        <div className="mb-6">
          <button
            onClick={onActionClick}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              Meine Zukunft sichern <Sparkles size={20} />
            </div>
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Dein Fortschritt:
            </span>
            <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>
              {progressPercentage.toFixed(1)}% gedeckt
            </span>
          </div>
          <div className="w-full h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercentage}%`,
                background: 'linear-gradient(90deg, #F59E0B 0%, #EC4899 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

