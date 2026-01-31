// data/cascadeSteps.ts

/**
 * Cascade step definitions for Auto/Manual mode
 * Based on the Hoffman-Monroe cellular model of coagulation
 */

export type PlayMode = 'manual' | 'auto';

export interface CascadeStep {
  id: string;
  instruction: string;      // Romanian text for instruction banner
  actionKey: string;        // Maps to state action in TwoFrameGame
  isAutomatic: boolean;     // Auto-triggered vs user-triggered in manual mode
  delayMs: number;          // Delay before this step executes in auto mode
  phase: 'initiation' | 'amplification' | 'propagation' | 'clotting';
}

/**
 * Complete cascade step sequence (24 steps)
 *
 * Phases:
 * - Initiation (Steps 1-5): TF-bearing cell surface
 * - Amplification (Steps 6-15): Platelet surface activation
 * - Propagation (Steps 16-20): Complex formation and thrombin burst
 * - Clotting (Steps 21-24): Fibrin mesh stabilization
 */
export const cascadeSteps: CascadeStep[] = [
  // ============ INITIATION PHASE (Spark Frame) ============
  {
    id: 'dock-tf-vii',
    instruction: 'Apasă pe FVII pentru a forma complexul TF-VIIa',
    actionKey: 'TF+FVII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fix',
    instruction: 'Apasă pe FIX pentru activare - FIXa va migra către trombocit',
    actionKey: 'FIX',
    isAutomatic: false,
    delayMs: 3000,
    phase: 'initiation',
  },
  {
    id: 'dock-fx',
    instruction: 'Apasă pe FX pentru activare de către TF-VIIa',
    actionKey: 'FX',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fv',
    instruction: 'Apasă pe FV pentru a forma complexul Protrombinase',
    actionKey: 'FV',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fii',
    instruction: 'Apasă pe FII pentru a produce Trombină',
    actionKey: 'FII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },

  // ============ AMPLIFICATION PHASE (Explosion Frame) ============
  {
    id: 'thrombin-arrives',
    instruction: 'Trombina migrează către suprafața trombocitului...',
    actionKey: 'THROMBIN_ARRIVES',
    isAutomatic: true,
    delayMs: 2500, // Wait for thrombin migration animation
    phase: 'amplification',
  },
  {
    id: 'par-bind',
    instruction: 'Trombina se leagă de receptorul PAR1...',
    actionKey: 'PAR_BIND',
    isAutomatic: true,
    delayMs: 1500,
    phase: 'amplification',
  },
  {
    id: 'par-cleave',
    instruction: 'Apasă pe receptorul PAR1 pentru clivare',
    actionKey: 'PAR_CLEAVE',
    isAutomatic: false,
    delayMs: 2000,
    phase: 'amplification',
  },
  {
    id: 'par-activate',
    instruction: 'PAR1 se activează și transmite semnalul...',
    actionKey: 'PAR_ACTIVATE',
    isAutomatic: true,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'split-vwf',
    instruction: 'Apasă pe complexul vWF-FVIII pentru a elibera FVIII',
    actionKey: 'vWF-VIII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'activate-fv',
    instruction: 'Apasă pe FV pentru activare',
    actionKey: 'FV_AMP',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'activate-fxi',
    instruction: 'Apasă pe FXI pentru activare (buclă feedback pozitiv)',
    actionKey: 'FXI',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'platelet-activate',
    instruction: 'Trombocitul se activează și expune fosfolipide...',
    actionKey: 'PLATELET_ACTIVATE',
    isAutomatic: true,
    delayMs: 2000,
    phase: 'amplification',
  },
  {
    id: 'dock-fva',
    instruction: 'FVa se ancorează pe membrana trombocitului...',
    actionKey: 'DOCK_FVA',
    isAutomatic: true,
    delayMs: 2000,
    phase: 'amplification',
  },
  {
    id: 'dock-fviiia',
    instruction: 'FVIIIa se ancorează pe membrana trombocitului...',
    actionKey: 'DOCK_FVIIIA',
    isAutomatic: true,
    delayMs: 2000,
    phase: 'amplification',
  },

  // ============ PROPAGATION PHASE (Explosion Frame) ============
  {
    id: 'fixa-arrives',
    instruction: 'FIXa sosește de la faza de inițiere...',
    actionKey: 'FIXA_ARRIVES',
    isAutomatic: true,
    delayMs: 1500,
    phase: 'propagation',
  },
  {
    id: 'form-tenase',
    instruction: 'Apasă pentru a forma complexul Tenase (FIXa + FVIIIa)',
    actionKey: 'TENASE',
    isAutomatic: false,
    delayMs: 3000,
    phase: 'propagation',
  },
  {
    id: 'produce-fxa',
    instruction: 'Tenase convertește FX → FXa (×200.000 amplificare)',
    actionKey: 'PRODUCE_FXA',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'propagation',
  },
  {
    id: 'form-prothrombinase',
    instruction: 'FXa + FVa formează complexul Protrombinază',
    actionKey: 'PROTHROMBINASE',
    isAutomatic: false,
    delayMs: 3000,
    phase: 'propagation',
  },
  {
    id: 'thrombin-burst',
    instruction: 'Apasă pentru a genera explozia de trombină! (×300.000)',
    actionKey: 'BURST',
    isAutomatic: false,
    delayMs: 10000,
    phase: 'propagation',
  },

  // ============ CLOTTING PHASE (Fibrin Formation) ============
  {
    id: 'cleave-fibrinogen',
    instruction: 'Trombina clivează fibrinogenul în monomeri de fibrină...',
    actionKey: 'FIBRINOGEN_CLEAVE',
    isAutomatic: true,
    delayMs: 8000,
    phase: 'clotting',
  },
  {
    id: 'polymerize-fibrin',
    instruction: 'Monomerii de fibrină se autoasamblează în protofibrile...',
    actionKey: 'FIBRIN_POLYMERIZE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'clotting',
  },
  {
    id: 'activate-fxiii',
    instruction: 'Trombina activează FXIII pentru stabilizarea cheagului...',
    actionKey: 'FXIII_ACTIVATE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'clotting',
  },
  {
    id: 'crosslink-fibrin',
    instruction: 'Apasă pentru a forma legături covalente între fibrele de fibrină',
    actionKey: 'FIBRIN_CROSSLINK',
    isAutomatic: false,
    delayMs: 6000,
    phase: 'clotting',
  },
];

/**
 * Get the current step index based on cascade state
 * Returns -1 if cascade hasn't started, or steps.length if complete
 */
export function getCurrentStepIndex(state: {
  spark: {
    tfVIIaDocked: boolean;
    fixDocked: boolean;
    fxDocked: boolean;
    fvDocked: boolean;
    fiiDocked: boolean;
    thrombinProduced: boolean;
  };
  explosion: {
    thrombinArrived: boolean;
    parCleavageState: 'intact' | 'thrombin-bound' | 'cleaved' | 'activated';
    vwfSplit: boolean;
    fvActivated: boolean;
    fxiActivated: boolean;
    plateletActivated: boolean;
    fvaDocked: boolean;
    fviiaDocked: boolean;
    fixaArrived: boolean;
    tenaseFormed: boolean;
    fxaProduced: boolean;
    prothrombinaseFormed: boolean;
    thrombinBurst: boolean;
    fibrinogenCleaved: boolean;
    fibrinPolymerized: boolean;
    fxiiiActivated: boolean;
    fibrinCrosslinked: boolean;
  };
}): number {
  const { spark, explosion } = state;

  // Work backwards from the end to find current step
  // Clotting phase (steps 21-24)
  if (explosion.fibrinCrosslinked) return cascadeSteps.length; // Complete (stable clot)
  if (explosion.fxiiiActivated) return 23; // Waiting for crosslink
  if (explosion.fibrinPolymerized) return 22; // Waiting for FXIII activation
  if (explosion.fibrinogenCleaved) return 21; // Waiting for polymerization

  // Propagation phase (steps 16-20)
  if (explosion.thrombinBurst) return 20; // Waiting for fibrinogen cleavage
  if (explosion.prothrombinaseFormed) return 19; // Waiting for burst
  if (explosion.fxaProduced) return 18; // Waiting for prothrombinase
  if (explosion.tenaseFormed) return 17; // Waiting for FXa production
  if (explosion.fixaArrived && explosion.fviiaDocked && explosion.fvaDocked) return 16; // Waiting for tenase

  // Amplification phase (steps 6-15)
  if (explosion.fviiaDocked) return 15;
  if (explosion.fvaDocked) return 14;
  if (explosion.plateletActivated) return 13;
  if (explosion.fxiActivated) return 12;
  if (explosion.fvActivated) return 11;
  if (explosion.vwfSplit) return 10;
  if (explosion.parCleavageState === 'activated') return 9;
  if (explosion.parCleavageState === 'cleaved') return 8;
  if (explosion.parCleavageState === 'thrombin-bound') return 7;
  if (explosion.thrombinArrived) return 6;

  // Initiation phase (steps 1-5)
  if (spark.fiiDocked || spark.thrombinProduced) return 5;
  if (spark.fvDocked) return 4;
  if (spark.fxDocked) return 3;
  if (spark.fixDocked) return 2;
  if (spark.tfVIIaDocked) return 1;

  return 0; // Ready for first step
}

/**
 * Get the step that should be shown to the user
 * (the next step to execute)
 */
export function getNextStep(stepIndex: number): CascadeStep | null {
  if (stepIndex >= 0 && stepIndex < cascadeSteps.length) {
    return cascadeSteps[stepIndex];
  }
  return null;
}

/**
 * Calculate total auto-play duration
 */
export function getTotalAutoPlayDuration(): number {
  return cascadeSteps.reduce((total, step) => total + step.delayMs, 0);
}
