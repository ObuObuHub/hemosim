// engine/game/animation-configs.ts
'use strict';

import type {
  GameEvent,
  FactorConvertedEvent,
  PhaseUnlockedEvent,
  ComplexCompletedEvent,
  SignalFlowEvent,
  VictoryEvent,
  GameOverEvent,
  FibrinogenConvertedEvent,
  FXIIIActivatedEvent,
  CrossLinkFormedEvent,
  ClotStabilizedEvent,
  EventPriority,
} from '@/types/game-events';

// =============================================================================
// ANIMATION STEP TYPE
// =============================================================================

export interface AnimationStep {
  /** Element identifier for the animation target */
  target: string;
  /** Delay in ms before this step starts (relative to animation start) */
  delay: number;
  /** Duration in ms for this step to complete */
  duration: number;
  /** Framer Motion style props for the animation */
  animation?: Record<string, unknown>;
  /** Text to display during this step */
  label?: string;
}

// =============================================================================
// ANIMATION CONFIG TYPE
// =============================================================================

export interface AnimationConfig {
  /** Total animation duration in ms */
  duration: number;
  /** Priority level for the animation */
  priority: EventPriority;
  /** Ordered list of animation steps */
  steps: AnimationStep[];
}

// =============================================================================
// ANIMATION DURATIONS (ms)
// =============================================================================

export const ANIMATION_DURATIONS = {
  // Critical priority
  PHASE_UNLOCKED: 2000,
  VICTORY: 2500,
  GAME_OVER: 2000,
  FXIII_ACTIVATED: 1500,
  CLOT_STABILIZED: 2000,

  // Standard priority
  FACTOR_SELECTED: 100,
  FACTOR_PLACED: 200,
  FACTOR_CONVERTED: 800,
  FACTOR_TRANSFERRED: 400,
  COMPLEX_PART_DOCKED: 300,
  COMPLEX_COMPLETED: 1500,
  COMPLEX_OUTPUT: 500,
  SIGNAL_FLOW: 1200,
  PANEL_STATE_CHANGED: 300,
  FIBRINOGEN_CONVERTED: 800,
  CROSS_LINK_FORMED: 1000,

  // Low priority
  METER_CHANGED: 0, // Instant, lerped by controller
  ARROW_PULSE: 300,
  FIBRINOGEN_DOCKED: 200,
  FXIII_DOCKED: 200,
} as const;

// =============================================================================
// CRITICAL PRIORITY ANIMATIONS
// =============================================================================

function phaseUnlockedAnimation(event: PhaseUnlockedEvent): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.PHASE_UNLOCKED,
    priority: 'critical',
    steps: [
      {
        target: 'signal-particles',
        delay: 0,
        duration: 600,
        animation: {
          opacity: [0, 1, 0],
          scale: [0.5, 1.2, 0],
        },
      },
      {
        target: 'lock',
        delay: 600,
        duration: 400,
        animation: {
          x: [0, -5, 5, -5, 5, 0],
          rotate: [0, -10, 10, -10, 10, 0],
        },
      },
      {
        target: 'lock',
        delay: 1000,
        duration: 300,
        animation: {
          scale: [1, 1.2, 0],
          opacity: [1, 1, 0],
        },
      },
      {
        target: 'panel',
        delay: 1300,
        duration: 700,
        animation: {
          filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
          borderColor: ['#334155', '#3B82F6'],
        },
      },
      {
        target: 'unlock-text',
        delay: 1300,
        duration: 700,
        label: `${event.phase.toUpperCase()} UNLOCKED`,
        animation: {
          opacity: [0, 1],
          y: [20, 0],
        },
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Event type required for signature consistency
function victoryAnimation(_event: VictoryEvent): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.VICTORY,
    priority: 'critical',
    steps: [
      {
        target: 'meter',
        delay: 0,
        duration: 500,
        animation: {
          width: ['0%', '100%'],
          backgroundColor: ['#EF4444', '#22C55E'],
        },
      },
      {
        target: 'toast',
        delay: 500,
        duration: 2000,
        label: 'CASCADE COMPLETE!',
        animation: {
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1.1, 1, 1],
          y: [50, 0, 0, -20],
        },
      },
    ],
  };
}

