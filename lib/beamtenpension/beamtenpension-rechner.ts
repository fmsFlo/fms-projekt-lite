import { differenceInCalendarDays } from 'date-fns'
import { z } from 'zod'
import type { BeamtenInput, BeamtenpensionErgebnis, RuhegehaltssatzErgebnis } from './types'
import type { Bundesland } from './besoldungstabellen'
import { BUNDESLAENDER, getGrundgehalt } from './besoldungstabellen'

const MAX_RUHEGEHALTSSATZ = 71.75
const PRO_SATZ_PRO_JAHR = 1.79375

const beamtenInputSchema = z.object({
  geburtsdatum: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Ungültiges Geburtsdatum.'),
  diensteintritt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Ungültiges Diensteintrittsdatum.'),
  kirchensteuerpflichtig: z.boolean().default(true),
  bundesland: z.enum(BUNDESLAENDER),
  besoldungsordnung: z.enum(['A', 'B', 'W', 'R']).default('A'),
  besoldungsgruppe: z.string(),
  erfahrungsstufe: z.number().int().min(1).max(12),
  zusaetzliche_ruhegehaltsansprueche: z.number().min(0).default(0),
  lebenserwartung: z.number().int().min(70).max(100).default(88),
  pensionseintrittsalter: z.number().int().min(55).max(70),
  pensionssteigerung: z.number().min(0).max(5).default(1.5),
  aufstieg_besoldungsgruppe: z.boolean().optional(),
  zukuenftige_besoldungsgruppe: z.string().optional(),
  zukuenftige_erfahrungsstufe: z.number().int().min(1).max(12).optional(),
})

function parseInput(input: BeamtenInput): Required<BeamtenInput> {
  const parsed = beamtenInputSchema.parse(input)

  if (parsed.aufstieg_besoldungsgruppe) {
    if (!parsed.zukuenftige_besoldungsgruppe || !parsed.zukuenftige_erfahrungsstufe) {
      throw new Error('Für einen geplanten Aufstieg müssen Ziel-Besoldungsgruppe und Erfahrungsstufe angegeben werden.')
    }
  }

  return {
    ...parsed,
    aufstieg_besoldungsgruppe: parsed.aufstieg_besoldungsgruppe ?? false,
    zukuenftige_besoldungsgruppe: parsed.zukuenftige_besoldungsgruppe ?? parsed.besoldungsgruppe,
    zukuenftige_erfahrungsstufe: parsed.zukuenftige_erfahrungsstufe ?? parsed.erfahrungsstufe,
  }
}

export function berechneRuhegehaltfaehigeDienstzeit(diensteintritt: string, pensionseintritt: Date) {
  const diensteintrittDatum = new Date(diensteintritt)
  const diensttage = differenceInCalendarDays(pensionseintritt, diensteintrittDatum)
  if (diensttage <= 0) {
    throw new Error('Dienstzeit muss positiv sein.')
  }
  const dienstjahre = diensttage / 365.25
  return {
    dienstjahre,
    dienstjahreGerundet: Math.floor(dienstjahre * 100) / 100,
  }
}

export function berechneRuhegehaltssatz(dienstjahre: number, pensionsalter: number, regelaltersgrenze = 67): RuhegehaltssatzErgebnis {
  let ruhegehaltssatz = Math.min(dienstjahre * PRO_SATZ_PRO_JAHR, MAX_RUHEGEHALTSSATZ)

  let abschlag = 0
  if (pensionsalter < regelaltersgrenze) {
    const jahreVorzeitig = regelaltersgrenze - pensionsalter
    abschlag = jahreVorzeitig * 3.6
    ruhegehaltssatz = Math.max(0, ruhegehaltssatz - abschlag)
  }

  return {
    ruhegehaltssatz,
    abschlag,
    maximalRuhegehaltssatz: MAX_RUHEGEHALTSSATZ,
  }
}

