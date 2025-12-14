"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Save } from 'lucide-react'
import type { FinanzielleSituation, Ausgabenkategorie, Einkommen } from './types'
import { formatEuro } from './utils'

interface EinnahmenAusgabenEingabeProps {
  situation: FinanzielleSituation
  onUpdate: (situation: FinanzielleSituation) => void
  onSave?: () => void
}

const FIXKOSTEN_KATEGORIEN: Omit<Ausgabenkategorie, 'betrag' | 'id'>[] = [
  { name: 'Miete/Wohnung', typ: 'fix', icon: 'Home', durchschnitt: 900 },
  { name: 'Nebenkosten', typ: 'fix', icon: 'Home', durchschnitt: 200 },
  { name: 'Versicherungen', typ: 'fix', icon: 'Shield', durchschnitt: 150 },
  { name: 'Kredite/Darlehen', typ: 'fix', icon: 'CreditCard', durchschnitt: 300 },
  { name: 'Auto (Leasing/Finanzierung)', typ: 'fix', icon: 'Car', durchschnitt: 300 },
  { name: 'Handy/Internet', typ: 'fix', icon: 'Smartphone', durchschnitt: 50 },
  { name: 'Sparpläne/Vorsorge', typ: 'fix', icon: 'PiggyBank', durchschnitt: 200 },
  { name: 'Sonstige Fixkosten', typ: 'fix', icon: 'Wallet', durchschnitt: 100 },
]

const VARIABLE_KOSTEN_KATEGORIEN: Omit<Ausgabenkategorie, 'betrag' | 'id'>[] = [
  { name: 'Lebensmittel', typ: 'variabel', icon: 'UtensilsCrossed', durchschnitt: 350 },
  { name: 'Tanken/Mobilität', typ: 'variabel', icon: 'Car', durchschnitt: 150 },
  { name: 'Freizeit/Hobbys', typ: 'variabel', icon: 'Gamepad2', durchschnitt: 200 },
  { name: 'Shopping/Kleidung', typ: 'variabel', icon: 'ShoppingBag', durchschnitt: 150 },
  { name: 'Restaurants/Essen gehen', typ: 'variabel', icon: 'UtensilsCrossed', durchschnitt: 150 },
  { name: 'Streaming/Abos', typ: 'variabel', icon: 'Film', durchschnitt: 40 },
  { name: 'Urlaub', typ: 'variabel', icon: 'Plane', durchschnitt: 150 },
  { name: 'Sonstiges', typ: 'variabel', icon: 'Wallet', durchschnitt: 100 },
]