function gameOverAnimation(event: GameOverEvent): AnimationConfig {
  const reasonLabels: Record<typeof event.reason, string> = {
    timeout: 'TIME EXPIRED',
    mistakes_exceeded: 'TOO MANY ERRORS',
    inhibitor_overwhelm: 'INHIBITED',
  };

  return {
    duration: ANIMATION_DURATIONS.GAME_OVER,
    priority: 'critical',
    steps: [
      {
        target: 'overlay',
        delay: 0,
        duration: 500,
        animation: {
          opacity: [0, 0.8],
          backgroundColor: '#0F172A',
        },
      },
      {
        target: 'game-over-text',
        delay: 500,
        duration: 1500,
        label: reasonLabels[event.reason],
        animation: {
          opacity: [0, 1],
          scale: [0.5, 1],
        },
      },
    ],
  };
}

// =============================================================================
// STANDARD PRIORITY ANIMATIONS
// =============================================================================

function factorSelectedAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FACTOR_SELECTED,
    priority: 'standard',
    steps: [
      {
        target: 'token',
        delay: 0,
        duration: 100,
        animation: {
          scale: [1, 1.1],
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
        },
      },
    ],
  };
}

function factorPlacedAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FACTOR_PLACED,
    priority: 'standard',
    steps: [
      {
        target: 'token',
        delay: 0,
        duration: 150,
        animation: {
          scale: [1, 0.95, 1],
        },
      },
      {
        target: 'slot',
        delay: 0,
        duration: 200,
        animation: {
          borderColor: ['#22C55E', '#374151'],
          boxShadow: ['0 0 10px rgba(34, 197, 94, 0.5)', '0 0 0 transparent'],
        },
      },
    ],
  };
}

function factorConvertedAnimation(event: FactorConvertedEvent): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FACTOR_CONVERTED,
    priority: 'standard',
    steps: [
      {
        target: 'arrow-overlay',
        delay: 0,
        duration: 200,
        animation: {
          opacity: [0, 1],
          pathLength: [0, 1],
        },
      },
      {
        target: 'token',
        delay: 200,
        duration: 300,
        animation: {
          rotateY: [0, 90, 180],
          scale: [1, 1.1, 1],
        },
      },
      {
        target: 'label',
        delay: 350,
        duration: 300,
        label: event.mechanism,
        animation: {
          opacity: [0, 1, 1, 0],
          y: [-10, 0, 0, 10],
        },
      },
    ],
  };
}

function factorTransferredAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FACTOR_TRANSFERRED,
    priority: 'standard',
    steps: [
      {
        target: 'token',
        delay: 0,
        duration: 400,
        animation: {
          opacity: [1, 0.5, 0],
          scale: [1, 0.8],
          y: [0, -20],
        },
      },
    ],
  };
}

function complexPartDockedAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.COMPLEX_PART_DOCKED,
    priority: 'standard',
    steps: [
      {
        target: 'slot',
        delay: 0,
        duration: 200,
        animation: {
          borderColor: ['#374151', '#3B82F6'],
          scale: [1, 1.02, 1],
        },
      },
      {
        target: 'token',
        delay: 100,
        duration: 200,
        animation: {
          scale: [1.1, 1],
        },
      },
    ],
  };
}

function complexCompletedAnimation(event: ComplexCompletedEvent): AnimationConfig {
  const outputLabel = event.complexType === 'tenase' ? 'FXa generated' : 'Thrombin burst!';

  return {
    duration: ANIMATION_DURATIONS.COMPLEX_COMPLETED,
    priority: 'standard',
    steps: [
      {
        target: 'complex',
        delay: 0,
        duration: 400,
        animation: {
          boxShadow: [
            '0 0 0 transparent',
            '0 0 20px rgba(34, 197, 94, 0.8)',
            '0 0 30px rgba(34, 197, 94, 0.5)',
          ],
          borderColor: ['#374151', '#22C55E'],
        },
      },
      {
        target: 'bridge',
        delay: 400,
        duration: 300,
        animation: {
          opacity: [0, 1],
          scaleX: [0, 1],
        },
      },
      {
        target: 'output-token',
        delay: 700,
        duration: 500,
        animation: {
          opacity: [0, 1],
          scale: [0.5, 1.2, 1],
          y: [20, 0],
        },
      },
      {
        target: 'output-label',
        delay: 1000,
        duration: 300,
        label: outputLabel,
        animation: {
          opacity: [0, 1],
        },
      },
    ],
  };
}

function complexOutputAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.COMPLEX_OUTPUT,
    priority: 'standard',
    steps: [
      {
        target: 'output-token',
        delay: 0,
        duration: 300,
        animation: {
          scale: [1, 1.1],
          boxShadow: '0 0 15px rgba(34, 197, 94, 0.6)',
        },
      },
      {
        target: 'particles',
        delay: 200,
        duration: 300,
        animation: {
          opacity: [0, 1, 0],
          scale: [0.5, 1.5],
        },
      },
    ],
  };
}

