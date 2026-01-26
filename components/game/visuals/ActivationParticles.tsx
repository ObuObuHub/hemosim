// components/game/visuals/ActivationParticles.tsx
'use client';

import { useMemo } from 'react';

interface ActivationParticlesProps {
  x: number;
  y: number;
  color: string;
  isActive: boolean;
  particleCount?: number;
  radius?: number;
  duration?: number;
}

/**
 * ActivationParticles - Radial burst effect for factor activation
 *
 * Medical accuracy: Represents the conformational change during activation
 * Visual: Particles radiate outward from the activation site
 */
export function ActivationParticles({
  x,
  y,
  color,
  isActive,
  particleCount = 8,
  radius = 25,
  duration = 0.8,
}: ActivationParticlesProps): React.ReactElement | null {
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * 2 * Math.PI;
      const randomRadius = radius * (0.7 + Math.random() * 0.6);
      return {
        endX: Math.cos(angle) * randomRadius,
        endY: Math.sin(angle) * randomRadius,
        delay: i * 0.03,
        size: 2 + Math.random() * 2,
      };
    });
  }, [particleCount, radius]);

  if (!isActive) return null;

  const uniqueId = `activation-${x}-${y}-${Date.now()}`;

  return (
    <svg
      style={{
        position: 'absolute',
        left: x - radius - 10,
        top: y - radius - 10,
        width: radius * 2 + 20,
        height: radius * 2 + 20,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 50,
      }}
    >
      <defs>
        <filter id={`glow-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`gradient-${uniqueId}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>

      {/* Central flash */}
      <circle
        cx={radius + 10}
        cy={radius + 10}
        r={8}
        fill={`url(#gradient-${uniqueId})`}
        filter={`url(#glow-${uniqueId})`}
        style={{
          animation: `centralFlash ${duration}s ease-out forwards`,
        }}
      />

      {/* Radiating particles */}
      {particles.map((particle, i) => (
        <circle
          key={i}
          cx={radius + 10}
          cy={radius + 10}
          r={particle.size}
          fill={color}
          filter={`url(#glow-${uniqueId})`}
          style={{
            animation: `particleRadiate ${duration}s ease-out ${particle.delay}s forwards`,
            transformOrigin: `${radius + 10}px ${radius + 10}px`,
            '--end-x': `${particle.endX}px`,
            '--end-y': `${particle.endY}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Expanding ring */}
      <circle
        cx={radius + 10}
        cy={radius + 10}
        r={5}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.6}
        style={{
          animation: `ringExpand ${duration * 1.2}s ease-out forwards`,
        }}
      />

      <style>
        {`
          @keyframes centralFlash {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            30% {
              transform: scale(1.5);
              opacity: 1;
            }
            100% {
              transform: scale(0.5);
              opacity: 0;
            }
          }
          @keyframes particleRadiate {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(var(--end-x), var(--end-y)) scale(0);
              opacity: 0;
            }
          }
          @keyframes ringExpand {
            0% {
              r: 5;
              opacity: 0.8;
              stroke-width: 3;
            }
            100% {
              r: ${radius};
              opacity: 0;
              stroke-width: 0.5;
            }
          }
        `}
      </style>
    </svg>
  );
}

/**
 * CleavageParticles - Scissor-cut effect for proteolytic cleavage
 *
 * Medical accuracy: Shows the peptide bond cleavage by serine proteases
 * Visual: Two halves separating with debris particles
 */
interface CleavageParticlesProps {
  x: number;
  y: number;
  isActive: boolean;
  direction?: 'horizontal' | 'vertical';
}

export function CleavageParticles({
  x,
  y,
  isActive,
  direction = 'horizontal',
}: CleavageParticlesProps): React.ReactElement | null {
  if (!isActive) return null;

  const uniqueId = `cleavage-${x}-${y}-${Date.now()}`;
  const isHorizontal = direction === 'horizontal';

  return (
    <svg
      style={{
        position: 'absolute',
        left: x - 30,
        top: y - 20,
        width: 60,
        height: 40,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 50,
      }}
    >
      <defs>
        <filter id={`glow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cleavage line flash */}
      <line
        x1={isHorizontal ? 10 : 30}
        y1={isHorizontal ? 20 : 5}
        x2={isHorizontal ? 50 : 30}
        y2={isHorizontal ? 20 : 35}
        stroke="#FBBF24"
        strokeWidth={3}
        strokeLinecap="round"
        filter={`url(#glow-${uniqueId})`}
        style={{
          animation: 'cleavageFlash 0.4s ease-out forwards',
        }}
      />

      {/* Debris particles */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI + (Math.random() - 0.5) * 0.5;
        const dist = 15 + Math.random() * 10;
        const endX = Math.cos(angle) * dist * (i < 3 ? 1 : -1);
        const endY = Math.sin(angle) * dist;
        return (
          <circle
            key={i}
            cx={30}
            cy={20}
            r={1.5 + Math.random()}
            fill="#FBBF24"
            style={{
              animation: `debrisFly 0.6s ease-out ${i * 0.02}s forwards`,
              '--end-x': `${endX}px`,
              '--end-y': `${endY}px`,
            } as React.CSSProperties}
          />
        );
      })}

      <style>
        {`
          @keyframes cleavageFlash {
            0% {
              opacity: 0;
              stroke-width: 1;
            }
            20% {
              opacity: 1;
              stroke-width: 4;
            }
            100% {
              opacity: 0;
              stroke-width: 1;
            }
          }
          @keyframes debrisFly {
            0% {
              transform: translate(0, 0);
              opacity: 1;
            }
            100% {
              transform: translate(var(--end-x), var(--end-y));
              opacity: 0;
            }
          }
        `}
      </style>
    </svg>
  );
}
