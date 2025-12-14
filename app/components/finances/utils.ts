import type {
  FinanzielleSituation,
  SparRechnerErgebnis,
  Szenario,
  SzenarioVergleich,
  LebensKostenErgebnis,
  KategorieVergleich,
  Sparziel,
  VersteckteKosten,
} from './types'

/**
 * Formatiert Euro-Beträge im deutschen Format
 */
export const formatEuro = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatiert Prozent im deutschen Format
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Berechnet die monatliche Sparrate
 */
export function calculateSparrate(situation: FinanzielleSituation): number {
  const gesamtEinkommen =
    situation.persoenlicheDaten.nettoEinkommen +
    (situation.persoenlicheDaten.zusatzEinkommen?.reduce((sum, e) => sum + e.betrag, 0) || 0)

  const gesamtAusgaben =
    situation.fixkosten.reduce((sum, k) => sum + k.betrag, 0) +
    situation.variableKosten.reduce((sum, k) => sum + k.betrag, 0)

  return gesamtEinkommen - gesamtAusgaben
}

/**
 * Berechnet die Sparquote in Prozent
 */
export function calculateSparquote(situation: FinanzielleSituation): number {
  const gesamtEinkommen =
    situation.persoenlicheDaten.nettoEinkommen +
    (situation.persoenlicheDaten.zusatzEinkommen?.reduce((sum, e) => sum + e.betrag, 0) || 0)

  if (gesamtEinkommen <= 0) return 0

  const sparrate = calculateSparrate(situation)
  return (sparrate / gesamtEinkommen) * 100
}

/**
 * Berechnet das Endkapital bei monatlicher Einzahlung mit Zinseszins
 * Vorschüssige Zahlungen (Annuity Due)
 */
export function calculateAnlageErgebnis(
  monatlich: number,
  jahre: number,
  renditeProzent: number
): SparRechnerErgebnis {
  if (monatlich <= 0 || jahre <= 0) {
    return {
      einsparungMonatlich: monatlich,
      anlagehorizont: jahre,
      rendite: renditeProzent,
      endkapital: 0,
      einzahlungen: 0,
      zinsenGewinn: 0,
      verlaufDaten: [],
    }
  }

  const rendite = renditeProzent / 100
  const monatlicheRendite = Math.pow(1 + rendite, 1 / 12) - 1
  const monate = jahre * 12

  // Vorschüssige Zahlungen: FV = PMT * (((1+r)^n - 1) / r) * (1+r)
  const endkapital =
    monatlicheRendite === 0
      ? monatlich * monate
      : monatlich * ((Math.pow(1 + monatlicheRendite, monate) - 1) / monatlicheRendite) * (1 + monatlicheRendite)

  const einzahlungen = monatlich * monate
  const zinsenGewinn = endkapital - einzahlungen

  // Verlaufsdaten für Chart
  const verlaufDaten: { jahr: number; kapital: number; einzahlungen: number; zinsen: number }[] = []
  for (let jahr = 1; jahr <= jahre; jahr++) {
    const monateBisJahr = jahr * 12
    const kapitalBisJahr =
      monatlicheRendite === 0
        ? monatlich * monateBisJahr
        : monatlich *
          ((Math.pow(1 + monatlicheRendite, monateBisJahr) - 1) / monatlicheRendite) *
          (1 + monatlicheRendite)
    const einzahlungenBisJahr = monatlich * monateBisJahr
    const zinsenBisJahr = kapitalBisJahr - einzahlungenBisJahr

    verlaufDaten.push({
      jahr,
      kapital: Math.round(kapitalBisJahr * 100) / 100,
      einzahlungen: Math.round(einzahlungenBisJahr * 100) / 100,
      zinsen: Math.round(zinsenBisJahr * 100) / 100,
    })
  }

  return {
    einsparungMonatlich: monatlich,
    anlagehorizont: jahre,
    rendite: renditeProzent,
    endkapital: Math.round(endkapital * 100) / 100,
    einzahlungen: Math.round(einzahlungen * 100) / 100,
    zinsenGewinn: Math.round(zinsenGewinn * 100) / 100,
    verlaufDaten,
  }
}

