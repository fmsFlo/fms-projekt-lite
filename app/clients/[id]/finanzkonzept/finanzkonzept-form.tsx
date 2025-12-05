"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FinanzkonzeptFormProps {
  clientId: string
}

export default function FinanzkonzeptForm({ clientId }: FinanzkonzeptFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    bisherigeRente: '',
    bisherigeVorsorge: '',
    steuerlicheAbzuege: '',
    sozialversicherungAbzuege: '',
    wunschrente: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Lade gespeicherte Daten falls vorhanden
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/clients/${clientId}/finanzkonzept`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setFormData({
              bisherigeRente: data.bisherigeRente?.toString() || '',
              bisherigeVorsorge: data.bisherigeVorsorge?.toString() || '',
              steuerlicheAbzuege: data.steuerlicheAbzuege?.toString() || '',
              sozialversicherungAbzuege: data.sozialversicherungAbzuege?.toString() || '',
              wunschrente: data.wunschrente?.toString() || '',
            })
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden:', err)
      }
    }
    loadData()
  }, [clientId])

  // Berechnungen
  const bisherigeVorsorgeMitSteigerung = formData.bisherigeVorsorge
    ? parseFloat(formData.bisherigeVorsorge) * 1.01
    : 0

  const gesamtRente = 
    (parseFloat(formData.bisherigeRente) || 0) +
    bisherigeVorsorgeMitSteigerung -
    (parseFloat(formData.steuerlicheAbzuege) || 0) -
    (parseFloat(formData.sozialversicherungAbzuege) || 0)

  const rentenluecke = formData.wunschrente
    ? (parseFloat(formData.wunschrente) || 0) - gesamtRente
    : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/clients/${clientId}/finanzkonzept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bisherigeRente: parseFloat(formData.bisherigeRente) || 0,
          bisherigeVorsorge: parseFloat(formData.bisherigeVorsorge) || 0,
          steuerlicheAbzuege: parseFloat(formData.steuerlicheAbzuege) || 0,
          sozialversicherungAbzuege: parseFloat(formData.sozialversicherungAbzuege) || 0,
          wunschrente: parseFloat(formData.wunschrente) || 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Speichern')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {saved && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            ✅ Finanzkonzept erfolgreich gespeichert!
          </div>
        )}

        <section className="border rounded p-6 bg-white space-y-4">
          <h2 className="text-lg font-semibold">Eingaben</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Bisherige Rente (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.bisherigeRente}
                onChange={(e) => setFormData({ ...formData, bisherigeRente: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bisherige Vorsorge der Rente (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.bisherigeVorsorge}
                onChange={(e) => setFormData({ ...formData, bisherigeVorsorge: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird automatisch mit 1% Steigerung berechnet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Steuerliche Abzüge (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.steuerlicheAbzuege}
                onChange={(e) => setFormData({ ...formData, steuerlicheAbzuege: e.target.value })}
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
                value={formData.sozialversicherungAbzuege}
                onChange={(e) => setFormData({ ...formData, sozialversicherungAbzuege: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Wunschrente (EUR) - nur als erster Aufschlag
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.wunschrente}
                onChange={(e) => setFormData({ ...formData, wunschrente: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="0.00"
              />
            </div>
          </div>
        </section>

        <section className="border rounded p-6 bg-gray-50 space-y-4">
          <h2 className="text-lg font-semibold">Berechnungen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded border">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Bisherige Vorsorge (mit 1% Steigerung)
              </label>
              <p className="text-xl font-semibold text-blue-600">
                {formatCurrency(bisherigeVorsorgeMitSteigerung)}
              </p>
            </div>

            <div className="bg-white p-4 rounded border">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Gesamtrente
              </label>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(gesamtRente)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bisherige Rente + Vorsorge - Abzüge
              </p>
            </div>

            <div className="md:col-span-2 bg-white p-4 rounded border">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Rentenlücke
              </label>
              <p className={`text-2xl font-bold ${rentenluecke > 0 ? 'text-red-600' : rentenluecke < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {formatCurrency(rentenluecke)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Wunschrente - Gesamtrente
              </p>
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Speichere...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}

