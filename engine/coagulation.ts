import { Factor, LabRange } from '@/types';

type NumericLabKey = 'pt' | 'inr' | 'aptt' | 'tt' | 'fibrinogen' | 'platelets' | 'dDimers' | 'bleedingTime';

// ============================================
// Concentrații Fiziologice de Referință (nM)
// Surse: Hockin 2002, Mann 2003, Butenas 1999
// ============================================
export const PHYSIOLOGICAL_CONCENTRATIONS_NM: Record<string, number> = {
  // Calea intrinsecă
  F12: 375,
  F11: 30,
  F9: 90,
  F8: 0.7,

  // Calea extrinsecă
  F7: 10,
  TF: 0,  // Variabil (trigger)

  // Calea comună
  F10: 170,
  F5: 20,
  F2: 1400,   // Protrombină
  FBG: 9000,  // Fibrinogen

  // Formele activate (de obicei 0 la baseline)
  F12a: 0,
  F11a: 0,
  F9a: 0,
  F8a: 0,
  F7a: 0,
  F10a: 0,  // Xa
  F5a: 0,   // Va
  IIa: 0,   // Trombină

  // Stabilizare cheag
  F13: 70,
  F13a: 0,

  // Anticoagulanți naturali
  AT: 3400,
  PC: 65,
  PS: 300,
  TFPI: 2.5,

  // vWF (pentru hemostază primară)
  vWF: 10,  // µg/mL aprox

  // Trombocite (nu în nM, dar pentru referință)
  PLT: 250,  // ×10³/µL
};

// PT normal reference value (seconds) - used for INR calculation
export const PT_NORMAL = 12.0;
// ISI (International Sensitivity Index) - typically 1.0 for modern reagents
export const ISI = 1.0;

export const LAB_RANGES: Record<NumericLabKey, LabRange> = {
  pt: { min: 11, max: 13.5, unit: 's', criticalHigh: 30 },
  inr: { min: 0.9, max: 1.2, unit: '', criticalHigh: 6.0 },
  aptt: { min: 25, max: 40, unit: 's', criticalHigh: 80 },
  tt: { min: 14, max: 19, unit: 's', criticalHigh: 40 },
  fibrinogen: { min: 200, max: 400, unit: 'mg/dL', criticalLow: 100, criticalHigh: 700 },
  platelets: { min: 150, max: 400, unit: '×10³/µL', criticalLow: 50 },
  dDimers: { min: 0, max: 500, unit: 'ng/mL', criticalHigh: 2000 },
  bleedingTime: { min: 2, max: 7, unit: 'min', criticalHigh: 15 },
};

// Calculate INR from PT: INR = (PT / PT_normal)^ISI
export function calculateINRFromPT(pt: number): number {
  return Math.round(Math.pow(pt / PT_NORMAL, ISI) * 100) / 100;
}

// Calculate PT from INR: PT = PT_normal * INR^(1/ISI)
export function calculatePTFromINR(inr: number): number {
  return Math.round(PT_NORMAL * Math.pow(inr, 1 / ISI) * 10) / 10;
}

// aPTT normal reference value (seconds) - used for Rosner index
export const APTT_NORMAL = 30.0;

// Calculate Rosner Index for mixing test interpretation
// Rosner Index = ((aPTT mix - aPTT normal) / aPTT patient) × 100
// > 11-15%: suggests inhibitor (doesn't correct)
// ≤ 11%: suggests factor deficiency (corrects)
export function calculateRosnerIndex(apttPatient: number, apttMix: number): number {
  if (apttPatient === 0) return 0;
  return Math.round(((apttMix - APTT_NORMAL) / apttPatient) * 100 * 10) / 10;
}

export interface RosnerResult {
  index: number;
  interpretation: 'deficiență' | 'inhibitor' | 'nedeterminat';
  description: string;
}

export function interpretRosnerIndex(apttPatient: number, apttMix: number): RosnerResult {
  const index = calculateRosnerIndex(apttPatient, apttMix);

  if (index <= 11) {
    return {
      index,
      interpretation: 'deficiență',
      description: 'Corectează → sugerează deficiență de factori',
    };
  } else if (index > 15) {
    return {
      index,
      interpretation: 'inhibitor',
      description: 'Nu corectează → sugerează prezența unui inhibitor',
    };
  } else {
    return {
      index,
      interpretation: 'nedeterminat',
      description: 'Zonă gri (11-15%) → necesită investigații suplimentare',
    };
  }
}

export const LAB_FACTOR_MAPPING: Record<string, string[]> = {
  pt: ['F7', 'F10', 'F5', 'F2', 'FBG'],
  aptt: ['F12', 'F11', 'F9', 'F8', 'F10', 'F5', 'F2', 'FBG'],
  tt: ['F2', 'FBG'],
  fibrinogen: ['FBG'],
  platelets: ['PLT'],
  dDimers: [],
  bleedingTime: ['PLT', 'vWF'],
};

export function getLabValueStatus(
  value: number,
  range: LabRange
): 'normal' | 'low' | 'high' | 'critical' {
  if (range.criticalLow !== undefined && value <= range.criticalLow) return 'critical';
  if (range.criticalHigh !== undefined && value >= range.criticalHigh) return 'critical';
  if (value < range.min) return 'low';
  if (value > range.max) return 'high';
  return 'normal';
}

export function resetFactors(factors: Record<string, Factor>): Record<string, Factor> {
  const newFactors = { ...factors };
  for (const id of Object.keys(newFactors)) {
    newFactors[id] = {
      ...newFactors[id],
      activity: newFactors[id].baseActivity,
    };
  }
  return newFactors;
}
