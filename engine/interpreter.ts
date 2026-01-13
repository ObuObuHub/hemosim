import { LabInput, MedicationContext, ClinicalInterpretation, Diagnosis, Factor, ISTHScore, Hit4TCriteria, Hit4TScore } from '@/types';
import { LAB_RANGES } from './coagulation';

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

export function calculate4TScore(criteria: Hit4TCriteria): Hit4TScore {
  const total = criteria.thrombocytopenia + criteria.timing + criteria.thrombosis + criteria.otherCauses;

  let probability: 'low' | 'intermediate' | 'high';
  let interpretation: string;

  if (total <= 3) {
    probability = 'low';
    interpretation = 'Probabilitate scăzută HIT (<5%) - HIT puțin probabil';
  } else if (total <= 5) {
    probability = 'intermediate';
    interpretation = 'Probabilitate intermediară HIT (~14%) - Testează anti-PF4/heparină';
  } else {
    probability = 'high';
    interpretation = 'Probabilitate RIDICATĂ HIT (~64%) - OPREȘTE heparina!';
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

  // Calculate 4T score for HIT when heparin is used and platelets are low
  if ((meds.heparin || meds.lmwh) && pltLow && hit4TCriteria) {
    hit4TScore = calculate4TScore(hit4TCriteria);
    if (hit4TScore.probability === 'high') {
      warnings.push(`URGENȚĂ HIT: Scor 4T = ${hit4TScore.total}/8 - OPREȘTE HEPARINA IMEDIAT!`);
    } else if (hit4TScore.probability === 'intermediate') {
      warnings.push(`Suspiciune HIT: Scor 4T = ${hit4TScore.total}/8 - Testează anti-PF4/heparină`);
    }
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
      diagnoses.push({
        id: 'hemophilia_a',
        name: 'Hemofilie A',
        probability: 'high',
        description: 'Deficit Factor VIII. X-linked recesiv. Mixing test confirmă deficit.',
        affectedFactors: ['F8'],
        suggestedTests: ['Dozare Factor VIII'],
      });
      diagnoses.push({
        id: 'hemophilia_b',
        name: 'Hemofilie B',
        probability: 'high',
        description: 'Deficit Factor IX (Christmas disease).',
        affectedFactors: ['F9'],
        suggestedTests: ['Dozare Factor IX'],
      });
      diagnoses.push({
        id: 'hemophilia_c',
        name: 'Hemofilie C (Deficit F.XI)',
        probability: 'moderate',
        description: 'Deficit Factor XI. Frecvent la evrei Ashkenazi.',
        affectedFactors: ['F11'],
        suggestedTests: ['Dozare Factor XI'],
      });
      diagnoses.push({
        id: 'vwd',
        name: 'Boala von Willebrand',
        probability: 'moderate',
        description: 'Deficit vWF cu afectare secundară F.VIII.',
        affectedFactors: ['vWF', 'F8'],
        suggestedTests: ['vWF:Ag', 'vWF:RCo', 'Factor VIII'],
      });
      diagnoses.push({
        id: 'f12_deficiency',
        name: 'Deficit Factor XII',
        probability: 'low',
        description: 'NU cauzează sângerare! Doar prelungire aPTT in vitro.',
        affectedFactors: ['F12'],
        suggestedTests: ['Dozare Factor XII'],
      });
      recommendations.push('Mixing test CORECTEAZĂ → Deficit de factor confirmat');
      recommendations.push('Dozează factorii individuali: VIII, IX, XI, XII');
      recommendations.push('Deficit F.XII: NU cauzează sângerare - nu necesită tratament');
    } else if (lab.mixingTest === 'does_not_correct') {
      // Mixing test DOES NOT CORRECT = Inhibitor present
      diagnoses.push({
        id: 'lupus_anticoagulant',
        name: 'Sindrom Antifosfolipidic (APS)',
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
      warnings.push('MIXING TEST NU CORECTEAZĂ → Inhibitor prezent!');
      recommendations.push('Mixing test NU CORECTEAZĂ → Inhibitor confirmat');
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
        suggestedTests: ['Dozare Factor VIII', 'Mixing test'],
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
        description: 'Deficit Factor XI. Frecvent la evrei Ashkenazi. Sângerare variabilă.',
        affectedFactors: ['F11'],
        suggestedTests: ['Dozare Factor XI'],
      });
      diagnoses.push({
        id: 'vwd',
        name: 'Boala von Willebrand',
        probability: 'moderate',
        description: 'Deficit vWF cu afectare secundară F.VIII.',
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
        name: 'Sindrom Antifosfolipidic (APS)',
        probability: 'low',
        description: 'TROMBOFILIE! Paradox: aPTT↑ in vitro dar risc TROMBOTIC in vivo.',
        affectedFactors: ['F12'],
        suggestedTests: ['Mixing test (nu corectează)', 'dRVVT', 'Anti-cardiolipin IgG/IgM', 'Anti-β2GP1'],
      });
      recommendations.push('⚡ Efectuează MIXING TEST pentru diferențiere deficit vs inhibitor');
      recommendations.push('ATENȚIE: aPTT prelungit NU exclude trombofilie (anticoagulant lupic)');
      recommendations.push('Deficit F.XII: NU cauzează sângerare - nu necesită tratament profilactic');
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
    } else if (meds.doac) {
      diagnoses.push({
        id: 'doac_xa_effect',
        name: 'Efect DOAC (inhibitor Xa)',
        probability: 'high',
        description: 'Rivaroxaban/Apixaban/Edoxaban prelungesc PT. Efect variabil pe aPTT.',
        affectedFactors: ['F10'],
        suggestedTests: ['Anti-Xa specific (pentru cuantificare)', 'Verificare timp de la ultima doză'],
      });
      recommendations.push('PT nu reflectă fidel nivelul DOAC - folosește anti-Xa chromogenic');
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
      if (isthScore.total >= 5) {
        warnings.push(`URGENȚĂ: CID MANIFEST (Scor ISTH ${isthScore.total}/8) - tratează cauza subiacentă!`);
      } else {
        warnings.push(`Suspiciune CID (Scor ISTH ${isthScore.total}/8) - monitorizare strânsă!`);
      }
      recommendations.push(`Scor ISTH: PLT=${isthScore.platelets} + D-dim=${isthScore.dDimers} + PT=${isthScore.pt} + Fib=${isthScore.fibrinogen} = ${isthScore.total}`);
    } else if (fibLow) {
      diagnoses.push({
        id: 'afibrinogenemia',
        name: 'Hipo/Afibrinogenemie',
        probability: 'high',
        description: 'Fibrinogen foarte scăzut - afectează calea comună finală.',
        affectedFactors: ['FBG'],
        suggestedTests: ['Fibrinogen funcțional', 'TT'],
      });
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
    pattern = btHigh ? 'Timp de sângerare prelungit' : 'Trombocitopenie';
    affectedPathway = 'platelet';

    if (pltLow) {
      diagnoses.push({
        id: 'thrombocytopenia',
        name: 'Trombocitopenie',
        probability: 'high',
        description: 'Cauze: producție↓, distrugere↑, sechestrare.',
        affectedFactors: ['PLT'],
        suggestedTests: ['Frotiu periferic', 'Reticulocite', 'LDH', 'Coombs'],
      });
      if (lab.platelets < 50) {
        warnings.push('Trombocite <50.000 - risc hemoragic la proceduri');
      }
      if (lab.platelets < 20) {
        warnings.push('Trombocite <20.000 - risc hemoragie spontană');
      }
    }
    if (btHigh && !pltLow) {
      diagnoses.push({
        id: 'platelet_dysfunction',
        name: 'Disfuncție Plachetară',
        probability: 'high',
        description: 'Număr normal, funcție alterată.',
        affectedFactors: ['PLT'],
        suggestedTests: ['Agregometrie plachetară', 'PFA-100'],
      });
      diagnoses.push({
        id: 'vwd_type1',
        name: 'Boala von Willebrand Tip 1',
        probability: 'moderate',
        description: 'Aderare plachetară deficitară.',
        affectedFactors: ['vWF', 'PLT'],
        suggestedTests: ['vWF:Ag', 'vWF:RCo', 'RIPA'],
      });
      if (meds.antiplatelet) {
        diagnoses.unshift({
          id: 'antiplatelet_effect',
          name: 'Efect Antiagregant',
          probability: 'high',
          description: 'Consistent cu medicația antiplachetară.',
          affectedFactors: ['PLT'],
          suggestedTests: ['Verificare complianță, consider oprire pre-procedural'],
        });
      }
    }
  }
  // D-dimer elevation alone - thrombosis/thrombophilia workup
  else if (dDimerHigh) {
    pattern = 'D-dimeri crescuți - evaluare trombofilie';
    affectedPathway = 'none';
    diagnoses.push({
      id: 'thrombosis',
      name: 'Tromboză Venoasă Profundă / EP',
      probability: 'high',
      description: 'D-dimeri crescuți - marker fibrinoliză activă.',
      affectedFactors: [],
      suggestedTests: ['Ecografie Doppler venos', 'Angio-CT pulmonar (dacă scor Wells sugestiv)'],
    });
    diagnoses.push({
      id: 'factor_v_leiden',
      name: 'Factor V Leiden',
      probability: 'moderate',
      description: 'Mutație FV G1691A - rezistență la Proteina C activată. Cea mai frecventă trombofilie.',
      affectedFactors: ['F5'],
      suggestedTests: ['Test rezistență APC', 'Genotipare FV Leiden'],
    });
    diagnoses.push({
      id: 'prothrombin_mutation',
      name: 'Mutație Protrombină G20210A',
      probability: 'moderate',
      description: 'Nivel crescut de protrombină - risc trombotic.',
      affectedFactors: ['F2'],
      suggestedTests: ['Genotipare PT G20210A'],
    });
    diagnoses.push({
      id: 'protein_c_def',
      name: 'Deficit Proteină C',
      probability: 'low',
      description: 'Anticoagulant natural - activează degradarea FVa și FVIIIa.',
      affectedFactors: ['PC'],
      suggestedTests: ['Proteină C funcțională', 'Proteină C antigen'],
    });
    diagnoses.push({
      id: 'protein_s_def',
      name: 'Deficit Proteină S',
      probability: 'low',
      description: 'Cofactor al Proteinei C. Atenție: scăzută în sarcină/COC.',
      affectedFactors: ['PS'],
      suggestedTests: ['Proteină S liberă', 'Proteină S totală'],
    });
    diagnoses.push({
      id: 'antithrombin_def',
      name: 'Deficit Antitrombină',
      probability: 'low',
      description: 'Inhibitor principal al trombinei și FXa. Rezistență la heparină!',
      affectedFactors: ['AT'],
      suggestedTests: ['Antitrombină funcțională', 'Antitrombină antigen'],
    });
    recommendations.push('D-dimerii au VPN ridicată - exclud TEV dacă probabilitate pre-test scăzută');
    recommendations.push('Screening trombofilie: la distanță de evenimentul acut (min. 3 luni)');
    recommendations.push('Nu testa în faza acută sau sub anticoagulant (rezultate fals pozitive/negative)');
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
    if (meds.doac) {
      diagnoses.unshift({
        id: 'dabigatran_effect',
        name: 'Efect Dabigatran',
        probability: 'high',
        description: 'Dabigatran prelungește marcat TT.',
        affectedFactors: ['F2'],
        suggestedTests: ['dTT (diluted TT) pentru cuantificare'],
      });
    }
  }

  // F13 consideration - FXIII deficiency has NORMAL PT/aPTT/TT AND NORMAL bleeding time
  // It can only be detected by specific tests (urea clot solubility, FXIII assay)
  // We mention it when all standard tests are normal as a reminder for clinical suspicion
  if (pattern === 'Profil de coagulare normal' && !btHigh) {
    recommendations.push('Notă: Deficit F.XIII nedetectabil prin teste standard - consideră dacă există istoric de sângerare tardivă/cicatrizare deficitară');
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
  interpretation: ClinicalInterpretation
): Record<string, Factor> {
  const newFactors = { ...factors };

  // Reset all to normal
  for (const id of Object.keys(newFactors)) {
    newFactors[id] = { ...newFactors[id], activity: 1.0 };
  }

  // Reduce activity based on affected factors from diagnoses
  const affectedSet = new Set<string>();
  for (const diagnosis of interpretation.diagnoses) {
    for (const factorId of diagnosis.affectedFactors) {
      affectedSet.add(factorId);
    }
  }

  for (const factorId of affectedSet) {
    if (newFactors[factorId]) {
      newFactors[factorId] = {
        ...newFactors[factorId],
        activity: 0.3,
      };
    }
  }

  // Additional adjustments based on lab values
  const ptRatio = lab.pt / 12;
  const apttRatio = lab.aptt / 30;

  if (ptRatio > 1.5) {
    ['F7', 'F10', 'F5', 'F2', 'FBG'].forEach(id => {
      if (newFactors[id]) {
        newFactors[id] = { ...newFactors[id], activity: Math.min(newFactors[id].activity, 1 / ptRatio) };
      }
    });
  }

  if (apttRatio > 1.5) {
    ['F12', 'F11', 'F9', 'F8'].forEach(id => {
      if (newFactors[id]) {
        newFactors[id] = { ...newFactors[id], activity: Math.min(newFactors[id].activity, 1 / apttRatio) };
      }
    });
  }

  if (lab.fibrinogen < 150) {
    newFactors['FBG'] = { ...newFactors['FBG'], activity: lab.fibrinogen / 300 };
  }

  if (lab.platelets < 150) {
    newFactors['PLT'] = { ...newFactors['PLT'], activity: lab.platelets / 250 };
  }

  return newFactors;
}
