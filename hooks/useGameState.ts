// hooks/useGameState.ts
'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { GameState, GameAction, Slot, ComplexSlot, ReducerResult } from '@/types/game';
import type { GameEvent } from '@/types/game-events';
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
// CONVERSION RULES
// =============================================================================

interface ConversionRule {
  fromId: string;
  toLabel: string;
  mechanism: 'proteolysis' | 'activation' | 'dissociation';
  catalyst: string;
}

/**
 * Returns the conversion rule for a factor placed on a surface
 */
function getConversionRule(
  factorId: string,
  surface: string
): ConversionRule | null {
  // TF-CELL conversions (proteolysis)
  if (surface === 'tf-cell') {
    switch (factorId) {
      case 'FX':
        return {
          fromId: 'FX',
          toLabel: 'FXa',
          mechanism: 'proteolysis',
          catalyst: 'TF+VIIa',
        };
      case 'FIX':
        return {
          fromId: 'FIX',
          toLabel: 'FIXa',
          mechanism: 'proteolysis',
          catalyst: 'TF+VIIa',
        };
      case 'FII':
        return {
          fromId: 'FII',
          toLabel: 'Starter THR',
          mechanism: 'proteolysis',
          catalyst: 'FXa+Va',
        };
    }
  }

  // PLATELET conversions (activation/dissociation via THR)
  if (surface === 'platelet') {
    switch (factorId) {
      case 'FV':
        return {
          fromId: 'FV',
          toLabel: 'FVa',
          mechanism: 'activation',
          catalyst: 'THR',
        };
      case 'FVIII':
        return {
          fromId: 'FVIII',
          toLabel: 'FVIIIa',
          mechanism: 'dissociation',
          catalyst: 'THR',
        };
    }
  }

  return null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

function createInitialState(): GameState {
  // Filter out FXa-tenase from palette (it's spawned by Tenase, not player-selectable)
  const paletteFactors = getAllFactorIds().filter((id) => id !== 'FXa-tenase');

  return {
    phase: 'initiation',
    thrombinMeter: 0,
    clotIntegrity: 0,
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

function gameReducer(state: GameState, action: GameAction): ReducerResult {
  switch (action.type) {
    case 'SELECT_FACTOR': {
      const events: GameEvent[] = [];

      // Toggle selection if clicking same factor
      if (state.selectedFactorId === action.factorId) {
        return {
          state: {
            ...state,
            selectedFactorId: null,
            currentMessage: 'Click a factor in the palette, then click a slot to place it.',
            isError: false,
          },
          events,
        };
      }

      // Check if factor is selectable (palette, circulation, or Tenase-spawned)
      if (!isFactorSelectable(state, action.factorId)) {
        return { state, events };
      }

      // Emit FACTOR_SELECTED event
      const fromLocation = state.circulationFactors.includes(action.factorId)
        ? 'circulation'
        : 'palette';
      events.push({
        type: 'FACTOR_SELECTED',
        factorId: action.factorId,
        fromLocation,
      });

      const factor = getFactorDefinition(action.factorId);
      return {
        state: {
          ...state,
          selectedFactorId: action.factorId,
          currentMessage: `${factor?.inactiveLabel} selected. Click a valid slot to place.`,
          isError: false,
        },
        events,
      };
    }

    case 'DESELECT_FACTOR': {
      return {
        state: {
          ...state,
          selectedFactorId: null,
          currentMessage: 'Click a factor in the palette, then click a slot to place it.',
          isError: false,
        },
        events: [],
      };
    }

    case 'ATTEMPT_PLACE': {
      const events: GameEvent[] = [];

      // Must have a factor selected
      if (!state.selectedFactorId) {
        return {
          state: {
            ...state,
            currentMessage: 'Select a factor first.',
            isError: true,
          },
          events,
        };
      }

      const factorId = state.selectedFactorId;
      const validation = validatePlacement(state, factorId, action.slotId);
      const targetSlot = state.slots.find((s) => s.id === action.slotId);
      const surface = targetSlot?.surface ?? 'tf-cell';

      if (!validation.isValid) {
        // Emit failed placement event
        events.push({
          type: 'FACTOR_PLACED',
          factorId,
          slotId: action.slotId,
          surface,
          success: false,
          errorReason: validation.errorMessage ?? 'Invalid placement.',
        });

        return {
          state: {
            ...state,
            currentMessage: validation.errorMessage ?? 'Invalid placement.',
            isError: true,
          },
          events,
        };
      }

      // Valid placement - emit success event
      events.push({
        type: 'FACTOR_PLACED',
        factorId,
        slotId: action.slotId,
        surface,
        success: true,
      });

      // Emit ARROW_PULSE from catalyst to factor
      const conversionRule = getConversionRule(factorId, surface);
      if (conversionRule) {
        // Determine source node for arrow
        let fromNode = 'tf-viia'; // default for TF+VIIa
        if (conversionRule.catalyst === 'FXa+Va') {
          fromNode = 'fxa-slot'; // FXa on TF-cell
        } else if (conversionRule.catalyst === 'THR') {
          fromNode = 'thrombin-signal';
        }

        events.push({
          type: 'ARROW_PULSE',
          fromNode,
          toNode: action.slotId,
          style: 'solid',
          label: conversionRule.catalyst,
        });

        // Emit FACTOR_CONVERTED event
        events.push({
          type: 'FACTOR_CONVERTED',
          fromId: conversionRule.fromId,
          toLabel: conversionRule.toLabel,
          surface,
          mechanism: conversionRule.mechanism,
          catalyst: conversionRule.catalyst,
        });
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

      // Emit FACTOR_TRANSFERRED for FIX (to circulation) or FII (as signal)
      if (factorId === 'FIX') {
        events.push({
          type: 'FACTOR_TRANSFERRED',
          factorId: 'FIX',
          fromSurface: surface,
          toDestination: 'circulation',
        });
      } else if (factorId === 'FII') {
        events.push({
          type: 'FACTOR_TRANSFERRED',
          factorId: 'FII',
          fromSurface: surface,
          toDestination: 'signal',
        });
      }

      // Calculate new thrombin meter
      const newThrombinMeter = Math.min(
        100,
        state.thrombinMeter + factor.thrombinContribution
      );

      // Emit METER_CHANGED if thrombin increases
      if (factor.thrombinContribution > 0) {
        events.push({
          type: 'METER_CHANGED',
          meter: 'thrombin',
          target: newThrombinMeter,
          delta: factor.thrombinContribution,
        });

        // Emit SIGNAL_FLOW when THR flows to platelet (FII placement)
        if (factorId === 'FII') {
          events.push({
            type: 'SIGNAL_FLOW',
            signal: 'THR',
            fromSurface: 'tf-cell',
            toSurface: 'platelet',
            intensity: 'starter',
          });
        }
      }

      // Check if platelet should unlock
      const plateletUnlocking =
        shouldUnlockPlatelet(newThrombinMeter) && !shouldUnlockPlatelet(state.thrombinMeter);
      if (plateletUnlocking) {
        // Just crossed threshold - unlock platelet slots
        newSlots = newSlots.map((slot) =>
          slot.surface === 'platelet' ? { ...slot, isLocked: false } : slot
        );

        // Emit PHASE_UNLOCKED event
        events.push({
          type: 'PHASE_UNLOCKED',
          phase: 'amplification',
          trigger: 'thrombin_threshold',
        });

        // Emit PANEL_STATE_CHANGED for platelet
        events.push({
          type: 'PANEL_STATE_CHANGED',
          surface: 'platelet',
          state: 'active',
        });
      }

      // Remove factor from available palette
      const newAvailableFactors = state.availableFactors.filter((f) => f !== factorId);

      // Track circulation factors - FIX placed adds it to circulation (as FIX, not FIXa)
      const newCirculationFactors =
        factorId === 'FIX'
          ? [...state.circulationFactors, 'FIX']
          : [...state.circulationFactors];

      // Determine message
      let newMessage = factor.activationMessage;
      let newPhase = state.phase;
      let newComplexSlots = state.complexSlots;

      // Check if we just hit thrombin threshold
      if (plateletUnlocking) {
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

        // Emit PHASE_UNLOCKED for propagation
        events.push({
          type: 'PHASE_UNLOCKED',
          phase: 'propagation',
          trigger: 'amplification_complete',
        });

        // Emit PANEL_STATE_CHANGED for activated-platelet
        events.push({
          type: 'PANEL_STATE_CHANGED',
          surface: 'activated-platelet',
          state: 'active',
        });

        return {
          state: {
            ...intermediateState,
            phase: newPhase,
            complexSlots: newComplexSlots,
            currentMessage: newMessage,
          },
          events,
        };
      }

      // Check victory condition
      if (checkVictoryCondition(intermediateState)) {
        return {
          state: {
            ...intermediateState,
            phase: 'complete',
            currentMessage: 'Platelet primed. Cofactors positioned for propagation.',
          },
          events,
        };
      }

      return { state: intermediateState, events };
    }

    case 'ATTEMPT_COMPLEX_PLACE': {
      const events: GameEvent[] = [];

      // Must have a factor selected
      if (!state.selectedFactorId) {
        return {
          state: {
            ...state,
            currentMessage: 'Select a factor first.',
            isError: true,
          },
          events,
        };
      }

      const factorId = state.selectedFactorId;
      const validation = validateComplexPlacement(state, factorId, action.complexSlotId);
      const targetSlot = state.complexSlots.find((s) => s.id === action.complexSlotId);

      if (!validation.isValid) {
        return {
          state: {
            ...state,
            currentMessage: validation.errorMessage ?? 'Invalid complex placement.',
            isError: true,
          },
          events,
        };
      }

      // Determine complex type and role from slot
      const complexType = targetSlot?.complexType ?? 'tenase';
      const role = targetSlot?.role ?? 'enzyme';

      // Emit COMPLEX_PART_DOCKED event
      events.push({
        type: 'COMPLEX_PART_DOCKED',
        complexType,
        role,
        factorId,
      });

      // Valid placement - update complex slot
      const newComplexSlots: ComplexSlot[] = state.complexSlots.map((slot) =>
        slot.id === action.complexSlotId ? { ...slot, placedFactorId: factorId } : slot
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
        // Emit COMPLEX_COMPLETED event
        events.push({
          type: 'COMPLEX_COMPLETED',
          complexType: 'tenase',
          efficiency: 100,
        });

        // Emit COMPLEX_OUTPUT for FXa-tenase
        events.push({
          type: 'COMPLEX_OUTPUT',
          complexType: 'tenase',
          outputFactorId: 'FXa-tenase',
          quantity: 1,
        });

        intermediateState = {
          ...intermediateState,
          currentMessage: 'Tenase complete! FXa generated. Place FXa into Prothrombinase.',
        };
      } else if (action.complexSlotId === 'prothrombinase-enzyme') {
        // Prothrombinase enzyme filled - check if both parts are present
        const cofactorSlot = newComplexSlots.find((s) => s.id === 'prothrombinase-cofactor');
        const isProthrombinaseComplete = cofactorSlot?.placedFactorId !== null;

        if (isProthrombinaseComplete) {
          // Emit COMPLEX_COMPLETED event
          events.push({
            type: 'COMPLEX_COMPLETED',
            complexType: 'prothrombinase',
            efficiency: 100,
          });

          // Emit COMPLEX_OUTPUT for thrombin burst
          events.push({
            type: 'COMPLEX_OUTPUT',
            complexType: 'prothrombinase',
            outputFactorId: 'THR',
            quantity: 100,
          });

          // Emit METER_CHANGED for thrombin burst
          events.push({
            type: 'METER_CHANGED',
            meter: 'thrombin',
            target: 100,
            delta: 100 - state.thrombinMeter,
          });

          // Emit SIGNAL_FLOW for thrombin burst
          events.push({
            type: 'SIGNAL_FLOW',
            signal: 'THR',
            fromSurface: 'activated-platelet',
            toSurface: 'platelet',
            intensity: 'burst',
          });
        }

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
        // Emit VICTORY event
        const complexesBuilt: string[] = [];
        if (isTenaseComplete(intermediateState)) {
          complexesBuilt.push('tenase');
        }
        // Check if prothrombinase is complete
        const prothEnzyme = newComplexSlots.find((s) => s.id === 'prothrombinase-enzyme');
        const prothCofactor = newComplexSlots.find((s) => s.id === 'prothrombinase-cofactor');
        if (prothEnzyme?.placedFactorId && prothCofactor?.placedFactorId) {
          complexesBuilt.push('prothrombinase');
        }

        events.push({
          type: 'VICTORY',
          finalThrombin: 100,
          complexesBuilt,
        });

        return {
          state: {
            ...intermediateState,
            phase: 'complete',
            currentMessage: 'Coagulation cascade complete! Maximum thrombin generation achieved.',
          },
          events,
        };
      }

      return { state: intermediateState, events };
    }

    case 'RESET_GAME': {
      return {
        state: createInitialState(),
        events: [],
      };
    }

    default:
      return { state, events: [] };
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
  /** Subscribe to events - returns unsubscribe function */
  subscribeToEvents: (callback: (events: GameEvent[]) => void) => () => void;
}

/**
 * Wrapper reducer that extracts state from ReducerResult.
 * Events are stored in an array that is passed by reference.
 */
function stateReducer(state: GameState, action: GameAction): GameState {
  const result = gameReducer(state, action);
  // Store events in a closure-captured variable for post-render broadcast
  // The events will be read by useEffect after this reducer returns
  stateReducer.pendingEvents = result.events;
  return result.state;
}
// Module-level storage for pending events (avoids ref access during render)
stateReducer.pendingEvents = [] as GameEvent[];

export function useGameState(): UseGameStateReturn {
  const subscribersRef = useRef<Set<(events: GameEvent[]) => void>>(new Set());

  const [state, dispatch] = useReducer(stateReducer, null, createInitialState);

  // Broadcast events after render to avoid stale closure issues
  useEffect(() => {
    if (stateReducer.pendingEvents.length > 0) {
      const events = stateReducer.pendingEvents;
      stateReducer.pendingEvents = [];
      subscribersRef.current.forEach((cb) => cb(events));
    }
  });

  const selectFactor = useCallback(
    (factorId: string) => {
      dispatch({ type: 'SELECT_FACTOR', factorId });
    },
    []
  );

  const deselectFactor = useCallback(() => {
    dispatch({ type: 'DESELECT_FACTOR' });
  }, []);

  const attemptPlace = useCallback(
    (slotId: string) => {
      dispatch({ type: 'ATTEMPT_PLACE', slotId });
    },
    []
  );

  const attemptComplexPlace = useCallback(
    (complexSlotId: string) => {
      dispatch({ type: 'ATTEMPT_COMPLEX_PLACE', complexSlotId });
    },
    []
  );

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const subscribeToEvents = useCallback((callback: (events: GameEvent[]) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  return {
    state,
    selectFactor,
    deselectFactor,
    attemptPlace,
    attemptComplexPlace,
    resetGame,
    subscribeToEvents,
  };
}
