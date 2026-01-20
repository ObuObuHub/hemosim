// components/game/BloodstreamZone.tsx
'use client';

import type { FloatingFactor as FloatingFactorType } from '@/types/game';
import { BLOODSTREAM_ZONE, GAME_CANVAS, COLORS } from '@/engine/game/game-config';
import { FloatingFactor } from './FloatingFactor';

interface BloodstreamZoneProps {
  floatingFactors: FloatingFactorType[];
}

export function BloodstreamZone({ floatingFactors }: BloodstreamZoneProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: BLOODSTREAM_ZONE.y,
        width: GAME_CANVAS.width,
        height: BLOODSTREAM_ZONE.height,
        backgroundColor: '#0C1929',
        borderBottom: `2px solid ${COLORS.panelBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* Bloodstream background effect - flowing lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(90deg,
              transparent 0%,
              rgba(59, 130, 246, 0.05) 20%,
              rgba(59, 130, 246, 0.08) 50%,
              rgba(59, 130, 246, 0.05) 80%,
              transparent 100%
            )
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Zone label */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 8,
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.textDim,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Bloodstream
      </div>

      {/* Floating factors */}
      {floatingFactors.map((factor) => (
        <FloatingFactor key={factor.id} factor={factor} />
      ))}
    </div>
  );
}
