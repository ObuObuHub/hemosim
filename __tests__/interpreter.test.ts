import { calculateISTHScore, calculate4TScore, interpretLabValues } from '@/engine/interpreter';
import { LabInput, MedicationContext, Hit4TCriteria } from '@/types';

// Default lab values (normal)
const normalLab: LabInput = {
  pt: 12,
  inr: 1.0,
  aptt: 30,
  tt: 16,
  fibrinogen: 300,
  platelets: 250,
  dDimers: 200,
  bleedingTime: 5,
  mixingTest: 'not_performed',
};

// Default medications (none)
const noMeds: MedicationContext = {
  warfarin: false,
  heparin: false,
  lmwh: false,
  doacXa: false,
  doacIIa: false,
  antiplatelet: false,
};

describe('calculateISTHScore', () => {
  test('returns 0 for normal values', () => {
    const score = calculateISTHScore(normalLab);
    expect(score.total).toBe(0);
    expect(score.platelets).toBe(0);
    expect(score.dDimers).toBe(0);
    expect(score.pt).toBe(0);
    expect(score.fibrinogen).toBe(0);
    expect(score.interpretation).toContain('puțin probabil');
  });

  test('scores platelets correctly', () => {
    // >100 = 0
    expect(calculateISTHScore({ ...normalLab, platelets: 150 }).platelets).toBe(0);
    // 50-100 = 1
    expect(calculateISTHScore({ ...normalLab, platelets: 75 }).platelets).toBe(1);
    expect(calculateISTHScore({ ...normalLab, platelets: 100 }).platelets).toBe(1);
    expect(calculateISTHScore({ ...normalLab, platelets: 50 }).platelets).toBe(1);
    // <50 = 2
    expect(calculateISTHScore({ ...normalLab, platelets: 49 }).platelets).toBe(2);
    expect(calculateISTHScore({ ...normalLab, platelets: 20 }).platelets).toBe(2);
  });

  test('scores D-dimers correctly', () => {
    // <500 = 0
    expect(calculateISTHScore({ ...normalLab, dDimers: 200 }).dDimers).toBe(0);
    expect(calculateISTHScore({ ...normalLab, dDimers: 499 }).dDimers).toBe(0);
    // 500-2000 = 2
    expect(calculateISTHScore({ ...normalLab, dDimers: 500 }).dDimers).toBe(2);
    expect(calculateISTHScore({ ...normalLab, dDimers: 1500 }).dDimers).toBe(2);
    expect(calculateISTHScore({ ...normalLab, dDimers: 2000 }).dDimers).toBe(2);
    // >2000 = 3
    expect(calculateISTHScore({ ...normalLab, dDimers: 2001 }).dDimers).toBe(3);
    expect(calculateISTHScore({ ...normalLab, dDimers: 6000 }).dDimers).toBe(3);
  });

  test('scores PT prolongation correctly', () => {
    // <3s above normal = 0
    expect(calculateISTHScore({ ...normalLab, pt: 12 }).pt).toBe(0);
    expect(calculateISTHScore({ ...normalLab, pt: 14 }).pt).toBe(0);
    // 3-6s = 1
    expect(calculateISTHScore({ ...normalLab, pt: 15 }).pt).toBe(1);
    expect(calculateISTHScore({ ...normalLab, pt: 18 }).pt).toBe(1);
    // >6s = 2
    expect(calculateISTHScore({ ...normalLab, pt: 19 }).pt).toBe(2);
    expect(calculateISTHScore({ ...normalLab, pt: 28 }).pt).toBe(2);
  });

  test('scores fibrinogen correctly', () => {
    // >100 = 0
    expect(calculateISTHScore({ ...normalLab, fibrinogen: 300 }).fibrinogen).toBe(0);
    expect(calculateISTHScore({ ...normalLab, fibrinogen: 101 }).fibrinogen).toBe(0);
    // ≤100 = 1
    expect(calculateISTHScore({ ...normalLab, fibrinogen: 100 }).fibrinogen).toBe(1);
    expect(calculateISTHScore({ ...normalLab, fibrinogen: 50 }).fibrinogen).toBe(1);
  });

  test('returns overt DIC interpretation for score ≥5', () => {
    const dicLab: LabInput = {
      ...normalLab,
      pt: 28,          // 2 points
      platelets: 30,   // 2 points
      dDimers: 6000,   // 3 points
      fibrinogen: 60,  // 1 point
    };
    const score = calculateISTHScore(dicLab);
    expect(score.total).toBe(8);
    expect(score.interpretation).toContain('CID MANIFEST');
  });

  test('returns possible DIC for score 3-4', () => {
    const partialDicLab: LabInput = {
      ...normalLab,
      platelets: 75,   // 1 point
      dDimers: 1500,   // 2 points
    };
    const score = calculateISTHScore(partialDicLab);
    expect(score.total).toBe(3);
    expect(score.interpretation).toContain('Posibil CID');
  });
});

