import type {
  Versicherung,
  VersicherungsCheck,
  AnlageBerechnung,
  GesamtErgebnis,
  VersicherungOptimierung,
  RisikoStatus,
} from './types'
import { formatEuro as formatEuroUtil } from '../finances/utils'

// Re-export formatEuro for convenience
export { formatEuroUtil as formatEuro }

/**
 * Berechnet Zinseszins für monatliche Einzahlungen (vorschüssig)
 */
export function calculateAnlagePotenzial(
  monatlich: number,
  rendite: number,
  jahre: number
): AnlageBerechnung {
  if (monatlich <= 0 || jahre <= 0) {
    return {
      monatlicheBeitrag: monatlich,
      rendite,
      nach1Jahr: 0,
      nach5Jahren: 0,
      nach10Jahren: 0,
      nach20Jahren: 0,
      nach30Jahren: 0,
      verlaufDaten: [],
    }
  }

  const renditeDecimal = rendite / 100
  const monatlicheRendite = Math.pow(1 + renditeDecimal, 1 / 12) - 1
  const monate = jahre * 12

  // Vorschüssige Zahlungen: FV = PMT * (((1+r)^n - 1) / r) * (1+r)
  const calculateFutureValue = (jahre: number): number => {
    const monateBisJahr = jahre * 12
    if (monatlicheRendite === 0) {
      return monatlich * monateBisJahr
    }
    return (
      monatlich *
      ((Math.pow(1 + monatlicheRendite, monateBisJahr) - 1) / monatlicheRendite) *
      (1 + monatlicheRendite)
    )
  }

  const nach1Jahr = calculateFutureValue(1)
  const nach5Jahren = calculateFutureValue(5)
  const nach10Jahren = calculateFutureValue(10)
  const nach20Jahren = calculateFutureValue(20)
  const nach30Jahren = calculateFutureValue(30)

  // Verlaufsdaten
  const verlaufDaten: { jahr: number; ohneAnlage: number; mitAnlage: number }[] = []
  for (let jahr = 1; jahr <= Math.min(30, jahre); jahr++) {
    const ohneAnlage = monatlich * 12 * jahr
    const mitAnlage = calculateFutureValue(jahr)
    verlaufDaten.push({
      jahr,
      ohneAnlage: Math.round(ohneAnlage * 100) / 100,
      mitAnlage: Math.round(mitAnlage * 100) / 100,
    })
  }

  return {
    monatlicheBeitrag: monatlich,
    rendite,
    nach1Jahr: Math.round(nach1Jahr * 100) / 100,
    nach5Jahren: Math.round(nach5Jahren * 100) / 100,
    nach10Jahren: Math.round(nach10Jahren * 100) / 100,
    nach20Jahren: Math.round(nach20Jahren * 100) / 100,
    nach30Jahren: Math.round(nach30Jahren * 100) / 100,
    verlaufDaten,
  }
}

/**
 * Bestimmt Risiko-Status basierend auf vorhandenen Versicherungen
 */
export function determineRisikoStatus(versicherungen: Versicherung[]): RisikoStatus {
  const aktiveVersicherungen = versicherungen.filter(
    (v) => v.status === 'empfehlung' && v.vorher
  )

  const hatBU = aktiveVersicherungen.some((v) => v.typ === 'bu')
  const hatPHV = aktiveVersicherungen.some((v) => v.typ === 'phv')
  const hatRLV = aktiveVersicherungen.some((v) => v.typ === 'rlv')

  // PHV ist kritisch
  if (!hatPHV) return 'kritisch'

  // BU fehlt = kritisch
  if (!hatBU) return 'kritisch'

  // RLV fehlt = mittel (kann je nach Situation variieren)
  if (!hatRLV) return 'mittel'

  return 'gut'
}

/**
 * Berechnet Gesamt-Ergebnis aus allen Versicherungen
 */
export function calculateGesamtErgebnis(check: VersicherungsCheck): GesamtErgebnis {
  const optimierungen: VersicherungOptimierung[] = []
  const einsparungen: VersicherungOptimierung[] = []
  const neuEmpfehlungen: VersicherungOptimierung[] = []

  check.versicherungen.forEach((versicherung) => {
    const highlights: string[] = []

    if (versicherung.status === 'empfehlung' && versicherung.nachher) {
      if (versicherung.differenzMonatlich < 0) {
        highlights.push(`${formatEuroUtil(Math.abs(versicherung.differenzMonatlich))}/Monat gespart`)
      }
      versicherung.nachher.leistungsverbesserungen.forEach((lm) => {
        highlights.push(lm.beschreibung)
      })
      if (versicherung.differenzMonatlich < 0) {
        einsparungen.push({
          typ: versicherung.typ,
          name: versicherung.typ,
          differenz: versicherung.differenzMonatlich,
          highlights,
        })
      } else {
        optimierungen.push({
          typ: versicherung.typ,
          name: versicherung.typ,
          differenz: versicherung.differenzMonatlich,
          highlights,
        })
      }
    } else if (versicherung.status === 'nicht_noetig') {
      highlights.push(`Einsparung: ${formatEuroUtil(Math.abs(versicherung.differenzMonatlich))}/Monat`)
      if (versicherung.begruendungVerzicht) {
        highlights.push(versicherung.begruendungVerzicht)
      }
      einsparungen.push({
        typ: versicherung.typ,
        name: versicherung.typ,
        differenz: versicherung.differenzMonatlich,
        highlights,
      })
    } else if (versicherung.status === 'neue_empfehlung') {
      if (versicherung.nachher) {
        versicherung.nachher.vorteile.forEach((v) => highlights.push(v))
      }
      neuEmpfehlungen.push({
        typ: versicherung.typ,
        name: versicherung.typ,
        differenz: versicherung.differenzMonatlich,
        highlights,
      })
    }
  })

  // Gesamt-Anlage-Potenzial
  const einsparungGesamt = Math.abs(
    einsparungen.reduce((sum, e) => sum + e.differenz, 0)
  )
  const anlageGesamt = calculateAnlagePotenzial(einsparungGesamt, 6, 30)

  return {
    beitragVorher: check.gesamtBeitragVorher,
    beitragNachher: check.gesamtBeitragNachher,
    differenz: check.einsparung,
    anzahlVorher: check.versicherungen.filter((v) => v.vorher).length,
    anzahlNachher:
      check.versicherungen.filter((v) => v.status === 'empfehlung' || v.status === 'neue_empfehlung')
        .length,
    optimierungen,
    einsparungen,
    neuEmpfehlungen,
    anlageGesamt,
  }
}

/**
 * Berechnet Differenz zwischen Vorher und Nachher
 */
export function calculateVersicherungsDifferenz(
  vorher?: { beitragMonatlich: number },
  nachher?: { beitragMonatlich: number }
): number {
  if (!vorher && !nachher) return 0
  if (!vorher && nachher) return nachher.beitragMonatlich // Neue Versicherung
  if (vorher && !nachher) return -vorher.beitragMonatlich // Wird gestrichen
  if (vorher && nachher) return nachher.beitragMonatlich - vorher.beitragMonatlich
  return 0
}

