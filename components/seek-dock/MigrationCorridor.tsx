/**
 * MigrationCorridor - Visualizes the zone crossing area
 *
 * Shows the guided path/arrow corridor for IXa and IIa migration
 * from Zone A (TF Cell) to Zone B (Platelet).
 */
'use client';

import { Agent } from '@/types/seek-dock';

interface MigrationCorridorProps {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  activeMigrators: Agent[];
}

export function MigrationCorridor({
  bounds,
  activeMigrators,
}: MigrationCorridorProps): React.ReactElement {
  const { minX, maxX, minY, maxY } = bounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;

  // Check if any IXa or IIa is migrating
  const hasIXaMigrating = activeMigrators.some(a => a.kind === 'IXa');
  const hasIIaMigrating = activeMigrators.some(a => a.kind === 'IIa');
  const hasAnyMigrating = activeMigrators.length > 0;

  return (
    <g>
      {/* Corridor background */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="rgba(15, 23, 42, 0.8)"
        stroke="rgba(100, 116, 139, 0.2)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {/* Label */}
      <text
        x={centerX}
        y={minY + 20}
        textAnchor="middle"
        fill="#64748B"
        fontSize={9}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
        letterSpacing={0.5}
      >
        MIGRARE
      </text>

      {/* IXa lane indicator */}
      <g transform={`translate(${centerX - 15}, ${minY + 40})`}>
        <rect
          x={-20}
          y={0}
          width={40}
          height={height - 80}
          rx={4}
          fill={hasIXaMigrating ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.1)'}
          stroke={hasIXaMigrating ? 'rgba(34, 197, 94, 0.4)' : 'rgba(100, 116, 139, 0.2)'}
          strokeWidth={1}
        />

        {/* Directional arrows */}
        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
          <g
            key={i}
            transform={`translate(0, ${(height - 80) * ratio})`}
            style={{
              opacity: hasIXaMigrating ? 0.8 : 0.3,
              animation: hasIXaMigrating ? `slideDown 1.5s ease-in-out infinite ${i * 0.2}s` : 'none',
            }}
          >
            <path
              d="M -8 -4 L 0 4 L 8 -4"
              fill="none"
              stroke={hasIXaMigrating ? '#22C55E' : '#64748B'}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}

        {/* Lane label */}
        <text
          x={0}
          y={height - 70}
          textAnchor="middle"
          fill={hasIXaMigrating ? '#4ADE80' : '#64748B'}
          fontSize={8}
          fontWeight={600}
        >
          IXa
        </text>
      </g>

      {/* IIa lane indicator */}
      <g transform={`translate(${centerX + 15}, ${minY + 40})`}>
        <rect
          x={-20}
          y={0}
          width={40}
          height={height - 80}
          rx={4}
          fill={hasIIaMigrating ? 'rgba(251, 146, 60, 0.15)' : 'rgba(100, 116, 139, 0.1)'}
          stroke={hasIIaMigrating ? 'rgba(251, 146, 60, 0.4)' : 'rgba(100, 116, 139, 0.2)'}
          strokeWidth={1}
        />

        {/* Directional arrows */}
        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
          <g
            key={i}
            transform={`translate(0, ${(height - 80) * ratio})`}
            style={{
              opacity: hasIIaMigrating ? 0.8 : 0.3,
              animation: hasIIaMigrating ? `slideDown 1.2s ease-in-out infinite ${i * 0.15}s` : 'none',
            }}
          >
            <path
              d="M -8 -4 L 0 4 L 8 -4"
              fill="none"
              stroke={hasIIaMigrating ? '#FB923C' : '#64748B'}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}

        {/* Lane label */}
        <text
          x={0}
          y={height - 70}
          textAnchor="middle"
          fill={hasIIaMigrating ? '#FDBA74' : '#64748B'}
          fontSize={8}
          fontWeight={600}
        >
          IIa
        </text>
      </g>

      {/* Active migration indicator */}
      {hasAnyMigrating && (
        <g transform={`translate(${centerX}, ${minY + height - 20})`}>
          <rect
            x={-40}
            y={-10}
            width={80}
            height={20}
            rx={10}
            fill="rgba(251, 191, 36, 0.2)"
            stroke="rgba(251, 191, 36, 0.5)"
            strokeWidth={1}
          >
            <animate
              attributeName="opacity"
              values="1;0.7;1"
              dur="1s"
              repeatCount="indefinite"
            />
          </rect>
          <text
            textAnchor="middle"
            dy={4}
            fill="#FCD34D"
            fontSize={9}
            fontWeight={600}
          >
            În tranzit...
          </text>
        </g>
      )}

      {/* Bridge connection lines */}
      <line
        x1={minX}
        y1={minY + height / 2}
        x2={minX + 10}
        y2={minY + height / 2}
        stroke="rgba(100, 116, 139, 0.3)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line
        x1={maxX - 10}
        y1={minY + height / 2}
        x2={maxX}
        y2={minY + height / 2}
        stroke="rgba(100, 116, 139, 0.3)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* CSS Animations */}
      <style>
        {`
          @keyframes slideDown {
            0% {
              opacity: 0;
              transform: translateY(-10px);
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateY(10px);
            }
          }
        `}
      </style>
    </g>
  );
}
