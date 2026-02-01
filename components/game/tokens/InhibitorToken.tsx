'use client';

interface InhibitorTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * InhibitorToken - Visual token for anticoagulant inhibitors
 * Shield-shaped design with inhibition symbol (⊣)
 * Used for TFPI, Antithrombin, aPC, Plasmin
 */
export function InhibitorToken({
  color,
  label,
  width = 50,
  height = 45,
  style,
}: InhibitorTokenProps): React.ReactElement {
  const cx = width / 2;
  const cy = height / 2;

  // Shield shape parameters
  const shieldWidth = width - 8;
  const shieldHeight = height - 8;
  const topY = 4;
  const bottomY = topY + shieldHeight;
  const midY = topY + shieldHeight * 0.6;

  // Shield path: rounded top, pointed bottom
  const shieldPath = `
    M ${cx - shieldWidth / 2} ${topY + 6}
    Q ${cx - shieldWidth / 2} ${topY} ${cx - shieldWidth / 2 + 6} ${topY}
    L ${cx + shieldWidth / 2 - 6} ${topY}
    Q ${cx + shieldWidth / 2} ${topY} ${cx + shieldWidth / 2} ${topY + 6}
    L ${cx + shieldWidth / 2} ${midY}
    Q ${cx + shieldWidth / 2} ${bottomY - 4} ${cx} ${bottomY}
    Q ${cx - shieldWidth / 2} ${bottomY - 4} ${cx - shieldWidth / 2} ${midY}
    Z
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      role="img"
      aria-label={`${label} - inhibitor`}
    >
      {/* Shield body */}
      <path
        d={shieldPath}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Inhibition symbol (⊣) - horizontal line with perpendicular end */}
      <g stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round">
        {/* Horizontal bar */}
        <line x1={cx - 6} y1={cy - 4} x2={cx + 6} y2={cy - 4} />
        {/* Perpendicular end (T-bar) */}
        <line x1={cx + 6} y1={cy - 8} x2={cx + 6} y2={cy} />
      </g>

      {/* Label */}
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fontSize={label.length > 6 ? 7 : 8}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
    </svg>
  );
}
