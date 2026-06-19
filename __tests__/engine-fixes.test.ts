/**
 * REGRESSION SUITE — verifică erorile de motor corectate (audit 19.06.2026).
 * #1 medicația ignorată la PT+aPTT amândouă prelungite
 * #2 inverse-mapping subestima severitatea factorului dominant
 * #3 maparea TT includea protrombina (F2)
 * #4 fibrinogen scăzut izolat raportat „profil normal"
 */
import { interpretLabValues } from '@/engine/interpreter';
import { calculateFactorConcentrations } from '@/engine/inverse-mapping';
import { LAB_FACTOR_MAPPING } from '@/engine/coagulation';
import { LabInput, MedicationContext } from '@/types';

const N: LabInput = { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5, mixingTest: 'not_performed' };
const noMeds: MedicationContext = { warfarin: false, heparin: false, lmwh: false, doacXa: false, doacIIa: false, antiplatelet: false };

describe('FIX #1 — medicația la PT+aPTT amândouă prelungite', () => {
  test('warfarină supraterapeutică (PT50/aPTT55) → efect AVK, NU insuficiență hepatică', () => {
    const r = interpretLabValues({ ...N, pt: 50, inr: 4.2, aptt: 55 }, { ...noMeds, warfarin: true });
    expect(r.diagnoses[0]?.id).toBe('warfarin_effect');
    expect(r.diagnoses.some(d => d.id === 'liver_failure')).toBe(false);
    expect(r.warnings.some(w => w.includes('supradozat'))).toBe(true);
  });
  test('heparină doză mare (PT22/aPTT90) → efect heparină, NU insuficiență hepatică', () => {
    const r = interpretLabValues({ ...N, pt: 22, aptt: 90 }, { ...noMeds, heparin: true });
    expect(r.diagnoses[0]?.id).toBe('heparin_effect');
    expect(r.diagnoses.some(d => d.id === 'liver_failure')).toBe(false);
  });
  test('DIC rămâne detectat chiar sub anticoagulant (triadă specifică)', () => {
    const r = interpretLabValues({ ...N, pt: 28, aptt: 65, fibrinogen: 60, platelets: 25, dDimers: 6000 }, { ...noMeds, warfarin: true });
    const ids = r.diagnoses.map(d => d.id);
    expect(ids).toContain('warfarin_effect');
    expect(ids).toContain('dic');
  });
  test('fără medicație, comportamentul rămâne neschimbat (insuf. hepatică)', () => {
    const r = interpretLabValues({ ...N, pt: 20, aptt: 50 }, noMeds);
    expect(r.diagnoses[0]?.id).toBe('liver_failure');
  });
});

describe('FIX #2 — severitatea factorului dominant', () => {
  test('hemofilie A severă (aPTT 90) → FVIII estimat sub 10% (era ~18%)', () => {
    const r = calculateFactorConcentrations({ ...N, aptt: 90, mixingTest: 'corrects' }, noMeds);
    expect(r.concentrations['F8'].activityPercent).toBeLessThan(10);
  });
});

describe('FIX #3 — maparea factor-test pentru TT', () => {
  test('TT depinde DOAR de fibrinogen (fără protrombină F2)', () => {
    expect(LAB_FACTOR_MAPPING.tt).toEqual(['FBG']);
    expect(LAB_FACTOR_MAPPING.tt).not.toContain('F2');
  });
});

describe('FIX #4 — fibrinogen scăzut izolat', () => {
  test('fibrinogen 140 cu PT/aPTT normale → hipofibrinogenemie, NU profil normal', () => {
    const r = interpretLabValues({ ...N, fibrinogen: 140 }, noMeds);
    expect(r.pattern).not.toContain('normal');
    expect(r.diagnoses.some(d => d.id === 'hypofibrinogenemia' || d.id === 'afibrinogenemia')).toBe(true);
  });
  test('fibrinogen 30 izolat → afibrinogenemie + avertisment', () => {
    const r = interpretLabValues({ ...N, fibrinogen: 30 }, noMeds);
    expect(r.diagnoses.some(d => d.id === 'afibrinogenemia')).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  test('fibrinogen normal rămâne profil normal', () => {
    const r = interpretLabValues({ ...N }, noMeds);
    expect(r.pattern).toContain('normal');
    expect(r.diagnoses).toHaveLength(0);
  });
});
