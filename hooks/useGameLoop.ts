'use client';

import { useEffect, useRef } from 'react';

/**
 * Maximum delta time in milliseconds.
 * Prevents huge physics jumps when tab is backgrounded or frame drops occur.
 * At 60fps, a normal frame is ~16.67ms. This cap allows for some variance
 * while preventing extreme deltas (e.g., returning from a backgrounded tab).
 */
const MAX_DELTA_TIME_MS = 100;

interface UseGameLoopOptions {
  /** Callback invoked each frame with delta time in milliseconds */
  onTick: (deltaTime: number) => void;
  /** When true, the loop is paused and no ticks occur */
  isPaused?: boolean;
}

/**
 * A React hook that provides a 60fps game loop using requestAnimationFrame.
 *
 * Features:
 * - Frame-rate independent timing via deltaTime
 * - Automatic pause/resume support
 * - Proper cleanup on unmount
 * - Delta time capping to prevent physics explosions
 * - Handles React strict mode (double effects)
 *
 * @example
 * ```typescript
 * useGameLoop({
 *   onTick: (deltaTime) => {
 *     // Update game state based on deltaTime
 *     dispatch({ type: 'TICK', deltaTime });
 *   },
 *   isPaused: gameState.phase === 'complete'
 * });
 * ```
 */
export function useGameLoop(options: UseGameLoopOptions): void {
  const { onTick, isPaused = false } = options;

  // Store the callback in a ref to avoid recreating the animation loop
  // when the callback changes. This allows consumers to pass inline functions
  // without causing the loop to restart.
  const callbackRef = useRef<(deltaTime: number) => void>(onTick);
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Keep the callback ref updated
  useEffect(() => {
    callbackRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (isPaused) {
      // When paused, cancel any pending frame and reset timing
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    // The core animation loop - defined inside useEffect to avoid
    // the self-reference issue with useCallback
    function tick(currentTime: number): void {
      // Calculate delta time
      if (lastTimeRef.current === null) {
        // First frame - no delta yet, just record time
        lastTimeRef.current = currentTime;
        animationFrameIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const rawDelta = currentTime - lastTimeRef.current;
      // Cap delta time to prevent physics explosions after tab is backgrounded
      const deltaTime = Math.min(rawDelta, MAX_DELTA_TIME_MS);
      lastTimeRef.current = currentTime;

      // Invoke the tick callback
      callbackRef.current(deltaTime);

      // Schedule next frame
      animationFrameIdRef.current = requestAnimationFrame(tick);
    }

    // Start the animation loop
    lastTimeRef.current = null; // Reset timing when starting/resuming
    animationFrameIdRef.current = requestAnimationFrame(tick);

    // Cleanup on unmount or when pausing
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isPaused]);
}
