// components/game/tokens/GlaDomain.tsx
'use client';

interface GlaDomainProps {
  width?: number;
  height?: number;
  color?: string;
  style?: React.CSSProperties;
  showCalcium?: boolean;
  isBound?: boolean;
  animationDelay?: number;
}

/**
 * GlaDomain - Vitamin K-dependent membrane anchor
 * Wavy line with "Gla" label
 */
export function GlaDomain({
  width = 20,
  height = 28,
  color = '#1F2937',
  style,
  isBound = false,
}: GlaDomainProps): React.ReactElement {
  const cx = width / 2;

  // Smooth sine wave Gla domain path
  const amplitude = 3;
  const path = `
    M ${cx} 0
    Q ${cx + amplitude} ${height * 0.25}, ${cx} ${height * 0.5}
    Q ${cx - amplitude} ${height * 0.75}, ${cx} ${height}
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ marginTop: -2, overflow: 'visible', ...style }}
      role="img"
      aria-label="Gla domain"
    >
      {/* Wavy Gla domain backbone */}
      <path
        d={path}
        stroke={isBound ? '#3B82F6' : color}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Gla label - upper right */}
      <text
        x={cx + 6}
        y={height * 0.25}
        fontSize={7}
        fontWeight={600}
        fill="#1E293B"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        Gla
      </text>
      {/* Ca²⁺ label - bottom left */}
      <text
        x={cx - 14}
        y={height * 0.8}
        fontSize={6}
        fontWeight={600}
        fill="#64748B"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        Ca²⁺
      </text>
    </svg>
  );
}
