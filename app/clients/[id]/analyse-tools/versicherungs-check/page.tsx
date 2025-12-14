"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Save } from 'lucide-react'
import VersicherungsEingabe from '@/app/components/versicherungen/VersicherungsEingabe'
import VersicherungsOptimierung from '@/app/components/versicherungen/VersicherungsOptimierung'
import GesamtUebersicht from '@/app/components/versicherungen/GesamtUebersicht'
import type { VersicherungsCheck } from '@/app/components/versicherungen/types'

export default function VersicherungsCheckPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [activeTab, setActiveTab] = useState<'eingabe' | 'optimierung' | 'uebersicht'>('eingabe')
  const [check, setCheck] = useState<VersicherungsCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/clients/${clientId}/versicherungs-check`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setCheck(data)
          } else {
            // Erstelle leeren Check
            setCheck({
              versicherungen: [],
              gesamtBeitragVorher: 0,
              gesamtBeitragNachher: 0,
              einsparung: 0,
              risikoStatusVorher: 'mittel',
              risikoStatusNachher: 'mittel',
            })
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden:', err)
        setCheck({
          versicherungen: [],
          gesamtBeitragVorher: 0,
          gesamtBeitragNachher: 0,
          einsparung: 0,
          risikoStatusVorher: 'mittel',
          risikoStatusNachher: 'mittel',
        })
      } finally {
        setLoading(false)
      }
    }
    if (clientId) {
      loadData()
    }
  }, [clientId])

  const handleSave = async () => {
    if (!check) return
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/versicherungs-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(check),
      })
      if (res.ok) {
        alert('Versicherungs-Check gespeichert!')
      }
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Versicherungs-Check...</p>
        </div>
      </div>
    )
  }

  if (!check) {
    return <div>Fehler beim Laden</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/clients/${clientId}`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-green-600" />
                  Versicherungs-Check
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Analysiere und optimiere Versicherungen für maximale Absicherung bei optimalen Kosten
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Speichere...' : 'Speichern'}
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('eingabe')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'eingabe'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Aktuelle Versicherungen
            </button>
            <button
              onClick={() => setActiveTab('optimierung')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'optimierung'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Optimierungsvorschläge
            </button>
            <button
              onClick={() => setActiveTab('uebersicht')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'uebersicht'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Gesamtübersicht
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'eingabe' && (
          <VersicherungsEingabe check={check} onUpdate={setCheck} />
        )}
        {activeTab === 'optimierung' && (
          <VersicherungsOptimierung check={check} onUpdate={setCheck} />
        )}
        {activeTab === 'uebersicht' && <GesamtUebersicht check={check} />}
      </div>
    </div>
  )
}