export function berechneRuhegehaltfaehigeDienstbezuege(
  besoldungsgruppe: string,
  erfahrungsstufe: number,
  bundesland: Bundesland,
  pensionssteigerung: number,
  jahrebisPension: number,
  zielBesoldungsgruppe?: string,
  zielErfahrungsstufe?: number,
) {
  const ausgangsgrundgehalt = getGrundgehalt({
    bundesland,
    besoldungsgruppe,
    erfahrungsstufe,
  })

  const zielgruppe = zielBesoldungsgruppe ?? besoldungsgruppe
  const zielstufe = zielErfahrungsstufe ?? erfahrungsstufe

  const grundgehaltBeiPension = getGrundgehalt({
    bundesland,
    besoldungsgruppe: zielgruppe,
    erfahrungsstufe: zielstufe,
  }) * Math.pow(1 + pensionssteigerung / 100, Math.max(0, jahrebisPension))

  return {
    grundgehaltAktuell: ausgangsgrundgehalt,
    grundgehaltBeiPension,
    ruhegehaltfaehigeDienstbezuege: grundgehaltBeiPension,
  }
}

export function berechneBruttoPension(ruhegehaltfaehigeDienstbezuege: number, ruhegehaltssatz: number, zusaetzlicheAnsprueche = 0) {
  const bruttoPensionMonatlich = ruhegehaltfaehigeDienstbezuege * (ruhegehaltssatz / 100) + zusaetzlicheAnsprueche
  const bruttoPensionJaehrlich = bruttoPensionMonatlich * 12
  return {
    bruttoPensionMonatlich,
    bruttoPensionJaehrlich,
  }
}

const DEFAULT_BEIHILFESATZ = 0.7
const BEIHILFESAETZE: Partial<Record<Bundesland, number>> = {
  'Baden-Württemberg': 0.7,
  Bund: 0.7,
}

export function berechneKVPV(bruttoPensionMonatlich: number, bundesland: Bundesland, kinderlos = true) {
  const beihilfesatz = BEIHILFESAETZE[bundesland] ?? DEFAULT_BEIHILFESATZ
  const eigenanteil = 1 - beihilfesatz
  const kvBeitragProzent = eigenanteil * 0.107 // angenommener voll KV-Satz 14,9% + Zusatz 1,4% -> 16.3% * Anteil
  const kvBeitragMonatlich = bruttoPensionMonatlich * kvBeitragProzent

  const pvGrundsatz = 0.034
  const pvKinderlosZuschlag = kinderlos ? 0.006 : 0
  const pvBeitragMonatlich = bruttoPensionMonatlich * (pvGrundsatz + pvKinderlosZuschlag) * eigenanteil

  const sozialversicherungMonatlich = kvBeitragMonatlich + pvBeitragMonatlich

  return {
    beihilfesatz,
    kvBeitragMonatlich,
    pvBeitragMonatlich,
    sozialversicherungMonatlich,
    sozialversicherungJaehrlich: sozialversicherungMonatlich * 12,
  }
}

const versorgungsfreibetragTabelle: Record<number, { prozent: number; hoechstbetrag: number; zuschlag: number }> = {
  2025: { prozent: 14.7, hoechstbetrag: 1102.5, zuschlag: 330 },
  2026: { prozent: 13.7, hoechstbetrag: 1027.5, zuschlag: 308 },
  2027: { prozent: 12.7, hoechstbetrag: 952.5, zuschlag: 286 },
  2028: { prozent: 11.7, hoechstbetrag: 877.5, zuschlag: 263 },
  2029: { prozent: 10.7, hoechstbetrag: 802.5, zuschlag: 241 },
  2030: { prozent: 9.7, hoechstbetrag: 727.5, zuschlag: 218 },
  2031: { prozent: 8.7, hoechstbetrag: 652.5, zuschlag: 196 },
  2032: { prozent: 7.7, hoechstbetrag: 577.5, zuschlag: 173 },
  2033: { prozent: 6.7, hoechstbetrag: 502.5, zuschlag: 151 },
  2034: { prozent: 5.7, hoechstbetrag: 427.5, zuschlag: 128 },
  2035: { prozent: 4.7, hoechstbetrag: 352.5, zuschlag: 106 },
  2036: { prozent: 3.7, hoechstbetrag: 277.5, zuschlag: 83 },
  2037: { prozent: 2.7, hoechstbetrag: 202.5, zuschlag: 61 },
  2038: { prozent: 1.7, hoechstbetrag: 127.5, zuschlag: 38 },
  2039: { prozent: 0.7, hoechstbetrag: 52.5, zuschlag: 16 },
  2040: { prozent: 0, hoechstbetrag: 0, zuschlag: 0 },
}