describe('calculate4TScore', () => {
  test('returns low probability for score 0-3', () => {
    const criteria: Hit4TCriteria = {
      thrombocytopenia: 0,
      timing: 0,
      thrombosis: 0,
      otherCauses: 0,
    };
    const score = calculate4TScore(criteria);
    expect(score.total).toBe(0);
    expect(score.probability).toBe('low');
    expect(score.interpretation).toContain('scăzută');
  });

  test('returns intermediate probability for score 4-5', () => {
    const criteria: Hit4TCriteria = {
      thrombocytopenia: 1,
      timing: 1,
      thrombosis: 1,
      otherCauses: 1,
    };
    const score = calculate4TScore(criteria);
    expect(score.total).toBe(4);
    expect(score.probability).toBe('intermediate');
    expect(score.interpretation).toContain('intermediară');
  });

  test('returns high probability for score 6-8', () => {
    const criteria: Hit4TCriteria = {
      thrombocytopenia: 2,
      timing: 2,
      thrombosis: 2,
      otherCauses: 2,
    };
    const score = calculate4TScore(criteria);
    expect(score.total).toBe(8);
    expect(score.probability).toBe('high');
    expect(score.interpretation).toContain('RIDICATĂ');
    expect(score.interpretation).toContain('consultați urgent');
  });

  test('correctly returns individual criteria scores', () => {
    const criteria: Hit4TCriteria = {
      thrombocytopenia: 2,
      timing: 1,
      thrombosis: 0,
      otherCauses: 2,
    };
    const score = calculate4TScore(criteria);
    expect(score.thrombocytopenia).toBe(2);
    expect(score.timing).toBe(1);
    expect(score.thrombosis).toBe(0);
    expect(score.otherCauses).toBe(2);
    expect(score.total).toBe(5);
  });
});

