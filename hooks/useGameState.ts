// hooks/useGameState.ts
'use client';

import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, Slot, ComplexSlot } from '@/types/game';
import { createInitialSlots, createInitialComplexSlots } from '@/engine/game/game-config';
import { getAllFactorIds, getFactorDefinition } from '@/engine/game/factor-definitions';
import {
  validatePlacement,
  validateComplexPlacement,
  shouldUnlockPlatelet,
  checkVictoryCondition,
  isAmplificationComplete,
  isTenaseComplete,
} from '@/engine/game/validation-rules';

// =============================================================================
// INITIAL STATE
// =============================================================================

function createInitialState(): GameState {
  // Filter out FXa-tenase from palette (it's spawned by Tenase, not player-selectable)
  const paletteFactors = getAllFactorIds().filter((id) => id !== 'FXa-tenase');

  return {
    phase: 'initiation',
    thrombinMeter: 0,
    slots: createInitialSlots(),
    complexSlots: createInitialComplexSlots(),
    circulationFactors: [],
    availableFactors: paletteFactors,
    selectedFactorId: null,
    currentMessage: 'Click a factor in the palette, then click a slot to place it.',
    isError: false,
  };
}

// =============================================================================
// HELPER: CHECK IF FACTOR IS SELECTABLE
// =============================================================================

