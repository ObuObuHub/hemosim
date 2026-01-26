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
  const width = 50;
  const height = 70;

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
      {/* Main receptor body - simple rectangle */}
      <rect
        x={8}
        y={8}
        width={width - 16}
        height={height - 20}
        rx={4}
        fill={isActive ? '#22C55E' : '#94A3B8'}
        stroke={isActive ? '#15803D' : '#64748B'}
        strokeWidth={2}
      />

      {/* TF Label */}
      <text
        x={width / 2}
        y={28}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#FFFFFF"
      >
        TF
      </text>

      {/* Docking indicator when empty */}
      {!hasVIIa && (
        <text
          x={width / 2}
          y={46}
          textAnchor="middle"
          fontSize={8}
          fill="rgba(255,255,255,0.8)"
        >
          +FVII
        </text>
      )}

      {/* VIIa bound indicator */}
      {hasVIIa && (
        <>
          <rect
            x={10}
            y={38}
            width={width - 20}
            height={16}
            rx={3}
            fill="#DC2626"
            stroke="#991B1B"
            strokeWidth={1}
          />
          <text
            x={width / 2}
            y={50}
            textAnchor="middle"
            fontSize={9}
            fontWeight={600}
            fill="#FFFFFF"
          >
            VIIa
          </text>
        </>
      )}

      {/* Membrane anchor */}
      <rect
        x={width / 2 - 6}
        y={height - 12}
        width={12}
        height={8}
        rx={2}
        fill={isActive ? '#16A34A' : '#64748B'}
      />
    </svg>
  );
}
