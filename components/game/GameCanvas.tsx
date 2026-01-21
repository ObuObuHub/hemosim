// components/game/GameCanvas.tsx
'use client';

import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, VisualState, GamePhase } from '@/types/game';
import { GAME_CANVAS, PANEL_CONFIGS, COLORS } from '@/engine/game/game-config';
import { getFactorDefinition } from '@/engine/game/factor-definitions';
import { GameHUD } from './GameHUD';
import { BloodstreamZone } from './BloodstreamZone';
import { SurfacePanel } from './SurfacePanel';
import { ClotZonePanel } from './ClotZonePanel';
import { CirculationTray } from './CirculationTray';
import { AnimationLayer } from './AnimationLayer';
import { GameOverScreen } from './GameOverScreen';
import { VictoryScreen } from './VictoryScreen';
import { PhaseUnlockBanner } from './PhaseUnlockBanner';
import { TutorialOverlay } from './TutorialOverlay';
import { ZymogenShape } from './shapes';

interface GameCanvasProps {
  gameState: GameState;
  /** Optional visual state for animations - if provided, AnimationLayer is rendered */
  visualState?: VisualState;
  onFactorSelect: (factorId: string) => void;
  onSlotClick: (slotId: string) => void;
  onComplexSlotClick: (complexSlotId: string) => void;
  /** Callback when drag starts on a floating factor */
  onFactorDragStart?: (floatingFactorId: string, event: React.MouseEvent | React.TouchEvent) => void;
  /** Position for held factor display (interpolated for smooth drag) */
  heldFactorDisplayPosition?: { x: number; y: number } | null;
  /** Callback for play again button */
  onPlayAgain?: () => void;
  /** Callback for main menu button */
  onMainMenu?: () => void;
}

// =============================================================================
// LOCAL STORAGE KEY FOR TUTORIAL
// =============================================================================

const TUTORIAL_DISMISSED_KEY = 'hemosim-tutorial-dismissed';

