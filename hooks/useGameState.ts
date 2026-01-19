'use client';

import { useReducer, useCallback, useMemo } from 'react';
import type { GameState, GameFactor, DockingSlot, ComplexState, GamePhase } from '@/types/game';
import { getLevelConfig, PHYSICS, SCORING, INITIAL_LIVES, GAME_CANVAS } from '@/engine/game/game-config';
import { createGameFactor, getFactorConfig, resetFactorIdCounter } from '@/engine/game/factor-shapes';

// =============================================================================
// ACTION TYPES
// =============================================================================

export type GameAction =
  | { type: 'TICK'; deltaTime: number }
  | { type: 'SPAWN_FACTOR'; factorId: string }
  | { type: 'CATCH_FACTOR'; factorId: string }
  | { type: 'DOCK_FACTOR'; factorId: string; slotId: string }
  | { type: 'RELEASE_FACTOR'; factorId: string }
  | { type: 'START_GAME'; level: number }
  | { type: 'RESET_GAME' }
  | { type: 'COMPLETE_COMPLEX'; complexType: 'tenase' | 'prothrombinase' }
  | { type: 'LOSE_LIFE' }
  | { type: 'SET_PHASE'; phase: GamePhase };

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default game timer in seconds */
const DEFAULT_TIMER_SECONDS = 60;

/**
 * Accumulated time for sine wave drift calculation.
 * Module-level to maintain continuity across renders.
 * Reset in createInitialState when starting/resetting game.
 */
let accumulatedTime = 0;

/** Frame time for 60fps normalization */
const FRAME_TIME_60FPS_MS = 1000 / 60;

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

/**
 * Creates docking slots for the game based on level configuration.
 */
function createDockingSlots(level: number): DockingSlot[] {
  const levelConfig = getLevelConfig(level);
  const slots: DockingSlot[] = [];

  // Create slots for each target complex
  for (const complexType of levelConfig.targetComplexes) {
    if (complexType === 'tenase') {
      slots.push({
        id: 'tenase-enzyme',
        complexType: 'tenase',
        role: 'enzyme',
        acceptsFactors: ['F9a'],
        isLocked: false,
      });
      slots.push({
        id: 'tenase-cofactor',
        complexType: 'tenase',
        role: 'cofactor',
        acceptsFactors: ['F8a'],
        isLocked: false,
      });
    }

    if (complexType === 'prothrombinase') {
      // Prothrombinase slots start locked if Tenase is also a target
      // This implements sequential gating: Tenase must be built first
      const tenaseIsTarget = levelConfig.targetComplexes.includes('tenase');

      slots.push({
        id: 'prothrombinase-enzyme',
        complexType: 'prothrombinase',
        role: 'enzyme',
        acceptsFactors: ['F10a'],
        isLocked: tenaseIsTarget,
      });
      slots.push({
        id: 'prothrombinase-cofactor',
        complexType: 'prothrombinase',
        role: 'cofactor',
        acceptsFactors: ['F5a'],
        isLocked: tenaseIsTarget,
      });
    }
  }

  return slots;
}

/**
 * Creates initial complex states based on level configuration.
 */
function createComplexStates(level: number): ComplexState[] {
  const levelConfig = getLevelConfig(level);
  const complexes: ComplexState[] = [];

  for (const complexType of levelConfig.targetComplexes) {
    // Only add unique complex types
    if (!complexes.some((c) => c.type === complexType)) {
      complexes.push({
        type: complexType,
        enzyme: null,
        cofactor: null,
        isActive: false,
      });
    }
  }

  return complexes;
}

/**
 * Creates the initial game state for a given level.
 */
