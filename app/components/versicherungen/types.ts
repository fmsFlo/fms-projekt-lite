// Types für Versicherungs-Check

export type VersicherungsTyp =
  | 'phv'
  | 'bu'
  | 'rlv'
  | 'hausrat'
  | 'wohngebaeude'
  | 'kfz'
  | 'rechtsschutz'
  | 'zahnzusatz'
  | 'krankenhauszusatz'
  | 'unfall'
  | 'restschuld'
  | 'kapitallebens'
  | 'sterbegeld'
  | 'brille'
  | 'handy'
  | 'reisegepaeck'
  | 'sonstige'

export type VersicherungsStatus = 'empfehlung' | 'nicht_noetig' | 'neue_empfehlung'

export type RisikoStatus = 'kritisch' | 'mittel' | 'gut'

export type Wichtigkeit = 'kritisch' | 'empfohlen' | 'optional'

export interface LeistungsMerkmal {
  typ: 'hoehere_summe' | 'bessere_konditionen' | 'zusatzleistungen' | 'guenstigerer_beitrag' | 'keine_sb'
  beschreibung: string
  wertVorher?: string
  wertNachher?: string
}

export interface VersicherungVorher {
  anbieter: string
  beitragMonatlich: number
  versicherungssumme?: number
  buRente?: number
  rlvSumme?: number
  leistungen?: string[]
  sfKlasse?: number
}

export interface VersicherungNachher {
  anbieter?: string
  beitragMonatlich: number
  versicherungssumme?: number
  buRente?: number
  rlvSumme?: number
  leistungsverbesserungen: LeistungsMerkmal[]
  vorteile: string[]
}

export interface AnlageBerechnung {
  monatlicheBeitrag: number
  rendite: number
  nach1Jahr: number
  nach5Jahren: number
  nach10Jahren: number
  nach20Jahren: number
  nach30Jahren: number
  verlaufDaten: { jahr: number; ohneAnlage: number; mitAnlage: number }[]
}

export interface Versicherung {
  id: string
  typ: VersicherungsTyp
  status: VersicherungsStatus
  vorher?: VersicherungVorher
  nachher?: VersicherungNachher
  begruendungVerzicht?: string
  wichtigkeit?: Wichtigkeit
  begruendungNeu?: string
  differenzMonatlich: number
  anlagePotenzial?: AnlageBerechnung
}

export interface VersicherungsCheck {
  id?: string
  clientId?: string
  versicherungen: Versicherung[]
  gesamtBeitragVorher: number
  gesamtBeitragNachher: number
  einsparung: number
  risikoStatusVorher: RisikoStatus
  risikoStatusNachher: RisikoStatus
  createdAt?: Date
  updatedAt?: Date
}

export interface VersicherungOptimierung {
  typ: VersicherungsTyp
  name: string
  differenz: number
  highlights: string[]
}

export interface GesamtErgebnis {
  beitragVorher: number
  beitragNachher: number
  differenz: number
  anzahlVorher: number
  anzahlNachher: number
  optimierungen: VersicherungOptimierung[]
  einsparungen: VersicherungOptimierung[]
  neuEmpfehlungen: VersicherungOptimierung[]
  anlageGesamt: AnlageBerechnung
}

export interface VersicherungsKategorie {
  name: string
  typ: 'existenziell' | 'sach' | 'optional'
  versicherungen: VersicherungsTyp[]
}

