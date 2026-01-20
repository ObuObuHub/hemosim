// app/game/page.tsx
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { GAME_CANVAS, BLOODSTREAM_ZONE } from '@/engine/game/game-config';
import { useGameState } from '@/hooks/useGameState';
import { useAnimationController } from '@/hooks/useAnimationController';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameControls } from '@/components/game/GameControls';
import { GameCompleteModal } from '@/components/game/GameCompleteModal';
import {
  AnimationTargetProvider,
  useAnimationTargetRegistry,
} from '@/hooks/useAnimationTarget';
import {
  getSpawnConfigForPhase,
  getFactorVulnerabilities,
  generateFloatingVelocity,
} from '@/engine/game/spawn-config';
import type { FloatingFactor } from '@/types/game';

/** Generate a unique ID for floating factors */
function generateFactorId(): string {
  return `floating-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function GamePage(): ReactElement {
  const router = useRouter();
  const {
    state,
    selectFactor,
    deselectFactor,
    attemptPlace,
    attemptComplexPlace,
    resetGame,
    subscribeToEvents,
    spawnFloatingFactor,
    tickFloatingFactors,
  } = useGameState();

  // Refs for game loop
  const lastSpawnTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const spawnIndexRef = useRef<number>(0);

  // Animation controller for smooth visual transitions
  // Note: isProcessing available for future UI indication
  const { visualState, enqueue } = useAnimationController(state);

  // Create animation target registry for component position tracking
  const animationRegistry = useAnimationTargetRegistry();

  // Subscribe to game events and forward to animation controller
  useEffect(() => {
    const unsubscribe = subscribeToEvents((events) => {
      enqueue(events);
    });
    return unsubscribe;
  }, [subscribeToEvents, enqueue]);

  // Game loop for floating factors
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (currentTime: number): void => {
      // Initialize timing on first frame
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
        lastSpawnTimeRef.current = currentTime;
      }

      // Calculate delta time in seconds
      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = currentTime;

      // Get spawn config for current phase
      const spawnConfig = getSpawnConfigForPhase(state.phase);

      // Check if we should spawn a new factor
      if (
        spawnConfig.factorIds.length > 0 &&
        spawnConfig.spawnIntervalMs > 0 &&
        currentTime - lastSpawnTimeRef.current >= spawnConfig.spawnIntervalMs
      ) {
        // Pick a factor from the phase's available factors (round-robin)
        const factorId = spawnConfig.factorIds[spawnIndexRef.current % spawnConfig.factorIds.length];
        spawnIndexRef.current += 1;

        // Generate random Y position within bloodstream zone
        const randomY =
          BLOODSTREAM_ZONE.spawnYMin +
          Math.random() * (BLOODSTREAM_ZONE.spawnYMax - BLOODSTREAM_ZONE.spawnYMin);

        // Create the floating factor
        const newFactor: FloatingFactor = {
          id: generateFactorId(),
          factorId,
          position: { x: BLOODSTREAM_ZONE.spawnX, y: randomY },
          velocity: generateFloatingVelocity(),
          isVulnerableTo: getFactorVulnerabilities(factorId),
        };

        spawnFloatingFactor(newFactor);
        lastSpawnTimeRef.current = currentTime;
      }

      // Update floating factor positions
      if (deltaTime > 0 && deltaTime < 1) {
        // Clamp deltaTime to avoid large jumps
        tickFloatingFactors(deltaTime);
      }

      // Continue the loop
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    animationFrameId = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state.phase, spawnFloatingFactor, tickFloatingFactors]);

  const handleMainMenu = useCallback((): void => {
    router.push('/');
  }, [router]);

  return (
    <AnimationTargetProvider registry={animationRegistry}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#020617',
          padding: 16,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: GAME_CANVAS.width,
            height: GAME_CANVAS.height,
            maxWidth: '100%',
          }}
        >
          {/* Main Game Canvas */}
          <GameCanvas
            gameState={state}
            visualState={visualState}
            onFactorSelect={selectFactor}
            onSlotClick={attemptPlace}
            onComplexSlotClick={attemptComplexPlace}
          />

          {/* Keyboard Controls */}
          <GameControls onDeselect={deselectFactor} onReset={resetGame} />

          {/* Victory Modal */}
          {state.phase === 'complete' && (
            <GameCompleteModal
              onPlayAgain={resetGame}
              onMainMenu={handleMainMenu}
            />
          )}
        </div>
      </div>
    </AnimationTargetProvider>
  );
}
