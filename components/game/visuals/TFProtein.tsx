'use client';

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
 * - TF is a transmembrane glycoprotein (type I membrane protein)
 * - TF acts as cofactor for FVIIa (allosteric activation)
 * - FVIIa has a Gla domain (γ-carboxyglutamic acid) that binds Ca²⁺ and membrane
 * - TF:VIIa complex is the extrinsic tenase - activates FIX and FX
 * - The serine protease active site on FVIIa cleaves substrates
 */
export function TFProtein({
  x,
  y,
  isActive = true,
  hasVIIa = false,
  isProducing = false,
}: TFProteinProps): React.ReactElement {
  const tfWidth = 56;
  const bodyHeight = 36;
  const pedicleHeight = 46;
  const svgHeight = bodyHeight + pedicleHeight + 4;

  // When hasVIIa, show anatomically accurate TF:VIIa complex (Extrinsic Tenase)
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
        {/* Complex container - standardized styling */}
        <div
          style={{
            position: 'relative',
            padding: '12px 16px 20px',
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
              fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            TF:VIIa
          </div>

          {/* Enzyme + Cofactor layout - standardized */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, position: 'relative' }}>
            {/* TF - Cofactor with concave indent (lock and key design) */}
            <div style={{ position: 'relative' }}>
              <svg width={48} height={36} viewBox="0 0 48 36">
                {/* TF body with concave right edge for enzyme to "fit" */}
                <path
                  d={`
                    M 6 2
                    H 42
                    A 4 4 0 0 1 46 6
                    V 8
                    C 40 8, 40 28, 46 28
                    V 30
                    A 4 4 0 0 1 42 34
                    H 6
                    A 4 4 0 0 1 2 30
                    V 6
                    A 4 4 0 0 1 6 2
                    Z
                  `}
                  fill="#22C55E"
                  stroke="#15803D"
                  strokeWidth={2}
                />
                <text
                  x={22}
                  y={22}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#FFFFFF"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  FT
                </text>
              </svg>
              {/* Transmembrane pedicle - attached to TF, ends at membrane surface */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '100%',
                  transform: 'translateX(-50%)',
                  width: 8,
                  height: pedicleHeight + 2,
                  background: '#16A34A',
                  borderRadius: '0 0 2px 2px',
                }}
              />
            </div>

            {/* FVIIa - Enzyme (circular) with Gla domain */}
            <div style={{ position: 'relative' }}>
              {/* FVIIa serine protease with active site slot */}
              <svg width={42} height={42} viewBox="0 0 42 42">
                {/* Main circle */}
                <circle cx={21} cy={21} r={18} fill="#DC2626" stroke="#991B1B" strokeWidth={2} />
                {/* Active site slot */}
                <path
                  d={`M ${21 - 3.5} 3 L ${21 - 3.5} ${3 + 9} A 3 3 0 0 0 ${21 + 3.5} ${3 + 9} L ${21 + 3.5} 3 Z`}
                  fill="#E2E8F0"
                />
                <path
                  d={`M ${21 - 3.5} 3 L ${21 - 3.5} ${3 + 9 - 2.5} A 2.5 2.5 0 0 0 ${21 + 3.5} ${3 + 9 - 2.5} L ${21 + 3.5} 3`}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                {/* Label */}
                <text x={21} y={26} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  FVIIa
                </text>
              </svg>

              {/* Gla domain with labels */}
              <svg
                width={50}
                height={48}
                style={{
                  position: 'absolute',
                  left: 4,
                  top: 38,
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
                <text x={20} y={10} fontSize={7} fontWeight={600} fill="#374151" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Gla
                </text>
                {/* Ca²⁺ label - bottom left */}
                <text x={-6} y={38} fontSize={6} fontWeight={600} fill="#64748B" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Ca²⁺
                </text>
              </svg>
            </div>
          </div>

        </div>

        {/* Active site animation */}
        <style>
          {`
            @keyframes activeSitePulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.2); opacity: 1; }
            }
          `}
        </style>
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

      {/* Main TF receptor body with concave indent (lock and key design) */}
      <path
        d={`
          M ${4 + 5} 2
          H ${tfWidth - 4 - 5}
          A 5 5 0 0 1 ${tfWidth - 4} ${2 + 5}
          V ${bodyHeight / 2 - 10}
          C ${tfWidth - 4 - 6} ${bodyHeight / 2 - 10},
            ${tfWidth - 4 - 6} ${bodyHeight / 2 + 10},
            ${tfWidth - 4} ${bodyHeight / 2 + 10}
          V ${bodyHeight - 2 - 5}
          A 5 5 0 0 1 ${tfWidth - 4 - 5} ${bodyHeight - 2}
          H ${4 + 5}
          A 5 5 0 0 1 4 ${bodyHeight - 2 - 5}
          V ${2 + 5}
          A 5 5 0 0 1 ${4 + 5} 2
          Z
        `}
        fill={isActive ? '#22C55E' : '#94A3B8'}
        stroke={isActive ? '#15803D' : '#64748B'}
        strokeWidth={2}
      />

      {/* TF label - shifted slightly left to account for indent */}
      <text
        x={tfWidth / 2 - 2}
        y={24}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        FT
      </text>
    </svg>
  );
}
