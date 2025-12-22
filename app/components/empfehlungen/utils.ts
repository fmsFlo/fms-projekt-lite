import type { Empfehlung, EmpfehlungsCheck } from './types'
import { KATEGORIE_INFO } from './constants'

/**
 * Berechnet die monatliche Differenz zwischen Vorher und Nachher
 */
export function calculateDifferenzMonatlich(empfehlung: Empfehlung): number {
  return empfehlung.nachher.beitragMonatlich - empfehlung.vorher.beitragMonatlich
}

/**
 * Berechnet die jährliche Differenz
 */
export function calculateDifferenzJaehrlich(empfehlung: Empfehlung): number {
  return calculateDifferenzMonatlich(empfehlung) * 12
}

/**
 * Berechnet die Gesamteinsparung über eine bestimmte Anzahl von Jahren
 */
export function calculateEinsparungUeberJahre(
  monatlicheDifferenz: number,
  jahre: number
): number {
  return monatlicheDifferenz * 12 * jahre
}

/**
 * Berechnet die Gesamteinsparung mit Zinseszins (6% p.a.)
 */
export function calculateEinsparungMitZinseszins(
  monatlicheDifferenz: number,
  jahre: number,
  rendite: number = 0.06
): number {
  const monate = jahre * 12
  const monatsRendite = rendite / 12

  // Rentenendwertformel
  const faktor = (Math.pow(1 + monatsRendite, monate) - 1) / monatsRendite
  return monatlicheDifferenz * faktor
}

/**
 * Berechnet Gesamtstatistiken aus allen Empfehlungen
 * Berücksichtigt sowohl Einsparungen (negativ) als auch Mehrkosten (positiv)
 */
export function calculateGesamtErgebnis(empfehlungen: Empfehlung[]): {
  gesamtDifferenzMonatlich: number // Kann negativ (Einsparung) oder positiv (Mehrkosten) sein
  gesamtDifferenzJaehrlich: number
  gesamtEinsparungMonatlich: number // Nur Einsparungen (immer positiv)
  gesamtMehrkostenMonatlich: number // Nur Mehrkosten (immer positiv)
  anzahlOptimierungen: number
} {
  const gesamtDifferenzMonatlich = empfehlungen.reduce((sum, emp) => {
    const differenz = calculateDifferenzMonatlich(emp)
    return sum + differenz
  }, 0)

  const gesamtEinsparungMonatlich = empfehlungen.reduce((sum, emp) => {
    const differenz = calculateDifferenzMonatlich(emp)
    // Nur negative Differenzen (Einsparungen) zählen
    return sum + (differenz < 0 ? Math.abs(differenz) : 0)
  }, 0)

  const gesamtMehrkostenMonatlich = empfehlungen.reduce((sum, emp) => {
    const differenz = calculateDifferenzMonatlich(emp)
    // Nur positive Differenzen (Mehrkosten) zählen
    return sum + (differenz > 0 ? differenz : 0)
  }, 0)

  return {
    gesamtDifferenzMonatlich,
    gesamtDifferenzJaehrlich: gesamtDifferenzMonatlich * 12,
    gesamtEinsparungMonatlich,
    gesamtMehrkostenMonatlich,
    anzahlOptimierungen: empfehlungen.length,
  }
}

/**
 * Formatiert Euro-Beträge
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Extrahiert Rentenbetrag aus Leistungs-String (z.B. "691€ Rente" -> 691)
 */
export function extractRenteFromLeistung(leistung: string): number {
  if (!leistung) return 0
  // Suche nach Zahlen gefolgt von "€" und optional "Rente"
  const match = leistung.match(/(\d+(?:[.,]\d+)?)\s*€/)
  if (match) {
    return parseFloat(match[1].replace(',', '.'))
  }
  return 0
}

/**
 * Berechnet die zusätzliche Rente (für rente-Kategorie)
 */
export function calculateMehrRente(empfehlung: Empfehlung): number {
  if (empfehlung.kategorie !== 'rente') return 0
  const renteVorher = extractRenteFromLeistung(empfehlung.vorher.leistung)
  const renteNachher = extractRenteFromLeistung(empfehlung.nachher.leistung)
  return renteNachher - renteVorher
}

/**
 * Gruppiert Empfehlungen nach Kategorie
 */
export function groupByKategorie(empfehlungen: Empfehlung[]): Record<string, Empfehlung[]> {
  return empfehlungen.reduce((acc, emp) => {
    if (!acc[emp.kategorie]) {
      acc[emp.kategorie] = []
    }
    acc[emp.kategorie].push(emp)
    return acc
  }, {} as Record<string, Empfehlung[]>)
}

