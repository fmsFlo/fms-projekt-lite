"use client"

import { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Download,
  Edit,
  Calendar,
  Euro,
  Percent,
  Target,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Types
export interface Vorteil {
  icon: string
  titel: string
  beschreibung: string
  wert?: number
}

export interface ProduktDetails {
  produktTyp: 'riester' | 'ruerup' | 'bav' | 'private' | 'etf'
  anbieter?: string
  garantierteRente?: number
  steuerVorteil?: number
  arbeitgeberZuschuss?: number
}

export interface RentenErgebnis {
  vorher: {
    gesetzlicheRente: number
    privateVorsorge: number
    gesamtrente: number
    rentenluecke: number
    aktuellerBeitrag: number
  }
  nachher: {
    gesetzlicheRente: number
    privateVorsorge: number
    gesamtrente: number
    rentenluecke: number
    neuerBeitrag: number
  }
  verbesserung: {
    mehrRenteMonatlich: number
    mehrRenteGesamt: number
    rentenlueckeGeschlossen: number
    mehrBeitragMonatlich: number
  }
  vorteile: Vorteil[]
  produktDetails: ProduktDetails
}

interface RentenkonzeptErgebnisProps {
  ergebnis: RentenErgebnis
  onBeratungstermin?: () => void
  onPdfExport?: () => void
  onAnpassen?: () => void
}

// Helper-Funktionen
const formatEuro = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

// Count-up Animation
const useCountUp = (end: number, duration: number = 2000, decimals: number = 2) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = startValue + (end - startValue) * easeOutQuart
      setCount(Number(current.toFixed(decimals)))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration, decimals])

  return count
}

// Icon Mapping
const getIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    TrendingUp,
    TrendingDown,
    Shield,
    Sparkles,
    CheckCircle,
    Euro,
    Percent,
    Target,
  }
  const IconComponent = icons[iconName] || CheckCircle
  return <IconComponent className="h-5 w-5" />
}

