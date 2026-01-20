// components/game/ArrowOverlay.tsx
'use client';

import { GAME_CANVAS, COLORS } from '@/engine/game/game-config';

// =============================================================================
// TYPES
// =============================================================================

export interface Arrow {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  style: 'solid' | 'dotted';
  color?: string;
  opacity?: number;
  label?: string;
}

interface ArrowOverlayProps {
  arrows: Arrow[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_ARROW_COLOR = '#F59E0B'; // Amber
const ARROW_STROKE_WIDTH = 2;
const MARKER_WIDTH = 10;
const MARKER_HEIGHT = 7;
const DOTTED_PATTERN = '5,5';

// =============================================================================
// COMPONENT
// =============================================================================

export function ArrowOverlay({ arrows }: ArrowOverlayProps): React.ReactElement {
  if (arrows.length === 0) {
    return <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
  }

  return (
    <svg
      className="arrow-overlay"
      width={GAME_CANVAS.width}
      height={GAME_CANVAS.height}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth={MARKER_WIDTH}
          markerHeight={MARKER_HEIGHT}
          refX={MARKER_WIDTH - 1}
          refY={MARKER_HEIGHT / 2}
          orient="auto"
        >
          <polygon
            points={`0 0, ${MARKER_WIDTH} ${MARKER_HEIGHT / 2}, 0 ${MARKER_HEIGHT}`}
            fill={DEFAULT_ARROW_COLOR}
          />
        </marker>
        {/* Dynamic markers for custom colors */}
        {arrows
          .filter((arrow) => arrow.color && arrow.color !== DEFAULT_ARROW_COLOR)
          .map((arrow) => (
            <marker
              key={`marker-${arrow.id}`}
              id={`arrowhead-${arrow.id}`}
              markerWidth={MARKER_WIDTH}
              markerHeight={MARKER_HEIGHT}
              refX={MARKER_WIDTH - 1}
              refY={MARKER_HEIGHT / 2}
              orient="auto"
            >
              <polygon
                points={`0 0, ${MARKER_WIDTH} ${MARKER_HEIGHT / 2}, 0 ${MARKER_HEIGHT}`}
                fill={arrow.color}
              />
            </marker>
          ))}
      </defs>

      {/* Arrow paths */}
      {arrows.map((arrow) => {
        const color = arrow.color ?? DEFAULT_ARROW_COLOR;
        const markerId =
          color === DEFAULT_ARROW_COLOR ? 'arrowhead' : `arrowhead-${arrow.id}`;

        return (
          <g key={arrow.id}>
            <path
              d={`M ${arrow.fromX} ${arrow.fromY} L ${arrow.toX} ${arrow.toY}`}
              stroke={color}
              strokeWidth={ARROW_STROKE_WIDTH}
              strokeDasharray={arrow.style === 'dotted' ? DOTTED_PATTERN : 'none'}
              fill="none"
              opacity={arrow.opacity ?? 1}
              markerEnd={`url(#${markerId})`}
            />
            {/* Optional label at midpoint */}
            {arrow.label && (
              <text
                x={(arrow.fromX + arrow.toX) / 2}
                y={(arrow.fromY + arrow.toY) / 2 - 8}
                fill={COLORS.textPrimary}
                fontSize={10}
                fontWeight={600}
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {arrow.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
