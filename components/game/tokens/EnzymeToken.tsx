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
 * Enzyme shape: Simple circle/oval (like reference image)
 * Same basic shape as zymogen but with glow effect when active
 * TEXTBOOK: Activated enzymes depicted as simple circles
 */
export function EnzymeToken({
  color,
  label,
  width = 45,
  height = 40,
  isGlowing = false,
  style,
}: EnzymeTokenProps): React.ReactElement {
  const id = `enzyme-${label}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      className={`enzyme-token ${isGlowing ? 'enzyme-glowing' : ''}`}
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="50%" stopColor={color} stopOpacity={0.85} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
        <filter id={`${id}-glow`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Simple circle/oval shape like reference */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - 2}
        ry={height / 2 - 2}
        fill={`url(#${id}-gradient)`}
        stroke={color}
        strokeWidth={2}
        filter={isGlowing ? `url(#${id}-glow)` : `url(#${id}-shadow)`}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>
    </svg>
  );
}
