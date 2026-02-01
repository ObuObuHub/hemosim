'use client';

interface FibrinogenTokenProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export function FibrinogenToken({ width = 60, height = 25, style }: FibrinogenTokenProps): React.ReactElement {
  const id = 'fibrinogen';
  const color = '#EAB308';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style} className="fibrinogen-token">
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="50%" stopColor={color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
        <filter id={`${id}-shadow`}><feDropShadow dx="1" dy="2" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 2} ry={height / 2 - 2} fill={`url(#${id}-gradient)`} stroke={color} strokeWidth={2} filter={`url(#${id}-shadow)`} />
      <text x={width / 2} y={height / 2 + 3} textAnchor="middle" fontSize={8} fontWeight={600} fill="#FFFFFF" style={{ fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>Fbg</text>
    </svg>
  );
}

interface FibrinStrandTokenProps {
  length?: number;
  stickyEnds?: boolean;
  style?: React.CSSProperties;
}

export function FibrinStrandToken({ length = 50, stickyEnds = true, style }: FibrinStrandTokenProps): React.ReactElement {
  const height = 8;
  const color = '#22C55E';
  const endRadius = stickyEnds ? 5 : 3;
  return (
    <svg width={length} height={height + endRadius * 2} viewBox={`0 0 ${length} ${height + endRadius * 2}`} style={style} className="fibrin-strand-token">
      <rect x={endRadius} y={endRadius} width={length - endRadius * 2} height={height} rx={2} fill={color} opacity={0.9} />
      {stickyEnds && (
        <>
          <circle cx={endRadius} cy={endRadius + height / 2} r={endRadius} fill={color} className="fibrin-sticky-end" />
          <circle cx={length - endRadius} cy={endRadius + height / 2} r={endRadius} fill={color} className="fibrin-sticky-end" />
        </>
      )}
    </svg>
  );
}

/**
 * FibrinogenMolecule - Biochemically accurate trinodular structure
 *
 * Fibrinogen structure (340 kDa dimeric glycoprotein):
 * - D domain (left): Contains γ-chain and β-chain C-termini
 * - E domain (center): Contains N-termini of all 6 chains, fibrinopeptides A & B
 * - D domain (right): Mirror of left D domain
 * - Coiled-coil connectors: Triple-helical rods between E and D domains
 *
 * Thrombin cleaves fibrinopeptides A and B from the E domain,
 * exposing polymerization sites for fibrin self-assembly.
 */
interface FibrinogenMoleculeProps {
  uniqueId: string;
  showFibrinopeptides?: boolean;
  cleavageProgress?: number; // 0 = intact, 1 = fully cleaved
  style?: React.CSSProperties;
}

