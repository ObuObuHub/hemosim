'use client';

interface PhospholipidMembraneProps {
  width: number;
  height: number;
  variant: 'fibroblast' | 'platelet';
  className?: string;
}

/**
 * Phospholipid bilayer membrane surface - TEXTBOOK STYLE
 *
 * Visual reference: Yellow/golden lollipop heads in organized rows
 * on a tissue background (pink for fibroblast, salmon for platelet)
 */
export function PhospholipidMembrane({
  width,
  height,
  variant,
  className,
}: PhospholipidMembraneProps): React.ReactElement {
  // Tissue background colors (the cellular layer)
  const tissueColor = variant === 'fibroblast'
    ? { top: '#E8B4B4', bottom: '#D4A0A0' }  // Pink-ish tissue
    : { top: '#FFB6C1', bottom: '#FF91A4' }; // Salmon pink for platelets

  // Phospholipid head color - GOLDEN YELLOW like textbook
  const headColor = '#F9DC5C';  // Golden yellow
  const tailColor = '#C9A227';  // Darker gold for tails

  // Phospholipid bilayer dimensions
  const bilayerTop = 15;  // Where the top row of heads starts
  const headRadius = 5;
  const headSpacing = 16;  // Space between heads
  const tailLength = 20;
  const headCount = Math.floor(width / headSpacing);

  // Generate two rows of phospholipid heads (bilayer)
  const topRowHeads = Array.from({ length: headCount }, (_, i) => ({
    x: i * headSpacing + headSpacing / 2,
    y: bilayerTop,
  }));

  const bottomRowHeads = Array.from({ length: headCount }, (_, i) => ({
    x: i * headSpacing + headSpacing / 2,
    y: bilayerTop + tailLength * 2 + headRadius * 2,
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
        {/* Tissue background gradient */}
        <linearGradient id={`tissue-gradient-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={tissueColor.top} />
          <stop offset="100%" stopColor={tissueColor.bottom} />
        </linearGradient>

        {/* Head gradient for 3D effect */}
        <radialGradient id={`head-gradient-${variant}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FFFACD" />
          <stop offset="100%" stopColor={headColor} />
        </radialGradient>
      </defs>

      {/* Tissue background layer */}
      <rect
        x={0}
        y={bilayerTop + tailLength + headRadius}
        width={width}
        height={height - bilayerTop - tailLength - headRadius}
        fill={`url(#tissue-gradient-${variant})`}
      />

      {/* Top row of phospholipids (facing bloodstream) */}
      {topRowHeads.map((head, i) => (
        <g key={`top-${i}`}>
          {/* Tail (two wavy lines for lipid tails) */}
          <path
            d={`M ${head.x - 2} ${head.y + headRadius}
                Q ${head.x - 4} ${head.y + headRadius + tailLength / 2} ${head.x - 2} ${head.y + headRadius + tailLength}`}
            stroke={tailColor}
            strokeWidth={2}
            fill="none"
            opacity={0.7}
          />
          <path
            d={`M ${head.x + 2} ${head.y + headRadius}
                Q ${head.x + 4} ${head.y + headRadius + tailLength / 2} ${head.x + 2} ${head.y + headRadius + tailLength}`}
            stroke={tailColor}
            strokeWidth={2}
            fill="none"
            opacity={0.7}
          />
          {/* Head (circle) */}
          <circle
            cx={head.x}
            cy={head.y}
            r={headRadius}
            fill={`url(#head-gradient-${variant})`}
            stroke={tailColor}
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Bottom row of phospholipids (inner leaflet) */}
      {bottomRowHeads.map((head, i) => (
        <g key={`bottom-${i}`}>
          {/* Tail (pointing up) */}
          <path
            d={`M ${head.x - 2} ${head.y - headRadius}
                Q ${head.x - 4} ${head.y - headRadius - tailLength / 2} ${head.x - 2} ${head.y - headRadius - tailLength}`}
            stroke={tailColor}
            strokeWidth={2}
            fill="none"
            opacity={0.7}
          />
          <path
            d={`M ${head.x + 2} ${head.y - headRadius}
                Q ${head.x + 4} ${head.y - headRadius - tailLength / 2} ${head.x + 2} ${head.y - headRadius - tailLength}`}
            stroke={tailColor}
            strokeWidth={2}
            fill="none"
            opacity={0.7}
          />
          {/* Head (circle) */}
          <circle
            cx={head.x}
            cy={head.y}
            r={headRadius}
            fill={`url(#head-gradient-${variant})`}
            stroke={tailColor}
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Subtle membrane interior fill (between the bilayer) */}
      <rect
        x={0}
        y={bilayerTop + headRadius + 5}
        width={width}
        height={tailLength * 2 - 10}
        fill="#FFF8DC"
        opacity={0.3}
      />
    </svg>
  );
}
