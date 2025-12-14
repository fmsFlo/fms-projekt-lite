import type { RentenErgebnis } from './RentenkonzeptErgebnis'
import { createRentenErgebnis } from './rentenErgebnisUtils'

/**
 * Beispiel-Daten für die Rentenkonzept-Ergebnisseite
 * Diese können für Tests und Demos verwendet werden
 */
export const beispielRentenErgebnis: RentenErgebnis = createRentenErgebnis(
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 350.0,
    gesamtrente: 1995.89,
    rentenluecke: 2156.6,
    aktuellerBeitrag: 0,
  },
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 1275.75, // 350 + 925.75 (neue Sparrate)
    gesamtrente: 2921.64,
    rentenluecke: 1230.84,
    neuerBeitrag: 200.0,
  },
  {
    produktTyp: 'etf',
    anbieter: 'Trade Republic',
  },
  {
    beitragMonatlich: 200,
    steuerklasse: 'single',
  }
)

/**
 * Beispiel für Riester-Rente
 */
export const beispielRiesterErgebnis: RentenErgebnis = createRentenErgebnis(
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 350.0,
    gesamtrente: 1995.89,
    rentenluecke: 2156.6,
    aktuellerBeitrag: 0,
  },
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 1200.0,
    gesamtrente: 2845.89,
    rentenluecke: 1304.71,
    neuerBeitrag: 150.0,
  },
  {
    produktTyp: 'riester',
    anbieter: 'Allianz',
    garantierteRente: 1200.0,
  },
  {
    beitragMonatlich: 150,
    kinderAnzahl: 2,
    steuerklasse: 'married',
  }
)

/**
 * Beispiel für Rürup-Rente
 */
export const beispielRuerupErgebnis: RentenErgebnis = createRentenErgebnis(
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 350.0,
    gesamtrente: 1995.89,
    rentenluecke: 2156.6,
    aktuellerBeitrag: 0,
  },
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 1100.0,
    gesamtrente: 2745.89,
    rentenluecke: 1404.71,
    neuerBeitrag: 300.0,
  },
  {
    produktTyp: 'ruerup',
    anbieter: 'HUK Coburg',
    garantierteRente: 1100.0,
    steuerVorteil: 1080.0, // 300€ * 12 * 0.3
  },
  {
    beitragMonatlich: 300,
    selbststaendig: true,
    steuerklasse: 'single',
  }
)

/**
 * Beispiel für Betriebliche Altersvorsorge (bAV)
 */
export const beispielBavErgebnis: RentenErgebnis = createRentenErgebnis(
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 350.0,
    gesamtrente: 1995.89,
    rentenluecke: 2156.6,
    aktuellerBeitrag: 0,
  },
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 1150.0,
    gesamtrente: 2795.89,
    rentenluecke: 1354.71,
    neuerBeitrag: 250.0,
  },
  {
    produktTyp: 'bav',
    anbieter: 'Deutsche Rentenversicherung',
    garantierteRente: 1150.0,
  },
  {
    beitragMonatlich: 250,
    arbeitgeberZuschuss: 37.5, // 15% von 250€
    steuerklasse: 'single',
  }
)

/**
 * Beispiel für vollständig geschlossene Rentenlücke
 */
export const beispielVollstaendigGeschlossen: RentenErgebnis = createRentenErgebnis(
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 350.0,
    gesamtrente: 1995.89,
    rentenluecke: 2156.6,
    aktuellerBeitrag: 0,
  },
  {
    gesetzlicheRente: 1645.89,
    privateVorsorge: 2507.49, // Genau die Lücke geschlossen
    gesamtrente: 4153.38,
    rentenluecke: 0,
    neuerBeitrag: 350.0,
  },
  {
    produktTyp: 'etf',
    anbieter: 'Trade Republic',
  },
  {
    beitragMonatlich: 350,
    steuerklasse: 'single',
  }
)

