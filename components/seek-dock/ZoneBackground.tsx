/**
 * ZoneBackground - Renders the background for Zone A or Zone B
 *
 * Shows membrane surface, zone label, and activation state.
 */
'use client';

import { Zone } from '@/types/seek-dock';

interface ZoneBackgroundProps {
  zone: Zone;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  label: string;
  sublabel: string;
  isActive: boolean;
}

export function ZoneBackground({
  zone,
  bounds,
  label,
  sublabel,
  isActive,
}: ZoneBackgroundProps): React.ReactElement {
  const { minX, maxX, minY, maxY } = bounds;
  const width = maxX - minX;
  const height = maxY - minY;

  // Zone-specific colors
  const colors = zone === 'ZoneA'
    ? {
        fill: isActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(30, 41, 59, 0.6)',
        stroke: isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(100, 116, 139, 0.3)',
        membrane: isActive ? 'rgba(59, 130, 246, 0.6)' : 'rgba(100, 116, 139, 0.4)',
        labelColor: isActive ? '#60A5FA' : '#64748B',
      }
    : {
        fill: isActive ? 'rgba(168, 85, 247, 0.08)' : 'rgba(30, 41, 59, 0.6)',
        stroke: isActive ? 'rgba(168, 85, 247, 0.4)' : 'rgba(100, 116, 139, 0.3)',
        membrane: isActive ? 'rgba(168, 85, 247, 0.6)' : 'rgba(100, 116, 139, 0.4)',
        labelColor: isActive ? '#A78BFA' : '#64748B',
      };

  // Membrane curve points
  const membraneY = height * 0.85;
  const curveHeight = 20;

  return (
    <g>
      {/* Zone background */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        rx={12}
      />

      {/* Phospholipid membrane (wavy bottom) */}
      <path
        d={`
          M ${minX} ${minY + membraneY}
          Q ${minX + width * 0.25} ${minY + membraneY - curveHeight} ${minX + width * 0.5} ${minY + membraneY}
          Q ${minX + width * 0.75} ${minY + membraneY + curveHeight} ${maxX} ${minY + membraneY}
          L ${maxX} ${maxY}
          L ${minX} ${maxY}
          Z
        `}
        fill={colors.membrane}
        opacity={0.15}
      />

      {/* Membrane lipid heads */}
      {Array.from({ length: Math.floor(width / 30) }).map((_, i) => {
        const x = minX + 15 + i * 30;
        const baseY = minY + membraneY;
        // Calculate y offset based on sine wave
        const yOffset = Math.sin((i / (width / 30)) * Math.PI * 2) * curveHeight * 0.5;

        return (
          <g key={i}>
            {/* Lipid head (circle) */}
            <circle
              cx={x}
              cy={baseY + yOffset}
              r={5}
              fill={colors.membrane}
              opacity={0.4}
            />
            {/* Lipid tail (line) */}
            <line
              x1={x}
              y1={baseY + yOffset + 5}
              x2={x}
              y2={baseY + yOffset + 20}
              stroke={colors.membrane}
              strokeWidth={2}
              opacity={0.3}
            />
          </g>
        );
      })}

      {/* Zone label */}
      <text
        x={minX + 16}
        y={minY + 24}
        fill={colors.labelColor}
        fontSize={14}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        letterSpacing={1}
      >
        {label}
      </text>

      {/* Sublabel */}
      <text
        x={minX + 16}
        y={minY + 40}
        fill={colors.labelColor}
        fontSize={10}
        fontWeight={500}
        fontFamily="system-ui, sans-serif"
        opacity={0.8}
      >
        {sublabel}
      </text>

      {/* Activation indicator */}
      {isActive && (
        <g transform={`translate(${maxX - 24}, ${minY + 24})`}>
          <circle
            r={8}
            fill={zone === 'ZoneA' ? '#3B82F6' : '#8B5CF6'}
            style={{
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <circle
            r={4}
            fill="#FFFFFF"
          />
        </g>
      )}

      {/* Phosphatidylserine indicator (Zone B only) */}
      {zone === 'ZoneB' && isActive && (
        <g transform={`translate(${minX + width / 2}, ${minY + membraneY - 30})`}>
          <rect
            x={-50}
            y={-10}
            width={100}
            height={20}
            rx={4}
            fill="rgba(34, 197, 94, 0.3)"
            stroke="rgba(34, 197, 94, 0.6)"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dy={4}
            fill="#4ADE80"
            fontSize={9}
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
          >
            PS + Ca²⁺
          </text>
        </g>
      )}

      {/* CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
        `}
      </style>
    </g>
  );
}
