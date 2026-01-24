// components/CoagulationIllustration/DraggableFactor.tsx
'use client';

import type { ReactElement } from 'react';
import { ZymogenShape } from '@/components/game/shapes/ZymogenShape';
import type { SlotConfig, Position } from './types';

interface DraggableFactorProps {
  slot: SlotConfig;
  position: Position;
  isNearSlot: boolean;
}

export function DraggableFactor({
  slot,
  position,
  isNearSlot,
}: DraggableFactorProps): ReactElement {
  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Shadow underneath */}
      <div
        className={`
          absolute inset-0 rounded-full bg-black/20 blur-md
          transition-all duration-150
          ${isNearSlot ? 'scale-110 opacity-60' : 'scale-100 opacity-40'}
        `}
        style={{
          transform: 'translate(4px, 8px)',
        }}
      />

      {/* Factor shape with lift effect */}
      <div
        className={`
          relative transition-all duration-150
          ${isNearSlot ? 'scale-125' : 'scale-110'}
        `}
      >
        <ZymogenShape
          color={slot.color}
          label={slot.label}
          style={{
            filter: isNearSlot
              ? `drop-shadow(0 0 12px ${slot.color})`
              : `drop-shadow(0 4px 8px rgba(0,0,0,0.3))`,
          }}
        />

        {/* Glow ring when near slot */}
        {isNearSlot && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              backgroundColor: slot.color,
              opacity: 0.3,
              transform: 'scale(1.5)',
            }}
          />
        )}
      </div>

      {/* Ca2+ sparkles when near slot */}
      {isNearSlot && (
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="calcium-sparkle"
              style={{
                left: '50%',
                top: '50%',
                '--dx': `${Math.cos((i * Math.PI) / 2) * 30}px`,
                '--dy': `${Math.sin((i * Math.PI) / 2) * 30}px`,
                animationDelay: `${i * 100}ms`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
}
