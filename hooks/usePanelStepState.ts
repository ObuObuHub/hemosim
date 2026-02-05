// hooks/usePanelStepState.ts
// Panel-specific step state calculation for biochemical instruction banners

import { useMemo } from 'react';
import type { CascadeState } from './useCascadeState';
import type { CascadeStep } from '@/data/cascadeSteps';
import { cascadeSteps } from '@/data/cascadeSteps';

export type PanelId = 'spark' | 'platelet';

export interface PanelStepState {
  currentStep: CascadeStep | null;
  currentStepIndex: number;      // Index within the panel (0-based)
  totalSteps: number;            // Total steps for this panel
  isPanelComplete: boolean;
  isPanelActive: boolean;        // True when this panel is the active one
  phaseName: string;             // Human-readable phase name
}

/**
 * Step ranges per panel:
 * - SparkFrame (Inițiere): Steps 0-4 (global indices 0-4, 5 steps)
 * - ExplosionFrame: Steps 5-23 (global indices 5-23, 19 steps)
 *   - Amplificare: Steps 5-14 (10 steps)
 *   - Propagare: Steps 15-19 (5 steps)
 *   - Coagulare: Steps 20-23 (4 steps)
 */
const SPARK_STEPS = { start: 0, end: 4 }; // 5 steps total
const PLATELET_STEPS = { start: 5, end: 23 }; // 19 steps total

/**
 * Get the current step index for the Spark (Initiation) panel
 * Maps cascade state to the appropriate step within the initiation phase
 */
function getSparkStepIndex(state: CascadeState): number {
  const { initiation } = state;

  // Work backwards from completion
  if (initiation.thrombinProduced) return 5; // Complete - all 5 steps done
  if (initiation.fiiDocked) return 4; // Step 5: FII → FIIa done, waiting for thrombin production
  if (initiation.fvDocked) return 4;  // Step 5: FII activation pending
  if (initiation.fxDocked) return 3;  // Step 4: FV binding
  if (initiation.fixDocked) return 2; // Step 3: FX activation
  if (initiation.tfVIIaDocked) return 1; // Step 2: FIX activation

  return 0; // Step 1: TF-VIIa complex formation
}

/**
 * Get the current step index for the Platelet (Amplification + Propagation + Clotting) panel
 * Returns the index relative to the platelet panel (0-18)
 */
function getPlateletStepIndex(state: CascadeState): number {
  const { platelet, initiation } = state;

  // Panel not yet active (waiting for thrombin migration)
  if (!initiation.thrombinProduced) return -1;

  // Clotting phase (15-18 in panel terms, steps 20-23 globally)
  if (platelet.fibrinCrosslinked) return 19; // Complete
  if (platelet.fxiiiActivated) return 18;    // Step 24: Crosslinking
  if (platelet.fibrinPolymerized) return 17; // Step 23: FXIII activation
  if (platelet.fibrinogenCleaved) return 16; // Step 22: Polymerization

  // Propagation phase (10-14 in panel terms, steps 15-19 globally)
  if (platelet.thrombinBurst) return 15;         // Step 21: Fibrinogen cleavage
  if (platelet.prothrombinaseFormed) return 14;  // Step 20: Thrombin burst
  if (platelet.fxaProduced) return 13;           // Step 19: Prothrombinase formation
  if (platelet.tenaseFormed) return 12;          // Step 18: FXa production
  if (platelet.fixaArrived && platelet.fviiiaDocked && platelet.fvaDocked) return 11; // Step 17: Tenase formation

  // Amplification phase (0-9 in panel terms, steps 5-14 globally)
  if (platelet.fviiiaDocked) return 10;           // Step 16: FIXa arrives
  if (platelet.fvaDocked) return 9;              // Step 15: FVIIIa docks
  if (platelet.plateletActivated) return 8;      // Step 14: FVa docks
  if (platelet.fxiActivated) return 7;           // Step 13: Platelet activation
  if (platelet.fvActivated) return 6;            // Step 12: FXI activation
  if (platelet.vwfSplit) return 5;               // Step 11: FV activation
  if (platelet.parCleavageState === 'activated') return 4; // Step 10: vWF-FVIII split
  if (platelet.parCleavageState === 'cleaved') return 3;   // Step 9: PAR activation
  if (platelet.parCleavageState === 'thrombin-bound') return 2; // Step 8: PAR cleavage
  if (platelet.thrombinArrived) return 1;        // Step 7: PAR binding

  return 0; // Step 6: Thrombin arrival
}

/**
 * Get the phase name for a step index within the platelet panel
 */
function getPlateletPhaseName(panelStepIndex: number): string {
  if (panelStepIndex < 0) return 'Inactiv';
  if (panelStepIndex < 10) return 'Amplificare';
  if (panelStepIndex < 15) return 'Propagare';
  return 'Coagulare';
}

/**
 * Hook to calculate panel-specific step state
 *
 * Each panel has its own step progression and instruction display.
 * This hook computes the current step within a specific panel,
 * allowing each panel to show its relevant biochemical instruction.
 */
export function usePanelStepState(
  panelId: PanelId,
  cascadeState: CascadeState
): PanelStepState {
  return useMemo(() => {
    if (panelId === 'spark') {
      const stepIndex = getSparkStepIndex(cascadeState);
      const totalSteps = SPARK_STEPS.end - SPARK_STEPS.start + 1; // 5 steps
      const isPanelComplete = stepIndex >= totalSteps;

      // SparkFrame is active when thrombin hasn't been produced yet
      const isPanelActive = !cascadeState.initiation.thrombinProduced;

      // Get current step (global index)
      const globalIndex = Math.min(stepIndex, SPARK_STEPS.end);
      const currentStep = cascadeSteps[globalIndex] ?? null;

      return {
        currentStep,
        currentStepIndex: stepIndex,
        totalSteps,
        isPanelComplete,
        isPanelActive,
        phaseName: 'Inițiere',
      };
    } else {
      // Platelet panel
      const panelStepIndex = getPlateletStepIndex(cascadeState);
      const totalSteps = PLATELET_STEPS.end - PLATELET_STEPS.start + 1; // 19 steps
      const isPanelComplete = panelStepIndex >= totalSteps;

      // Platelet is active when thrombin has been produced and cascade is not complete
      const isPanelActive = cascadeState.initiation.thrombinProduced && !cascadeState.cascadeCompleted;

      // Get current step (global index)
      const globalIndex = panelStepIndex >= 0
        ? Math.min(PLATELET_STEPS.start + panelStepIndex, PLATELET_STEPS.end)
        : -1;
      const currentStep = globalIndex >= 0 ? cascadeSteps[globalIndex] ?? null : null;

      return {
        currentStep,
        currentStepIndex: panelStepIndex,
        totalSteps,
        isPanelComplete,
        isPanelActive,
        phaseName: getPlateletPhaseName(panelStepIndex),
      };
    }
  }, [panelId, cascadeState]);
}

/**
 * Get all steps for a specific panel
 */
export function getStepsForPanel(panelId: PanelId): CascadeStep[] {
  if (panelId === 'spark') {
    return cascadeSteps.slice(SPARK_STEPS.start, SPARK_STEPS.end + 1);
  }
  return cascadeSteps.slice(PLATELET_STEPS.start, PLATELET_STEPS.end + 1);
}

/**
 * Get the global step index from panel and local index
 */
export function getGlobalStepIndex(panelId: PanelId, localIndex: number): number {
  if (panelId === 'spark') {
    return SPARK_STEPS.start + localIndex;
  }
  return PLATELET_STEPS.start + localIndex;
}
