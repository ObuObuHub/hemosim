// hooks/useAnimationController.ts
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { GameState, VisualState, AnimationState, Surface } from '@/types/game';
import type { GameEvent } from '@/types/game-events';
import {
  sortByPriority,
  hasCriticalEvent,
  getEventPriority,
  isCriticalEvent,
} from '@/lib/event-priority';
import { lerp, isApproximatelyEqual } from '@/lib/lerp';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Interpolation factor for meter animations (higher = faster) */
const METER_LERP_FACTOR = 0.1;

/** Stagger delay between standard events (ms) */
const STANDARD_STAGGER_MS = 200;

/** Fast-forward playback speed multiplier */
const FAST_FORWARD_SPEED = 4;

/** Normal playback speed */
const NORMAL_SPEED = 1;

/** Frame interval for 60fps lerp updates (ms) */
const FRAME_INTERVAL_MS = 16;

/** Epsilon for meter value comparison */
const METER_EPSILON = 0.5;

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

function createInitialMeterState(value: number): {
  current: number;
  target: number;
  velocity: number;
} {
  return { current: value, target: value, velocity: 0 };
}

function createInitialVisualState(gameState: GameState): VisualState {
  const initialAnimationState: AnimationState = {
    movingFactor: null,
    highlightedSlots: [],
    activeEffects: [],
    pulsingArrows: [],
    activeToast: null,
  };

  return {
    thrombinMeter: createInitialMeterState(gameState.thrombinMeter),
    fibrinMeter: createInitialMeterState(0), // Not yet in game state
    clotIntegrityMeter: createInitialMeterState(0), // Not yet in game state
    panelStates: {
      'tf-cell': { state: 'active', opacity: 1 },
      platelet: { state: 'locked', opacity: 0.5 },
      'activated-platelet': { state: 'locked', opacity: 0.3 },
      'clot-zone': { state: 'locked', opacity: 0.3 },
    },
    factorPositions: {},
    animation: initialAnimationState,
  };
}

// =============================================================================
// TYPES
// =============================================================================

export interface AnimationController {
  /** Current visual state for rendering */
  visualState: VisualState;
  /** Enqueue events for animated processing */
  enqueue: (events: GameEvent[]) => void;
  /** Whether the controller is currently processing events */
  isProcessing: boolean;
  /** Number of events waiting in the queue */
  pendingCount: number;
}

// =============================================================================
// EVENT HANDLERS (stub implementations - will be expanded)
// =============================================================================

/**
 * Gets the animation duration for an event type.
 * Returns 0 for events that don't need animation.
 */
function getEventAnimationDuration(event: GameEvent): number {
  const priority = getEventPriority(event);

  // Low priority events don't animate individually
  if (priority === 'low') {
    return 0;
  }

  // Critical events have longer durations for dramatic effect
  if (priority === 'critical') {
    switch (event.type) {
      case 'PHASE_UNLOCKED':
        return 500;
      case 'VICTORY':
        return 1000;
      case 'GAME_OVER':
        return 800;
      default:
        return 300;
    }
  }

  // Standard events have medium durations
  switch (event.type) {
    case 'FACTOR_SELECTED':
      return 100;
    case 'FACTOR_PLACED':
      return 300;
    case 'FACTOR_CONVERTED':
      return 400;
    case 'FACTOR_TRANSFERRED':
      return 350;
    case 'COMPLEX_PART_DOCKED':
      return 250;
    case 'COMPLEX_COMPLETED':
      return 500;
    case 'COMPLEX_OUTPUT':
      return 300;
    case 'SIGNAL_FLOW':
      return 400;
    case 'PANEL_STATE_CHANGED':
      return 200;
    default:
      return 200;
  }
}

/**
 * Applies an event's effects to the visual state.
 * This is where event-specific visual changes happen.
 */
