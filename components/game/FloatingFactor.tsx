// components/game/FloatingFactor.tsx
'use client';

import type { FloatingFactor as FloatingFactorType } from '@/types/game';
import { getFactorDefinition } from '@/engine/game/factor-definitions';
import { ZymogenShape } from './shapes';

interface FloatingFactorProps {
  factor: FloatingFactorType;
  onDragStart?: (event: React.MouseEvent | React.TouchEvent) => void;
}

export function FloatingFactor({ factor, onDragStart }: FloatingFactorProps): React.ReactElement | null {
  const definition = getFactorDefinition(factor.factorId);

  if (!definition) {
    return null;
  }

  const isDraggable = Boolean(onDragStart);

  return (
    <div
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      style={{
        position: 'absolute',
        left: factor.position.x,
        top: factor.position.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggable ? 'grab' : 'default',
        transition: 'transform 0.1s ease-out, filter 0.1s ease-out',
        pointerEvents: isDraggable ? 'auto' : 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseEnter={(e) => {
        if (isDraggable) {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
          e.currentTarget.style.filter = `drop-shadow(0 0 12px ${definition.color})`;
        }
      }}
      onMouseLeave={(e) => {
        if (isDraggable) {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          e.currentTarget.style.filter = '';
        }
      }}
    >
      <ZymogenShape
        color={definition.color}
        label={definition.inactiveLabel}
      />
    </div>
  );
}
