// engine/game/validation-rules.ts
import type { GameState, ValidationResult } from '@/types/game';
import { getFactorDefinition } from './factor-definitions';

// =============================================================================
// THROMBIN THRESHOLD
// =============================================================================

export const THROMBIN_STARTER_THRESHOLD = 30;

// =============================================================================
// VALIDATION MESSAGES
// =============================================================================

const MESSAGES = {
  PANEL_LOCKED: 'Platelet not yet activated. Need starter thrombin (≥30%).',
  SLOT_OCCUPIED: 'This slot already has a factor placed.',
  WRONG_FACTOR_FOR_SLOT: (factorId: string) =>
    `${factorId} cannot bind to this slot. Check which surface accepts it.`,
  PREREQUISITE_MISSING: (factorId: string, prereqId: string) =>
    `${factorId} requires ${prereqId}a present. Place ${prereqId} first.`,
} as const;

// =============================================================================
// CORE VALIDATION FUNCTION
// =============================================================================

export function validatePlacement(
  state: GameState,
  factorId: string,
  slotId: string
): ValidationResult {
  const factor = getFactorDefinition(factorId);
  if (!factor) {
    return { isValid: false, errorMessage: `Unknown factor: ${factorId}` };
  }

  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot) {
    return { isValid: false, errorMessage: `Unknown slot: ${slotId}` };
  }

  // Check if slot is locked (platelet surface before thrombin threshold)
  if (slot.isLocked) {
    return { isValid: false, errorMessage: MESSAGES.PANEL_LOCKED };
  }

  // Check if slot already occupied
  if (slot.placedFactorId !== null) {
    return { isValid: false, errorMessage: MESSAGES.SLOT_OCCUPIED };
  }

  // Check if factor matches slot
  if (slot.acceptsFactorId !== factorId) {
    return { isValid: false, errorMessage: MESSAGES.WRONG_FACTOR_FOR_SLOT(factorId) };
  }

  // Check prerequisites (e.g., FII requires FX to be placed first)
  for (const prereqId of factor.prerequisites) {
    const prereqPlaced = state.slots.some(
      (s) => s.placedFactorId === prereqId && s.isActive
    );
    if (!prereqPlaced) {
      return {
        isValid: false,
        errorMessage: MESSAGES.PREREQUISITE_MISSING(factorId, prereqId),
      };
    }
  }

  return { isValid: true, errorMessage: null };
}

// =============================================================================
// HELPER: CHECK IF PLATELET SHOULD UNLOCK
// =============================================================================

export function shouldUnlockPlatelet(thrombinMeter: number): boolean {
  return thrombinMeter >= THROMBIN_STARTER_THRESHOLD;
}

// =============================================================================
// HELPER: CHECK VICTORY CONDITION
// =============================================================================

export function checkVictoryCondition(state: GameState): boolean {
  // Victory when Prothrombinase is complete (thrombin = 100%)
  const prothrombinaseComplete = state.complexSlots
    .filter((s) => s.complexType === 'prothrombinase')
    .every((s) => s.placedFactorId !== null);

  return state.thrombinMeter >= 100 && prothrombinaseComplete;
}

// =============================================================================
// HELPER: CHECK IF AMPLIFICATION PHASE IS COMPLETE
// =============================================================================

export function isAmplificationComplete(state: GameState): boolean {
  const fvPlaced = state.slots.some(
    (s) => s.placedFactorId === 'FV' && s.isActive
  );
  const fviiiPlaced = state.slots.some(
    (s) => s.placedFactorId === 'FVIII' && s.isActive
  );
  return fvPlaced && fviiiPlaced;
}

// =============================================================================
// HELPER: CHECK IF TENASE COMPLEX IS COMPLETE
// =============================================================================

export function isTenaseComplete(state: GameState): boolean {
  return state.complexSlots
    .filter((s) => s.complexType === 'tenase')
    .every((s) => s.placedFactorId !== null);
}

// =============================================================================
// COMPLEX SLOT VALIDATION
// =============================================================================

export function validateComplexPlacement(
  state: GameState,
  factorId: string,
  complexSlotId: string
): ValidationResult {
  const complexSlot = state.complexSlots.find((s) => s.id === complexSlotId);
  if (!complexSlot) {
    return { isValid: false, errorMessage: `Unknown complex slot: ${complexSlotId}` };
  }

  // Check if slot is already filled
  if (complexSlot.placedFactorId !== null) {
    return { isValid: false, errorMessage: 'This complex slot is already filled.' };
  }

  // Check if factor matches what slot accepts
  // Accept either the exact factorId or if the factor's activeLabel matches
  const expectedFactor = complexSlot.acceptsFactorId;
  const factor = getFactorDefinition(factorId);
  const matchesDirectly = factorId === expectedFactor;
  const matchesViaActiveLabel = factor?.activeLabel === expectedFactor;

  if (!matchesDirectly && !matchesViaActiveLabel) {
    return {
      isValid: false,
      errorMessage: `This slot requires ${expectedFactor}.`
    };
  }

  // For prothrombinase enzyme slot, Tenase must be complete first
  if (complexSlot.id === 'prothrombinase-enzyme' && !isTenaseComplete(state)) {
    return {
      isValid: false,
      errorMessage: 'Complete Tenase first to generate FXa for Prothrombinase.'
    };
  }

  return { isValid: true, errorMessage: null };
}

// =============================================================================
// HELPER: GET VALID SLOTS FOR FACTOR
// =============================================================================

export function getValidSlotsForFactor(state: GameState, factorId: string): string[] {
  const factor = getFactorDefinition(factorId);
  if (!factor) return [];

  return state.slots
    .filter((slot) => {
      // Must accept this factor
      if (slot.acceptsFactorId !== factorId) return false;
      // Must not be locked
      if (slot.isLocked) return false;
      // Must not be occupied
      if (slot.placedFactorId !== null) return false;
      // Prerequisites must be met
      for (const prereqId of factor.prerequisites) {
        const prereqPlaced = state.slots.some(
          (s) => s.placedFactorId === prereqId && s.isActive
        );
        if (!prereqPlaced) return false;
      }
      return true;
    })
    .map((s) => s.id);
}
