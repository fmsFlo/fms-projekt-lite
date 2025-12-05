import { strict as assert } from 'node:assert'
import test from 'node:test'

import berechneBeamtenpension, {
  berechneBruttoPension,
  berechneEinkommensteuer,
  berechneRuhegehaltfaehigeDienstbezuege,
  berechneRuhegehaltfaehigeDienstzeit,
  berechneRuhegehaltssatz,
  berechneSteuern,
} from './beamtenpension-rechner'

const BASIS_EINGABE = {
  geburtsdatum: '1970-01-01',
  diensteintritt: '2000-01-01',
  kirchensteuerpflichtig: true,
  bundesland: 'Baden-Württemberg' as const,
  besoldungsordnung: 'A' as const,
  besoldungsgruppe: 'A7',
  erfahrungsstufe: 1,
  zusaetzliche_ruhegehaltsansprueche: 0,
  lebenserwartung: 88,
  pensionseintrittsalter: 67,
  pensionssteigerung: 1.5,
}

test('berechneRuhegehaltfaehigeDienstzeit liefert korrekte Dienstjahre', () => {
  const pensionseintrittDatum = new Date('2037-01-01')
  const dienstzeit = berechneRuhegehaltfaehigeDienstzeit('2000-01-01', pensionseintrittDatum)
  assert.ok(dienstzeit.dienstjahre > 36.9 && dienstzeit.dienstjahre < 37.1)
})

test('berechneRuhegehaltssatz begrenzt auf Maximum', () => {
  const { ruhegehaltssatz } = berechneRuhegehaltssatz(50, 67)
  assert.equal(ruhegehaltssatz, 71.75)
})

test('berechneRuhegehaltfaehigeDienstbezuege berücksichtigt Steigerung', () => {
  const result = berechneRuhegehaltfaehigeDienstbezuege('A7', 1, 'Baden-Württemberg', 1.5, 10)
  assert.ok(result.grundgehaltBeiPension > result.grundgehaltAktuell)
})

test('berechneBruttoPension addiert Zusatzansprüche', () => {
  const result = berechneBruttoPension(4000, 71.75, 200)
  assert.ok(result.bruttoPensionMonatlich > 3000)
})

test('berechneEinkommensteuer nutzt Tarif 2025', () => {
  const steuer = berechneEinkommensteuer(40000)
  assert.ok(steuer > 4000)
})

test('berechneSteuern liefert plausible Steuerlast', () => {
  const steuern = berechneSteuern(48000, 1800, 2030, true, 'Baden-Württemberg')
  assert.ok(steuern.steuernGesamtJaehrlich > 0)
  assert.ok(steuern.versorgungsfreibetrag.gesamt > 0)
})

test('Hauptfunktion berechnet schlüssige Werte', () => {
  const ergebnis = berechneBeamtenpension(BASIS_EINGABE)
  assert.ok(ergebnis.bruttoPension.bruttoPensionMonatlich > 2500)
  assert.ok(ergebnis.nettoPension.nettoPensionMonatlich > 1500)
  assert.equal(ergebnis.eingabe.besoldungsgruppe, 'A7')
})

test('Vorzeitige Pensionierung reduziert den Ruhegehaltssatz', () => {
  const result = berechneBeamtenpension({
    ...BASIS_EINGABE,
    pensionseintrittsalter: 63,
  })
  assert.ok(result.berechnungsdaten.ruhegehaltssatz.abschlag > 0)
  assert.ok(result.berechnungsdaten.ruhegehaltssatz.ruhegehaltssatz < 71.75)
})




