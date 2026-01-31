'use client';

import { SHAPE_DIMENSIONS, COFACTOR_PATH } from './ShapeConfig';

interface CofactorShapeProps {
  color: string;
  label: string;
  style?: React.CSSProperties;
}

/**
 * Cofactor shape: Bean/seat with concave socket on top
 * Represents activated cofactors (Va, VIIIa)
 * The socket fits the enzyme's convex bottom
 */
export function CofactorShape({
  color,
  label,
  style
}: CofactorShapeProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.cofactor;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className="cofactor-shape"
    >
      <defs>
        <linearGradient id={`cofactor-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor={color} stopOpacity={0.85} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        {/* Inner shadow for socket depth */}
        <filter id={`cofactor-socket-${label}`}>
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite operator="out" in="SourceGraphic" />
        </filter>
        <filter id={`cofactor-shadow-${label}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Socket shadow (depth cue) */}
      <ellipse
        cx={40}
        cy={12}
        rx={18}
        ry={6}
        fill="rgba(0,0,0,0.15)"
      />

      {/* Main bean shape */}
      <path
        d={COFACTOR_PATH}
        fill={`url(#cofactor-gradient-${label})`}
        stroke={color}
        strokeWidth={2}
        filter={`url(#cofactor-shadow-${label})`}
      />

      {/* Socket highlight rim */}
      <ellipse
        cx={40}
        cy={10}
        rx={16}
        ry={4}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 6}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>
    </svg>
  );
}
