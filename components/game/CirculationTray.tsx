// components/game/CirculationTray.tsx
'use client';

import type { GameState } from '@/types/game';
import { COLORS } from '@/engine/game/game-config';
import { getFactorDefinition } from '@/engine/game/factor-definitions';
import { isTenaseComplete } from '@/engine/game/validation-rules';
import { FactorToken } from './FactorToken';

interface CirculationTrayProps {
  circulationFactors: string[];
  selectedFactorId: string | null;
  gameState: GameState;
  onFactorClick: (factorId: string) => void;
}

export function CirculationTray({
  circulationFactors,
  selectedFactorId,
  gameState,
  onFactorClick,
}: CirculationTrayProps): React.ReactElement | null {
  const isPropagationPhase = gameState.phase === 'propagation';

  // Determine if FXa-tenase should be shown
  const tenaseComplete = isTenaseComplete(gameState);
  const fxaTenaseAlreadyDocked = gameState.complexSlots.find(
    (s) => s.id === 'prothrombinase-enzyme'
  )?.placedFactorId !== null;

  const shouldShowFxaTenase = tenaseComplete && !fxaTenaseAlreadyDocked;

  // Build display list
  const displayFactors = [...circulationFactors];
  if (shouldShowFxaTenase) {
    displayFactors.push('FXa-tenase');
  }

  // If nothing to show, don't render the tray
  if (displayFactors.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 160,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        backgroundColor: COLORS.panelBackground,
        border: `2px solid ${COLORS.panelBorder}`,
        borderRadius: 12,
        padding: 16,
        minWidth: 140,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          In Circulation
        </span>
        {!isPropagationPhase && (
          <span
            style={{
              fontSize: 11,
              color: COLORS.textDim,
              fontStyle: 'italic',
            }}
          >
            Available after amplification
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {displayFactors.map((factorId) => {
          const factor = getFactorDefinition(factorId);
          if (!factor) return null;

          const isClickable = isPropagationPhase;
          const isSelected = selectedFactorId === factorId;

          return (
            <FactorToken
              key={factorId}
              factor={factor}
              isActive={true}
              isSelected={isSelected}
              onClick={isClickable ? () => onFactorClick(factorId) : undefined}
              style={{
                opacity: isClickable ? 1 : 0.5,
                cursor: isClickable ? 'pointer' : 'not-allowed',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
