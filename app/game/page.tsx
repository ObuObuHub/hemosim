'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { GAME_CANVAS, getLevelConfig } from '../../engine/game/game-config';
import { useGameState } from '../../hooks/useGameState';
import { useGameLoop } from '../../hooks/useGameLoop';
import { GameCanvas } from '../../components/game/GameCanvas';
import { GameHUD } from '../../components/game/GameHUD';
import { GameControls } from '../../components/game/GameControls';
import { GameCompleteModal } from '../../components/game/GameCompleteModal';

export default function GamePage(): ReactElement {
  const router = useRouter();

  const {
    state,
    startGame,
    tick,
    spawnFactor,
    catchFactor,
    dockFactor,
    releaseFactor,
    completeComplex,
  } = useGameState();

  // Track last spawn time for auto-spawning factors
  const lastSpawnTimeRef = useRef<number>(0);

  // Track game initialization with ref to avoid setState in effect
  const isInitializedRef = useRef(false);

  // Get current level configuration
  const levelConfig = useMemo(() => getLevelConfig(state.currentLevel), [state.currentLevel]);

  // Initialize game on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      startGame(1);
      lastSpawnTimeRef.current = Date.now();
    }
  }, [startGame]);

  // Game loop - runs at 60fps
  useGameLoop({
    onTick: tick,
    isPaused: state.phase === 'complete' || state.phase === 'failed',
  });

  // Factor spawning logic - spawn factors periodically based on level config
  useEffect(() => {
    if (state.phase !== 'catch' && state.phase !== 'dock' && state.phase !== 'assemble') {
      return;
    }

    const spawnInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSpawn = now - lastSpawnTimeRef.current;

      if (timeSinceLastSpawn >= levelConfig.difficulty.spawnIntervalMs) {
        // Pick a random factor from available factors
        const availableFactors = levelConfig.availableFactors;
        const randomFactor = availableFactors[Math.floor(Math.random() * availableFactors.length)];
        spawnFactor(randomFactor);
        lastSpawnTimeRef.current = now;
      }
    }, 100); // Check every 100ms for smoother spawning

    return () => clearInterval(spawnInterval);
  }, [state.phase, levelConfig.difficulty.spawnIntervalMs, levelConfig.availableFactors, spawnFactor]);

  // Complex completion detection - when both enzyme and cofactor are docked
  useEffect(() => {
    // Only check during assemble phase
    if (state.phase !== 'assemble') {
      return;
    }

    // Check each complex for completion
    for (const complex of state.complexes) {
      // Complex is complete when both enzyme and cofactor are present, but not yet active
      if (complex.enzyme !== null && complex.cofactor !== null && !complex.isActive) {
        // Small delay to show the assembled state before completing
        const timeoutId = setTimeout(() => {
          completeComplex(complex.type);
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [state.phase, state.complexes, completeComplex]);

  // Find caught factor for controls and canvas
  const caughtFactor = state.factors.find((f) => f.state === 'caught') || null;

  // Handle navigation to main menu (using Next.js router for client-side navigation)
  const handleMainMenu = useCallback((): void => {
    router.push('/');
  }, [router]);

  return (
    <div className="game-container">
      <div
        className="game-canvas-wrapper"
        style={{
          position: 'relative',
          width: GAME_CANVAS.width,
          height: GAME_CANVAS.height,
          maxWidth: '100%',
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        {/* HUD - positioned at top of game area */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          <GameHUD
            score={state.score}
            timer={state.timer}
            lives={state.lives}
            currentLevel={state.currentLevel}
            levelName={levelConfig.name}
          />
        </div>

        {/* Main game canvas */}
        <GameCanvas
          factors={state.factors}
          dockingSlots={state.dockingSlots}
          complexes={state.complexes}
          caughtFactor={caughtFactor}
        />

        {/* Controls overlay - handles all mouse/touch interactions */}
        <GameControls
          factors={state.factors}
          dockingSlots={state.dockingSlots}
          caughtFactor={caughtFactor}
          onCatchFactor={catchFactor}
          onDockFactor={dockFactor}
          onReleaseFactor={releaseFactor}
          canvasWidth={GAME_CANVAS.width}
          canvasHeight={GAME_CANVAS.height}
        />
      </div>

      {/* Victory/Defeat Modal */}
      {(state.phase === 'complete' || state.phase === 'failed') && (
        <GameCompleteModal
          isVictory={state.phase === 'complete'}
          score={state.score}
          currentLevel={state.currentLevel}
          levelName={levelConfig.name}
          complexesBuilt={state.complexes}
          onPlayAgain={() => startGame(state.currentLevel)}
          onNextLevel={() => startGame(state.currentLevel + 1)}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
