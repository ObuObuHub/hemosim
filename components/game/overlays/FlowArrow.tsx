// components/game/overlays/FlowArrow.tsx
'use client';

import { useMemo } from 'react';

interface FlowArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  label?: string;
  progress?: number;
  isActive?: boolean;
  thickness?: number;
  showTravelingParticle?: boolean;
  particleSize?: number;
  travelDuration?: string;
  particleKey?: string | number;
}

/**
 * FlowArrow - Medical textbook style
 * Simple arrow showing factor flow between panels
 */
export function FlowArrow({
  fromX,
  fromY,
  toX,
  toY,
  color,
  label,
  progress = 1,
  isActive = true,
  thickness = 2,
  showTravelingParticle = true,
  particleSize = 6,
  travelDuration = '1.2s',
  particleKey,
}: FlowArrowProps): React.ReactElement {
  const path = useMemo(() => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(distance * 0.2, 30);
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const cpX = midX + perpX * curvature;
    const cpY = midY + perpY * curvature;
    return `M ${fromX} ${fromY} Q ${cpX} ${cpY} ${toX} ${toY}`;
  }, [fromX, fromY, toX, toY]);

  const arrowhead = useMemo(() => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { x: toX, y: toY, rotation: angle };
  }, [fromX, fromY, toX, toY]);

  const pathId = useMemo(
    () => `flow-path-${Math.round(fromX)}-${Math.round(fromY)}-${Math.round(toX)}-${Math.round(toY)}`,
    [fromX, fromY, toX, toY]
  );

  if (!isActive) return <></>;

  return (
    <g className="flow-arrow">
      {/* Simple dashed path */}
      <path
        id={pathId}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray="6 4"
        opacity={0.6}
      />

      {/* Simple traveling particle */}
      {showTravelingParticle && (
        <g key={particleKey ?? pathId}>
          <circle r={particleSize} fill={color}>
            <animateMotion
              dur={travelDuration}
              repeatCount="1"
              fill="freeze"
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
            >
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </g>
      )}

      {/* Simple arrowhead */}
      <polygon
        points="-6,-4 0,0 -6,4"
        fill={color}
        transform={`translate(${arrowhead.x}, ${arrowhead.y}) rotate(${arrowhead.rotation})`}
        opacity={progress}
      />

      {/* Label */}
      {label && (
        <text
          x={(fromX + toX) / 2}
          y={(fromY + toY) / 2 - 8}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill={color}
        >
          {label}
        </text>
      )}
    </g>
  );
}

interface FlowArrowOverlayProps {
  width: number;
  height: number;
  arrows: Array<{
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    color: string;
    label?: string;
    progress?: number;
    isActive?: boolean;
    showTravelingParticle?: boolean;
    particleSize?: number;
    travelDuration?: string;
    particleKey?: string | number;
  }>;
}

/**
 * SVG overlay for rendering multiple flow arrows
 */
export function FlowArrowOverlay({
  width,
  height,
  arrows,
}: FlowArrowOverlayProps): React.ReactElement {
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {arrows.map((arrow) => (
        <FlowArrow
          key={arrow.id}
          fromX={arrow.fromX}
          fromY={arrow.fromY}
          toX={arrow.toX}
          toY={arrow.toY}
          color={arrow.color}
          label={arrow.label}
          progress={arrow.progress}
          isActive={arrow.isActive}
          showTravelingParticle={arrow.showTravelingParticle}
          particleSize={arrow.particleSize}
          travelDuration={arrow.travelDuration}
          particleKey={arrow.particleKey}
        />
      ))}
    </svg>
  );
}
