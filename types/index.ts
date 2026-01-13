export interface Factor {
  id: string;
  name: string;
  shortName: string;
  position: { x: number; y: number };
  activity: number;
  baseActivity: number;
  vitKDependent: boolean;
  parents: string[];
  children: string[];
  pathway: 'intrinsic' | 'extrinsic' | 'common' | 'platelet' | 'fibrinolysis';
}

export interface LabInput {
  pt: number;
  inr: number;
  aptt: number;
  tt: number;
  fibrinogen: number;
  platelets: number;
  dDimers: number;
  bleedingTime: number;
  mixingTest: 'not_performed' | 'corrects' | 'does_not_correct';
}

export interface LabRange {
  min: number;
  max: number;
  unit: string;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface Diagnosis {
  id: string;
  name: string;
  probability: 'high' | 'moderate' | 'low';
  description: string;
  affectedFactors: string[];
  suggestedTests: string[];
}

export interface ISTHScore {
  total: number;
  platelets: number;
  dDimers: number;
  pt: number;
  fibrinogen: number;
  interpretation: string;
}

export interface Hit4TCriteria {
  thrombocytopenia: 0 | 1 | 2;  // Platelet fall magnitude
  timing: 0 | 1 | 2;            // Timing of platelet fall
  thrombosis: 0 | 1 | 2;        // Thrombosis or other sequelae
  otherCauses: 0 | 1 | 2;       // Other causes for thrombocytopenia
}

export interface Hit4TScore {
  total: number;
  thrombocytopenia: number;
  timing: number;
  thrombosis: number;
  otherCauses: number;
  probability: 'low' | 'intermediate' | 'high';
  interpretation: string;
}

export interface ClinicalInterpretation {
  pattern: string;
  affectedPathway: 'intrinsic' | 'extrinsic' | 'common' | 'platelet' | 'mixed' | 'none';
  diagnoses: Diagnosis[];
  recommendations: string[];
  warnings: string[];
  isthScore?: ISTHScore;
  hit4TScore?: Hit4TScore;
}

export interface MedicationContext {
  warfarin: boolean;
  heparin: boolean;
  lmwh: boolean;
  doac: boolean;
  antiplatelet: boolean;
}

export interface AppState {
  labInput: LabInput;
  medications: MedicationContext;
  hit4TCriteria: Hit4TCriteria;
  interpretation: ClinicalInterpretation | null;
  factors: Record<string, Factor>;
  mode: 'basic' | 'clinical';
  hoveredFactor: string | null;
}