export function berechneVersorgungsfreibetrag(bruttoPensionJaehrlich: number, jahrPensionseintritt: number) {
  if (jahrPensionseintritt >= 2040) {
    return { versorgungsfreibetrag: 0, zuschlag: 0, gesamt: 0 }
  }
  const daten = versorgungsfreibetragTabelle[jahrPensionseintritt] ?? versorgungsfreibetragTabelle[2040]
  const versorgungsfreibetrag = Math.min(bruttoPensionJaehrlich * (daten.prozent / 100), daten.hoechstbetrag)
  const gesamt = versorgungsfreibetrag + daten.zuschlag
  return {
    versorgungsfreibetrag,
    zuschlag: daten.zuschlag,
    gesamt,
  }
}

export function berechneEinkommensteuer(zuVersteuerndesEinkommen: number) {
  const zvE = zuVersteuerndesEinkommen
  if (zvE <= 11784) {
    return 0
  } else if (zvE <= 17005) {
    const y = (zvE - 11784) / 10000
    return (922.98 * y + 1400) * y
  } else if (zvE <= 66760) {
    const zVal = (zvE - 17005) / 10000
    return (181.19 * zVal + 2397) * zVal + 1025.38
  } else if (zvE <= 277825) {
    return 0.42 * zvE - 10602.13
  }
  return 0.45 * zvE - 18936.88
}

export function berechneSteuern(
  bruttoPensionJaehrlich: number,
  kvpvJaehrlich: number,
  jahrPensionseintritt: number,
  kirchensteuerpflichtig: boolean,
  bundesland: Bundesland,
) {
  const versorgungsfreibetrag = berechneVersorgungsfreibetrag(bruttoPensionJaehrlich, jahrPensionseintritt)
  const werbungskostenpauschale = 102
  const einkuenfteAusVersorgungsbezuegen = Math.max(0, bruttoPensionJaehrlich - versorgungsfreibetrag.gesamt - werbungskostenpauschale)
  const sonderausgabenpauschale = 36
  const sonderausgabenVorsorge = Math.min(kvpvJaehrlich, 1900)
  const sonderausgabenGesamt = sonderausgabenpauschale + sonderausgabenVorsorge
  const zuVersteuerndesEinkommen = Math.max(0, einkuenfteAusVersorgungsbezuegen - sonderausgabenGesamt)

  const einkommensteuerJaehrlich = berechneEinkommensteuer(zuVersteuerndesEinkommen)
  const kirchensteuersatz = bundesland === 'Baden-Württemberg' || bundesland === 'Bayern' ? 0.08 : 0.09
  const kirchensteuerJaehrlich = kirchensteuerpflichtig ? einkommensteuerJaehrlich * kirchensteuersatz : 0

  const soliFreigrenze = 18130
  let solidaritaetszuschlag = 0
  if (einkommensteuerJaehrlich > soliFreigrenze) {
    const differenz = einkommensteuerJaehrlich - soliFreigrenze
    solidaritaetszuschlag = Math.min(differenz * 0.119, einkommensteuerJaehrlich * 0.055)
  }

  return {
    versorgungsfreibetrag,
    werbungskostenpauschale,
    einkuenfteAusVersorgungsbezuegen,
    sonderausgabenGesamt,
    zuVersteuerndesEinkommen,
    einkommensteuerJaehrlich,
    kirchensteuerJaehrlich,
    solidaritaetszuschlag,
    steuernGesamtJaehrlich: einkommensteuerJaehrlich + kirchensteuerJaehrlich + solidaritaetszuschlag,
    steuernGesamtMonatlich: (einkommensteuerJaehrlich + kirchensteuerJaehrlich + solidaritaetszuschlag) / 12,
  }
}