describe('interpretLabValues', () => {
  describe('Normal profile', () => {
    test('identifies normal coagulation profile', () => {
      const result = interpretLabValues(normalLab, noMeds);
      expect(result.pattern).toContain('normal');
      expect(result.affectedPathway).toBe('none');
      expect(result.diagnoses).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Isolated aPTT prolongation (intrinsic pathway)', () => {
    const intrinsicLab: LabInput = { ...normalLab, aptt: 65 };

    test('identifies intrinsic pathway disorder', () => {
      const result = interpretLabValues(intrinsicLab, noMeds);
      expect(result.pattern).toContain('aPTT');
      expect(result.affectedPathway).toBe('intrinsic');
    });

    test('suggests hemophilia when mixing test not performed', () => {
      const result = interpretLabValues(intrinsicLab, noMeds);
      const diagnoses = result.diagnoses.map(d => d.id);
      expect(diagnoses).toContain('hemophilia_a');
      expect(diagnoses).toContain('hemophilia_b');
      expect(diagnoses).toContain('vwd');
    });

    test('identifies heparin effect when heparin is used', () => {
      const result = interpretLabValues(intrinsicLab, { ...noMeds, heparin: true });
      expect(result.diagnoses[0].id).toBe('heparin_effect');
    });

    test('narrows to factor deficiency when mixing test corrects', () => {
      const labWithMixing: LabInput = { ...intrinsicLab, mixingTest: 'corrects' };
      const result = interpretLabValues(labWithMixing, noMeds);
      const diagnoses = result.diagnoses.map(d => d.id);
      expect(diagnoses).toContain('hemophilia_a');
      expect(diagnoses).not.toContain('lupus_anticoagulant');
      expect(result.recommendations).toContainEqual(expect.stringContaining('CORECTEAZĂ'));
    });

    test('identifies inhibitor when mixing test does not correct', () => {
      const labWithMixing: LabInput = { ...intrinsicLab, mixingTest: 'does_not_correct' };
      const result = interpretLabValues(labWithMixing, noMeds);
      const diagnoses = result.diagnoses.map(d => d.id);
      expect(diagnoses).toContain('lupus_anticoagulant');
      expect(diagnoses).toContain('acquired_hemophilia');
      expect(result.warnings).toContainEqual(expect.stringContaining('NU CORECTEAZĂ'));
    });
  });

  describe('Isolated PT prolongation (extrinsic pathway)', () => {
    const extrinsicLab: LabInput = { ...normalLab, pt: 24 };

    test('identifies extrinsic pathway disorder', () => {
      const result = interpretLabValues(extrinsicLab, noMeds);
      expect(result.pattern).toContain('PT');
      expect(result.affectedPathway).toBe('extrinsic');
    });

    test('suggests Factor VII deficiency or early liver/vit K issues', () => {
      const result = interpretLabValues(extrinsicLab, noMeds);
      const diagnoses = result.diagnoses.map(d => d.id);
      expect(diagnoses).toContain('f7_deficiency');
      expect(diagnoses).toContain('early_liver');
      expect(diagnoses).toContain('early_vitk');
    });

    test('identifies warfarin effect when warfarin is used', () => {
      const result = interpretLabValues(extrinsicLab, { ...noMeds, warfarin: true });
      expect(result.diagnoses[0].id).toBe('warfarin_effect');
    });

    test('warns about high PT under warfarin', () => {
      const highPTLab: LabInput = { ...normalLab, pt: 28 };
      const result = interpretLabValues(highPTLab, { ...noMeds, warfarin: true });
      expect(result.warnings).toContainEqual(expect.stringContaining('PT >25'));
    });

    test('identifies DOAC Xa effect when doacXa is used', () => {
      const result = interpretLabValues(extrinsicLab, { ...noMeds, doacXa: true });
      expect(result.diagnoses[0].id).toBe('doac_xa_effect');
    });

    test('identifies DOAC IIa effect when doacIIa is used', () => {
      const result = interpretLabValues(extrinsicLab, { ...noMeds, doacIIa: true });
      expect(result.diagnoses[0].id).toBe('doac_iia_effect');
    });
  });

  describe('Both PT and aPTT prolonged (common pathway)', () => {
    const commonLab: LabInput = { ...normalLab, pt: 20, aptt: 50 };

    test('identifies common pathway disorder', () => {
      const result = interpretLabValues(commonLab, noMeds);
      expect(result.pattern).toContain('PT și aPTT');
      expect(result.affectedPathway).toBe('common');
    });

    test('suggests liver failure or vitamin K deficiency', () => {
      const result = interpretLabValues(commonLab, noMeds);
      const diagnoses = result.diagnoses.map(d => d.id);
      expect(diagnoses).toContain('liver_failure');
      expect(diagnoses).toContain('vitk_deficiency');
    });

    test('calculates ISTH score and diagnoses DIC when criteria met', () => {
      const dicLab: LabInput = {
        ...normalLab,
        pt: 28,
        aptt: 65,
        fibrinogen: 60,
        platelets: 25,
        dDimers: 6000,
      };
      const result = interpretLabValues(dicLab, noMeds);
      expect(result.isthScore).toBeDefined();
      expect(result.isthScore!.total).toBeGreaterThanOrEqual(5);
      expect(result.diagnoses[0].id).toBe('dic');
      // CID info is now in diagnosis description, not in warnings
      expect(result.diagnoses[0].description).toContain('ISTH');
    });
  });

  describe('Platelet disorders', () => {
    test('identifies thrombocytopenia', () => {
      const lowPltLab: LabInput = { ...normalLab, platelets: 40 };
      const result = interpretLabValues(lowPltLab, noMeds);
      expect(result.affectedPathway).toBe('platelet');
      expect(result.diagnoses[0].id).toBe('thrombocytopenia');
    });

    test('identifies critically low platelets in diagnosis', () => {
      const criticalPltLab: LabInput = { ...normalLab, platelets: 15 };
      const result = interpretLabValues(criticalPltLab, noMeds);
      // Critical platelet info is now in diagnosis description, not in warnings
      expect(result.diagnoses[0].name).toContain('Critică');
    });

    test('identifies platelet dysfunction with prolonged bleeding time', () => {
      const btLab: LabInput = { ...normalLab, bleedingTime: 12 };
      const result = interpretLabValues(btLab, noMeds);
      expect(result.affectedPathway).toBe('platelet');
      const diagnoses = result.diagnoses.map(d => d.id);
      expect(diagnoses).toContain('platelet_dysfunction');
    });

    test('identifies antiplatelet effect when antiplatelet is used', () => {
      const btLab: LabInput = { ...normalLab, bleedingTime: 12 };
      const result = interpretLabValues(btLab, { ...noMeds, antiplatelet: true });
      expect(result.diagnoses[0].id).toBe('antiplatelet_effect');
    });
  });

  describe('D-dimer elevation and thrombophilia', () => {
    test('suggests thrombosis workup for isolated D-dimer elevation', () => {
      const dDimerLab: LabInput = { ...normalLab, dDimers: 1500 };
      const result = interpretLabValues(dDimerLab, noMeds);
      const diagnoses = result.diagnoses.map(d => d.id);
      expect(diagnoses).toContain('thrombosis');
      // Also suggests non-thrombotic causes (more common)
      expect(diagnoses).toContain('infection_inflammation');
    });
  });

  describe('Isolated TT prolongation', () => {
    test('suggests dysfibrinogenemia', () => {
      const ttLab: LabInput = { ...normalLab, tt: 30 };
      const result = interpretLabValues(ttLab, noMeds);
      expect(result.diagnoses[0].id).toBe('dysfibrinogenemia');
    });

    test('identifies heparin effect on TT', () => {
      const ttLab: LabInput = { ...normalLab, tt: 30 };
      const result = interpretLabValues(ttLab, { ...noMeds, heparin: true });
      expect(result.diagnoses[0].id).toBe('heparin_tt');
    });

    test('identifies dabigatran effect on TT', () => {
      const ttLab: LabInput = { ...normalLab, tt: 30 };
      const result = interpretLabValues(ttLab, { ...noMeds, doacIIa: true });
      expect(result.diagnoses[0].id).toBe('dabigatran_effect');
    });
  });

  describe('HIT (Heparin-Induced Thrombocytopenia)', () => {
    test('calculates 4T score when heparin used with low platelets', () => {
      const hitLab: LabInput = { ...normalLab, platelets: 80 };
      const hit4TCriteria: Hit4TCriteria = {
        thrombocytopenia: 2,
        timing: 2,
        thrombosis: 1,
        otherCauses: 2,
      };
      const result = interpretLabValues(hitLab, { ...noMeds, heparin: true }, hit4TCriteria);
      expect(result.hit4TScore).toBeDefined();
      expect(result.hit4TScore!.total).toBe(7);
      expect(result.hit4TScore!.probability).toBe('high');
    });

    test('warns urgently about high probability HIT', () => {
      const hitLab: LabInput = { ...normalLab, platelets: 80 };
      const hit4TCriteria: Hit4TCriteria = {
        thrombocytopenia: 2,
        timing: 2,
        thrombosis: 2,
        otherCauses: 2,
      };
      const result = interpretLabValues(hitLab, { ...noMeds, heparin: true }, hit4TCriteria);
      expect(result.warnings).toContainEqual(expect.stringContaining('trombocitopenie indusă de heparină'));
      expect(result.warnings).toContainEqual(expect.stringContaining('URGENT'));
    });
  });
});
