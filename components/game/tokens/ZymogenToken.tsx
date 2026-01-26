'use client';

interface ZymogenTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Zymogen token - Medical textbook style
 * Represents inactive enzyme precursors (FIX, FX, FII, etc.)
 * Simple oval with clear label
 */
export function ZymogenToken({
  color,
  label,
  width = 50,
  height = 35,
  style,
}: ZymogenTokenProps): React.ReactElement {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      role="img"
      aria-label={`${label} - zymogen`}
    >
      {/* Simple oval shape */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - 3}
        ry={height / 2 - 3}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
    </svg>
  );
}
