'use client'

import { Briefcase, TrendingUp, BarChart, FileText, Check, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { Empfehlung } from './types'
import { calculateDifferenzMonatlich, calculateDifferenzJaehrlich, formatEuro, calculateMehrRente } from './utils'
import { KATEGORIE_INFO } from './constants'

interface VergleichsCardProps {
  empfehlung: Empfehlung
  isEditing?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

const KategorieIcons = {
  bu: Briefcase,
  rente: TrendingUp,
  depot: BarChart,
  sonstige: FileText,
}

export default function VergleichsCard({ empfehlung, isEditing, onEdit, onDelete }: VergleichsCardProps) {
  const differenzMonatlich = calculateDifferenzMonatlich(empfehlung)
  const differenzJaehrlich = calculateDifferenzJaehrlich(empfehlung)
  const istGuenstiger = differenzMonatlich < 0
  const istTeurer = differenzMonatlich > 0
  const istGleich = differenzMonatlich === 0
  const mehrRente = empfehlung.kategorie === 'rente' ? calculateMehrRente(empfehlung) : 0

  const kategorieInfo = KATEGORIE_INFO[empfehlung.kategorie] || KATEGORIE_INFO.sonstige
  const Icon = KategorieIcons[empfehlung.kategorie] || FileText

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
      {/* Header mit Kategorie */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: kategorieInfo.bgColor,
          borderBottom: `1px solid ${kategorieInfo.color}20`,
        }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: kategorieInfo.color }} />
          <h3 className="font-semibold" style={{ color: kategorieInfo.color }}>
            {kategorieInfo.name}
          </h3>
        </div>
        {isEditing && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm rounded hover:opacity-80"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                Bearbeiten
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-1 text-sm rounded hover:opacity-80"
                style={{ backgroundColor: '#DC2626', color: 'white' }}
              >
                Löschen
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3-Spalten-Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* VORHER */}
        <div
          className="p-4 border-r"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="mb-3">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>
              Vorher
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {empfehlung.vorher.anbieter}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {empfehlung.vorher.produkt}
              </p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {formatEuro(empfehlung.vorher.beitragMonatlich)}
                <span className="text-xs font-normal ml-1">/Monat</span>
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {empfehlung.vorher.leistung}
              </p>
              {empfehlung.vorher.laufzeitBis && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Bis: {empfehlung.vorher.laufzeitBis}
                </p>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {empfehlung.vorher.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs" style={{ color: '#6B7280' }}>
                    •
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NACHHER */}
        <div
          className="p-4 border-r relative"
          style={{
            backgroundColor: '#ECFDF5',
            borderColor: 'var(--color-border)',
            borderLeft: '3px solid #10B981',
          }}
        >
          <div className="absolute top-2 right-2">
            <span
              className="px-2 py-1 text-xs font-bold rounded"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              EMPFOHLEN
            </span>
          </div>
          <div className="mb-3 mt-6">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#059669' }}>
              Nachher
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#059669' }}>
                {empfehlung.nachher.anbieter}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {empfehlung.nachher.produkt}
              </p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: '#059669' }}>
                {formatEuro(empfehlung.nachher.beitragMonatlich)}
                <span className="text-xs font-normal ml-1">/Monat</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#059669' }}>
                {empfehlung.nachher.leistung}
              </p>
              {empfehlung.nachher.laufzeitBis && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Bis: {empfehlung.nachher.laufzeitBis}
                </p>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {empfehlung.nachher.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IHR VORTEIL */}
        <div
          className="p-4"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <div className="mb-3">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#059669' }}>
              Ihr Vorteil
            </span>
          </div>
          <div className="space-y-3">
            {/* Beitragsunterschied */}
            <div>
              {istGuenstiger && (
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4" style={{ color: '#10B981' }} />
                  <p className="text-lg font-bold" style={{ color: '#10B981' }}>
                    {formatEuro(Math.abs(differenzMonatlich))}
                    <span className="text-xs font-normal ml-1">pro Monat</span>
                  </p>
                </div>
              )}
              {istTeurer && (
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4" style={{ color: '#DC2626' }} />
                  <p className="text-lg font-bold" style={{ color: '#DC2626' }}>
                    +{formatEuro(differenzMonatlich)}
                    <span className="text-xs font-normal ml-1">pro Monat</span>
                  </p>
                </div>
              )}
              {istGleich && (
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  <p className="text-lg font-bold" style={{ color: '#F59E0B' }}>
                    {formatEuro(0)}
                    <span className="text-xs font-normal ml-1">pro Monat</span>
                  </p>
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {istGuenstiger ? 'Jährlich: ' : istTeurer ? 'Jährlich: +' : 'Jährlich: '}
                {formatEuro(Math.abs(differenzJaehrlich))}
              </p>
            </div>

            {/* Mehr Rente (nur für rente-Kategorie) */}
            {empfehlung.kategorie === 'rente' && mehrRente > 0 && (
              <div className="mb-3 p-2 rounded" style={{ backgroundColor: '#ECFDF5', border: '1px solid #10B981' }}>
                <p className="text-sm font-semibold" style={{ color: '#059669' }}>
                  {formatEuro(mehrRente)} mehr Rente
                </p>
                <p className="text-xs mt-1" style={{ color: '#059669' }}>
                  bei gleichem Aufwand
                </p>
              </div>
            )}

            {/* Vorteile Liste */}
            <div className="space-y-1.5">
              {empfehlung.vorteile.map((vorteil, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                    {vorteil}
                  </span>
                </div>
              ))}
            </div>

            {/* Rentenlücke Progress-Bar (nur für rente-Kategorie) */}
            {empfehlung.kategorie === 'rente' && empfehlung.rentenlueckeGesamt && empfehlung.rentenlueckeNachher !== undefined && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Rentenlücke geschlossen:
                </p>
                <div className="space-y-2">
                  <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (empfehlung.rentenlueckeNachher / empfehlung.rentenlueckeGesamt) * 100)}%`,
                        backgroundColor: '#10B981',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Vorher: {empfehlung.rentenlueckeVorher ? formatEuro(empfehlung.rentenlueckeVorher) : '0€'}
                    </span>
                    <span className="font-semibold" style={{ color: '#059669' }}>
                      Nachher: {formatEuro(empfehlung.rentenlueckeNachher)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#059669' }}>
                    {formatEuro(empfehlung.rentenlueckeGesamt - empfehlung.rentenlueckeNachher)} noch offen
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

