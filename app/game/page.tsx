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
import type { GameEvent } from '@/types/game-events';

// =============================================================================
// BLEEDING INCREMENT VALUES
// =============================================================================

const BLEEDING_INCREMENT = {
  factorEscape: 10,
  destroyedByAntithrombin: 15,
  destroyedByAPC: 15,
  destroyedByPlasmin: 15,
} as const;

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
    incrementBleeding,
    setGameResult,
    incrementFactorsCaught,
    setTimeTaken,
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

  // Ref for game start time (for elapsed time tracking)
  const gameStartTimeRef = useRef<number>(0);

  // Track previous floating factor IDs to detect escapes
  const prevFloatingFactorIdsRef = useRef<Set<string>>(new Set());

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
  // Also track stats (factors caught, factors destroyed by antagonists)
  useEffect(() => {
    const unsubscribe = subscribeToEvents((events: GameEvent[]) => {
      enqueue(events);

      // Track stats based on events
      for (const event of events) {
        if (event.type === 'FACTOR_PLACED' && event.success) {
          // Factor successfully placed in a slot
          incrementFactorsCaught();
        } else if (event.type === 'FACTOR_DESTROYED') {
          // Factor destroyed by antagonist - increment bleeding
          const antagonistType = event.antagonistType;
          if (antagonistType === 'antithrombin') {
            incrementBleeding(BLEEDING_INCREMENT.destroyedByAntithrombin, 'antithrombin');
          } else if (antagonistType === 'apc') {
            incrementBleeding(BLEEDING_INCREMENT.destroyedByAPC, 'apc');
          } else if (antagonistType === 'plasmin') {
            incrementBleeding(BLEEDING_INCREMENT.destroyedByPlasmin, 'plasmin');
          }
        }
      }
    });
    return unsubscribe;
  }, [subscribeToEvents, enqueue, incrementFactorsCaught, incrementBleeding]);

  // Keep antagonists ref in sync with state
  useEffect(() => {
    antagonistsRef.current = state.antagonists;
  }, [state.antagonists]);

  // Track escaped factors (factors that disappeared without being placed or destroyed)
  useEffect(() => {
    // Skip if game is over
    if (state.gameResult === 'defeat' || state.gameResult === 'victory') {
      return;
    }

    const currentFactorIds = new Set(state.floatingFactors.map((f) => f.id));
    const prevFactorIds = prevFloatingFactorIdsRef.current;

    // Find factors that were in previous set but not in current set
    // These could be: placed (handled elsewhere), destroyed by antagonist (handled elsewhere),
    // or escaped off the right edge of the screen
    // We only track escapes here - the TICK_FLOATING_FACTORS action removes factors past threshold
    for (const prevId of prevFactorIds) {
      if (!currentFactorIds.has(prevId)) {
        // Factor disappeared - check if it was likely an escape
        // (placed and destroyed are handled via events, escapes are silent)
        // We can't distinguish easily, so we rely on the removal threshold logic
        // The reducer removes factors past BLOODSTREAM_ZONE.removeThreshold
        // We increment bleeding for escapes here
        // Note: This may occasionally double-count if event is also fired, but events
        // only fire for placed/destroyed, not escapes
        incrementBleeding(BLEEDING_INCREMENT.factorEscape, 'escape');
      }
    }

    prevFloatingFactorIdsRef.current = currentFactorIds;
  }, [state.floatingFactors, state.gameResult, incrementBleeding]);

  // Check for win/lose conditions
  useEffect(() => {
    // Skip if game already has a result
    if (state.gameResult !== null) {
      return;
    }

    // Check for defeat (bleeding >= 100)
    if (state.bleedingMeter >= 100) {
      setTimeTaken((performance.now() - gameStartTimeRef.current) / 1000);
      setGameResult('defeat');
      return;
    }

    // Check for victory (clot integrity >= 100 AND in stabilization/complete phase)
    if (
      state.clotIntegrity >= 100 &&
      (state.phase === 'stabilization' || state.phase === 'complete')
    ) {
      setTimeTaken((performance.now() - gameStartTimeRef.current) / 1000);
      setGameResult('victory');
      return;
    }
  }, [state.bleedingMeter, state.clotIntegrity, state.phase, state.gameResult, setGameResult, setTimeTaken]);

  // Game loop for floating factors and antagonists
  useEffect(() => {
    // Don't run game loop if game is over
    if (state.gameResult === 'defeat' || state.gameResult === 'victory') {
      return;
    }

    let animationFrameId: number;

    const gameLoop = (currentTime: number): void => {
      // Initialize timing on first frame
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
        lastSpawnTimeRef.current = currentTime;
        gameStartTimeRef.current = currentTime;
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
  }, [state.phase, state.floatingFactors, state.gameResult, spawnFloatingFactor, tickFloatingFactors, spawnAntagonist, tickAntagonists, destroyFactor]);

  const handleMainMenu = useCallback((): void => {
    router.push('/');
  }, [router]);

  // Handle play again - reset all refs along with game state
  const handlePlayAgain = useCallback((): void => {
    // Reset timing refs
    lastFrameTimeRef.current = 0;
    lastSpawnTimeRef.current = 0;
    spawnIndexRef.current = 0;
    gameStartTimeRef.current = 0;
    antagonistSpawnTimesRef.current = {
      antithrombin: 0,
      apc: 0,
      plasmin: 0,
    };
    antagonistsRef.current = [];
    prevFloatingFactorIdsRef.current = new Set();

    // Reset game state
    resetGame();
  }, [resetGame]);

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
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
          />

          {/* Keyboard Controls */}
          <GameControls onDeselect={deselectFactor} onReset={handlePlayAgain} />
        </div>
      </div>
    </AnimationTargetProvider>
  );
}
