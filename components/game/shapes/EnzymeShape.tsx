'use client';

import { SHAPE_DIMENSIONS, ENZYME_PATH } from './ShapeConfig';

interface EnzymeShapeProps {
  color: string;
  label: string;
  isWobbling?: boolean;
  style?: React.CSSProperties;
}

/**
 * Enzyme shape: Pac-Man with active site cleft (wedge mouth)
 * Represents activated serine proteases (IXa, Xa, Thrombin, etc.)
 * Has convex bottom that fits into cofactor socket
 */
export function EnzymeShape({
  color,
  label,
  isWobbling = true,
  style
}: EnzymeShapeProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.enzyme;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className={isWobbling ? 'enzyme-shape enzyme-wobble' : 'enzyme-shape'}
    >
      <defs>
        <linearGradient id={`enzyme-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor={color} stopOpacity={0.85} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <filter id={`enzyme-glow-${label}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`enzyme-shadow-${label}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Active site highlight (the "mouth" interior) */}
      <path
        d="M 45 25 L 30 35 L 45 25"
        fill="rgba(0,0,0,0.2)"
        stroke="none"
      />

      {/* Main Pac-Man shape */}
      <path
        d={ENZYME_PATH}
        fill={`url(#enzyme-gradient-${label})`}
        stroke={color}
        strokeWidth={2}
        filter={`url(#enzyme-shadow-${label})`}
      />

      {/* Active site edge highlight */}
      <path
        d="M 45 25 L 30 35"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
      />

      {/* Label */}
      <text
        x={25}
        y={height / 2 + 4}
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
