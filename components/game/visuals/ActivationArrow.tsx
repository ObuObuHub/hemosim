// components/game/visuals/ActivationArrow.tsx
'use client';

import { useEffect, useState, useRef, useId } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface ActivationArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  onComplete?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ANIMATION_DURATION_MS = 600;
const DRAW_PHASE_END = 0.7;
const STROKE_WIDTH = 3;
const GLOW_BLUR = 2;
const HEAD_LENGTH = 10;
const HEAD_ANGLE = Math.PI / 6;
const CURVE_OFFSET = 20;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate the approximate length of a quadratic bezier curve.
 * Uses a simple approximation by sampling points along the curve.
 */
function approximateQuadraticBezierLength(
  fromX: number,
  fromY: number,
  ctrlX: number,
  ctrlY: number,
  toX: number,
  toY: number
): number {
  const segments = 10;
  let length = 0;
  let prevX = fromX;
  let prevY = fromY;

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const tInv = 1 - t;
    // Quadratic bezier formula: (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const x = tInv * tInv * fromX + 2 * tInv * t * ctrlX + t * t * toX;
    const y = tInv * tInv * fromY + 2 * tInv * t * ctrlY + t * t * toY;

    length += Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
    prevX = x;
    prevY = y;
  }

  return length;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dynamic activation arrow that pulses and fades.
 * TEXTBOOK: Shows conversion/activation pathway (e.g., FX -> FXa)
 *
 * Animation phases:
 * 1. Draw phase (0-70%): Arrow draws in from source to destination
 * 2. Fade phase (70-100%): Arrow fades out
 */
export function ActivationArrow({
  fromX,
  fromY,
  toX,
  toY,
  color,
  onComplete,
}: ActivationArrowProps): React.ReactElement | null {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const onCompleteRef = useRef(onComplete);
  const filterId = useId();

  // Keep ref in sync with prop to avoid stale closure issues
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

      if (p < DRAW_PHASE_END) {
        // Drawing phase: stroke progressively reveals
        setProgress(p / DRAW_PHASE_END);
        setOpacity(1);
      } else {
        // Fade phase: arrow fades out
        setProgress(1);
        setOpacity(1 - (p - DRAW_PHASE_END) / (1 - DRAW_PHASE_END));
      }

      if (p < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current?.();
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [fromX, fromY, toX, toY]); // Re-run animation if coordinates change

  if (opacity <= 0) return null;

  // Calculate curved path control point (offset perpendicular to the line)
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2 - CURVE_OFFSET;

  // Calculate path length for stroke-dasharray
  const pathLength = approximateQuadraticBezierLength(
    fromX,
    fromY,
    midX,
    midY,
    toX,
    toY
  );

  // Calculate arrow head direction from control point to end point
  const angle = Math.atan2(toY - midY, toX - midX);

  const headX1 = toX - HEAD_LENGTH * Math.cos(angle - HEAD_ANGLE);
  const headY1 = toY - HEAD_LENGTH * Math.sin(angle - HEAD_ANGLE);
  const headX2 = toX - HEAD_LENGTH * Math.cos(angle + HEAD_ANGLE);
  const headY2 = toY - HEAD_LENGTH * Math.sin(angle + HEAD_ANGLE);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
      }}
    >
      <defs>
        <filter id={`arrow-glow-${filterId}`}>
          <feGaussianBlur stdDeviation={GLOW_BLUR} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Curved arrow path */}
      <path
        d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
        fill="none"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - progress)}
        filter={`url(#arrow-glow-${filterId})`}
      />

      {/* Arrow head - appears near end of draw phase */}
      {progress > 0.8 && (
        <polygon
          points={`${toX},${toY} ${headX1},${headY1} ${headX2},${headY2}`}
          fill={color}
          filter={`url(#arrow-glow-${filterId})`}
        />
      )}
    </svg>
  );
}
