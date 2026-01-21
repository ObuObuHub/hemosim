'use client';

import { SHAPE_DIMENSIONS, MERGED_COMPLEX_PATH } from './ShapeConfig';

interface MergedComplexProps {
  complexType: 'tenase' | 'prothrombinase';
  enzymeColor: string;
  cofactorColor: string;
  style?: React.CSSProperties;
}

/**
 * Merged Complex: Enzyme seated in cofactor as single unified shape
 * Shows the complete functional complex with active site facing outward
 * Has breathing animation to show it's active
 */
export function MergedComplex({
  complexType,
  enzymeColor,
  cofactorColor,
  style
}: MergedComplexProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.mergedComplex;
  const label = complexType === 'tenase' ? 'Tenase' : 'PTase';

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className="merged-complex complex-breathing"
    >
      <defs>
        {/* Two-tone gradient: enzyme on top, cofactor on bottom */}
        <linearGradient id={`complex-gradient-${complexType}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={enzymeColor} />
          <stop offset="45%" stopColor={enzymeColor} />
          <stop offset="55%" stopColor={cofactorColor} />
          <stop offset="100%" stopColor={cofactorColor} />
        </linearGradient>

        {/* Glow effect for active complex */}
        <filter id={`complex-glow-${complexType}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`complex-shadow-${complexType}`}>
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer glow */}
      <path
        d={MERGED_COMPLEX_PATH}
        fill="none"
        stroke={enzymeColor}
        strokeWidth={6}
        opacity={0.3}
        filter={`url(#complex-glow-${complexType})`}
      />

      {/* Main unified shape */}
      <path
        d={MERGED_COMPLEX_PATH}
        fill={`url(#complex-gradient-${complexType})`}
        stroke="#FFFFFF"
        strokeWidth={2}
        filter={`url(#complex-shadow-${complexType})`}
      />

      {/* Active site cleft highlight */}
      <path
        d="M 55 22 L 40 30"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1}
      />

      {/* Active site interior shadow */}
      <path
        d="M 55 22 L 40 30 L 55 22"
        fill="rgba(0,0,0,0.2)"
      />

      {/* Seam line between enzyme and cofactor */}
      <path
        d="M 30 42 C 35 44, 45 44, 50 42"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
        strokeDasharray="3 2"
      />

      {/* Complex label */}
      <text
        x={width / 2}
        y={height / 2 + 5}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
      >
        {label}
      </text>
    </svg>
  );
}