function signalFlowAnimation(event: SignalFlowEvent): AnimationConfig {
  const particleCount = event.intensity === 'burst' ? 5 : 2;

  return {
    duration: ANIMATION_DURATIONS.SIGNAL_FLOW,
    priority: 'standard',
    steps: [
      {
        target: 'emitter',
        delay: 0,
        duration: 1200,
        animation: {
          particleCount,
          pathProgress: [0, 1],
          signal: event.signal,
        },
      },
    ],
  };
}

function panelStateChangedAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.PANEL_STATE_CHANGED,
    priority: 'standard',
    steps: [
      {
        target: 'panel',
        delay: 0,
        duration: 300,
        animation: {
          filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
        },
      },
    ],
  };
}

// =============================================================================
// LOW PRIORITY ANIMATIONS
// =============================================================================

function meterChangedAnimation(): AnimationConfig {
  // Duration is 0 because meter changes are lerped continuously by the controller
  return {
    duration: ANIMATION_DURATIONS.METER_CHANGED,
    priority: 'low',
    steps: [],
  };
}

function arrowPulseAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.ARROW_PULSE,
    priority: 'low',
    steps: [
      {
        target: 'arrow',
        delay: 0,
        duration: 300,
        animation: {
          opacity: [0.5, 1, 0.5],
          strokeWidth: [2, 3, 2],
        },
      },
    ],
  };
}

// =============================================================================
// STABILIZATION PHASE ANIMATIONS
// =============================================================================

function fibrinogenDockedAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FIBRINOGEN_DOCKED,
    priority: 'low',
    steps: [
      {
        target: 'slot',
        delay: 0,
        duration: 200,
        animation: {
          scale: [1, 1.05, 1],
          borderColor: ['#334155', '#F97316', '#334155'],
        },
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Event type required for signature consistency
function fibrinogenConvertedAnimation(_event: FibrinogenConvertedEvent): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FIBRINOGEN_CONVERTED,
    priority: 'standard',
    steps: [
      {
        target: 'factor-token',
        delay: 0,
        duration: 400,
        animation: {
          rotateY: [0, 90],
          scale: [1, 0.9],
        },
        label: 'Fibrinogen',
      },
      {
        target: 'factor-token',
        delay: 400,
        duration: 400,
        animation: {
          rotateY: [90, 0],
          scale: [0.9, 1],
        },
        label: 'Fibrin',
      },
      {
        target: 'fibrin-strand',
        delay: 600,
        duration: 200,
        animation: {
          opacity: [0, 1],
          pathLength: [0, 1],
        },
      },
    ],
  };
}