function createInitialState(level: number): GameState {
  // Reset factor ID counter for a fresh game
  resetFactorIdCounter();
  accumulatedTime = 0;

  return {
    phase: 'catch',
    score: 0,
    lives: INITIAL_LIVES,
    timer: DEFAULT_TIMER_SECONDS,
    factors: [],
    dockingSlots: createDockingSlots(level),
    complexes: createComplexStates(level),
    antagonist: null,
    currentLevel: level,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates a random spawn position at the top of the canvas.
 */
function generateSpawnPosition(): { x: number; y: number } {
  const padding = 50;
  return {
    x: padding + Math.random() * (GAME_CANVAS.width - padding * 2),
    y: -50, // Start above the visible canvas
  };
}

/**
 * Generates a random downward velocity for a spawned factor.
 */
function generateSpawnVelocity(level: number): { x: number; y: number } {
  const levelConfig = getLevelConfig(level);
  const speedMultiplier = levelConfig.difficulty.speedMultiplier;

  // Random speed between min and max, scaled by level difficulty
  const baseSpeed = PHYSICS.minSpeed + Math.random() * (PHYSICS.maxSpeed - PHYSICS.minSpeed);
  const speed = baseSpeed * speedMultiplier;

  // Slight horizontal drift
  const horizontalDrift = (Math.random() - 0.5) * 0.5;

  return {
    x: horizontalDrift,
    y: speed,
  };
}

/**
 * Checks if a factor is within the screen bounds.
 */
function isFactorInBounds(factor: GameFactor): boolean {
  const margin = 100; // Allow some margin for factors partially off-screen
  return (
    factor.position.x >= -margin &&
    factor.position.x <= GAME_CANVAS.width + margin &&
    factor.position.y >= -margin &&
    factor.position.y <= GAME_CANVAS.height + margin
  );
}

/**
 * Updates factor positions based on physics simulation.
 * Note: Velocity already includes speedMultiplier from generateSpawnVelocity,
 * so we don't apply it again here.
 */
function updateFactorPhysics(factors: GameFactor[], deltaTime: number): GameFactor[] {
  // Normalize delta time to 60fps equivalent for frame-rate independence
  const timeScale = deltaTime / FRAME_TIME_60FPS_MS;

  // Update accumulated time for drift calculation
  accumulatedTime += deltaTime;

  return factors.map((factor) => {
    // Only move floating factors
    if (factor.state !== 'floating') {
      return factor;
    }

    // Calculate new position with velocity (speed multiplier already in velocity)
    const newX = factor.position.x + factor.velocity.x * timeScale;
    const newY = factor.position.y + factor.velocity.y * timeScale;

    // Apply sine wave drift for organic movement
    const driftOffset =
      Math.sin(accumulatedTime * PHYSICS.driftFrequency) * PHYSICS.driftAmplitude * timeScale * 0.1;

    return {
      ...factor,
      position: {
        x: newX + driftOffset,
        y: newY,
      },
    };
  });
}

/**
 * Checks if both enzyme and cofactor are docked for a complex.
 */
function isComplexComplete(complex: ComplexState): boolean {
  return complex.enzyme !== null && complex.cofactor !== null;
}

/**
 * Finds the slot that a factor is docked in.
 */
function findDockedSlot(
  factorId: string,
  complexes: ComplexState[]
): { complex: ComplexState; role: 'enzyme' | 'cofactor' } | null {
  for (const complex of complexes) {
    if (complex.enzyme?.id === factorId) {
      return { complex, role: 'enzyme' };
    }
    if (complex.cofactor?.id === factorId) {
      return { complex, role: 'cofactor' };
    }
  }
  return null;
}

// =============================================================================
// REDUCER
// =============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK': {
      // Guard against invalid deltaTime
      if (action.deltaTime <= 0) {
        return state;
      }

      // Don't process ticks if game is complete or failed
      if (state.phase === 'complete' || state.phase === 'failed') {
        return state;
      }

      // Update timer (countdown in seconds)
      // deltaTime is in milliseconds, so divide by 1000
      const newTimer = Math.max(0, state.timer - action.deltaTime / 1000);

      // Check for timer expiration
      if (newTimer <= 0) {
        return {
          ...state,
          timer: 0,
          phase: 'failed',
        };
      }

      // Update factor positions
      const movedFactors = updateFactorPhysics(state.factors, action.deltaTime);

      // Remove factors that have exited the screen (floating only)
      // Note: Factors exiting bounds are "missed opportunities" but don't cost lives.
      // This is intentional for MVP - the antagonist system (future) will handle penalties.
      const remainingFactors = movedFactors.filter((factor) => {
        if (factor.state !== 'floating') {
          return true; // Keep caught/docked factors
        }
        return isFactorInBounds(factor);
      });

      return {
        ...state,
        timer: newTimer,
        factors: remainingFactors,
      };
    }

    case 'SPAWN_FACTOR': {
      const factorConfig = getFactorConfig(action.factorId);
      if (!factorConfig) {
        console.warn(`Unknown factor ID: ${action.factorId}`);
        return state;
      }

      const position = generateSpawnPosition();
      const velocity = generateSpawnVelocity(state.currentLevel);
      const newFactor = createGameFactor(action.factorId, position, velocity);

      return {
        ...state,
        factors: [...state.factors, newFactor],
      };
    }

    case 'CATCH_FACTOR': {
      const factorIndex = state.factors.findIndex(
        (f) => f.id === action.factorId && f.state === 'floating'
      );

      if (factorIndex === -1) {
        return state; // Factor not found or already caught
      }

      const updatedFactors = [...state.factors];
      updatedFactors[factorIndex] = {
        ...updatedFactors[factorIndex],
        state: 'caught',
        velocity: { x: 0, y: 0 }, // Stop movement when caught
      };

      return {
        ...state,
        factors: updatedFactors,
        score: state.score + SCORING.catch,
        phase: 'dock', // Transition to docking phase
      };
    }

    case 'DOCK_FACTOR': {
      // Find the caught factor
      const factorIndex = state.factors.findIndex(
        (f) => f.id === action.factorId && f.state === 'caught'
      );

      if (factorIndex === -1) {
        return state; // Factor not found or not caught
      }

      // Find the target slot
      const slot = state.dockingSlots.find((s) => s.id === action.slotId);
      if (!slot) {
        return state; // Slot not found
      }

      // Check if slot accepts this factor
      const factor = state.factors[factorIndex];
      if (!slot.acceptsFactors.includes(factor.factorId)) {
        return state; // Factor not compatible with slot
      }

      // Check if slot is locked
      if (slot.isLocked) {
        return state; // Slot is locked
      }

      // Check if slot is already occupied
      const targetComplex = state.complexes.find((c) => c.type === slot.complexType);
      if (targetComplex) {
        const isOccupied =
          slot.role === 'enzyme' ? targetComplex.enzyme !== null : targetComplex.cofactor !== null;
        if (isOccupied) {
          return state; // Slot already has a factor docked
        }
      }

      // Update the factor state to docked
      const updatedFactors = [...state.factors];
      updatedFactors[factorIndex] = {
        ...updatedFactors[factorIndex],
        state: 'docked',
      };

      // Update the complex state
      const updatedComplexes = state.complexes.map((complex) => {
        if (complex.type !== slot.complexType) {
          return complex;
        }

        if (slot.role === 'enzyme') {
          return {
            ...complex,
            enzyme: updatedFactors[factorIndex],
          };
        } else {
          return {
            ...complex,
            cofactor: updatedFactors[factorIndex],
          };
        }
      });

      // Check if any complex is now complete
      const anyCompleteNow = updatedComplexes.some(
        (c) => isComplexComplete(c) && !c.isActive
      );

      return {
        ...state,
        factors: updatedFactors,
        complexes: updatedComplexes,
        score: state.score + SCORING.dock,
        phase: anyCompleteNow ? 'assemble' : 'catch',
      };
    }

    case 'RELEASE_FACTOR': {
      // Find the docked factor
      const factorIndex = state.factors.findIndex(
        (f) => f.id === action.factorId && f.state === 'docked'
      );

      if (factorIndex === -1) {
        return state; // Factor not found or not docked
      }

      const factor = state.factors[factorIndex];

      // Find which complex the factor is docked in
      const dockedInfo = findDockedSlot(factor.id, state.complexes);
      if (!dockedInfo) {
        return state;
      }

      // Update factor to caught state (so player can re-dock it)
      const updatedFactors = [...state.factors];
      updatedFactors[factorIndex] = {
        ...updatedFactors[factorIndex],
        state: 'caught',
      };

      // Remove factor from complex
      const updatedComplexes = state.complexes.map((complex) => {
        if (complex.type !== dockedInfo.complex.type) {
          return complex;
        }

        if (dockedInfo.role === 'enzyme') {
          return {
            ...complex,
            enzyme: null,
          };
        } else {
          return {
            ...complex,
            cofactor: null,
          };
        }
      });

      return {
        ...state,
        factors: updatedFactors,
        complexes: updatedComplexes,
        phase: 'dock',
      };
    }

    case 'COMPLETE_COMPLEX': {
      // Find the complex
      const complexIndex = state.complexes.findIndex(
        (c) => c.type === action.complexType && isComplexComplete(c) && !c.isActive
      );

      if (complexIndex === -1) {
        return state; // Complex not found or not complete
      }

      // Mark complex as active
      const updatedComplexes = [...state.complexes];
      updatedComplexes[complexIndex] = {
        ...updatedComplexes[complexIndex],
        isActive: true,
      };

      // Calculate score bonus
      const complexBonus =
        action.complexType === 'tenase'
          ? SCORING.tenaseComplete
          : SCORING.prothrombinaseComplete;

      // Sequential gating: When Tenase is completed, unlock Prothrombinase slots
      let updatedSlots = state.dockingSlots;
      if (action.complexType === 'tenase') {
        updatedSlots = state.dockingSlots.map((slot) => {
          if (slot.complexType === 'prothrombinase') {
            return { ...slot, isLocked: false };
          }
          return slot;
        });
      }

      // Check victory condition: all target complexes must be active
      const levelConfig = getLevelConfig(state.currentLevel);
      const allTargetComplexesActive = levelConfig.targetComplexes.every((targetType) => {
        const complex = updatedComplexes.find((c) => c.type === targetType);
        return complex?.isActive === true;
      });

      return {
        ...state,
        complexes: updatedComplexes,
        dockingSlots: updatedSlots,
        score: state.score + complexBonus + (allTargetComplexesActive ? SCORING.levelBonus : 0),
        phase: allTargetComplexesActive ? 'complete' : 'catch',
      };
    }

    case 'LOSE_LIFE': {
      const newLives = state.lives - 1;

      if (newLives <= 0) {
        return {
          ...state,
          lives: 0,
          phase: 'failed',
        };
      }

      return {
        ...state,
        lives: newLives,
      };
    }

    case 'SET_PHASE': {
      return {
        ...state,
        phase: action.phase,
      };
    }

    case 'START_GAME': {
      return createInitialState(action.level);
    }

    case 'RESET_GAME': {
      return createInitialState(1);
    }

    default: {
      // TypeScript exhaustive check
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

// =============================================================================
// HOOK INTERFACE
// =============================================================================

export interface UseGameStateReturn {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience methods
  startGame: (level: number) => void;
  catchFactor: (factorId: string) => void;
  dockFactor: (factorId: string, slotId: string) => void;
  releaseFactor: (factorId: string) => void;
  completeComplex: (complexType: 'tenase' | 'prothrombinase') => void;
  loseLife: () => void;
  resetGame: () => void;
  tick: (deltaTime: number) => void;
  spawnFactor: (factorId: string) => void;
  setPhase: (phase: GamePhase) => void;
}

/**
 * Central state management hook for the coagulation cascade game.
 *
 * Uses useReducer to manage complex game state including:
 * - Factor spawning and movement physics
 * - Catching and docking mechanics
 * - Complex assembly validation
 * - Timer and lives management
 *
 * @example
 * ```typescript
 * const { state, dispatch, startGame, catchFactor } = useGameState();
 *
 * // Start a new game at level 1
 * startGame(1);
 *
 * // In game loop
 * useGameLoop({
 *   onTick: (deltaTime) => dispatch({ type: 'TICK', deltaTime }),
 *   isPaused: state.phase === 'complete' || state.phase === 'failed'
 * });
 *
 * // When player taps a factor
 * catchFactor(factor.id);
 * ```
 */
export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, 1, createInitialState);

  // Convenience methods wrapped in useCallback for stable references
  const startGame = useCallback((level: number): void => {
    dispatch({ type: 'START_GAME', level });
  }, []);

  const catchFactor = useCallback((factorId: string): void => {
    dispatch({ type: 'CATCH_FACTOR', factorId });
  }, []);

  const dockFactor = useCallback((factorId: string, slotId: string): void => {
    dispatch({ type: 'DOCK_FACTOR', factorId, slotId });
  }, []);

  const releaseFactor = useCallback((factorId: string): void => {
    dispatch({ type: 'RELEASE_FACTOR', factorId });
  }, []);

  const completeComplex = useCallback((complexType: 'tenase' | 'prothrombinase'): void => {
    dispatch({ type: 'COMPLETE_COMPLEX', complexType });
  }, []);

  const loseLife = useCallback((): void => {
    dispatch({ type: 'LOSE_LIFE' });
  }, []);

  const resetGame = useCallback((): void => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const tick = useCallback((deltaTime: number): void => {
    dispatch({ type: 'TICK', deltaTime });
  }, []);

  const spawnFactor = useCallback((factorId: string): void => {
    dispatch({ type: 'SPAWN_FACTOR', factorId });
  }, []);

  const setPhase = useCallback((phase: GamePhase): void => {
    dispatch({ type: 'SET_PHASE', phase });
  }, []);

  return useMemo(
    () => ({
      state,
      dispatch,
      startGame,
      catchFactor,
      dockFactor,
      releaseFactor,
      completeComplex,
      loseLife,
      resetGame,
      tick,
      spawnFactor,
      setPhase,
    }),
    [
      state,
      startGame,
      catchFactor,
      dockFactor,
      releaseFactor,
      completeComplex,
      loseLife,
      resetGame,
      tick,
      spawnFactor,
      setPhase,
    ]
  );
}
