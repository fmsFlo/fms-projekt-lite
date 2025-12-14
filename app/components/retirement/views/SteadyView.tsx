"use client"

import { Check, Shield, Lock, FileText } from 'lucide-react'
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
          }}>
            <Shield size={32} style={{ color: '#10B981' }} />
          </div>
          <h2 
            className="text-2xl md:text-3xl font-semibold mb-2"
            style={{ color: '#10B981' }}
          >
            DEINE SICHERE ALTERSVORSORGE
          </h2>
        </div>

        {/* Current Situation */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Aktuelle Situation
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <Check size={20} style={{ color: '#10B981', marginTop: '2px' }} />
              <div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Gesetzliche Rente garantiert: {formatCurrency(data.statutoryNetFuture)}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Staatlich abgesichert und lebenslang
                </div>
              </div>
            </div>
            
            {data.privateNetFuture > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <Check size={20} style={{ color: '#10B981', marginTop: '2px' }} />
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Bereits gespart: {formatCurrency(data.privateNetFuture)}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Private Vorsorge vorhanden
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <span className="text-xl" style={{ marginTop: '2px' }}>⚠️</span>
              <div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Noch zu schließen: {formatCurrency(data.gap)}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Für sichere Altersvorsorge
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Options */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Deine Sicherheits-Optionen
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border-2" style={{ 
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
            }}>
              <div className="flex items-start gap-3">
                <Lock size={20} style={{ color: '#10B981', marginTop: '2px' }} />
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    [OPTION 1] Staatlich gefördert (Riester/Rürup)
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    → Garantierte Beiträge + Steuervorteile
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-2" style={{ 
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
            }}>
              <div className="flex items-start gap-3">
                <Shield size={20} style={{ color: '#10B981', marginTop: '2px' }} />
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    [OPTION 2] Betriebliche Altersvorsorge
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    → Arbeitgeberzuschuss + Sozialabgaben sparen
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-2" style={{ 
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
            }}>
              <div className="flex items-start gap-3">
                <FileText size={20} style={{ color: '#10B981', marginTop: '2px' }} />
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    [OPTION 3] Private Rentenversicherung
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    → Garantierte Rente + lebenslange Zahlung
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Nächste Schritte (kein Risiko)
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold" style={{ 
                backgroundColor: '#10B981',
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
                backgroundColor: '#10B981',
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
                backgroundColor: '#10B981',
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

        {/* Gentle Button */}
        <div className="mb-4">
          <button
            onClick={onActionClick}
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#10B981' }}
          >
            Schritt 1: Kostenlose Analyse starten
          </button>
        </div>

        {/* Reassurance */}
        <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          100% unverbindlich • Keine versteckten Kosten
        </div>
      </div>
    </div>
  )
}

