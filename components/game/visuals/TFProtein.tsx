'use client';

interface TFProteinProps {
  x: number;
  y: number;
  isActive?: boolean;
  hasVIIa?: boolean;  // Whether FVII has been docked to form TF+VIIa complex
}

/**
 * Tissue Factor (TF) protein embedded in membrane - TEXTBOOK STYLE
 *
 * Visual reference: Green oval/blob shape embedded in the membrane
 * Much larger and more prominent than before
 */
export function TFProtein({
  x,
  y,
  isActive = true,
  hasVIIa = false,
}: TFProteinProps): React.ReactElement {
  // UPRIGHT orientation - taller than wide, like a receptor
  const width = 50;
  const height = 80;
  const color = isActive ? '#22C55E' : '#9CA3AF';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - height, // Extend UPWARD from anchor point
      }}
      className="tf-protein"
    >
      <defs>
        {/* 3D gradient for receptor */}
        <linearGradient id={`tf-gradient-${x}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isActive ? '#86EFAC' : '#D1D5DB'} />
          <stop offset="50%" stopColor={isActive ? '#22C55E' : '#9CA3AF'} />
          <stop offset="100%" stopColor={isActive ? '#16A34A' : '#6B7280'} />
        </linearGradient>
        {/* Glow effect */}
        <filter id={`tf-glow-${x}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Shadow */}
        <filter id={`tf-shadow-${x}`}>
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Glow behind when active */}
      {isActive && (
        <rect
          x={4}
          y={4}
          width={width - 8}
          height={height - 8}
          rx={8}
          fill="none"
          stroke="#4ADE80"
          strokeWidth={4}
          opacity={0.3}
          filter={`url(#tf-glow-${x})`}
        />
      )}

      {/* Main receptor body - rounded rectangle standing upright */}
      <rect
        x={6}
        y={6}
        width={width - 12}
        height={height - 12}
        rx={10}
        fill={`url(#tf-gradient-${x})`}
        stroke={isActive ? '#15803D' : '#6B7280'}
        strokeWidth={2}
        filter={`url(#tf-shadow-${x})`}
      />

      {/* TF Label at top */}
      <text
        x={width / 2}
        y={28}
        textAnchor="middle"
        fontSize={14}
        fontWeight={800}
        fill="#FFFFFF"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
      >
        TF
      </text>

      {/* Docking slot indicator when empty */}
      {!hasVIIa && (
        <>
          <rect
            x={10}
            y={38}
            width={width - 20}
            height={20}
            rx={4}
            fill="rgba(255,255,255,0.2)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1}
            strokeDasharray="3,2"
          />
          <text
            x={width / 2}
            y={52}
            textAnchor="middle"
            fontSize={8}
            fill="rgba(255,255,255,0.8)"
          >
            FVII
          </text>
        </>
      )}

      {/* Membrane anchor at bottom */}
      <ellipse
        cx={width / 2}
        cy={height - 6}
        rx={12}
        ry={4}
        fill={isActive ? '#16A34A' : '#6B7280'}
        opacity={0.7}
      />
    </svg>
  );
}