export function berechneNettoPension(bruttoPensionMonatlich: number, sozialversicherungMonatlich: number, steuernMonatlich: number) {
  const nettoPensionMonatlich = bruttoPensionMonatlich - sozialversicherungMonatlich - steuernMonatlich
  return {
    nettoPensionMonatlich,
    nettoPensionJaehrlich: nettoPensionMonatlich * 12,
  }
}

export default function berechneBeamtenpension(input: BeamtenInput): BeamtenpensionErgebnis {
  const parsed = parseInput(input)
  const geburtsdatum = new Date(parsed.geburtsdatum)
  const aktuellesJahr = new Date().getFullYear()
  const aktuellesAlter = aktuellesJahr - geburtsdatum.getFullYear()
  const jahreBisPension = parsed.pensionseintrittsalter - aktuellesAlter
  if (jahreBisPension < 0) {
    throw new Error('Pensionsalter liegt in der Vergangenheit.')
  }

  const jahrPensionseintritt = geburtsdatum.getFullYear() + parsed.pensionseintrittsalter
  const pensionseintrittDatum = new Date(geburtsdatum)
  pensionseintrittDatum.setFullYear(jahrPensionseintritt)

  const dienstzeit = berechneRuhegehaltfaehigeDienstzeit(parsed.diensteintritt, pensionseintrittDatum)
  const ruhegehaltssatz = berechneRuhegehaltssatz(dienstzeit.dienstjahre, parsed.pensionseintrittsalter)
  const dienstbezuege = berechneRuhegehaltfaehigeDienstbezuege(
    parsed.besoldungsgruppe,
    parsed.erfahrungsstufe,
    parsed.bundesland,
    parsed.pensionssteigerung,
    jahreBisPension,
    parsed.aufstieg_besoldungsgruppe ? parsed.zukuenftige_besoldungsgruppe : undefined,
    parsed.aufstieg_besoldungsgruppe ? parsed.zukuenftige_erfahrungsstufe : undefined,
  )
  const bruttoPension = berechneBruttoPension(
    dienstbezuege.ruhegehaltfaehigeDienstbezuege,
    ruhegehaltssatz.ruhegehaltssatz,
    parsed.zusaetzliche_ruhegehaltsansprueche,
  )
  const kvpv = berechneKVPV(bruttoPension.bruttoPensionMonatlich, parsed.bundesland)
  const steuern = berechneSteuern(
    bruttoPension.bruttoPensionJaehrlich,
    kvpv.sozialversicherungJaehrlich,
    jahrPensionseintritt,
    parsed.kirchensteuerpflichtig,
    parsed.bundesland,
  )
  const nettoPension = berechneNettoPension(
    bruttoPension.bruttoPensionMonatlich,
    kvpv.sozialversicherungMonatlich,
    steuern.steuernGesamtMonatlich,
  )

  return {
    eingabe: parsed,
    berechnungsdaten: {
      aktuellesAlter,
      jahreBisPension,
      jahrPensionseintritt,
      dienstzeit,
      ruhegehaltssatz,
      dienstbezuege,
    },
    bruttoPension,
    abzuege: {
      kvpv,
      steuern,
    },
    nettoPension,
    zusammenfassung: {
      bruttoPensionMonatlich: bruttoPension.bruttoPensionMonatlich,
      kvBeitrag: kvpv.kvBeitragMonatlich,
      pvBeitrag: kvpv.pvBeitragMonatlich,
      steuern: steuern.steuernGesamtMonatlich,
      nettoPensionMonatlich: nettoPension.nettoPensionMonatlich,
      bruttoPensionJaehrlich: bruttoPension.bruttoPensionJaehrlich,
      abzuegeJaehrlich: kvpv.sozialversicherungJaehrlich + steuern.steuernGesamtJaehrlich,
      nettoPensionJaehrlich: nettoPension.nettoPensionJaehrlich,
      ruhegehaltssatzProzent: ruhegehaltssatz.ruhegehaltssatz,
    },
  }
}
