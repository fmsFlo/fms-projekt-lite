"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Plus, TrendingUp, X } from 'lucide-react'
import type { VersicherungsCheck, Versicherung, VersicherungsStatus, VersicherungsTyp } from './types'
import { VERSICHERUNGS_NAMEN, VERSICHERUNGS_KATEGORIEN } from './constants'
import { calculateAnlagePotenzial, calculateVersicherungsDifferenz } from './utils'
import { formatEuro } from '../finances/utils'

interface VersicherungsOptimierungProps {
  check: VersicherungsCheck
  onUpdate: (check: VersicherungsCheck) => void
}

export default function VersicherungsOptimierung({ check, onUpdate }: VersicherungsOptimierungProps) {
  const [showVersicherungAuswahl, setShowVersicherungAuswahl] = useState(false)
  const updateVersicherungStatus = (id: string, status: VersicherungsStatus, begruendung?: string) => {
    const updatedVersicherungen = check.versicherungen.map((v) => {
      if (v.id === id) {
        let differenz = 0
        let anlagePotenzial
        let nachher = v.nachher

        if (status === 'nicht_noetig') {
          // Wird gestrichen - Einsparung
          differenz = v.vorher ? -v.vorher.beitragMonatlich : 0
          anlagePotenzial = calculateAnlagePotenzial(Math.abs(differenz), 6, 30)
          nachher = undefined
        } else if (status === 'empfehlung') {
          // Optimierung - Differenz berechnen
          if (v.vorher) {
            nachher = v.nachher || {
              beitragMonatlich: v.vorher.beitragMonatlich,
              leistungsverbesserungen: [],
              vorteile: [],
            }
            differenz = nachher.beitragMonatlich - v.vorher.beitragMonatlich
          }
        } else if (status === 'neue_empfehlung') {
          // Neue Versicherung - Mehrkosten
          nachher = v.nachher || {
            beitragMonatlich: 0,
            leistungsverbesserungen: [],
            vorteile: [],
          }
          differenz = nachher.beitragMonatlich
        }

        return {
          ...v,
          status,
          nachher,
          differenzMonatlich: differenz,
          anlagePotenzial,
          begruendungVerzicht: status === 'nicht_noetig' ? begruendung : undefined,
        }
      }
      return v
    })

    // Berechne Gesamtwerte neu
    const gesamtBeitragVorher = updatedVersicherungen
      .filter((v) => v.vorher)
      .reduce((sum, v) => sum + (v.vorher?.beitragMonatlich || 0), 0)

    const gesamtBeitragNachher = updatedVersicherungen
      .filter((v) => v.status === 'empfehlung' || v.status === 'neue_empfehlung')
      .reduce((sum, v) => sum + (v.nachher?.beitragMonatlich || 0), 0)

    const einsparung = gesamtBeitragNachher - gesamtBeitragVorher

    onUpdate({
      ...check,
      versicherungen: updatedVersicherungen,
      gesamtBeitragVorher,
      gesamtBeitragNachher,
      einsparung,
    })
  }

  const updateVersicherungNachher = (id: string, nachher: Partial<Versicherung['nachher']>) => {
    const updatedVersicherungen = check.versicherungen.map((v) => {
      if (v.id === id) {
        const newNachher = { ...v.nachher, ...nachher } as Versicherung['nachher']
        const differenz = calculateVersicherungsDifferenz(v.vorher, newNachher)
        return {
          ...v,
          nachher: newNachher,
          differenzMonatlich: differenz,
        }
      }
      return v
    })

    // Recalculate totals
    const gesamtBeitragNachher = updatedVersicherungen
      .filter((v) => v.status === 'empfehlung' || v.status === 'neue_empfehlung')
      .reduce((sum, v) => sum + (v.nachher?.beitragMonatlich || 0), 0)

    const einsparung = gesamtBeitragNachher - check.gesamtBeitragVorher

    onUpdate({
      ...check,
      versicherungen: updatedVersicherungen,
      gesamtBeitragNachher,
      einsparung,
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Optimierungsvorschläge</h2>
        <p className="text-sm text-gray-600">
          Für jede Versicherung kannst du eine Empfehlung geben: Optimieren, Streichen oder Neue
          Versicherung hinzufügen.
        </p>
      </div>

      {check.versicherungen
        .filter((v) => v.vorher || v.status === 'neue_empfehlung')
        .map((versicherung) => {
          const handleDelete = (id: string) => {
            const updatedVersicherungen = check.versicherungen.filter((v) => v.id !== id)
            const gesamtBeitragVorher = updatedVersicherungen
              .filter((v) => v.vorher)
              .reduce((sum, v) => sum + (v.vorher?.beitragMonatlich || 0), 0)
            const gesamtBeitragNachher = updatedVersicherungen
              .filter((v) => v.status === 'empfehlung' || v.status === 'neue_empfehlung')
              .reduce((sum, v) => sum + (v.nachher?.beitragMonatlich || 0), 0)
            const einsparung = gesamtBeitragNachher - gesamtBeitragVorher
            onUpdate({
              ...check,
              versicherungen: updatedVersicherungen,
              gesamtBeitragVorher,
              gesamtBeitragNachher,
              einsparung,
            })
          }

          return (
            <VersicherungsCard
              key={versicherung.id}
              versicherung={versicherung}
              onStatusChange={(status, begruendung) => updateVersicherungStatus(versicherung.id, status, begruendung)}
              onNachherUpdate={(nachher) => updateVersicherungNachher(versicherung.id, nachher)}
              onDelete={versicherung.status === 'neue_empfehlung' ? handleDelete : undefined}
            />
          )
        })}

      {/* Neue Versicherung hinzufügen */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
        <button
          onClick={() => setShowVersicherungAuswahl(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Neue Versicherung empfehlen
        </button>
      </div>

      {/* Modal für Versicherungsauswahl */}
      {showVersicherungAuswahl && (
        <VersicherungsAuswahlModal
          onClose={() => setShowVersicherungAuswahl(false)}
          onSelect={(typ: VersicherungsTyp) => {
            // Prüfe ob diese Versicherung bereits existiert
            const existiertBereits = check.versicherungen.some((v) => v.typ === typ && v.vorher)
            if (existiertBereits) {
              alert('Diese Versicherung existiert bereits in der Liste.')
              return
            }

            // Erstelle neue Versicherung mit ausgewähltem Typ
            const neueVersicherung: Versicherung = {
              id: `new-${Date.now()}`,
              typ,
              status: 'neue_empfehlung',
              vorher: undefined,
              nachher: {
                beitragMonatlich: 0,
                leistungsverbesserungen: [],
                vorteile: [],
              },
              differenzMonatlich: 0,
            }

            const updatedVersicherungen = [...check.versicherungen, neueVersicherung]

            // Berechne Gesamtwerte neu
            const gesamtBeitragVorher = updatedVersicherungen
              .filter((v) => v.vorher)
              .reduce((sum, v) => sum + (v.vorher?.beitragMonatlich || 0), 0)

            const gesamtBeitragNachher = updatedVersicherungen
              .filter((v) => v.status === 'empfehlung' || v.status === 'neue_empfehlung')
              .reduce((sum, v) => sum + (v.nachher?.beitragMonatlich || 0), 0)

            const einsparung = gesamtBeitragNachher - gesamtBeitragVorher

            onUpdate({
              ...check,
              versicherungen: updatedVersicherungen,
              gesamtBeitragVorher,
              gesamtBeitragNachher,
              einsparung,
            })

            setShowVersicherungAuswahl(false)
          }}
          vorhandeneVersicherungen={check.versicherungen.filter((v) => v.vorher).map((v) => v.typ)}
        />
      )}
    </div>
  )
}

function VersicherungsCard({
  versicherung,
  onStatusChange,
  onNachherUpdate,
  onDelete,
}: {
  versicherung: Versicherung
  onStatusChange: (status: VersicherungsStatus, begruendung?: string) => void
  onNachherUpdate: (nachher: Partial<Versicherung['nachher']>) => void
  onDelete?: (id: string) => void
}) {
  const [begruendung, setBegruendung] = useState(versicherung.begruendungVerzicht || '')
  const [vorteileText, setVorteileText] = useState(versicherung.nachher?.vorteile?.join('\n') || '')
  const [isEditing, setIsEditing] = useState(false)

  // Sync vorteileText nur wenn versicherung.nachher?.vorteile sich von außen ändert (nicht während des Editierens)
  useEffect(() => {
    if (!isEditing) {
      const newText = versicherung.nachher?.vorteile?.join('\n') || ''
      if (newText !== vorteileText) {
        setVorteileText(newText)
      }
    }
  }, [versicherung.id, versicherung.nachher?.vorteile?.length]) // Nur bei Versicherungswechsel oder Länge-Änderung

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gray-50 px-6 py-4 border-b border-gray-200"
        onKeyDown={(e) => {
          // Verhindere, dass Enter im Header das Formular abschickt
          if (e.key === 'Enter') {
            e.stopPropagation()
          }
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {versicherung.status === 'neue_empfehlung' && !versicherung.vorher
              ? `Neue: ${VERSICHERUNGS_NAMEN[versicherung.typ]}`
              : VERSICHERUNGS_NAMEN[versicherung.typ]}
          </h3>
          <div className="flex gap-2">
            {versicherung.vorher && (
              <>
                <button
                  onClick={() => onStatusChange('empfehlung')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    versicherung.status === 'empfehlung'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Optimieren
                </button>
                <button
                  onClick={() => onStatusChange('nicht_noetig', begruendung)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    versicherung.status === 'nicht_noetig'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <XCircle className="h-4 w-4 inline mr-1" />
                  Nicht nötig
                </button>
              </>
            )}
            {versicherung.status === 'neue_empfehlung' && onDelete && (
              <button
                onClick={() => {
                  if (onDelete) {
                    onDelete(versicherung.id)
                  }
                }}
                className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                <XCircle className="h-4 w-4 inline mr-1" />
                Entfernen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content - 3 Spalten Layout */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* VORHER */}
          <div className="border-r border-gray-200 pr-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">VORHER</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Anbieter:</span>
                <p className="font-medium">{versicherung.vorher?.anbieter || '-'}</p>
              </div>
              <div>
                <span className="text-gray-600">Beitrag:</span>
                <p className="font-bold text-lg">{formatEuro(versicherung.vorher?.beitragMonatlich || 0)}/Monat</p>
              </div>
              {versicherung.vorher?.versicherungssumme && (
                <div>
                  <span className="text-gray-600">Summe:</span>
                  <p className="font-medium">
                    {formatEuro(versicherung.vorher.versicherungssumme)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NACHHER / EMPFEHLUNG */}
          <div className="border-r border-gray-200 pr-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">NACHHER</h4>
            {versicherung.status === 'nicht_noetig' ? (
              <div className="space-y-2">
                <p className="text-orange-600 font-semibold">❌ Verzichten</p>
                  <textarea
                    placeholder="Begründung (z.B. bereits durch andere Versicherung abgedeckt)"
                    value={begruendung}
                    onChange={(e) => {
                      setBegruendung(e.target.value)
                      onStatusChange('nicht_noetig', e.target.value)
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                  />
                {versicherung.anlagePotenzial && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Anlage-Potenzial:</p>
                    <p className="text-sm font-semibold text-green-700">
                      Nach 20 Jahren: {formatEuro(versicherung.anlagePotenzial.nach20Jahren)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Anbieter</label>
                  <input
                    type="text"
                    value={versicherung.nachher?.anbieter || ''}
                    onChange={(e) =>
                      onNachherUpdate({
                        anbieter: e.target.value,
                        beitragMonatlich: versicherung.nachher?.beitragMonatlich || versicherung.vorher?.beitragMonatlich || 0,
                        leistungsverbesserungen: versicherung.nachher?.leistungsverbesserungen || [],
                        vorteile: versicherung.nachher?.vorteile || [],
                      })
                    }
                    placeholder="z.B. Haftpflichtkasse"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Neuer Beitrag (€/Monat)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={versicherung.nachher?.beitragMonatlich || versicherung.vorher?.beitragMonatlich || ''}
                    onChange={(e) =>
                      onNachherUpdate({
                        anbieter: versicherung.nachher?.anbieter || '',
                        beitragMonatlich: parseFloat(e.target.value) || 0,
                        leistungsverbesserungen: versicherung.nachher?.leistungsverbesserungen || [],
                        vorteile: versicherung.nachher?.vorteile || [],
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Vorteile (pro Zeile, Enter für neue Zeile)</label>
                  <textarea
                    value={vorteileText}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => {
                      setIsEditing(false)
                      // Beim Verlassen des Feldes: Speichere die finalen Vorteile
                      const lines = vorteileText.split('\n')
                      const vorteile = lines
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0)
                      
                      onNachherUpdate({
                        anbieter: versicherung.nachher?.anbieter || '',
                        vorteile,
                        leistungsverbesserungen: versicherung.nachher?.leistungsverbesserungen || [],
                        beitragMonatlich: versicherung.nachher?.beitragMonatlich || versicherung.vorher?.beitragMonatlich || 0,
                      })
                    }}
                    onChange={(e) => {
                      // Aktualisiere nur den lokalen State während des Editierens
                      const newValue = e.target.value
                      setVorteileText(newValue)
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y"
                    rows={5}
                    placeholder="Günstigerer Beitrag&#10;Höhere Summe&#10;Weltweiter Schutz"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tipp: Drücke Enter für eine neue Zeile</p>
                </div>
                {versicherung.differenzMonatlich !== 0 && (
                  <div className={`p-2 rounded-lg ${versicherung.differenzMonatlich < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-600">Differenz:</p>
                    <p className={`font-bold ${versicherung.differenzMonatlich < 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {versicherung.differenzMonatlich < 0 ? '-' : '+'}
                      {formatEuro(Math.abs(versicherung.differenzMonatlich))}/Monat
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VORTEILE / WAS DU GEWINNST */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">DEINE VORTEILE</h4>
            {versicherung.status === 'nicht_noetig' ? (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">💰 Ersparnis:</p>
                  <p className="font-bold text-green-700">
                    {formatEuro(Math.abs(versicherung.differenzMonatlich))}/Monat
                  </p>
                </div>
                {versicherung.anlagePotenzial && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">📊 Bei Anlage (6%):</p>
                    <p className="text-sm font-semibold text-blue-700">
                      20J: {formatEuro(versicherung.anlagePotenzial.nach20Jahren)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {versicherung.nachher?.vorteile?.map((vorteil, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span className="text-gray-700">{vorteil}</span>
                  </div>
                ))}
                {versicherung.differenzMonatlich < 0 && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600">Ersparnis:</p>
                    <p className="font-bold text-green-700">
                      {formatEuro(Math.abs(versicherung.differenzMonatlich))}/Monat
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VersicherungsAuswahlModal({
  onClose,
  onSelect,
  vorhandeneVersicherungen,
}: {
  onClose: () => void
  onSelect: (typ: VersicherungsTyp) => void
  vorhandeneVersicherungen: VersicherungsTyp[]
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Welche Versicherung möchtest du hinzufügen?</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {VERSICHERUNGS_KATEGORIEN.map((kategorie) => (
              <div key={kategorie.name}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{kategorie.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {kategorie.versicherungen.map((typ) => {
                    const istVorhanden = vorhandeneVersicherungen.includes(typ)
                    return (
                      <button
                        key={typ}
                        onClick={() => {
                          if (!istVorhanden) {
                            onSelect(typ)
                          }
                        }}
                        disabled={istVorhanden}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          istVorhanden
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{VERSICHERUNGS_NAMEN[typ]}</span>
                          {istVorhanden && (
                            <span className="text-xs text-gray-400">✓ Vorhanden</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

