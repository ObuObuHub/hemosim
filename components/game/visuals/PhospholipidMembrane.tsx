'use client';

interface PhospholipidMembraneProps {
  width: number;
  height: number;
  variant: 'fibroblast' | 'platelet';
  className?: string;
}

interface PhospholipidHead {
  x: number;
  y: number;
}

interface MembraneColors {
  light: string;
  dark: string;
  head: string;
}

/**
 * Generate a wavy path for the top edge of the membrane
 */
function generateWavyPath(width: number, height: number): string {
  const waveHeight = 8;
  const waveCount = Math.floor(width / 40);
  let path = `M 0 ${waveHeight}`;

  for (let i = 0; i < waveCount; i++) {
    const x1 = (i * width) / waveCount + width / waveCount / 4;
    const x2 = (i * width) / waveCount + (width / waveCount / 4) * 3;
    const x3 = ((i + 1) * width) / waveCount;
    const y1 = waveHeight - 4;
    const y2 = waveHeight + 4;

    path += ` Q ${x1} ${y1}, ${x2} ${y2} T ${x3} ${waveHeight}`;
  }

  path += ` L ${width} ${height} L 0 ${height} Z`;
  return path;
}

/**
 * Phospholipid bilayer membrane surface
 * TEXTBOOK: Membrane is where coagulation complexes assemble
 * Visual: Tan/beige for fibroblast, pink/salmon for activated platelet
 */
export function PhospholipidMembrane({
  width,
  height,
  variant,
  className,
}: PhospholipidMembraneProps): React.ReactElement {
  const colors: MembraneColors = variant === 'fibroblast'
    ? { light: '#D4A574', dark: '#A67B5B', head: '#E8D4B8' }
    : { light: '#F9A8D4', dark: '#EC4899', head: '#FDF2F8' };

  // Generate phospholipid head positions (randomized but consistent)
  const headSpacing = 12;
  const headCount = Math.floor(width / headSpacing);
  const heads: PhospholipidHead[] = Array.from({ length: headCount }, (_, i) => ({
    x: i * headSpacing + headSpacing / 2 + (Math.sin(i * 1.5) * 2),
    y: 8 + (Math.cos(i * 2) * 2),
  }));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Gradient for membrane depth */}
        <linearGradient id={`membrane-gradient-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="40%" stopColor={colors.dark} stopOpacity={0.8} />
          <stop offset="100%" stopColor={colors.dark} />
        </linearGradient>
      </defs>

      {/* Wavy top edge path */}
      <path
        d={generateWavyPath(width, height)}
        fill={`url(#membrane-gradient-${variant})`}
      />

      {/* Phospholipid heads (lollipop pattern) */}
      {heads.map((head, i) => (
        <g key={i}>
          {/* Tail (line) */}
          <line
            x1={head.x}
            y1={head.y}
            x2={head.x}
            y2={head.y + 15}
            stroke={colors.dark}
            strokeWidth={1.5}
            opacity={0.5}
          />
          {/* Head (circle) */}
          <circle
            cx={head.x}
            cy={head.y}
            r={4}
            fill={colors.head}
            stroke={colors.dark}
            strokeWidth={0.5}
            opacity={0.8}
          />
        </g>
      ))}
    </svg>
  );
}
