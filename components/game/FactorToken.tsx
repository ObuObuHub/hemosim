// components/game/FactorToken.tsx
'use client';

import type { FactorDefinition } from '@/types/game';
import { COLORS } from '@/engine/game/game-config';

interface FactorTokenProps {
  factor: FactorDefinition;
  isActive: boolean;
  isSelected?: boolean;
  isInPalette?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function FactorToken({
  factor,
  isActive,
  isSelected = false,
  isInPalette = false,
  onClick,
  style,
}: FactorTokenProps): React.ReactElement {
  const label = isActive ? factor.activeLabel : factor.inactiveLabel;
  const categoryLabel = factor.category;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        borderRadius: 8,
        backgroundColor: isActive ? factor.color : `${factor.color}40`,
        border: `3px solid ${isSelected ? '#FBBF24' : factor.color}`,
        boxShadow: isSelected ? `0 0 12px ${factor.color}` : 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        minWidth: 80,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: isActive ? '#FFFFFF' : COLORS.textPrimary,
        }}
      >
        {label}
      </span>
      {isInPalette && (
        <span
          style={{
            fontSize: 10,
            color: COLORS.textSecondary,
            marginTop: 2,
          }}
        >
          {categoryLabel}
        </span>
      )}
    </div>
  );
}
