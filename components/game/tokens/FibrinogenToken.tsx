'use client';

interface FibrinogenTokenProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export function FibrinogenToken({ width = 60, height = 25, style }: FibrinogenTokenProps): React.ReactElement {
  const id = 'fibrinogen';
  const color = '#EAB308';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style} className="fibrinogen-token">
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="50%" stopColor={color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
        <filter id={`${id}-shadow`}><feDropShadow dx="1" dy="2" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 2} ry={height / 2 - 2} fill={`url(#${id}-gradient)`} stroke={color} strokeWidth={1.5} filter={`url(#${id}-shadow)`} />
      <text x={width / 2} y={height / 2 + 3} textAnchor="middle" fontSize={8} fontWeight={600} fill="#FFFFFF" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>Fbg</text>
    </svg>
  );
}

interface FibrinStrandTokenProps {
  length?: number;
  stickyEnds?: boolean;
  style?: React.CSSProperties;
}

export function FibrinStrandToken({ length = 50, stickyEnds = true, style }: FibrinStrandTokenProps): React.ReactElement {
  const height = 8;
  const color = '#22C55E';
  const endRadius = stickyEnds ? 5 : 3;
  return (
    <svg width={length} height={height + endRadius * 2} viewBox={`0 0 ${length} ${height + endRadius * 2}`} style={style} className="fibrin-strand-token">
      <rect x={endRadius} y={endRadius} width={length - endRadius * 2} height={height} rx={2} fill={color} opacity={0.9} />
      {stickyEnds && (
        <>
          <circle cx={endRadius} cy={endRadius + height / 2} r={endRadius} fill={color} className="fibrin-sticky-end" />
          <circle cx={length - endRadius} cy={endRadius + height / 2} r={endRadius} fill={color} className="fibrin-sticky-end" />
        </>
      )}
    </svg>
  );
}
