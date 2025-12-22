'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Empfehlung, EmpfehlungsKategorie } from './types'
import { KATEGORIE_INFO } from './constants'
import { PRODUKT_TEMPLATES } from './productTemplates'

interface EmpfehlungEditModalProps {
  empfehlung: Empfehlung | null
  isOpen: boolean
  onClose: () => void
  onSave: (empfehlung: Empfehlung) => void
  clientId?: string
}

export default function EmpfehlungEditModal({
  empfehlung,
  isOpen,
  onClose,
  onSave,
  clientId,
}: EmpfehlungEditModalProps) {
  const [formData, setFormData] = useState<Empfehlung | null>(null)
  const [vorherProduktTyp, setVorherProduktTyp] = useState<string>('') // 'template' oder 'eigen'
  const [nachherProduktTyp, setNachherProduktTyp] = useState<string>('') // 'template' oder 'eigen'
  const [loadingRentenkonzept, setLoadingRentenkonzept] = useState(false)

  useEffect(() => {
    if (empfehlung) {
      setFormData(empfehlung)
      // Prüfe ob Produkt ein Template ist
      const templates = PRODUKT_TEMPLATES[empfehlung.kategorie] || []
      const vorherIsTemplate = templates.some((t) => t.name === empfehlung.vorher.produkt && t.typ !== 'Eigen')
      const nachherIsTemplate = templates.some((t) => t.name === empfehlung.nachher.produkt && t.typ !== 'Eigen')
      setVorherProduktTyp(vorherIsTemplate ? 'template' : 'eigen')
      setNachherProduktTyp(nachherIsTemplate ? 'template' : 'eigen')
    } else {
      // Neue Empfehlung
      setFormData({
        id: `emp-${Date.now()}`,
        kategorie: 'bu',
        vorher: {
          anbieter: '',
          produkt: '',
          beitragMonatlich: 0,
          leistung: '',
          laufzeitBis: '',
          features: [''],
        },
        nachher: {
          anbieter: '',
          produkt: '',
          beitragMonatlich: 0,
          leistung: '',
          laufzeitBis: '',
          features: [''],
        },
        vorteile: [''],
        notizen: '',
        rentenlueckeVorher: undefined,
        rentenlueckeNachher: undefined,
        rentenlueckeGesamt: undefined,
      })
    }
  }, [empfehlung, isOpen])

  if (!isOpen || !formData) return null

  const handleSave = () => {
    if (!formData) return

    // Validiere minimale Daten
    if (!formData.vorher.anbieter || !formData.nachher.anbieter) {
      alert('Bitte füllen Sie mindestens Anbieter aus.')
      return
    }

    onSave(formData)
    onClose()
  }

  const addFeature = (section: 'vorher' | 'nachher') => {
    if (!formData) return
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        features: [...formData[section].features, ''],
      },
    })
  }

  const removeFeature = (section: 'vorher' | 'nachher', index: number) => {
    if (!formData) return
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        features: formData[section].features.filter((_, i) => i !== index),
      },
    })
  }

  const updateFeature = (section: 'vorher' | 'nachher', index: number, value: string) => {
    if (!formData) return
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        features: formData[section].features.map((f, i) => (i === index ? value : f)),
      },
    })
  }

  const addVorteil = () => {
    if (!formData) return
    setFormData({
      ...formData,
      vorteile: [...formData.vorteile, ''],
    })
  }

  const removeVorteil = (index: number) => {
    if (!formData) return
    setFormData({
      ...formData,
      vorteile: formData.vorteile.filter((_, i) => i !== index),
    })
  }

  const updateVorteil = (index: number, value: string) => {
    if (!formData) return
    setFormData({
      ...formData,
      vorteile: formData.vorteile.map((v, i) => (i === index ? value : v)),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-6"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {empfehlung ? 'Empfehlung bearbeiten' : 'Neue Empfehlung hinzufügen'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Kategorie */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Kategorie
              </label>
              {formData.kategorie === 'rente' && clientId && (
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingRentenkonzept(true)
                    try {
                      const res = await fetch(`/api/retirement-concepts?clientId=${clientId}`)
                      if (res.ok) {
                        const concepts = await res.json()
                        if (concepts && concepts.length > 0) {
                          const latestConcept = concepts[0] // Neuestes Konzept
                          
                          // Extrahiere Daten aus Rentenkonzept
                          const monatlicheSparrate = latestConcept.monthlySavings || 0
                          const renteAusSparrate = latestConcept.requiredSavingsNetCurrent || latestConcept.requiredSavingsNetFuture || 0
                          const bestehendeRente = latestConcept.totalPensionWithProvision || latestConcept.calculatedPensionAtRetirement || 0
                          const zielRente = latestConcept.targetPensionNetto || latestConcept.calculatedTargetPension || 0
                          const rentenluecke = zielRente - bestehendeRente
                          
                          // Fülle Formular mit Daten aus Rentenkonzept
                          setFormData({
                            ...formData,
                            vorher: {
                              ...formData.vorher,
                              beitragMonatlich: monatlicheSparrate || formData.vorher.beitragMonatlich,
                              leistung: bestehendeRente > 0 ? `${Math.round(bestehendeRente)}€ Rente` : formData.vorher.leistung,
                            },
                            nachher: {
                              ...formData.nachher,
                              beitragMonatlich: monatlicheSparrate || formData.nachher.beitragMonatlich,
                              leistung: renteAusSparrate > 0 ? `${Math.round(renteAusSparrate)}€ Rente` : formData.nachher.leistung,
                            },
                            rentenlueckeGesamt: rentenluecke > 0 ? rentenluecke : formData.rentenlueckeGesamt,
                            rentenlueckeVorher: rentenluecke > 0 ? rentenluecke : formData.rentenlueckeVorher,
                            rentenlueckeNachher: rentenluecke > 0 && renteAusSparrate > 0 
                              ? Math.max(0, rentenluecke - renteAusSparrate) 
                              : formData.rentenlueckeNachher,
                          })
                          
                          alert('Daten aus Rentenkonzept geladen! Bitte prüfen und anpassen.')
                        } else {
                          alert('Kein Rentenkonzept für diesen Kunden gefunden.')
                        }
                      }
                    } catch (err) {
                      console.error('Fehler beim Laden des Rentenkonzepts:', err)
                      alert('Fehler beim Laden des Rentenkonzepts.')
                    } finally {
                      setLoadingRentenkonzept(false)
                    }
                  }}
                  disabled={loadingRentenkonzept}
                  className="px-3 py-1 text-xs rounded flex items-center gap-1 disabled:opacity-50"
                  style={{ backgroundColor: '#2563EB', color: 'white' }}
                >
                  {loadingRentenkonzept ? 'Lädt...' : '📊 Aus Rentenkonzept laden'}
                </button>
              )}
            </div>
            <select
              value={formData.kategorie}
              onChange={(e) =>
                setFormData({ ...formData, kategorie: e.target.value as EmpfehlungsKategorie })
              }
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {Object.entries(KATEGORIE_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name}
                </option>
              ))}
            </select>
          </div>

          {/* VORHER */}
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Vorher (Aktueller Stand)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Anbieter
                </label>
                <input
                  type="text"
                  value={formData.vorher.anbieter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vorher: { ...formData.vorher, anbieter: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Produkt
                </label>
                <select
                  value={vorherProduktTyp === 'eigen' ? 'eigen' : formData.vorher.produkt || ''}
                  onChange={(e) => {
                    const selectedValue = e.target.value
                    if (selectedValue === 'eigen') {
                      setVorherProduktTyp('eigen')
                      setFormData({
                        ...formData,
                        vorher: { ...formData.vorher, produkt: '' },
                      })
                    } else {
                      setVorherProduktTyp('template')
                      const templates = PRODUKT_TEMPLATES[formData.kategorie] || []
                      const template = templates.find((t) => t.name === selectedValue)
                      
                      setFormData({
                        ...formData,
                        vorher: {
                          ...formData.vorher,
                          produkt: selectedValue,
                          anbieter: (template && template.anbieter.length > 0 && !formData.vorher.anbieter) 
                            ? template.anbieter[0] 
                            : formData.vorher.anbieter,
                        },
                      })
                    }
                  }}
                  className="w-full px-3 py-2 rounded border mb-2"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">Produkt auswählen...</option>
                  {(PRODUKT_TEMPLATES[formData.kategorie] || [])
                    .filter((t) => t.typ !== 'Eigen')
                    .map((template) => (
                      <option key={template.name} value={template.name}>
                        {template.name}
                      </option>
                    ))}
                  <option value="eigen">➕ Eigenes Produkt</option>
                </select>
                {vorherProduktTyp === 'eigen' && (
                  <input
                    type="text"
                    value={formData.vorher.produkt}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vorher: { ...formData.vorher, produkt: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Eigenes Produkt eingeben..."
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Beitrag (€/Monat)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.vorher.beitragMonatlich}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vorher: { ...formData.vorher, beitragMonatlich: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Leistung
                </label>
                <input
                  type="text"
                  value={formData.vorher.leistung}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vorher: { ...formData.vorher, leistung: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="z.B. 2000€ BU-Rente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Laufzeit bis
                </label>
                <input
                  type="text"
                  value={formData.vorher.laufzeitBis || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vorher: { ...formData.vorher, laufzeitBis: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="z.B. 31.12.2045"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Features
              </label>
              {formData.vorher.features.map((feature, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature('vorher', idx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Feature beschreiben..."
                  />
                  {formData.vorher.features.length > 1 && (
                    <button
                      onClick={() => removeFeature('vorher', idx)}
                      className="p-2 rounded hover:opacity-80"
                      style={{ color: '#DC2626' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addFeature('vorher')}
                className="mt-2 px-3 py-1 text-sm rounded flex items-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                <Plus className="w-4 h-4" />
                Feature hinzufügen
              </button>
            </div>
          </div>

          {/* NACHHER */}
          <div
            className="border rounded-lg p-4"
            style={{ borderColor: '#10B981', backgroundColor: '#ECFDF5' }}
          >
            <h3 className="font-semibold mb-4" style={{ color: '#059669' }}>
              Nachher (Optimierte Lösung)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Anbieter
                </label>
                <input
                  type="text"
                  value={formData.nachher.anbieter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nachher: { ...formData.nachher, anbieter: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#10B981',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Produkt
                </label>
                <select
                  value={nachherProduktTyp === 'eigen' ? 'eigen' : formData.nachher.produkt || ''}
                  onChange={(e) => {
                    const selectedValue = e.target.value
                    if (selectedValue === 'eigen') {
                      setNachherProduktTyp('eigen')
                      setFormData({
                        ...formData,
                        nachher: { ...formData.nachher, produkt: '' },
                      })
                    } else {
                      setNachherProduktTyp('template')
                      const templates = PRODUKT_TEMPLATES[formData.kategorie] || []
                      const template = templates.find((t) => t.name === selectedValue)
                      
                      setFormData({
                        ...formData,
                        nachher: {
                          ...formData.nachher,
                          produkt: selectedValue,
                          anbieter: (template && template.anbieter.length > 0 && !formData.nachher.anbieter) 
                            ? template.anbieter[0] 
                            : formData.nachher.anbieter,
                        },
                      })
                    }
                  }}
                  className="w-full px-3 py-2 rounded border mb-2"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#10B981',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">Produkt auswählen...</option>
                  {(PRODUKT_TEMPLATES[formData.kategorie] || [])
                    .filter((t) => t.typ !== 'Eigen')
                    .map((template) => (
                      <option key={template.name} value={template.name}>
                        {template.name}
                      </option>
                    ))}
                  <option value="eigen">➕ Eigenes Produkt</option>
                </select>
                {nachherProduktTyp === 'eigen' && (
                  <input
                    type="text"
                    value={formData.nachher.produkt}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nachher: { ...formData.nachher, produkt: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#10B981',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Eigenes Produkt eingeben..."
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Beitrag (€/Monat)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.nachher.beitragMonatlich}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nachher: { ...formData.nachher, beitragMonatlich: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#10B981',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Leistung
                </label>
                <input
                  type="text"
                  value={formData.nachher.leistung}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nachher: { ...formData.nachher, leistung: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#10B981',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="z.B. 2000€ BU-Rente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Laufzeit bis
                </label>
                <input
                  type="text"
                  value={formData.nachher.laufzeitBis || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nachher: { ...formData.nachher, laufzeitBis: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#10B981',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="z.B. 31.12.2050"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Features
              </label>
              {formData.nachher.features.map((feature, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature('nachher', idx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#10B981',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Feature beschreiben..."
                  />
                  {formData.nachher.features.length > 1 && (
                    <button
                      onClick={() => removeFeature('nachher', idx)}
                      className="p-2 rounded hover:opacity-80"
                      style={{ color: '#DC2626' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addFeature('nachher')}
                className="mt-2 px-3 py-1 text-sm rounded flex items-center gap-2"
                style={{ backgroundColor: '#10B981', color: 'white' }}
              >
                <Plus className="w-4 h-4" />
                Feature hinzufügen
              </button>
            </div>
          </div>

          {/* VORTEILE */}
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Ihre Vorteile
            </h3>
            {formData.vorteile.map((vorteil, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={vorteil}
                  onChange={(e) => updateVorteil(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Vorteil beschreiben..."
                />
                {formData.vorteile.length > 1 && (
                  <button
                    onClick={() => removeVorteil(idx)}
                    className="p-2 rounded hover:opacity-80"
                    style={{ color: '#DC2626' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addVorteil}
              className="mt-2 px-3 py-1 text-sm rounded flex items-center gap-2"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              Vorteil hinzufügen
            </button>
          </div>

          {/* Rentenlücke (nur für rente-Kategorie) */}
          {formData.kategorie === 'rente' && (
            <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Rentenlücke (optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Rentenlücke gesamt (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentenlueckeGesamt || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentenlueckeGesamt: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="z.B. 500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Rentenlücke vorher (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentenlueckeVorher || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentenlueckeVorher: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="z.B. 500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Rentenlücke nachher (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentenlueckeNachher || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentenlueckeNachher: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="z.B. 300000"
                  />
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                Diese Werte werden verwendet, um einen Fortschrittsbalken für die Rentenlücke anzuzeigen.
              </p>
            </div>
          )}

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Notizen (optional)
            </label>
            <textarea
              value={formData.notizen || ''}
              onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Interne Notizen für Berater..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded font-medium"
            style={{ backgroundColor: '#10B981', color: 'white' }}
          >
            Speichern
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded font-medium"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