// Hauptkomponente
export default function RentenkonzeptErgebnis({
  ergebnis,
  onBeratungstermin,
  onPdfExport,
  onAnpassen,
}: RentenkonzeptErgebnisProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const {
    vorher,
    nachher,
    verbesserung,
    vorteile,
    produktDetails,
  } = ergebnis

  // Animierte Werte
  const animierteLueckeGeschlossen = useCountUp(verbesserung.rentenlueckeGeschlossen, 2000, 1)
  const animierteMehrRente = useCountUp(verbesserung.mehrRenteMonatlich, 2000, 2)

  // Chart-Daten
  const chartData = [
    {
      name: 'Gesetzliche Rente',
      vorher: vorher.gesetzlicheRente,
      nachher: nachher.gesetzlicheRente,
    },
    {
      name: 'Private Vorsorge',
      vorher: vorher.privateVorsorge,
      nachher: nachher.privateVorsorge,
    },
    {
      name: 'Gesamtrente',
      vorher: vorher.gesamtrente,
      nachher: nachher.gesamtrente,
    },
  ]

  const pieData = [
    { name: 'Gesetzliche Rente', value: nachher.gesetzlicheRente },
    { name: 'Private Vorsorge', value: nachher.privateVorsorge },
  ]

  const COLORS = ['#3b82f6', '#10b981']

  const rentenlueckeGeschlossen = verbesserung.rentenlueckeGeschlossen >= 100
  const rentenlueckeReduziert = verbesserung.rentenlueckeGeschlossen > 0 && verbesserung.rentenlueckeGeschlossen < 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Dein Rentenkonzept - Ergebnis</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {rentenlueckeGeschlossen
              ? `Mit deiner neuen Vorsorge hast du deine Rentenlücke vollständig geschlossen! 🎉`
              : `Mit deiner neuen Vorsorge schließt du deine Rentenlücke zu ${animierteLueckeGeschlossen.toFixed(1)}%`}
          </p>
          <p className="text-sm text-gray-500">
            Berechnung vom {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>

        {/* Fortschrittsbalken */}
        <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Rentenlücke geschlossen</h2>
            <span className="text-3xl font-bold text-blue-600">{animierteLueckeGeschlossen.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-1000"
              style={{ width: `${verbesserung.rentenlueckeGeschlossen}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Vorher: {formatEuro(vorher.rentenluecke)}/mtl. offen</span>
            <span>
              Nachher: {nachher.rentenluecke > 0 ? formatEuro(nachher.rentenluecke) : '0,00 €'}/mtl. offen
            </span>
          </div>
        </div>

        {/* Vorher-Nachher Vergleich (3 Spalten) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Spalte 1: VORHER */}
          <div className="bg-white rounded-lg border-2 border-gray-300 shadow-sm">
            <div className="bg-gray-100 px-6 py-4 rounded-t-lg border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-gray-600" />
                <span>VORHER</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">Ohne zusätzliche Vorsorge</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesetzliche Rente</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(vorher.gesetzlicheRente)}</p>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Private Vorsorge</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(vorher.privateVorsorge)}</p>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesamtrente</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(vorher.gesamtrente)}</p>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 mb-1 font-semibold">Rentenlücke</p>
                <p className="text-3xl font-bold text-red-700">{formatEuro(vorher.rentenluecke)}</p>
                <p className="text-xs text-red-600">monatlich</p>
              </div>
            </div>
          </div>

          {/* Spalte 2: NACHHER */}
          <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg">
            <div className="bg-blue-50 px-6 py-4 rounded-t-lg border-b border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>NACHHER</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">Mit neuer Vorsorge</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesetzliche Rente</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(nachher.gesetzlicheRente)}</p>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Private Vorsorge</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600">{formatEuro(nachher.privateVorsorge)}</p>
                  <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-300 rounded">
                    +{formatEuro(verbesserung.mehrRenteMonatlich)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesamtrente</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-600">{formatEuro(nachher.gesamtrente)}</p>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-300 rounded">
                    +{formatEuro(verbesserung.mehrRenteMonatlich)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div
                className={`p-4 rounded-lg border ${
                  rentenlueckeGeschlossen
                    ? 'bg-green-50 border-green-200'
                    : rentenlueckeReduziert
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <p
                  className={`text-sm mb-1 font-semibold ${
                    rentenlueckeGeschlossen ? 'text-green-600' : rentenlueckeReduziert ? 'text-yellow-600' : 'text-red-600'
                  }`}
                >
                  Verbleibende Rentenlücke
                </p>
                <p
                  className={`text-3xl font-bold ${
                    rentenlueckeGeschlossen ? 'text-green-700' : rentenlueckeReduziert ? 'text-yellow-700' : 'text-red-700'
                  }`}
                >
                  {nachher.rentenluecke > 0 ? formatEuro(nachher.rentenluecke) : '0,00 €'}
                </p>
                <p
                  className={`text-xs ${
                    rentenlueckeGeschlossen ? 'text-green-600' : rentenlueckeReduziert ? 'text-yellow-600' : 'text-red-600'
                  }`}
                >
                  {rentenlueckeGeschlossen ? '✓ Vollständig geschlossen!' : 'monatlich'}
                </p>
              </div>
            </div>
          </div>

          {/* Spalte 3: MONATLICHER BEITRAG */}
          <div className="bg-white rounded-lg border-2 border-purple-300 shadow-sm">
            <div className="bg-purple-50 px-6 py-4 rounded-t-lg border-b border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Euro className="h-5 w-5 text-purple-600" />
                <span>MONATLICHER BEITRAG</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {vorher.aktuellerBeitrag > 0 && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Aktueller Beitrag</p>
                    <p className="text-2xl font-bold text-gray-900">{formatEuro(vorher.aktuellerBeitrag)}</p>
                    <p className="text-xs text-gray-500">monatlich</p>
                  </div>
                  <hr className="border-gray-200" />
                </>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Neuer Beitrag</p>
                <p className="text-2xl font-bold text-purple-600">{formatEuro(nachher.neuerBeitrag)}</p>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 mb-1 font-semibold">Differenz</p>
                <p className="text-3xl font-bold text-purple-700">
                  {verbesserung.mehrBeitragMonatlich > 0 ? '+' : ''}
                  {formatEuro(verbesserung.mehrBeitragMonatlich)}
                </p>
                <p className="text-xs text-purple-600">
                  {verbesserung.mehrBeitragMonatlich > 0
                    ? `nur ${formatEuro(verbesserung.mehrBeitragMonatlich)} mehr`
                    : 'Keine Änderung'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Vorher vs. Nachher Vergleich</h3>
            <p className="text-sm text-gray-600 mb-4">Monatliche Rentenbestandteile im Vergleich</p>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatEuro(value)} />
                  <Bar dataKey="vorher" fill="#9ca3af" name="Vorher" />
                  <Bar dataKey="nachher" fill="#3b82f6" name="Nachher" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Zusammensetzung der Gesamtrente</h3>
            <p className="text-sm text-gray-600 mb-4">Nachher: Anteile der Rentenbestandteile</p>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatEuro(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Vorteile-Sektion */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Deine Vorteile</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Warum diese Vorsorge für dich passt</p>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vorteile.map((vorteil, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    {getIcon(vorteil.icon)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{vorteil.titel}</h3>
                    <p className="text-sm text-gray-600">{vorteil.beschreibung}</p>
                    {vorteil.wert !== undefined && (
                      <p className="text-sm font-semibold text-blue-600 mt-1">{formatEuro(vorteil.wert)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call-to-Action Bereich */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg border border-blue-600 shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onBeratungstermin}
                className="px-6 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-medium min-w-[200px] flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="h-5 w-5" />
                Beratungstermin vereinbaren
              </button>
              <button
                onClick={onPdfExport}
                className="px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-lg font-medium min-w-[200px] flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="h-5 w-5" />
                Konzept als PDF speichern
              </button>
              <button
                onClick={onAnpassen}
                className="px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-lg font-medium min-w-[200px] flex items-center justify-center gap-2 transition-colors"
              >
                <Edit className="h-5 w-5" />
                Berechnung anpassen
              </button>
            </div>
        </div>
      </div>
    </div>
  )
}

