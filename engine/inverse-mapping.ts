/**
 * Inverse Mapping Module: Lab Values → Factor Concentrations
 *
 * Acest modul calculează concentrațiile factorilor de coagulare
 * pe baza valorilor de laborator folosind un algoritm hybrid
 * bazat pe reguli patofiziologice.
 *
 * Referințe:
 * - Hockin MF et al. (2002) J Biol Chem 277:18322
 * - Mann KG et al. (2003) Chest 124:4S
 */

import {
  LabInput,
  MedicationContext,
  LabPattern,
  FactorConcentration,
  InverseMappingResult,
  ClinicalContext,
} from '@/types';
import { PHYSIOLOGICAL_CONCENTRATIONS_NM, LAB_RANGES, PT_NORMAL, APTT_NORMAL } from './coagulation';

// ============================================
// Pattern Detection Rules
// ============================================

interface PatternRule {
  factors: string[];
  weights: Record<string, number>;
  pathway: 'intrinsic' | 'extrinsic' | 'common' | 'platelet' | 'mixed' | 'none';
}

const PATTERN_RULES: Record<LabPattern, PatternRule> = {
  normal: {
    factors: [],
    weights: {},
    pathway: 'none',
  },
  aptt_isolated: {
    // aPTT prelungit, PT normal → calea intrinsecă
    factors: ['F8', 'F9', 'F11', 'F12', 'vWF'],
    weights: {
      F8: 0.40,   // Hemofilia A - cea mai frecventă
      F9: 0.25,   // Hemofilia B
      vWF: 0.20,  // von Willebrand
      F11: 0.10,  // Hemofilia C (rar)
      F12: 0.05,  // Nu cauzează sângerare, doar anomalie de laborator
    },
    pathway: 'intrinsic',
  },
  pt_isolated: {
    // PT prelungit, aPTT normal → Factor VII izolat
    factors: ['F7'],
    weights: { F7: 1.0 },
    pathway: 'extrinsic',
  },
  both_prolonged: {
    // PT și aPTT prelungite → deficiențe multiple (toate căile afectate)
    // Cauze tipice: deficit vit K, boală hepatică, DIC, anticoagulare excesivă
    factors: ['F7', 'F9', 'F8', 'F11', 'F12', 'F10', 'F5', 'F2', 'FBG'],
    weights: {
      // Calea comună (afectată sigur - ambele teste convergesc aici)
      F10: 0.20,
      F5: 0.15,
      F2: 0.20,
      FBG: 0.10,
      // Calea extrinsecă (PT prelungit)
      F7: 0.10,
      // Calea intrinsecă (aPTT prelungit)
      F8: 0.08,
      F9: 0.07,
      F11: 0.05,
      F12: 0.05,
    },
    pathway: 'mixed',
  },
  tt_prolonged: {
    // TT prelungit → DOAR fibrinogen (testul ocolește protrombina/trombina)
    // TT adaugă trombină exogenă și măsoară doar conversia fibrinogen→fibrină
    // Cauze: hipofibrinogenemie, disfibrinogenemie, inhibitori de trombină (heparin, dabigatran)
    factors: ['FBG'],
    weights: {
      FBG: 1.0,
    },
    pathway: 'common',
  },
  fibrinogen_low: {
    // Fibrinogen direct scăzut
    factors: ['FBG'],
    weights: { FBG: 1.0 },
    pathway: 'common',
  },
  platelets_low: {
    // Trombocitopenie
    factors: ['PLT'],
    weights: { PLT: 1.0 },
    pathway: 'platelet',
  },
  bleeding_time_long: {
    // Timp sângerare prelungit → trombocite sau vWF
    factors: ['PLT', 'vWF'],
    weights: {
      PLT: 0.60,
      vWF: 0.40,
    },
    pathway: 'platelet',
  },
  mixed: {
    // Pattern complex - deficiențe multiple (boală hepatică, DIC, deficit vit K)
    // Include toți factorii majori care pot fi afectați simultan
    factors: ['F10', 'F5', 'F2', 'F7', 'FBG', 'F8', 'F9', 'F11', 'F12'],
    weights: {
      F10: 0.16,  // Calea comună
      F5: 0.12,   // Calea comună
      F2: 0.16,   // Calea comună
      F7: 0.12,   // Calea extrinsecă (vit K dependent)
      FBG: 0.10,  // Calea comună
      F8: 0.10,   // Calea intrinsecă
      F9: 0.10,   // Calea intrinsecă (vit K dependent)
      F11: 0.07,  // Calea intrinsecă
      F12: 0.07,  // Calea intrinsecă (contact)
    },
    pathway: 'mixed',
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Identifică pattern-ul de laborator pe baza valorilor
 */
function identifyLabPattern(lab: LabInput): LabPattern {
  const ptProlonged = lab.pt > LAB_RANGES.pt.max;
  const apttProlonged = lab.aptt > LAB_RANGES.aptt.max;
  const ttProlonged = lab.tt > LAB_RANGES.tt.max;
  const fibLow = lab.fibrinogen < LAB_RANGES.fibrinogen.min;
  const pltLow = lab.platelets < LAB_RANGES.platelets.min;
  const btLong = lab.bleedingTime > LAB_RANGES.bleedingTime.max;

  // Check for normal values first
  if (!ptProlonged && !apttProlonged && !ttProlonged && !fibLow && !pltLow && !btLong) {
    return 'normal';
  }

  // Isolated aPTT prolongation
  if (apttProlonged && !ptProlonged) {
    return 'aptt_isolated';
  }

  // Isolated PT prolongation
  if (ptProlonged && !apttProlonged) {
    return 'pt_isolated';
  }

  // Both PT and aPTT prolonged
  if (ptProlonged && apttProlonged) {
    return 'both_prolonged';
  }

  // TT prolonged (isolated or with fibrinogen)
  if (ttProlonged && !ptProlonged && !apttProlonged) {
    return 'tt_prolonged';
  }

  // Direct fibrinogen low
  if (fibLow) {
    return 'fibrinogen_low';
  }

  // Platelet issues
  if (pltLow) {
    return 'platelets_low';
  }

  // Bleeding time prolonged
  if (btLong) {
    return 'bleeding_time_long';
  }

  return 'mixed';
}

/**
 * Calculează severitatea din deviația valorilor lab
 * Returnează un ratio (1.0 = normal, 2.0 = dublu față de limita superioară)
 */
function calculateSeverity(lab: LabInput, pattern: LabPattern): number {
  switch (pattern) {
    case 'normal':
      return 1.0;

    case 'pt_isolated':
      return lab.pt / PT_NORMAL;

    case 'aptt_isolated':
      return lab.aptt / APTT_NORMAL;

    case 'both_prolonged':
      return Math.max(lab.pt / PT_NORMAL, lab.aptt / APTT_NORMAL);

    case 'tt_prolonged':
      return lab.tt / LAB_RANGES.tt.max;

    case 'fibrinogen_low':
      // Inversă: fibrinogen mai mic = severitate mai mare
      return LAB_RANGES.fibrinogen.min / Math.max(lab.fibrinogen, 10);

    case 'platelets_low':
      return LAB_RANGES.platelets.min / Math.max(lab.platelets, 10);

    case 'bleeding_time_long':
      return lab.bleedingTime / LAB_RANGES.bleedingTime.max;

    case 'mixed':
      return Math.max(
        lab.pt / PT_NORMAL,
        lab.aptt / APTT_NORMAL,
        lab.tt / LAB_RANGES.tt.max
      );

    default:
      return 1.0;
  }
}

/**
 * Convertește severitatea la activitate (% din normal)
 * Bazat pe curbe empirice din literatura clinică
 *
 * PT se dublează (~24s) când factorii sunt la ~30%
 * aPTT se dublează (~60s) când FVIII este la ~30%
 */
function severityToActivity(severity: number, curveType: 'pt' | 'aptt' | 'linear'): number {
  if (severity <= 1.0) return 1.0;

  const curves = {
    pt: { decayConstant: 0.45, threshold: 0.55 },  // Ajustat pentru INR clinic: 3.5 ≈ 18% activitate
    aptt: { decayConstant: 0.8, threshold: 0.35 },
    linear: { decayConstant: 1.0, threshold: 0.5 },
  };

  const { decayConstant, threshold } = curves[curveType];

  // Formula: activity = threshold * e^(-decay * (severity - 1))
  const activity = threshold * Math.exp(-decayConstant * (severity - 1));

  // Clamp între 1% și 100%
  return Math.max(0.01, Math.min(1.0, activity));
}

/**
 * Aplică ajustări pentru medicamente
 */
function applyMedicationAdjustments(
  weights: Record<string, number>,
  meds: MedicationContext
): Record<string, number> {
  const adjusted = { ...weights };

  if (meds.warfarin) {
    // Warfarina afectează factorii vitamina K dependenți
    const vkFactors = ['F2', 'F7', 'F9', 'F10'];
    for (const factor of vkFactors) {
      if (adjusted[factor] !== undefined) {
        adjusted[factor] *= 2.0; // Crește ponderea
      }
    }
  }

  if (meds.heparin || meds.lmwh) {
    // Heparina potențează AT → afectează IIa, Xa
    if (adjusted['F2'] !== undefined) adjusted['F2'] *= 1.5;
    if (adjusted['F10'] !== undefined) adjusted['F10'] *= 1.5;
  }

  // Normalizează ponderile
  const total = Object.values(adjusted).reduce((sum, w) => sum + w, 0);
  if (total > 0) {
    for (const key of Object.keys(adjusted)) {
      adjusted[key] /= total;
    }
  }

  return adjusted;
}

/**
 * Calculează nivelul de încredere al estimării
 */
function calculateConfidence(
  lab: LabInput,
  pattern: LabPattern,
  context?: ClinicalContext
): 'high' | 'moderate' | 'low' {
  let score = 0;

  // Mixing test oferă informații clare
  if (lab.mixingTest === 'corrects') score += 30;
  if (lab.mixingTest === 'does_not_correct') score += 30;

  // Pattern clar (un singur factor afectat)
  const rule = PATTERN_RULES[pattern];
  if (rule.factors.length === 1) score += 25;
  else if (rule.factors.length <= 3) score += 15;

  // Context clinic cunoscut
  if (context?.knownDiagnosis) score += 25;

  // Valori lab clare (nu la limită)
  const ptClear = Math.abs(lab.pt - PT_NORMAL) > 3;
  const apttClear = Math.abs(lab.aptt - APTT_NORMAL) > 10;
  if (ptClear || apttClear) score += 10;

  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

/**
 * Generează note clinice bazate pe rezultate
 */
function generateClinicalNotes(
  pattern: LabPattern,
  lab: LabInput,
  inhibitorSuspected: boolean
): string[] {
  const notes: string[] = [];

  if (pattern === 'normal') {
    notes.push('Valorile de laborator sunt în limite normale.');
    return notes;
  }

  if (inhibitorSuspected) {
    notes.push('Suspiciune de inhibitor (test de mixaj nu corectează).');
    notes.push('Recomandare: dozare inhibitori specifici (lupus anticoagulant, anti-FVIII).');
  }

  switch (pattern) {
    case 'aptt_isolated':
      notes.push('aPTT prelungit izolat → afectare cale intrinsecă.');
      notes.push('Diagnostic diferențial: Hemofilia A/B, von Willebrand, deficit F XI/XII.');
      break;
    case 'pt_isolated':
      notes.push('PT prelungit izolat → afectare Factor VII (cale extrinsecă).');
      notes.push('Cauze: deficit congenital FVII, boală hepatică incipientă, vitamina K.');
      break;
    case 'both_prolonged':
      notes.push('PT și aPTT prelungite → afectare cale comună sau deficiențe multiple.');
      notes.push('Diagnostic diferențial: deficit FX/FV/FII, afibrinogenemie, DIC, boală hepatică.');
      break;
    case 'tt_prolonged':
      notes.push('TT prelungit → afectare la nivelul fibrinogenului (cantitativ sau calitativ).');
      notes.push('Cauze: hipofibrinogenemie, disfibrinogenemie, inhibitori de trombină (heparin, dabigatran, PDF-uri).');
      notes.push('Notă: TT nu reflectă nivelurile de protrombină (F2) - testul ocolește generarea de trombină.');
      break;
    case 'fibrinogen_low':
      if (lab.fibrinogen < 50) {
        notes.push('⚠️ AFIBRINOGENEMIE: Fibrinogen < 50 mg/dL - deficit sever!');
        notes.push('Diagnostic diferențial: Afibrinogenemie congenitală (AR) vs. dobândită (consum masiv).');
        notes.push('Afibrinogenemia congenitală: mutații FGA/FGB/FGG, incidență ~1:1.000.000.');
      } else if (lab.fibrinogen < 100) {
        notes.push('Hipofibrinogenemie severă (50-100 mg/dL) - risc hemoragic crescut.');
        notes.push('Cauze: consum (DIC, hemoragie masivă), hiperfibrinoliză, sinteză hepatică redusă.');
      } else {
        notes.push('Hipofibrinogenemie moderată (100-200 mg/dL).');
        notes.push('Cauze: boală hepatică, consum, deficit congenital heterozigot.');
      }
      break;
    case 'platelets_low':
      notes.push('Trombocitopenie detectată.');
      notes.push('Evaluare: producție medulară, consum periferic, sechestrare splenică.');
      break;
  }

  return notes;
}

// ============================================
// Main Function
// ============================================

/**
 * Calculează concentrațiile factorilor de coagulare din valorile de laborator
 *
 * @param lab - Valorile de laborator
 * @param meds - Context medicamentos
 * @param context - Context clinic opțional
 * @returns Rezultatul mapping-ului cu concentrații și note clinice
 */
export function calculateFactorConcentrations(
  lab: LabInput,
  meds: MedicationContext,
  context?: ClinicalContext
): InverseMappingResult {
  // 1. Identifică pattern-ul
  const pattern = identifyLabPattern(lab);

  // 2. Obține regula pentru pattern
  const rule = PATTERN_RULES[pattern];

  // 3. Determină dacă e suspiciune de inhibitor
  const inhibitorSuspected = lab.mixingTest === 'does_not_correct';

  // 4. Calculează severitatea
  const severity = calculateSeverity(lab, pattern);

  // 5. Aplică ajustări pentru medicamente
  const weights = applyMedicationAdjustments(rule.weights, meds);

  // 6. Determină tipul de curbă
  const curveType: 'pt' | 'aptt' | 'linear' =
    pattern === 'pt_isolated' ? 'pt' :
    pattern === 'aptt_isolated' ? 'aptt' :
    'linear';

  // 7. Calculează concentrațiile pentru fiecare factor
  const concentrations: Record<string, FactorConcentration> = {};

  // Inițializează toți factorii la valori normale
  for (const factorId of Object.keys(PHYSIOLOGICAL_CONCENTRATIONS_NM)) {
    const normalConc = PHYSIOLOGICAL_CONCENTRATIONS_NM[factorId];
    concentrations[factorId] = {
      factorId,
      concentrationNm: normalConc,
      activityPercent: 100,
      confidence: 'moderate',
    };
  }

  // Ajustează factorii afectați
  if (!inhibitorSuspected) {
    for (const factorId of rule.factors) {
      const weight = weights[factorId] || 0;
      const normalConc = PHYSIOLOGICAL_CONCENTRATIONS_NM[factorId];

      if (normalConc !== undefined && weight > 0) {
        // Activitatea depinde de severitate și pondere
        // Factori cu pondere mai mare sunt mai probabil afectați
        const effectiveSeverity = 1 + (severity - 1) * weight;
        const activity = severityToActivity(effectiveSeverity, curveType);

        concentrations[factorId] = {
          factorId,
          concentrationNm: normalConc * activity,
          activityPercent: activity * 100,
          confidence: weight >= 0.3 ? 'high' : weight >= 0.15 ? 'moderate' : 'low',
        };
      }
    }
  }

  // ============================================
  // DIRECT LAB VALUE HANDLING
  // PLT și FBG trebuie setate direct din valorile lab,
  // indiferent de pattern (PT/aPTT nu măsoară trombocitele!)
  // ============================================

  // PLT: activitate direct proporțională cu numărul de trombocite
  if (lab.platelets < LAB_RANGES.platelets.min) {
    const pltNormal = PHYSIOLOGICAL_CONCENTRATIONS_NM['PLT'] || 250;
    // Normalizare: 150k = 100%, 75k = 50%, 0 = 0%
    const pltActivity = Math.max(0.05, Math.min(1.0, lab.platelets / LAB_RANGES.platelets.min));
    concentrations['PLT'] = {
      factorId: 'PLT',
      concentrationNm: pltNormal * pltActivity,
      activityPercent: pltActivity * 100,
      confidence: 'high',
    };
  }

  // FBG: activitate direct proporțională cu fibrinogenul
  // (pattern-ul poate să-l fi setat deja, dar verificăm și setăm direct dacă e scăzut)
  if (lab.fibrinogen < LAB_RANGES.fibrinogen.min) {
    const fbgNormal = PHYSIOLOGICAL_CONCENTRATIONS_NM['FBG'] || 9000;
    // Normalizare: 200 = 100%, 100 = 50%, 0 = 0%
    const fbgActivity = Math.max(0.05, Math.min(1.0, lab.fibrinogen / LAB_RANGES.fibrinogen.min));
    // Folosește minimul dintre valoarea calculată prin pattern și valoarea directă
    const currentActivity = concentrations['FBG']?.activityPercent ?? 100;
    const finalActivity = Math.min(currentActivity / 100, fbgActivity);
    concentrations['FBG'] = {
      factorId: 'FBG',
      concentrationNm: fbgNormal * finalActivity,
      activityPercent: finalActivity * 100,
      confidence: 'high',
    };
  }

  // 8. Build affected factors list (include PLT/FBG if directly affected)
  const affectedFactors = [...rule.factors];
  if (lab.platelets < LAB_RANGES.platelets.min && !affectedFactors.includes('PLT')) {
    affectedFactors.push('PLT');
  }
  if (lab.fibrinogen < LAB_RANGES.fibrinogen.min && !affectedFactors.includes('FBG')) {
    affectedFactors.push('FBG');
  }

  // 9. Calculează nivelul de încredere general
  const confidence = calculateConfidence(lab, pattern, context);

  // 10. Generează note clinice
  const clinicalNotes = generateClinicalNotes(pattern, lab, inhibitorSuspected);

  return {
    concentrations,
    pattern,
    affectedPathway: rule.pathway,
    affectedFactors,
    inhibitorSuspected,
    confidence,
    clinicalNotes,
  };
}

/**
 * Convertește activitatea procentuală la concentrație în nM
 */
export function activityToConcentration(factorId: string, activityPercent: number): number {
  const normalConc = PHYSIOLOGICAL_CONCENTRATIONS_NM[factorId];
  if (normalConc === undefined) return 0;
  return normalConc * (activityPercent / 100);
}

/**
 * Convertește concentrația în nM la activitate procentuală
 */
export function concentrationToActivity(factorId: string, concentrationNm: number): number {
  const normalConc = PHYSIOLOGICAL_CONCENTRATIONS_NM[factorId];
  if (normalConc === undefined || normalConc === 0) return 0;
  return (concentrationNm / normalConc) * 100;
}
