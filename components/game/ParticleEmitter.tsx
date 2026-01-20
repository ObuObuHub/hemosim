// components/game/ParticleEmitter.tsx
'use client';

import { useRef, useEffect } from 'react';
import { GAME_CANVAS } from '@/engine/game/game-config';

// =============================================================================
// TYPES
// =============================================================================

export interface Particle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  progress: number; // 0-1
}

interface ParticleEmitterProps {
  particles: Particle[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_OPACITY = 0.5; // Particles fade to this opacity at the end

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Canvas-based particle system for signal flow visualization.
 * Renders particles that travel from source to target positions.
 * Each particle fades as it approaches its destination.
 */
export function ParticleEmitter({ particles }: ParticleEmitterProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each particle
    particles.forEach((particle) => {
      // Interpolate position based on progress
      const currentX = particle.x + (particle.targetX - particle.x) * particle.progress;
      const currentY = particle.y + (particle.targetY - particle.y) * particle.progress;

      // Calculate opacity (fade as particle travels)
      const opacity = 1 - particle.progress * (1 - MIN_OPACITY);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(currentX, currentY, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();

      // Add glow effect for visibility
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.fill();

      ctx.restore();
    });
  }, [particles]);

  // Return empty canvas if no particles
  if (particles.length === 0) {
    return (
      <canvas
        ref={canvasRef}
        width={GAME_CANVAS.width}
        height={GAME_CANVAS.height}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CANVAS.width}
      height={GAME_CANVAS.height}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
