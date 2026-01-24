'use client';

interface TFProteinProps {
  x: number;
  y: number;
  isActive?: boolean;
  hasVIIa?: boolean;
}

/**
 * Tissue Factor (TF) - Green blob like reference image
 * Organic kidney-bean shape that fVIIa sits on top of
 */
export function TFProtein({
  x,
  y,
  isActive = true,
}: TFProteinProps): React.ReactElement {
  const width = 50;
  const height = 70;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - height,
      }}
    >
      <defs>
        <linearGradient id={`tf-grad-${x}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="40%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <filter id={`tf-shadow-${x}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* TF blob - organic bean shape like reference */}
      <ellipse
        cx={25}
        cy={40}
        rx={22}
        ry={28}
        fill={`url(#tf-grad-${x})`}
        stroke="#15803D"
        strokeWidth={2}
        filter={`url(#tf-shadow-${x})`}
      />

      {/* TF Label */}
      <text
        x={25}
        y={45}
        textAnchor="middle"
        fontSize={14}
        fontWeight={800}
        fill="#FFFFFF"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
      >
        TF
      </text>
    </svg>
  );
}