export default function EinnahmenAusgabenEingabe({
  situation,
  onUpdate,
  onSave,
}: EinnahmenAusgabenEingabeProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    persoenlich: true,
    fixkosten: true,
    variable: false,
  })
  const [showDurchschnitte, setShowDurchschnitte] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const updateKategorie = (id: string, betrag: number, typ: 'fix' | 'variabel') => {
    const updated = { ...situation }
    if (typ === 'fix') {
      updated.fixkosten = updated.fixkosten.map((k) => (k.id === id ? { ...k, betrag } : k))
    } else {
      updated.variableKosten = updated.variableKosten.map((k) => (k.id === id ? { ...k, betrag } : k))
    }
    onUpdate(updated)
  }

  const addZusatzEinkommen = () => {
    const updated = { ...situation }
    const newEinkommen: Einkommen = {
      id: `einkommen-${Date.now()}`,
      name: 'Zusatzeinkommen',
      betrag: 0,
      typ: 'sonstiges',
    }
    updated.persoenlicheDaten.zusatzEinkommen = [
      ...(updated.persoenlicheDaten.zusatzEinkommen || []),
      newEinkommen,
    ]
    onUpdate(updated)
  }

  const removeZusatzEinkommen = (id: string) => {
    const updated = { ...situation }
    updated.persoenlicheDaten.zusatzEinkommen = updated.persoenlicheDaten.zusatzEinkommen?.filter(
      (e) => e.id !== id
    )
    onUpdate(updated)
  }

  const updateZusatzEinkommen = (id: string, field: 'name' | 'betrag', value: string | number) => {
    const updated = { ...situation }
    updated.persoenlicheDaten.zusatzEinkommen = updated.persoenlicheDaten.zusatzEinkommen?.map((e) =>
      e.id === id ? { ...e, [field]: value } : e
    )
    onUpdate(updated)
  }

  const fillDurchschnitte = () => {
    const updated = { ...situation }
    updated.fixkosten = updated.fixkosten.map((k) => ({
      ...k,
      betrag: k.durchschnitt || 0,
    }))
    updated.variableKosten = updated.variableKosten.map((k) => ({
      ...k,
      betrag: k.durchschnitt || 0,
    }))
    onUpdate(updated)
  }

  const handleSave = async () => {
    if (onSave) {
      setSaving(true)
      try {
        await onSave()
      } finally {
        setSaving(false)
      }
    }
  }

  const ausgefuelltCount =
    (situation.fixkosten.filter((k) => k.betrag > 0).length +
      situation.variableKosten.filter((k) => k.betrag > 0).length) /
    (situation.fixkosten.length + situation.variableKosten.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Deine finanzielle Situation</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDurchschnitte(!showDurchschnitte)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showDurchschnitte ? 'Durchschnitte ausblenden' : 'Typische Werte einblenden'}
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Speichere...' : 'Speichern'}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">Fortschritt</span>
          <span className="text-sm font-semibold text-blue-700">
            {Math.round(ausgefuelltCount * 100)}% ausgefüllt
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${ausgefuelltCount * 100}%` }}
          />
        </div>
      </div>

      {/* Persönliche Daten */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('persoenlich')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Persönliche Daten</h3>
          {expandedSections.persoenlich ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expandedSections.persoenlich && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beruf</label>
              <input
                type="text"
                value={situation.persoenlicheDaten.beruf}
                onChange={(e) =>
                  onUpdate({
                    ...situation,
                    persoenlicheDaten: { ...situation.persoenlicheDaten, beruf: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z.B. Software-Entwickler"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nettoeinkommen (€ monatlich) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={situation.persoenlicheDaten.nettoEinkommen || ''}
                onChange={(e) =>
                  onUpdate({
                    ...situation,
                    persoenlicheDaten: {
                      ...situation.persoenlicheDaten,
                      nettoEinkommen: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="3000"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Zusatzeinkommen (optional)
                </label>
                <button
                  onClick={addZusatzEinkommen}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Hinzufügen
                </button>
              </div>
              {situation.persoenlicheDaten.zusatzEinkommen?.map((einkommen) => (
                <div key={einkommen.id} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={einkommen.name}
                    onChange={(e) => updateZusatzEinkommen(einkommen.id, 'name', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="z.B. Nebenjob, Mieteinnahmen"
                  />
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={einkommen.betrag || ''}
                    onChange={(e) =>
                      updateZusatzEinkommen(einkommen.id, 'betrag', parseFloat(e.target.value) || 0)
                    }
                    className="w-32 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="0"
                  />
                  <button
                    onClick={() => removeZusatzEinkommen(einkommen.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixkosten */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('fixkosten')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Fixkosten (monatlich)</h3>
          {expandedSections.fixkosten ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expandedSections.fixkosten && (
          <div className="px-6 pb-6 space-y-3">
            {situation.fixkosten.map((kategorie) => (
              <div key={kategorie.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {kategorie.name}
                  </label>
                  {showDurchschnitte && kategorie.durchschnitt && (
                    <p className="text-xs text-gray-500 mb-1">
                      Durchschnitt: {formatEuro(kategorie.durchschnitt)}/Monat
                    </p>
                  )}
                </div>
                <div className="w-40">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={kategorie.betrag || ''}
                      onChange={(e) =>
                        updateKategorie(kategorie.id, parseFloat(e.target.value) || 0, 'fix')
                      }
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variable Kosten */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => toggleSection('variable')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Variable Kosten (monatlich)</h3>
          {expandedSections.variable ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expandedSections.variable && (
          <div className="px-6 pb-6 space-y-3">
            {situation.variableKosten.map((kategorie) => (
              <div key={kategorie.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {kategorie.name}
                  </label>
                  {showDurchschnitte && kategorie.durchschnitt && (
                    <p className="text-xs text-gray-500 mb-1">
                      Durchschnitt: {formatEuro(kategorie.durchschnitt)}/Monat
                    </p>
                  )}
                </div>
                <div className="w-40">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={kategorie.betrag || ''}
                      onChange={(e) =>
                        updateKategorie(kategorie.id, parseFloat(e.target.value) || 0, 'variabel')
                      }
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDurchschnitte && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 mb-2">
            💡 Tipp: Du kannst alle Felder mit Durchschnittswerten füllen, um schnell zu starten.
          </p>
          <button
            onClick={fillDurchschnitte}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
          >
            Alle mit Durchschnittswerten füllen
          </button>
        </div>
      )}
    </div>
  )
}

