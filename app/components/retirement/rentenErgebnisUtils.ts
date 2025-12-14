import type { RentenErgebnis, Vorteil, ProduktDetails } from './RentenkonzeptErgebnis'

/**
 * Berechnet die Verbesserung zwischen Vorher und Nachher
 */
export function calculateRentenVerbesserung(
  vorher: RentenErgebnis['vorher'],
  nachher: RentenErgebnis['nachher']
): RentenErgebnis['verbesserung'] {
  const mehrRenteMonatlich = nachher.gesamtrente - vorher.gesamtrente
  const mehrRenteGesamt = mehrRenteMonatlich * 12 * 23 // Annahme: 23 Jahre Rentenbezug
  const rentenlueckeGeschlossen =
    vorher.rentenluecke > 0
      ? Math.min(100, ((vorher.rentenluecke - nachher.rentenluecke) / vorher.rentenluecke) * 100)
      : 0
  const mehrBeitragMonatlich = nachher.neuerBeitrag - vorher.aktuellerBeitrag

  return {
    mehrRenteMonatlich: Math.round(mehrRenteMonatlich * 100) / 100,
    mehrRenteGesamt: Math.round(mehrRenteGesamt * 100) / 100,
    rentenlueckeGeschlossen: Math.round(rentenlueckeGeschlossen * 100) / 100,
    mehrBeitragMonatlich: Math.round(mehrBeitragMonatlich * 100) / 100,
  }
}

/**
 * Generiert Vorteile basierend auf Produkttyp und Eingaben
 */
export function generateVorteile(
  produktDetails: ProduktDetails,
  eingaben: {
    beitragMonatlich?: number
    kinderAnzahl?: number
    selbststaendig?: boolean
    arbeitgeberZuschuss?: number
    steuerklasse?: string
  }
): Vorteil[] {
  const vorteile: Vorteil[] = []

  switch (produktDetails.produktTyp) {
    case 'riester':
      vorteile.push({
        icon: 'Shield',
        titel: 'Grundzulage',
        beschreibung: 'Staatliche Förderung von bis zu 175€ pro Jahr',
        wert: 175,
      })

      if (eingaben.kinderAnzahl && eingaben.kinderAnzahl > 0) {
        const kinderzulage = eingaben.kinderAnzahl * 300
        vorteile.push({
          icon: 'Sparkles',
          titel: 'Kinderzulage',
          beschreibung: `Zusätzlich ${eingaben.kinderAnzahl * 300}€ pro Jahr für deine Kinder`,
          wert: kinderzulage,
        })
      }

      vorteile.push({
        icon: 'CheckCircle',
        titel: 'Steuerliche Absetzbarkeit',
        beschreibung: 'Beiträge sind als Sonderausgaben absetzbar',
      })

      vorteile.push({
        icon: 'Shield',
        titel: 'Pfändungsschutz',
        beschreibung: 'Deine Riester-Rente ist vor Pfändung geschützt',
      })

      vorteile.push({
        icon: 'Shield',
        titel: 'Hartz-IV-sicher',
        beschreibung: 'Riester-Rente wird nicht auf Sozialleistungen angerechnet',
      })
      break

    case 'ruerup':
      const steuerVorteil = calculateSteuerVorteil(
        (eingaben.beitragMonatlich || 0) * 12,
        'ruerup',
        eingaben.steuerklasse || 'single'
      )

      vorteile.push({
        icon: 'TrendingUp',
        titel: 'Hohe Steuerersparnis',
        beschreibung: `Bis zu ${steuerVorteil.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ Steuerersparnis pro Jahr`,
        wert: steuerVorteil,
      })

      vorteile.push({
        icon: 'CheckCircle',
        titel: 'Selbstständigen-geeignet',
        beschreibung: 'Ideal für Selbstständige und Freiberufler',
      })

      vorteile.push({
        icon: 'Shield',
        titel: 'Lebenslange Rente garantiert',
        beschreibung: 'Garantierte Auszahlung bis zum Lebensende',
      })

      if (produktDetails.garantierteRente) {
        vorteile.push({
          icon: 'Target',
          titel: 'Garantierte Mindestrente',
          beschreibung: `Mindestens ${produktDetails.garantierteRente.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ monatlich`,
          wert: produktDetails.garantierteRente,
        })
      }

      vorteile.push({
        icon: 'Shield',
        titel: 'Pfändungsschutz',
        beschreibung: 'Rürup-Rente ist vor Pfändung geschützt',
      })
      break

    case 'bav':
      if (eingaben.arbeitgeberZuschuss) {
        vorteile.push({
          icon: 'Euro',
          titel: 'Arbeitgeberzuschuss',
          beschreibung: `Dein Arbeitgeber zahlt ${eingaben.arbeitgeberZuschuss.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ monatlich dazu`,
          wert: eingaben.arbeitgeberZuschuss * 12,
        })
      } else {
        vorteile.push({
          icon: 'Euro',
          titel: 'Arbeitgeberzuschuss',
          beschreibung: 'Mindestens 15% Zuschuss vom Arbeitgeber',
        })
      }

      vorteile.push({
        icon: 'TrendingUp',
        titel: 'Steuer- und Sozialabgabenersparnis',
        beschreibung: 'Beiträge werden vor Steuern und Sozialabgaben abgezogen',
      })

      vorteile.push({
        icon: 'Shield',
        titel: 'Geringes Insolvenzrisiko',
        beschreibung: 'Betriebliche Altersvorsorge ist insolvenzgeschützt',
      })

      vorteile.push({
        icon: 'CheckCircle',
        titel: 'Einfache Gehaltsumwandlung',
        beschreibung: 'Direkt vom Gehalt abgebucht, keine zusätzliche Belastung',
      })
      break

    case 'private':
      vorteile.push({
        icon: 'CheckCircle',
        titel: 'Maximale Flexibilität',
        beschreibung: 'Beiträge können jederzeit angepasst werden',
      })

      vorteile.push({
        icon: 'TrendingUp',
        titel: 'Steuervorteile im Alter',
        beschreibung: 'Niedrige Besteuerung der Rentenzahlungen',
      })

      vorteile.push({
        icon: 'Shield',
        titel: 'Vererbbar',
        beschreibung: 'Kapital kann an Hinterbliebene vererbt werden',
      })

      vorteile.push({
        icon: 'CheckCircle',
        titel: 'Kapitaloption möglich',
        beschreibung: 'Option auf einmalige Kapitalauszahlung',
      })
      break

    case 'etf':
      vorteile.push({
        icon: 'TrendingUp',
        titel: 'Höchstes Renditepotenzial',
        beschreibung: 'Langfristig höhere Renditen als klassische Rentenversicherungen',
      })

      vorteile.push({
        icon: 'CheckCircle',
        titel: 'Volle Kontrolle',
        beschreibung: 'Du bestimmst selbst, wann und wie viel du entnimmst',
      })

      vorteile.push({
        icon: 'Euro',
        titel: 'Niedrige Kosten',
        beschreibung: 'Keine versteckten Gebühren, transparente Kostenstruktur',
      })

      vorteile.push({
        icon: 'CheckCircle',
        titel: 'Flexibel anpassbar',
        beschreibung: 'Sparrate und Entnahme jederzeit änderbar',
      })
      break
  }

  return vorteile
}

