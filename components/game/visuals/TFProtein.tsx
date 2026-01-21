'use client';

interface TFProteinProps {
  x: number;
  y: number;
  isActive?: boolean;
}

/**
 * Tissue Factor (TF) protein embedded in membrane
 * TEXTBOOK: TF is the initiator of coagulation, Y-shaped transmembrane protein
 */
export function TFProtein({
  x,
  y,
  isActive = true,
}: TFProteinProps): React.ReactElement {
  const width = 30;
  const height = 45;
  const color = isActive ? '#8B4513' : '#A0A0A0';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y,
      }}
      className="tf-protein"
    >
      {/* Y-shaped transmembrane protein */}
      {/* Stem (transmembrane domain) */}
      <rect
        x={12}
        y={20}
        width={6}
        height={25}
        fill={color}
        rx={2}
      />

      {/* Left arm */}
      <path
        d="M 15 20 L 5 5 L 8 3 L 15 15"
        fill={color}
      />

      {/* Right arm */}
      <path
        d="M 15 20 L 25 5 L 22 3 L 15 15"
        fill={color}
      />

      {/* Label */}
      <text
        x={15}
        y={38}
        textAnchor="middle"
        fontSize={7}
        fontWeight={600}
        fill="#FFFFFF"
      >
        TF
      </text>
    </svg>
  );
}
