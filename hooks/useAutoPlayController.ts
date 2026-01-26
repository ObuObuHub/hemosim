// hooks/useAutoPlayController.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cascadeSteps, type CascadeStep } from '@/data/cascadeSteps';

interface AutoPlayCallbacks {
  // Spark frame actions
  dockTFVIIa: () => void;
  dockFIX: () => void;
  dockFX: () => void;
  dockFV: () => void;
  dockFII: () => void;
  // Explosion frame actions
  activateVWFVIII: () => void;
  activateFV: () => void;
  activateFXI: () => void;
  parCleave: () => void;
  formTenase: () => void;
  produceFXa: () => void;
  formProthrombinase: () => void;
  triggerBurst: () => void;
  // Fibrin formation actions
  cleaveFibrinogen: () => void;
  polymerizeFibrin: () => void;
  activateFXIII: () => void;
  crosslinkFibrin: () => void;
  // Step tracking
  advanceStep: () => void;
}

interface UseAutoPlayControllerProps {
  isActive: boolean;
  currentStepIndex: number;
  callbacks: AutoPlayCallbacks;
}

/**
 * Hook to manage auto-play timeout chain for the cascade
 * Schedules and cancels timeouts based on mode activation
 */
export function useAutoPlayController({
  isActive,
  currentStepIndex,
  callbacks,
}: UseAutoPlayControllerProps): void {
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const isPlayingRef = useRef(false);

  // Clear all pending timeouts
  const clearAllTimeouts = useCallback((): void => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // Execute a step action based on its actionKey
  const executeStepAction = useCallback(
    (step: CascadeStep): void => {
      switch (step.actionKey) {
        // Initiation phase
        case 'TF+FVII':
          callbacks.dockTFVIIa();
          break;
        case 'FIX':
          callbacks.dockFIX();
          break;
        case 'FX':
          callbacks.dockFX();
          break;
        case 'FV':
          callbacks.dockFV();
          break;
        case 'FII':
          callbacks.dockFII();
          break;

        // Amplification phase
        // Note: THROMBIN_ARRIVES, PAR_BIND, PAR_ACTIVATE are handled automatically
        // by the existing useEffect hooks in ExplosionFrame
        case 'PAR_CLEAVE':
          callbacks.parCleave();
          break;
        case 'vWF-VIII':
          callbacks.activateVWFVIII();
          break;
        case 'FV_AMP':
          callbacks.activateFV();
          break;
        case 'FXI':
          callbacks.activateFXI();
          break;
        // PLATELET_ACTIVATE, DOCK_FVA, DOCK_FVIIIA are handled automatically

        // Propagation phase
        // FIXA_ARRIVES is handled automatically by the existing timeout
        case 'TENASE':
          callbacks.formTenase();
          break;
        case 'PRODUCE_FXA':
          callbacks.produceFXa();
          break;
        case 'PROTHROMBINASE':
          callbacks.formProthrombinase();
          break;
        case 'BURST':
          callbacks.triggerBurst();
          break;

        // Clotting phase (fibrin formation)
        case 'FIBRINOGEN_CLEAVE':
          callbacks.cleaveFibrinogen();
          break;
        case 'FIBRIN_POLYMERIZE':
          callbacks.polymerizeFibrin();
          break;
        case 'FXIII_ACTIVATE':
          callbacks.activateFXIII();
          break;
        case 'FIBRIN_CROSSLINK':
          callbacks.crosslinkFibrin();
          break;

        // Automatic steps don't need explicit action (handled by existing effects)
        case 'THROMBIN_ARRIVES':
        case 'PAR_BIND':
        case 'PAR_ACTIVATE':
        case 'PLATELET_ACTIVATE':
        case 'DOCK_FVA':
        case 'DOCK_FVIIIA':
        case 'FIXA_ARRIVES':
          // These are triggered automatically by existing useEffect hooks
          break;
      }

      callbacks.advanceStep();
    },
    [callbacks]
  );

  // Start auto-play from current step
  const startAutoPlay = useCallback((): void => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    let cumulativeDelay = 0;
    const stepsToPlay = cascadeSteps.slice(currentStepIndex);

    stepsToPlay.forEach((step) => {
      cumulativeDelay += step.delayMs;

      const timeoutId = setTimeout(() => {
        // Only execute non-automatic steps in auto mode
        // Automatic steps are handled by existing effects
        if (!step.isAutomatic) {
          executeStepAction(step);
        } else {
          // Just advance the step counter for automatic steps
          callbacks.advanceStep();
        }
      }, cumulativeDelay);

      timeoutIdsRef.current.push(timeoutId);
    });
  }, [currentStepIndex, executeStepAction, callbacks]);

  // Effect to start/stop auto-play based on isActive
  useEffect(() => {
    if (isActive && currentStepIndex < cascadeSteps.length) {
      startAutoPlay();
    } else {
      clearAllTimeouts();
    }

    return () => {
      clearAllTimeouts();
    };
  }, [isActive, startAutoPlay, clearAllTimeouts, currentStepIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);
}
