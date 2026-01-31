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
        {/* Complex container - medical textbook style */}
        <div
          style={{
            position: 'relative',
            padding: '14px 14px 10px',
            border: '2px solid #16A34A',
            borderRadius: 10,
            background: 'rgba(22, 163, 74, 0.08)',
          }}
        >
          {/* Label badge */}
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '3px 10px',
              background: '#16A34A',
              borderRadius: 5,
              fontSize: 9,
              color: '#FFFFFF',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            TF:VIIa
          </div>

          {/* Enzyme + Cofactor layout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            {/* TF - Cofactor (rectangular) with pedicle */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 44,
                  height: 36,
                  background: '#22C55E',
                  border: '2px solid #15803D',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                FT
              </div>
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
                <text x={-6} y={38} fontSize={6} fill="#64748B" style={{ fontFamily: 'system-ui, sans-serif' }}>
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
