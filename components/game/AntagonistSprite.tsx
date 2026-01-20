// components/game/AntagonistSprite.tsx
'use client';

import type { Antagonist, AntagonistType } from '@/types/game';
import { ANTAGONIST_CONFIGS } from '@/engine/game/antagonist-ai';

// =============================================================================
// ANTAGONIST VISUAL CONFIG
// =============================================================================

interface AntagonistVisual {
  label: string;
  description: string;
  shape: 'serpentine' | 'scissor' | 'dissolving';
}

const ANTAGONIST_VISUALS: Record<AntagonistType, AntagonistVisual> = {
  antithrombin: {
    label: 'AT',
    description: 'Antithrombin',
    shape: 'serpentine',
  },
  apc: {
    label: 'APC',
    description: 'Activated Protein C',
    shape: 'scissor',
  },
  plasmin: {
    label: 'PLM',
    description: 'Plasmin',
    shape: 'dissolving',
  },
};

// =============================================================================
// SVG SHAPE COMPONENTS
// =============================================================================

interface ShapeProps {
  color: string;
  isHunting: boolean;
  isAttacking: boolean;
}

function SerpentineShape({ color, isHunting, isAttacking }: ShapeProps): React.ReactElement {
  // Serpentine/snake shape for Antithrombin (serpin family)
  const animationClass = isAttacking
    ? 'animate-attack'
    : isHunting
      ? 'animate-hunt'
      : 'animate-idle';

  return (
    <svg
      width="40"
      height="24"
      viewBox="0 0 40 24"
      style={{
        filter: isAttacking ? `drop-shadow(0 0 8px ${color})` : 'none',
      }}
      className={animationClass}
    >
      <path
        d="M4 12 C8 4, 16 4, 20 12 S32 20, 36 12"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        style={{
          strokeDasharray: isHunting ? '4 2' : 'none',
        }}
      />
      {/* Head */}
      <circle cx="36" cy="12" r="4" fill={color} />
      {/* Eyes */}
      <circle cx="35" cy="10" r="1.5" fill="#000" />
    </svg>
  );
}

function ScissorShape({ color, isHunting, isAttacking }: ShapeProps): React.ReactElement {
  // Scissor shape for APC (cuts cofactors)
  const openAngle = isAttacking ? 35 : isHunting ? 25 : 15;

  return (
    <svg
      width="36"
      height="32"
      viewBox="0 0 36 32"
      style={{
        filter: isAttacking ? `drop-shadow(0 0 8px ${color})` : 'none',
      }}
    >
      {/* Upper blade */}
      <path
        d={`M18 16 L32 ${16 - openAngle * 0.3} L30 ${16 - openAngle * 0.3 - 4} L16 14 Z`}
        fill={color}
        style={{
          transformOrigin: '18px 16px',
          transition: 'all 0.2s ease-out',
        }}
      />
      {/* Lower blade */}
      <path
        d={`M18 16 L32 ${16 + openAngle * 0.3} L30 ${16 + openAngle * 0.3 + 4} L16 18 Z`}
        fill={color}
        style={{
          transformOrigin: '18px 16px',
          transition: 'all 0.2s ease-out',
        }}
      />
      {/* Handle ring */}
      <circle cx="10" cy="8" r="6" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="10" cy="24" r="6" fill="none" stroke={color} strokeWidth="3" />
      {/* Center pivot */}
      <circle cx="18" cy="16" r="3" fill={color} />
    </svg>
  );
}

function DissolvingShape({ color, isHunting, isAttacking }: ShapeProps): React.ReactElement {
  // Dissolving/eating shape for Plasmin
  const pacmanMouth = isAttacking ? 60 : isHunting ? 40 : 20;

  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      style={{
        filter: isAttacking ? `drop-shadow(0 0 8px ${color})` : 'none',
      }}
    >
      {/* Pac-man like dissolving shape */}
      <path
        d={`M18 18 L${18 + 14 * Math.cos((pacmanMouth / 2) * (Math.PI / 180))} ${18 - 14 * Math.sin((pacmanMouth / 2) * (Math.PI / 180))}
            A14 14 0 1 0 ${18 + 14 * Math.cos((pacmanMouth / 2) * (Math.PI / 180))} ${18 + 14 * Math.sin((pacmanMouth / 2) * (Math.PI / 180))}
            Z`}
        fill={color}
        style={{
          transformOrigin: '18px 18px',
          transition: 'all 0.15s ease-out',
        }}
      />
      {/* Eye */}
      <circle cx="16" cy="10" r="3" fill="#000" />
      {/* Digestive dots when attacking */}
      {isAttacking && (
        <>
          <circle cx="30" cy="18" r="2" fill={color} opacity="0.6" />
          <circle cx="34" cy="16" r="1.5" fill={color} opacity="0.4" />
          <circle cx="34" cy="20" r="1" fill={color} opacity="0.3" />
        </>
      )}
    </svg>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface AntagonistSpriteProps {
  antagonist: Antagonist;
}

export function AntagonistSprite({ antagonist }: AntagonistSpriteProps): React.ReactElement {
  const config = ANTAGONIST_CONFIGS[antagonist.type];
  const visual = ANTAGONIST_VISUALS[antagonist.type];

  const isHunting = antagonist.state === 'hunting';
  const isAttacking = antagonist.state === 'attacking';

  // Render the appropriate shape based on antagonist type
  const renderShape = (): React.ReactElement => {
    const shapeProps: ShapeProps = {
      color: config.color,
      isHunting,
      isAttacking,
    };

    switch (visual.shape) {
      case 'serpentine':
        return <SerpentineShape {...shapeProps} />;
      case 'scissor':
        return <ScissorShape {...shapeProps} />;
      case 'dissolving':
        return <DissolvingShape {...shapeProps} />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: antagonist.position.x,
        top: antagonist.position.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        transition: isAttacking ? 'none' : 'transform 0.05s linear',
      }}
    >
      {/* Shape container with animation */}
      <div
        style={{
          animation: isHunting
            ? 'pulse 0.5s ease-in-out infinite'
            : isAttacking
              ? 'flash 0.15s ease-out'
              : 'bob 2s ease-in-out infinite',
        }}
      >
        {renderShape()}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: config.color,
          marginTop: 2,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          letterSpacing: '0.5px',
          opacity: isAttacking ? 0 : 1,
          transition: 'opacity 0.1s',
        }}
      >
        {visual.label}
      </span>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes flash {
          0% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
