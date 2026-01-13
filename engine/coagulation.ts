import { Factor, LabInput, LabRange } from '@/types';

type NumericLabKey = 'pt' | 'inr' | 'aptt' | 'tt' | 'fibrinogen' | 'platelets' | 'dDimers' | 'bleedingTime';

// PT normal reference value (seconds) - used for INR calculation
export const PT_NORMAL = 12.0;
// ISI (International Sensitivity Index) - typically 1.0 for modern reagents
export const ISI = 1.0;

export const LAB_RANGES: Record<NumericLabKey, LabRange> = {
  pt: { min: 11, max: 13.5, unit: 's', criticalHigh: 30 },
  inr: { min: 0.9, max: 1.1, unit: '', criticalHigh: 4.0 },
  aptt: { min: 25, max: 40, unit: 's', criticalHigh: 80 },
  tt: { min: 14, max: 19, unit: 's', criticalHigh: 40 },
  fibrinogen: { min: 200, max: 400, unit: 'mg/dL', criticalLow: 100 },
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
  if (range.criticalLow !== undefined && value < range.criticalLow) return 'critical';
  if (range.criticalHigh !== undefined && value > range.criticalHigh) return 'critical';
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