export function FibrinogenMolecule({
  uniqueId,
  showFibrinopeptides = true,
  cleavageProgress = 0,
  style,
}: FibrinogenMoleculeProps): React.ReactElement {
  // Color scheme
  const dDomainColor = '#FBBF24'; // Amber for D domains
  const eDomainColor = '#F97316'; // Orange for E domain (cleavage site)
  const coilColor = '#FDE68A'; // Light amber for coiled-coil
  const fpColor = '#EF4444'; // Red for fibrinopeptides (will be cleaved)

  // Dimensions
  const width = 90;
  const height = 36;
  const dRadius = 11; // D domain radius
  const eRadius = 8; // E domain radius (slightly smaller)

  // Positions
  const leftD = { x: 14, y: height / 2 };
  const rightD = { x: width - 14, y: height / 2 };
  const centerE = { x: width / 2, y: height / 2 };

  // Fibrinopeptide positions (small protrusions from E domain)
  const fpAOffset = { x: -4, y: -6 }; // FpA - upper left of E
  const fpBOffset = { x: 4, y: -6 }; // FpB - upper right of E

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
      <defs>
        {/* D domain gradient */}
        <radialGradient id={`${uniqueId}-d-grad`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor={dDomainColor} />
        </radialGradient>
        {/* E domain gradient */}
        <radialGradient id={`${uniqueId}-e-grad`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor={eDomainColor} />
        </radialGradient>
        {/* Fibrinopeptide gradient */}
        <radialGradient id={`${uniqueId}-fp-grad`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor={fpColor} />
        </radialGradient>
        {/* Drop shadow */}
        <filter id={`${uniqueId}-shadow`}>
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Coiled-coil connectors (triple helix rods) */}
      {/* Left coil: D → E */}
      <path
        d={`M ${leftD.x + dRadius - 2} ${leftD.y}
            Q ${(leftD.x + centerE.x) / 2} ${leftD.y - 3},
              ${centerE.x - eRadius + 2} ${centerE.y}`}
        stroke={coilColor}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${leftD.x + dRadius - 2} ${leftD.y}
            Q ${(leftD.x + centerE.x) / 2} ${leftD.y + 3},
              ${centerE.x - eRadius + 2} ${centerE.y}`}
        stroke={coilColor}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Right coil: E → D */}
      <path
        d={`M ${centerE.x + eRadius - 2} ${centerE.y}
            Q ${(centerE.x + rightD.x) / 2} ${rightD.y - 3},
              ${rightD.x - dRadius + 2} ${rightD.y}`}
        stroke={coilColor}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${centerE.x + eRadius - 2} ${centerE.y}
            Q ${(centerE.x + rightD.x) / 2} ${rightD.y + 3},
              ${rightD.x - dRadius + 2} ${rightD.y}`}
        stroke={coilColor}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Left D domain */}
      <ellipse
        cx={leftD.x}
        cy={leftD.y}
        rx={dRadius}
        ry={dRadius - 1}
        fill={`url(#${uniqueId}-d-grad)`}
        stroke="#D97706"
        strokeWidth={1.5}
        filter={`url(#${uniqueId}-shadow)`}
      />
      <text
        x={leftD.x}
        y={leftD.y + 3}
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#78350F"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        D
      </text>

      {/* Right D domain */}
      <ellipse
        cx={rightD.x}
        cy={rightD.y}
        rx={dRadius}
        ry={dRadius - 1}
        fill={`url(#${uniqueId}-d-grad)`}
        stroke="#D97706"
        strokeWidth={1.5}
        filter={`url(#${uniqueId}-shadow)`}
      />
      <text
        x={rightD.x}
        y={rightD.y + 3}
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#78350F"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        D
      </text>

      {/* Central E domain (cleavage site) */}
      <ellipse
        cx={centerE.x}
        cy={centerE.y}
        rx={eRadius}
        ry={eRadius - 1}
        fill={`url(#${uniqueId}-e-grad)`}
        stroke="#C2410C"
        strokeWidth={1.5}
        filter={`url(#${uniqueId}-shadow)`}
      />
      <text
        x={centerE.x}
        y={centerE.y + 3}
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#7C2D12"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        E
      </text>

      {/* Fibrinopeptides A and B (attached to E domain) */}
      {showFibrinopeptides && cleavageProgress < 0.5 && (
        <>
          {/* FpA - upper left of E domain */}
          <g
            style={{
              opacity: 1 - cleavageProgress * 2,
              transform: cleavageProgress > 0
                ? `translate(${-cleavageProgress * 15}px, ${-cleavageProgress * 10}px)`
                : undefined,
            }}
          >
            <ellipse
              cx={centerE.x + fpAOffset.x}
              cy={centerE.y + fpAOffset.y}
              rx={4}
              ry={3}
              fill={`url(#${uniqueId}-fp-grad)`}
              stroke="#DC2626"
              strokeWidth={1}
            />
            <text
              x={centerE.x + fpAOffset.x}
              y={centerE.y + fpAOffset.y + 1.5}
              textAnchor="middle"
              fontSize="4"
              fontWeight="600"
              fill="#FFF"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              A
            </text>
          </g>

          {/* FpB - upper right of E domain */}
          <g
            style={{
              opacity: 1 - cleavageProgress * 2,
              transform: cleavageProgress > 0
                ? `translate(${cleavageProgress * 15}px, ${-cleavageProgress * 10}px)`
                : undefined,
            }}
          >
            <ellipse
              cx={centerE.x + fpBOffset.x}
              cy={centerE.y + fpBOffset.y}
              rx={4}
              ry={3}
              fill={`url(#${uniqueId}-fp-grad)`}
              stroke="#DC2626"
              strokeWidth={1}
            />
            <text
              x={centerE.x + fpBOffset.x}
              y={centerE.y + fpBOffset.y + 1.5}
              textAnchor="middle"
              fontSize="4"
              fontWeight="600"
              fill="#FFF"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              B
            </text>
          </g>
        </>
      )}

      {/* Polymerization site indicators (appear after cleavage) */}
      {cleavageProgress > 0.5 && (
        <>
          {/* Exposed site on E domain (where FpA was) */}
          <circle
            cx={centerE.x + fpAOffset.x}
            cy={centerE.y + fpAOffset.y + 2}
            r={2}
            fill="#22C55E"
            opacity={(cleavageProgress - 0.5) * 2}
          />
          {/* Exposed site on E domain (where FpB was) */}
          <circle
            cx={centerE.x + fpBOffset.x}
            cy={centerE.y + fpBOffset.y + 2}
            r={2}
            fill="#22C55E"
            opacity={(cleavageProgress - 0.5) * 2}
          />
        </>
      )}
    </svg>
  );
}