function isFactorSelectable(state: GameState, factorId: string): boolean {
  // Check if in palette
  if (state.availableFactors.includes(factorId)) {
    return true;
  }

  // Check if in circulation (e.g., FIXa)
  if (state.circulationFactors.includes(factorId)) {
    return true;
  }

  // Check if FXa-tenase is available (Tenase complete spawns it, not yet docked)
  if (factorId === 'FXa-tenase' && isTenaseComplete(state)) {
    const prothrombinaseEnzyme = state.complexSlots.find((s) => s.id === 'prothrombinase-enzyme');
    if (prothrombinaseEnzyme?.placedFactorId === null) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// HELPER: AUTO-FILL COMPLEX COFACTOR SLOTS
// =============================================================================

function autoFillCofactorSlots(complexSlots: ComplexSlot[]): ComplexSlot[] {
  return complexSlots.map((slot) => {
    if (slot.isAutoFilled && slot.placedFactorId === null) {
      // Auto-fill cofactor slots with the factor ID (not active label)
      if (slot.id === 'tenase-cofactor') {
        return { ...slot, placedFactorId: 'FVIII' };
      }
      if (slot.id === 'prothrombinase-cofactor') {
        return { ...slot, placedFactorId: 'FV' };
      }
    }
    return slot;
  });
}

// =============================================================================
// REDUCER
// =============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_FACTOR': {
      // Toggle selection if clicking same factor
      if (state.selectedFactorId === action.factorId) {
        return {
          ...state,
          selectedFactorId: null,
          currentMessage: 'Click a factor in the palette, then click a slot to place it.',
          isError: false,
        };
      }

      // Check if factor is selectable (palette, circulation, or Tenase-spawned)
      if (!isFactorSelectable(state, action.factorId)) {
        return state;
      }

      const factor = getFactorDefinition(action.factorId);
      return {
        ...state,
        selectedFactorId: action.factorId,
        currentMessage: `${factor?.inactiveLabel} selected. Click a valid slot to place.`,
        isError: false,
      };
    }

    case 'DESELECT_FACTOR': {
      return {
        ...state,
        selectedFactorId: null,
        currentMessage: 'Click a factor in the palette, then click a slot to place it.',
        isError: false,
      };
    }

    case 'ATTEMPT_PLACE': {
      // Must have a factor selected
      if (!state.selectedFactorId) {
        return {
          ...state,
          currentMessage: 'Select a factor first.',
          isError: true,
        };
      }

      const factorId = state.selectedFactorId;
      const validation = validatePlacement(state, factorId, action.slotId);

      if (!validation.isValid) {
        return {
          ...state,
          currentMessage: validation.errorMessage ?? 'Invalid placement.',
          isError: true,
        };
      }

      // Valid placement - update state
      const factor = getFactorDefinition(factorId)!;

      // Update slot with placed factor
      // FIX transfers to circulation, FII becomes soluble thrombin (meter shows it)
      const transfersToCirculation = factorId === 'FIX' || factorId === 'FII';
      let newSlots: Slot[] = state.slots.map((slot) =>
        slot.id === action.slotId
          ? {
              ...slot,
              placedFactorId: factorId,
              isActive: true,
              transferredToCirculation: transfersToCirculation,
            }
          : slot
      );

      // Calculate new thrombin meter
      const newThrombinMeter = Math.min(
        100,
        state.thrombinMeter + factor.thrombinContribution
      );

      // Check if platelet should unlock
      if (shouldUnlockPlatelet(newThrombinMeter) && !shouldUnlockPlatelet(state.thrombinMeter)) {
        // Just crossed threshold - unlock platelet slots
        newSlots = newSlots.map((slot) =>
          slot.surface === 'platelet' ? { ...slot, isLocked: false } : slot
        );
      }

      // Remove factor from available palette
      const newAvailableFactors = state.availableFactors.filter((f) => f !== factorId);

      // Track circulation factors - FIX placed adds it to circulation (as FIX, not FIXa)
      const newCirculationFactors = factorId === 'FIX'
        ? [...state.circulationFactors, 'FIX']
        : [...state.circulationFactors];

      // Determine message
      let newMessage = factor.activationMessage;
      let newPhase = state.phase;
      let newComplexSlots = state.complexSlots;

      // Check if we just hit thrombin threshold
      if (shouldUnlockPlatelet(newThrombinMeter) && !shouldUnlockPlatelet(state.thrombinMeter)) {
        newMessage = 'Starter thrombin activates platelet via PAR receptors';
        newPhase = 'amplification';
      }

      // Build intermediate state to check amplification
      const intermediateState: GameState = {
        ...state,
        phase: newPhase,
        thrombinMeter: newThrombinMeter,
        slots: newSlots,
        complexSlots: newComplexSlots,
        circulationFactors: newCirculationFactors,
        availableFactors: newAvailableFactors,
        selectedFactorId: null,
        currentMessage: newMessage,
        isError: false,
      };

      // Check if amplification is complete (FV and FVIII placed)
      if (isAmplificationComplete(intermediateState) && state.phase === 'amplification') {
        // Auto-fill cofactor slots on transition to propagation
        newComplexSlots = autoFillCofactorSlots(intermediateState.complexSlots);
        newPhase = 'propagation';
        newMessage = 'Cofactors positioned. Place FIXa from circulation into Tenase.';

        return {
          ...intermediateState,
          phase: newPhase,
          complexSlots: newComplexSlots,
          currentMessage: newMessage,
        };
      }

      // Check victory condition
      if (checkVictoryCondition(intermediateState)) {
        return {
          ...intermediateState,
          phase: 'complete',
          currentMessage: 'Platelet primed. Cofactors positioned for propagation.',
        };
      }

      return intermediateState;
    }

    case 'ATTEMPT_COMPLEX_PLACE': {
      // Must have a factor selected
      if (!state.selectedFactorId) {
        return {
          ...state,
          currentMessage: 'Select a factor first.',
          isError: true,
        };
      }

      const factorId = state.selectedFactorId;
      const validation = validateComplexPlacement(state, factorId, action.complexSlotId);

      if (!validation.isValid) {
        return {
          ...state,
          currentMessage: validation.errorMessage ?? 'Invalid complex placement.',
          isError: true,
        };
      }

      // Valid placement - update complex slot
      const newComplexSlots: ComplexSlot[] = state.complexSlots.map((slot) =>
        slot.id === action.complexSlotId
          ? { ...slot, placedFactorId: factorId }
          : slot
      );

      // Remove placed factor from circulation (if it was there)
      const newCirculationFactors = state.circulationFactors.filter((f) => f !== factorId);

      // Build intermediate state
      let intermediateState: GameState = {
        ...state,
        complexSlots: newComplexSlots,
        circulationFactors: newCirculationFactors,
        selectedFactorId: null,
        isError: false,
      };

      // Check if Tenase is now complete (FIXa + FVIIIa) - enables FXa-tenase selection
      if (action.complexSlotId === 'tenase-enzyme' && isTenaseComplete(intermediateState)) {
        intermediateState = {
          ...intermediateState,
          currentMessage: 'Tenase complete! FXa generated. Place FXa into Prothrombinase.',
        };
      } else if (action.complexSlotId === 'prothrombinase-enzyme') {
        // Prothrombinase enzyme filled - thrombin burst!
        intermediateState = {
          ...intermediateState,
          thrombinMeter: 100,
          currentMessage: 'Prothrombinase complete! Thrombin burst achieved.',
        };
      } else {
        const factor = getFactorDefinition(factorId);
        intermediateState = {
          ...intermediateState,
          currentMessage: factor?.activationMessage ?? 'Factor placed.',
        };
      }

      // Check victory condition
      if (checkVictoryCondition(intermediateState)) {
        return {
          ...intermediateState,
          phase: 'complete',
          currentMessage: 'Coagulation cascade complete! Maximum thrombin generation achieved.',
        };
      }

      return intermediateState;
    }

    case 'RESET_GAME': {
      return createInitialState();
    }

    default:
      return state;
  }
}

// =============================================================================
// HOOK
// =============================================================================

export interface UseGameStateReturn {
  state: GameState;
  selectFactor: (factorId: string) => void;
  deselectFactor: () => void;
  attemptPlace: (slotId: string) => void;
  attemptComplexPlace: (complexSlotId: string) => void;
  resetGame: () => void;
}

export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  const selectFactor = useCallback((factorId: string) => {
    dispatch({ type: 'SELECT_FACTOR', factorId });
  }, []);

  const deselectFactor = useCallback(() => {
    dispatch({ type: 'DESELECT_FACTOR' });
  }, []);

  const attemptPlace = useCallback((slotId: string) => {
    dispatch({ type: 'ATTEMPT_PLACE', slotId });
  }, []);

  const attemptComplexPlace = useCallback((complexSlotId: string) => {
    dispatch({ type: 'ATTEMPT_COMPLEX_PLACE', complexSlotId });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    selectFactor,
    deselectFactor,
    attemptPlace,
    attemptComplexPlace,
    resetGame,
  };
}
