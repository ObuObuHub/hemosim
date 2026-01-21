// hooks/useGameState.ts
'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { GameState, GameAction, Slot, ComplexSlot, ReducerResult, FloatingFactor, HeldFactor, Antagonist, GameResult, GameStats, MessengerFactor, SpilloverParticle } from '@/types/game';
import type { GameEvent } from '@/types/game-events';
import { createInitialSlots, createInitialComplexSlots, BLOODSTREAM_ZONE } from '@/engine/game/game-config';
import { getAllFactorIds, getFactorDefinition } from '@/engine/game/factor-definitions';
import {
  validatePlacement,
  validateComplexPlacement,
  shouldUnlockPlatelet,
  shouldUnlockClotZone,
  isProthrombinaseComplete,
  checkVictoryCondition,
  isAmplificationComplete,
  isTenaseComplete,
  isStabilizationComplete,
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

  // CLOT-ZONE conversions (proteolysis via THR)
  if (surface === 'clot-zone') {
    switch (factorId) {
      case 'Fibrinogen':
        return {
          fromId: 'Fibrinogen',
          toLabel: 'Fibrin',
          mechanism: 'proteolysis',
          catalyst: 'THR',
        };
      case 'FXIII':
        return {
          fromId: 'FXIII',
          toLabel: 'FXIIIa',
          mechanism: 'activation',
          catalyst: 'THR',
        };
    }
  }

  return null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

function createInitialStats(): GameStats {
  return {
    factorsCaught: 0,
    factorsLostToEscape: 0,
    factorsLostToAntithrombin: 0,
    factorsLostToAPC: 0,
    factorsLostToPlasmin: 0,
    timeTaken: 0,
  };
}

function createInitialState(): GameState {
  // Filter out FXa-tenase (spawned by Tenase), Stabilization factors (added when phase unlocks),
  // and FIXa (spawned as messenger when FIX is placed)
  const paletteFactors = getAllFactorIds().filter(
    (id) => id !== 'FXa-tenase' && id !== 'Fibrinogen' && id !== 'FXIII' && id !== 'FIXa'
  );

  return {
    phase: 'initiation',
    thrombinMeter: 0,
    plateletActivation: 0,
    clotIntegrity: 0,
    bleedingMeter: 0,
    tfpiActive: false,
    localFXaCount: 0,
    gameResult: null,
    gameStats: createInitialStats(),
    slots: createInitialSlots(),
    complexSlots: createInitialComplexSlots(),
    circulationFactors: [],
    messengerFactors: [],
    spilloverParticles: [],
    availableFactors: paletteFactors,
    selectedFactorId: null,
    currentMessage: 'Drag factors from bloodstream. FIXa must travel to platelet!',
    isError: false,
    floatingFactors: [],
    heldFactor: null,
    antagonists: [],
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

      // FIX generates FIXa Messenger (spawned in game loop, not added to circulation here)
      // FX generates local FXa (stays on TF-cell, counts toward TFPI)
      const isFIXPlacement = factorId === 'FIX';
      const isFXPlacement = factorId === 'FX';

      // Mark as transferred for visual feedback
      const transfersToCirculation = isFIXPlacement || factorId === 'FII';

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

      // Track local FXa for TFPI trigger
      let newLocalFXaCount = state.localFXaCount;
      let newTfpiActive = state.tfpiActive;

      if (isFXPlacement && !state.tfpiActive) {
        newLocalFXaCount = state.localFXaCount + 1;
        if (newLocalFXaCount >= 3) {
          newTfpiActive = true;
          events.push({ type: 'TFPI_ACTIVATED' as const });
        }
      }

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

      // === CLOT-ZONE SPECIAL HANDLING ===
      let newClotIntegrity = state.clotIntegrity;
      if (surface === 'clot-zone') {
        const integrityDelta = 25; // Each placement adds 25%
        newClotIntegrity = Math.min(100, state.clotIntegrity + integrityDelta);

        // Emit specific events for Fibrinogen/FXIII
        if (factorId === 'Fibrinogen') {
          events.push({
            type: 'FIBRINOGEN_DOCKED',
            slotId: action.slotId,
          });
          events.push({
            type: 'FIBRINOGEN_CONVERTED',
            slotId: action.slotId,
            integrityDelta,
            totalIntegrity: newClotIntegrity,
          });
        } else if (factorId === 'FXIII') {
          events.push({
            type: 'FXIII_DOCKED',
            slotId: action.slotId,
          });
          events.push({
            type: 'FXIII_ACTIVATED',
            slotId: action.slotId,
            integrityDelta,
            totalIntegrity: newClotIntegrity,
          });

          // Get all fibrin slots that have been placed
          const fibrinSlotIds = newSlots
            .filter((s) => s.surface === 'clot-zone' && s.placedFactorId === 'Fibrinogen')
            .map((s) => s.id);

          if (fibrinSlotIds.length > 0) {
            events.push({
              type: 'CROSS_LINK_FORMED',
              fibrinSlotIds,
            });
          }
        }

        // Emit METER_CHANGED for clot integrity
        events.push({
          type: 'METER_CHANGED',
          meter: 'clotIntegrity',
          target: newClotIntegrity,
          delta: integrityDelta,
        });
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
        plateletActivation: state.plateletActivation, // preserve
        clotIntegrity: newClotIntegrity,
        tfpiActive: newTfpiActive,
        localFXaCount: newLocalFXaCount,
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

      // Check if stabilization is complete (clot integrity at 100%)
      if (isStabilizationComplete(intermediateState) && intermediateState.clotIntegrity >= 100) {
        // Emit CLOT_STABILIZED event
        events.push({
          type: 'CLOT_STABILIZED',
          finalIntegrity: 100,
        });

        // Emit VICTORY event
        events.push({
          type: 'VICTORY',
          finalThrombin: intermediateState.thrombinMeter,
          complexesBuilt: ['tenase', 'prothrombinase', 'fibrin-mesh'],
        });

        return {
          state: {
            ...intermediateState,
            phase: 'complete',
            currentMessage: 'Clot stabilized! Cross-linked fibrin mesh formed. Hemostasis achieved!',
          },
          events,
        };
      }

      // Check victory condition (legacy - now requires Stabilization)
      if (checkVictoryCondition(intermediateState)) {
        return {
          state: {
            ...intermediateState,
            phase: 'complete',
            currentMessage: 'Clot stabilized! Cross-linked fibrin mesh formed. Hemostasis achieved!',
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
        const isProthComplete = cofactorSlot?.placedFactorId !== null;

        if (isProthComplete) {
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

          // === Unlock Stabilization phase ===
          // Unlock clot-zone slots
          const unlockedSlots = intermediateState.slots.map((slot) =>
            slot.surface === 'clot-zone' ? { ...slot, isLocked: false } : slot
          );

          // Add Fibrinogen and FXIII to available factors
          const updatedFactors = [...intermediateState.availableFactors, 'Fibrinogen', 'FXIII'];

          // Emit PHASE_UNLOCKED for stabilization
          events.push({
            type: 'PHASE_UNLOCKED',
            phase: 'stabilization',
            trigger: 'prothrombinase_complete',
          });

          // Emit PANEL_STATE_CHANGED for clot-zone
          events.push({
            type: 'PANEL_STATE_CHANGED',
            surface: 'clot-zone',
            state: 'active',
          });

          intermediateState = {
            ...intermediateState,
            phase: 'stabilization',
            thrombinMeter: 100,
            slots: unlockedSlots,
            availableFactors: updatedFactors,
            currentMessage: 'Thrombin burst! Place Fibrinogen in Clot Zone to form fibrin mesh.',
          };
        } else {
          intermediateState = {
            ...intermediateState,
            thrombinMeter: 100,
            currentMessage: 'Prothrombinase enzyme placed. Thrombin burst achieved.',
          };
        }
      } else {
        const factor = getFactorDefinition(factorId);
        intermediateState = {
          ...intermediateState,
          currentMessage: factor?.activationMessage ?? 'Factor placed.',
        };
      }

      // Victory check moved to ATTEMPT_PLACE (stabilization completion)
      // Prothrombinase completion now transitions to Stabilization phase
      return { state: intermediateState, events };
    }

    case 'RESET_GAME': {
      return {
        state: createInitialState(),
        events: [],
      };
    }

    case 'SPAWN_FLOATING_FACTOR': {
      return {
        state: {
          ...state,
          floatingFactors: [...state.floatingFactors, action.factor],
        },
        events: [],
      };
    }

    case 'TICK_FLOATING_FACTORS': {
      // Move all floating factors by their velocity * deltaTime
      const updatedFactors = state.floatingFactors.map((factor) => ({
        ...factor,
        position: {
          x: factor.position.x + factor.velocity.x * action.deltaTime,
          y: factor.position.y + factor.velocity.y * action.deltaTime,
        },
      }));

      // Remove factors that have moved past the removal threshold
      const filteredFactors = updatedFactors.filter(
        (factor) => factor.position.x <= BLOODSTREAM_ZONE.removeThreshold
      );

      return {
        state: {
          ...state,
          floatingFactors: filteredFactors,
        },
        events: [],
      };
    }

    case 'REMOVE_FLOATING_FACTOR': {
      return {
        state: {
          ...state,
          floatingFactors: state.floatingFactors.filter(
            (factor) => factor.id !== action.factorId
          ),
        },
        events: [],
      };
    }

    case 'GRAB_FACTOR': {
      // Find the floating factor being grabbed
      const floatingFactor = state.floatingFactors.find(
        (f) => f.id === action.floatingFactorId
      );
      if (!floatingFactor) {
        return { state, events: [] };
      }

      // Create held factor and remove from floating factors
      const heldFactor: HeldFactor = {
        id: floatingFactor.id,
        factorId: floatingFactor.factorId,
        cursorPosition: action.cursorPosition,
      };

      const factor = getFactorDefinition(floatingFactor.factorId);

      return {
        state: {
          ...state,
          floatingFactors: state.floatingFactors.filter(
            (f) => f.id !== action.floatingFactorId
          ),
          heldFactor,
          selectedFactorId: floatingFactor.factorId,
          currentMessage: factor
            ? `Holding ${factor.inactiveLabel}. Drop on a valid slot.`
            : 'Factor held.',
          isError: false,
        },
        events: [],
      };
    }

    case 'UPDATE_HELD_POSITION': {
      if (!state.heldFactor) {
        return { state, events: [] };
      }

      return {
        state: {
          ...state,
          heldFactor: {
            ...state.heldFactor,
            cursorPosition: action.cursorPosition,
          },
        },
        events: [],
      };
    }

    case 'DROP_FACTOR': {
      if (!state.heldFactor) {
        return { state, events: [] };
      }

      // Return factor to bloodstream at drop position
      const droppedFactor: FloatingFactor = {
        id: state.heldFactor.id,
        factorId: state.heldFactor.factorId,
        position: {
          x: state.heldFactor.cursorPosition.x,
          y: Math.min(
            Math.max(state.heldFactor.cursorPosition.y, BLOODSTREAM_ZONE.spawnYMin),
            BLOODSTREAM_ZONE.spawnYMax
          ),
        },
        velocity: { x: 40, y: 0 }, // Resume drifting right
        isVulnerableTo: [],
      };

      return {
        state: {
          ...state,
          heldFactor: null,
          selectedFactorId: null,
          floatingFactors: [...state.floatingFactors, droppedFactor],
          currentMessage: 'Drag a factor from the bloodstream onto a slot to place it.',
          isError: false,
        },
        events: [],
      };
    }

    case 'SPAWN_ANTAGONIST': {
      return {
        state: {
          ...state,
          antagonists: [...state.antagonists, action.antagonist],
        },
        events: [],
      };
    }

    case 'TICK_ANTAGONISTS': {
      // Update antagonist positions (AI handled externally, this just applies the results)
      // Also remove any factors that were destroyed
      const destroyedIds = new Set(action.destroyedFactorIds);
      const filteredFactors = state.floatingFactors.filter(
        (f) => !destroyedIds.has(f.id)
      );

      return {
        state: {
          ...state,
          antagonists: action.updatedAntagonists,
          floatingFactors: filteredFactors,
        },
        events: [],
      };
    }

    case 'DESTROY_FACTOR': {
      const events: GameEvent[] = [];

      // Find the antagonist to get its type
      const antagonist = state.antagonists.find((a) => a.id === action.antagonistId);

      if (antagonist) {
        events.push({
          type: 'FACTOR_DESTROYED',
          factorId: action.factorId,
          antagonistType: antagonist.type,
          antagonistId: action.antagonistId,
        });
      }

      // Remove the destroyed factor
      const filteredFactors = state.floatingFactors.filter(
        (f) => f.id !== action.factorId
      );

      return {
        state: {
          ...state,
          floatingFactors: filteredFactors,
        },
        events,
      };
    }

    case 'INCREMENT_BLEEDING': {
      const newBleeding = Math.min(100, state.bleedingMeter + action.amount);

      // Update stats based on reason
      const newStats = { ...state.gameStats };
      switch (action.reason) {
        case 'escape':
          newStats.factorsLostToEscape += 1;
          break;
        case 'antithrombin':
          newStats.factorsLostToAntithrombin += 1;
          break;
        case 'apc':
          newStats.factorsLostToAPC += 1;
          break;
        case 'plasmin':
          newStats.factorsLostToPlasmin += 1;
          break;
      }

      return {
        state: {
          ...state,
          bleedingMeter: newBleeding,
          gameStats: newStats,
        },
        events: [],
      };
    }

    case 'SET_GAME_RESULT': {
      return {
        state: {
          ...state,
          gameResult: action.result,
        },
        events: [],
      };
    }

    case 'INCREMENT_FACTORS_CAUGHT': {
      return {
        state: {
          ...state,
          gameStats: {
            ...state.gameStats,
            factorsCaught: state.gameStats.factorsCaught + 1,
          },
        },
        events: [],
      };
    }

    case 'SET_TIME_TAKEN': {
      return {
        state: {
          ...state,
          gameStats: {
            ...state.gameStats,
            timeTaken: action.time,
          },
        },
        events: [],
      };
    }

    case 'SPAWN_MESSENGER': {
      return {
        state: {
          ...state,
          messengerFactors: [...state.messengerFactors, action.messenger],
        },
        events: [],
      };
    }

    case 'TICK_MESSENGERS': {
      // Move all messenger factors toward platelet
      const updatedMessengers = state.messengerFactors.map((messenger) => ({
        ...messenger,
        position: {
          x: messenger.position.x + messenger.velocity.x * action.deltaTime,
          y: messenger.position.y + messenger.velocity.y * action.deltaTime,
        },
      }));

      return {
        state: {
          ...state,
          messengerFactors: updatedMessengers,
        },
        events: [],
      };
    }

    case 'MESSENGER_ARRIVED': {
      const events: GameEvent[] = [];

      // Remove from messengers, add to circulation
      const arrivedMessenger = state.messengerFactors.find((m) => m.id === action.messengerId);
      if (!arrivedMessenger) {
        return { state, events };
      }

      events.push({
        type: 'FACTOR_TRANSFERRED',
        factorId: 'FIXa',
        fromSurface: 'tf-cell',
        toDestination: 'circulation',
      });

      return {
        state: {
          ...state,
          messengerFactors: state.messengerFactors.filter((m) => m.id !== action.messengerId),
          circulationFactors: [...state.circulationFactors, 'FIXa'],
          currentMessage: 'FIXa Messenger arrived at platelet! Ready to dock into Tenase.',
        },
        events,
      };
    }

    case 'DESTROY_MESSENGER': {
      const events: GameEvent[] = [];

      const antagonist = state.antagonists.find((a) => a.id === action.antagonistId);
      if (antagonist) {
        events.push({
          type: 'FACTOR_DESTROYED',
          factorId: 'FIXa',
          antagonistType: antagonist.type,
          antagonistId: action.antagonistId,
        });
      }

      return {
        state: {
          ...state,
          messengerFactors: state.messengerFactors.filter((m) => m.id !== action.messengerId),
        },
        events,
      };
    }

    case 'INCREMENT_LOCAL_FXA': {
      const newCount = state.localFXaCount + 1;
      const shouldActivateTFPI = newCount >= 3 && !state.tfpiActive;

      let newMessage = state.currentMessage;
      if (shouldActivateTFPI) {
        newMessage = 'TFPI activated! TF+VIIa factory shut down. Use existing factors wisely.';
      }

      return {
        state: {
          ...state,
          localFXaCount: newCount,
          tfpiActive: shouldActivateTFPI ? true : state.tfpiActive,
          currentMessage: newMessage,
        },
        events: shouldActivateTFPI ? [{ type: 'TFPI_ACTIVATED' as const }] : [],
      };
    }

    case 'ACTIVATE_TFPI': {
      return {
        state: {
          ...state,
          tfpiActive: true,
          currentMessage: 'TFPI has shut down the TF+VIIa factory!',
        },
        events: [{ type: 'TFPI_ACTIVATED' as const }],
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
  /** Spawn a floating factor in the bloodstream */
  spawnFloatingFactor: (factor: FloatingFactor) => void;
  /** Update floating factor positions by deltaTime (in seconds) */
  tickFloatingFactors: (deltaTime: number) => void;
  /** Remove a specific floating factor by ID */
  removeFloatingFactor: (factorId: string) => void;
  /** Grab a floating factor to start dragging */
  grabFactor: (floatingFactorId: string, cursorPosition: { x: number; y: number }) => void;
  /** Update held factor position during drag */
  updateHeldPosition: (cursorPosition: { x: number; y: number }) => void;
  /** Drop the held factor (returns to stream if not placed) */
  dropFactor: () => void;
  /** Spawn an antagonist in the bloodstream */
  spawnAntagonist: (antagonist: Antagonist) => void;
  /** Update antagonist AI tick and apply results */
  tickAntagonists: (updatedAntagonists: Antagonist[], destroyedFactorIds: string[]) => void;
  /** Destroy a factor (called when antagonist catches it) */
  destroyFactor: (factorId: string, antagonistId: string) => void;
  /** Increment bleeding meter */
  incrementBleeding: (amount: number, reason: 'escape' | 'antithrombin' | 'apc' | 'plasmin') => void;
  /** Set game result */
  setGameResult: (result: GameResult) => void;
  /** Increment factors caught counter */
  incrementFactorsCaught: () => void;
  /** Set elapsed time */
  setTimeTaken: (time: number) => void;
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

  const spawnFloatingFactor = useCallback((factor: FloatingFactor) => {
    dispatch({ type: 'SPAWN_FLOATING_FACTOR', factor });
  }, []);

  const tickFloatingFactors = useCallback((deltaTime: number) => {
    dispatch({ type: 'TICK_FLOATING_FACTORS', deltaTime });
  }, []);

  const removeFloatingFactor = useCallback((factorId: string) => {
    dispatch({ type: 'REMOVE_FLOATING_FACTOR', factorId });
  }, []);

  const grabFactor = useCallback(
    (floatingFactorId: string, cursorPosition: { x: number; y: number }) => {
      dispatch({ type: 'GRAB_FACTOR', floatingFactorId, cursorPosition });
    },
    []
  );

  const updateHeldPosition = useCallback(
    (cursorPosition: { x: number; y: number }) => {
      dispatch({ type: 'UPDATE_HELD_POSITION', cursorPosition });
    },
    []
  );

  const dropFactor = useCallback(() => {
    dispatch({ type: 'DROP_FACTOR' });
  }, []);

  const spawnAntagonist = useCallback((antagonist: Antagonist) => {
    dispatch({ type: 'SPAWN_ANTAGONIST', antagonist });
  }, []);

  const tickAntagonists = useCallback(
    (updatedAntagonists: Antagonist[], destroyedFactorIds: string[]) => {
      dispatch({ type: 'TICK_ANTAGONISTS', updatedAntagonists, destroyedFactorIds });
    },
    []
  );

  const destroyFactor = useCallback(
    (factorId: string, antagonistId: string) => {
      dispatch({ type: 'DESTROY_FACTOR', factorId, antagonistId });
    },
    []
  );

  const incrementBleeding = useCallback(
    (amount: number, reason: 'escape' | 'antithrombin' | 'apc' | 'plasmin') => {
      dispatch({ type: 'INCREMENT_BLEEDING', amount, reason });
    },
    []
  );

  const setGameResult = useCallback((result: GameResult) => {
    dispatch({ type: 'SET_GAME_RESULT', result });
  }, []);

  const incrementFactorsCaught = useCallback(() => {
    dispatch({ type: 'INCREMENT_FACTORS_CAUGHT' });
  }, []);

  const setTimeTaken = useCallback((time: number) => {
    dispatch({ type: 'SET_TIME_TAKEN', time });
  }, []);

  return {
    state,
    selectFactor,
    deselectFactor,
    attemptPlace,
    attemptComplexPlace,
    resetGame,
    subscribeToEvents,
    spawnFloatingFactor,
    tickFloatingFactors,
    removeFloatingFactor,
    grabFactor,
    updateHeldPosition,
    dropFactor,
    spawnAntagonist,
    tickAntagonists,
    destroyFactor,
    incrementBleeding,
    setGameResult,
    incrementFactorsCaught,
    setTimeTaken,
  };
}
