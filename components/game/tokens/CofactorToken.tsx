'use client';

interface CofactorTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export function CofactorToken({
  color,
  label,
  width = 55,
  height = 30,
  style,
}: CofactorTokenProps): React.ReactElement {
  const id = `cofactor-${label}`;
  const socketDepth = 8;
  const socketHeight = 16;
  const cornerRadius = 6;
  const socketY = (height - socketHeight) / 2;

  const cofactorPath = `
    M ${cornerRadius} 0
    H ${width - cornerRadius}
    Q ${width} 0 ${width} ${cornerRadius}
    V ${height - cornerRadius}
    Q ${width} ${height} ${width - cornerRadius} ${height}
    H ${cornerRadius}
    Q 0 ${height} 0 ${height - cornerRadius}
    V ${socketY + socketHeight}
    Q ${socketDepth} ${socketY + socketHeight} ${socketDepth} ${socketY + socketHeight / 2}
    Q ${socketDepth} ${socketY} 0 ${socketY}
    V ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    Z
  `;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style} className="cofactor-token">
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="50%" stopColor={color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
        <filter id={`${id}-shadow`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
      </defs>
      <path d={cofactorPath} fill={`url(#${id}-gradient)`} stroke={color} strokeWidth={2} filter={`url(#${id}-shadow)`} />
      <text x={width / 2 + 2} y={height / 2 + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{label}</text>
    </svg>
  );
}
