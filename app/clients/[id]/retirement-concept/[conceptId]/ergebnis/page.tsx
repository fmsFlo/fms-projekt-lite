"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RentenkonzeptErgebnis from '@/app/components/retirement/RentenkonzeptErgebnis'
import { createRentenErgebnis } from '@/app/components/retirement/rentenErgebnisUtils'
import type { RentenErgebnis } from '@/app/components/retirement/RentenkonzeptErgebnis'

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

  useEffect(() => {
    async function loadErgebnis() {
      try {
        const res = await fetch(`/api/retirement-concepts/${params.conceptId}`)
        if (!res.ok) {
          throw new Error('Konzept nicht gefunden')
        }

        const concept = await res.json()

        // Parse calculation snapshot
        let calculationSnapshot: any = null
        try {
          calculationSnapshot = concept.calculationSnapshot
            ? JSON.parse(concept.calculationSnapshot)
            : null
        } catch (e) {
          console.error('Fehler beim Parsen des calculationSnapshot:', e)
        }

        // Berechne Vorher-Werte
        const vorher = {
          gesetzlicheRente: calculationSnapshot?.statutory?.netFuture || 0,
          privateVorsorge: calculationSnapshot?.privateExisting?.netFuture || 0,
          gesamtrente:
            (calculationSnapshot?.statutory?.netFuture || 0) +
            (calculationSnapshot?.privateExisting?.netFuture || 0),
          rentenluecke: calculationSnapshot?.gaps?.before || 0,
          aktuellerBeitrag: 0,
        }

        // Berechne Nachher-Werte
        const nachher = {
          gesetzlicheRente: calculationSnapshot?.statutory?.netFuture || 0,
          privateVorsorge:
            (calculationSnapshot?.privateExisting?.netFuture || 0) +
            (calculationSnapshot?.planned?.netFuture || 0),
          gesamtrente:
            (calculationSnapshot?.statutory?.netFuture || 0) +
            (calculationSnapshot?.privateExisting?.netFuture || 0) +
            (calculationSnapshot?.planned?.netFuture || 0),
          rentenluecke: calculationSnapshot?.gaps?.after || 0,
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
    <RentenkonzeptErgebnis
      ergebnis={ergebnis}
      onBeratungstermin={handleBeratungstermin}
      onPdfExport={handlePdfExport}
      onAnpassen={handleAnpassen}
    />
  )
}

