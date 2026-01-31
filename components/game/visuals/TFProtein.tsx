'use client';

import { FactorTokenNew } from '../tokens/FactorTokenNew';

interface TFProteinProps {
  x: number;
  y: number;
  isActive?: boolean;
  hasVIIa?: boolean;
  isProducing?: boolean;
}

/**
 * Tissue Factor (TF) protein - Medical textbook style
 *
 * Medical accuracy (Hoffman-Monroe model):
 * - TF is a transmembrane glycoprotein on fibroblasts
 * - TF acts as cofactor for FVIIa
 * - TF:VIIa complex activates FIX and FX
 * - When hasVIIa=true, displays grouped like intrinsic tenase (FVIIIa + FIXa)
 */
export function TFProtein({
  x,
  y,
  isActive = true,
  hasVIIa = false,
}: TFProteinProps): React.ReactElement {
  const tfWidth = 56;
  const bodyHeight = 36;
  const pedicleHeight = 46;
  const svgHeight = bodyHeight + pedicleHeight + 4;

  // When hasVIIa, show as grouped complex similar to Tenase
  if (hasVIIa) {
    return (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y - svgHeight - 20,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Complex container */}
        <div
          style={{
            position: 'relative',
            padding: '12px 12px 8px',
            border: '2px solid #16A34A',
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.08)',
          }}
        >
          {/* Label badge */}
          <div
            style={{
              position: 'absolute',
              top: -9,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '2px 7px',
              background: '#16A34A',
              borderRadius: 4,
              fontSize: 8,
              color: '#FFFFFF',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            TF:VIIa
          </div>

          {/* Factors side by side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* TF - custom visual (green box) */}
            <div
              style={{
                width: 40,
                height: 32,
                background: '#22C55E',
                border: '2px solid #15803D',
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              FT
            </div>
            {/* FVIIa - using FactorTokenNew to keep original color */}
            <div style={{ transform: 'scale(0.85)' }}>
              <FactorTokenNew factorId="FVIIa" isActive={true} enableHover={false} />
            </div>
          </div>
        </div>

        {/* Transmembrane pedicle below the complex */}
        <div
          style={{
            width: 8,
            height: pedicleHeight,
            background: '#16A34A',
            margin: '0 auto',
          }}
        />
      </div>
    );
  }

  // TF alone - original SVG
  return (
    <svg
      width={tfWidth}
      height={svgHeight}
      viewBox={`0 0 ${tfWidth} ${svgHeight}`}
      style={{
        position: 'absolute',
        left: x - tfWidth / 2,
        top: y - svgHeight,
      }}
    >
      {/* Transmembrane pedicle */}
      <rect
        x={tfWidth / 2 - 4}
        y={bodyHeight}
        width={8}
        height={pedicleHeight}
        fill={isActive ? '#16A34A' : '#64748B'}
      />

      {/* Main TF receptor body */}
      <rect
        x={4}
        y={2}
        width={tfWidth - 8}
        height={bodyHeight - 2}
        rx={5}
        fill={isActive ? '#22C55E' : '#94A3B8'}
        stroke={isActive ? '#15803D' : '#64748B'}
        strokeWidth={2}
      />

      {/* TF label */}
      <text
        x={tfWidth / 2}
        y={24}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="#FFFFFF"
      >
        FT
      </text>
    </svg>
  );
}
