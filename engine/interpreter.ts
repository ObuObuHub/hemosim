import { LabInput, MedicationContext, ClinicalInterpretation, Diagnosis, Factor, ISTHScore, ISTHManualCriteria, Hit4TCriteria, Hit4TScore } from '@/types';
import { LAB_RANGES } from './coagulation';
import { calculateFactorConcentrations } from './inverse-mapping';

// Mapare scenariu → factori afectați (pentru educație)
// Când un scenariu este selectat, acești factori sunt evidențiați în loc de diagnosticul diferențial
const SCENARIO_AFFECTED_FACTORS: Record<string, string[]> = {
  // Coagulopatii congenitale
  'Hemofilie A': ['F8'],
  'Hemofilie B': ['F9'],
  'Hemofilie C': ['F11'],  // Deficit Factor XI - sângerare variabilă
  'Deficit Factor XII': ['F12'],  // aPTT prelungit izolat, FĂRĂ risc de sângerare
  'Boala von Willebrand': ['vWF', 'F8'],
  'Purpura Trombocitopenică': ['PLT'],
  // Deficite dobândite
  'Deficit Vitamina K': ['F2', 'F7', 'F9', 'F10', 'PC', 'PS'],  // Vit K dependenți (PC, PS = anticoagulanți)
  'Insuficiență Hepatică': ['F2', 'F5', 'F7', 'F9', 'F10', 'F11', 'F12', 'F13', 'FBG', 'AT', 'PC'],  // Toți factorii produși în ficat (FĂRĂ F8!)
  // Trombofilie (nu deficit, ci hipercoagulabilitate)
  'Sindrom Antifosfolipidic': [],
  'Trombofilie': [],
  // CID - progresie fazică
  'CID - Faza Activare': ['FBG', 'PLT'],  // Consum incipient
  'CID - Faza Consum': ['F2', 'F5', 'F8', 'F10', 'FBG', 'PLT'],
  'CID - Faza Hemoragică': ['F2', 'F5', 'F8', 'F10', 'FBG', 'PLT'],
  // Anticoagulante
  'AVK/Warfarină': ['F2', 'F7', 'F9', 'F10', 'PC', 'PS'],  // Vitamina K dependenți (inclusiv anticoagulanți)
  'Heparină UFH': ['IIa', 'F10a'],  // Potențează AT → inhibă IIa și Xa
  'LMWH': ['F10a'],  // Predominant anti-Xa
  'DOAC anti-Xa': ['F10a'],  // Rivaroxaban, Apixaban, Edoxaban
  'DOAC anti-IIa': ['IIa'],  // Dabigatran
  'Antiagregant': ['PLT'],  // Aspirină, Clopidogrel - inhibă funcția trombocitară
};

type LabStatus = 'normal' | 'high' | 'low' | 'critical';

function getStatus(value: number, key: keyof typeof LAB_RANGES): LabStatus {
  const range = LAB_RANGES[key];
  if (range.criticalLow !== undefined && value < range.criticalLow) return 'critical';
  if (range.criticalHigh !== undefined && value > range.criticalHigh) return 'critical';
  if (value < range.min) return 'low';
  if (value > range.max) return 'high';
  return 'normal';
}

export function calculateISTHScore(lab: LabInput): ISTHScore {
  // Platelet count (×10³/µL)
  // >100 = 0, 50-100 = 1, <50 = 2
  let pltScore = 0;
  if (lab.platelets < 50) pltScore = 2;
  else if (lab.platelets <= 100) pltScore = 1;

  // D-dimer elevation
  // Normal (<500) = 0, Moderate (500-2000) = 2, Strong (>2000) = 3
  let dDimerScore = 0;
  if (lab.dDimers > 2000) dDimerScore = 3;
  else if (lab.dDimers >= 500) dDimerScore = 2;

  // PT prolongation (seconds above normal ~12s)
  // <3s = 0, 3-6s = 1, >6s = 2
  const ptProlongation = lab.pt - 12;
  let ptScore = 0;
  if (ptProlongation > 6) ptScore = 2;
  else if (ptProlongation >= 3) ptScore = 1;

  // Fibrinogen (mg/dL)
  // >100 = 0, ≤100 = 1
  let fibScore = 0;
  if (lab.fibrinogen <= 100) fibScore = 1;

  const total = pltScore + dDimerScore + ptScore + fibScore;

  let interpretation = '';
  if (total >= 5) {
    interpretation = 'CID MANIFEST (overt DIC)';
  } else if (total >= 3) {
    interpretation = 'Posibil CID non-manifest - repetă la 24-48h';
  } else {
    interpretation = 'CID puțin probabil';
  }

  return {
    total,
    platelets: pltScore,
    dDimers: dDimerScore,
    pt: ptScore,
    fibrinogen: fibScore,
    interpretation,
  };
}

/** Calculates ISTH DIC score from manual criteria input */
export function calculateManualISTHScore(criteria: ISTHManualCriteria): ISTHScore {
  const total = criteria.plateletCount + criteria.dDimerLevel + criteria.ptProlongation + criteria.fibrinogenLevel;

  let interpretation = '';
  if (total >= 5) {
    interpretation = 'CID MANIFEST (overt DIC)';
  } else if (total >= 3) {
    interpretation = 'Posibil CID non-manifest - repetă la 24-48h';
  } else {
    interpretation = 'CID puțin probabil';
  }

  return {
    total,
    platelets: criteria.plateletCount,
    dDimers: criteria.dDimerLevel,
    pt: criteria.ptProlongation,
    fibrinogen: criteria.fibrinogenLevel,
    interpretation,
  };
}