function applyEventToVisualState(
  visualState: VisualState,
  event: GameEvent
): VisualState {
  switch (event.type) {
    case 'METER_CHANGED': {
      // Update the target value - lerp will animate toward it
      if (event.meter === 'thrombin') {
        return {
          ...visualState,
          thrombinMeter: {
            ...visualState.thrombinMeter,
            target: event.target,
          },
        };
      }
      if (event.meter === 'fibrin') {
        return {
          ...visualState,
          fibrinMeter: {
            ...visualState.fibrinMeter,
            target: event.target,
          },
        };
      }
      if (event.meter === 'clotIntegrity') {
        return {
          ...visualState,
          clotIntegrityMeter: {
            ...visualState.clotIntegrityMeter,
            target: event.target,
          },
        };
      }
      return visualState;
    }

    case 'PANEL_STATE_CHANGED': {
      const surfaceKey = event.surface as Surface;
      const newOpacity = event.state === 'locked' ? 0.5 : 1;
      return {
        ...visualState,
        panelStates: {
          ...visualState.panelStates,
          [surfaceKey]: {
            state: event.state,
            opacity: newOpacity,
          },
        },
      };
    }

    case 'ARROW_PULSE': {
      const newArrow = {
        fromNode: event.fromNode,
        toNode: event.toNode,
        style: event.style,
        label: event.label,
      };
      return {
        ...visualState,
        animation: {
          ...visualState.animation,
          pulsingArrows: [...visualState.animation.pulsingArrows, newArrow],
        },
      };
    }

    case 'PHASE_UNLOCKED':
    case 'VICTORY':
    case 'GAME_OVER': {
      // Critical events could trigger toasts - placeholder for now
      const toastType =
        event.type === 'VICTORY'
          ? 'success'
          : event.type === 'GAME_OVER'
            ? 'error'
            : 'phase';
      const message =
        event.type === 'VICTORY'
          ? 'Victory!'
          : event.type === 'GAME_OVER'
            ? `Game Over: ${event.reason}`
            : `${event.phase} phase unlocked!`;

      return {
        ...visualState,
        animation: {
          ...visualState.animation,
          activeToast: {
            message,
            type: toastType as 'success' | 'error' | 'info' | 'phase',
            expiresAt: Date.now() + 3000,
          },
        },
      };
    }

    // Standard events - will add animations in future tasks
    case 'FACTOR_SELECTED':
    case 'FACTOR_PLACED':
    case 'FACTOR_CONVERTED':
    case 'FACTOR_TRANSFERRED':
    case 'COMPLEX_PART_DOCKED':
    case 'COMPLEX_COMPLETED':
    case 'COMPLEX_OUTPUT':
    case 'SIGNAL_FLOW':
    default:
      return visualState;
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Main animation controller hook.
 * Manages the animation queue and interpolates visual state.
 *
 * Key behaviors:
 * - Queue management: Events enter FIFO queue, sorted by priority
 * - Priority-based processing:
 *   - CRITICAL events set playbackSpeed = 4x for existing queue (fast-forward)
 *   - STANDARD events play sequentially with ~200ms stagger
 *   - LOW events just update target values (throttled)
 * - Visual state interpolation: 60fps lerp for meters toward logical targets
 * - Processing loop: Async processNext() that consumes queue
 *
 * @param gameState - Current game state (logical truth)
 * @returns Animation controller interface
 */
export function useAnimationController(gameState: GameState): AnimationController {
  // Visual state - interpolated values for rendering
  const [visualState, setVisualState] = useState<VisualState>(() =>
    createInitialVisualState(gameState)
  );

  // Queue and processing state
  const queueRef = useRef<GameEvent[]>([]);
  const processingRef = useRef<boolean>(false);
  const speedRef = useRef<number>(NORMAL_SPEED);

  // Processing state for render (synced with ref)
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Pending count state (needs to trigger re-renders for UI)
  const [pendingCount, setPendingCount] = useState<number>(0);

  // ==========================================================================
  // QUEUE PROCESSING
  // ==========================================================================

  const processNext = useCallback(async (): Promise<void> => {
    // If already processing or queue empty, return
    if (processingRef.current || queueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    while (queueRef.current.length > 0) {
      const event = queueRef.current.shift()!;
      setPendingCount(queueRef.current.length);

      // Get animation duration for this event
      const baseDuration = getEventAnimationDuration(event);
      const duration = baseDuration / speedRef.current;

      // Apply event to visual state
      setVisualState((prev) => applyEventToVisualState(prev, event));

      // Wait for animation duration (if any)
      if (duration > 0) {
        await new Promise((resolve) => setTimeout(resolve, duration));
      }

      // Reset speed after processing a critical event
      if (isCriticalEvent(event)) {
        speedRef.current = NORMAL_SPEED;
      }

      // Add stagger delay for standard events
      const priority = getEventPriority(event);
      if (priority === 'standard' && queueRef.current.length > 0) {
        const staggerDelay = STANDARD_STAGGER_MS / speedRef.current;
        await new Promise((resolve) => setTimeout(resolve, staggerDelay));
      }
    }

    processingRef.current = false;
    setIsProcessing(false);
    setPendingCount(0);
  }, []);

  // ==========================================================================
  // ENQUEUE
  // ==========================================================================

  const enqueue = useCallback(
    (events: GameEvent[]): void => {
      if (events.length === 0) {
        return;
      }

      // Sort events by priority (critical first)
      const sortedEvents = sortByPriority(events);

      // Check if any critical events - if so, fast-forward existing queue
      if (hasCriticalEvent(sortedEvents) && queueRef.current.length > 0) {
        speedRef.current = FAST_FORWARD_SPEED;
      }

      // Add to queue (critical events already sorted to front)
      queueRef.current.push(...sortedEvents);
      setPendingCount(queueRef.current.length);

      // Start processing if not already
      if (!processingRef.current) {
        void processNext();
      }
    },
    [processNext]
  );

  // ==========================================================================
  // REFS FOR GAME STATE (to use in interval without causing re-subscriptions)
  // ==========================================================================

  const gameStateRef = useRef(gameState);

  // Sync ref with latest gameState (must be in effect per React 19 rules)
  useEffect(() => {
    gameStateRef.current = gameState;
  });

  // ==========================================================================
  // 60FPS LERP EFFECT FOR METERS
  // Combines interpolation with target syncing from gameState
  // ==========================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      const currentGameState = gameStateRef.current;

      setVisualState((prev) => {
        // Get targets from game state (source of truth)
        const thrombinTarget = currentGameState.thrombinMeter;

        // Compute panel states from game phase
        const newPanelStates = { ...prev.panelStates };
        newPanelStates['tf-cell'] = { state: 'active', opacity: 1 };

        if (currentGameState.phase === 'amplification' || currentGameState.phase === 'propagation') {
          newPanelStates.platelet = { state: 'active', opacity: 1 };
        } else if (currentGameState.phase === 'complete') {
          newPanelStates.platelet = { state: 'completed', opacity: 1 };
        } else {
          newPanelStates.platelet = { state: 'locked', opacity: 0.5 };
        }

        if (currentGameState.phase === 'propagation' || currentGameState.phase === 'stabilization') {
          newPanelStates['activated-platelet'] = { state: 'active', opacity: 1 };
        } else if (currentGameState.phase === 'complete') {
          newPanelStates['activated-platelet'] = { state: 'completed', opacity: 1 };
        } else {
          newPanelStates['activated-platelet'] = { state: 'locked', opacity: 0.3 };
        }

        if (currentGameState.phase === 'stabilization') {
          newPanelStates['clot-zone'] = { state: 'active', opacity: 1 };
        } else if (currentGameState.phase === 'complete') {
          newPanelStates['clot-zone'] = { state: 'completed', opacity: 1 };
        } else {
          newPanelStates['clot-zone'] = { state: 'locked', opacity: 0.3 };
        }

        // Check if any meters need interpolation
        const thrombinNeedsUpdate = !isApproximatelyEqual(
          prev.thrombinMeter.current,
          thrombinTarget,
          METER_EPSILON
        );
        const fibrinNeedsUpdate = !isApproximatelyEqual(
          prev.fibrinMeter.current,
          prev.fibrinMeter.target,
          METER_EPSILON
        );
        const clotNeedsUpdate = !isApproximatelyEqual(
          prev.clotIntegrityMeter.current,
          prev.clotIntegrityMeter.target,
          METER_EPSILON
        );

        // Check if panel states changed
        const panelStatesChanged =
          prev.panelStates['tf-cell'].state !== newPanelStates['tf-cell'].state ||
          prev.panelStates.platelet.state !== newPanelStates.platelet.state ||
          prev.panelStates['activated-platelet'].state !== newPanelStates['activated-platelet'].state ||
          prev.panelStates['clot-zone'].state !== newPanelStates['clot-zone'].state;

        // Skip update if nothing needs interpolation and panels unchanged
        if (!thrombinNeedsUpdate && !fibrinNeedsUpdate && !clotNeedsUpdate && !panelStatesChanged) {
          return prev;
        }

        return {
          ...prev,
          thrombinMeter: {
            ...prev.thrombinMeter,
            target: thrombinTarget,
            current: thrombinNeedsUpdate
              ? lerp(prev.thrombinMeter.current, thrombinTarget, METER_LERP_FACTOR)
              : prev.thrombinMeter.current,
          },
          fibrinMeter: {
            ...prev.fibrinMeter,
            current: fibrinNeedsUpdate
              ? lerp(prev.fibrinMeter.current, prev.fibrinMeter.target, METER_LERP_FACTOR)
              : prev.fibrinMeter.current,
          },
          clotIntegrityMeter: {
            ...prev.clotIntegrityMeter,
            current: clotNeedsUpdate
              ? lerp(prev.clotIntegrityMeter.current, prev.clotIntegrityMeter.target, METER_LERP_FACTOR)
              : prev.clotIntegrityMeter.current,
          },
          panelStates: newPanelStates,
        };
      });
    }, FRAME_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    visualState,
    enqueue,
    isProcessing,
    pendingCount,
  };
}
