// types/game.ts
'use strict';

import type { GameEvent } from './game-events';

// =============================================================================
// SURFACE & CATEGORY TYPES
// =============================================================================

export type Surface = 'tf-cell' | 'platelet' | 'activated-platelet' | 'clot-zone';

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

/**
 * Runtime state for a slot - used by animation system
 */
export interface SlotState {
  slotId: string;
  acceptsFactorIds: string[];
  placedFactorId: string | null;
  isLocked: boolean;
  isActive: boolean;
  isHighlighted: boolean;
  isError: boolean;
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

export type GamePhase = 'initiation' | 'amplification' | 'propagation' | 'stabilization' | 'complete';

// =============================================================================
// FLOATING FACTOR (Bloodstream)
// =============================================================================

export type InhibitorVulnerability = 'antithrombin' | 'apc' | 'plasmin';

export interface FloatingFactor {
  id: string;
  factorId: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isVulnerableTo: InhibitorVulnerability[];
}

// =============================================================================
// GAME STATE
// =============================================================================

export interface GameState {
  phase: GamePhase;
  thrombinMeter: number; // 0-100, threshold at 30
  clotIntegrity: number; // 0-100, stabilization phase meter
  slots: Slot[];
  complexSlots: ComplexSlot[]; // activated platelet complex slots (propagation)
  circulationFactors: string[]; // factors "in circulation" (e.g., FIXa held here)
  availableFactors: string[]; // factor IDs still in palette
  selectedFactorId: string | null;
  currentMessage: string;
  isError: boolean; // for error vs success message styling
  floatingFactors: FloatingFactor[]; // factors floating in bloodstream zone
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

export type GameAction =
  | { type: 'SELECT_FACTOR'; factorId: string }
  | { type: 'DESELECT_FACTOR' }
  | { type: 'ATTEMPT_PLACE'; slotId: string }
  | { type: 'ATTEMPT_COMPLEX_PLACE'; complexSlotId: string }
  | { type: 'RESET_GAME' }
  | { type: 'SPAWN_FLOATING_FACTOR'; factor: FloatingFactor }
  | { type: 'TICK_FLOATING_FACTORS'; deltaTime: number }
  | { type: 'REMOVE_FLOATING_FACTOR'; factorId: string };

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

// =============================================================================
// REDUCER RESULT (State + Events)
// =============================================================================

/**
 * Return type for game reducer - includes both new state and emitted events
 */
export interface ReducerResult {
  state: GameState;
  events: GameEvent[];
}

// =============================================================================
// COMPLEX STATE
// =============================================================================

/**
 * Runtime state for a complex (tenase or prothrombinase)
 */
export interface ComplexState {
  complexType: ComplexType;
  enzymeSlotId: string;
  cofactorSlotId: string;
  enzymeFactorId: string | null;
  cofactorFactorId: string | null;
  isComplete: boolean;
  efficiency: number; // 0-100, affects output rate
}

// =============================================================================
// INHIBITOR STATE (Future use)
// =============================================================================

export type InhibitorType =
  | 'antithrombin'
  | 'protein_c'
  | 'protein_s'
  | 'tfpi'
  | 'plasmin';

/**
 * State for natural anticoagulant inhibitors (future expansion)
 */
export interface InhibitorState {
  type: InhibitorType;
  isActive: boolean;
  targetFactorIds: string[];
  inhibitionStrength: number; // 0-100
}

// =============================================================================
// ANIMATION STATE
// =============================================================================

/**
 * Visual state for animations - separate from game logic state
 */
export interface AnimationState {
  /** Currently animating factor movement */
  movingFactor: {
    factorId: string;
    fromPosition: { x: number; y: number };
    toPosition: { x: number; y: number };
    progress: number; // 0-1
  } | null;

  /** Slots that should pulse/highlight */
  highlightedSlots: string[];

  /** Active particle effects */
  activeEffects: Array<{
    id: string;
    type: 'sparkle' | 'pulse' | 'glow' | 'shake';
    targetId: string;
    startTime: number;
    duration: number;
  }>;

  /** Arrows currently pulsing */
  pulsingArrows: Array<{
    fromNode: string;
    toNode: string;
    style: 'solid' | 'dotted';
    label?: string;
  }>;

  /** Currently playing toast/message */
  activeToast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'phase';
    expiresAt: number;
  } | null;
}

// =============================================================================
// VISUAL STATE (Interpolated values for smooth animations)
// =============================================================================

/**
 * Interpolated meter values for smooth visual transitions
 */
export interface MeterVisualState {
  current: number; // interpolated display value
  target: number; // actual game state value
  velocity: number; // for spring animations
}

/**
 * Complete visual state for rendering - combines game state with animations
 */
export interface VisualState {
  /** Interpolated meter values for smooth animations */
  thrombinMeter: MeterVisualState;
  fibrinMeter: MeterVisualState;
  clotIntegrityMeter: MeterVisualState;

  /** Surface panel states */
  panelStates: Record<
    Surface,
    {
      state: 'locked' | 'active' | 'completed';
      opacity: number; // for fade transitions
    }
  >;

  /** Factor positions (for drag/drop animations) */
  factorPositions: Record<
    string,
    {
      x: number;
      y: number;
      scale: number;
      opacity: number;
    }
  >;

  /** Animation controller state */
  animation: AnimationState;
}
