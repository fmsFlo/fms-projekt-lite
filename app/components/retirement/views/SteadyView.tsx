"use client"

import { Check, Shield, Lock, FileText, Home, Users, TrendingUp } from 'lucide-react'
import type { RetirementData } from '../types'

interface SteadyViewProps {
  data: RetirementData
  onActionClick?: () => void
}

export default function SteadyView({ data, onActionClick }: SteadyViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="w-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ 
            backgroundColor: 'rgba(60, 179, 113, 0.1)',
          }}>
            <Shield size={36} style={{ color: '#3CB371' }} />
          </div>
          <h2 
            className="text-2xl md:text-3xl font-semibold mb-2"
            style={{ color: '#3CB371' }}
          >
            DEINE SICHERE ALTERSVORSORGE
          </h2>
        </div>

        {/* Main Numbers Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: 'var(--color-text-primary)' }}>
            Deine abgesicherte Zukunft
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(60, 179, 113, 0.1)' }}>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Gewünschter Lebensstandard:</span>
              <span className="text-xl font-bold" style={{ color: '#3CB371' }}>
                {formatCurrency(data.targetPension)} / Monat
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(74, 144, 226, 0.1)' }}>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Garantierte Grundsicherung:</span>
              <span className="text-xl font-bold" style={{ color: '#4A90E2' }}>
                {formatCurrency(data.currentCoverage)} / Monat
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Absicherungsbedarf:</span>
              <span className="text-xl font-bold" style={{ color: '#FF8C42' }}>
                {formatCurrency(data.gap)} / Monat
              </span>
            </div>
          </div>
        </div>

        {/* Motivational Copy */}
        <div className="mb-8 p-6 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(60, 179, 113, 0.1) 0%, rgba(74, 144, 226, 0.1) 100%)',
        }}>
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Was dir wichtig ist:
            </p>
            <div className="space-y-2 text-base" style={{ color: 'var(--color-text-primary)' }}>
              <p>
                <Home className="inline mx-1" size={18} style={{ color: '#3CB371' }} /> 
                Sorgenfreier Lebensabend im eigenen Zuhause
              </p>
              <p>
                <Users className="inline mx-1" size={18} style={{ color: '#4A90E2' }} /> 
                Familie unterstützen können
              </p>
              <p>
                <TrendingUp className="inline mx-1" size={18} style={{ color: '#3CB371' }} /> 
                Finanzielle Unabhängigkeit langfristig sichern
              </p>
            </div>
            <p className="text-base font-medium mt-4" style={{ color: 'var(--color-text-primary)' }}>
              Mit einem soliden Plan schließt du diese Lücke verlässlich.
            </p>
          </div>
        </div>

        {/* Security Features */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(60, 179, 113, 0.1)' }}>
              <Check size={16} style={{ color: '#3CB371' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Staatlich geförderte Optionen
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(60, 179, 113, 0.1)' }}>
              <Check size={16} style={{ color: '#3CB371' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Garantierte Leistungen
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(60, 179, 113, 0.1)' }}>
              <Check size={16} style={{ color: '#3CB371' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Langfristig planbar
              </span>
            </div>
          </div>
        </div>

        {/* Security Options */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Verlässliche Vorsorge-Optionen
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border-2" style={{ 
              borderColor: '#3CB371',
              backgroundColor: 'rgba(60, 179, 113, 0.05)',
            }}>
              <div className="flex items-start gap-3">
                <Lock size={20} style={{ color: '#3CB371', marginTop: '2px' }} />
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Staatlich gefördert (Riester/Rürup)
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Garantierte Beiträge + Steuervorteile
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-2" style={{ 
              borderColor: '#3CB371',
              backgroundColor: 'rgba(60, 179, 113, 0.05)',
            }}>
              <div className="flex items-start gap-3">
                <Shield size={20} style={{ color: '#3CB371', marginTop: '2px' }} />
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Betriebliche Altersvorsorge
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Arbeitgeberzuschuss + Sozialabgaben sparen
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-2" style={{ 
              borderColor: '#3CB371',
              backgroundColor: 'rgba(60, 179, 113, 0.05)',
            }}>
              <div className="flex items-start gap-3">
                <FileText size={20} style={{ color: '#3CB371', marginTop: '2px' }} />
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Private Rentenversicherung
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Garantierte Rente + lebenslange Zahlung
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Schritt für Schritt gemeinsam planen
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold" style={{ 
                backgroundColor: '#3CB371',
                color: 'white',
              }}>
                1
              </div>
              <div className="flex-1 pt-1">
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Kostenlose Analyse deiner Situation
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold" style={{ 
                backgroundColor: '#3CB371',
                color: 'white',
              }}>
                2
              </div>
              <div className="flex-1 pt-1">
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Unverbindliches Beratungsgespräch
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold" style={{ 
                backgroundColor: '#3CB371',
                color: 'white',
              }}>
                3
              </div>
              <div className="flex-1 pt-1">
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Gemeinsam passende Lösung finden
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-4">
          <button
            onClick={onActionClick}
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#3CB371' }}
          >
            Absicherung planen <Shield size={20} className="inline ml-2" />
          </button>
        </div>

        {/* Reassurance */}
        <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          100% unverbindlich • Keine versteckten Kosten • Schritt für Schritt
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Dein Fortschritt:
            </span>
            <span className="text-sm font-bold" style={{ color: '#3CB371' }}>
              {data.coveragePercentage.toFixed(1)}% gedeckt
            </span>
          </div>
          <div className="w-full h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${data.coveragePercentage}%`,
                background: 'linear-gradient(90deg, #3CB371 0%, #4A90E2 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

