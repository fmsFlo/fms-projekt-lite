import type { Bundesland } from './besoldungstabellen'

export interface BeamtenInput {
  geburtsdatum: string
  diensteintritt: string
  kirchensteuerpflichtig: boolean
  bundesland: Bundesland
  besoldungsordnung: 'A' | 'B' | 'W' | 'R'
  besoldungsgruppe: string
  erfahrungsstufe: number
  zusaetzliche_ruhegehaltsansprueche: number
  lebenserwartung: number
  pensionseintrittsalter: number
  pensionssteigerung: number
  aufstieg_besoldungsgruppe?: boolean
  zukuenftige_besoldungsgruppe?: string
  zukuenftige_erfahrungsstufe?: number
}

export interface RuhegehaltssatzErgebnis {
  ruhegehaltssatz: number
  abschlag: number
  maximalRuhegehaltssatz: number
}

export interface BeamtenpensionErgebnis {
  eingabe: Required<BeamtenInput>
  berechnungsdaten: {
    aktuellesAlter: number
    jahreBisPension: number
    jahrPensionseintritt: number
    dienstzeit: {
      dienstjahre: number
      dienstjahreGerundet: number
    }
    ruhegehaltssatz: RuhegehaltssatzErgebnis
    dienstbezuege: {
      grundgehaltAktuell: number
      grundgehaltBeiPension: number
      ruhegehaltfaehigeDienstbezuege: number
    }
  }
  bruttoPension: {
    bruttoPensionMonatlich: number
    bruttoPensionJaehrlich: number
  }
  abzuege: {
    kvpv: {
      beihilfesatz: number
      kvBeitragMonatlich: number
      pvBeitragMonatlich: number
      sozialversicherungMonatlich: number
      sozialversicherungJaehrlich: number
    }
    steuern: {
      versorgungsfreibetrag: {
        versorgungsfreibetrag: number
        zuschlag: number
        gesamt: number
      }
      werbungskostenpauschale: number
      einkuenfteAusVersorgungsbezuegen: number
      sonderausgabenGesamt: number
      zuVersteuerndesEinkommen: number
      einkommensteuerJaehrlich: number
      kirchensteuerJaehrlich: number
      solidaritaetszuschlag: number
      steuernGesamtJaehrlich: number
      steuernGesamtMonatlich: number
    }
  }
  nettoPension: {
    nettoPensionMonatlich: number
    nettoPensionJaehrlich: number
  }
  zusammenfassung: {
    bruttoPensionMonatlich: number
    kvBeitrag: number
    pvBeitrag: number
    steuern: number
    nettoPensionMonatlich: number
    bruttoPensionJaehrlich: number
    abzuegeJaehrlich: number
    nettoPensionJaehrlich: number
    ruhegehaltssatzProzent: number
  }
}




