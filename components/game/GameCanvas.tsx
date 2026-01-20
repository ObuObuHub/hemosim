// components/game/GameCanvas.tsx
'use client';

import { forwardRef } from 'react';
import type { GameState, VisualState } from '@/types/game';
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
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 14px',
            borderRadius: 10,
            background: `linear-gradient(135deg, ${heldFactorDef.color}60 0%, ${heldFactorDef.color}40 100%)`,
            border: `3px solid ${heldFactorDef.color}`,
            boxShadow: `0 0 24px ${heldFactorDef.color}80, 0 8px 16px rgba(0,0,0,0.3)`,
            minWidth: 60,
            pointerEvents: 'none',
            zIndex: 1000,
            cursor: 'grabbing',
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#FFFFFF',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              letterSpacing: '0.3px',
            }}
          >
            {heldFactorDef.inactiveLabel}
          </span>
          <span
            style={{
              fontSize: 8,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}
          >
            {heldFactorDef.category}
          </span>
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
    </div>
  );
});
