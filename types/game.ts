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
// SCENE TYPES (Visual Overhaul)
// =============================================================================

export type GameScene = 'initiation' | 'amplification' | 'propagation' | 'stabilization' | 'victory';

export interface SceneObjective {
  id: string;
  description: string;
  isComplete: boolean;
}

export interface DockedComplex {
  id: string;
  complexType: 'tf-viia' | 'prothrombinase-init' | 'tenase' | 'prothrombinase';
  enzymeFactorId: string | null;
  cofactorFactorId: string | null;
  position: { x: number; y: number };
  isComplete: boolean;
}

export interface FibrinStrand {
  id: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  connectedTo: string[]; // IDs of other strands
  opacity: number;
}

export interface ActivationArrow {
  id: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  color: string;
  progress: number; // 0-1 for animation
  expiresAt: number;
}

// =============================================================================
// FACTOR SHAPE TYPES (Bio-Accurate)
// =============================================================================

/**
 * Bio-accurate shape types based on biochemical role
 * - zymogen: Rounded oval (inactive enzyme precursor)
 * - enzyme: Pac-man with bite (active site visible)
 * - cofactor: Rounded rectangle with side socket
 * - fibrinogen: Elongated oval
 * - fibrin: Rod with sticky ends
 */
export type BioShapeType = 'zymogen' | 'enzyme' | 'cofactor' | 'fibrinogen' | 'fibrin';

export interface FactorVisual {
  factorId: string;
  inactiveShape: BioShapeType;
  activeShape: BioShapeType;
  inactiveColor: string;
  activeColor: string;
  width: number;
  height: number;
  /** Vitamin K-dependent factors (II, VII, IX, X) have Gla domains for membrane binding */
  hasGlaDomain?: boolean;
}

/**
 * Puzzle-dock configuration for enzyme-cofactor pairing
 */
export interface DockConfig {
  enzymeFactorId: string;
  cofactorFactorId: string;
  /** Horizontal offset where enzyme bite meets cofactor socket */
  dockOffset: { x: number; y: number };
  /** Snap distance in pixels */
  snapDistance: number;
}

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
// MESSENGER FACTOR (FIXa traveling to Platelet)
// =============================================================================

export interface MessengerFactor {
  id: string;
  factorId: string; // 'FIXa'
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  origin: 'tf-cell' | 'platelet'; // tf-cell (from FIX) or platelet (from FXI loop)
  isVulnerableTo: InhibitorVulnerability[];
}

// =============================================================================
// SPILLOVER PARTICLE (Thrombin drifting to vessel wall)
// =============================================================================

export interface SpilloverParticle {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  lifetime: number; // seconds remaining
}

// =============================================================================
// THROMBOMODULIN ZONE (Vessel wall edges - static config in game-config.ts)
// =============================================================================

export interface ThrombomodulinZone {
  id: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  color: string;
}

// =============================================================================
// HELD FACTOR (Drag & Drop)
// =============================================================================

export interface HeldFactor {
  id: string;
  factorId: string;
  cursorPosition: { x: number; y: number };
}

// =============================================================================
// GAME STATE
// =============================================================================

