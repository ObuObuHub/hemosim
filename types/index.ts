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
  pathway: 'intrinsic' | 'extrinsic' | 'common' | 'platelet' | 'fibrinolysis' | 'anticoagulant' | 'clot';
  // Relații de inhibiție (pentru anticoagulanți naturali)
  inhibits?: string[];
  // Feedback pozitiv (pentru amplificarea trombinei)
  feedbackTargets?: string[];
  // Descriere clinică
  clinicalNote?: string;
  // Node care deschide o pagină de detalii (ex: PLT → hemostază primară)
  isClickable?: boolean;
  // Pentru forme activate (XIIa, Xa, etc.)
  isActivatedForm?: boolean;
  // Link către zimogen (pentru forme activate)
  zymogenId?: string;
  // Pentru complexe enzimă-cofactor
  isEnzyme?: boolean;
  isCofactor?: boolean;
  complexPartner?: string;
  complexName?: string;
  // Tipul de membrană pentru complexe (model celular)
  complexMembrane?: 'tfCell' | 'platelet';
}

export interface LabInput {
  pt: number;
  inr: number;
  aptt: number;
  apttMix?: number;  // aPTT după amestec cu plasmă normală (pentru indicele Rosner)
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

export interface ISTHManualCriteria {
  plateletCount: 0 | 1 | 2;
  dDimerLevel: 0 | 2 | 3;
  ptProlongation: 0 | 1 | 2;
  fibrinogenLevel: 0 | 1;
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
  doacXa: boolean;      // Apixaban, Rivaroxaban, Edoxaban
  doacIIa: boolean;     // Dabigatran
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
  currentScenario: string | null;
  factorConcentrations: InverseMappingResult | null;
  // Toggle-uri pentru vizualizare relații
  showFeedback: boolean;
  showInhibition: boolean;
}

// ============================================
// Inverse Mapping Types (Lab → Factor Concentrations)
// ============================================

/** Concentrația fiziologică a unui factor cu nivel de încredere */
export interface FactorConcentration {
  factorId: string;
  concentrationNm: number;      // Concentrație absolută în nM
  activityPercent: number;      // Relativ la normal (100% = normal)
  confidence: 'high' | 'moderate' | 'low';
}

/** Lab pattern detectat */
export type LabPattern =
  | 'normal'
  | 'aptt_isolated'      // aPTT prelungit, PT normal
  | 'pt_isolated'        // PT prelungit, aPTT normal
  | 'both_prolonged'     // PT și aPTT prelungite
  | 'tt_prolonged'       // TT prelungit
  | 'fibrinogen_low'     // Fibrinogen scăzut
  | 'platelets_low'      // Trombocitopenie
  | 'bleeding_time_long' // Timp sângerare prelungit
  | 'mixed';             // Pattern complex/nespecific

/** Rezultatul mapping-ului invers lab→factori */
export interface InverseMappingResult {
  concentrations: Record<string, FactorConcentration>;
  pattern: LabPattern;
  affectedPathway: 'intrinsic' | 'extrinsic' | 'common' | 'platelet' | 'mixed' | 'none';
  affectedFactors: string[];
  inhibitorSuspected: boolean;
  confidence: 'high' | 'moderate' | 'low';
  clinicalNotes: string[];
}

/** Context clinic pentru inferență îmbunătățită */
export interface ClinicalContext {
  knownDiagnosis?: string;
  familyHistory?: boolean;
  bleedingHistory?: 'none' | 'mild' | 'severe';
}
