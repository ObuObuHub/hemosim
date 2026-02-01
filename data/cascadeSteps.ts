// data/cascadeSteps.ts

/**
 * Cascade step definitions for Auto/Manual mode
 * Based on the Hoffman-Monroe cellular model of coagulation
 *
 * IMPORTANT: Instructions describe BIOCHEMICAL EVENTS, not UI actions.
 * ❌ "Apasă pe FVII pentru a forma complexul"
 * ✅ "Factorul VII din plasmă se leagă de Factorul tisular (FT)"
 */

export type PlayMode = 'manual' | 'auto';

export interface CascadeStep {
  id: string;
  instruction: string;      // Romanian biochemical description
  actionKey: string;        // Maps to state action in TwoFrameGame
  isAutomatic: boolean;     // Auto-triggered vs user-triggered in manual mode
  delayMs: number;          // Delay before this step executes in auto mode
  phase: 'initiation' | 'amplification' | 'propagation' | 'clotting';
}

/**
 * Complete cascade step sequence (24 steps)
 *
 * Phases per Panel:
 * - SparkFrame - Inițiere (Steps 1-5): TF-bearing cell surface
 * - ExplosionFrame - Amplificare (Steps 6-15): Platelet surface activation
 * - ExplosionFrame - Propagare (Steps 16-20): Complex formation and thrombin burst
 * - ExplosionFrame - Coagulare (Steps 21-24): Fibrin mesh stabilization
 */
