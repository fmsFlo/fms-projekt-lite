// Types für Empfehlungs-Vergleich

export type EmpfehlungsKategorie = 'bu' | 'rente' | 'depot' | 'sonstige'

export interface EmpfehlungVorher {
  anbieter: string
  produkt: string
  beitragMonatlich: number
  leistung: string // z.B. "2000€ BU-Rente"
  laufzeitBis?: string // z.B. "31.12.2045"
  features: string[] // Array von Textzeilen
}

export interface EmpfehlungNachher {
  anbieter: string
  produkt: string
  beitragMonatlich: number
  leistung: string
  laufzeitBis?: string
  features: string[]
}

export interface Empfehlung {
  id: string
  kategorie: EmpfehlungsKategorie
  vorher: EmpfehlungVorher
  nachher: EmpfehlungNachher
  vorteile: string[] // Array von Vorteilstexten
  notizen?: string // Für Berater-Kommentare
  rentenlueckeVorher?: number // Rentenlücke vorher (nur für rente-Kategorie)
  rentenlueckeNachher?: number // Rentenlücke nachher (nur für rente-Kategorie)
  rentenlueckeGesamt?: number // Gesamte Rentenlücke (nur für rente-Kategorie)
}

export interface EmpfehlungsCheck {
  id?: string
  clientId?: string
  empfehlungen: Empfehlung[]
  gesamtEinsparungMonatlich: number
  gesamtEinsparungJaehrlich: number
  anzahlOptimierungen: number
  createdAt?: Date
  updatedAt?: Date
}

export interface KategorieInfo {
  name: string
  icon: string
  color: string
  bgColor: string
}