/** Determines if the ISTH calculator should be shown based on lab pattern */
export function shouldShowISTHCalculator(lab: LabInput, meds: MedicationContext): boolean {
  const ptStatus = getStatus(lab.pt, 'pt');
  const apttStatus = getStatus(lab.aptt, 'aptt');
  const fibStatus = getStatus(lab.fibrinogen, 'fibrinogen');
  const pltStatus = getStatus(lab.platelets, 'platelets');
  const dDimerStatus = getStatus(lab.dDimers, 'dDimers');

  const ptHigh = ptStatus === 'high' || ptStatus === 'critical';
  const apttHigh = apttStatus === 'high' || apttStatus === 'critical';
  const fibLow = fibStatus === 'low' || fibStatus === 'critical';
  const pltLow = pltStatus === 'low' || pltStatus === 'critical';
  const dDimerHigh = dDimerStatus === 'high' || dDimerStatus === 'critical';

  // Exclude warfarin/anticoagulants which cause similar PT patterns
  if (meds.warfarin || meds.doacXa || meds.doacIIa) return false;

  const hasCoagAbnormality = ptHigh || apttHigh;
  const hasConsumption = pltLow || fibLow;

  // CID suspicion patterns:
  // 1. PT/aPTT↑ + PLT↓ + Fibrinogen↓ (triada clasica - chiar fara D-dimeri)
  // 2. PT/aPTT↑ + (PLT↓ SAU Fibrinogen↓) + D-dimeri↑
  const classicTriad = hasCoagAbnormality && pltLow && fibLow;
  const withDDimers = hasCoagAbnormality && hasConsumption && dDimerHigh;

  return classicTriad || withDDimers;
}

/** Determines if the 4T calculator for heparin-induced thrombocytopenia should be shown */
export function shouldShowHIT4TCalculator(meds: MedicationContext, lab: LabInput): boolean {
  // Show when heparin/LMWH active and platelets < 150
  return (meds.heparin || meds.lmwh) && lab.platelets < 150;
}

export function calculate4TScore(criteria: Hit4TCriteria): Hit4TScore {
  const total = criteria.thrombocytopenia + criteria.timing + criteria.thrombosis + criteria.otherCauses;

  let probability: 'low' | 'intermediate' | 'high';
  let interpretation: string;

  if (total <= 3) {
    probability = 'low';
    interpretation = 'Probabilitate scăzută (<5%) - trombocitopenia indusă de heparină puțin probabilă';
  } else if (total <= 5) {
    probability = 'intermediate';
    interpretation = 'Probabilitate intermediară (~14%) - testează anticorpi anti-PF4/heparină';
  } else {
    probability = 'high';
    interpretation = 'Probabilitate RIDICATĂ (~64%) - consultați urgent specialistul';
  }

  return {
    total,
    thrombocytopenia: criteria.thrombocytopenia,
    timing: criteria.timing,
    thrombosis: criteria.thrombosis,
    otherCauses: criteria.otherCauses,
    probability,
    interpretation,
  };
}

