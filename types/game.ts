// types/game.ts
'use strict';

// =============================================================================
// SURFACE & CATEGORY TYPES
// =============================================================================

export type Surface = 'tf-cell' | 'platelet' | 'activated-platelet';

export type FactorCategory = 'zymogen' | 'procofactor' | 'enzyme' | 'cofactor';

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

export type GamePhase = 'initiation' | 'amplification' | 'complete';

// =============================================================================
// GAME STATE
// =============================================================================

export interface GameState {
  phase: GamePhase;
  thrombinMeter: number; // 0-100, threshold at 30
  slots: Slot[];
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
  | { type: 'RESET_GAME' };

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}
