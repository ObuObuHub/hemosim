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
    instruction: 'În urma lezării vasculare, factorul tisular (FT) devine expus pe suprafața celulei exprimante de FT. FVII se leagă de FT și se formează complexul enzimatic FT–FVIIa, ancorat pe membrană.',
    actionKey: 'TF+FVII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fix',
    instruction: 'Complexul FT–FVIIa activează proteolitic factorul IX: FIX → FIXa (IXa). FIXa este generat în zona FT și poate contribui ulterior la formarea complexului tenazei intrinseci pe suprafața plachetară.',
    actionKey: 'FIX',
    isAutomatic: false,
    delayMs: 3000,
    phase: 'initiation',
  },
  {
    id: 'dock-fx',
    instruction: 'În paralel, FT–FVIIa activează proteolitic factorul X: FX → FXa (Xa), predominant local, la nivelul aceleiași suprafețe celulare.',
    actionKey: 'FX',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fv',
    instruction: 'FXa se asociază cu FVa (cofactor disponibil în cantități mici sau activat local), formând un complex protrombinazic (Xa–Va).',
    actionKey: 'FV',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },
  {
    id: 'dock-fii',
    instruction: 'Complexul protrombinazic incipient (Xa–Va) catalizează conversia protrombinei (FII) în trombină (FIIa), generând o cantitate mică de trombină de inițiere („scânteia" de trombină) care declanșează faza următoare.',
    actionKey: 'FII',
    isAutomatic: false,
    delayMs: 2500,
    phase: 'initiation',
  },

  // ============ AMPLIFICATION PHASE - ExplosionFrame (10 steps) ============
  {
    id: 'thrombin-arrives',
    instruction: 'Cantități infime de trombină (FIIa) ajung la trombocit și declanșează faza de amplificare, activând receptorii PAR (receptori activați de protează) prin clivaj proteolitic.',
    actionKey: 'THROMBIN_ARRIVES',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'amplification',
  },
  {
    id: 'par-bind',
    instruction: 'Cantități infime de trombină (FIIa) ajung la trombocit și declanșează faza de amplificare, activând receptorii PAR (receptori activați de protează) prin clivaj proteolitic.',
    actionKey: 'PAR_BIND',
    isAutomatic: true,
    delayMs: 4000,
    phase: 'amplification',
  },
  {
    id: 'par-cleave',
    instruction: 'Trombina se leagă de receptorul PAR1 și îl clivează proteolitic, expunând domeniul de activare.',
    actionKey: 'PAR_CLEAVE',
    isAutomatic: false,
    delayMs: 3000,
    phase: 'amplification',
  },
  {
    id: 'par-activate',
    instruction: 'Activarea PAR declanșează semnalizare trombocitară (↑Ca²⁺ intracelular), cu modificare de formă, degranulare și pregătirea suprafeței procoagulante.',
    actionKey: 'PAR_ACTIVATE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'amplification',
  },
  {
    id: 'split-vwf',
    instruction: 'La locul hemostazei, trombina eliberează FVIII din complexul cu vWF și îl face disponibil pentru activare și funcție de cofactor. vWF are rol protectiv pentru FVIII: îl transportă și îl protejează în plasmă.',
    actionKey: 'vWF-VIII',
    isAutomatic: false,
    delayMs: 4000,
    phase: 'amplification',
  },
  {
    id: 'activate-fv',
    instruction: 'Trombina activează factorul V: FV → FVa, cofactor esențial pentru formarea protrombinazei.',
    actionKey: 'FV_AMP',
    isAutomatic: false,
    delayMs: 3500,
    phase: 'amplification',
  },
  {
    id: 'platelet-activate',
    instruction: 'Trombocitul activat devine procoagulant: expune fosfatidilserină (PS) pe fața externă a membranei, furnizând platforma pentru asamblarea complexelor de coagulare.',
    actionKey: 'PLATELET_ACTIVATE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'amplification',
  },
  {
    id: 'dock-fva',
    instruction: 'FVa se fixează pe membrana trombocitară activată, pregătind formarea protrombinazei (Xa–Va) în faza de propagare.',
    actionKey: 'DOCK_FVA',
    isAutomatic: true,
    delayMs: 4000,
    phase: 'amplification',
  },
  {
    id: 'activate-fxi',
    instruction: 'Pe suprafața trombocitului activat, trombina activează factorul XI: FXI → FXIa, amplificând ulterior generarea de FIXa.',
    actionKey: 'FXI',
    isAutomatic: false,
    delayMs: 3500,
    phase: 'amplification',
  },
  {
    id: 'dock-fviiia',
    instruction: 'FVIIIa se fixează pe membrana trombocitară activată, pregătind asamblarea tenazei intrinseci (IXa–VIIIa) în faza de propagare.',
    actionKey: 'DOCK_FVIIIA',
    isAutomatic: true,
    delayMs: 4000,
    phase: 'amplification',
  },

  // ============ PROPAGATION PHASE - ExplosionFrame (5 steps) ============
  {
    id: 'fixa-arrives',
    instruction: 'FIXa (generat în inițiere și amplificat ulterior prin FXIa) ajunge pe suprafața trombocitului activat, unde devine disponibil pentru asamblarea tenazei.',
    actionKey: 'FIXA_ARRIVES',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'propagation',
  },
  {
    id: 'form-tenase',
    instruction: 'Pe membrana trombocitară bogată în fosfatidilserină (PS), în prezența Ca²⁺, FIXa se asociază cu FVIIIa, formând complexul tenazei intrinseci (IXa–VIIIa).',
    actionKey: 'TENASE',
    isAutomatic: false,
    delayMs: 5000,
    phase: 'propagation',
  },
  {
    id: 'produce-fxa',
    instruction: 'Tenaza intrinsecă activează eficient FX → FXa, generând cantități mari de FXa pe suprafața trombocitară.',
    actionKey: 'PRODUCE_FXA',
    isAutomatic: false,
    delayMs: 4000,
    phase: 'propagation',
  },
  {
    id: 'form-prothrombinase',
    instruction: 'FXa se asociază cu FVa pe membrana trombocitară, formând complexul protrombinazei (Xa–Va).',
    actionKey: 'PROTHROMBINASE',
    isAutomatic: false,
    delayMs: 5000,
    phase: 'propagation',
  },
  {
    id: 'thrombin-burst',
    instruction: 'Protrombinaza (Xa–Va) convertește rapid FII → FIIa, rezultând „explozia" de trombină (thrombin burst) care susține formarea cheagului.',
    actionKey: 'BURST',
    isAutomatic: false,
    delayMs: 10000,
    phase: 'propagation',
  },

  // ============ CLOTTING PHASE - ExplosionFrame (4 steps) ============
  {
    id: 'cleave-fibrinogen',
    instruction: 'Trombina (FIIa) clivează fibrinogenul (FI), eliberând fibrinopeptide și formând monomeri de fibrină.',
    actionKey: 'FIBRINOGEN_CLEAVE',
    isAutomatic: true,
    delayMs: 8000,
    phase: 'clotting',
  },
  {
    id: 'polymerize-fibrin',
    instruction: 'Monomerii de fibrină se asociază spontan și formează o rețea prin polimerizare (fibrină inițial ne-stabilizată).',
    actionKey: 'FIBRIN_POLYMERIZE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'clotting',
  },
  {
    id: 'activate-fxiii',
    instruction: 'Trombina activează factorul XIII: FXIII → FXIIIa (în prezența Ca²⁺), pregătind stabilizarea cheagului.',
    actionKey: 'FXIII_ACTIVATE',
    isAutomatic: true,
    delayMs: 5000,
    phase: 'clotting',
  },
  {
    id: 'crosslink-fibrin',
    instruction: 'FXIIIa leagă covalent fibrele de fibrină, stabilizând cheagul.',
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
    fviiiaDocked: boolean;
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
  // All Amplification factors must be assembled before Propagation
  if (explosion.fixaArrived && explosion.fviiiaDocked && explosion.fvaDocked && explosion.fxiActivated) return 16; // Waiting for tenase

  // Amplification phase (steps 6-15)
  // New order: platelet-activate(11) → dock-fva(12) → activate-fxi(13) → dock-fviiia(14)
  if (explosion.fviiiaDocked) return 15;
  if (explosion.fxiActivated) return 14;
  if (explosion.fvaDocked) return 13;
  if (explosion.plateletActivated) return 12;
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
