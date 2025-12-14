"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import type { VersicherungsCheck, Versicherung, VersicherungsTyp } from './types'
import { VERSICHERUNGS_KATEGORIEN, VERSICHERUNGS_NAMEN, DURCHSCHNITTS_BEITRAEGE } from './constants'
import { formatEuro } from '../finances/utils'

interface VersicherungsEingabeProps {
  check: VersicherungsCheck
  onUpdate: (check: VersicherungsCheck) => void
}

export default function VersicherungsEingabe({ check, onUpdate }: VersicherungsEingabeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    existenziell: true,
    sach: false,
    optional: false,
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  const toggleVersicherung = (typ: VersicherungsTyp) => {
    const existing = check.versicherungen.find((v) => v.typ === typ)
    const updatedVersicherungen = [...check.versicherungen]

    if (existing) {
      // Entfernen
      const index = updatedVersicherungen.indexOf(existing)
      updatedVersicherungen.splice(index, 1)
    } else {
      // Hinzufügen
      const durchschnitt = DURCHSCHNITTS_BEITRAEGE[typ]
      const mittelwert = (durchschnitt.min + durchschnitt.max) / 2

      updatedVersicherungen.push({
        id: `vers-${Date.now()}-${typ}`,
        typ,
        status: 'empfehlung',
        vorher: {
          anbieter: '',
          beitragMonatlich: Math.round(mittelwert * 10) / 10,
          versicherungssumme: typ === 'phv' ? 5000000 : undefined,
          buRente: typ === 'bu' ? 1500 : undefined,
          rlvSumme: typ === 'rlv' ? 250000 : undefined,
        },
        differenzMonatlich: 0,
      })
    }

    // Berechne Gesamtbeitrag neu
    const gesamtBeitragVorher = updatedVersicherungen
      .filter((v) => v.vorher)
      .reduce((sum, v) => sum + (v.vorher?.beitragMonatlich || 0), 0)

    onUpdate({
      ...check,
      versicherungen: updatedVersicherungen,
      gesamtBeitragVorher,
    })
  }

  const updateVersicherung = (id: string, updates: Partial<Versicherung>) => {
    const updatedVersicherungen = check.versicherungen.map((v) =>
      v.id === id ? { ...v, ...updates } : v
    )

    // Aktualisiere vorher falls nötig
    const versicherung = updatedVersicherungen.find((v) => v.id === id)
    if (versicherung && updates.vorher) {
      versicherung.vorher = { ...versicherung.vorher, ...updates.vorher }
    }

    // Berechne Gesamtbeitrag neu
    const gesamtBeitragVorher = updatedVersicherungen
      .filter((v) => v.vorher)
      .reduce((sum, v) => sum + (v.vorher?.beitragMonatlich || 0), 0)

    onUpdate({
      ...check,
      versicherungen: updatedVersicherungen,
      gesamtBeitragVorher,
    })
  }

  const gesamtBeitrag = check.versicherungen
    .filter((v) => v.vorher)
    .reduce((sum, v) => sum + (v.vorher?.beitragMonatlich || 0), 0)

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Aktueller Gesamtbeitrag</p>
            <p className="text-3xl font-bold text-blue-700">{formatEuro(gesamtBeitrag)}</p>
            <p className="text-xs text-blue-600 mt-1">
              {check.versicherungen.filter((v) => v.vorher).length} Versicherungen
            </p>
          </div>
        </div>
      </div>

      {VERSICHERUNGS_KATEGORIEN.map((kategorie) => {
        const isExpanded = expandedCategories[kategorie.typ]
        const kategorieVersicherungen = check.versicherungen.filter((v) =>
          kategorie.versicherungen.includes(v.typ)
        )

        return (
          <div key={kategorie.typ} className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => toggleCategory(kategorie.typ)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">{kategorie.name}</h3>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {isExpanded && (
              <div className="px-6 pb-6 space-y-4">
                {kategorie.versicherungen.map((typ) => {
                  const versicherung = check.versicherungen.find((v) => v.typ === typ)
                  const isChecked = !!versicherung

                  return (
                    <div key={typ} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleVersicherung(typ)}
                          className="mt-1 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            {VERSICHERUNGS_NAMEN[typ]}
                          </label>
                          {isChecked && versicherung && (
                            <div className="space-y-3 mt-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Anbieter
                                  </label>
                                  <input
                                    type="text"
                                    value={versicherung.vorher?.anbieter || ''}
                                    onChange={(e) =>
                                      updateVersicherung(versicherung.id, {
                                        vorher: {
                                          ...versicherung.vorher!,
                                          anbieter: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="z.B. Allianz"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Beitrag (€/Monat) *
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={versicherung.vorher?.beitragMonatlich || ''}
                                    onChange={(e) => {
                                      const beitrag = parseFloat(e.target.value) || 0
                                      updateVersicherung(versicherung.id, {
                                        vorher: {
                                          ...versicherung.vorher!,
                                          beitragMonatlich: beitrag,
                                        },
                                      })
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Zusatzfelder je nach Typ */}
                              {typ === 'phv' && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Versicherungssumme (Mio. €)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={
                                      versicherung.vorher?.versicherungssumme
                                        ? versicherung.vorher.versicherungssumme / 1000000
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const summe = parseFloat(e.target.value) || 0
                                      updateVersicherung(versicherung.id, {
                                        vorher: {
                                          ...versicherung.vorher!,
                                          versicherungssumme: summe * 1000000,
                                        },
                                      })
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                  />
                                </div>
                              )}

                              {typ === 'bu' && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    BU-Rente (€/Monat)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={versicherung.vorher?.buRente || ''}
                                    onChange={(e) => {
                                      const rente = parseFloat(e.target.value) || 0
                                      updateVersicherung(versicherung.id, {
                                        vorher: {
                                          ...versicherung.vorher!,
                                          buRente: rente,
                                        },
                                      })
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                  />
                                </div>
                              )}

                              {typ === 'rlv' && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Versicherungssumme (€)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10000"
                                    value={versicherung.vorher?.rlvSumme || ''}
                                    onChange={(e) => {
                                      const summe = parseFloat(e.target.value) || 0
                                      updateVersicherung(versicherung.id, {
                                        vorher: {
                                          ...versicherung.vorher!,
                                          rlvSumme: summe,
                                        },
                                      })
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                  />
                                </div>
                              )}

                              {typ === 'kfz' && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    SF-Klasse
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="35"
                                    value={versicherung.vorher?.sfKlasse || ''}
                                    onChange={(e) => {
                                      const sf = parseInt(e.target.value) || 0
                                      updateVersicherung(versicherung.id, {
                                        vorher: {
                                          ...versicherung.vorher!,
                                          sfKlasse: sf,
                                        },
                                      })
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