/**
 * Berechnet Lebenszeit-Kosten für eine Kategorie
 */
export function calculateLebensKosten(
  monatlich: number,
  aktuellesAlter: number = 30,
  rentenAlter: number = 67
): LebensKostenErgebnis {
  const jahreBisRente = Math.max(0, rentenAlter - aktuellesAlter)
  const jahre10 = Math.min(10, jahreBisRente)
  const jahre20 = Math.min(20, jahreBisRente)
  const jahre30 = Math.min(30, jahreBisRente)

  return {
    kategorie: '',
    monatlich,
    nach10Jahren: monatlich * 12 * jahre10,
    nach20Jahren: monatlich * 12 * jahre20,
    nach30Jahren: monatlich * 12 * jahre30,
    bisRente: monatlich * 12 * jahreBisRente,
  }
}

/**
 * Generiert Szenario-Vergleich
 */
export function generateSzenarioVergleich(
  situation: FinanzielleSituation,
  optimiertEinsparung: number,
  maximumEinsparung: number,
  rendite: number = 5
): SzenarioVergleich {
  const jetztSparrate = calculateSparrate(situation)
  const optimiertSparrate = jetztSparrate + optimiertEinsparung
  const maximumSparrate = jetztSparrate + maximumEinsparung

  const calculateSzenario = (sparrate: number): Szenario => {
    const nach10 = calculateAnlageErgebnis(sparrate, 10, rendite)
    const nach20 = calculateAnlageErgebnis(sparrate, 20, rendite)
    const nach30 = calculateAnlageErgebnis(sparrate, 30, rendite)
    const nach40 = calculateAnlageErgebnis(sparrate, 40, rendite)

    return {
      monatlicheSparrate: sparrate,
      nach10Jahren: nach10.endkapital,
      nach20Jahren: nach20.endkapital,
      nach30Jahren: nach30.endkapital,
      nach40Jahren: nach40.endkapital,
    }
  }

  return {
    jetzt: calculateSzenario(jetztSparrate),
    optimiert: calculateSzenario(optimiertSparrate),
    maximum: calculateSzenario(maximumSparrate),
  }
}

/**
 * Vergleicht Kategorie mit Durchschnitt
 */
export function compareWithDurchschnitt(
  kategorie: string,
  betrag: number,
  durchschnitt?: number
): KategorieVergleich {
  if (!durchschnitt) {
    durchschnitt = getDurchschnittswert(kategorie)
  }

  const differenz = betrag - durchschnitt
  const potenzial = differenz > 0 ? differenz : 0
  const prozentAbweichung = durchschnitt > 0 ? (differenz / durchschnitt) * 100 : 0

  return {
    kategorie,
    aktuell: betrag,
    durchschnitt,
    differenz,
    potenzial,
    prozentAbweichung: Math.round(prozentAbweichung * 10) / 10,
  }
}

/**
 * Gibt Durchschnittswerte für Deutschland zurück
 */
export function getDurchschnittswert(kategorie: string): number {
  const durchschnitte: Record<string, number> = {
    'Miete/Wohnung': 900,
    Nebenkosten: 200,
    Versicherungen: 150,
    'Kredite/Darlehen': 300,
    'Auto (Leasing/Finanzierung)': 300,
    'Handy/Internet': 50,
    'Sparpläne/Vorsorge': 200,
    'Sonstige Fixkosten': 100,
    Lebensmittel: 350,
    'Tanken/Mobilität': 150,
    'Freizeit/Hobbys': 200,
    'Shopping/Kleidung': 150,
    'Restaurants/Essen gehen': 150,
    'Streaming/Abos': 40,
    Urlaub: 150,
    Sonstiges: 100,
  }

  return durchschnitte[kategorie] || 0
}

