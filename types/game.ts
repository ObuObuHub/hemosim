// types/game.ts
'use strict';

// =============================================================================
// SURFACE & CATEGORY TYPES
// =============================================================================

export type Surface = 'tf-cell' | 'platelet' | 'activated-platelet';

export type FactorCategory = 'zymogen' | 'procofactor' | 'enzyme' | 'cofactor';

export type ComplexType = 'tenase' | 'prothrombinase';

// =============================================================================
// FACTOR DEFINITION
// =============================================================================

export interface FactorDefinition {
  id: string;
  inactiveLabel: string;
  activeLabel: string;
  category: FactorCategory;
  targetSurface: Surface;
  activationMessage: string;
  errorMessageWrongSlot: string;
  prerequisites: string[]; // factor IDs that must be placed/active first
  thrombinContribution: number; // how much this adds to thrombin meter (0-100)
  color: string;
}

// =============================================================================
// SLOT
// =============================================================================

export interface Slot {
  id: string;
  surface: Surface;
  acceptsFactorId: string;
  isLocked: boolean;
  placedFactorId: string | null;
  isActive: boolean; // has factor been converted to active form
  transferredToCirculation: boolean; // factor moved to circulation (e.g., FIXa)
}

// =============================================================================
// COMPLEX SLOT (Propagation phase - Tenase/Prothrombinase on activated platelets)
// =============================================================================

export interface ComplexSlot {
  id: string;
  complexType: ComplexType;
  role: 'enzyme' | 'cofactor';
  acceptsFactorId: string;
  placedFactorId: string | null;
  isAutoFilled: boolean; // cofactors auto-fill on phase transition
}

// =============================================================================
// PRE-PLACED ELEMENT (TF+VIIa, trace Va)
// =============================================================================

export interface PreplacedElement {
  id: string;
  label: string;
  tooltip: string;
  surface: Surface;
  isDim: boolean; // trace Va is dim, TF+VIIa is bright
}

// =============================================================================
// GAME PHASE
// =============================================================================

export type GamePhase = 'initiation' | 'amplification' | 'propagation' | 'complete';

// =============================================================================
// GAME STATE
// =============================================================================

export interface GameState {
  phase: GamePhase;
  thrombinMeter: number; // 0-100, threshold at 30
  slots: Slot[];
  complexSlots: ComplexSlot[]; // activated platelet complex slots (propagation)
  circulationFactors: string[]; // factors "in circulation" (e.g., FIXa held here)
  availableFactors: string[]; // factor IDs still in palette
  selectedFactorId: string | null;
  currentMessage: string;
  isError: boolean; // for error vs success message styling
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

export type GameAction =
  | { type: 'SELECT_FACTOR'; factorId: string }
  | { type: 'DESELECT_FACTOR' }
  | { type: 'ATTEMPT_PLACE'; slotId: string }
  | { type: 'ATTEMPT_COMPLEX_PLACE'; complexSlotId: string }
  | { type: 'RESET_GAME' };

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}
