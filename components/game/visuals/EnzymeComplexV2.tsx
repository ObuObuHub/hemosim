// components/game/visuals/EnzymeComplexV2.tsx
// Medical textbook-style enzyme complex visualization
'use client';

import { useId } from 'react';

interface EnzymeComplexV2Props {
  /** Complex type determines styling and labels */
  type: 'extrinsic-tenase' | 'intrinsic-tenase' | 'prothrombinase';
  /** Whether complex is fully formed */
  isFormed: boolean;
  /** Show active site indicator (for enzymatic activation) */
  showActiveSite?: boolean;
  /** Position offset */
  x?: number;
  y?: number;
}

/**
 * EnzymeComplexV2 - Medical Textbook Style
 *
 * Design principles:
 * - Enzymes (serine proteases): Circular with active site dot
 * - Cofactors: Rectangular
 * - Gla domains: Curved line with "+ Ca²⁺" label
 *
 * MEDICAL ACCURACY:
 * - Extrinsic Tenase: TF (cofactor) + FVIIa (enzyme) - activates FIX, FX
 * - Intrinsic Tenase: FVIIIa (cofactor) + FIXa (enzyme) - activates FX (×200,000)
 * - Prothrombinase: FVa (cofactor) + FXa (enzyme) - activates FII (×300,000)
 */
export function EnzymeComplexV2({
  type,
  isFormed,
  showActiveSite = false,
  x = 0,
  y = 0,
}: EnzymeComplexV2Props): React.ReactElement {
  const uniqueId = useId();

  // Configuration based on complex type
  const config = getComplexConfig(type);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Complex container */}
      <div
        style={{
          position: 'relative',
          padding: '14px 16px 12px',
          border: `2px ${isFormed ? 'solid' : 'dashed'} ${config.borderColor}`,
          borderRadius: 10,
          background: isFormed ? config.bgColor : 'rgba(255,255,255,0.03)',
          minWidth: 110,
        }}
      >
        {/* Complex label badge */}
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '3px 10px',
            background: config.labelBg,
            borderRadius: 4,
            fontSize: 9,
            color: '#FFFFFF',
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
            letterSpacing: 0.3,
          }}
        >
          {config.label}
        </div>

        {/* Enzyme + Cofactor layout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
          }}
        >
          {/* Cofactor (rectangular) */}
          <div
            style={{
              width: 44,
              height: 36,
              background: config.cofactor.bg,
              border: `2px solid ${config.cofactor.border}`,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              opacity: isFormed ? 1 : 0.5,
              filter: isFormed ? 'none' : 'grayscale(40%)',
            }}
          >
            {config.cofactor.label}
          </div>

          {/* Enzyme (circular with Gla domain) */}
          <div style={{ position: 'relative' }}>
            {/* Enzyme circle */}
            <div
              style={{
                width: 42,
                height: 42,
                background: config.enzyme.bg,
                border: `2px solid ${config.enzyme.border}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
                position: 'relative',
                opacity: isFormed ? 1 : 0.5,
                filter: isFormed ? 'none' : 'grayscale(40%)',
              }}
            >
              {config.enzyme.label}

              {/* Active site indicator (small white dot) */}
              {isFormed && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    background: '#FFFFFF',
                    borderRadius: '50%',
                    border: `1px solid ${config.enzyme.border}`,
                    opacity: showActiveSite ? 1 : 0.6,
                    animation: showActiveSite ? 'activeSitePulse 1s ease-in-out infinite' : 'none',
                  }}
                />
              )}
            </div>

            {/* Gla domain - extends down to membrane */}
            <svg
              width={35}
              height={45}
              style={{
                position: 'absolute',
                left: 8,
                top: 38,
                overflow: 'visible',
              }}
            >
              {/* Curved Gla domain line */}
              <path
                d="M 12 0 Q 16 12, 12 22 Q 8 32, 14 42"
                stroke="#1F2937"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                opacity={isFormed ? 1 : 0.4}
              />
              {/* Gla label - upper right */}
              <text x={20} y={10} fontSize={7} fontWeight={600} fill="#374151">
                Gla
              </text>
              {/* Ca²⁺ label - bottom left */}
              <text x={-6} y={38} fontSize={6} fontWeight={600} fill="#64748B">
                Ca²⁺
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Active site pulse animation */}
      <style>
        {`
          @keyframes activeSitePulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.3); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

/**
 * Get configuration for each complex type
 */
function getComplexConfig(type: 'extrinsic-tenase' | 'intrinsic-tenase' | 'prothrombinase'): {
  label: string;
  labelBg: string;
  borderColor: string;
  bgColor: string;
  enzyme: { label: string; bg: string; border: string };
  cofactor: { label: string; bg: string; border: string };
} {
  switch (type) {
    case 'extrinsic-tenase':
      return {
        label: 'TF:VIIa',
        labelBg: '#16A34A',
        borderColor: '#16A34A',
        bgColor: 'rgba(22, 163, 74, 0.08)',
        enzyme: { label: 'FVIIa', bg: '#DC2626', border: '#991B1B' },
        cofactor: { label: 'FT', bg: '#22C55E', border: '#15803D' },
      };

    case 'intrinsic-tenase':
      return {
        label: 'Tenază',
        labelBg: '#0891B2',
        borderColor: '#06B6D4',
        bgColor: 'rgba(6, 182, 212, 0.08)',
        enzyme: { label: 'FIXa', bg: '#06B6D4', border: '#0E7490' },
        cofactor: { label: 'FVIIIa', bg: '#8B5CF6', border: '#6D28D9' },
      };

    case 'prothrombinase':
      return {
        label: 'Protrombinază',
        labelBg: '#3B82F6',
        borderColor: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.05)',
        enzyme: { label: 'FXa', bg: '#22C55E', border: '#15803D' },
        cofactor: { label: 'FVa', bg: '#F97316', border: '#C2410C' },
      };
  }
}

/**
 * Standalone enzyme token with Gla domain
 * For use when showing just the enzyme (e.g., FXa before complex formation)
 */
interface EnzymeWithGlaProps {
  factorId: string;
  label: string;
  bgColor: string;
  borderColor: string;
  isActive?: boolean;
  showActiveSite?: boolean;
  x?: number;
  y?: number;
}

export function EnzymeWithGla({
  factorId,
  label,
  bgColor,
  borderColor,
  isActive = true,
  showActiveSite = false,
  x = 0,
  y = 0,
}: EnzymeWithGlaProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Enzyme circle */}
      <div
        style={{
          width: 44,
          height: 44,
          background: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          opacity: isActive ? 1 : 0.5,
        }}
      >
        {label}

        {/* Active site indicator */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              background: '#FFFFFF',
              borderRadius: '50%',
              border: `1px solid ${borderColor}`,
              opacity: showActiveSite ? 1 : 0.6,
            }}
          />
        )}
      </div>

      {/* Gla domain */}
      <svg
        width={35}
        height={45}
        style={{
          position: 'absolute',
          left: 8,
          top: 40,
          overflow: 'visible',
        }}
      >
        <path
          d="M 12 0 Q 16 12, 12 22 Q 8 32, 14 42"
          stroke="#1F2937"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
        {/* Gla label - upper right */}
        <text x={20} y={10} fontSize={7} fontWeight={600} fill="#374151">
          Gla
        </text>
        {/* Ca²⁺ label - bottom left */}
        <text x={-6} y={38} fontSize={6} fill="#64748B">
          Ca²⁺
        </text>
      </svg>
    </div>
  );
}
