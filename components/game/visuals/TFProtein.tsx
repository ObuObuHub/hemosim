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
 * - TF is a transmembrane glycoprotein on fibroblasts
 * - TF acts as cofactor for FVIIa
 * - TF:VIIa complex activates FIX and FX
 */
export function TFProtein({
  x,
  y,
  isActive = true,
  hasVIIa = false,
}: TFProteinProps): React.ReactElement {
  const width = 56;
  const bodyHeight = hasVIIa ? 52 : 36;
  const pedicleHeight = 46;
  const height = bodyHeight + pedicleHeight + 4;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - height,
      }}
    >
      {/* Transmembrane pedicle */}
      <rect
        x={width / 2 - 4}
        y={bodyHeight}
        width={8}
        height={pedicleHeight}
        fill={isActive ? '#16A34A' : '#64748B'}
      />

      {/* Main receptor body */}
      <rect
        x={4}
        y={2}
        width={width - 8}
        height={bodyHeight - 2}
        rx={5}
        fill={isActive ? '#22C55E' : '#94A3B8'}
        stroke={isActive ? '#15803D' : '#64748B'}
        strokeWidth={2}
      />

      {hasVIIa ? (
        <>
          {/* TF:VIIa complex label */}
          <text
            x={width / 2}
            y={22}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="#FFFFFF"
          >
            FT
          </text>
          {/* Divider line */}
          <line
            x1={10}
            y1={28}
            x2={width - 10}
            y2={28}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
          />
          <text
            x={width / 2}
            y={44}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="#FFFFFF"
          >
            VIIa
          </text>
        </>
      ) : (
        <text
          x={width / 2}
          y={24}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill="#FFFFFF"
        >
          FT
        </text>
      )}
    </svg>
  );
}
