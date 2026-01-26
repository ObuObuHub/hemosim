// components/game/tokens/GlaDomain.tsx
'use client';

interface GlaDomainProps {
  width?: number;
  height?: number;
  color?: string;
  style?: React.CSSProperties;
}

/**
 * GlaDomain - Vitamin K-dependent membrane anchor
 *
 * Medical accuracy:
 * The Gla domain (γ-carboxyglutamate domain) is found in vitamin K-dependent
 * coagulation factors (II, VII, IX, X). It contains 9-12 γ-carboxyglutamate
 * residues that bind Ca²⁺ ions and anchor the factor to phospholipid membranes.
 *
 * Visual: A wavy/squiggly tail extending from the bottom of the factor,
 * representing the flexible membrane-binding domain.
 */
export function GlaDomain({
  width = 16,
  height = 20,
  color = '#1F2937',
  style,
}: GlaDomainProps): React.ReactElement {
  // Create an S-curve path for the wavy Gla domain
  const cx = width / 2;

  // Control points for smooth S-curve
  const path = `
    M ${cx} 0
    C ${cx + 6} ${height * 0.25}, ${cx - 6} ${height * 0.5}, ${cx + 4} ${height * 0.75}
    C ${cx + 8} ${height * 0.85}, ${cx - 2} ${height * 0.95}, ${cx} ${height}
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ marginTop: -2, ...style }}
      role="img"
      aria-label="Gla domain - reziduuri γ-carboxiglutamat"
    >
      {/* Wavy tail representing the Gla domain */}
      <path
        d={path}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
