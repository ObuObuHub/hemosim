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
 * EnzymeToken - Medical textbook style with subtle pac-man shape
 * Represents active serine proteases (FIXa, FXa, FIIa, FVIIa, FXIa, etc.)
 * Circle with small notch in top-right corner = active site that cleaves substrates
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

  // Notch position: top-right corner (like pac-man looking up-right)
  const notchAngle = -45 * (Math.PI / 180); // -45 degrees (top-right)
  const notchX = cx + (r - 1) * Math.cos(notchAngle);
  const notchY = cy + (r - 1) * Math.sin(notchAngle);
  const notchR = r * 0.28; // Notch size relative to main circle

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      role="img"
      aria-label={`${label} - active enzyme`}
    >
      {/* Main circle body */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Subtle notch in top-right - represents enzyme active site */}
      <circle
        cx={notchX}
        cy={notchY}
        r={notchR}
        fill="#F8FAFC"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />

      {/* Label */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={label.length > 4 ? 9 : 10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
    </svg>
  );
}
