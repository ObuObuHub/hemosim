// components/game/FactorPalette.tsx
'use client';

import { COLORS, LAYOUT, GAME_CANVAS } from '@/engine/game/game-config';
import { getFactorDefinition } from '@/engine/game/factor-definitions';
import { FactorToken } from './FactorToken';

interface FactorPaletteProps {
  availableFactors: string[];
  selectedFactorId: string | null;
  onFactorClick: (factorId: string) => void;
}

export function FactorPalette({
  availableFactors,
  selectedFactorId,
  onFactorClick,
}: FactorPaletteProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: LAYOUT.palette.y,
        width: GAME_CANVAS.width,
        height: LAYOUT.palette.height,
        backgroundColor: COLORS.panelBackgroundLocked,
        borderTop: `1px solid ${COLORS.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.textSecondary,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Factor Palette
      </div>

      {/* Factors */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {availableFactors.map((factorId) => {
          const factor = getFactorDefinition(factorId);
          if (!factor) return null;

          return (
            <FactorToken
              key={factorId}
              factor={factor}
              isActive={false}
              isSelected={selectedFactorId === factorId}
              isInPalette={true}
              onClick={() => onFactorClick(factorId)}
            />
          );
        })}

        {availableFactors.length === 0 && (
          <div
            style={{
              fontSize: 14,
              color: COLORS.textDim,
              fontStyle: 'italic',
            }}
          >
            All factors placed
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          fontSize: 11,
          color: COLORS.textDim,
          marginTop: 12,
        }}
      >
        Click a factor to select, then click a slot to place
      </div>
    </div>
  );
}
