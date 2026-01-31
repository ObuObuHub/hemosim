'use client';

import type { PARCleavageState } from '@/hooks/useThreePanelState';

interface PARReceptorProps {
  x: number;
  y: number;
  state: PARCleavageState;
  onClick?: () => void;
  isClickable?: boolean;
  scale?: number;
}

/**
 * PAR1 (Protease-Activated Receptor 1) - 7-Transmembrane Serpentine Receptor
 *
 * Biological structure:
 * - N-terminus (extracellular) - contains thrombin cleavage site
 * - 7 transmembrane domains (serpentine through membrane)
 * - C-terminus (intracellular)
 *
 * States:
 * - intact: Full receptor with N-terminus
 * - thrombin-bound: Thrombin (IIa) attached at N-terminus cleavage site
 * - cleaved: N-terminus cleaved off, tethered ligand exposed
 * - activated: Receptor signaling (green glow), platelet activating
 */
export function PARReceptor({
  x,
  y,
  state,
  onClick,
  isClickable = false,
  scale = 1,
}: PARReceptorProps): React.ReactElement {
  // Dimensions - larger for better visibility
  const width = 100 * scale;
  const height = 90 * scale;
  const strokeWidth = 3 * scale;

  // Membrane position (receptor spans this)
  const membraneTop = height * 0.35;
  const membraneBottom = height * 0.75;
  const membraneThickness = membraneBottom - membraneTop;

  // N-terminus cleavage point
  const cleavageY = height * 0.15;

  const isInteractive = isClickable && state === 'thrombin-bound';

  // PAR receptor is black in all states
  const color = '#1E293B';

  // 7-Transmembrane serpentine path
  // Starts from N-terminus, goes through membrane 7 times
  const loopWidth = width * 0.12;
  const loopSpacing = width * 0.13;
  const startX = width * 0.15;

  // N-terminus (extracellular portion before first TM domain)
  const nTerminusPath = `
    M ${startX} 0
    L ${startX} ${cleavageY}
    L ${startX} ${membraneTop}
  `;

  // The 7 transmembrane serpentine - goes down, up, down, up... through membrane
  const serpentinePath = `
    M ${startX} ${membraneTop}
    L ${startX} ${membraneBottom + 5}
    C ${startX} ${membraneBottom + 15}, ${startX + loopSpacing - 5} ${membraneBottom + 15}, ${startX + loopSpacing} ${membraneBottom + 5}
    L ${startX + loopSpacing} ${membraneTop - 5}
    C ${startX + loopSpacing} ${membraneTop - 12}, ${startX + loopSpacing * 2 - 5} ${membraneTop - 12}, ${startX + loopSpacing * 2} ${membraneTop - 5}
    L ${startX + loopSpacing * 2} ${membraneBottom + 5}
    C ${startX + loopSpacing * 2} ${membraneBottom + 15}, ${startX + loopSpacing * 3 - 5} ${membraneBottom + 15}, ${startX + loopSpacing * 3} ${membraneBottom + 5}
    L ${startX + loopSpacing * 3} ${membraneTop - 5}
    C ${startX + loopSpacing * 3} ${membraneTop - 12}, ${startX + loopSpacing * 4 - 5} ${membraneTop - 12}, ${startX + loopSpacing * 4} ${membraneTop - 5}
    L ${startX + loopSpacing * 4} ${membraneBottom + 5}
    C ${startX + loopSpacing * 4} ${membraneBottom + 15}, ${startX + loopSpacing * 5 - 5} ${membraneBottom + 15}, ${startX + loopSpacing * 5} ${membraneBottom + 5}
    L ${startX + loopSpacing * 5} ${membraneTop - 5}
    C ${startX + loopSpacing * 5} ${membraneTop - 12}, ${startX + loopSpacing * 6 - 5} ${membraneTop - 12}, ${startX + loopSpacing * 6} ${membraneTop - 5}
    L ${startX + loopSpacing * 6} ${membraneBottom + 5}
    L ${startX + loopSpacing * 6} ${height}
  `;

  // Cleaved N-terminus piece (floating away)
  const cleavedNTermPath = `
    M ${startX} 0
    L ${startX} ${cleavageY}
  `;

  // Tethered ligand (exposed after cleavage) - short segment
  const tetheredLigandPath = `
    M ${startX} ${cleavageY + 8}
    L ${startX} ${membraneTop}
  `;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, 0)',
        cursor: isInteractive ? 'pointer' : 'default',
        zIndex: 12,
      }}
      onClick={isInteractive ? onClick : undefined}
    >
      <svg
        width={width}
        height={height + 10}
        style={{ overflow: 'visible' }}
      >

        {/* ===== INTACT STATE ===== */}
        {state === 'intact' && (
          <>
            {/* N-terminus */}
            <path
              d={nTerminusPath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth + 1}
              strokeLinecap="round"
            />
            {/* N-terminus ball */}
            <circle
              cx={startX}
              cy={5}
              r={6 * scale}
              fill={color}
              stroke="#FFF"
              strokeWidth={1.5}
            />
            <text
              x={startX}
              y={8}
              textAnchor="middle"
              fontSize={6 * scale}
              fontWeight={700}
              fill="#FFF"
            >
              N
            </text>
            {/* 7TM serpentine */}
            <path
              d={serpentinePath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* ===== THROMBIN-BOUND STATE ===== */}
        {state === 'thrombin-bound' && (
          <>
            {/* N-terminus with glow */}
            <path
              d={nTerminusPath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth + 1}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
            {/* 7TM serpentine */}
            <path
              d={serpentinePath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
            {/* Thrombin molecule bound at cleavage site - FIIa with enzyme notch */}
            <g style={{ animation: 'thrombinBounce 1s ease-in-out infinite' }}>
              <circle
                cx={startX - 18 * scale}
                cy={cleavageY}
                r={12 * scale}
                fill="url(#par-thrombin-gradient)"
                stroke="#FFF"
                strokeWidth={2}
                style={{ filter: 'drop-shadow(0 2px 6px rgba(220, 38, 38, 0.6))' }}
              />
              {/* Enzyme active site notch */}
              <circle
                cx={startX - 8 * scale}
                cy={cleavageY - 8 * scale}
                r={4 * scale}
                fill="#FEE2E2"
              />
              <text
                x={startX - 20 * scale}
                y={cleavageY + 4 * scale}
                textAnchor="middle"
                fontSize={8 * scale}
                fontWeight={700}
                fill="#FFF"
              >
                FIIa
              </text>
              {/* Cleavage arrow indicator */}
              <path
                d={`M ${startX - 6 * scale} ${cleavageY} L ${startX - 2 * scale} ${cleavageY}`}
                stroke="#DC2626"
                strokeWidth={2}
                markerEnd="url(#cleavage-arrow)"
              />
            </g>
          </>
        )}

        {/* ===== CLEAVED STATE ===== */}
        {state === 'cleaved' && (
          <>
            {/* Cleaved N-terminus floating away */}
            <g style={{ animation: 'nTermFloat 1.5s ease-out forwards' }}>
              <path
                d={cleavedNTermPath}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={0.6}
              />
              <circle
                cx={startX}
                cy={5}
                r={5 * scale}
                fill="#9CA3AF"
                opacity={0.6}
              />
            </g>
            {/* Tethered ligand exposed (glowing) */}
            <path
              d={tetheredLigandPath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={strokeWidth + 1}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 8px #F59E0B)',
                animation: 'ligandPulse 0.8s ease-in-out infinite'
              }}
            />
            {/* Tethered ligand label */}
            <text
              x={startX + 15}
              y={cleavageY + 15}
              fontSize={7 * scale}
              fill="#F59E0B"
              fontWeight={600}
            >
              TL
            </text>
            {/* 7TM serpentine */}
            <path
              d={serpentinePath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* ===== ACTIVATED STATE ===== */}
        {state === 'activated' && (
          <>
            {/* Tethered ligand (now bound to receptor) */}
            <path
              d={tetheredLigandPath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth + 1}
              strokeLinecap="round"
            />
            {/* 7TM serpentine */}
            <path
              d={serpentinePath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Gradient and marker definitions */}
        <defs>
          <linearGradient id="par-thrombin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <marker id="cleavage-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#DC2626" />
          </marker>
        </defs>
      </svg>

      {/* PAR label */}
      <div
        style={{
          position: 'absolute',
          top: height * 0.4,
          right: -18 * scale,
          fontSize: 9 * scale,
          fontWeight: 600,
          color: '#1E293B',
          whiteSpace: 'nowrap',
        }}
      >
        PAR
      </div>


      {/* CSS Animations */}
      <style>{`
        @keyframes thrombinBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-3px); }
        }

        @keyframes nTermFloat {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.6;
          }
          100% {
            transform: translate(-25px, -30px) rotate(-45deg);
            opacity: 0;
          }
        }

        @keyframes ligandPulse {
          0%, 100% {
            filter: drop-shadow(0 0 8px #F59E0B);
            stroke-width: ${strokeWidth + 1}px;
          }
          50% {
            filter: drop-shadow(0 0 12px #F59E0B) drop-shadow(0 0 20px rgba(245, 158, 11, 0.5));
            stroke-width: ${strokeWidth + 2}px;
          }
        }

      `}</style>
    </div>
  );
}
