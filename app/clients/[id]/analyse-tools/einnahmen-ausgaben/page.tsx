"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import EinnahmenAusgabenEingabe from '@/app/components/finances/EinnahmenAusgabenEingabe'
import FinanzielleUebersicht from '@/app/components/finances/FinanzielleUebersicht'
import EinsparungsRechner from '@/app/components/finances/EinsparungsRechner'
import LebensKostenRechner from '@/app/components/finances/LebensKostenRechner'
import SzenarioVergleich from '@/app/components/finances/SzenarioVergleich'
import KonsumVsVermoegen from '@/app/components/finances/KonsumVsVermoegen'
import KategorieOptimierer from '@/app/components/finances/KategorieOptimierer'
import {
  calculateSparrate,
  findVersteckteKosten,
  formatEuro,
} from '@/app/components/finances/utils'
import type { FinanzielleSituation, Ausgabenkategorie, Einkommen } from '@/app/components/finances/types'
import { Wallet, Target, AlertCircle, TrendingUp, Lightbulb, BarChart3, ArrowLeft } from 'lucide-react'

// Initiale Situation mit leeren Kategorien
function createInitialSituation(): FinanzielleSituation {
  const fixkosten: Ausgabenkategorie[] = [
    { id: 'fix-1', name: 'Miete/Wohnung', betrag: 0, typ: 'fix', icon: 'Home', durchschnitt: 900 },
    { id: 'fix-2', name: 'Nebenkosten', betrag: 0, typ: 'fix', icon: 'Home', durchschnitt: 200 },
    { id: 'fix-3', name: 'Versicherungen', betrag: 0, typ: 'fix', icon: 'Shield', durchschnitt: 150 },
    { id: 'fix-4', name: 'Kredite/Darlehen', betrag: 0, typ: 'fix', icon: 'CreditCard', durchschnitt: 300 },
    {
      id: 'fix-5',
      name: 'Auto (Leasing/Finanzierung)',
      betrag: 0,
      typ: 'fix',
      icon: 'Car',
      durchschnitt: 300,
    },
    { id: 'fix-6', name: 'Handy/Internet', betrag: 0, typ: 'fix', icon: 'Smartphone', durchschnitt: 50 },
    {
      id: 'fix-7',
      name: 'Sparpläne/Vorsorge',
      betrag: 0,
      typ: 'fix',
      icon: 'PiggyBank',
      durchschnitt: 200,
    },
    { id: 'fix-8', name: 'Sonstige Fixkosten', betrag: 0, typ: 'fix', icon: 'Wallet', durchschnitt: 100 },
  ]

  const variableKosten: Ausgabenkategorie[] = [
    {
      id: 'var-1',
      name: 'Lebensmittel',
      betrag: 0,
      typ: 'variabel',
      icon: 'UtensilsCrossed',
      durchschnitt: 350,
    },
    {
      id: 'var-2',
      name: 'Tanken/Mobilität',
      betrag: 0,
      typ: 'variabel',
      icon: 'Car',
      durchschnitt: 150,
    },
    {
      id: 'var-3',
      name: 'Freizeit/Hobbys',
      betrag: 0,
      typ: 'variabel',
      icon: 'Gamepad2',
      durchschnitt: 200,
    },
    {
      id: 'var-4',
      name: 'Shopping/Kleidung',
      betrag: 0,
      typ: 'variabel',
      icon: 'ShoppingBag',
      durchschnitt: 150,
    },
    {
      id: 'var-5',
      name: 'Restaurants/Essen gehen',
      betrag: 0,
      typ: 'variabel',
      icon: 'UtensilsCrossed',
      durchschnitt: 150,
    },
    {
      id: 'var-6',
      name: 'Streaming/Abos',
      betrag: 0,
      typ: 'variabel',
      icon: 'Film',
      durchschnitt: 40,
    },
    { id: 'var-7', name: 'Urlaub', betrag: 0, typ: 'variabel', icon: 'Plane', durchschnitt: 150 },
    { id: 'var-8', name: 'Sonstiges', betrag: 0, typ: 'variabel', icon: 'Wallet', durchschnitt: 100 },
  ]

  return {
    persoenlicheDaten: {
      beruf: '',
      nettoEinkommen: 0,
      zusatzEinkommen: [],
    },
    fixkosten,
    variableKosten,
    timestamp: new Date(),
  }
}

