// hooks/useGameState.ts
'use client';

import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, Slot } from '@/types/game';
import { createInitialSlots } from '@/engine/game/game-config';
import { getAllFactorIds, getFactorDefinition } from '@/engine/game/factor-definitions';
import {
  validatePlacement,
  shouldUnlockPlatelet,
  checkVictoryCondition,
  THROMBIN_STARTER_THRESHOLD,
} from '@/engine/game/validation-rules';

// =============================================================================
// INITIAL STATE
// =============================================================================

function createInitialState(): GameState {
  return {
    phase: 'initiation',
    thrombinMeter: 0,
    slots: createInitialSlots(),
    availableFactors: getAllFactorIds(),
    selectedFactorId: null,
    currentMessage: 'Click a factor in the palette, then click a slot to place it.',
    isError: false,
  };
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

      // Can only select factors still in palette
      if (!state.availableFactors.includes(action.factorId)) {
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
      let newSlots: Slot[] = state.slots.map((slot) =>
        slot.id === action.slotId
          ? { ...slot, placedFactorId: factorId, isActive: true }
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

      // Determine message
      let newMessage = factor.activationMessage;
      let newPhase = state.phase;

      // Check if we just hit thrombin threshold
      if (shouldUnlockPlatelet(newThrombinMeter) && !shouldUnlockPlatelet(state.thrombinMeter)) {
        newMessage = 'Starter thrombin activates platelet via PAR receptors';
        newPhase = 'amplification';
      }

      // Build intermediate state to check victory
      const intermediateState: GameState = {
        ...state,
        phase: newPhase,
        thrombinMeter: newThrombinMeter,
        slots: newSlots,
        availableFactors: newAvailableFactors,
        selectedFactorId: null,
        currentMessage: newMessage,
        isError: false,
      };

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

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    selectFactor,
    deselectFactor,
    attemptPlace,
    resetGame,
  };
}
