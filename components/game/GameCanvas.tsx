// components/game/GameCanvas.tsx
'use client';

import type { GameState, VisualState } from '@/types/game';
import { GAME_CANVAS, PANEL_CONFIGS, COLORS } from '@/engine/game/game-config';
import { GameHUD } from './GameHUD';
import { SurfacePanel } from './SurfacePanel';
import { FactorPalette } from './FactorPalette';
import { CirculationTray } from './CirculationTray';
import { AnimationLayer } from './AnimationLayer';

interface GameCanvasProps {
  gameState: GameState;
  /** Optional visual state for animations - if provided, AnimationLayer is rendered */
  visualState?: VisualState;
  onFactorSelect: (factorId: string) => void;
  onSlotClick: (slotId: string) => void;
  onComplexSlotClick: (complexSlotId: string) => void;
}

export function GameCanvas({
  gameState,
  visualState,
  onFactorSelect,
  onSlotClick,
  onComplexSlotClick,
}: GameCanvasProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        width: GAME_CANVAS.width,
        height: GAME_CANVAS.height,
        backgroundColor: COLORS.panelBackgroundLocked,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* HUD (thrombin meter + message) */}
      <GameHUD
        thrombinMeter={gameState.thrombinMeter}
        thrombinDisplayValue={visualState?.thrombinMeter.current}
        currentMessage={gameState.currentMessage}
        isError={gameState.isError}
        phase={gameState.phase}
      />

      {/* Surface Panels */}
      {PANEL_CONFIGS.map((config) => (
        <SurfacePanel
          key={config.surface}
          config={config}
          slots={gameState.slots}
          complexSlots={gameState.complexSlots}
          gameState={gameState}
          onSlotClick={onSlotClick}
          onComplexSlotClick={onComplexSlotClick}
        />
      ))}

      {/* Factor Palette */}
      <FactorPalette
        availableFactors={gameState.availableFactors}
        selectedFactorId={gameState.selectedFactorId}
        onFactorClick={onFactorSelect}
      />

      {/* Circulation Tray */}
      <CirculationTray
        circulationFactors={gameState.circulationFactors}
        selectedFactorId={gameState.selectedFactorId}
        gameState={gameState}
        onFactorClick={onFactorSelect}
      />

      {/* Animation overlay - renders on top */}
      {visualState && <AnimationLayer visualState={visualState} />}
    </div>
  );
}
