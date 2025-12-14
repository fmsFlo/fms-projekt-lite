import type { VersicherungsKategorie, VersicherungsTyp } from './types'

export const VERSICHERUNGS_KATEGORIEN: VersicherungsKategorie[] = [
  {
    name: 'Existenzielle Versicherungen',
    typ: 'existenziell',
    versicherungen: ['phv', 'bu', 'rlv'],
  },
  {
    name: 'Sach-Versicherungen',
    typ: 'sach',
    versicherungen: ['hausrat', 'wohngebaeude', 'kfz', 'rechtsschutz'],
  },
  {
    name: 'Optionale/Kritische Versicherungen',
    typ: 'optional',
    versicherungen: [
      'zahnzusatz',
      'krankenhauszusatz',
      'unfall',
      'restschuld',
      'kapitallebens',
      'sterbegeld',
      'brille',
      'handy',
      'reisegepaeck',
    ],
  },
]

export const VERSICHERUNGS_NAMEN: Record<VersicherungsTyp, string> = {
  phv: 'Privathaftpflicht (PHV)',
  bu: 'Berufsunfähigkeitsversicherung (BU)',
  rlv: 'Risikolebensversicherung (RLV)',
  hausrat: 'Hausratversicherung',
  wohngebaeude: 'Wohngebäudeversicherung',
  kfz: 'KFZ-Versicherung',
  rechtsschutz: 'Rechtsschutzversicherung',
  zahnzusatz: 'Zahnzusatzversicherung',
  krankenhauszusatz: 'Krankenhaustagegeld',
  unfall: 'Unfallversicherung',
  restschuld: 'Restschuldversicherung',
  kapitallebens: 'Kapitallebensversicherung',
  sterbegeld: 'Sterbegeldversicherung',
  brille: 'Brillenversicherung',
  handy: 'Handyversicherung',
  reisegepaeck: 'Reisegepäckversicherung',
  sonstige: 'Sonstige Versicherung',
}

export const VERSICHERUNGS_ICONS: Record<VersicherungsTyp, string> = {
  phv: 'Shield',
  bu: 'Briefcase',
  rlv: 'Heart',
  hausrat: 'Home',
  wohngebaeude: 'Home',
  kfz: 'Car',
  rechtsschutz: 'Scale',
  zahnzusatz: 'Smile',
  krankenhauszusatz: 'Hospital',
  unfall: 'AlertTriangle',
  restschuld: 'CreditCard',
  kapitallebens: 'TrendingUp',
  sterbegeld: 'Heart',
  brille: 'Eye',
  handy: 'Smartphone',
  reisegepaeck: 'Luggage',
  sonstige: 'FileText',
}

export const DURCHSCHNITTS_BEITRAEGE: Record<VersicherungsTyp, { min: number; max: number }> = {
  phv: { min: 5, max: 8 },
  bu: { min: 80, max: 150 },
  rlv: { min: 15, max: 40 },
  hausrat: { min: 8, max: 12 },
  wohngebaeude: { min: 15, max: 30 },
  kfz: { min: 30, max: 80 },
  rechtsschutz: { min: 15, max: 25 },
  zahnzusatz: { min: 20, max: 40 },
  krankenhauszusatz: { min: 10, max: 25 },
  unfall: { min: 15, max: 35 },
  restschuld: { min: 20, max: 50 },
  kapitallebens: { min: 50, max: 150 },
  sterbegeld: { min: 10, max: 30 },
  brille: { min: 5, max: 15 },
  handy: { min: 5, max: 15 },
  reisegepaeck: { min: 3, max: 10 },
  sonstige: { min: 10, max: 50 },
}