export interface GameState {
  phase: GamePhase;
  thrombinMeter: number; // 0-100, now represents actual thrombin level
  plateletActivation: number; // NEW: 0-100, threshold at 100 to unlock platelet
  clotIntegrity: number; // 0-100, stabilization phase meter
  bleedingMeter: number; // 0-100, player loses at 100
  tfpiActive: boolean; // NEW: true when TFPI has shut down TF-VIIa
  localFXaCount: number; // NEW: count of FXa generated on TF-cell (triggers TFPI at 3)
  gameResult: GameResult; // current game outcome
  gameStats: GameStats; // statistics tracking
  slots: Slot[];
  complexSlots: ComplexSlot[]; // activated platelet complex slots (propagation)
  circulationFactors: string[]; // factors "in circulation" (e.g., FIXa held here)
  messengerFactors: MessengerFactor[]; // NEW: FIXa traveling from TF-cell
  spilloverParticles: SpilloverParticle[]; // NEW: thrombin drifting to edges
  availableFactors: string[]; // factor IDs still in palette
  selectedFactorId: string | null;
  currentMessage: string;
  isError: boolean; // for error vs success message styling
  floatingFactors: FloatingFactor[]; // factors floating in bloodstream zone
  heldFactor: HeldFactor | null; // factor currently being dragged
  antagonists: Antagonist[]; // antagonists hunting factors in bloodstream
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
  | { type: 'REMOVE_FLOATING_FACTOR'; factorId: string }
  | { type: 'GRAB_FACTOR'; floatingFactorId: string; cursorPosition: { x: number; y: number } }
  | { type: 'UPDATE_HELD_POSITION'; cursorPosition: { x: number; y: number } }
  | { type: 'DROP_FACTOR' }
  | { type: 'SPAWN_ANTAGONIST'; antagonist: Antagonist }
  | { type: 'TICK_ANTAGONISTS'; updatedAntagonists: Antagonist[]; destroyedFactorIds: string[] }
  | { type: 'DESTROY_FACTOR'; factorId: string; antagonistId: string }
  | { type: 'INCREMENT_BLEEDING'; amount: number; reason: 'escape' | 'antithrombin' | 'apc' | 'plasmin' }
  | { type: 'SET_GAME_RESULT'; result: GameResult }
  | { type: 'INCREMENT_FACTORS_CAUGHT' }
  | { type: 'SET_TIME_TAKEN'; time: number }
  | { type: 'SPAWN_MESSENGER'; messenger: MessengerFactor }
  | { type: 'TICK_MESSENGERS'; deltaTime: number }
  | { type: 'MESSENGER_ARRIVED'; messengerId: string }
  | { type: 'DESTROY_MESSENGER'; messengerId: string; antagonistId: string }
  | { type: 'INCREMENT_LOCAL_FXA' }
  | { type: 'ACTIVATE_TFPI' }
  | { type: 'SPAWN_SPILLOVER'; particle: SpilloverParticle }
  | { type: 'TICK_SPILLOVER'; deltaTime: number }
  | { type: 'SPILLOVER_HIT_EDGE'; particleId: string }
  | { type: 'TRIGGER_PROTEIN_C' }
  | { type: 'INCREMENT_PLATELET_ACTIVATION'; amount: number };

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

// =============================================================================
// ANTAGONIST TYPES
// =============================================================================

export type AntagonistType = 'antithrombin' | 'apc' | 'plasmin';

export type GameResult = 'playing' | 'victory' | 'defeat' | null;

export interface GameStats {
  factorsCaught: number;
  factorsLostToEscape: number;
  factorsLostToAntithrombin: number;
  factorsLostToAPC: number;
  factorsLostToPlasmin: number;
  timeTaken: number; // seconds
}

export type AntagonistState = 'patrol' | 'hunting' | 'attacking';

export interface Antagonist {
  id: string;
  type: AntagonistType;
  position: { x: number; y: number };
  targetFactorId: string | null;
  state: AntagonistState;
  speed: number;
}

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
// KINETIC STATE (Realistic Coagulation Simulation - Hoffman-Monroe Model)
// =============================================================================

/**
 * Kinetic state for realistic coagulation simulation
 * Based on the Hoffman-Monroe cell-based model of coagulation
 *
 * Concentrations are in relative units (0-100) for visualization
 * Real nM values are approximated for educational purposes
 */
export interface KineticState {
  // Concentrations (relative units 0-100, displayed as ~nM)
  tfVIIaComplex: number;      // TF-VIIa complex activity level
  fxaLocal: number;           // FXa generated on TF-cell membrane
  fixaLocal: number;          // FIXa generated locally on TF-cell
  fixaDiffused: number;       // FIXa that has diffused to platelet
  traceVa: number;            // Trace Va activity (seed for prothrombinase)
  thrombinSpark: number;      // Thrombin produced during initiation (the "spark")
  tfpiInhibition: number;     // TFPI inhibition progress (0-1, 1 = fully inhibited)

  // Activation states
  isTFExposed: boolean;       // Has TF been exposed (injury simulation)
  isTFVIIaActive: boolean;    // Is TF-VIIa complex actively producing?
  isProthrombinaseFormed: boolean; // Has minimal prothrombinase formed?
  isTFPIActivated: boolean;   // Has TFPI shut down TF-VIIa?
  isPlateletReady: boolean;   // Is platelet ready for handoff?

  // Feedback tracking
  feedbackVActivated: boolean;  // Has thrombin activated FV?
  feedbackVIIIActivated: boolean; // Has thrombin activated FVIII?

  // Timing (seconds elapsed in simulation)
  elapsedTime: number;
}

/**
 * Initial kinetic state for new game
 */
export const INITIAL_KINETIC_STATE: KineticState = {
  tfVIIaComplex: 0,
  fxaLocal: 0,
  fixaLocal: 0,
  fixaDiffused: 0,
  traceVa: 5, // Trace Va always present (seed)
  thrombinSpark: 0,
  tfpiInhibition: 0,

  isTFExposed: false,
  isTFVIIaActive: false,
  isProthrombinaseFormed: false,
  isTFPIActivated: false,
  isPlateletReady: false,

  feedbackVActivated: false,
  feedbackVIIIActivated: false,

  elapsedTime: 0,
};

/**
 * Diffusing FIXa particle for visualization
 */
export interface DiffusingFIXaParticle {
  id: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  progress: number; // 0-1, animation progress
  opacity: number;
}

/**
 * Diffusing FIIa (thrombin) particle for visualization
 * Auto-floats from TF-cell membrane to platelet after FII → FIIa conversion
 */
export interface DiffusingFIIaParticle {
  id: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  progress: number; // 0-1, animation progress
  opacity: number;
}

/**
 * TFPI-Xa complex visualization state
 */
export interface TFPIXaComplexState {
  isForming: boolean;
  formationProgress: number; // 0-1
  isInhibiting: boolean;
  inhibitionProgress: number; // 0-1
  position: { x: number; y: number };
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