/**
 * Berechnet erforderliche Sparrate für ein Ziel
 */
export function calculateSparziel(
  zielBetrag: number,
  zielJahre: number,
  rendite: number = 5,
  situation: FinanzielleSituation
): Sparziel {
  const renditeDecimal = rendite / 100
  const monatlicheRendite = Math.pow(1 + renditeDecimal, 1 / 12) - 1
  const monate = zielJahre * 12

  // Rückwärtsrechnung: Ziel = PMT * (((1+r)^n - 1) / r) * (1+r)
  // PMT = Ziel / (((1+r)^n - 1) / r) / (1+r)
  const erforderlicheSparrate =
    monatlicheRendite === 0
      ? zielBetrag / monate
      : zielBetrag / (((Math.pow(1 + monatlicheRendite, monate) - 1) / monatlicheRendite) * (1 + monatlicheRendite))

  // Finde Vorschläge für Einsparungen
  const vorschlaege: { kategorie: string; einsparung: number }[] = []
  const aktuelleSparrate = calculateSparrate(situation)
  const fehlendeSparrate = Math.max(0, erforderlicheSparrate - aktuelleSparrate)

  if (fehlendeSparrate > 0) {
    // Sortiere variable Kosten nach Betrag (höchste zuerst)
    const sortierteKosten = [...situation.variableKosten].sort((a, b) => b.betrag - a.betrag)

    let verbleibend = fehlendeSparrate
    for (const kategorie of sortierteKosten) {
      if (verbleibend <= 0) break

      const potenzial = Math.min(kategorie.betrag * 0.3, verbleibend) // Max 30% Einsparung pro Kategorie
      if (potenzial > 10) {
        vorschlaege.push({
          kategorie: kategorie.name,
          einsparung: Math.round(potenzial * 100) / 100,
        })
        verbleibend -= potenzial
      }
    }
  }

  return {
    zielBetrag,
    zielJahre,
    erforderlicheSparrate: Math.round(erforderlicheSparrate * 100) / 100,
    vorschlaege,
  }
}

/**
 * Findet versteckte Kosten (kleine Beträge unter Schwellwert)
 */
export function findVersteckteKosten(
  situation: FinanzielleSituation,
  schwellwert: number = 50
): VersteckteKosten {
  const alleKosten = [...situation.fixkosten, ...situation.variableKosten]
  const versteckte = alleKosten
    .filter((k) => k.betrag < schwellwert && k.betrag > 0)
    .sort((a, b) => b.betrag - a.betrag)
    .slice(0, 10) // Top 10

  const gesamt = versteckte.reduce((sum, k) => sum + k.betrag, 0)

  let beschreibung = `Deine ${versteckte.length} kleinsten Posten (unter ${schwellwert}€) kosten dich zusammen `
  beschreibung += `${formatEuro(gesamt)}/Monat. Das sind ${formatEuro(gesamt * 12)} pro Jahr!`

  return {
    kategorien: versteckte.map((k) => ({
      name: k.name,
      betrag: k.betrag,
    })),
    gesamt,
    beschreibung,
  }
}

/**
 * Berechnet Gesamtausgaben
 */
export function calculateGesamtAusgaben(situation: FinanzielleSituation): number {
  return (
    situation.fixkosten.reduce((sum, k) => sum + k.betrag, 0) +
    situation.variableKosten.reduce((sum, k) => sum + k.betrag, 0)
  )
}

/**
 * Berechnet Gesamteinkommen
 */
export function calculateGesamtEinkommen(situation: FinanzielleSituation): number {
  return (
    situation.persoenlicheDaten.nettoEinkommen +
    (situation.persoenlicheDaten.zusatzEinkommen?.reduce((sum, e) => sum + e.betrag, 0) || 0)
  )
}

