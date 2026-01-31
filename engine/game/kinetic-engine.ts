// engine/game/kinetic-engine.ts
/**
 * Kinetic Engine for Realistic Coagulation Simulation
 *
 * Based on the Hoffman-Monroe cell-based model of coagulation.
 * This engine simulates the Initiation phase kinetics including:
 * - TF-VIIa complex formation
 * - FXa and FIXa production
 * - FIXa diffusion to platelet
 * - Prothrombinase formation (FXa + trace Va)
 * - Thrombin spark generation
 * - TFPI inhibition of TF-VIIa
 * - Feedback activation (thrombin activates V, VIII)
 *
 * All rates are simplified for educational visualization purposes.
 */

import type { KineticState } from '@/types/game';

// =============================================================================
// KINETIC CONSTANTS (simplified for visualization)
// =============================================================================

export const KINETIC_CONSTANTS = {
  // Formation rates (units/second)
  TF_VIIA_FORMATION_RATE: 8.0,      // How fast TF-VIIa forms when FVII is present
  FXA_PRODUCTION_RATE: 4.0,          // FXa production rate when TF-VIIa active
  FIXA_PRODUCTION_RATE: 3.0,         // FIXa production rate when TF-VIIa active
  FIXA_DIFFUSION_RATE: 2.0,          // FIXa diffusion rate toward platelet
  THROMBIN_PRODUCTION_RATE: 2.5,     // Thrombin production when prothrombinase formed

  // Thresholds (concentration levels)
  TF_VIIA_THRESHOLD: 20,             // TF-VIIa level to start producing factors
  FXA_THRESHOLD_FOR_PROTHROMBINASE: 15, // FXa needed for prothrombinase
  FXA_THRESHOLD_FOR_TFPI: 30,        // FXa level that triggers TFPI activation
  THROMBIN_THRESHOLD_FOR_FEEDBACK: 10, // Thrombin level to activate V, VIII
  THROMBIN_THRESHOLD_FOR_HANDOFF: 25, // Thrombin level for platelet handoff
  FIXA_DIFFUSION_THRESHOLD: 20,      // FIXa level before it starts diffusing

  // TFPI inhibition
  TFPI_INHIBITION_RATE: 0.15,        // How fast TFPI inhibits TF-VIIa (per second)
  TFPI_INHIBITION_DELAY: 2.0,        // Seconds after FXa threshold before TFPI kicks in

  // Trace Va
  TRACE_VA_LEVEL: 5,                 // Constant trace Va (always present)

  // Maximum concentrations
  MAX_TF_VIIA: 100,
  MAX_FXA: 100,
  MAX_FIXA: 100,
  MAX_THROMBIN: 50,                  // Initiation produces limited thrombin
  MAX_FIXA_DIFFUSED: 100,
} as const;

// =============================================================================
// KINETIC UPDATE FUNCTION
// =============================================================================

export interface KineticUpdateResult {
  state: KineticState;
  events: KineticEvent[];
}

export type KineticEvent =
  | { type: 'TF_EXPOSED' }
  | { type: 'TF_VIIA_FORMED' }
  | { type: 'FXA_PRODUCED'; amount: number }
  | { type: 'FIXA_PRODUCED'; amount: number }
  | { type: 'FIXA_DIFFUSING' }
  | { type: 'PROTHROMBINASE_FORMED' }
  | { type: 'THROMBIN_SPARK'; concentration: number }
  | { type: 'TFPI_ACTIVATED' }
  | { type: 'TF_VIIA_INHIBITED' }
  | { type: 'FEEDBACK_V_ACTIVATED' }
  | { type: 'FEEDBACK_VIII_ACTIVATED' }
  | { type: 'PLATELET_READY_FOR_HANDOFF' };

/**
 * Updates kinetic state based on elapsed time
 * This is the core simulation loop for the Initiation phase
 */
