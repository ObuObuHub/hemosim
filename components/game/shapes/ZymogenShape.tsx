'use client';

import { SHAPE_DIMENSIONS, ZYMOGEN_PATH } from './ShapeConfig';

interface ZymogenShapeProps {
  color: string;
  label: string;
  style?: React.CSSProperties;
}

/**
 * Zymogen shape: Smooth rounded blob without active site
 * Represents inactive enzyme precursors (FIX, FX, FII, etc.)
 */
export function ZymogenShape({ color, label, style }: ZymogenShapeProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.zymogen;

  // Desaturate color slightly for inactive appearance
  const inactiveColor = color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className="zymogen-shape"
    >
      <defs>
        <linearGradient id={`zymogen-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={inactiveColor} stopOpacity={0.7} />
          <stop offset="50%" stopColor={inactiveColor} stopOpacity={0.5} />
          <stop offset="100%" stopColor={inactiveColor} stopOpacity={0.7} />
        </linearGradient>
        <filter id={`zymogen-shadow-${label}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Main blob shape */}
      <path
        d={ZYMOGEN_PATH}
        fill={`url(#zymogen-gradient-${label})`}
        stroke={inactiveColor}
        strokeWidth={2}
        filter={`url(#zymogen-shadow-${label})`}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>
    </svg>
  );
}
