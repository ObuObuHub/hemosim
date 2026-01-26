'use client';

import type { PARCleavageState } from '@/hooks/useThreePanelState';

interface PARReceptorProps {
  x: number;
  y: number;
  state: PARCleavageState;
  onClick?: () => void;
  isClickable?: boolean;
  scale?: number;
}

/**
 * PAR1 (Protease-Activated Receptor 1) - Simplified squiggly visualization
 *
 * States:
 * - intact: Full squiggly line
 * - thrombin-bound: Thrombin (IIa) attached at 1/3, clickable
 * - cleaved: Line broken at 1/3, top piece floating away
 * - activated: Bottom 2/3 glowing green
 */
export function PARReceptor({
  x,
  y,
  state,
  onClick,
  isClickable = false,
  scale = 1,
}: PARReceptorProps): React.ReactElement {
  const height = 50 * scale;
  const width = 20 * scale;
  const strokeWidth = 3 * scale;
  const breakY = height / 3; // 1/3 from top

  const isInteractive = isClickable && state === 'thrombin-bound';

  // Colors based on state
  const getColor = (): string => {
    switch (state) {
      case 'intact':
        return '#6B7280';
      case 'thrombin-bound':
        return '#A855F7';
      case 'cleaved':
        return '#F59E0B';
      case 'activated':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  };

  const color = getColor();

  // Squiggly path - serpentine shape
  // Full path from top to bottom
  const fullPath = `M ${width / 2} 0
    C ${width} 5, 0 10, ${width / 2} ${height * 0.2}
    C ${width} ${height * 0.3}, 0 ${height * 0.4}, ${width / 2} ${height * 0.5}
    C ${width} ${height * 0.6}, 0 ${height * 0.7}, ${width / 2} ${height * 0.8}
    C ${width} ${height * 0.9}, ${width * 0.3} ${height}, ${width / 2} ${height}`;

  // Top 1/3 path (for cleaved piece)
  const topPath = `M ${width / 2} 0
    C ${width} 5, 0 10, ${width / 2} ${breakY}`;

  // Bottom 2/3 path (after cleavage)
  const bottomPath = `M ${width / 2} ${breakY + 4}
    C ${width} ${height * 0.4}, 0 ${height * 0.5}, ${width / 2} ${height * 0.6}
    C ${width} ${height * 0.7}, 0 ${height * 0.8}, ${width / 2} ${height * 0.9}
    C ${width} ${height * 0.95}, ${width * 0.3} ${height}, ${width / 2} ${height}`;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, 0)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 4 * scale,
        cursor: isInteractive ? 'pointer' : 'default',
        zIndex: 12,
      }}
      onClick={isInteractive ? onClick : undefined}
    >
      {/* Squiggly receptor SVG */}
      <svg
        width={width + 10 * scale}
        height={height + 5}
        style={{ overflow: 'visible' }}
      >
        {/* INTACT or THROMBIN-BOUND: Full squiggly line */}
        {(state === 'intact' || state === 'thrombin-bound') && (
          <path
            d={fullPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              filter: state === 'thrombin-bound' ? `drop-shadow(0 0 4px ${color})` : 'none',
            }}
          />
        )}

        {/* CLEAVED: Broken squiggly - top 1/3 floating away */}
        {state === 'cleaved' && (
          <>
            {/* Top piece - floating away */}
            <g style={{ animation: 'parPieceFloat 1.5s ease-out forwards' }}>
              <path
                d={topPath}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={0.6}
              />
            </g>
            {/* Bottom piece - stays */}
            <path
              d={bottomPath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </>
        )}

        {/* ACTIVATED: Bottom 2/3 glowing */}
        {state === 'activated' && (
          <path
            d={bottomPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}40)`,
            }}
          />
        )}

        {/* Thrombin molecule when bound */}
        {state === 'thrombin-bound' && (
          <g>
            <circle
              cx={width / 2 - 10 * scale}
              cy={breakY}
              r={8 * scale}
              fill="url(#thrombin-gradient)"
              stroke="#FFF"
              strokeWidth={1.5 * scale}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(220, 38, 38, 0.5))' }}
            />
            <text
              x={width / 2 - 10 * scale}
              y={breakY + 3 * scale}
              textAnchor="middle"
              fontSize={7 * scale}
              fontWeight={700}
              fill="#FFF"
            >
              IIa
            </text>
          </g>
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="thrombin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
      </svg>

      {/* PAR label */}
      <div
        style={{
          fontSize: 9 * scale,
          fontWeight: 600,
          color: color,
          marginTop: height / 2 - 5 * scale,
        }}
      >
        PAR
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes parPieceFloat {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.6;
          }
          100% {
            transform: translate(-15px, -20px) rotate(-30deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
