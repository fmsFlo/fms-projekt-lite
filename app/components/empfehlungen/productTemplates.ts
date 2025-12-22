// Standard-Produktvorlagen pro Kategorie

export interface ProduktTemplate {
  name: string
  anbieter: string[]
  typ: string
}

export const PRODUKT_TEMPLATES: Record<string, ProduktTemplate[]> = {
  bu: [
    {
      name: 'BU Standard',
      anbieter: ['Allianz', 'AXA', 'HUK24', 'Interrisk', 'LV 1871', 'Nürnberger', 'R+V', 'Signal Iduna', 'Volkswohl Bund'],
      typ: 'Standard',
    },
    {
      name: 'BU Premium',
      anbieter: ['Allianz', 'AXA', 'Interrisk', 'LV 1871', 'Nürnberger', 'R+V'],
      typ: 'Premium',
    },
    {
      name: 'BU Komfort',
      anbieter: ['Allianz', 'AXA', 'Interrisk', 'LV 1871'],
      typ: 'Komfort',
    },
    {
      name: 'Eigenes Produkt',
      anbieter: [],
      typ: 'Eigen',
    },
  ],
  rente: [
    {
      name: 'Riester-Rente',
      anbieter: ['Allianz', 'AXA', 'DEVK', 'HUK24', 'LV 1871', 'Nürnberger', 'R+V', 'Signal Iduna'],
      typ: 'Riester',
    },
    {
      name: 'Rürup-Rente',
      anbieter: ['Allianz', 'AXA', 'HUK24', 'LV 1871', 'Nürnberger', 'R+V'],
      typ: 'Rürup',
    },
    {
      name: 'Private Rentenversicherung',
      anbieter: ['Allianz', 'AXA', 'HUK24', 'LV 1871', 'Nürnberger', 'R+V', 'Signal Iduna'],
      typ: 'Privat',
    },
    {
      name: 'ETF-Sparplan',
      anbieter: ['Trade Republic', 'Scalable Capital', 'ING', 'Comdirect', 'DKB', 'Consorsbank'],
      typ: 'ETF',
    },
    {
      name: 'Eigenes Produkt',
      anbieter: [],
      typ: 'Eigen',
    },
  ],
  depot: [
    {
      name: 'ETF-Sparplan',
      anbieter: ['Trade Republic', 'Scalable Capital', 'ING', 'Comdirect', 'DKB', 'Consorsbank', 'Flatex'],
      typ: 'ETF',
    },
    {
      name: 'Aktien-Depot',
      anbieter: ['Trade Republic', 'Scalable Capital', 'ING', 'Comdirect', 'DKB', 'Consorsbank', 'Flatex'],
      typ: 'Aktien',
    },
    {
      name: 'Fonds-Depot',
      anbieter: ['ING', 'Comdirect', 'DKB', 'Consorsbank', 'Flatex'],
      typ: 'Fonds',
    },
    {
      name: 'Eigenes Produkt',
      anbieter: [],
      typ: 'Eigen',
    },
  ],
  sonstige: [
    {
      name: 'Eigenes Produkt',
      anbieter: [],
      typ: 'Eigen',
    },
  ],
}

