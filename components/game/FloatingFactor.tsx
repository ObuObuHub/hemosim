// components/game/FloatingFactor.tsx
'use client';

import type { FloatingFactor as FloatingFactorType } from '@/types/game';
import { getFactorDefinition } from '@/engine/game/factor-definitions';

interface FloatingFactorProps {
  factor: FloatingFactorType;
  onClick?: () => void;
}

export function FloatingFactor({ factor, onClick }: FloatingFactorProps): React.ReactElement | null {
  const definition = getFactorDefinition(factor.factorId);

  if (!definition) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: factor.position.x,
        top: factor.position.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 14px',
        borderRadius: 10,
        background: `linear-gradient(135deg, ${definition.color}50 0%, ${definition.color}30 100%)`,
        border: `2px solid ${definition.color}80`,
        boxShadow: `0 0 12px ${definition.color}40`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
        minWidth: 60,
        pointerEvents: onClick ? 'auto' : 'none',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
          e.currentTarget.style.boxShadow = `0 0 20px ${definition.color}70`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          e.currentTarget.style.boxShadow = `0 0 12px ${definition.color}40`;
        }
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
        {definition.inactiveLabel}
      </span>
      <span
        style={{
          fontSize: 8,
          color: 'rgba(255,255,255,0.6)',
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        {definition.category}
      </span>
    </div>
  );
}
