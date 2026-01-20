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

  // Enhanced glow for active factors
  const glowIntensity = isActive ? '0 0 20px' : '0 0 8px';
  const selectedGlow = isSelected ? `0 0 25px ${factor.color}, 0 0 40px ${factor.color}60` : '';
  const activeGlow = isActive ? `${glowIntensity} ${factor.color}80, inset 0 1px 0 rgba(255,255,255,0.3)` : 'none';
  const combinedShadow = isSelected ? selectedGlow : activeGlow;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 18px',
        borderRadius: 12,
        background: isActive
          ? `linear-gradient(135deg, ${factor.color} 0%, ${factor.color}CC 100%)`
          : `linear-gradient(135deg, ${factor.color}50 0%, ${factor.color}30 100%)`,
        border: `3px solid ${isSelected ? '#FBBF24' : isActive ? factor.color : `${factor.color}80`}`,
        boxShadow: combinedShadow,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease-out',
        minWidth: 85,
        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = isSelected ? 'scale(1.08)' : 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 0 25px ${factor.color}90`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = isSelected ? 'scale(1.08)' : 'scale(1)';
          e.currentTarget.style.boxShadow = combinedShadow;
        }
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#FFFFFF',
          textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
      {isInPalette && (
        <span
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {categoryLabel}
        </span>
      )}
    </div>
  );
}
