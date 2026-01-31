'use client';

interface PhospholipidMembraneProps {
  width: number;
  height: number;
  variant: 'fibroblast' | 'platelet';
  className?: string;
  showPSExposure?: boolean; // Show phosphatidylserine exposure (platelet activation)
}

/**
 * Phospholipid bilayer membrane surface - TEXTBOOK STYLE
 *
 * Visual reference: Yellow/golden lollipop heads in organized rows
 * on a tissue background (pink for fibroblast, salmon for platelet)
 *
 * Medical accuracy:
 * - PS (phosphatidylserine) is normally on inner leaflet
 * - During platelet activation, PS flips to outer leaflet
 * - PS exposure provides binding sites for coagulation factors (via Gla domains + Ca²⁺)
 *
 * Hospital-grade visual design:
 * - Clear distinction between cell types
 * - High contrast for PS exposure indication
 * - Professional medical illustration style
 */
export function PhospholipidMembrane({
  width,
  height,
  variant,
  showPSExposure = false,
  className,
}: PhospholipidMembraneProps): React.ReactElement {
  // Tissue background colors - enhanced contrast for hospital clarity
  const tissueColor = variant === 'fibroblast'
    ? { top: '#E0A5A5', bottom: '#C89090', label: 'Celulă FT' }  // Cleaner pink tissue
    : { top: '#FECDD3', bottom: '#FDA4AF', label: 'Trombocit activat' };  // Cleaner rose for platelets

  // Phospholipid head color - GOLDEN YELLOW like textbook (phosphatidylcholine - PC)
  const headColor = '#FACC15';  // Brighter golden yellow (PC - outer leaflet normal)
  const tailColor = '#CA8A04';  // Richer gold for tails

  // Phosphatidylserine (PS) color - RED/ORANGE (exposed during activation)
  // Medical accuracy: PS is normally hidden on inner leaflet, flips out during activation
  const psColor = '#DC2626';    // Clearer red for PS heads
  const psGlow = 'rgba(220, 38, 38, 0.7)';

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

        {/* Head gradient for 3D effect (normal PC) */}
        <radialGradient id={`head-gradient-${variant}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FFFACD" />
          <stop offset="100%" stopColor={headColor} />
        </radialGradient>

        {/* PS head gradient (exposed phosphatidylserine) */}
        <radialGradient id={`ps-gradient-${variant}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor={psColor} />
        </radialGradient>

        {/* Glow filter for PS heads */}
        <filter id={`ps-glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Tissue background layer */}
      <rect
        x={0}
        y={bilayerTop + tailLength + headRadius}
        width={width}
        height={height - bilayerTop - tailLength - headRadius}
        fill={`url(#tissue-gradient-${variant})`}
      />

      {/* Cell type label at bottom */}
      <text
        x={8}
        y={height - 4}
        fontSize={8}
        fontWeight={700}
        fill={variant === 'fibroblast' ? '#881337' : '#9F1239'}
        opacity={0.7}
        style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.5px' }}
      >
        {tissueColor.label}
      </text>

      {/* Top row of phospholipids (facing bloodstream) */}
      {topRowHeads.map((head, i) => {
        // Every 2nd-3rd head shows PS when exposed (medical: PS exposure provides binding sites)
        // Increased visibility for educational clarity while maintaining medical accuracy
        const isPS = showPSExposure && variant === 'platelet' && (i % 2 === 0 || i % 3 === 1);
        const currentHeadColor = isPS ? psColor : tailColor;
        const currentHeadGradient = isPS ? `url(#ps-gradient-${variant})` : `url(#head-gradient-${variant})`;
        const headFilter = isPS ? `url(#ps-glow-${variant})` : undefined;

        return (
          <g
            key={`top-${i}`}
            style={{
              animation: isPS ? `psFlip 0.6s ease-out ${i * 0.05}s both` : undefined,
            }}
          >
            {/* Tail (two wavy lines for lipid tails) */}
            <path
              d={`M ${head.x - 2} ${head.y + headRadius}
                  Q ${head.x - 4} ${head.y + headRadius + tailLength / 2} ${head.x - 2} ${head.y + headRadius + tailLength}`}
              stroke={currentHeadColor}
              strokeWidth={2}
              fill="none"
              opacity={0.7}
            />
            <path
              d={`M ${head.x + 2} ${head.y + headRadius}
                  Q ${head.x + 4} ${head.y + headRadius + tailLength / 2} ${head.x + 2} ${head.y + headRadius + tailLength}`}
              stroke={currentHeadColor}
              strokeWidth={2}
              fill="none"
              opacity={0.7}
            />
            {/* Head (circle) */}
            <circle
              cx={head.x}
              cy={head.y}
              r={isPS ? headRadius + 1 : headRadius}
              fill={currentHeadGradient}
              stroke={currentHeadColor}
              strokeWidth={isPS ? 1.5 : 1}
              filter={headFilter}
              style={{
                animation: isPS ? `psPulse 2s ease-in-out ${i * 0.1}s infinite` : undefined,
              }}
            />
            {/* PS label for exposed heads */}
            {isPS && (
              <text
                x={head.x}
                y={head.y + 3}
                textAnchor="middle"
                fontSize={5}
                fontWeight={700}
                fill="#FFFFFF"
              >
                PS
              </text>
            )}
          </g>
        );
      })}

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
        fill="#FFFBEB"
        opacity={0.4}
      />

      {/* Membrane fluidity animation - subtle wave effect */}
      <rect
        x={0}
        y={bilayerTop}
        width={width}
        height={tailLength * 2 + headRadius * 2}
        fill="none"
        style={{
          animation: 'membraneWave 4s ease-in-out infinite',
        }}
      />

      {/* CSS animations */}
      <style>
        {`
          @keyframes psFlip {
            0% {
              transform: scaleY(0.1);
              opacity: 0;
            }
            50% {
              transform: scaleY(1.2);
            }
            100% {
              transform: scaleY(1);
              opacity: 1;
            }
          }
          @keyframes psPulse {
            0%, 100% {
              filter: url(#ps-glow-${variant}) brightness(1);
            }
            50% {
              filter: url(#ps-glow-${variant}) brightness(1.3);
            }
          }
          @keyframes membraneWave {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(2px);
            }
          }
        `}
      </style>
    </svg>
  );
}
