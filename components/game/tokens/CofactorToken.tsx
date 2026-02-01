'use client';

interface CofactorTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * CofactorToken - Medical textbook style with "lock and key" design
 * Represents non-enzymatic cofactors (FVa, FVIIIa)
 * Concave indent on right edge shows where enzyme "fits" into cofactor
 */
export function CofactorToken({
  color,
  label,
  width = 55,
  height = 30,
  style,
}: CofactorTokenProps): React.ReactElement {
  const cornerRadius = 4;
  const indentRadius = 10; // Radius of the concave "socket"
  const centerY = height / 2;
  const rightX = width - 2;
  const arcTopY = centerY - indentRadius;
  const arcBottomY = centerY + indentRadius;
  const arcDepth = indentRadius * 0.6; // How deep the concave curves in

  // SVG path: rectangle with concave right edge (lock and key design)
  const path = `
    M ${cornerRadius + 2} 2
    H ${rightX - cornerRadius}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${rightX} ${cornerRadius + 2}
    V ${arcTopY}
    C ${rightX - arcDepth} ${arcTopY},
      ${rightX - arcDepth} ${arcBottomY},
      ${rightX} ${arcBottomY}
    V ${height - cornerRadius - 2}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${rightX - cornerRadius} ${height - 2}
    H ${cornerRadius + 2}
    A ${cornerRadius} ${cornerRadius} 0 0 1 2 ${height - cornerRadius - 2}
    V ${cornerRadius + 2}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius + 2} 2
    Z
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      role="img"
      aria-label={`${label} - cofactor`}
    >
      <path d={path} fill={color} stroke="#FFFFFF" strokeWidth={2} />

      {/* Label - shifted slightly left to account for indent */}
      <text
        x={width / 2 - 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
    </svg>
  );
}
