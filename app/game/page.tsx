// app/game/page.tsx
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { GAME_CANVAS, BLOODSTREAM_ZONE } from '@/engine/game/game-config';
import { useGameState } from '@/hooks/useGameState';
import { useAnimationController } from '@/hooks/useAnimationController';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
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
import {
  tickAllAntagonists,
  createAntagonist,
  getActiveAntagonistTypes,
  ANTAGONIST_CONFIGS,
} from '@/engine/game/antagonist-ai';
import type { FloatingFactor, AntagonistType, Antagonist } from '@/types/game';

/** Generate a unique ID for floating factors */
function generateFactorId(): string {
  return `floating-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Generate a unique ID for antagonists */
function generateAntagonistId(): string {
  return `antagonist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    grabFactor,
    updateHeldPosition,
    dropFactor,
    spawnAntagonist,
    tickAntagonists,
    destroyFactor,
  } = useGameState();

  // Refs for game loop
  const lastSpawnTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const spawnIndexRef = useRef<number>(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Refs for antagonist spawning
  const antagonistSpawnTimesRef = useRef<Record<AntagonistType, number>>({
    antithrombin: 0,
    apc: 0,
    plasmin: 0,
  });
  const antagonistsRef = useRef<Antagonist[]>([]);

  // Animation controller for smooth visual transitions
  // Note: isProcessing available for future UI indication
  const { visualState, enqueue } = useAnimationController(state);

  // Create animation target registry for component position tracking
  const animationRegistry = useAnimationTargetRegistry();

  // Handle slot drop (place factor in slot)
  const handleSlotDrop = useCallback(
    (slotId: string) => {
      // The selectedFactorId is already set when we grabbed the factor
      attemptPlace(slotId);
      // Clear held factor state after placement attempt
      dropFactor();
    },
    [attemptPlace, dropFactor]
  );

  // Handle complex slot drop (place factor in complex slot)
  const handleComplexSlotDrop = useCallback(
    (complexSlotId: string) => {
      attemptComplexPlace(complexSlotId);
      dropFactor();
    },
    [attemptComplexPlace, dropFactor]
  );

  // Drag and drop hook
  const { handleDragStart } = useDragAndDrop({
    heldFactor: state.heldFactor,
    slots: state.slots,
    complexSlots: state.complexSlots,
    canvasRef,
    onGrab: grabFactor,
    onMove: updateHeldPosition,
    onDrop: dropFactor,
    onSlotDrop: handleSlotDrop,
    onComplexSlotDrop: handleComplexSlotDrop,
  });

  // Get held factor display position directly from state
  const heldFactorDisplayPosition = state.heldFactor?.cursorPosition ?? null;

  // Subscribe to game events and forward to animation controller
  useEffect(() => {
    const unsubscribe = subscribeToEvents((events) => {
      enqueue(events);
    });
    return unsubscribe;
  }, [subscribeToEvents, enqueue]);

  // Keep antagonists ref in sync with state
  useEffect(() => {
    antagonistsRef.current = state.antagonists;
  }, [state.antagonists]);

  // Game loop for floating factors and antagonists
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (currentTime: number): void => {
      // Initialize timing on first frame
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
        lastSpawnTimeRef.current = currentTime;
        // Initialize antagonist spawn times
        antagonistSpawnTimesRef.current = {
          antithrombin: currentTime,
          apc: currentTime,
          plasmin: currentTime,
        };
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

      // === ANTAGONIST SPAWNING ===
      const activeAntagonistTypes = getActiveAntagonistTypes(state.phase);

      for (const antagonistType of activeAntagonistTypes) {
        const config = ANTAGONIST_CONFIGS[antagonistType];
        const lastSpawn = antagonistSpawnTimesRef.current[antagonistType];

        // Check if this antagonist type is already present
        const existingAntagonist = antagonistsRef.current.find((a) => a.type === antagonistType);

        // Spawn if not present and enough time has passed since last spawn/destruction
        if (!existingAntagonist && currentTime - lastSpawn >= config.respawnDelayMs) {
          const newAntagonist = createAntagonist(antagonistType, generateAntagonistId());
          spawnAntagonist(newAntagonist);
          antagonistSpawnTimesRef.current[antagonistType] = currentTime;
        }
      }

      // === ANTAGONIST AI TICK ===
      if (deltaTime > 0 && deltaTime < 1 && antagonistsRef.current.length > 0) {
        const aiResult = tickAllAntagonists(
          antagonistsRef.current,
          state.floatingFactors,
          deltaTime
        );

        // Update antagonist positions in ref (will sync to state on next render)
        antagonistsRef.current = aiResult.antagonists;

        // Dispatch destroy events for any factors that were caught
        for (const destroyedId of aiResult.destroyedFactorIds) {
          // Find which antagonist destroyed this factor
          const attacker = aiResult.antagonists.find(
            (a) => a.state === 'patrol' && a.targetFactorId === null
          );
          if (attacker) {
            destroyFactor(destroyedId, attacker.id);
            // Update respawn timer for this antagonist type
            antagonistSpawnTimesRef.current[attacker.type] = currentTime;
          }
        }

        // Update game state with new antagonist positions and destroyed factors
        tickAntagonists(aiResult.antagonists, aiResult.destroyedFactorIds);
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
  }, [state.phase, state.floatingFactors, spawnFloatingFactor, tickFloatingFactors, spawnAntagonist, tickAntagonists, destroyFactor]);

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
            ref={canvasRef}
            gameState={state}
            visualState={visualState}
            onFactorSelect={selectFactor}
            onSlotClick={attemptPlace}
            onComplexSlotClick={attemptComplexPlace}
            onFactorDragStart={handleDragStart}
            heldFactorDisplayPosition={heldFactorDisplayPosition}
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