export const cascadeSteps: CascadeStep[] = [
  // ============ INITIATION PHASE - SparkFrame (5 steps) ============
  {
    id: 'dock-tf-vii',
    instruction: 'Factorul VII din plasmă se leagă de Factorul tisular (FT) expus pe suprafața celulei',
    actionKey: 'TF+FVII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fix',
    instruction: 'Complexul TF-VIIa activează FIX prin clivaj proteolitic',
    actionKey: 'FIX',
    isAutomatic: false,
    delayMs: 3000,
    phase: 'initiation',
  },
  {
    id: 'dock-fx',
    instruction: 'TF-VIIa activează FX - formarea enzimei active FXa',
    actionKey: 'FX',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fv',
    instruction: 'FVa se leagă de FXa formând complexul Protrombinază',
    actionKey: 'FV',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fii',
    instruction: 'Protrombinaza convertește protrombina (FII) în trombină (FIIa)',
    actionKey: 'FII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },

  // ============ AMPLIFICATION PHASE - ExplosionFrame (10 steps) ============
  {
    id: 'thrombin-arrives',
    instruction: 'Trombina migrează spre suprafața trombocitului',
    actionKey: 'THROMBIN_ARRIVES',
    isAutomatic: true,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'par-bind',
    instruction: 'Trombina se leagă de receptorul PAR1',
    actionKey: 'PAR_BIND',
    isAutomatic: true,
    delayMs: 1500,
    phase: 'amplification',
  },
  {
    id: 'par-cleave',
    instruction: 'Trombina clivează receptorul PAR1 al trombocitului',
    actionKey: 'PAR_CLEAVE',
    isAutomatic: false,
    delayMs: 2000,
    phase: 'amplification',
  },
  {
    id: 'par-activate',
    instruction: 'PAR1 activat transmite semnalul de activare intracelular',
    actionKey: 'PAR_ACTIVATE',
    isAutomatic: true,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'split-vwf',
    instruction: 'Trombina eliberează FVIII din complexul vWF-FVIII',
    actionKey: 'vWF-VIII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'activate-fv',
    instruction: 'Trombina activează FV → FVa',
    actionKey: 'FV_AMP',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'activate-fxi',
    instruction: 'Trombina activează FXI → FXIa (buclă feedback pozitiv)',
    actionKey: 'FXI',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'amplification',
  },
  {
    id: 'platelet-activate',
    instruction: 'Trombocitul se activează și expune fosfatidilserină',
    actionKey: 'PLATELET_ACTIVATE',
    isAutomatic: true,
    delayMs: 2000,
    phase: 'amplification',
  },
  {
    id: 'dock-fva',
    instruction: 'FVa se ancorează pe membrana trombocitului activat',
    actionKey: 'DOCK_FVA',
    isAutomatic: true,
    delayMs: 2000,
    phase: 'amplification',
  },
  {
    id: 'dock-fviiia',
    instruction: 'FVIIIa se ancorează pe membrana trombocitului activat',
    actionKey: 'DOCK_FVIIIA',
    isAutomatic: true,
    delayMs: 2000,
    phase: 'amplification',
  },

  // ============ PROPAGATION PHASE - ExplosionFrame (5 steps) ============
  {
    id: 'fixa-arrives',
    instruction: 'FIXa sosește de la celula care exprimă FT',
    actionKey: 'FIXA_ARRIVES',
    isAutomatic: true,
    delayMs: 1500,
    phase: 'propagation',
  },
  {
    id: 'form-tenase',
    instruction: 'FIXa + FVIIIa formează complexul Tenază pe suprafața trombocitului',
    actionKey: 'TENASE',
    isAutomatic: false,
    delayMs: 3000,
    phase: 'propagation',
  },
  {
    id: 'produce-fxa',
    instruction: 'Tenaza convertește FX → FXa (amplificare ×200.000)',
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
    instruction: 'Explozia de trombină: generarea masivă de trombină',
    actionKey: 'BURST',
    isAutomatic: false,
    delayMs: 10000,
    phase: 'propagation',
  },

  // ============ CLOTTING PHASE - ExplosionFrame (4 steps) ============
  {
    id: 'cleave-fibrinogen',
    instruction: 'Trombina clivează fibrinogenul eliberând fibrinopeptidele A și B',
    actionKey: 'FIBRINOGEN_CLEAVE',
    isAutomatic: true,
    delayMs: 8000,
    phase: 'clotting',
  },
  {
    id: 'polymerize-fibrin',
    instruction: 'Monomerii de fibrină se autoasamblează în protofibrile',
    actionKey: 'FIBRIN_POLYMERIZE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'clotting',
  },
  {
    id: 'activate-fxiii',
    instruction: 'Trombina activează FXIII → FXIIIa',
    actionKey: 'FXIII_ACTIVATE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'clotting',
  },
  {
    id: 'crosslink-fibrin',
    instruction: 'FXIIIa formează legături covalente între fibrele de fibrină',
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

// =============================================================================
// PANEL-SPECIFIC HELPER FUNCTIONS
// =============================================================================

/** Step ranges per panel */
const PANEL_RANGES = {
  spark: { start: 0, end: 4 },     // 5 steps (Initiation)
  platelet: { start: 5, end: 23 }, // 19 steps (Amplification + Propagation + Clotting)
} as const;

export type PanelId = 'spark' | 'platelet';

/**
 * Get all steps for a specific panel
 */
export function getStepsForPanel(panelId: PanelId): CascadeStep[] {
  const range = PANEL_RANGES[panelId];
  return cascadeSteps.slice(range.start, range.end + 1);
}

/**
 * Get the number of steps for a specific panel
 */
export function getPanelStepCount(panelId: PanelId): number {
  const range = PANEL_RANGES[panelId];
  return range.end - range.start + 1;
}

/**
 * Convert a global step index to panel-local index
 * Returns -1 if the step doesn't belong to the specified panel
 */
export function getLocalStepIndex(panelId: PanelId, globalIndex: number): number {
  const range = PANEL_RANGES[panelId];
  if (globalIndex < range.start || globalIndex > range.end) {
    return -1;
  }
  return globalIndex - range.start;
}

/**
 * Convert a panel-local step index to global index
 */
export function getGlobalStepIndex(panelId: PanelId, localIndex: number): number {
  const range = PANEL_RANGES[panelId];
  return range.start + localIndex;
}

/**
 * Check if a global step index belongs to a specific panel
 */
export function isStepInPanel(panelId: PanelId, globalIndex: number): boolean {
  const range = PANEL_RANGES[panelId];
  return globalIndex >= range.start && globalIndex <= range.end;
}

/**
 * Get the phase name for a platelet panel step (based on local index)
 */
export function getPlateletPhaseName(localIndex: number): string {
  if (localIndex < 0) return 'Inactiv';
  if (localIndex < 10) return 'Amplificare';  // Steps 0-9 locally (5-14 globally)
  if (localIndex < 15) return 'Propagare';    // Steps 10-14 locally (15-19 globally)
  return 'Coagulare';                          // Steps 15-18 locally (20-23 globally)
}
