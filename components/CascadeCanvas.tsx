'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Factor } from '@/types';
import { BASIC_MODE_FACTORS, CLINICAL_MODE_FACTORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/engine/factors';

interface CascadeCanvasProps {
  factors: Record<string, Factor>;
  mode: 'basic' | 'clinical';
  hoveredFactor: string | null;
  hoveredLabValue: string | null;
  dicPhase: 'normal' | 'activation' | 'consumption' | 'bleeding' | null;
  onFactorHover: (factorId: string | null) => void;
}

const PATHWAY_COLORS: Record<string, string> = {
  intrinsic: '#3b82f6',
  extrinsic: '#f97316',
  common: '#10b981',
  platelet: '#a855f7',
  fibrinolysis: '#6b7280',
};

const FACTOR_LABELS: Record<string, string> = {
  F12: 'Factor XII',
  F11: 'Factor XI',
  F9: 'Factor IX',
  F8: 'Factor VIII',
  TF: 'Tissue Factor',
  F7: 'Factor VII',
  F10: 'Factor X',
  F5: 'Factor V',
  F2: 'Protrombină',
  FBG: 'Fibrinogen',
  F13: 'Factor XIII',
  vWF: 'von Willebrand',
  PLT: 'Trombocite',
  AT: 'Antitrombina',
  PC: 'Proteina C',
  PS: 'Proteina S',
};

// Particle system for flow animation
interface Particle {
  fromId: string;
  toId: string;
  progress: number; // 0 to 1
  speed: number;
}

export function CascadeCanvas({
  factors,
  mode,
  hoveredFactor,
  hoveredLabValue,
  dicPhase,
  onFactorHover,
}: CascadeCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const visibleFactors = mode === 'clinical' ? CLINICAL_MODE_FACTORS : BASIC_MODE_FACTORS;
  const highlightedFactors = useMemo<string[]>(
    () => [],
    []
  );

  const stateRef = useRef({
    factors,
    visibleFactors,
    hoveredFactor,
    highlightedFactors,
    dicPhase,
    mode,
  });

  useEffect(() => {
    stateRef.current = {
      factors,
      visibleFactors,
      hoveredFactor,
      highlightedFactors,
      dicPhase,
      mode,
    };
  }, [factors, visibleFactors, hoveredFactor, highlightedFactors, dicPhase, mode]);

  useEffect(() => {
    const updateSize = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize particles for active connections
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (const factor of Object.values(factors)) {
      if (!visibleFactors.includes(factor.id)) continue;
      if (factor.activity < 0.3) continue; // Don't create particles for inactive factors

      for (const childId of factor.children) {
        const child = factors[childId];
        if (!child || !visibleFactors.includes(childId)) continue;
        if (child.activity < 0.3) continue;

        // Create 1-2 particles per connection based on activity
        const particleCount = factor.activity > 0.7 && child.activity > 0.7 ? 2 : 1;
        for (let i = 0; i < particleCount; i++) {
          newParticles.push({
            fromId: factor.id,
            toId: childId,
            progress: Math.random(), // Start at random position
            speed: 0.3 + Math.min(factor.activity, child.activity) * 0.4, // 0.3-0.7 speed
          });
        }
      }
    }
    particlesRef.current = newParticles;
  }, [factors, visibleFactors]);

  useEffect(() => {
    const draw = (timestamp: number): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate delta time for smooth animation
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = timestamp;

      const state = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const scaleX = rect.width / CANVAS_WIDTH;
      const scaleY = rect.height / CANVAS_HEIGHT;

      // Clear with light background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw pathway labels
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('CALEA INTRINSECĂ', 40 * scaleX, 45 * scaleY);
      ctx.textAlign = 'right';
      ctx.fillText('CALEA EXTRINSECĂ', 660 * scaleX, 45 * scaleY);
      ctx.textAlign = 'center';
      ctx.fillText('CALEA COMUNĂ', 350 * scaleX, 295 * scaleY);

      // Draw connections first (behind nodes)
      for (const factor of Object.values(state.factors)) {
        if (!state.visibleFactors.includes(factor.id)) continue;

        for (const childId of factor.children) {
          const child = state.factors[childId];
          if (!child || !state.visibleFactors.includes(childId)) continue;

          const fromX = factor.position.x * scaleX;
          const fromY = factor.position.y * scaleY;
          const toX = child.position.x * scaleX;
          const toY = child.position.y * scaleY;

          const activity = Math.min(factor.activity, child.activity);

          // Calculate arrow position (slightly before the target node)
          const angle = Math.atan2(toY - fromY, toX - fromX);
          const nodeRadius = 20;
          const arrowEndX = toX - Math.cos(angle) * (nodeRadius + 5);
          const arrowEndY = toY - Math.sin(angle) * (nodeRadius + 5);
          const arrowStartX = fromX + Math.cos(angle) * (nodeRadius + 5);
          const arrowStartY = fromY + Math.sin(angle) * (nodeRadius + 5);

          ctx.beginPath();
          ctx.moveTo(arrowStartX, arrowStartY);
          ctx.lineTo(arrowEndX, arrowEndY);

          if (activity < 0.2) {
            ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 1.5;
          } else if (activity < 0.5) {
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([]);
            ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = '#64748b';
            ctx.setLineDash([]);
            ctx.lineWidth = 2;
          }

          ctx.stroke();
          ctx.setLineDash([]);

          // Draw arrow head
          if (activity >= 0.2) {
            const arrowSize = 6;
            ctx.beginPath();
            ctx.moveTo(arrowEndX, arrowEndY);
            ctx.lineTo(
              arrowEndX - arrowSize * Math.cos(angle - Math.PI / 6),
              arrowEndY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              arrowEndX - arrowSize * Math.cos(angle + Math.PI / 6),
              arrowEndY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = activity < 0.5 ? '#94a3b8' : '#64748b';
            ctx.fill();
          }
        }
      }

      // Update and draw particles
      for (const particle of particlesRef.current) {
        const fromFactor = state.factors[particle.fromId];
        const toFactor = state.factors[particle.toId];
        if (!fromFactor || !toFactor) continue;
        if (!state.visibleFactors.includes(particle.fromId) || !state.visibleFactors.includes(particle.toId)) continue;

        // Update particle position
        particle.progress += particle.speed * deltaTime;
        if (particle.progress >= 1) {
          particle.progress = 0; // Reset to start
        }

        // Calculate particle position along the connection
        const fromX = fromFactor.position.x * scaleX;
        const fromY = fromFactor.position.y * scaleY;
        const toX = toFactor.position.x * scaleX;
        const toY = toFactor.position.y * scaleY;

        // Offset from node centers
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const nodeRadius = 22;
        const startX = fromX + Math.cos(angle) * nodeRadius;
        const startY = fromY + Math.sin(angle) * nodeRadius;
        const endX = toX - Math.cos(angle) * nodeRadius;
        const endY = toY - Math.sin(angle) * nodeRadius;

        // Interpolate position
        const px = startX + (endX - startX) * particle.progress;
        const py = startY + (endY - startY) * particle.progress;

        // Draw particle
        const activity = Math.min(fromFactor.activity, toFactor.activity);
        const particleRadius = 3;
        const alpha = 0.4 + activity * 0.5; // 0.4-0.9 opacity based on activity

        ctx.beginPath();
        ctx.arc(px, py, particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`; // Blue color
        ctx.fill();
      }

      // Draw nodes
      const time = timestamp / 1000; // Convert to seconds for animations

      for (const factor of Object.values(state.factors)) {
        if (!state.visibleFactors.includes(factor.id)) continue;

        const x = factor.position.x * scaleX;
        const y = factor.position.y * scaleY;
        const radius = 20;
        const isHovered = state.hoveredFactor === factor.id;
        const isHighlighted = state.highlightedFactors.includes(factor.id);
        const color = PATHWAY_COLORS[factor.pathway] || '#6b7280';
        const isAffected = factor.activity < 0.5;

        // AFFECTED FACTORS: Draw pulsing glow effect
        if (isAffected) {
          const pulseScale = 1 + Math.sin(time * 3) * 0.15; // Pulse between 1.0 and 1.15
          const glowRadius = radius * pulseScale + 8;
          const glowAlpha = 0.3 + Math.sin(time * 3) * 0.1; // Pulse opacity 0.2-0.4

          // Outer glow
          const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius + 10);
          if (factor.activity < 0.2) {
            gradient.addColorStop(0, `rgba(239, 68, 68, ${glowAlpha})`); // Red
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          } else {
            gradient.addColorStop(0, `rgba(249, 115, 22, ${glowAlpha})`); // Orange
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
          }

          ctx.beginPath();
          ctx.arc(x, y, glowRadius + 10, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Inner ring highlight
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = factor.activity < 0.2 ? '#ef4444' : '#f97316';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (isAffected) {
          // Affected: colored background
          ctx.fillStyle = factor.activity < 0.2 ? '#fef2f2' : '#fff7ed';
          ctx.strokeStyle = factor.activity < 0.2 ? '#ef4444' : '#f97316';
          ctx.lineWidth = 3;
        } else if (isHovered || isHighlighted) {
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
        }

        ctx.fill();
        ctx.stroke();

        // Factor short name inside
        ctx.font = '600 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (isAffected) {
          ctx.fillStyle = factor.activity < 0.2 ? '#dc2626' : '#ea580c';
        } else if (isHovered || isHighlighted) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = color;
        }
        ctx.fillText(factor.shortName, x, y);

        // Activity indicator with arrows (only if abnormal)
        if (factor.activity < 0.95) {
          const indicatorY = y + radius + 12;
          let arrowColor = '#eab308';
          let arrowCount = 1;

          if (factor.activity < 0.2) {
            arrowColor = '#dc2626';
            arrowCount = 2;
          } else if (factor.activity < 0.5) {
            arrowColor = '#ea580c';
            arrowCount = 1;
          }

          // Draw arrow(s) as triangles pointing DOWN
          const arrowSize = 8;
          const arrowSpacing = 14;
          const totalWidth = arrowCount === 2 ? arrowSpacing : 0;
          const startX = x - totalWidth / 2;

          for (let i = 0; i < arrowCount; i++) {
            const ax = startX + i * arrowSpacing;
            ctx.beginPath();
            ctx.moveTo(ax, indicatorY + arrowSize); // point at bottom
            ctx.lineTo(ax - arrowSize, indicatorY - arrowSize); // top left
            ctx.lineTo(ax + arrowSize, indicatorY - arrowSize); // top right
            ctx.closePath();
            ctx.fillStyle = arrowColor;
            ctx.fill();
          }
        }

        // Vitamin K indicator - green badge
        if (factor.vitKDependent && state.mode === 'clinical') {
          const badgeX = x + radius - 2;
          const badgeY = y - radius + 2;
          const badgeRadius = 8;

          // Badge background
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#16a34a';
          ctx.fill();

          // Badge border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // K letter
          ctx.font = '700 9px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('K', badgeX, badgeY);
        }
      }

      // DIC phase indicator
      if (state.dicPhase && state.dicPhase !== 'normal') {
        ctx.font = '600 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        const phaseText = state.dicPhase === 'activation'
          ? 'ACTIVARE MASIVĂ'
          : state.dicPhase === 'consumption'
            ? 'CONSUM FACTORI'
            : 'COAGULOPATIE';
        ctx.fillText(phaseText, rect.width / 2, 25);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame((timestamp) => draw(timestamp));
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const findFactorAtPosition = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const scaleX = rect.width / CANVAS_WIDTH;
    const scaleY = rect.height / CANVAS_HEIGHT;

    // Larger touch target on mobile (35px vs 25px)
    const touchRadius = 'ontouchstart' in window ? 35 : 25;

    for (const factor of Object.values(factors)) {
      if (!visibleFactors.includes(factor.id)) continue;

      const fx = factor.position.x * scaleX;
      const fy = factor.position.y * scaleY;
      const dist = Math.sqrt((x - fx) ** 2 + (y - fy) ** 2);

      if (dist < touchRadius) {
        return factor.id;
      }
    }

    return null;
  }, [factors, visibleFactors]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const found = findFactorAtPosition(e.clientX, e.clientY);
    onFactorHover(found);
  }, [findFactorAtPosition, onFactorHover]);

  const handleMouseLeave = useCallback(() => {
    onFactorHover(null);
  }, [onFactorHover]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const found = findFactorAtPosition(touch.clientX, touch.clientY);
      onFactorHover(found);
    }
  }, [findFactorAtPosition, onFactorHover]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const found = findFactorAtPosition(touch.clientX, touch.clientY);
      onFactorHover(found);
    }
  }, [findFactorAtPosition, onFactorHover]);

  const handleTouchEnd = useCallback(() => {
    // Keep selection visible for a moment on touch devices
    setTimeout(() => {
      onFactorHover(null);
    }, 2000);
  }, [onFactorHover]);

  const tooltipPosition = useMemo(() => {
    if (!hoveredFactor || !factors[hoveredFactor]) return { left: 0, top: 0 };
    const scaleX = canvasSize.width / CANVAS_WIDTH;
    const scaleY = canvasSize.height / CANVAS_HEIGHT;

    let left = factors[hoveredFactor].position.x * scaleX + 30;
    let top = factors[hoveredFactor].position.y * scaleY - 10;

    // On mobile, position tooltip below the factor instead of beside it
    const isMobile = canvasSize.width < 500;
    if (isMobile) {
      left = Math.max(10, Math.min(canvasSize.width - 160, factors[hoveredFactor].position.x * scaleX - 70));
      top = factors[hoveredFactor].position.y * scaleY + 35;
    }

    // Keep tooltip within bounds
    if (left + 150 > canvasSize.width) {
      left = factors[hoveredFactor].position.x * scaleX - 160;
    }

    return { left, top };
  }, [hoveredFactor, factors, canvasSize]);

  return (
    <div ref={containerRef} className="relative w-full h-full touch-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {hoveredFactor && factors[hoveredFactor] && (() => {
        const activity = factors[hoveredFactor].activity;
        let activityText = 'Normal';
        if (activity < 0.2) {
          activityText = '↓↓ Sever scăzut';
        } else if (activity < 0.5) {
          activityText = '↓ Scăzut';
        } else if (activity < 0.95) {
          activityText = '↓ Ușor scăzut';
        }
        return (
          <div className="tooltip" style={tooltipPosition}>
            <h4>{FACTOR_LABELS[hoveredFactor] || factors[hoveredFactor].name}</h4>
            <p>
              {activityText}
              {factors[hoveredFactor].vitKDependent && ' • Vit.K dep.'}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