/**
 * FibrinMonomer - Result of thrombin cleavage
 * Clean D-E-D structure matching fibrinogen but in green (polymerization-ready)
 */
interface FibrinMonomerProps {
  uniqueId: string;
  style?: React.CSSProperties;
}

export function FibrinMonomer({ uniqueId, style }: FibrinMonomerProps): React.ReactElement {
  const width = 80;
  const height = 32;
  const dRadius = 10;
  const eRadius = 7;

  const leftD = { x: 12, y: height / 2 };
  const rightD = { x: width - 12, y: height / 2 };
  const centerE = { x: width / 2, y: height / 2 };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
      <defs>
        <radialGradient id={`${uniqueId}-fibrin-d`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-fibrin-e`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </radialGradient>
        <filter id={`${uniqueId}-shadow`}>
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Coiled-coil connectors */}
      <line x1={leftD.x + dRadius - 2} y1={leftD.y} x2={centerE.x - eRadius + 2} y2={centerE.y} stroke="#6EE7B7" strokeWidth={3} strokeLinecap="round" />
      <line x1={centerE.x + eRadius - 2} y1={centerE.y} x2={rightD.x - dRadius + 2} y2={rightD.y} stroke="#6EE7B7" strokeWidth={3} strokeLinecap="round" />

      {/* Left D domain */}
      <ellipse cx={leftD.x} cy={leftD.y} rx={dRadius} ry={dRadius - 1} fill={`url(#${uniqueId}-fibrin-d)`} stroke="#16A34A" strokeWidth={1.5} filter={`url(#${uniqueId}-shadow)`} />
      <text x={leftD.x} y={leftD.y + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFF" style={{ fontFamily: 'system-ui, sans-serif' }}>D</text>

      {/* Right D domain */}
      <ellipse cx={rightD.x} cy={rightD.y} rx={dRadius} ry={dRadius - 1} fill={`url(#${uniqueId}-fibrin-d)`} stroke="#16A34A" strokeWidth={1.5} filter={`url(#${uniqueId}-shadow)`} />
      <text x={rightD.x} y={rightD.y + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFF" style={{ fontFamily: 'system-ui, sans-serif' }}>D</text>

      {/* Central E domain */}
      <ellipse cx={centerE.x} cy={centerE.y} rx={eRadius} ry={eRadius - 1} fill={`url(#${uniqueId}-fibrin-e)`} stroke="#059669" strokeWidth={1.5} filter={`url(#${uniqueId}-shadow)`} />
      <text x={centerE.x} y={centerE.y + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFF" style={{ fontFamily: 'system-ui, sans-serif' }}>E</text>
    </svg>
  );
}
