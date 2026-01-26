'use client';

interface EnzymeTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  isGlowing?: boolean;
  style?: React.CSSProperties;
}

/**
 * EnzymeToken - Medical textbook style
 * Represents active serine proteases (FIXa, FXa, FIIa, etc.)
 * Simple circle with "a" suffix to indicate activated state
 */
export function EnzymeToken({
  color,
  label,
  width = 45,
  height = 40,
  style,
}: EnzymeTokenProps): React.ReactElement {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 4;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      role="img"
      aria-label={`${label} - active enzyme`}
    >
      {/* Simple circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Active state indicator - small notch */}
      <circle
        cx={cx + r - 2}
        cy={cy}
        r={4}
        fill="#FFFFFF"
      />

      {/* Label */}
      <text
        x={cx - 2}
        y={cy + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
    </svg>
  );
}
