import type { EmpfehlungsKategorie, KategorieInfo } from './types'

export const KATEGORIE_INFO: Record<EmpfehlungsKategorie, KategorieInfo> = {
  bu: {
    name: 'Arbeitskraftabsicherung',
    icon: 'Briefcase',
    color: '#2563EB', // Neutrales Blau
    bgColor: '#DBEAFE',
  },
  rente: {
    name: 'Altersvorsorge / Rente',
    icon: 'TrendingUp',
    color: '#059669', // Grün
    bgColor: '#D1FAE5',
  },
  depot: {
    name: 'Depot / ETF-Sparplan',
    icon: 'BarChart',
    color: '#2563EB', // Blau
    bgColor: '#DBEAFE',
  },
  sonstige: {
    name: 'Sonstige',
    icon: 'FileText',
    color: '#6B7280', // Grau
    bgColor: '#F3F4F6',
  },
}

export const BEISPIEL_EMPFEHLUNGEN = [
  {
    id: 'bu-001',
    kategorie: 'bu' as EmpfehlungsKategorie,
    vorher: {
      anbieter: 'XYZ Rente',
      produkt: 'BU Premium',
      beitragMonatlich: 85,
      leistung: '1500€ BU-Rente',
      laufzeitBis: '31.12.2045',
      features: [
        'Weltweiter Schutz',
        'Verzicht auf abstrakte Verweisung',
        'Rückwirkende Leistung ab Monat 7',
      ],
    },
    nachher: {
      anbieter: 'ABC Versicherung',
      produkt: 'BU Optimal Plus',
      beitragMonatlich: 78,
      leistung: '2000€ BU-Rente',
      laufzeitBis: '31.12.2050',
      features: [
        'Weltweiter Schutz',
        'Verzicht auf abstrakte Verweisung',
        'Rückwirkende Leistung ab Monat 1',
        'Arbeitsunfähigkeitsklausel inklusive',
        'Beitragsdynamik 3% p.a.',
      ],
    },
    vorteile: [
      '7€ monatlich günstiger (84€ pro Jahr)',
      '500€ höhere BU-Rente (+33%)',
      'Leistung ab 1. Monat statt 7. Monat',
      'Zusätzliche AU-Klausel',
      '5 Jahre längere Absicherung',
    ],
  },
]

