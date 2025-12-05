"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type FinancialConcept = {
  id: string
  clientId: string
  currentRente: number | null
  currentVorsorge: number | null
  renteWithIncrease: number | null
  taxDeductions: number | null
  socialDeductions: number | null
  totalRente: number | null
  rentenluecke: number | null
  wunschrente: number | null
  notes: string | null
}

interface FinancialConceptFormProps {
  initialConcept: FinancialConcept
}

export default function FinancialConceptForm({ initialConcept }: FinancialConceptFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    currentRente: initialConcept.currentRente?.toString() || '',
    currentVorsorge: initialConcept.currentVorsorge?.toString() || '',
    renteWithIncrease: initialConcept.renteWithIncrease?.toString() || '',
    taxDeductions: initialConcept.taxDeductions?.toString() || '',
    socialDeductions: initialConcept.socialDeductions?.toString() || '',
    wunschrente: initialConcept.wunschrente?.toString() || '',
    notes: initialConcept.notes || '',
  })
  const [calculatedValues, setCalculatedValues] = useState({
    totalRente: initialConcept.totalRente,
    rentenluecke: initialConcept.rentenluecke,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Berechne Werte automatisch bei Änderung
  useEffect(() => {
    const currentRente = parseFloat(formData.currentRente) || 0
    const currentVorsorge = parseFloat(formData.currentVorsorge) || 0
    const renteWithIncrease = parseFloat(formData.renteWithIncrease) || 0
    const taxDeductions = parseFloat(formData.taxDeductions) || 0
    const socialDeductions = parseFloat(formData.socialDeductions) || 0
    const wunschrente = parseFloat(formData.wunschrente) || 0

    const totalRente = currentRente + currentVorsorge + renteWithIncrease - taxDeductions - socialDeductions
    const rentenluecke = wunschrente > 0 ? wunschrente - totalRente : null

    setCalculatedValues({
      totalRente: totalRente || null,
      rentenluecke: rentenluecke || null,
    })
  }, [formData])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        currentRente: formData.currentRente ? parseFloat(formData.currentRente) : null,
        currentVorsorge: formData.currentVorsorge ? parseFloat(formData.currentVorsorge) : null,
        renteWithIncrease: formData.renteWithIncrease ? parseFloat(formData.renteWithIncrease) : null,
        taxDeductions: formData.taxDeductions ? parseFloat(formData.taxDeductions) : null,
        socialDeductions: formData.socialDeductions ? parseFloat(formData.socialDeductions) : null,
        wunschrente: formData.wunschrente ? parseFloat(formData.wunschrente) : null,
        notes: formData.notes || null,
      }

      const res = await fetch(`/api/financial-concepts/${initialConcept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Speichern')
      }

      alert('Finanzkonzept erfolgreich gespeichert!')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="border rounded p-6 bg-white space-y-6">
        <h2 className="text-lg font-semibold">Eingabefelder</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Bisherige Rente (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.currentRente}
              onChange={(e) => handleChange('currentRente', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Bisherige Vorsorge (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.currentVorsorge}
              onChange={(e) => handleChange('currentVorsorge', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Rente mit 1% Steigerung (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.renteWithIncrease}
              onChange={(e) => handleChange('renteWithIncrease', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Steuerliche Abzüge (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.taxDeductions}
              onChange={(e) => handleChange('taxDeductions', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Sozialversicherungspflichtige Abzüge (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.socialDeductions}
              onChange={(e) => handleChange('socialDeductions', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Wunschrente (EUR) <span className="text-gray-500 text-xs">(nur als erster Aufschlag)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.wunschrente}
              onChange={(e) => handleChange('wunschrente', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notizen
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Zusätzliche Notizen..."
          />
        </div>
      </div>

      <div className="border rounded p-6 bg-gray-50 space-y-4">
        <h2 className="text-lg font-semibold">Berechnete Werte</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border rounded">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Gesamtrente
            </label>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(calculatedValues.totalRente)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Bisherige Rente + Vorsorge + Rente mit Steigerung - Abzüge
            </p>
          </div>

          <div className="p-4 bg-white border rounded">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Rentenlücke
            </label>
            <p className={`text-2xl font-bold ${calculatedValues.rentenluecke && calculatedValues.rentenluecke > 0 ? 'text-red-600' : calculatedValues.rentenluecke && calculatedValues.rentenluecke < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {formatCurrency(calculatedValues.rentenluecke)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Wunschrente - Gesamtrente
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Speichere...' : 'Speichern'}
        </button>
        <a
          href={`/clients/${initialConcept.clientId}`}
          className="px-6 py-2 border rounded hover:bg-gray-50"
        >
          Abbrechen
        </a>
      </div>
    </div>
  )
}