export default function EinnahmenAusgabenPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const [situation, setSituation] = useState<FinanzielleSituation>(createInitialSituation())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'eingabe' | 'uebersicht' | 'tools'>('eingabe')
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // Lade gespeicherte Daten
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/clients/${clientId}/einnahmen-ausgaben`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setSituation(data)
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden:', err)
      } finally {
        setLoading(false)
      }
    }
    if (clientId) {
      loadData()
    }
  }, [clientId])

  // Auto-Save bei Änderungen
  useEffect(() => {
    if (!loading && situation.persoenlicheDaten.nettoEinkommen > 0 && clientId) {
      const timeoutId = setTimeout(() => {
        saveData()
      }, 2000) // 2 Sekunden Debounce

      return () => clearTimeout(timeoutId)
    }
  }, [situation, loading, clientId])

  const saveData = async () => {
    try {
      await fetch(`/api/clients/${clientId}/einnahmen-ausgaben`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(situation),
      })
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
    }
  }

  const handleSave = async () => {
    await saveData()
    alert('Daten gespeichert!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Daten...</p>
        </div>
      </div>
    )
  }

  const sparrate = calculateSparrate(situation)
  const versteckteKosten = findVersteckteKosten(situation)

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
                  <Wallet className="h-6 w-6 text-blue-600" />
                  Einnahmen & Ausgaben
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Analysiere die finanzielle Situation und finde Sparpotenzial
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('eingabe')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'eingabe'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Eingabe
            </button>
            <button
              onClick={() => setActiveTab('uebersicht')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'uebersicht'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tools'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Tools & Rechner
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'eingabe' && (
          <EinnahmenAusgabenEingabe situation={situation} onUpdate={setSituation} onSave={handleSave} />
        )}

        {activeTab === 'uebersicht' && <FinanzielleUebersicht situation={situation} />}

        {activeTab === 'tools' && (
          <div className="space-y-8">
            {/* Tool Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setActiveTool(activeTool === 'einsparung' ? null : 'einsparung')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeTool === 'einsparung'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-xs font-medium">Einsparungs-Rechner</p>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'lebenszeit' ? null : 'lebenszeit')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeTool === 'lebenszeit'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-xs font-medium">Lebenszeit-Kosten</p>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'szenario' ? null : 'szenario')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeTool === 'szenario'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-xs font-medium">Szenario-Vergleich</p>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'konsum' ? null : 'konsum')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeTool === 'konsum'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-xs font-medium">Konsum vs. Vermögen</p>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'optimierer' ? null : 'optimierer')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeTool === 'optimierer'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lightbulb className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-xs font-medium">Kategorie-Optimierer</p>
              </button>
            </div>

            {/* Versteckte Kosten */}
            {versteckteKosten.kategorien.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Versteckte Kosten</h3>
                <p className="text-sm text-yellow-800 mb-4">{versteckteKosten.beschreibung}</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {versteckteKosten.kategorien.map((k) => (
                    <div key={k.name} className="text-center">
                      <p className="text-xs text-gray-600">{k.name}</p>
                      <p className="text-sm font-semibold text-yellow-700">{formatEuro(k.betrag)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tool */}
            {activeTool === 'einsparung' && <EinsparungsRechner situation={situation} />}
            {activeTool === 'lebenszeit' && (
              <LebensKostenRechner situation={situation} aktuellesAlter={30} rentenAlter={67} />
            )}
            {activeTool === 'szenario' && <SzenarioVergleich situation={situation} />}
            {activeTool === 'konsum' && (
              <KonsumVsVermoegen monatlicheSparrate={sparrate} jahre={20} rendite={5} />
            )}
            {activeTool === 'optimierer' && <KategorieOptimierer situation={situation} />}
          </div>
        )}
      </div>
    </div>
  )
}

