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

  useEffect(() => {
    const draw = (): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

      // Draw nodes
      for (const factor of Object.values(state.factors)) {
        if (!state.visibleFactors.includes(factor.id)) continue;

        const x = factor.position.x * scaleX;
        const y = factor.position.y * scaleY;
        const radius = 20;
        const isHovered = state.hoveredFactor === factor.id;
        const isHighlighted = state.highlightedFactors.includes(factor.id);
        const color = PATHWAY_COLORS[factor.pathway] || '#6b7280';

        // Node circle - flat design
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (factor.activity < 0.2) {
          ctx.fillStyle = '#f1f5f9';
          ctx.strokeStyle = '#cbd5e1';
        } else {
          ctx.fillStyle = isHovered || isHighlighted ? color : '#ffffff';
          ctx.strokeStyle = color;
        }

        ctx.lineWidth = isHovered || isHighlighted ? 3 : 2;
        ctx.fill();
        ctx.stroke();

        // Factor short name inside
        ctx.font = '600 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = factor.activity < 0.2
          ? '#94a3b8'
          : (isHovered || isHighlighted ? '#ffffff' : color);
        ctx.fillText(factor.shortName, x, y);

        // Activity indicator with arrows (only if abnormal)
        if (factor.activity < 0.95) {
          const indicatorY = y + radius + 10;
          let arrowColor = '#eab308';
          let arrowCount = 1;

          if (factor.activity < 0.2) {
            arrowColor = '#ef4444';
            arrowCount = 2;
          } else if (factor.activity < 0.5) {
            arrowColor = '#f97316';
            arrowCount = 1;
          }

          // Draw arrow(s) as triangles pointing DOWN
          const arrowSize = 7;
          const arrowSpacing = 12;
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

    animationRef.current = requestAnimationFrame(draw);
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
