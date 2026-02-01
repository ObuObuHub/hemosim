// components/game/visuals/FibrinMesh.tsx
// Interactive diagram showing thrombin's dual role with central fibrin mesh
'use client';

import { useState, useEffect, useRef } from 'react';
import { EnzymeToken } from '../tokens/EnzymeToken';
import { ZymogenToken } from '../tokens/ZymogenToken';

interface FibrinMeshProps {
  width: number;
  height: number;
  isStable: boolean;
  onClotStabilized?: () => void;
}

/**
 * FibrinMesh - Interactive diagram with central animated fibrin network:
 * 1. Click Fibrinogen (FI): FIIa cleaves it → Fibrină (loose mesh appears)
 * 2. Click FXIII: FIIa activates it → FXIIIa → Cross-links fibrin (mesh reinforced)
 */
export function FibrinMesh({
  width,
  height,
  isStable,
  onClotStabilized,
}: FibrinMeshProps): React.ReactElement {
  const [fibrinogenCleaved, setFibrinogenCleaved] = useState(isStable);
  const [fxiiiActivated, setFxiiiActivated] = useState(isStable);
  const [cleavageAnimating, setCleavageAnimating] = useState(false);
  const [activationAnimating, setActivationAnimating] = useState(false);
  const hasNotified = useRef(false);

  useEffect(() => {
    if (isStable && !fibrinogenCleaved && !fxiiiActivated) {
      setFibrinogenCleaved(true);
      setFxiiiActivated(true);
    }
  }, [isStable, fibrinogenCleaved, fxiiiActivated]);

  useEffect(() => {
    if (fibrinogenCleaved && fxiiiActivated && !hasNotified.current) {
      hasNotified.current = true;
      onClotStabilized?.();
    }
  }, [fibrinogenCleaved, fxiiiActivated, onClotStabilized]);

  const handleFibrinogenClick = (): void => {
    if (fibrinogenCleaved || cleavageAnimating) return;
    setCleavageAnimating(true);
    setTimeout(() => {
      setFibrinogenCleaved(true);
      setCleavageAnimating(false);
    }, 600);
  };

  const handleFXIIIClick = (): void => {
    if (fxiiiActivated || activationAnimating) return;
    setActivationAnimating(true);
    setTimeout(() => {
      setFxiiiActivated(true);
      setActivationAnimating(false);
    }, 600);
  };

  const bothComplete = fibrinogenCleaved && fxiiiActivated;

  // Colors
  const thrombinColor = '#DC2626';
  const fibrinogenColor = '#EAB308';
  const fibrinColor = '#22C55E';
  const fxiiiColor = '#22C55E';
  const fxiiiaColor = '#059669';

  // Fibrin mesh colors (red-brownish)
  const meshColorLoose = '#B91C1C'; // Dark red for loose fibers
  const meshColorCrosslinked = '#7F1D1D'; // Darker brownish-red for crosslinked

  const svgWidth = Math.min(width * 0.95, 480);
  const svgHeight = Math.min(height * 0.92, 420);

  // Center of diagram for mesh
  const centerX = 240;
  const centerY = 220;

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 480 420"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="meshGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arr-light" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 L1.5,3 Z" fill="#D1D5DB" />
          </marker>
          <marker id="arr-green" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 L2,4 Z" fill="#059669" />
          </marker>
        </defs>

        {/* ═══════════════ CENTRAL FIBRIN MESH ═══════════════ */}
        {fibrinogenCleaved && (
          <g
            transform={`translate(${centerX}, ${centerY})`}
            style={{
              opacity: fibrinogenCleaved ? 1 : 0,
              transition: 'opacity 0.6s ease',
              filter: bothComplete ? 'url(#meshGlow)' : undefined,
            }}
          >
            {/* Background glow */}
            <ellipse
              cx={0}
              cy={0}
              rx={75}
              ry={55}
              fill={bothComplete ? 'rgba(127, 29, 29, 0.15)' : 'rgba(185, 28, 28, 0.1)'}
              style={{ transition: 'fill 0.5s ease' }}
            />

            {/* Fibrin strands - horizontal */}
            {[-35, -15, 5, 25].map((y, i) => (
              <path
                key={`h-${i}`}
                d={`M-60 ${y} Q-30 ${y + (i % 2 ? 5 : -5)}, 0 ${y} Q30 ${y + (i % 2 ? -5 : 5)}, 60 ${y}`}
                stroke={bothComplete ? meshColorCrosslinked : meshColorLoose}
                strokeWidth={bothComplete ? 3 : 2}
                fill="none"
                strokeLinecap="round"
                style={{
                  animation: bothComplete ? undefined : `meshWave ${2 + i * 0.3}s ease-in-out infinite`,
                  transition: 'stroke 0.5s ease, stroke-width 0.5s ease',
                }}
              />
            ))}

            {/* Fibrin strands - vertical */}
            {[-45, -20, 5, 30, 50].map((x, i) => (
              <path
                key={`v-${i}`}
                d={`M${x} -40 Q${x + (i % 2 ? 4 : -4)} -10, ${x} 10 Q${x + (i % 2 ? -4 : 4)} 30, ${x} 45`}
                stroke={bothComplete ? meshColorCrosslinked : meshColorLoose}
                strokeWidth={bothComplete ? 3 : 2}
                fill="none"
                strokeLinecap="round"
                style={{
                  animation: bothComplete ? undefined : `meshWave ${2.2 + i * 0.25}s ease-in-out infinite`,
                  transition: 'stroke 0.5s ease, stroke-width 0.5s ease',
                }}
              />
            ))}

            {/* Cross-link nodes (appear when stabilized) */}
            {bothComplete && (
              <>
                {[
                  { x: -45, y: -15 }, { x: -20, y: -35 }, { x: 5, y: -15 }, { x: 30, y: -35 },
                  { x: -45, y: 5 }, { x: -20, y: 25 }, { x: 5, y: 5 }, { x: 30, y: 25 }, { x: 50, y: 5 },
                ].map((pos, i) => (
                  <circle
                    key={`node-${i}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={4}
                    fill={meshColorCrosslinked}
                    stroke="#FCA5A5"
                    strokeWidth={1.5}
                    style={{
                      animation: `nodeAppear 0.4s ease-out ${i * 0.05}s forwards`,
                      opacity: 0,
                    }}
                  />
                ))}
              </>
            )}
          </g>
        )}

        {/* ═══════════════ FIIa (THROMBIN) - TOP CENTER ═══════════════ */}
        <g transform="translate(240, 50)">
          <g style={{ filter: 'url(#glow)' }}>
            <foreignObject x="-38" y="-38" width="76" height="76">
              <EnzymeToken color={thrombinColor} label="FIIa" width={76} height={76} />
            </foreignObject>
          </g>
          <text x="0" y="52" textAnchor="middle" fill="#4B5563" fontSize="13" fontWeight="600" fontFamily="system-ui">
            Trombină
          </text>
        </g>

        {/* ═══════════════ LEFT BRANCH: Fibrinogen → Fibrină ═══════════════ */}

        {/* Arrow: FIIa → Fibrinogen */}
        <path
          d="M190 70 L115 115"
          stroke="#D1D5DB"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arr-light)"
          strokeDasharray={cleavageAnimating ? '6 4' : 'none'}
          style={{ animation: cleavageAnimating ? 'dashFlow 0.3s linear infinite' : undefined }}
        />

        {/* Fibrinogen (FI) - CLICKABLE */}
        <g
          transform="translate(90, 160)"
          onClick={handleFibrinogenClick}
          style={{
            cursor: fibrinogenCleaved ? 'default' : 'pointer',
            opacity: fibrinogenCleaved ? 0.35 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <foreignObject x="-50" y="-28" width="100" height="56">
            <ZymogenToken color={fibrinogenColor} label="FI" width={100} height={56} />
          </foreignObject>
        </g>

        {/* Arrow: Fibrinogen → Fibrin */}
        <path
          d="M90 200 L90 250"
          stroke={fibrinogenCleaved ? '#059669' : '#D1D5DB'}
          strokeWidth="2.5"
          fill="none"
          markerEnd={fibrinogenCleaved ? 'url(#arr-green)' : 'url(#arr-light)'}
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* Fibrină */}
        <g
          transform="translate(90, 295)"
          style={{
            opacity: fibrinogenCleaved ? 1 : 0.25,
            transition: 'opacity 0.4s ease',
          }}
        >
          <foreignObject x="-50" y="-28" width="100" height="56">
            <ZymogenToken color={fibrinColor} label="Fibrină" width={100} height={56} />
          </foreignObject>
        </g>

        {/* ═══════════════ RIGHT BRANCH: FXIII → FXIIIa ═══════════════ */}

        {/* Arrow: FIIa → FXIII */}
        <path
          d="M290 70 L365 115"
          stroke="#D1D5DB"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arr-light)"
          strokeDasharray={activationAnimating ? '6 4' : 'none'}
          style={{ animation: activationAnimating ? 'dashFlow 0.3s linear infinite' : undefined }}
        />

        {/* FXIII - CLICKABLE */}
        <g
          transform="translate(390, 160)"
          onClick={handleFXIIIClick}
          style={{
            cursor: fxiiiActivated ? 'default' : 'pointer',
            opacity: fxiiiActivated ? 0.35 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <foreignObject x="-45" y="-26" width="90" height="52">
            <ZymogenToken color={fxiiiColor} label="FXIII" width={90} height={52} />
          </foreignObject>
        </g>

        {/* Arrow: FXIII → FXIIIa */}
        <path
          d="M390 200 L390 250"
          stroke={fxiiiActivated ? '#059669' : '#D1D5DB'}
          strokeWidth="2.5"
          fill="none"
          markerEnd={fxiiiActivated ? 'url(#arr-green)' : 'url(#arr-light)'}
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* FXIIIa */}
        <g
          transform="translate(390, 295)"
          style={{
            opacity: fxiiiActivated ? 1 : 0.25,
            transition: 'opacity 0.4s ease',
          }}
        >
          <g style={{ filter: fxiiiActivated ? 'url(#glow)' : undefined }}>
            <foreignObject x="-35" y="-35" width="70" height="70">
              <EnzymeToken color={fxiiiActivated ? fxiiiaColor : '#A0A0A0'} label="FXIIIa" width={70} height={70} />
            </foreignObject>
          </g>
        </g>

        {/* ═══════════════ CROSS-LINK ARROW ═══════════════ */}
        {bothComplete && (
          <g style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <path
              d="M352 290 Q 240 330, 145 290"
              stroke="#059669"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="6 3"
              markerEnd="url(#arr-green)"
            />
            <rect x="205" y="310" width="70" height="20" rx="4" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1.5" />
            <text x="240" y="325" textAnchor="middle" fill="#059669" fontSize="11" fontWeight="700" fontFamily="system-ui">
              cross-link
            </text>
          </g>
        )}

        {/* ═══════════════ LABEL: CHEAG STABILIZAT ═══════════════ */}
        {bothComplete && (
          <g style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <rect
              x="140"
              y="370"
              width="200"
              height="36"
              rx="4"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="2"
            />
            <text
              x="240"
              y="395"
              textAnchor="middle"
              fill="#000000"
              fontSize="18"
              fontWeight="800"
              fontFamily="system-ui"
            >
              Cheag stabilizat
            </text>
          </g>
        )}
      </svg>

      <style>{`
        @keyframes dashFlow {
          from { stroke-dashoffset: 10; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes meshWave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(2px); }
        }
        @keyframes nodeAppear {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
