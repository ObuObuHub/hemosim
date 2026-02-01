'use client';

import { EnzymeToken } from '../tokens/EnzymeToken';

interface FXIaMembraneBoundProps {
  /** Show activation animation */
  isActivating?: boolean;
  style?: React.CSSProperties;
}

/**
 * FXIa bound to platelet membrane via GPIb receptor
 *
 * Medical accuracy (Hoffman-Monroe model):
 * - FXIa does NOT have a Gla domain (unlike FIXa, FXa, FIIa)
 * - FXIa binds to activated platelets via GPIb receptor
 * - This receptor-mediated binding localizes FXIa to the platelet surface
 * - FXIa then activates FIX → FIXa (amplification loop)
 */
export function FXIaMembraneBound({
  isActivating = false,
  style,
}: FXIaMembraneBoundProps): React.ReactElement {
  const anchorHeight = 24;
  const tokenWidth = 55;
  const tokenHeight = 40;
  const _totalHeight = tokenHeight + anchorHeight + 4;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      {/* FXIa enzyme token */}
      <EnzymeToken
        color="#EC4899"
        label="FXIa"
        width={tokenWidth}
        height={tokenHeight}
        isGlowing={isActivating}
      />

      {/* Receptor-binding anchor (GPIb-mediated) */}
      <svg
        width={50}
        height={anchorHeight}
        viewBox={`0 0 50 ${anchorHeight}`}
        style={{ marginTop: -2, overflow: 'visible' }}
      >
        {/* Anchor stem - wavy line representing receptor binding */}
        <path
          d={`M 25 0
              Q 29 6, 25 12
              Q 21 18, 25 ${anchorHeight}`}
          stroke="#BE185D"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />

        {/* Receptor binding site (small circle at bottom) */}
        <circle
          cx={25}
          cy={anchorHeight - 2}
          r={4}
          fill="#BE185D"
          stroke="#FBCFE8"
          strokeWidth={1.5}
        />

        {/* GPIb label - positioned to the right of the binding site */}
        <text
          x={32}
          y={anchorHeight - 1}
          fontSize={8}
          fontWeight={600}
          fill="#9D174D"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          GPIb
        </text>
      </svg>
    </div>
  );
}
