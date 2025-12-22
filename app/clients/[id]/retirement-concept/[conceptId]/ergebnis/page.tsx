"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RentenkonzeptErgebnis from '@/app/components/retirement/RentenkonzeptErgebnis'
import { createRentenErgebnis } from '@/app/components/retirement/rentenErgebnisUtils'
import type { RentenErgebnis } from '@/app/components/retirement/RentenkonzeptErgebnis'
import ConceptNavigation from '@/app/components/retirement/ConceptNavigation'

interface Params {
  params: {
    id: string
    conceptId: string
  }
}

export default function RentenkonzeptErgebnisPage({ params }: Params) {
  const router = useRouter()
  const [ergebnis, setErgebnis] = useState<RentenErgebnis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendationData, setRecommendationData] = useState<{
    recommendation?: string
    recommendationProvider?: string
    recommendationAdvantages?: string
    expectedRente?: number
  } | null>(null)
  const [calculationData, setCalculationData] = useState<{
    returnRate?: number
    monthlySavings?: number
    yearsToRetirement?: number
    gapBefore?: number
    targetPension?: number
    inflationRate?: number
  } | null>(null)
  const [productComparisonData, setProductComparisonData] = useState<{
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
  } | null>(null)

  useEffect(() => {
    async function loadErgebnis() {
      try {
        const res = await fetch(`/api/retirement-concepts/${params.conceptId}`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || `Konzept nicht gefunden (Status: ${res.status})`)
        }

        const concept = await res.json()
        
        if (!concept || !concept.id) {
          throw new Error('Konzept-Daten sind ungültig')
        }

        // Parse calculation snapshot
        let calculationSnapshot: any = null
        try {
          calculationSnapshot = concept.calculationSnapshot
            ? JSON.parse(concept.calculationSnapshot)
            : null
        } catch (e) {
          console.error('Fehler beim Parsen des calculationSnapshot:', e)
        }

        // Berechne Jahre bis zur Rente (einmalig, wird später nochmal verwendet)
        const birthDate = concept.birthDate ? new Date(concept.birthDate) : null
        const retirementAge = concept.desiredRetirementAge || 67
        const yearsToRetirement = birthDate 
          ? Math.max(0, retirementAge - (new Date().getFullYear() - birthDate.getFullYear()))
          : 20
        
        // Berechne Vorher-Werte
        // Renten in heutiger Kaufkraft (netCurrent) für Anzeige
        // Rentenlücke in nominalen Werten (netFuture) für Berechnung
        // WICHTIG: Verwende BRUTTO-Werte für gesetzliche Rente
        // Prüfe alle möglichen Strukturen, da calculationSnapshot.statutory möglicherweise undefined ist
        const statutoryGrossCurrent = 
          calculationSnapshot?.statutory?.grossCurrent ?? // Variante 1: Standard-Struktur
          calculationSnapshot?.statutoryGrossCurrent ?? // Variante 2: Flache Struktur
          calculationSnapshot?.gesetzlicheRenteGross ?? // Variante 3: Deutsche Bezeichnung
          (concept as any).statutoryGrossCurrent ?? // Variante 4: Direkt im Konzept
          (concept as any).gesetzlicheRenteGross ?? // Variante 5: Deutsche Bezeichnung im Konzept
          null

        const statutoryGrossFuture = 
          calculationSnapshot?.statutory?.grossFuture ??
          calculationSnapshot?.statutoryGrossFuture ??
          calculationSnapshot?.gesetzlicheRenteGrossFuture ??
          (concept as any).statutoryGrossFuture ??
          (concept as any).gesetzlicheRenteGrossFuture ??
          null

        const privateNetCurrent = (calculationSnapshot?.privateExisting?.netCurrent !== null && calculationSnapshot?.privateExisting?.netCurrent !== undefined)
          ? calculationSnapshot.privateExisting.netCurrent
          : null
        const privateNetFuture = (calculationSnapshot?.privateExisting?.netFuture !== null && calculationSnapshot?.privateExisting?.netFuture !== undefined)
          ? calculationSnapshot.privateExisting.netFuture
          : null
        
        // Debug: Logge die KOMPLETTE Struktur
        console.log('🔍 Debug - calculationSnapshot KOMPLETT:', JSON.stringify(calculationSnapshot, null, 2))
        console.log('🔍 Debug - concept KOMPLETT:', JSON.stringify(concept, null, 2))
        console.log('🔍 Gefunden:', { statutoryGrossCurrent, statutoryGrossFuture })
        console.log('🔍 calculationSnapshot Keys:', Object.keys(calculationSnapshot || {}))
        console.log('🔍 concept Keys (statutory/gesetzlich):', Object.keys(concept).filter(k => k.toLowerCase().includes('statutory') || k.toLowerCase().includes('gesetzlich')))
        
        // Wenn grossCurrent null ist, berechne es aus grossFuture durch Abzinsen
        const inflationRate = (concept.inflationRate || 2.0) / 100
        const inflationFactor = Math.pow(1 + inflationRate, yearsToRetirement)
        
        // WICHTIG: Verwende BRUTTO-Werte für gesetzliche Rente
        // Wenn grossCurrent null ist, aber grossFuture vorhanden, berechne grossCurrent
        // Wenn beide null sind, verwende 0
        const vorherGesetzlicheRenteCurrent = statutoryGrossCurrent !== null 
          ? statutoryGrossCurrent 
          : (statutoryGrossFuture !== null && statutoryGrossFuture > 0 ? statutoryGrossFuture / inflationFactor : 0)
        const vorherGesetzlicheRenteNominal = statutoryGrossFuture !== null 
          ? statutoryGrossFuture 
          : (statutoryGrossCurrent !== null && statutoryGrossCurrent > 0 ? statutoryGrossCurrent * inflationFactor : 0)
        
        const vorher = {
          gesetzlicheRente: vorherGesetzlicheRenteCurrent,
          gesetzlicheRenteNominal: vorherGesetzlicheRenteNominal,
          privateVorsorge: privateNetCurrent !== null 
            ? privateNetCurrent 
            : (privateNetFuture !== null ? privateNetFuture / inflationFactor : 0),
          privateVorsorgeNominal: privateNetFuture !== null ? privateNetFuture : 0,
          gesamtrente:
            vorherGesetzlicheRenteCurrent +
            (privateNetCurrent !== null ? privateNetCurrent : (privateNetFuture !== null ? privateNetFuture / inflationFactor : 0)),
          gesamtrenteNominal:
            vorherGesetzlicheRenteNominal +
            (privateNetFuture !== null ? privateNetFuture : 0),
          rentenluecke: calculationSnapshot?.gaps?.before || 0, // Bereits in nominalen Werten
          aktuellerBeitrag: 0,
        }

        // Berechne Nachher-Werte
        const plannedNetCurrent = calculationSnapshot?.planned?.netCurrent ?? null
        const plannedNetFuture = calculationSnapshot?.planned?.netFuture ?? null
        
        // Gleiche Logik für nachher - verwende BRUTTO-Werte
        const nachherGesetzlicheRenteCurrent = statutoryGrossCurrent !== null 
          ? statutoryGrossCurrent 
          : (statutoryGrossFuture !== null && statutoryGrossFuture > 0 ? statutoryGrossFuture / inflationFactor : 0)
        const nachherGesetzlicheRenteNominal = statutoryGrossFuture !== null 
          ? statutoryGrossFuture 
          : (statutoryGrossCurrent !== null && statutoryGrossCurrent > 0 ? statutoryGrossCurrent * inflationFactor : 0)
        
        const nachher = {
          gesetzlicheRente: nachherGesetzlicheRenteCurrent,
          gesetzlicheRenteNominal: nachherGesetzlicheRenteNominal,
          privateVorsorge:
            (privateNetCurrent !== null ? privateNetCurrent : (privateNetFuture !== null ? privateNetFuture / inflationFactor : 0)) +
            (plannedNetCurrent !== null ? plannedNetCurrent : (plannedNetFuture !== null ? plannedNetFuture / inflationFactor : 0)),
          privateVorsorgeNominal:
            (privateNetFuture !== null ? privateNetFuture : 0) +
            (plannedNetFuture !== null ? plannedNetFuture : 0),
          gesamtrente:
            nachherGesetzlicheRenteCurrent +
            (privateNetCurrent !== null ? privateNetCurrent : (privateNetFuture !== null ? privateNetFuture / inflationFactor : 0)) +
            (plannedNetCurrent !== null ? plannedNetCurrent : (plannedNetFuture !== null ? plannedNetFuture / inflationFactor : 0)),
          gesamtrenteNominal:
            nachherGesetzlicheRenteNominal +
            (privateNetFuture !== null ? privateNetFuture : 0) +
            (plannedNetFuture !== null ? plannedNetFuture : 0),
          rentenluecke: calculationSnapshot?.gaps?.after || 0, // Bereits in nominalen Werten
          neuerBeitrag: concept.monthlySavings || 0,
        }

        // Bestimme Produkttyp
        const produktTyp: 'riester' | 'ruerup' | 'bav' | 'private' | 'etf' = 'etf'

        const produktDetails = {
          produktTyp,
          anbieter: undefined,
          garantierteRente: undefined,
          steuerVorteil: undefined,
        }

        const eingaben = {
          beitragMonatlich: concept.monthlySavings || 0,
          steuerklasse: concept.taxFilingStatus || 'single',
          kinderAnzahl: concept.hasChildren ? 1 : 0,
          selbststaendig: concept.isCompulsoryInsured === false,
          arbeitgeberZuschuss: undefined,
        }

        const ergebnisData = createRentenErgebnis(vorher, nachher, produktDetails, eingaben)
        setErgebnis(ergebnisData)
        
        // Lade Empfehlungsdaten
        setRecommendationData({
          recommendation: concept.notes || undefined,
          recommendationProvider: (concept as any).recommendationProvider || undefined,
          recommendationAdvantages: (concept as any).recommendationAdvantages || undefined,
          expectedRente: (concept as any).expectedRente || undefined,
        })
        
        // Lade Produktvergleichsdaten (falls vorhanden)
        setProductComparisonData({
          productBefore: (concept as any).productBefore || undefined,
          additionalRenteBefore: (concept as any).additionalRenteBefore || undefined,
          providerAfter: (concept as any).providerAfter || (concept as any).recommendationProvider || undefined,
          advantages: (concept as any).advantages || (concept as any).recommendationAdvantages || undefined,
          renteAfter1: (concept as any).renteAfter1 || (concept as any).expectedRente || undefined,
          renteAfter2: (concept as any).renteAfter2 || undefined,
          renteAfter3: (concept as any).renteAfter3 || undefined,
          returnRate1: (concept as any).returnRate1 || undefined,
          returnRate2: (concept as any).returnRate2 || undefined,
          returnRate3: (concept as any).returnRate3 || undefined,
          monthlyContributionBefore: (concept as any).monthlyContributionBefore || undefined,
          monthlyContributionAfter: (concept as any).monthlyContributionAfter || undefined,
        })
        
        // Berechne Zielrente
        // targetPensionNetto ist in heutiger Kaufkraft
        // Falls nicht vorhanden, berechne aus Gesamtrente + Lücke (beide nominal)
        // Dann abzinsen zu heutiger Kaufkraft für calculationData
        const targetPensionNominal = concept.calculatedTargetPension || 
          ((calculationSnapshot?.statutory?.grossFuture || 0) + 
           (calculationSnapshot?.privateExisting?.grossFuture || 0) + 
           (calculationSnapshot?.gaps?.before || 0))
        const targetPension = concept.targetPensionNetto || 
          (targetPensionNominal / inflationFactor)  // Abzinsen von nominal zu Kaufkraft
        
        // Setze Berechnungsdaten für Simulation
        setCalculationData({
          returnRate: (concept as any).returnRate || 5.0,
          monthlySavings: concept.monthlySavings || 0,
          yearsToRetirement,
          gapBefore: calculationSnapshot?.gaps?.before || 0,
          targetPension,
          inflationRate: concept.inflationRate || 2.0,
        })
      } catch (err: any) {
        setError(err.message || 'Fehler beim Laden der Daten')
      } finally {
        setLoading(false)
      }
    }

    loadErgebnis()
  }, [params.conceptId])

  const handleBeratungstermin = () => {
    // TODO: Implementiere Beratungstermin-Funktion
    router.push('/clients')
  }

  const handlePdfExport = () => {
    // Öffne PDF in neuem Tab
    window.open(`/api/retirement-concepts/${params.conceptId}/pdf`, '_blank')
  }

  const handleAnpassen = () => {
    router.push(`/clients/${params.id}/retirement-concept/${params.conceptId}`)
  }

  const handleSaveProductComparison = async (data: {
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
  }) => {
    try {
      const res = await fetch(`/api/retirement-concepts/${params.conceptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productBefore: data.productBefore || null,
          additionalRenteBefore: data.additionalRenteBefore || null,
          providerAfter: data.providerAfter || null,
          advantages: data.advantages || null,
          renteAfter1: data.renteAfter1 || null,
          renteAfter2: data.renteAfter2 || null,
          renteAfter3: data.renteAfter3 || null,
          returnRate1: data.returnRate1 || null,
          returnRate2: data.returnRate2 || null,
          returnRate3: data.returnRate3 || null,
          monthlyContributionBefore: data.monthlyContributionBefore || null,
          monthlyContributionAfter: data.monthlyContributionAfter || null,
        }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Speichern fehlgeschlagen')
      }
      router.refresh()
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error)
      throw new Error(error.message || 'Fehler beim Speichern der Daten')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Ergebnisse...</p>
        </div>
      </div>
    )
  }

  if (error || !ergebnis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Keine Daten gefunden'}</p>
          <button
            onClick={() => router.push(`/clients/${params.id}/retirement-concept/${params.conceptId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Zurück zum Konzept
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Navigation zwischen Ansichten */}
      <ConceptNavigation
        clientId={params.id}
        conceptId={params.conceptId}
        activeView="empfehlungen"
      />
      <RentenkonzeptErgebnis
        ergebnis={ergebnis}
        onBeratungstermin={handleBeratungstermin}
        onPdfExport={handlePdfExport}
        onAnpassen={handleAnpassen}
        recommendationData={recommendationData}
        onBack={() => router.push(`/clients/${params.id}/retirement-concept/${params.conceptId}`)}
        calculationData={calculationData}
        conceptId={params.conceptId}
        onSave={handleSaveProductComparison}
        productComparisonData={productComparisonData}
      />
    </>
  )
}