/**
 * Berechnet den Steuervorteil basierend auf Beitrag, Produkttyp und Steuerklasse
 */
export function calculateSteuerVorteil(
  beitragJaehrlich: number,
  produktTyp: ProduktDetails['produktTyp'],
  steuerklasse: string = 'single'
): number {
  // Vereinfachte Berechnung - in der Realität abhängig vom individuellen Steuersatz
  let steuerVorteil = 0

  switch (produktTyp) {
    case 'ruerup':
      // Rürup: Vollständig als Sonderausgabe absetzbar
      // Annahme: Durchschnittssteuersatz 30%
      steuerVorteil = beitragJaehrlich * 0.3
      break

    case 'riester':
      // Riester: Teilweise absetzbar, abhängig von Steuerklasse
      // Annahme: 20% Durchschnittssteuersatz
      steuerVorteil = beitragJaehrlich * 0.2
      break

    case 'bav':
      // bAV: Steuer- und Sozialabgabenersparnis
      // Annahme: 30% Steuer + 20% Sozialabgaben = 50% Ersparnis
      steuerVorteil = beitragJaehrlich * 0.5
      break

    case 'private':
      // Private Rentenversicherung: Ertragsanteil wird besteuert
      // Annahme: 10% Steuervorteil
      steuerVorteil = beitragJaehrlich * 0.1
      break

    case 'etf':
      // ETF: Keine steuerlichen Vorteile bei Einzahlung
      steuerVorteil = 0
      break
  }

  return Math.round(steuerVorteil * 100) / 100
}

/**
 * Erstellt ein vollständiges RentenErgebnis aus Rohdaten
 */
export function createRentenErgebnis(
  vorherData: RentenErgebnis['vorher'],
  nachherData: RentenErgebnis['nachher'],
  produktDetails: ProduktDetails,
  eingaben: {
    beitragMonatlich?: number
    kinderAnzahl?: number
    selbststaendig?: boolean
    arbeitgeberZuschuss?: number
    steuerklasse?: string
  }
): RentenErgebnis {
  const verbesserung = calculateRentenVerbesserung(vorherData, nachherData)
  const vorteile = generateVorteile(produktDetails, eingaben)

  return {
    vorher: vorherData,
    nachher: nachherData,
    verbesserung,
    vorteile,
    produktDetails,
  }
}

