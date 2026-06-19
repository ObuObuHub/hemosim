/**
 * LITERATURE VALIDATION SUITE
 * Coagulograme publicate (valori reprezentative din literatura standard) rulate prin motorul HemoSim.
 * Surse de pattern: Hoffman Hematology 7th ed; Williams Hematology 10th ed;
 *   ISTH overt-DIC score (Taylor FB et al, Thromb Haemost 2001);
 *   4T score (Lo GK et al, J Thromb Haemost 2006);
 *   BCSH guidelines; Marlar RA mixing-study guidance (Rosner index).
 */
import { interpretLabValues } from '@/engine/interpreter';
import { calculateFactorConcentrations } from '@/engine/inverse-mapping';
import { calculateINRFromPT } from '@/engine/coagulation';
import { LabInput, MedicationContext, Hit4TCriteria } from '@/types';

const N: LabInput = {
  pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300,
  platelets: 250, dDimers: 200, bleedingTime: 5, mixingTest: 'not_performed',
};
const noMeds: MedicationContext = {
  warfarin: false, heparin: false, lmwh: false, doacXa: false, doacIIa: false, antiplatelet: false,
};

interface Case {
  name: string;
  src: string;
  lab: Partial<LabInput>;
  meds?: Partial<MedicationContext>;
  hit4T?: Hit4TCriteria;
  expectId: string;          // diagnosis id that MUST be present
  expectTop?: boolean;       // must be the #1 diagnosis
}

const CASES: Case[] = [
  { name: 'Hemofilie A severă (FVIII<1%)', src: 'Hoffman ch.137',
    lab: { aptt: 90, mixingTest: 'corrects' }, expectId: 'hemophilia_a', expectTop: true },
  { name: 'Hemofilie B (FIX)', src: 'Williams ch.123',
    lab: { aptt: 80, mixingTest: 'corrects' }, expectId: 'hemophilia_b' },
  { name: 'Anticoagulant lupic / APS', src: 'ISTH LA guidance 2009',
    lab: { aptt: 62, mixingTest: 'does_not_correct' }, expectId: 'lupus_anticoagulant', expectTop: true },
  { name: 'Hemofilie dobândită (inhibitor FVIII)', src: 'Williams ch.124',
    lab: { aptt: 70, mixingTest: 'does_not_correct' }, expectId: 'acquired_hemophilia' },
  { name: 'Deficit Factor VII (izolat)', src: 'Hoffman ch.138',
    lab: { pt: 24 }, expectId: 'f7_deficiency', expectTop: true },
  { name: 'Warfarină terapeutică (INR~2.5)', src: 'AC Forum / CHEST',
    lab: { pt: 30, aptt: 36 }, meds: { warfarin: true }, expectId: 'warfarin_effect', expectTop: true },
  { name: 'Insuficiență hepatică (ciroză)', src: 'Williams ch.129',
    lab: { pt: 18, aptt: 45, fibrinogen: 230, platelets: 130 }, expectId: 'liver_failure', expectTop: true },
  { name: 'Deficit vitamina K (stabilit)', src: 'Hoffman ch.126',
    lab: { pt: 30, aptt: 50 }, expectId: 'vitk_deficiency' },
  { name: 'CID manifest (overt)', src: 'ISTH 2001 (Taylor)',
    lab: { pt: 28, aptt: 65, fibrinogen: 60, platelets: 25, dDimers: 6000 }, expectId: 'dic', expectTop: true },
  { name: 'Afibrinogenemie congenitală', src: 'Williams ch.126',
    lab: { pt: 30, aptt: 60, tt: 60, fibrinogen: 30 }, expectId: 'afibrinogenemia', expectTop: true },
  { name: 'Boala von Willebrand tip 1', src: 'ASH-ISTH vWD 2021',
    lab: { bleedingTime: 12, aptt: 38 }, expectId: 'vwd', expectTop: true },
  { name: 'Heparină UFH terapeutică', src: 'CHEST antithrombotic',
    lab: { aptt: 70 }, meds: { heparin: true }, expectId: 'heparin_effect', expectTop: true },
  { name: 'Rivaroxaban (DOAC anti-Xa)', src: 'EHA/ISTH DOAC labs',
    lab: { pt: 16 }, meds: { doacXa: true }, expectId: 'doac_xa_effect', expectTop: true },
  { name: 'Dabigatran (DOAC anti-IIa)', src: 'EHA/ISTH DOAC labs',
    lab: { tt: 38 }, meds: { doacIIa: true }, expectId: 'dabigatran_effect', expectTop: true },
  { name: 'HIT (trombocitopenie indusă heparină)', src: 'Lo 2006 4T',
    lab: { platelets: 80 }, meds: { heparin: true }, hit4T: { thrombocytopenia: 2, timing: 2, thrombosis: 1, otherCauses: 2 }, expectId: 'thrombocytopenia' },
  { name: 'PTI (trombocitopenie imună severă)', src: 'ASH ITP 2019',
    lab: { platelets: 15 }, expectId: 'itp' },
];

function pad(s: string, n: number) { return (s + ' '.repeat(n)).slice(0, n); }

describe('Literature coagulogram validation', () => {
  const rows: string[] = [];
  const header = `${pad('Caz', 38)}| ${pad('PT', 4)}${pad('aPTT', 6)}${pad('TT', 4)}${pad('Fib', 5)}${pad('Plt', 5)}| ${pad('Pattern motor', 26)}| ${pad('Top dx', 22)}| ${pad('Așteptat', 20)}| OK`;

  CASES.forEach((c) => {
    test(c.name, () => {
      const lab = { ...N, ...c.lab };
      if (c.lab.pt && !c.lab.inr) lab.inr = calculateINRFromPT(lab.pt);
      const meds = { ...noMeds, ...(c.meds || {}) };
      const r = interpretLabValues(lab, meds, c.hit4T);
      const ids = r.diagnoses.map(d => d.id);
      const present = ids.includes(c.expectId);
      const topOk = c.expectTop ? r.diagnoses[0]?.id === c.expectId : true;
      const ok = present && topOk;
      const top = r.diagnoses[0]?.name ?? '(niciunul)';
      rows.push(
        `${pad(c.name, 38)}| ${pad(String(lab.pt), 4)}${pad(String(lab.aptt), 6)}${pad(String(lab.tt), 4)}${pad(String(lab.fibrinogen), 5)}${pad(String(lab.platelets), 5)}| ` +
        `${pad(r.pattern, 26)}| ${pad(top, 22)}| ${pad(c.expectId, 20)}| ${ok ? '✓' : '✗'}`
      );
      expect(present).toBe(true);
      if (c.expectTop) expect(r.diagnoses[0]?.id).toBe(c.expectId);
    });
  });

  afterAll(() => {
     
    console.log('\n================ TABEL VALIDARE LITERATURĂ ================\n' + header + '\n' + '-'.repeat(header.length) + '\n' + rows.join('\n') + '\n');

    // Demonstrație inverse-mapping: estimarea FVIII pentru hemofilie A severă (aPTT 90)
    const hemoA = calculateFactorConcentrations({ ...N, aptt: 90, mixingTest: 'corrects' }, noMeds);
     
    console.log('Inverse-map hemofilie A severă (aPTT 90s): FVIII estimat = ' +
      hemoA.concentrations['F8'].activityPercent.toFixed(0) + '% (literatura: <1% în forma severă)\n');
  });
});