function fxiiiDockedAnimation(): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FXIII_DOCKED,
    priority: 'low',
    steps: [
      {
        target: 'slot',
        delay: 0,
        duration: 200,
        animation: {
          scale: [1, 1.05, 1],
          borderColor: ['#334155', '#FBBF24', '#334155'],
        },
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Event type required for signature consistency
function fxiiiActivatedAnimation(_event: FXIIIActivatedEvent): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.FXIII_ACTIVATED,
    priority: 'critical',
    steps: [
      {
        target: 'factor-token',
        delay: 0,
        duration: 400,
        animation: {
          rotateY: [0, 90],
          scale: [1, 0.9],
        },
        label: 'FXIII',
      },
      {
        target: 'factor-token',
        delay: 400,
        duration: 400,
        animation: {
          rotateY: [90, 0],
          scale: [0.9, 1.1, 1],
          boxShadow: [
            '0 0 0 rgba(251,191,36,0)',
            '0 0 20px rgba(251,191,36,0.8)',
            '0 0 10px rgba(251,191,36,0.5)',
          ],
        },
        label: 'FXIIIa',
      },
      {
        target: 'cross-link-flash',
        delay: 800,
        duration: 700,
        animation: {
          opacity: [0, 1, 1, 0],
          filter: ['brightness(1)', 'brightness(2)', 'brightness(1.5)', 'brightness(1)'],
        },
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Event type required for signature consistency
function crossLinkFormedAnimation(_event: CrossLinkFormedEvent): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.CROSS_LINK_FORMED,
    priority: 'standard',
    steps: [
      // Flash all fibrin strands
      {
        target: 'all-fibrin-strands',
        delay: 0,
        duration: 300,
        animation: {
          filter: ['brightness(1)', 'brightness(2)'],
        },
      },
      // Transform color from gray to gold
      {
        target: 'all-fibrin-strands',
        delay: 300,
        duration: 500,
        animation: {
          stroke: ['#9CA3AF', '#FBBF24'],
          strokeWidth: [2, 4],
          filter: ['brightness(2)', 'brightness(1)'],
        },
      },
      // Add glow effect
      {
        target: 'all-fibrin-strands',
        delay: 800,
        duration: 200,
        animation: {
          filter: ['brightness(1)', 'drop-shadow(0 0 4px rgba(251,191,36,0.5))'],
        },
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Event type required for signature consistency
function clotStabilizedAnimation(_event: ClotStabilizedEvent): AnimationConfig {
  return {
    duration: ANIMATION_DURATIONS.CLOT_STABILIZED,
    priority: 'critical',
    steps: [
      {
        target: 'clot-zone-panel',
        delay: 0,
        duration: 500,
        animation: {
          filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
          borderColor: ['#334155', '#22C55E'],
        },
      },
      {
        target: 'clot-integrity-meter',
        delay: 200,
        duration: 500,
        animation: {
          backgroundColor: ['#F97316', '#22C55E'],
          boxShadow: ['0 0 0 rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.8)'],
        },
      },
      {
        target: 'toast',
        delay: 700,
        duration: 1300,
        label: 'CLOT STABILIZED!',
        animation: {
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1.1, 1, 1],
          y: [50, 0, 0, -20],
        },
      },
    ],
  };
}

// =============================================================================
// DEFAULT ANIMATION
// =============================================================================

function defaultAnimation(): AnimationConfig {
  return {
    duration: 0,
    priority: 'low',
    steps: [],
  };
}

// =============================================================================
// MAIN EXPORT: getAnimationConfig
// =============================================================================

/**
 * Returns the animation configuration for a given game event.
 * Used by useAnimationController to determine timing and steps.
 */
export function getAnimationConfig(event: GameEvent): AnimationConfig {
  switch (event.type) {
    // Critical priority
    case 'PHASE_UNLOCKED':
      return phaseUnlockedAnimation(event);
    case 'VICTORY':
      return victoryAnimation(event);
    case 'GAME_OVER':
      return gameOverAnimation(event);
    case 'FXIII_ACTIVATED':
      return fxiiiActivatedAnimation(event);
    case 'CLOT_STABILIZED':
      return clotStabilizedAnimation(event);

    // Standard priority
    case 'FACTOR_SELECTED':
      return factorSelectedAnimation();
    case 'FACTOR_PLACED':
      return factorPlacedAnimation();
    case 'FACTOR_CONVERTED':
      return factorConvertedAnimation(event);
    case 'FACTOR_TRANSFERRED':
      return factorTransferredAnimation();
    case 'COMPLEX_PART_DOCKED':
      return complexPartDockedAnimation();
    case 'COMPLEX_COMPLETED':
      return complexCompletedAnimation(event);
    case 'COMPLEX_OUTPUT':
      return complexOutputAnimation();
    case 'SIGNAL_FLOW':
      return signalFlowAnimation(event);
    case 'PANEL_STATE_CHANGED':
      return panelStateChangedAnimation();
    case 'FIBRINOGEN_CONVERTED':
      return fibrinogenConvertedAnimation(event);
    case 'CROSS_LINK_FORMED':
      return crossLinkFormedAnimation(event);

    // Low priority
    case 'METER_CHANGED':
      return meterChangedAnimation();
    case 'ARROW_PULSE':
      return arrowPulseAnimation();
    case 'FIBRINOGEN_DOCKED':
      return fibrinogenDockedAnimation();
    case 'FXIII_DOCKED':
      return fxiiiDockedAnimation();

    default:
      // This should never happen if all event types are handled
      return defaultAnimation();
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Returns the total duration for a sequence of events.
 * Useful for calculating how long to wait before proceeding.
 */
export function getTotalDuration(events: GameEvent[]): number {
  return events.reduce((total, event) => {
    const config = getAnimationConfig(event);
    return total + config.duration;
  }, 0);
}

/**
 * Checks if an event has animation steps to execute.
 */
export function hasAnimationSteps(event: GameEvent): boolean {
  const config = getAnimationConfig(event);
  return config.steps.length > 0;
}

/**
 * Returns the delay before a specific step starts.
 */
export function getStepStartTime(config: AnimationConfig, stepIndex: number): number {
  if (stepIndex < 0 || stepIndex >= config.steps.length) {
    return 0;
  }
  return config.steps[stepIndex].delay;
}

/**
 * Returns when a specific step ends.
 */
export function getStepEndTime(config: AnimationConfig, stepIndex: number): number {
  if (stepIndex < 0 || stepIndex >= config.steps.length) {
    return 0;
  }
  const step = config.steps[stepIndex];
  return step.delay + step.duration;
}
