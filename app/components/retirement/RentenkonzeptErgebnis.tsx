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
  ArrowLeft,
  ChevronDown,
  ChevronUp,
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
    gesetzlicheRenteNominal?: number
    privateVorsorge: number
    privateVorsorgeNominal?: number
    gesamtrente: number
    gesamtrenteNominal?: number
    rentenluecke: number
    aktuellerBeitrag: number
  }
  nachher: {
    gesetzlicheRente: number
    gesetzlicheRenteNominal?: number
    privateVorsorge: number
    privateVorsorgeNominal?: number
    gesamtrente: number
    gesamtrenteNominal?: number
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
  recommendationData?: {
    recommendation?: string
    recommendationProvider?: string
    recommendationAdvantages?: string
    expectedRente?: number
  } | null
  onBack?: () => void
  calculationData?: {
    returnRate?: number
    monthlySavings?: number
    yearsToRetirement?: number
    gapBefore?: number
    targetPension?: number
    inflationRate?: number
  } | null
  conceptId?: string
  onSave?: (data: {
    productBefore?: string
    additionalRenteBefore?: number
    providerAfter?: string
    advantages?: string
    renteAfter1?: number
    renteAfter2?: number
    renteAfter3?: number
    returnRate1?: number
    returnRate2?: number
    returnRate3?: number
    monthlyContributionBefore?: number
    monthlyContributionAfter?: number
  }) => Promise<void>
  productComparisonData?: {
    productBefore?: string
    additionalRenteBefore?: number
    providerAfter?: string
    advantages?: string
    renteAfter1?: number
    renteAfter2?: number
    renteAfter3?: number
    returnRate1?: number
    returnRate2?: number
    returnRate3?: number
    monthlyContributionBefore?: number
    monthlyContributionAfter?: number
  } | null
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

// Collapsible-Komponente für klappbare Sektionen
const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  )
}

