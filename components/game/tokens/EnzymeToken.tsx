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
 * EnzymeToken - Medical textbook style with active site cleft
 * Represents active serine proteases (FIXa, FXa, FIIa, FVIIa, FXIa, etc.)
 * Circle with slot at top = active site pocket where substrates bind
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

  // Active site slot parameters
  const slotHalfWidth = r * 0.18;   // Half-width of slot
  const slotDepth = r * 0.45;       // How deep into circle
  const bottomRadius = slotHalfWidth * 0.9; // Rounded bottom

  // Slot edges on circle perimeter
  const slotLeftX = cx - slotHalfWidth;
  const slotRightX = cx + slotHalfWidth;
  const slotTopY = cy - r;

  // Bottom of slot (where the semicircle is)
  const slotBottomY = slotTopY + slotDepth;

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

      {/* Active site slot - rectangular with rounded bottom */}
      <path
        d={`
          M ${slotLeftX} ${slotTopY - 1}
          L ${slotLeftX} ${slotBottomY - bottomRadius}
          A ${bottomRadius} ${bottomRadius} 0 0 0 ${slotRightX} ${slotBottomY - bottomRadius}
          L ${slotRightX} ${slotTopY - 1}
          Z
        `}
        fill="#E2E8F0"
      />

      {/* Slot border */}
      <path
        d={`
          M ${slotLeftX} ${slotTopY}
          L ${slotLeftX} ${slotBottomY - bottomRadius}
          A ${bottomRadius} ${bottomRadius} 0 0 0 ${slotRightX} ${slotBottomY - bottomRadius}
          L ${slotRightX} ${slotTopY}
        `}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Label */}
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontSize={label.length > 5 ? 9 : 10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
    </svg>
  );
}