export function interpretLabValues(
  lab: LabInput,
  meds: MedicationContext,
  hit4TCriteria?: Hit4TCriteria
): ClinicalInterpretation {
  const ptStatus = getStatus(lab.pt, 'pt');
  const apttStatus = getStatus(lab.aptt, 'aptt');
  const ttStatus = getStatus(lab.tt, 'tt');
  const fibStatus = getStatus(lab.fibrinogen, 'fibrinogen');
  const pltStatus = getStatus(lab.platelets, 'platelets');
  const dDimerStatus = getStatus(lab.dDimers, 'dDimers');
  const btStatus = getStatus(lab.bleedingTime, 'bleedingTime');

  const ptHigh = ptStatus === 'high' || ptStatus === 'critical';
  const apttHigh = apttStatus === 'high' || apttStatus === 'critical';
  const ttHigh = ttStatus === 'high' || ttStatus === 'critical';
  const fibLow = fibStatus === 'low' || fibStatus === 'critical';
  const pltLow = pltStatus === 'low' || pltStatus === 'critical';
  const dDimerHigh = dDimerStatus === 'high' || dDimerStatus === 'critical';
  const btHigh = btStatus === 'high' || btStatus === 'critical';

  const diagnoses: Diagnosis[] = [];
  const recommendations: string[] = [];
  const warnings: string[] = [];
  let pattern = '';
  let affectedPathway: ClinicalInterpretation['affectedPathway'] = 'none';
  let isthScore: ISTHScore | undefined;
  let hit4TScore: Hit4TScore | undefined;

  // Calculate 4T score for heparin-induced thrombocytopenia when heparin is used and platelets are low
  if ((meds.heparin || meds.lmwh) && pltLow && hit4TCriteria) {
    hit4TScore = calculate4TScore(hit4TCriteria);
    if (hit4TScore.probability === 'high') {
      warnings.push(`ATENȚIE: Scor 4T = ${hit4TScore.total}/8 - Probabilitate ridicată de trombocitopenie indusă de heparină. URGENT!`);
    } else if (hit4TScore.probability === 'intermediate') {
      warnings.push(`Suspiciune trombocitopenie indusă de heparină: Scor 4T = ${hit4TScore.total}/8 - Testează anti-PF4`);
    }
  }

  // INR >= 6 = Plasmă incoagulabilă - urgență hemoragică
  if (lab.inr >= 6) {
    warnings.push(`URGENȚĂ: INR ${lab.inr} - PLASMĂ INCOAGULABILĂ! Risc hemoragic major.`);
  }

  // Pattern recognition
  // Only classify as normal if ALL standard tests are normal (including bleeding time and D-dimer)
  if (ptStatus === 'normal' && apttStatus === 'normal' && pltStatus === 'normal' && !btHigh && !dDimerHigh) {
    pattern = 'Profil de coagulare normal';
    affectedPathway = 'none';
  }
  // Isolated aPTT prolongation
  else if (apttHigh && !ptHigh) {
    pattern = 'aPTT izolat prelungit';
    affectedPathway = 'intrinsic';

    if (meds.heparin) {
      diagnoses.push({
        id: 'heparin_effect',
        name: 'Efect Heparină',
        probability: 'high',
        description: 'aPTT prelungit consistent cu terapia heparinică.',
        affectedFactors: ['F2', 'F10'],
        suggestedTests: ['Anti-Xa pentru monitorizare'],
      });
    } else if (lab.mixingTest === 'corrects') {
      // Mixing test CORRECTS = Factor deficiency (not inhibitor)
      // Use bleeding time to differentiate: vWD typically has prolonged TS
      const tsHigh = getStatus(lab.bleedingTime, 'bleedingTime') === 'high' || getStatus(lab.bleedingTime, 'bleedingTime') === 'critical';

      if (tsHigh) {
        // Prolonged TS + aPTT suggests vWD
        diagnoses.push({
          id: 'vwd',
          name: 'Boala von Willebrand',
          probability: 'high',
          description: 'Deficit vWF cu afectare secundară F.VIII. TS prelungit + aPTT↑ = combinație sugestivă.',
          affectedFactors: ['vWF', 'F8'],
          suggestedTests: ['vWF:Ag', 'vWF:RCo', 'vWF:CB', 'Factor VIII', 'Multimeri vWF'],
        });
        diagnoses.push({
          id: 'hemophilia_a',
          name: 'Hemofilie A',
          probability: 'moderate',
          description: 'Deficit Factor VIII. X-linked recesiv.',
          affectedFactors: ['F8'],
          suggestedTests: ['Dozare Factor VIII'],
        });
        recommendations.push('NOTĂ vWD: aPTT prelungit apare DOAR când FVIII <30-40%. Multe cazuri de vWD au aPTT NORMAL!');
      } else {
        // Normal BT + aPTT suggests isolated factor deficiency
        diagnoses.push({
          id: 'hemophilia_a',
          name: 'Hemofilie A',
          probability: 'high',
          description: 'Deficit Factor VIII. X-linked recesiv. Cea mai frecventă cauză.',
          affectedFactors: ['F8'],
          suggestedTests: ['Dozare Factor VIII'],
        });
        diagnoses.push({
          id: 'hemophilia_b',
          name: 'Hemofilie B',
          probability: 'moderate',
          description: 'Deficit Factor IX (Christmas disease). Mai rar decât Hemofilia A.',
          affectedFactors: ['F9'],
          suggestedTests: ['Dozare Factor IX'],
        });
        diagnoses.push({
          id: 'hemophilia_c',
          name: 'Hemofilie C (Deficit F.XI)',
          probability: 'low',
          description: 'Deficit Factor XI. Sângerare variabilă.',
          affectedFactors: ['F11'],
          suggestedTests: ['Dozare Factor XI'],
        });
        diagnoses.push({
          id: 'vwd',
          name: 'Boala von Willebrand',
          probability: 'low',
          description: 'Posibil tip 2N (afectează doar FVIII, nu TS).',
          affectedFactors: ['vWF', 'F8'],
          suggestedTests: ['vWF:Ag', 'vWF:RCo', 'Factor VIII'],
        });
      }
      diagnoses.push({
        id: 'f12_deficiency',
        name: 'Deficit Factor XII',
        probability: 'low',
        description: 'NU cauzează sângerare! Doar prelungire aPTT in vitro.',
        affectedFactors: ['F12'],
        suggestedTests: ['Dozare Factor XII'],
      });
      recommendations.push('Test de mixaj CORECTEAZĂ → Deficit de factor confirmat');
      recommendations.push('Dozează factorii individuali: VIII, IX, XI');
    } else if (lab.mixingTest === 'does_not_correct') {
      // Mixing test DOES NOT CORRECT = Inhibitor present
      diagnoses.push({
        id: 'lupus_anticoagulant',
        name: 'Sindrom Antifosfolipidic',
        probability: 'high',
        description: 'TROMBOFILIE! Paradox: aPTT↑ in vitro dar risc TROMBOTIC in vivo.',
        affectedFactors: ['F12'],
        suggestedTests: ['dRVVT', 'Anti-cardiolipin IgG/IgM', 'Anti-β2GP1'],
      });
      diagnoses.push({
        id: 'acquired_hemophilia',
        name: 'Hemofilie Dobândită',
        probability: 'moderate',
        description: 'Autoanticorpi anti-Factor VIII. Mai frecvent la vârstnici, postpartum, autoimun.',
        affectedFactors: ['F8'],
        suggestedTests: ['Dozare FVIII', 'Titru inhibitor Bethesda'],
      });
      diagnoses.push({
        id: 'specific_inhibitor',
        name: 'Inhibitor Specific de Factor',
        probability: 'low',
        description: 'Anticorpi împotriva unui factor specific (rar).',
        affectedFactors: [],
        suggestedTests: ['Dozare factori individuali', 'Titru inhibitor'],
      });
      warnings.push('TEST DE MIXAJ NU CORECTEAZĂ → Inhibitor prezent!');
      recommendations.push('Test de mixaj NU CORECTEAZĂ → Inhibitor confirmat');
      recommendations.push('ATENȚIE: APS = risc TROMBOTIC, nu hemoragic!');
      recommendations.push('Dacă sângerare: consideră hemofilie dobândită (anti-FVIII)');
    } else {
      // Mixing test not performed - show full differential
      diagnoses.push({
        id: 'hemophilia_a',
        name: 'Hemofilie A',
        probability: 'high',
        description: 'Deficit Factor VIII. X-linked recesiv.',
        affectedFactors: ['F8'],
        suggestedTests: ['Dozare Factor VIII', 'Test de mixaj'],
      });
      diagnoses.push({
        id: 'hemophilia_b',
        name: 'Hemofilie B',
        probability: 'moderate',
        description: 'Deficit Factor IX (Christmas disease).',
        affectedFactors: ['F9'],
        suggestedTests: ['Dozare Factor IX'],
      });
      diagnoses.push({
        id: 'hemophilia_c',
        name: 'Hemofilie C (Deficit F.XI)',
        probability: 'moderate',
        description: 'Deficit Factor XI. Sângerare variabilă.',
        affectedFactors: ['F11'],
        suggestedTests: ['Dozare Factor XI'],
      });
      diagnoses.push({
        id: 'vwd',
        name: 'Boala von Willebrand',
        probability: 'moderate',
        description: 'Deficit vWF cu afectare secundară F.VIII. aPTT poate fi ușor prelungit sau normal.',
        affectedFactors: ['vWF', 'F8'],
        suggestedTests: ['vWF:Ag', 'vWF:RCo', 'Factor VIII'],
      });
      diagnoses.push({
        id: 'f12_deficiency',
        name: 'Deficit Factor XII',
        probability: 'low',
        description: 'NU cauzează sângerare! Prelungește aPTT in vitro dar fără risc hemoragic clinic.',
        affectedFactors: ['F12'],
        suggestedTests: ['Dozare Factor XII'],
      });
      diagnoses.push({
        id: 'lupus_anticoagulant',
        name: 'Sindrom Antifosfolipidic',
        probability: 'low',
        description: 'TROMBOFILIE! Paradox: aPTT↑ in vitro dar risc TROMBOTIC in vivo.',
        affectedFactors: ['F12'],
        suggestedTests: ['Test de mixaj (nu corectează)', 'dRVVT', 'Anti-cardiolipin IgG/IgM', 'Anti-β2GP1'],
      });
      recommendations.push('Efectuează test de mixaj pentru diferențiere deficit vs inhibitor');
      recommendations.push('ATENȚIE: aPTT prelungit NU exclude trombofilie (anticoagulant lupic)');
      recommendations.push('Deficit F.XII: NU cauzează sângerare clinică - anomalie de laborator fără semnificație hemoragică.');
    }
  }
  // Isolated PT prolongation
  else if (ptHigh && !apttHigh) {
    pattern = 'PT izolat prelungit';
    affectedPathway = 'extrinsic';

    if (meds.warfarin) {
      diagnoses.push({
        id: 'warfarin_effect',
        name: 'Efect Warfarină',
        probability: 'high',
        description: 'PT prelungit consistent cu terapia AVK.',
        affectedFactors: ['F2', 'F7', 'F9', 'F10'],
        suggestedTests: ['Monitorizare PT regulată'],
      });
      if (lab.pt > 25) {
        warnings.push('PT >25s - risc hemoragic crescut sub AVK');
      }
    } else if (meds.doacXa) {
      diagnoses.push({
        id: 'doac_xa_effect',
        name: 'Efect DOAC (inhibitor Xa)',
        probability: 'high',
        description: 'Rivaroxaban/Apixaban/Edoxaban inhibă F.Xa. PT-ul nu este un indicator de încredere.',
        affectedFactors: ['F10a'],
        suggestedTests: ['Verificare timp de la ultima doză', 'Istoric dozare'],
      });
      recommendations.push('PT-ul nu este un indicator de încredere pentru anti-Xa DOAC');
    } else if (meds.doacIIa) {
      diagnoses.push({
        id: 'doac_iia_effect',
        name: 'Efect Dabigatran (inhibitor IIa)',
        probability: 'high',
        description: 'Dabigatran poate prelungi ușor PT, dar TT este mult mai sensibil.',
        affectedFactors: ['IIa'],
        suggestedTests: ['dTT (diluted TT)', 'Ecarin time', 'Verificare timp de la ultima doză'],
      });
      recommendations.push('Pentru Dabigatran, TT este mai sensibil decât PT - verifică TT');
    } else {
      diagnoses.push({
        id: 'f7_deficiency',
        name: 'Deficit Factor VII',
        probability: 'high',
        description: 'Singurul deficit care prelungește izolat PT.',
        affectedFactors: ['F7'],
        suggestedTests: ['Dozare Factor VII'],
      });
      diagnoses.push({
        id: 'early_liver',
        name: 'Insuficiență Hepatică Incipientă',
        probability: 'moderate',
        description: 'F.VII are cel mai scurt T1/2 - primul afectat.',
        affectedFactors: ['F7'],
        suggestedTests: ['Teste hepatice', 'Albumină'],
      });
      diagnoses.push({
        id: 'early_vitk',
        name: 'Deficit Vit.K Incipient',
        probability: 'moderate',
        description: 'F.VII primul afectat datorită T1/2 scurt.',
        affectedFactors: ['F7'],
        suggestedTests: ['PIVKA-II', 'Administrare Vit.K test'],
      });
    }
  }
  // Both PT and aPTT prolonged
  else if (ptHigh && apttHigh) {
    pattern = 'PT și aPTT prelungite';
    affectedPathway = 'common';

    if (fibLow && pltLow && dDimerHigh) {
      isthScore = calculateISTHScore(lab);
      diagnoses.push({
        id: 'dic',
        name: 'Coagulare Intravasculară Diseminată (CID)',
        probability: isthScore.total >= 5 ? 'high' : 'moderate',
        description: `SCOR ISTH: ${isthScore.total}/8 - ${isthScore.interpretation}`,
        affectedFactors: ['F2', 'F5', 'F8', 'F10', 'FBG', 'PLT'],
        suggestedTests: ['Frotiu periferic (schizocite)', 'Repetă scor la 24-48h'],
      });
      recommendations.push(`Scor ISTH: PLT=${isthScore.platelets} + D-dim=${isthScore.dDimers} + PT=${isthScore.pt} + Fib=${isthScore.fibrinogen} = ${isthScore.total}`);
    } else if (fibLow) {
      // Diferențiere pe baza severității fibrinogenului
      if (lab.fibrinogen < 50) {
        // Afibrinogenemie (< 50 mg/dL sau nedetectabil)
        diagnoses.push({
          id: 'afibrinogenemia',
          name: 'Afibrinogenemie',
          probability: 'high',
          description: 'Fibrinogen < 50 mg/dL - deficit sever, posibil congenital (AR).',
          affectedFactors: ['FBG'],
          suggestedTests: ['Fibrinogen antigenic', 'Screening familial', 'Analiză genetică FGA/FGB/FGG'],
        });
        diagnoses.push({
          id: 'hypofib_congenital',
          name: 'Hipofibrinogenemie Congenitală',
          probability: 'moderate',
          description: 'Deficit parțial ereditar de fibrinogen.',
          affectedFactors: ['FBG'],
          suggestedTests: ['Istoric familial', 'Fibrinogen antigenic vs funcțional'],
        });
        warnings.push('AFIBRINOGENEMIE: Risc hemoragic sever! Evaluare urgentă necesară.');
        recommendations.push('Afibrinogenemie congenitală: AR, incidență ~1:1.000.000');
      } else if (lab.fibrinogen < 100) {
        // Hipofibrinogenemie severă (50-100 mg/dL)
        diagnoses.push({
          id: 'severe_hypofib',
          name: 'Hipofibrinogenemie Severă',
          probability: 'high',
          description: 'Fibrinogen 50-100 mg/dL - deficit semnificativ clinic.',
          affectedFactors: ['FBG'],
          suggestedTests: ['Fibrinogen funcțional vs antigenic', 'TT', 'Timp reptilază'],
        });
        diagnoses.push({
          id: 'consumption',
          name: 'Coagulopatie de Consum',
          probability: 'moderate',
          description: 'Consum de fibrinogen în DIC, hemoragie masivă, sau hiperfibrinoliză.',
          affectedFactors: ['FBG'],
          suggestedTests: ['D-dimeri', 'PDF', 'Scor ISTH pentru DIC'],
        });
        warnings.push('Fibrinogen < 100 mg/dL: Risc hemoragic crescut la proceduri!');
      } else {
        // Hipofibrinogenemie moderată (100-200 mg/dL)
        diagnoses.push({
          id: 'moderate_hypofib',
          name: 'Hipofibrinogenemie Moderată',
          probability: 'high',
          description: 'Fibrinogen 100-200 mg/dL - monitorizare necesară.',
          affectedFactors: ['FBG'],
          suggestedTests: ['Fibrinogen funcțional', 'TT'],
        });
        diagnoses.push({
          id: 'liver_synthesis',
          name: 'Deficit de Sinteză Hepatică',
          probability: 'moderate',
          description: 'Ficatul sintetizează fibrinogenul - evaluare funcție hepatică.',
          affectedFactors: ['FBG'],
          suggestedTests: ['Teste hepatice', 'Albumină', 'INR'],
        });
      }
    } else {
      diagnoses.push({
        id: 'liver_failure',
        name: 'Insuficiență Hepatică',
        probability: 'high',
        description: 'Sinteză deficitară a majorității factorilor.',
        affectedFactors: ['F2', 'F5', 'F7', 'F9', 'F10', 'FBG'],
        suggestedTests: ['Teste hepatice complete', 'Factor V (nu e Vit.K dep.)'],
      });
      diagnoses.push({
        id: 'vitk_deficiency',
        name: 'Deficit Vitamina K',
        probability: 'moderate',
        description: 'Afectează F.II, VII, IX, X + Proteina C/S.',
        affectedFactors: ['F2', 'F7', 'F9', 'F10'],
        suggestedTests: ['PIVKA-II', 'Administrare Vit.K (corectează în 24-48h)'],
      });
      diagnoses.push({
        id: 'common_pathway',
        name: 'Deficit Cale Comună (F.X, V, II)',
        probability: 'moderate',
        description: 'Deficite rare ale factorilor comuni.',
        affectedFactors: ['F10', 'F5', 'F2'],
        suggestedTests: ['Dozare individuală F.X, V, II'],
      });
    }
    recommendations.push('Diferențiază hepatic vs Vit.K: dozează Factor V (normal în deficit Vit.K)');
  }
  // Platelet issues
  else if (pltLow || btHigh) {
    affectedPathway = 'platelet';

    if (pltLow) {
      // Clasificare severitate trombocitopenie
      let severity: string;
      let severityDesc: string;
      let riskLevel: string;

      if (lab.platelets < 20) {
        severity = 'Critică';
        severityDesc = `<20.000/µL - CRITICĂ`;
        riskLevel = 'Risc hemoragie spontană (SNC, GI)!';
        pattern = 'Trombocitopenie CRITICĂ (<20.000)';
      } else if (lab.platelets < 50) {
        severity = 'Severă';
        severityDesc = `<50.000/µL - SEVERĂ`;
        riskLevel = 'Risc hemoragic la proceduri și traumatisme minore.';
        pattern = 'Trombocitopenie severă (<50.000)';
      } else if (lab.platelets < 100) {
        severity = 'Moderată';
        severityDesc = `50-100.000/µL - MODERATĂ`;
        riskLevel = 'Risc la proceduri invazive. Monitorizare necesară.';
        pattern = 'Trombocitopenie moderată (50-100.000)';
      } else {
        severity = 'Ușoară';
        severityDesc = `100-150.000/µL - UȘOARĂ`;
        riskLevel = 'De obicei asimptomatică. Investigație etiologică recomandată.';
        pattern = 'Trombocitopenie ușoară (100-150.000)';
      }

      diagnoses.push({
        id: 'thrombocytopenia',
        name: `Trombocitopenie ${severity}`,
        probability: 'high',
        description: `${severityDesc}. ${riskLevel}`,
        affectedFactors: ['PLT'],
        suggestedTests: ['Frotiu periferic', 'Reticulocite', 'LDH', 'Haptoglobină'],
      });

      // Diagnostice diferențiale în funcție de severitate
      if (lab.platelets < 50) {
        // Trombocitopenie severă/critică - cauze majore
        diagnoses.push({
          id: 'itp',
          name: 'Purpură Trombocitopenică Imună',
          probability: 'high',
          description: 'Distrugere autoimună. Frotiu: trombocite mari, fără schizocite.',
          affectedFactors: ['PLT'],
          suggestedTests: ['Anticorpi antiplachetari', 'Excludere cauze secundare'],
        });
        diagnoses.push({
          id: 'ttp_hus',
          name: 'Microangiopatie Trombotică',
          probability: 'moderate',
          description: 'Purpură Trombotică Trombocitopenică sau Sindrom Hemolitic Uremic. URGENȚĂ! Pentada: trombocitopenie, anemie hemolitică, febră, afectare renală, neurologică.',
          affectedFactors: ['PLT'],
          suggestedTests: ['Frotiu (schizocite)', 'LDH↑', 'Bilirubină↑', 'ADAMTS13', 'Creatinină'],
        });
        diagnoses.push({
          id: 'bone_marrow_failure',
          name: 'Insuficiență Medulară',
          probability: 'moderate',
          description: 'Producție scăzută: aplazie, infiltrare (leucemie, metastaze), mielodisplazie.',
          affectedFactors: ['PLT'],
          suggestedTests: ['Hemogramă completă', 'Frotiu', 'Puncție medulară'],
        });
      } else {
        // Trombocitopenie ușoară/moderată - cauze frecvente
        diagnoses.push({
          id: 'drug_induced',
          name: 'Trombocitopenie Indusă Medicamentos',
          probability: 'moderate',
          description: 'Cauze frecvente: heparină (trombocitopenie indusă de heparină), chinină, antibiotice, anticonvulsivante.',
          affectedFactors: ['PLT'],
          suggestedTests: ['Istoric medicamentos', 'Cronologie (oprire medicament)'],
        });
        diagnoses.push({
          id: 'hypersplenism',
          name: 'Hipersplenism / Sechestrare',
          probability: 'moderate',
          description: 'Splenomegalie (ciroză, hipertensiune portală). Până la 90% din PLT în splină.',
          affectedFactors: ['PLT'],
          suggestedTests: ['Ecografie abdominală', 'Teste hepatice'],
        });
        diagnoses.push({
          id: 'pseudothrombocytopenia',
          name: 'Pseudotrombocitopenie',
          probability: 'low',
          description: 'Artefact EDTA - agregare in vitro. PLT real normal!',
          affectedFactors: ['PLT'],
          suggestedTests: ['Recoltare pe citrat', 'Frotiu periferic (agregate)'],
        });
      }

      recommendations.push('Frotiu periferic OBLIGATORIU: exclude pseudotrombocitopenie și microangiopatie (schizocite)');
    }
    if (btHigh && !pltLow) {
      pattern = 'Timp de sângerare prelungit (PLT normal)';
      diagnoses.push({
        id: 'vwd',
        name: 'Boala von Willebrand',
        probability: 'high',
        description: 'CEA MAI FRECVENTĂ cauză! 1:100 în populație. IMPORTANT: aPTT este NORMAL în majoritatea cazurilor (tip 1)!',
        affectedFactors: ['vWF', 'PLT'],
        suggestedTests: ['vWF:Ag', 'vWF:RCo', 'vWF:CB', 'Factor VIII', 'PFA-100'],
      });
      diagnoses.push({
        id: 'platelet_dysfunction',
        name: 'Disfuncție Plachetară Dobândită',
        probability: 'moderate',
        description: 'Uremie, ciroză, sindroame mieloproliferative, paraproteinemii.',
        affectedFactors: ['PLT'],
        suggestedTests: ['Funcție renală', 'Teste hepatice', 'Electroforeză proteine'],
      });
      diagnoses.push({
        id: 'inherited_platelet',
        name: 'Trombocitopatie Ereditară',
        probability: 'low',
        description: 'Bernard-Soulier, Glanzmann - rare. Istoric familial, debut copilărie.',
        affectedFactors: ['PLT'],
        suggestedTests: ['Agregometrie plachetară', 'Citometrie flux (GP)'],
      });
      if (meds.antiplatelet) {
        diagnoses.unshift({
          id: 'antiplatelet_effect',
          name: 'Efect Antiagregant',
          probability: 'high',
          description: 'Consistent cu medicația antiplachetară (aspirină, clopidogrel).',
          affectedFactors: ['PLT'],
          suggestedTests: ['Verificare complianță', 'Oprire 7-10 zile pre-procedural'],
        });
      }
      recommendations.push('IMPORTANT: vWD = cea mai frecventă tulburare de sângerare. aPTT NORMAL în >50% din cazuri!');
    }
  }
  // D-dimer elevation alone - MULTIPLE causes, not just thrombosis!
  else if (dDimerHigh) {
    pattern = 'D-dimeri crescuți - diagnostic diferențial larg';
    affectedPathway = 'none';

    // IMPORTANT: D-dimerii sunt NESPECIFICI - multe cauze non-trombotice
    warnings.push('ATENȚIE: D-dimerii sunt NESPECIFICI! Corelație clinică OBLIGATORIE.');

    // Cauze trombotice (necesită suspiciune clinică)
    diagnoses.push({
      id: 'thrombosis',
      name: 'Tromboembolism Venos',
      probability: 'moderate',
      description: 'Tromboză venoasă profundă sau embolie pulmonară. Posibil dacă există suspiciune clinică (scor Wells). D-dimerii exclud tromboembolismul doar dacă probabilitate pre-test scăzută.',
      affectedFactors: [],
      suggestedTests: ['Scor Wells', 'Ecografie Doppler venos', 'Angio-CT pulmonar'],
    });

    // Cauze NON-trombotice (foarte frecvente!)
    diagnoses.push({
      id: 'infection_inflammation',
      name: 'Infecție / Inflamație',
      probability: 'high',
      description: 'Cauza cea mai frecventă! Sepsis, pneumonie, COVID-19, boli autoimune, traumatisme.',
      affectedFactors: [],
      suggestedTests: ['PCR', 'Procalcitonină', 'Hemocultură', 'Istoric clinic'],
    });
    diagnoses.push({
      id: 'malignancy',
      name: 'Malignitate',
      probability: 'moderate',
      description: 'Cancerele activează coagularea. Screening dacă D-dimeri persistent elevați fără cauză.',
      affectedFactors: [],
      suggestedTests: ['CT torace-abdomen-pelvis', 'Markeri tumorali', 'Istoric'],
    });
    diagnoses.push({
      id: 'postop_trauma',
      name: 'Postoperator / Traumatism',
      probability: 'moderate',
      description: 'D-dimeri fiziologic crescuți 1-4 săptămâni post-chirurgie sau traumă.',
      affectedFactors: [],
      suggestedTests: ['Istoric chirurgical recent'],
    });
    diagnoses.push({
      id: 'pregnancy',
      name: 'Sarcină / Postpartum',
      probability: 'moderate',
      description: 'D-dimeri cresc fiziologic în sarcină (de 2-4x). Praguri ajustate necesare.',
      affectedFactors: [],
      suggestedTests: ['Test sarcină', 'Praguri ajustate pe trimestru'],
    });
    diagnoses.push({
      id: 'liver_disease_ddimer',
      name: 'Boală Hepatică',
      probability: 'low',
      description: 'Clearance redus al D-dimerilor + coagulopatie hepatică.',
      affectedFactors: [],
      suggestedTests: ['Teste hepatice', 'Albumină', 'INR'],
    });
    diagnoses.push({
      id: 'age_related',
      name: 'Vârstă >50 ani',
      probability: 'low',
      description: 'D-dimeri cresc fiziologic cu vârsta. Prag ajustat: vârstă × 10 ng/mL (după 50 ani).',
      affectedFactors: [],
      suggestedTests: ['Utilizează prag ajustat pe vârstă'],
    });

    // Trombofilia - DOAR dacă tromboembolism confirmat sau suspiciune clinică puternică
    recommendations.push('D-dimerii NU confirmă tromboza - doar o EXCLUD dacă probabilitate pre-test scăzută');
    recommendations.push('Cauze frecvente non-trombotice: infecție, inflamație, cancer, sarcină, post-operator, vârstă');
    recommendations.push('Screening trombofilie: DOAR după tromboembolism confirmat, la distanță (min. 3 luni), fără anticoagulant');
    recommendations.push('Prag ajustat vârstă (>50 ani): vârstă × 10 ng/mL (ex: 70 ani → 700 ng/mL)');
  }

  // TT specific
  if (ttHigh && !ptHigh && !apttHigh) {
    pattern = 'TT izolat prelungit';
    diagnoses.push({
      id: 'dysfibrinogenemia',
      name: 'Disfibrinogenemie',
      probability: 'high',
      description: 'Fibrinogen calitativ anormal.',
      affectedFactors: ['FBG'],
      suggestedTests: ['Fibrinogen funcțional vs antigenic', 'Timp reptilază'],
    });
    if (meds.heparin) {
      diagnoses.unshift({
        id: 'heparin_tt',
        name: 'Efect Heparină (TT)',
        probability: 'high',
        description: 'TT foarte sensibil la heparină.',
        affectedFactors: ['F2'],
        suggestedTests: ['Timp reptilază (normal în prezența heparinei)'],
      });
    }
    if (meds.doacIIa) {
      diagnoses.unshift({
        id: 'dabigatran_effect',
        name: 'Efect Dabigatran',
        probability: 'high',
        description: 'Dabigatran prelungește marcat TT (inhibitor direct al trombinei).',
        affectedFactors: ['IIa'],
        suggestedTests: ['dTT (diluted TT) pentru cuantificare', 'Ecarin time'],
      });
    }
  }

  // F13 consideration removed - clutters recommendations
  // FXIII deficiency is now shown visually in cascade (Cheag node)

  // ============================================
  // MEDICAMENTE ACTIVE CU LABORATOR NORMAL
  // Adaugă informații când medicamentele sunt active dar PT/aPTT sunt normale
  // ============================================
  if (meds.doacXa && !ptHigh && !apttHigh && diagnoses.length === 0) {
    diagnoses.push({
      id: 'doac_xa_active',
      name: 'DOAC anti-Xa activ',
      probability: 'high',
      description: 'Rivaroxaban/Apixaban/Edoxaban activ. PT-ul nu este un indicator de încredere.',
      affectedFactors: ['F10a'],
      suggestedTests: ['Verificare timp de la ultima doză', 'Istoric dozare'],
    });
    recommendations.push('PT-ul nu este un indicator de încredere pentru anti-Xa DOAC');
  }

  if (meds.doacIIa && !ttHigh && diagnoses.length === 0) {
    diagnoses.push({
      id: 'doac_iia_active',
      name: 'DOAC anti-IIa activ',
      probability: 'high',
      description: 'Dabigatran activ. TT este cel mai sensibil test pentru detectare.',
      affectedFactors: ['IIa'],
      suggestedTests: ['dTT (diluted TT)', 'Ecarin time'],
    });
    recommendations.push('TT normal poate apărea la niveluri terapeutice scăzute de Dabigatran');
  }

  // ============================================
  // AVERTISMENTE DOAC
  // ============================================
  if (meds.doacXa || meds.doacIIa) {
    warnings.push('PT-ul nu este un indicator de încredere pentru DOAC');
  }

  return {
    pattern: pattern || 'Profil necaracteristic',
    affectedPathway,
    diagnoses,
    recommendations,
    warnings,
    isthScore,
    hit4TScore,
  };
}

