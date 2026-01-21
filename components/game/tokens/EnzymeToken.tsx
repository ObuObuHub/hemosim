'use client';

interface EnzymeTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  isGlowing?: boolean;
  style?: React.CSSProperties;
}

export function EnzymeToken({
  color,
  label,
  width = 45,
  height = 40,
  isGlowing = false,
  style,
}: EnzymeTokenProps): React.ReactElement {
  const id = `enzyme-${label}`;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 3;
  const biteAngle = 35;
  const startAngle = biteAngle * (Math.PI / 180);
  const endAngle = -biteAngle * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);

  const pacmanPath = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 1 0 ${x2} ${y2} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style} className={`enzyme-token ${isGlowing ? 'enzyme-glowing' : ''}`}>
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
          <stop offset="50%" stopColor={color} stopOpacity={0.8} />
          <stop offset="100%" stopColor={color} stopOpacity={0.95} />
        </linearGradient>
        <filter id={`${id}-shadow`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
        {isGlowing && <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>}
      </defs>
      <path d={pacmanPath} fill={`url(#${id}-gradient)`} stroke={color} strokeWidth={2} filter={isGlowing ? `url(#${id}-glow)` : `url(#${id}-shadow)`} />
      <text x={cx - 4} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{label}</text>
    </svg>
  );
}