export function updateKinetics(
  currentState: KineticState,
  deltaTime: number,
  hasPlayerDockedFVII: boolean,
  hasPlayerDockedFX: boolean,
  hasPlayerDockedFV: boolean,
  hasPlayerDockedFII: boolean
): KineticUpdateResult {
  const events: KineticEvent[] = [];
  const state = { ...currentState };

  // Update elapsed time
  state.elapsedTime += deltaTime;

  // If TF not exposed, nothing happens
  if (!state.isTFExposed) {
    return { state, events };
  }

  // ==========================================================================
  // STEP 1: TF-VIIa Formation (requires FVII from bloodstream or player docking)
  // ==========================================================================
  if (hasPlayerDockedFVII && !state.isTFVIIaActive) {
    state.tfVIIaComplex = Math.min(
      state.tfVIIaComplex + KINETIC_CONSTANTS.TF_VIIA_FORMATION_RATE * deltaTime,
      KINETIC_CONSTANTS.MAX_TF_VIIA
    );

    if (state.tfVIIaComplex >= KINETIC_CONSTANTS.TF_VIIA_THRESHOLD && !state.isTFVIIaActive) {
      state.isTFVIIaActive = true;
      events.push({ type: 'TF_VIIA_FORMED' });
    }
  }

  // If TFPI has fully inhibited TF-VIIa, stop production
  if (state.isTFPIActivated && state.tfpiInhibition >= 1) {
    state.isTFVIIaActive = false;
  }

  // ==========================================================================
  // STEP 2: FXa and FIXa Production (TF-VIIa activates both)
  // ==========================================================================
  if (state.isTFVIIaActive && state.tfpiInhibition < 1) {
    const productionMultiplier = 1 - state.tfpiInhibition; // Reduced by TFPI inhibition

    // FXa production (requires player to dock FX OR auto-production)
    if (hasPlayerDockedFX || state.fxaLocal > 0) {
      const fxaIncrease = KINETIC_CONSTANTS.FXA_PRODUCTION_RATE * deltaTime * productionMultiplier;
      const prevFxa = state.fxaLocal;
      state.fxaLocal = Math.min(
        state.fxaLocal + fxaIncrease,
        KINETIC_CONSTANTS.MAX_FXA
      );
      if (fxaIncrease > 0) {
        events.push({ type: 'FXA_PRODUCED', amount: state.fxaLocal - prevFxa });
      }
    }

    // FIXa production (always happens when TF-VIIa is active)
    const fixaIncrease = KINETIC_CONSTANTS.FIXA_PRODUCTION_RATE * deltaTime * productionMultiplier;
    const prevFixa = state.fixaLocal;
    state.fixaLocal = Math.min(
      state.fixaLocal + fixaIncrease,
      KINETIC_CONSTANTS.MAX_FIXA
    );
    if (fixaIncrease > 0 && state.fixaLocal > prevFixa) {
      events.push({ type: 'FIXA_PRODUCED', amount: state.fixaLocal - prevFixa });
    }
  }

  // ==========================================================================
  // STEP 3: FIXa Diffusion to Platelet (messenger function)
  // ==========================================================================
  if (state.fixaLocal >= KINETIC_CONSTANTS.FIXA_DIFFUSION_THRESHOLD) {
    const diffusionAmount = KINETIC_CONSTANTS.FIXA_DIFFUSION_RATE * deltaTime;
    const prevDiffused = state.fixaDiffused;
    state.fixaDiffused = Math.min(
      state.fixaDiffused + diffusionAmount,
      KINETIC_CONSTANTS.MAX_FIXA_DIFFUSED
    );
    if (state.fixaDiffused > prevDiffused && Math.floor(state.fixaDiffused / 10) > Math.floor(prevDiffused / 10)) {
      events.push({ type: 'FIXA_DIFFUSING' });
    }
  }

  // ==========================================================================
  // STEP 4: Prothrombinase Formation (FXa + trace Va)
  // ==========================================================================
  if (
    state.fxaLocal >= KINETIC_CONSTANTS.FXA_THRESHOLD_FOR_PROTHROMBINASE &&
    state.traceVa >= KINETIC_CONSTANTS.TRACE_VA_LEVEL &&
    !state.isProthrombinaseFormed &&
    (hasPlayerDockedFV || state.fxaLocal >= 30) // Either player docks FV or sufficient FXa
  ) {
    state.isProthrombinaseFormed = true;
    events.push({ type: 'PROTHROMBINASE_FORMED' });
  }

  // ==========================================================================
  // STEP 5: Thrombin Spark Production (via minimal prothrombinase)
  // ==========================================================================
  if (state.isProthrombinaseFormed && (hasPlayerDockedFII || state.thrombinSpark > 0)) {
    const prevThrombin = state.thrombinSpark;
    state.thrombinSpark = Math.min(
      state.thrombinSpark + KINETIC_CONSTANTS.THROMBIN_PRODUCTION_RATE * deltaTime,
      KINETIC_CONSTANTS.MAX_THROMBIN
    );
    if (state.thrombinSpark > prevThrombin) {
      events.push({ type: 'THROMBIN_SPARK', concentration: state.thrombinSpark });
    }
  }

  // ==========================================================================
  // STEP 6: TFPI Activation (triggered by FXa accumulation)
  // ==========================================================================
  if (
    state.fxaLocal >= KINETIC_CONSTANTS.FXA_THRESHOLD_FOR_TFPI &&
    !state.isTFPIActivated
  ) {
    state.isTFPIActivated = true;
    events.push({ type: 'TFPI_ACTIVATED' });
  }

  // Progressive TFPI inhibition of TF-VIIa
  if (state.isTFPIActivated && state.tfpiInhibition < 1) {
    state.tfpiInhibition = Math.min(
      state.tfpiInhibition + KINETIC_CONSTANTS.TFPI_INHIBITION_RATE * deltaTime,
      1
    );
    if (state.tfpiInhibition >= 1) {
      events.push({ type: 'TF_VIIA_INHIBITED' });
    }
  }

  // ==========================================================================
  // STEP 7: Thrombin Feedback (activates V and VIII)
  // ==========================================================================
  if (state.thrombinSpark >= KINETIC_CONSTANTS.THROMBIN_THRESHOLD_FOR_FEEDBACK) {
    if (!state.feedbackVActivated) {
      state.feedbackVActivated = true;
      events.push({ type: 'FEEDBACK_V_ACTIVATED' });
    }
    if (!state.feedbackVIIIActivated) {
      state.feedbackVIIIActivated = true;
      events.push({ type: 'FEEDBACK_VIII_ACTIVATED' });
    }
  }

  // ==========================================================================
  // STEP 8: Platelet Ready for Handoff
  // ==========================================================================
  if (
    state.thrombinSpark >= KINETIC_CONSTANTS.THROMBIN_THRESHOLD_FOR_HANDOFF &&
    state.fixaDiffused >= 50 &&
    !state.isPlateletReady
  ) {
    state.isPlateletReady = true;
    events.push({ type: 'PLATELET_READY_FOR_HANDOFF' });
  }

  return { state, events };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Exposes TF (simulates injury)
 */
export function exposeTF(state: KineticState): KineticState {
  return {
    ...state,
    isTFExposed: true,
  };
}

/**
 * Checks if initiation phase is complete (ready for amplification)
 */
export function isInitiationComplete(state: KineticState): boolean {
  return (
    state.isPlateletReady &&
    state.isTFPIActivated &&
    state.tfpiInhibition >= 0.8 // TF-VIIa mostly inhibited
  );
}

/**
 * Gets display value for thrombin spark (nM approximation)
 */
export function getThrombinSparkDisplay(concentration: number): string {
  // Convert relative units to approximate nM (0-100 → 0-5 nM range for initiation)
  const nM = (concentration / 100) * 5;
  return nM.toFixed(1);
}

/**
 * Gets TFPI inhibition percentage for display
 */
export function getTFPIInhibitionDisplay(inhibition: number): number {
  return Math.round(inhibition * 100);
}