export const GameCanvas = forwardRef<HTMLDivElement, GameCanvasProps>(function GameCanvas(
  {
    gameState,
    visualState,
    onFactorSelect,
    onSlotClick,
    onComplexSlotClick,
    onFactorDragStart,
    heldFactorDisplayPosition,
    onPlayAgain,
    onMainMenu,
  },
  ref
): React.ReactElement {
  // Get held factor definition for rendering
  const heldFactorDef = gameState.heldFactor
    ? getFactorDefinition(gameState.heldFactor.factorId)
    : null;

  // Tutorial state - start hidden, then show after hydration if not dismissed
  // This prevents hydration mismatch between server and client
  const [showTutorial, setShowTutorial] = useState(false);

  // Check localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const isDismissed = localStorage.getItem(TUTORIAL_DISMISSED_KEY);
    if (!isDismissed) {
      setShowTutorial(true);
    }
  }, []);

  // Phase unlock banner state
  const [showPhaseUnlock, setShowPhaseUnlock] = useState<GamePhase | null>(null);
  const prevPhaseRef = useRef<GamePhase>(gameState.phase);

  // Track phase changes and show unlock banner
  // Note: This pattern triggers the set-state-in-effect lint warning
  // but is the standard React pattern for tracking prop changes.
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const currentPhase = gameState.phase;

    // Only show banner when transitioning to a new phase (not initiation)
    if (prevPhase !== currentPhase && currentPhase !== 'initiation') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowPhaseUnlock(currentPhase);
    }

    prevPhaseRef.current = currentPhase;
  }, [gameState.phase]);

  // Handle tutorial dismissal
  const handleDismissTutorial = useCallback(() => {
    setShowTutorial(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TUTORIAL_DISMISSED_KEY, 'true');
    }
  }, []);

  // Handle phase unlock banner completion
  const handlePhaseUnlockComplete = useCallback(() => {
    setShowPhaseUnlock(null);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: GAME_CANVAS.width,
        height: GAME_CANVAS.height,
        backgroundColor: COLORS.panelBackgroundLocked,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: gameState.heldFactor ? 'grabbing' : 'default',
      }}
    >
      {/* Bloodstream Zone (floating factors and antagonists) */}
      <BloodstreamZone
        floatingFactors={gameState.floatingFactors}
        messengerFactors={gameState.messengerFactors}
        spilloverParticles={gameState.spilloverParticles}
        antagonists={gameState.antagonists}
        onFactorDragStart={onFactorDragStart}
      />

      {/* HUD (thrombin meter + clot integrity meter + bleeding meter + message) */}
      <GameHUD
        thrombinMeter={gameState.thrombinMeter}
        thrombinDisplayValue={visualState?.thrombinMeter.current}
        clotIntegrity={gameState.clotIntegrity}
        clotIntegrityDisplayValue={visualState?.clotIntegrityMeter.current}
        bleedingMeter={gameState.bleedingMeter}
        plateletActivation={gameState.plateletActivation}
        currentMessage={gameState.currentMessage}
        isError={gameState.isError}
        phase={gameState.phase}
      />

      {/* Surface Panels */}
      {PANEL_CONFIGS.map((config) => {
        // Use ClotZonePanel for clot-zone surface
        if (config.surface === 'clot-zone') {
          return (
            <ClotZonePanel
              key={config.surface}
              config={config}
              slots={gameState.slots}
              gameState={gameState}
              onSlotClick={onSlotClick}
            />
          );
        }

        // Use SurfacePanel for other surfaces
        return (
          <SurfacePanel
            key={config.surface}
            config={config}
            slots={gameState.slots}
            complexSlots={gameState.complexSlots}
            gameState={gameState}
            onSlotClick={onSlotClick}
            onComplexSlotClick={onComplexSlotClick}
          />
        );
      })}

      {/* Circulation Tray */}
      <CirculationTray
        circulationFactors={gameState.circulationFactors}
        selectedFactorId={gameState.selectedFactorId}
        gameState={gameState}
        onFactorClick={onFactorSelect}
      />

      {/* Animation overlay - renders on top */}
      {visualState && <AnimationLayer visualState={visualState} />}

      {/* Held Factor (dragging) - renders on top of everything */}
      {gameState.heldFactor && heldFactorDef && heldFactorDisplayPosition && (
        <div
          style={{
            position: 'absolute',
            left: heldFactorDisplayPosition.x,
            top: heldFactorDisplayPosition.y,
            transform: 'translate(-50%, -50%) scale(1.1)',
            pointerEvents: 'none',
            zIndex: 1000,
            cursor: 'grabbing',
            filter: `drop-shadow(0 0 16px ${heldFactorDef.color}) drop-shadow(0 8px 16px rgba(0,0,0,0.3))`,
          }}
        >
          <ZymogenShape
            color={heldFactorDef.color}
            label={heldFactorDef.inactiveLabel}
          />
        </div>
      )}

      {/* Critical bleeding vignette effect */}
      {gameState.bleedingMeter > 75 && gameState.gameResult !== 'defeat' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            boxShadow: `inset 0 0 100px 30px rgba(220, 38, 38, ${0.2 + (gameState.bleedingMeter - 75) / 100})`,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}

      {/* Game Over Screen */}
      {gameState.gameResult === 'defeat' && onPlayAgain && onMainMenu && (
        <GameOverScreen
          stats={gameState.gameStats}
          onPlayAgain={onPlayAgain}
          onMainMenu={onMainMenu}
        />
      )}

      {/* Victory Screen */}
      {gameState.gameResult === 'victory' && onPlayAgain && onMainMenu && (
        <VictoryScreen
          stats={gameState.gameStats}
          onPlayAgain={onPlayAgain}
          onMainMenu={onMainMenu}
        />
      )}

      {/* Phase Unlock Banner */}
      {showPhaseUnlock && gameState.gameResult === null && (
        <PhaseUnlockBanner
          phase={showPhaseUnlock}
          onComplete={handlePhaseUnlockComplete}
        />
      )}

      {/* Tutorial Overlay (shown on first play) */}
      {showTutorial && gameState.gameResult === null && (
        <TutorialOverlay onDismiss={handleDismissTutorial} />
      )}
    </div>
  );
});
