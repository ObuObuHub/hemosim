'use client';

interface CofactorTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * CofactorToken - Medical textbook style
 * Represents non-enzymatic cofactors (FVa, FVIIIa)
 * Simple rectangle to distinguish from enzyme circles
 */
export function CofactorToken({
  color,
  label,
  width = 55,
  height = 30,
  style,
}: CofactorTokenProps): React.ReactElement {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      role="img"
      aria-label={`${label} - cofactor`}
    >
      {/* Simple rounded rectangle */}
      <rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={4}
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
