// components/game/visuals/EnzymaticActivation.tsx
// Enzymatic Activation Animation Components
// Visualizes the E + S → ES → E + P mechanism biochemically accurately
'use client';

import { useId } from 'react';

/**
 * ESComplexGlow - Enzyme-Substrate complex binding glow
 *
 * Medical accuracy: Shows the substrate docked at enzyme active site
 * before cleavage. The glow represents the induced-fit conformational change.
 */
interface ESComplexGlowProps {
  color: string;
  size?: number;
}

export function ESComplexGlow({ color, size = 60 }: ESComplexGlowProps): React.ReactElement {
  const uniqueId = useId();

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id={`es-glow-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`es-gradient-${uniqueId}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="60%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pulsing glow circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 5}
          fill={`url(#es-gradient-${uniqueId})`}
          filter={`url(#es-glow-${uniqueId})`}
          style={{
            animation: 'esComplexPulse 300ms ease-in-out',
          }}
        />

        {/* Inner docking indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.6}
          style={{
            animation: 'esComplexRotate 600ms linear',
          }}
        />
      </svg>

      <style>
        {`
          @keyframes esComplexPulse {
            0%, 100% {
              opacity: 0.5;
              transform: scale(0.9);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes esComplexRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(90deg); }
          }
        `}
      </style>
    </div>
  );
}

/**
 * CleavageAnimation - Proteolytic cleavage effect at enzyme active site
 *
 * Medical accuracy: Represents the serine protease mechanism where
 * the enzyme cleaves a specific peptide bond, converting zymogen to active enzyme.
 * Visual: Two terminus circles separating as the peptide bond breaks.
 */
interface CleavageAnimationProps {
  x: number;
  y: number;
  color: string;
  size?: number;
}

export function CleavageAnimation({
  x,
  y,
  color,
  size = 60,
}: CleavageAnimationProps): React.ReactElement {
  const uniqueId = useId();

  // Bond separation distance
  const separationDistance = 12;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      <svg width={size} height={size}>
        <defs>
          <filter id={`bond-glow-${uniqueId}`}>
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Subtle glow at cleavage site */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={8}
          fill={color}
          opacity={0.3}
          filter={`url(#bond-glow-${uniqueId})`}
          style={{ animation: 'bondGlow 400ms ease-out forwards' }}
        />

        {/* Connecting bond line (breaks) */}
        <line
          x1={size / 2 - 8}
          y1={size / 2}
          x2={size / 2 + 8}
          y2={size / 2}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="2 2"
          style={{ animation: 'bondBreak 400ms ease-out forwards' }}
        />

        {/* Left terminus (N-terminus) */}
        <circle
          cx={size / 2 - 6}
          cy={size / 2}
          r={5}
          fill={color}
          stroke="#FFFFFF"
          strokeWidth={1.5}
          style={{
            animation: 'terminusSeparateLeft 400ms ease-out forwards',
            '--separation': `${separationDistance}px`,
          } as React.CSSProperties}
        />

        {/* Right terminus (C-terminus) */}
        <circle
          cx={size / 2 + 6}
          cy={size / 2}
          r={5}
          fill={color}
          stroke="#FFFFFF"
          strokeWidth={1.5}
          style={{
            animation: 'terminusSeparateRight 400ms ease-out forwards',
            '--separation': `${separationDistance}px`,
          } as React.CSSProperties}
        />
      </svg>

      <style>{`
        @keyframes bondGlow {
          0% { opacity: 0; r: 4; }
          30% { opacity: 0.4; r: 10; }
          100% { opacity: 0; r: 15; }
        }
        @keyframes bondBreak {
          0% { opacity: 0.8; stroke-dasharray: 16 0; }
          50% { opacity: 0.5; stroke-dasharray: 4 4; }
          100% { opacity: 0; stroke-dasharray: 2 8; }
        }
        @keyframes terminusSeparateLeft {
          0% { transform: translateX(0); opacity: 0.7; }
          30% { opacity: 1; }
          100% { transform: translateX(calc(-1 * var(--separation))); opacity: 0; }
        }
        @keyframes terminusSeparateRight {
          0% { transform: translateX(0); opacity: 0.7; }
          30% { opacity: 1; }
          100% { transform: translateX(var(--separation)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * ProductReleaseGlow - Product emergence animation
 *
 * Medical accuracy: Shows the activated enzyme product releasing
 * from the enzyme-substrate complex and becoming free in solution.
 */
interface ProductReleaseGlowProps {
  color: string;
  size?: number;
}

export function ProductReleaseGlow({ color, size = 50 }: ProductReleaseGlowProps): React.ReactElement {
  const uniqueId = useId();

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      <svg width={size} height={size}>
        <defs>
          <filter id={`release-glow-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Release shimmer ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 5}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.7}
          filter={`url(#release-glow-${uniqueId})`}
          style={{
            animation: 'releaseShimmer 400ms ease-out forwards',
          }}
        />

        {/* Inner highlight */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 4}
          fill={color}
          opacity={0.3}
          style={{
            animation: 'releaseFade 400ms ease-out forwards',
          }}
        />
      </svg>

      <style>
        {`
          @keyframes releaseShimmer {
            0% { opacity: 0.9; stroke-width: 3; }
            100% { opacity: 0; stroke-width: 0.5; r: ${size / 2 + 10}; }
          }
          @keyframes releaseFade {
            0% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1.5); }
          }
        `}
      </style>
    </div>
  );
}