// Hauptkomponente
export default function RentenkonzeptErgebnis({
  ergebnis,
  onBeratungstermin,
  onPdfExport,
  onAnpassen,
  recommendationData,
  onBack,
  calculationData,
  conceptId,
  onSave,
  productComparisonData,
}: RentenkonzeptErgebnisProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [simulationReturnRate, setSimulationReturnRate] = useState(calculationData?.returnRate || 5.0)

  // Destructure ergebnis zuerst
  const {
    vorher,
    nachher,
    verbesserung,
    vorteile,
    produktDetails,
  } = ergebnis
  
  // Eingabefelder für Produktvergleich - Initialisierung aus Props
  const [productBefore, setProductBefore] = useState(productComparisonData?.productBefore || '')
  const [additionalRenteBefore, setAdditionalRenteBefore] = useState(
    productComparisonData?.additionalRenteBefore?.toString() || vorher.privateVorsorge.toString() || ''
  )
  const [providerAfter, setProviderAfter] = useState(
    productComparisonData?.providerAfter || recommendationData?.recommendationProvider || ''
  )
  const [advantages, setAdvantages] = useState(
    productComparisonData?.advantages || recommendationData?.recommendationAdvantages || ''
  )
  const [numberOfScenarios, setNumberOfScenarios] = useState(
    productComparisonData?.renteAfter3 ? 3 : productComparisonData?.renteAfter2 ? 2 : 1
  )
  const [renteAfter1, setRenteAfter1] = useState(
    productComparisonData?.renteAfter1?.toString() || recommendationData?.expectedRente?.toString() || ''
  )
  const [renteAfter2, setRenteAfter2] = useState(productComparisonData?.renteAfter2?.toString() || '')
  const [renteAfter3, setRenteAfter3] = useState(productComparisonData?.renteAfter3?.toString() || '')
  const [returnRate1, setReturnRate1] = useState(
    productComparisonData?.returnRate1?.toString() || '5.0'
  )
  const [returnRate2, setReturnRate2] = useState(
    productComparisonData?.returnRate2?.toString() || '6.0'
  )
  const [returnRate3, setReturnRate3] = useState(
    productComparisonData?.returnRate3?.toString() || '7.0'
  )
  const [monthlyContributionBefore, setMonthlyContributionBefore] = useState(
    productComparisonData?.monthlyContributionBefore?.toString() || 
    (vorher.aktuellerBeitrag || nachher.neuerBeitrag || 0).toString()
  )
  const [monthlyContributionAfter, setMonthlyContributionAfter] = useState(
    productComparisonData?.monthlyContributionAfter?.toString() || ''
  )
  const [activeScenario, setActiveScenario] = useState<1 | 2 | 3>(
    (productComparisonData?.renteAfter1 ? 1 : productComparisonData?.renteAfter2 ? 2 : productComparisonData?.renteAfter3 ? 3 : 1) as 1 | 2 | 3
  )
  const [saving, setSaving] = useState(false)
  const [showInCurrentPurchasingPower, setShowInCurrentPurchasingPower] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Berechne Vergleichswerte (muss vor useCountUp sein)
  const additionalRenteBeforeValue = parseFloat(additionalRenteBefore) || vorher.privateVorsorge
  const renteAfter1Value = parseFloat(renteAfter1) || 0
  const renteAfter2Value = parseFloat(renteAfter2) || 0
  const renteAfter3Value = parseFloat(renteAfter3) || 0
  
  // Inflationsfaktor für Umrechnung
  const yearsToRetirement = calculationData?.yearsToRetirement || 20
  const inflationRate = (calculationData?.inflationRate || 2.0) / 100 // Standard 2% Inflation
  const inflationFactor = Math.pow(1 + inflationRate, yearsToRetirement)
  
  // Gesetzliche Rente: Immer aus den errechneten Werten nehmen
  // netCurrent = heutige Kaufkraft, netFuture = nominal (inflationsbereinigt)
  // vorher.gesetzlicheRente = netCurrent (heutige Kaufkraft)
  // vorher.gesetzlicheRenteNominal = netFuture (nominal, inflationsbereinigt)
  // VORHER - mit Fallback-Berechnung
  const vorherGesetzlicheRenteCurrent = vorher.gesetzlicheRente || 0
  const vorherGesetzlicheRenteNominal = (vorher.gesetzlicheRenteNominal !== undefined && vorher.gesetzlicheRenteNominal !== null) 
    ? vorher.gesetzlicheRenteNominal 
    : vorherGesetzlicheRenteCurrent * inflationFactor  // ✅ Hochrechnen statt 0!
  
  // Private Vorsorge: Eingegebene Werte sind NOMINAL (inflationsbereinigt)
  // Wenn keine Eingabe, verwende errechnete Werte
  const vorherPrivateVorsorgeNominal = vorher.privateVorsorgeNominal || vorher.privateVorsorge || 0
  const vorherPrivateVorsorgeCurrent = vorher.privateVorsorge || 0 // netCurrent (heutige Kaufkraft)
  
  // Wenn Eingabe vorhanden: Eingabe ist NOMINAL, muss für Kaufkraft-Anzeige abgezinst werden
  const hasInputBefore = parseFloat(additionalRenteBefore) > 0 && parseFloat(additionalRenteBefore) !== vorher.privateVorsorge
  const vorherPrivateVorsorgeInputNominal = hasInputBefore ? additionalRenteBeforeValue : vorherPrivateVorsorgeNominal
  const vorherPrivateVorsorgeInputCurrent = hasInputBefore 
    ? (additionalRenteBeforeValue / inflationFactor) // Abzinsen von nominal zu Kaufkraft
    : vorherPrivateVorsorgeCurrent
  
  // Anzeige basierend auf Toggle
  const vorherGesetzlicheRenteDisplay = showInCurrentPurchasingPower 
    ? vorherGesetzlicheRenteCurrent
    : vorherGesetzlicheRenteNominal
  
  const vorherPrivateVorsorgeDisplay = showInCurrentPurchasingPower
    ? vorherPrivateVorsorgeInputCurrent
    : vorherPrivateVorsorgeInputNominal
  
  const vorherGesamtrenteDisplay = vorherGesetzlicheRenteDisplay + vorherPrivateVorsorgeDisplay
  
  // Zielrente für Rentenlücke (immer nominal)
  // WICHTIG: calculationData?.targetPension ist in heutiger Kaufkraft (targetPensionNetto)
  // Muss hochgerechnet werden zu nominalen Werten
  const targetPensionCurrent = calculationData?.targetPension || 0
  const targetPensionNominal = targetPensionCurrent > 0
    ? targetPensionCurrent * inflationFactor  // Hochrechnen von Kaufkraft zu nominal
    : (vorherGesetzlicheRenteNominal + vorherPrivateVorsorgeNominal + vorher.rentenluecke) || 
      ((vorher.gesamtrenteNominal || (vorher.gesamtrente * inflationFactor)) + vorher.rentenluecke) || 0
  
  // Rentenlücke: Immer in nominalen Werten berechnen
  // Berechne immer neu, um Konsistenz zu gewährleisten
  const vorherGesamtrenteNominalCalc = vorherGesetzlicheRenteNominal + vorherPrivateVorsorgeInputNominal
  const vorherRentenlueckeNominal = Math.max(0, targetPensionNominal - vorherGesamtrenteNominalCalc)
  const vorherRentenlueckeCurrent = vorherRentenlueckeNominal / inflationFactor  // Abzinsen für Kaufkraft-Anzeige
  
  // Berechne Werte für NACHHER Karte (mit eingegebenen Werten und aktivem Szenario)
  // Eingaben sind NOMINAL (inflationsbereinigt), müssen für Kaufkraft-Anzeige abgezinst werden
  const nachherPrivateVorsorgeInputNominal = 
    activeScenario === 1 && renteAfter1Value > 0 ? renteAfter1Value :
    activeScenario === 2 && renteAfter2Value > 0 ? renteAfter2Value :
    activeScenario === 3 && renteAfter3Value > 0 ? renteAfter3Value :
    renteAfter1Value > 0 ? renteAfter1Value :
    renteAfter2Value > 0 ? renteAfter2Value :
    renteAfter3Value > 0 ? renteAfter3Value :
    0
  
  // Gesetzliche Rente: Immer aus den errechneten Werten nehmen
  // nachher.gesetzlicheRente = netCurrent (heutige Kaufkraft)
  // nachher.gesetzlicheRenteNominal = netFuture (nominal, inflationsbereinigt)
  // NACHHER - mit Fallback-Berechnung
  const nachherGesetzlicheRenteCurrent = nachher.gesetzlicheRente || vorherGesetzlicheRenteCurrent || 0
  const nachherGesetzlicheRenteNominal = (nachher.gesetzlicheRenteNominal !== undefined && nachher.gesetzlicheRenteNominal !== null)
    ? nachher.gesetzlicheRenteNominal 
    : nachherGesetzlicheRenteCurrent * inflationFactor  // ✅ Hochrechnen statt 0!
  
  // Private Vorsorge: Wenn Eingabe vorhanden, ist sie NOMINAL
  // Wenn keine Eingabe, verwende errechnete Werte
  const nachherPrivateVorsorgeNominal = nachher.privateVorsorgeNominal || nachher.privateVorsorge || 0
  const nachherPrivateVorsorgeCurrent = nachher.privateVorsorge || 0
  
  const hasInputAfter = nachherPrivateVorsorgeInputNominal > 0
  const nachherPrivateVorsorgeInputNominalFinal = hasInputAfter 
    ? nachherPrivateVorsorgeInputNominal 
    : nachherPrivateVorsorgeNominal
  const nachherPrivateVorsorgeInputCurrent = hasInputAfter
    ? (nachherPrivateVorsorgeInputNominal / inflationFactor) // Abzinsen von nominal zu Kaufkraft
    : nachherPrivateVorsorgeCurrent
  
  // Anzeige basierend auf Toggle
  const nachherGesetzlicheRenteDisplay = showInCurrentPurchasingPower
    ? nachherGesetzlicheRenteCurrent
    : nachherGesetzlicheRenteNominal
  
  const nachherPrivateVorsorgeDisplay = showInCurrentPurchasingPower
    ? nachherPrivateVorsorgeInputCurrent
    : nachherPrivateVorsorgeInputNominalFinal
  
  const nachherGesamtrenteDisplay = nachherGesetzlicheRenteDisplay + nachherPrivateVorsorgeDisplay
  
  // Rentenlücke: Immer in nominalen Werten berechnen
  // Berechne immer neu, um Konsistenz zu gewährleisten
  const nachherGesamtrenteNominalCalc = nachherGesetzlicheRenteNominal + nachherPrivateVorsorgeInputNominalFinal
  const nachherRentenlueckeNominal = Math.max(0, targetPensionNominal - nachherGesamtrenteNominalCalc)
  const nachherRentenlueckeCurrent = nachherRentenlueckeNominal / inflationFactor  // Abzinsen für Kaufkraft-Anzeige
  
  // Display-Werte basierend auf Toggle
  const vorherRentenlueckeDisplay = showInCurrentPurchasingPower ? vorherRentenlueckeCurrent : vorherRentenlueckeNominal
  const nachherRentenlueckeDisplay = showInCurrentPurchasingPower ? nachherRentenlueckeCurrent : nachherRentenlueckeNominal
  
  const totalRenteBefore = vorherPrivateVorsorgeDisplay
  // Verbesserung in Anzeigewerten (kaufkraft oder nominal)
  // Eingaben sind nominal, müssen für Anzeige entsprechend umgerechnet werden
  const renteAfter1Display = renteAfter1Value > 0 
    ? (showInCurrentPurchasingPower ? renteAfter1Value / inflationFactor : renteAfter1Value)
    : 0
  const renteAfter2Display = renteAfter2Value > 0 
    ? (showInCurrentPurchasingPower ? renteAfter2Value / inflationFactor : renteAfter2Value)
    : 0
  const renteAfter3Display = renteAfter3Value > 0 
    ? (showInCurrentPurchasingPower ? renteAfter3Value / inflationFactor : renteAfter3Value)
    : 0
  
  const improvement1 = renteAfter1Display - vorherPrivateVorsorgeDisplay
  const improvement2 = renteAfter2Display - vorherPrivateVorsorgeDisplay
  const improvement3 = renteAfter3Display - vorherPrivateVorsorgeDisplay
  
  const gapBefore = vorherRentenlueckeNominal  // Für Prozent-Berechnung immer nominal verwenden
  // Lückenberechnung immer in nominalen Werten (Eingaben sind bereits nominal)
  const improvement1Nominal = renteAfter1Value - vorherPrivateVorsorgeInputNominal
  const improvement2Nominal = renteAfter2Value - vorherPrivateVorsorgeInputNominal
  const improvement3Nominal = renteAfter3Value - vorherPrivateVorsorgeInputNominal
  const gapAfter1 = Math.max(0, gapBefore - improvement1Nominal)
  const gapAfter2 = Math.max(0, gapBefore - improvement2Nominal)
  const gapAfter3 = Math.max(0, gapBefore - improvement3Nominal)
  
  // Monatlicher Beitrag aus Eingaben
  const monthlyContributionBeforeValue = parseFloat(monthlyContributionBefore) || vorher.aktuellerBeitrag || nachher.neuerBeitrag || 0
  const monthlyContributionAfterValue = parseFloat(monthlyContributionAfter) || nachher.neuerBeitrag || 0
  
  // Berechne Verbesserung für die Hauptanzeige (in Anzeigewerten)
  const mehrRenteMonatlich = nachherPrivateVorsorgeDisplay - vorherPrivateVorsorgeDisplay
  const rentenlueckeGeschlossenPercent = gapBefore > 0 ? Math.min(100, ((gapBefore - nachherRentenlueckeNominal) / gapBefore) * 100) : 100

  // Animierte Werte
  const animierteLueckeGeschlossen = useCountUp(rentenlueckeGeschlossenPercent, 2000, 1)
  const animierteMehrRente = useCountUp(mehrRenteMonatlich, 2000, 2)

  // Berechne Simulation für verschiedene Renditen
  const calculateSimulation = (returnRate: number) => {
    const monthlySavings = calculationData?.monthlySavings || nachher.neuerBeitrag
    const yearsToRetirement = calculationData?.yearsToRetirement || 20
    const gapBefore = calculationData?.gapBefore || vorher.rentenluecke
    
    if (monthlySavings <= 0 || yearsToRetirement <= 0) {
      return {
        futureCapital: 0,
        monthlyPension: 0,
        remainingGap: gapBefore,
      }
    }

    // Berechne zukünftiges Kapital mit Zinseszins
    const monthlyRate = returnRate / 100 / 12
    const months = yearsToRetirement * 12
    const futureCapital = monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    
    // Entnahmephase: 3% Entnahmerate
    const withdrawalRate = 0.03
    const monthlyPension = (futureCapital * withdrawalRate) / 12
    
    // Berechne verbleibende Lücke
    const remainingGap = Math.max(0, gapBefore - monthlyPension)
    
    return {
      futureCapital,
      monthlyPension,
      remainingGap,
    }
  }

  const currentSimulation = calculateSimulation(simulationReturnRate)
  const simulationScenarios = [3, 4, 5, 6, 7].map(rate => ({
    rate,
    ...calculateSimulation(rate),
  }))

  // Chart-Daten (mit eingegebenen Werten, basierend auf Toggle)
  const chartData = [
    {
      name: 'Gesetzliche Rente',
      vorher: vorherGesetzlicheRenteDisplay,
      nachher: nachherGesetzlicheRenteDisplay,
    },
    {
      name: 'Private Vorsorge',
      vorher: vorherPrivateVorsorgeDisplay,
      nachher: nachherPrivateVorsorgeDisplay,
    },
    {
      name: 'Gesamtrente',
      vorher: vorherGesamtrenteDisplay,
      nachher: nachherGesamtrenteDisplay,
    },
  ]

  const pieData = [
    { name: 'Gesetzliche Rente', value: nachherGesetzlicheRenteDisplay },
    { name: 'Private Vorsorge', value: nachherPrivateVorsorgeDisplay },
  ]

  const COLORS = ['#3b82f6', '#10b981']

  const rentenlueckeGeschlossen = nachherRentenlueckeNominal === 0
  const rentenlueckeReduziert = nachherRentenlueckeNominal > 0 && nachherRentenlueckeNominal < vorherRentenlueckeNominal

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave({
        productBefore: productBefore || undefined,
        additionalRenteBefore: additionalRenteBeforeValue > 0 ? additionalRenteBeforeValue : undefined,
        providerAfter: providerAfter || undefined,
        advantages: advantages || undefined,
        renteAfter1: renteAfter1Value > 0 ? renteAfter1Value : undefined,
        renteAfter2: renteAfter2Value > 0 ? renteAfter2Value : undefined,
        renteAfter3: renteAfter3Value > 0 ? renteAfter3Value : undefined,
        returnRate1: parseFloat(returnRate1) || undefined,
        returnRate2: parseFloat(returnRate2) || undefined,
        returnRate3: parseFloat(returnRate3) || undefined,
        monthlyContributionBefore: monthlyContributionBeforeValue > 0 ? monthlyContributionBeforeValue : undefined,
        monthlyContributionAfter: parseFloat(monthlyContributionAfter) > 0 ? parseFloat(monthlyContributionAfter) : undefined,
      })
      // Erfolgsmeldung
      alert('✅ Daten erfolgreich gespeichert!')
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error)
      alert(`❌ Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Desktop: Box-Container, Mobile: unverändert */}
        <div className="lg:border lg:rounded-lg lg:p-6 lg:bg-white lg:shadow-sm space-y-8">
        {/* Zurück-Button */}
        {onBack && (
          <div className="mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Zurück zum Konzept</span>
            </button>
          </div>
        )}

        {/* Eingabemaske für Produktvergleich - Einklappbar */}
        <CollapsibleSection title="Produktvergleich" defaultOpen={false}>
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Vergleichen Sie Ihre aktuelle Situation mit unseren Empfehlungen</p>
              </div>
              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? 'Speichere...' : '💾 Speichern'}
                </button>
              )}
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* VORHER - Linke Spalte */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">VORHER</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produkt vorher (optional)
                </label>
                <input
                  type="text"
                  value={productBefore}
                  onChange={(e) => setProductBefore(e.target.value)}
                  placeholder="z. B. Riester-Rente, Basis-Rente, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zusatzrente vorher (€/Monat)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={additionalRenteBefore || vorher.privateVorsorge}
                  onChange={(e) => setAdditionalRenteBefore(e.target.value)}
                  placeholder={formatEuro(vorher.privateVorsorge)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatisch aus Eingaben: {formatEuro(vorher.privateVorsorge)} €/Monat (kann angepasst werden)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monatlicher Beitrag vorher (€/Monat)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={monthlyContributionBefore}
                  onChange={(e) => setMonthlyContributionBefore(e.target.value)}
                  placeholder={formatEuro(vorher.aktuellerBeitrag || nachher.neuerBeitrag || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vorschlag aus Eingaben: {formatEuro(vorher.aktuellerBeitrag || nachher.neuerBeitrag || 0)} €/Monat
                </p>
              </div>
            </div>

            {/* NACHHER - Rechte Spalte */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">NACHHER</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anbieter nachher *
                </label>
                <input
                  type="text"
                  value={providerAfter}
                  onChange={(e) => setProviderAfter(e.target.value)}
                  placeholder="z. B. Allianz, AXA, HDI, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anzahl erwarteter Renten
                </label>
                <select
                  value={numberOfScenarios}
                  onChange={(e) => setNumberOfScenarios(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 erwartete Rente</option>
                  <option value={2}>2 erwartete Renten</option>
                  <option value={3}>3 erwartete Renten</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Erwartete Rente 1 (€/Monat) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={renteAfter1}
                    onChange={(e) => setRenteAfter1(e.target.value)}
                    placeholder="z. B. 500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    bei Rendite (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    value={returnRate1}
                    onChange={(e) => setReturnRate1(e.target.value)}
                    placeholder="z. B. 5.0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {numberOfScenarios >= 2 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Erwartete Rente 2 (€/Monat)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={renteAfter2}
                      onChange={(e) => setRenteAfter2(e.target.value)}
                      placeholder="z. B. 600"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      bei Rendite (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      step="0.1"
                      value={returnRate2}
                      onChange={(e) => setReturnRate2(e.target.value)}
                      placeholder="z. B. 6.0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {numberOfScenarios >= 3 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Erwartete Rente 3 (€/Monat)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={renteAfter3}
                      onChange={(e) => setRenteAfter3(e.target.value)}
                      placeholder="z. B. 700"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      bei Rendite (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      step="0.1"
                      value={returnRate3}
                      onChange={(e) => setReturnRate3(e.target.value)}
                      placeholder="z. B. 7.0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monatlicher Beitrag aktuell/nachher (€/Monat)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={monthlyContributionAfter}
                  onChange={(e) => setMonthlyContributionAfter(e.target.value)}
                  placeholder="z. B. 200"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Monatlicher Beitrag für die neue Lösung
                </p>
              </div>

              {/* Szenario-Auswahl für Hauptanzeige */}
              {(numberOfScenarios >= 2 || (renteAfter1Value > 0 && renteAfter2Value > 0) || (renteAfter1Value > 0 && renteAfter3Value > 0) || (renteAfter2Value > 0 && renteAfter3Value > 0)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aktives Szenario für Hauptanzeige
                  </label>
                  <select
                    value={activeScenario}
                    onChange={(e) => setActiveScenario(parseInt(e.target.value) as 1 | 2 | 3)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {renteAfter1Value > 0 && (
                      <option value={1}>Szenario 1: {formatEuro(renteAfter1Value)} bei {parseFloat(returnRate1) || 0}%</option>
                    )}
                    {renteAfter2Value > 0 && (
                      <option value={2}>Szenario 2: {formatEuro(renteAfter2Value)} bei {parseFloat(returnRate2) || 0}%</option>
                    )}
                    {renteAfter3Value > 0 && (
                      <option value={3}>Szenario 3: {formatEuro(renteAfter3Value)} bei {parseFloat(returnRate3) || 0}%</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Wählen Sie, welches Szenario in der Hauptanzeige (NACHHER Karte) verwendet werden soll
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorteile (individuell ergänzbar)
                </label>
                <textarea
                  value={advantages}
                  onChange={(e) => setAdvantages(e.target.value)}
                  rows={4}
                  placeholder="z. B. Steuervorteile, Flexibilität, Garantien, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Vergleich auf einen Blick */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Vergleich auf einen Blick</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Vorher */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
                <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">VORHER</p>
                <p className="text-sm text-gray-600 mb-1">Private Vorsorge</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(totalRenteBefore)}</p>
                <p className="text-xs text-gray-500 mt-1">€/Monat</p>
                {monthlyContributionBeforeValue > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Monatlicher Beitrag:</span> {formatEuro(monthlyContributionBeforeValue)}
                    </p>
                  </div>
                )}
                {productBefore && (
                  <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">{productBefore}</p>
                )}
              </div>

              {/* Erwartete Rente 1 */}
              {renteAfter1Value > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-400">
                  <p className="text-xs uppercase tracking-wide text-blue-700 mb-2">
                    Erwartete Rente bei {parseFloat(returnRate1) || 0}%
                  </p>
                  <p className="text-sm text-blue-600 mb-1">Neue Rente</p>
                  <p className="text-2xl font-bold text-blue-900">{formatEuro(renteAfter1Display)}</p>
                  <p className="text-xs text-blue-500 mt-1">€/Monat {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
                  <div className="mt-2 pt-2 border-t border-blue-200 space-y-1">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Verbesserung:</span> {improvement1 >= 0 ? '+' : ''}{formatEuro(improvement1)}
                    </p>
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Verbleibende Lücke:</span> {formatEuro(gapAfter1)}
                    </p>
                    {improvement1 > 0 && (
                      <p className="text-xs text-emerald-700 font-semibold mt-1">
                        💰 Gespart: {formatEuro(improvement1)}/Monat
                      </p>
                    )}
                    {monthlyContributionAfter && parseFloat(monthlyContributionAfter) > 0 && (
                      <p className="text-xs text-blue-700 mt-1">
                        <span className="font-semibold">Monatlicher Beitrag:</span> {formatEuro(parseFloat(monthlyContributionAfter))}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Erwartete Rente 2 */}
              {numberOfScenarios >= 2 && renteAfter2Value > 0 && (
                <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-400">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 mb-2">
                    Erwartete Rente bei {parseFloat(returnRate2) || 0}%
                  </p>
                  <p className="text-sm text-emerald-600 mb-1">Neue Rente</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatEuro(renteAfter2Display)}</p>
                  <p className="text-xs text-emerald-500 mt-1">€/Monat {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
                  <div className="mt-2 pt-2 border-t border-emerald-200 space-y-1">
                    <p className="text-xs text-emerald-700">
                      <span className="font-semibold">Verbesserung:</span> {improvement2 >= 0 ? '+' : ''}{formatEuro(improvement2)}
                    </p>
                    <p className="text-xs text-emerald-700">
                      <span className="font-semibold">Verbleibende Lücke:</span> {formatEuro(gapAfter2)}
                    </p>
                    {improvement2 > 0 && (
                      <p className="text-xs text-emerald-800 font-semibold mt-1">
                        💰 Gespart: {formatEuro(improvement2)}/Monat
                      </p>
                    )}
                    {monthlyContributionAfter && parseFloat(monthlyContributionAfter) > 0 && (
                      <p className="text-xs text-emerald-700 mt-1">
                        <span className="font-semibold">Monatlicher Beitrag:</span> {formatEuro(parseFloat(monthlyContributionAfter))}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Erwartete Rente 3 */}
              {numberOfScenarios >= 3 && renteAfter3Value > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-400">
                  <p className="text-xs uppercase tracking-wide text-purple-700 mb-2">
                    Erwartete Rente bei {parseFloat(returnRate3) || 0}%
                  </p>
                  <p className="text-sm text-purple-600 mb-1">Neue Rente</p>
                  <p className="text-2xl font-bold text-purple-900">{formatEuro(renteAfter3Display)}</p>
                  <p className="text-xs text-purple-500 mt-1">€/Monat {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
                  <div className="mt-2 pt-2 border-t border-purple-200 space-y-1">
                    <p className="text-xs text-purple-700">
                      <span className="font-semibold">Verbesserung:</span> {improvement3 >= 0 ? '+' : ''}{formatEuro(improvement3)}
                    </p>
                    <p className="text-xs text-purple-700">
                      <span className="font-semibold">Verbleibende Lücke:</span> {formatEuro(gapAfter3)}
                    </p>
                    {improvement3 > 0 && (
                      <p className="text-xs text-purple-800 font-semibold mt-1">
                        💰 Gespart: {formatEuro(improvement3)}/Monat
                      </p>
                    )}
                    {monthlyContributionAfter && parseFloat(monthlyContributionAfter) > 0 && (
                      <p className="text-xs text-purple-700 mt-1">
                        <span className="font-semibold">Monatlicher Beitrag:</span> {formatEuro(parseFloat(monthlyContributionAfter))}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vorteile anzeigen */}
            {advantages && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900 mb-2">Vorteile der neuen Lösung:</p>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">{advantages}</p>
              </div>
            )}
          </div>
          </div>
        </CollapsibleSection>
        
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
          
          {/* Toggle für Kaufkraft/Nominal */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`text-sm font-medium ${!showInCurrentPurchasingPower ? 'text-gray-900' : 'text-gray-500'}`}>
              Nominalwerte
            </span>
            <button
              onClick={() => setShowInCurrentPurchasingPower(!showInCurrentPurchasingPower)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showInCurrentPurchasingPower ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInCurrentPurchasingPower ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${showInCurrentPurchasingPower ? 'text-gray-900' : 'text-gray-500'}`}>
              Heutige Kaufkraft
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {showInCurrentPurchasingPower 
              ? 'Renten werden in heutiger Kaufkraft angezeigt. Die Rentenlücke wird in nominalen (inflationsbereinigten) Werten berechnet.'
              : 'Renten werden in nominalen (inflationsbereinigten) Werten angezeigt. Die Rentenlücke wird ebenfalls in nominalen Werten berechnet.'}
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
              style={{ width: `${rentenlueckeGeschlossenPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Vorher: {formatEuro(vorherRentenlueckeDisplay)}/mtl. offen</span>
            <span>
              Nachher: {nachherRentenlueckeNominal > 0 ? formatEuro(nachherRentenlueckeDisplay) : '0,00 €'}/mtl. offen
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
                <p className="text-2xl font-bold text-gray-900">{formatEuro(vorherGesetzlicheRenteDisplay)}</p>
                <p className="text-xs text-gray-500">monatlich {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Private Vorsorge</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(vorherPrivateVorsorgeDisplay)}</p>
                <p className="text-xs text-gray-500">monatlich {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesamtrente</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(vorherGesamtrenteDisplay)}</p>
                <p className="text-xs text-gray-500">monatlich {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
              </div>
              <hr className="border-gray-200" />
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 mb-1 font-semibold">Rentenlücke</p>
                <p className="text-3xl font-bold text-red-700">{formatEuro(vorherRentenlueckeDisplay)}</p>
                <p className="text-xs text-red-600">
                  monatlich {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal, inflationsbereinigt)'}
                </p>
                {!showInCurrentPurchasingPower && vorherRentenlueckeNominal > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    ≈ {formatEuro(vorherRentenlueckeCurrent)} in heutiger Kaufkraft
                  </p>
                )}
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
                <p className="text-2xl font-bold text-gray-900">{formatEuro(nachherGesetzlicheRenteDisplay)}</p>
                <p className="text-xs text-gray-500">monatlich {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Private Vorsorge</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600">{formatEuro(nachherPrivateVorsorgeDisplay)}</p>
                  {mehrRenteMonatlich > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-300 rounded">
                      +{formatEuro(mehrRenteMonatlich)}
                  </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">monatlich {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesamtrente</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-600">{formatEuro(nachherGesamtrenteDisplay)}</p>
                  {mehrRenteMonatlich > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-300 rounded">
                      +{formatEuro(mehrRenteMonatlich)}
                  </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">monatlich {showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal)'}</p>
              </div>
              <hr className="border-gray-200" />
              <div
                className={`p-4 rounded-lg border ${
                  nachherRentenlueckeNominal === 0
                    ? 'bg-green-50 border-green-200'
                    : nachherRentenlueckeNominal < vorherRentenlueckeNominal
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <p
                  className={`text-sm mb-1 font-semibold ${
                    nachherRentenlueckeNominal === 0 ? 'text-green-600' : nachherRentenlueckeNominal < vorherRentenlueckeNominal ? 'text-yellow-600' : 'text-red-600'
                  }`}
                >
                  Verbleibende Rentenlücke
                </p>
                <p
                  className={`text-3xl font-bold ${
                    nachherRentenlueckeNominal === 0 ? 'text-green-700' : nachherRentenlueckeNominal < vorherRentenlueckeNominal ? 'text-yellow-700' : 'text-red-700'
                  }`}
                >
                  {nachherRentenlueckeNominal > 0 ? formatEuro(nachherRentenlueckeDisplay) : '0,00 €'}
                </p>
                <p
                  className={`text-xs ${
                    nachherRentenlueckeNominal === 0 ? 'text-green-600' : nachherRentenlueckeNominal < vorherRentenlueckeNominal ? 'text-yellow-600' : 'text-red-600'
                  }`}
                >
                  {nachherRentenlueckeNominal === 0 ? '✓ Vollständig geschlossen!' : `monatlich ${showInCurrentPurchasingPower ? '(heutige Kaufkraft)' : '(nominal, inflationsbereinigt)'}`}
                </p>
                {!showInCurrentPurchasingPower && nachherRentenlueckeNominal > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    ≈ {formatEuro(nachherRentenlueckeCurrent)} in heutiger Kaufkraft
                  </p>
                )}
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
              {monthlyContributionBeforeValue > 0 && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Aktueller Beitrag</p>
                    <p className="text-2xl font-bold text-gray-900">{formatEuro(monthlyContributionBeforeValue)}</p>
                    <p className="text-xs text-gray-500">monatlich</p>
                  </div>
                  <hr className="border-gray-200" />
                </>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Neuer Beitrag</p>
                <p className="text-2xl font-bold text-purple-600">{formatEuro(monthlyContributionAfterValue)}</p>
                <p className="text-xs text-gray-500">monatlich</p>
              </div>
              <hr className="border-gray-200" />
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 mb-1 font-semibold">Differenz</p>
                <p className="text-3xl font-bold text-purple-700">
                  {monthlyContributionAfterValue - monthlyContributionBeforeValue > 0 ? '+' : ''}
                  {formatEuro(monthlyContributionAfterValue - monthlyContributionBeforeValue)}
                </p>
                <p className="text-xs text-purple-600">
                  {monthlyContributionAfterValue - monthlyContributionBeforeValue > 0
                    ? `nur ${formatEuro(monthlyContributionAfterValue - monthlyContributionBeforeValue)} mehr`
                    : monthlyContributionAfterValue - monthlyContributionBeforeValue < 0
                      ? `${formatEuro(Math.abs(monthlyContributionAfterValue - monthlyContributionBeforeValue))} weniger`
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
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
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

        {/* Empfehlungs-Sektion - Prominent platziert */}
        {recommendationData && (recommendationData.recommendation || recommendationData.recommendationProvider || recommendationData.recommendationAdvantages || recommendationData.expectedRente) && (
          <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 rounded-xl border-2 border-blue-200 shadow-xl p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Unsere Empfehlung</h3>
                <p className="text-sm text-gray-600">Basierend auf Ihrer individuellen Situation</p>
              </div>
            </div>
            
            {recommendationData.recommendation && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Empfohlene Maßnahmen</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{recommendationData.recommendation}</p>
              </div>
            )}

            {recommendationData.recommendationProvider && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Anbieter</h4>
                <p className="text-sm text-gray-600">{recommendationData.recommendationProvider}</p>
              </div>
            )}

            {recommendationData.recommendationAdvantages && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Vorteile</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{recommendationData.recommendationAdvantages}</p>
              </div>
            )}

            {recommendationData.expectedRente && recommendationData.expectedRente > 0 && (
              <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 border-2 border-blue-200 rounded-xl shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white">💡</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      Das bedeutet für Sie:
                    </h4>
                    <p className="text-lg text-gray-700 mb-4">
                      Mit unserer Empfehlung können Sie eine monatliche Rente von{' '}
                      <span className="font-bold text-blue-700 text-xl">
                        {formatEuro(recommendationData.expectedRente)}
                      </span>{' '}
                      erwarten.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/80 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Aktuelle Situation</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {formatEuro(vorher.rentenluecke)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Monatliche Lücke</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                        <p className="text-sm text-gray-600 mb-1">Mit Empfehlung</p>
                        <p className="text-2xl font-bold text-emerald-700">
                          {formatEuro(Math.max(0, vorher.rentenluecke - recommendationData.expectedRente))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Verbleibende Lücke</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                      <p className="text-base font-semibold text-gray-900 mb-2">
                        ⚡ Jetzt handeln – Ihre Zukunft sichern!
                      </p>
                      <p className="text-sm text-gray-700">
                        {recommendationData.recommendationProvider 
                          ? `Mit ${recommendationData.recommendationProvider} können Sie diese Rente erreichen.`
                          : 'Mit unserer Empfehlung können Sie diese Rente erreichen.'
                        }
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-800">
                          💰 <strong>Monatliche Verbesserung:</strong>{' '}
                          <span className="text-emerald-700 font-bold">
                            +{formatEuro(recommendationData.expectedRente)}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-gray-800 mt-2">
                          📈 <strong>Jährliche Verbesserung:</strong>{' '}
                          <span className="text-emerald-700 font-bold">
                            +{formatEuro(recommendationData.expectedRente * 12)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interaktive Rendite-Simulation - AUSGEBLENDET */}
        {false && calculationData !== null && calculationData !== undefined && calculationData.monthlySavings !== undefined && calculationData.monthlySavings > 0 && (
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Rendite-Simulation</h3>
                <p className="text-sm text-gray-600">Sehen Sie, wie sich verschiedene Renditen auf Ihre Rentenlücke auswirken</p>
              </div>
            </div>

            {/* Rendite-Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-900">
                  Erwartete Rendite: <span className="text-blue-600">{simulationReturnRate.toFixed(1)}%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={simulationReturnRate}
                  onChange={(e) => setSimulationReturnRate(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={simulationReturnRate}
                onChange={(e) => setSimulationReturnRate(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>

            {/* Aktuelle Simulation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border-2 border-blue-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Zukünftiges Kapital</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuro(currentSimulation.futureCapital)}</p>
                <p className="text-xs text-gray-500 mt-1">bei {simulationReturnRate.toFixed(1)}% Rendite</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Monatliche Rente</p>
                <p className="text-2xl font-bold text-emerald-600">{formatEuro(currentSimulation.monthlyPension)}</p>
                <p className="text-xs text-gray-500 mt-1">bei 3% Entnahmerate</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Verbleibende Lücke</p>
                <p className={`text-2xl font-bold ${currentSimulation.remainingGap > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {formatEuro(currentSimulation.remainingGap)}
                </p>
                <p className="text-xs text-gray-500 mt-1">nach Vorsorge</p>
              </div>
            </div>

            {/* Vergleich verschiedener Renditen */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900">Vergleich verschiedener Renditen</h4>
              <div className="space-y-2">
                {simulationScenarios.map((scenario) => (
                  <div
                    key={scenario.rate}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      scenario.rate === Math.round(simulationReturnRate)
                        ? 'bg-blue-50 border-blue-400 shadow-md'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 text-center px-3 py-2 rounded-lg font-bold ${
                          scenario.rate === Math.round(simulationReturnRate)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {scenario.rate}%
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monatliche Rente</p>
                          <p className="text-lg font-semibold text-gray-900">{formatEuro(scenario.monthlyPension)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Verbleibende Lücke</p>
                        <p className={`text-lg font-bold ${scenario.remainingGap > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {formatEuro(scenario.remainingGap)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hinweis mit Empfehlung */}
            {recommendationData !== null && recommendationData !== undefined && recommendationData.expectedRente !== undefined && recommendationData.expectedRente > 0 && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💡</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-2">Mit unserer Empfehlung erreichen Sie mehr!</h4>
                    <p className="text-blue-100 mb-3">
                      {recommendationData.recommendationProvider 
                        ? `Mit ${recommendationData.recommendationProvider} können Sie eine monatliche Rente von ${formatEuro(recommendationData.expectedRente)} erwarten.`
                        : `Mit unserer Empfehlung können Sie eine monatliche Rente von ${formatEuro(recommendationData.expectedRente)} erwarten.`
                      }
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p className="text-sm text-blue-100">Ihre erwartete Rente</p>
                        <p className="text-2xl font-bold">{formatEuro(recommendationData.expectedRente)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p className="text-sm text-blue-100">Verbleibende Lücke</p>
                        <p className="text-2xl font-bold">
                          {formatEuro(Math.max(0, vorher.rentenluecke - recommendationData.expectedRente))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
    </div>
  )
}