export function updateFactorsFromLab(
  factors: Record<string, Factor>,
  lab: LabInput,
  _interpretation: ClinicalInterpretation,
  medications: MedicationContext,
  currentScenario?: string | null
): Record<string, Factor> {
  const newFactors = { ...factors };

  // Reset all to normal (activity = 1.0)
  for (const id of Object.keys(newFactors)) {
    newFactors[id] = { ...newFactors[id], activity: 1.0 };
  }

  // ============================================
  // CALCULEAZĂ CONCENTRAȚIILE DIN INVERSE-MAPPING
  // ============================================
  const result = calculateFactorConcentrations(lab, medications);

  // Dacă e selectat un scenariu educațional, folosește DOAR factorii predefiniți
  // (pentru a evidenția clar ce e afectat în acea patologie)
  if (currentScenario && SCENARIO_AFFECTED_FACTORS[currentScenario]) {
    const scenarioFactors = SCENARIO_AFFECTED_FACTORS[currentScenario];

    for (const factorId of scenarioFactors) {
      if (newFactors[factorId]) {
        // Folosește concentrația calculată dacă există, altfel 30% pentru scenarii
        const conc = result.concentrations[factorId];
        const activity = conc ? conc.activityPercent / 100 : 0.3;
        newFactors[factorId] = { ...newFactors[factorId], activity };
      }
    }
    // NU facem return - continuăm cu ajustările pentru medicamente și propagare!
  } else {
    // Mod normal: aplică concentrațiile calculate la TOȚI factorii vizuali
    for (const [factorId, concentration] of Object.entries(result.concentrations)) {
      if (newFactors[factorId]) {
        // Convertește activityPercent (0-100) la activity (0-1)
        const activity = concentration.activityPercent / 100;
        newFactors[factorId] = { ...newFactors[factorId], activity };
      }
    }
  }

  // ============================================
  // AJUSTĂRI PENTRU MEDICAMENTE
  // Acestea se aplică ÎNAINTE de propagarea zimogen→activat
  // pentru că medicamentele afectează ZIMOGENII (sinteza)
  // ============================================

  if (medications.warfarin) {
    // Warfarina reduce SINTEZA factorilor vitamina K dependenți (zimogeni + anticoagulanți)
    // Include: F2, F7, F9, F10 (procoagulanți) + PC, PS (anticoagulanți)
    for (const factorId of ['F2', 'F7', 'F9', 'F10', 'PC', 'PS']) {
      if (newFactors[factorId]) {
        newFactors[factorId] = {
          ...newFactors[factorId],
          activity: Math.min(newFactors[factorId].activity, 0.4),
        };
      }
    }
  }

  if (medications.heparin) {
    // Heparina potențează AT → inhibă formele ACTIVATE (IIa, Xa)
    // Se aplică direct pe formele activate, nu pe zimogeni
    for (const factorId of ['IIa', 'F10a']) {
      if (newFactors[factorId]) {
        newFactors[factorId] = {
          ...newFactors[factorId],
          activity: Math.min(newFactors[factorId].activity, 0.2),
        };
      }
    }
  }

  if (medications.lmwh) {
    // LMWH - predominant anti-Xa (forma activată)
    if (newFactors['F10a']) {
      newFactors['F10a'] = {
        ...newFactors['F10a'],
        activity: Math.min(newFactors['F10a'].activity, 0.3),
      };
    }
  }

  if (medications.doacXa) {
    // Inhibitori Xa (Rivaroxaban, Apixaban, Edoxaban) - afectează doar F10a
    if (newFactors['F10a']) {
      newFactors['F10a'] = {
        ...newFactors['F10a'],
        activity: Math.min(newFactors['F10a'].activity, 0.3),
      };
    }
  }

  if (medications.doacIIa) {
    // Dabigatran - afectează doar IIa (trombina)
    if (newFactors['IIa']) {
      newFactors['IIa'] = {
        ...newFactors['IIa'],
        activity: Math.min(newFactors['IIa'].activity, 0.3),
      };
    }
  }

  if (medications.antiplatelet) {
    // Antiagregante - reduc funcția trombocitară
    if (newFactors['PLT']) {
      newFactors['PLT'] = {
        ...newFactors['PLT'],
        activity: Math.min(newFactors['PLT'].activity, 0.5),
      };
    }
  }

  // ============================================
  // PROPAGARE ZIMOGEN → FORMA ACTIVATĂ
  // Se aplică DUPĂ ajustările pentru medicamente
  // Dacă zimogenul e redus, forma activată NU poate fi mai mare
  // ============================================
  const zymogenToActivated: Record<string, string> = {
    'F12': 'F12a',
    'F11': 'F11a',
    'F9': 'F9a',
    'F8': 'F8a',
    'F7': 'F7a',
    'F10': 'F10a',
    'F5': 'F5a',
    'F2': 'IIa',
    'F13': 'F13a',
  };

  for (const [zymogen, activated] of Object.entries(zymogenToActivated)) {
    if (newFactors[zymogen] && newFactors[activated]) {
      // Forma activată nu poate fi mai mare decât zimogenul
      newFactors[activated] = {
        ...newFactors[activated],
        activity: Math.min(newFactors[activated].activity, newFactors[zymogen].activity),
      };
    }
  }

  return newFactors;
}
