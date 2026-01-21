// types/game-events.ts
'use strict';

// =============================================================================
// EVENT PRIORITY LEVELS
// =============================================================================

export type EventPriority = 'critical' | 'standard' | 'low';

// =============================================================================
// CRITICAL PRIORITY EVENTS
// These events represent major game state transitions
// =============================================================================

export interface PhaseUnlockedEvent {
  type: 'PHASE_UNLOCKED';
  phase: 'amplification' | 'propagation' | 'stabilization';
  trigger: string;
}

export interface VictoryEvent {
  type: 'VICTORY';
  finalThrombin: number;
  complexesBuilt: string[];
}

export interface GameOverEvent {
  type: 'GAME_OVER';
  reason: 'timeout' | 'mistakes_exceeded' | 'inhibitor_overwhelm';
}

// =============================================================================
// STANDARD PRIORITY EVENTS
// These events represent normal gameplay actions and state changes
// =============================================================================

export interface FactorSelectedEvent {
  type: 'FACTOR_SELECTED';
  factorId: string;
  fromLocation: 'palette' | 'circulation';
}

export interface FactorPlacedEvent {
  type: 'FACTOR_PLACED';
  factorId: string;
  slotId: string;
  surface: string;
  success: boolean;
  errorReason?: string;
}

export interface FactorConvertedEvent {
  type: 'FACTOR_CONVERTED';
  fromId: string;
  toLabel: string;
  surface: string;
  mechanism: 'proteolysis' | 'activation' | 'dissociation';
  catalyst: string;
}

export interface FactorTransferredEvent {
  type: 'FACTOR_TRANSFERRED';
  factorId: string;
  fromSurface: string;
  toDestination: 'circulation' | 'signal';
}

export interface ComplexPartDockedEvent {
  type: 'COMPLEX_PART_DOCKED';
  complexType: 'tenase' | 'prothrombinase';
  role: 'enzyme' | 'cofactor';
  factorId: string;
}

export interface ComplexCompletedEvent {
  type: 'COMPLEX_COMPLETED';
  complexType: 'tenase' | 'prothrombinase';
  efficiency: number;
}

export interface ComplexOutputEvent {
  type: 'COMPLEX_OUTPUT';
  complexType: 'tenase' | 'prothrombinase';
  outputFactorId: string;
  quantity: number;
}

export interface SignalFlowEvent {
  type: 'SIGNAL_FLOW';
  signal: 'THR' | 'Spark THR';
  fromSurface: string;
  toSurface: string;
  intensity: 'starter' | 'burst';
}

export interface PanelStateChangedEvent {
  type: 'PANEL_STATE_CHANGED';
  surface: string;
  state: 'locked' | 'active' | 'completed';
}

// =============================================================================
// LOW PRIORITY EVENTS
// These events represent visual feedback and UI updates
// =============================================================================

export interface MeterChangedEvent {
  type: 'METER_CHANGED';
  meter: 'thrombin' | 'fibrin' | 'clotIntegrity' | 'plateletActivation';
  target: number;
  delta: number;
}

export interface ArrowPulseEvent {
  type: 'ARROW_PULSE';
  fromNode: string;
  toNode: string;
  style: 'solid' | 'dotted';
  label?: string;
}

// =============================================================================
// STABILIZATION PHASE EVENTS
// =============================================================================

export interface FibrinogenDockedEvent {
  type: 'FIBRINOGEN_DOCKED';
  slotId: string;
}

export interface FibrinogenConvertedEvent {
  type: 'FIBRINOGEN_CONVERTED';
  slotId: string;
  integrityDelta: number; // +25
  totalIntegrity: number;
}

export interface FXIIIDockedEvent {
  type: 'FXIII_DOCKED';
  slotId: string;
}

export interface FXIIIActivatedEvent {
  type: 'FXIII_ACTIVATED';
  slotId: string;
  integrityDelta: number; // +25
  totalIntegrity: number;
}

export interface CrossLinkFormedEvent {
  type: 'CROSS_LINK_FORMED';
  fibrinSlotIds: string[];
}

export interface ClotStabilizedEvent {
  type: 'CLOT_STABILIZED';
  finalIntegrity: number; // 100
}

// =============================================================================
// TFPI EVENTS
// =============================================================================

export interface TFPIActivatedEvent {
  type: 'TFPI_ACTIVATED';
}

// =============================================================================
// ANTAGONIST EVENTS
// =============================================================================

export interface FactorDestroyedEvent {
  type: 'FACTOR_DESTROYED';
  factorId: string;
  antagonistType: 'antithrombin' | 'apc' | 'plasmin';
  antagonistId: string;
}

// =============================================================================
// UNION TYPE
// =============================================================================

export type GameEvent =
  // Critical priority
  | PhaseUnlockedEvent
  | VictoryEvent
  | GameOverEvent
  | ClotStabilizedEvent
  | TFPIActivatedEvent
  // Standard priority
  | FactorSelectedEvent
  | FactorPlacedEvent
  | FactorConvertedEvent
  | FactorTransferredEvent
  | ComplexPartDockedEvent
  | ComplexCompletedEvent
  | ComplexOutputEvent
  | SignalFlowEvent
  | PanelStateChangedEvent
  | FibrinogenConvertedEvent
  | FXIIIActivatedEvent
  | CrossLinkFormedEvent
  | FactorDestroyedEvent
  // Low priority
  | MeterChangedEvent
  | ArrowPulseEvent
  | FibrinogenDockedEvent
  | FXIIIDockedEvent;

// =============================================================================
// EVENT UTILITIES
// =============================================================================

/**
 * Returns the priority level for a given event type
 */
export function getEventPriority(event: GameEvent): EventPriority {
  switch (event.type) {
    case 'PHASE_UNLOCKED':
    case 'VICTORY':
    case 'GAME_OVER':
    case 'CLOT_STABILIZED':
    case 'TFPI_ACTIVATED':
    case 'FXIII_ACTIVATED':
      return 'critical';

    case 'FACTOR_SELECTED':
    case 'FACTOR_PLACED':
    case 'FACTOR_CONVERTED':
    case 'FACTOR_TRANSFERRED':
    case 'COMPLEX_PART_DOCKED':
    case 'COMPLEX_COMPLETED':
    case 'COMPLEX_OUTPUT':
    case 'SIGNAL_FLOW':
    case 'PANEL_STATE_CHANGED':
    case 'FIBRINOGEN_CONVERTED':
    case 'CROSS_LINK_FORMED':
    case 'FACTOR_DESTROYED':
      return 'standard';

    case 'METER_CHANGED':
    case 'ARROW_PULSE':
    case 'FIBRINOGEN_DOCKED':
    case 'FXIII_DOCKED':
      return 'low';
  }
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isCriticalEvent(
  event: GameEvent
): event is PhaseUnlockedEvent | VictoryEvent | GameOverEvent | ClotStabilizedEvent | TFPIActivatedEvent | FXIIIActivatedEvent {
  return getEventPriority(event) === 'critical';
}

export function isStandardEvent(event: GameEvent): boolean {
  return getEventPriority(event) === 'standard';
}

export function isLowPriorityEvent(
  event: GameEvent
): event is MeterChangedEvent | ArrowPulseEvent | FibrinogenDockedEvent | FXIIIDockedEvent {
  return getEventPriority(event) === 'low';
}
