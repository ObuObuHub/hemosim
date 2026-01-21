// components/game/BloodstreamZone.tsx
'use client';

import type { FloatingFactor as FloatingFactorType, Antagonist, MessengerFactor, SpilloverParticle } from '@/types/game';
import { BLOODSTREAM_ZONE, GAME_CANVAS, COLORS } from '@/engine/game/game-config';
import { FloatingFactor } from './FloatingFactor';
import { AntagonistSprite } from './AntagonistSprite';

interface BloodstreamZoneProps {
  floatingFactors: FloatingFactorType[];
  messengerFactors: MessengerFactor[];
  spilloverParticles: SpilloverParticle[];
  antagonists: Antagonist[];
  onFactorDragStart?: (floatingFactorId: string, event: React.MouseEvent | React.TouchEvent) => void;
}

export function BloodstreamZone({
  floatingFactors,
  messengerFactors,
  spilloverParticles,
  antagonists,
  onFactorDragStart,
}: BloodstreamZoneProps): React.ReactElement {
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

      {/* Thrombomodulin zones (vessel wall edges) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 20,
          background: 'linear-gradient(to bottom, #9333EA40, transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 20,
          background: 'linear-gradient(to top, #9333EA40, transparent)',
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
        <FloatingFactor
          key={factor.id}
          factor={factor}
          onDragStart={
            onFactorDragStart
              ? (event) => onFactorDragStart(factor.id, event)
              : undefined
          }
        />
      ))}

      {/* Messenger factors (FIXa traveling from TF-cell to platelet) */}
      {messengerFactors.map((messenger) => (
        <div
          key={messenger.id}
          style={{
            position: 'absolute',
            left: messenger.position.x - 20,
            top: messenger.position.y - 15,
            width: 40,
            height: 30,
            backgroundColor: '#06B6D480',
            border: '2px solid #06B6D4',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#06B6D4',
            boxShadow: '0 0 10px #06B6D4',
            pointerEvents: 'none',
          }}
        >
          FIXa
        </div>
      ))}

      {/* Spillover particles (thrombin drifting to vessel wall edges) */}
      {spilloverParticles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.position.x - 4,
            top: particle.position.y - 4,
            width: 8,
            height: 8,
            backgroundColor: '#EF4444',
            borderRadius: '50%',
            boxShadow: '0 0 6px #EF4444',
            opacity: Math.max(0.3, particle.lifetime / 3),
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Antagonists */}
      {antagonists.map((antagonist) => (
        <AntagonistSprite key={antagonist.id} antagonist={antagonist} />
      ))}
    </div>
  );
}
