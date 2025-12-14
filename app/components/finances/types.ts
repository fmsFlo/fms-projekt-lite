// Types für Einnahmen-Ausgaben-Analyse

export interface Einkommen {
  id: string
  name: string
  betrag: number
  typ: 'haupt' | 'nebenjob' | 'miete' | 'sonstiges'
}

export interface Ausgabenkategorie {
  id: string
  name: string
  betrag: number
  typ: 'fix' | 'variabel'
  icon?: string // lucide-react icon name
  durchschnitt?: number // Vergleichswert für Deutschland
  beschreibung?: string
}

export interface FinanzielleSituation {
  id?: string
  userId?: string
  persoenlicheDaten: {
    beruf: string
    nettoEinkommen: number
    zusatzEinkommen?: Einkommen[]
  }
  fixkosten: Ausgabenkategorie[]
  variableKosten: Ausgabenkategorie[]
  timestamp?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface SparRechnerErgebnis {
  einsparungMonatlich: number
  anlagehorizont: number
  rendite: number
  endkapital: number
  einzahlungen: number
  zinsenGewinn: number
  verlaufDaten: { jahr: number; kapital: number; einzahlungen: number; zinsen: number }[]
}

export interface Szenario {
  monatlicheSparrate: number
  nach10Jahren: number
  nach20Jahren: number
  nach30Jahren: number
  nach40Jahren?: number
}

export interface SzenarioVergleich {
  jetzt: Szenario
  optimiert: Szenario
  maximum: Szenario
}

export interface LebensKostenErgebnis {
  kategorie: string
  monatlich: number
  nach10Jahren: number
  nach20Jahren: number
  nach30Jahren: number
  bisRente: number // bis 67 Jahre
  schockEffekt?: string // z.B. "43.800€ für Kaffee to go"
}

export interface KategorieVergleich {
  kategorie: string
  aktuell: number
  durchschnitt: number
  differenz: number
  potenzial: number
  prozentAbweichung: number
}

export interface Sparziel {
  zielBetrag: number
  zielJahre: number
  erforderlicheSparrate: number
  vorschlaege: {
    kategorie: string
    einsparung: number
  }[]
}

export interface VersteckteKosten {
  kategorien: {
    name: string
    betrag: number
  }[]
  gesamt: number
  beschreibung: string
}

