// components/game/visuals/FibrinMesh.tsx
// Interactive diagram showing thrombin's dual role - simplified tokens
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
 * FibrinMesh - Interactive diagram with simplified tokens:
 * 1. Click Fibrinogen (FI): FIIa cleaves it → Fibrină
 * 2. Click FXIII: FIIa activates it → FXIIIa → Cross-links fibrin
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
  const fibrinogenColor = '#EAB308'; // Yellow/amber
  const fibrinColor = '#22C55E'; // Green
  const fxiiiColor = '#22C55E';
  const fxiiiaColor = '#059669';

  const svgWidth = Math.min(width * 0.92, 360);
  const svgHeight = Math.min(height * 0.88, 280);

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
        viewBox="0 0 360 330"
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
          <marker id="arr-light" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 L1.5,3 Z" fill="#D1D5DB" />
          </marker>
          <marker id="arr-green" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 L2,4 Z" fill="#059669" />
          </marker>
        </defs>

        {/* ═══════════════ FIIa (THROMBIN) - TOP CENTER ═══════════════ */}
        <g transform="translate(180, 40)">
          <g style={{ filter: 'url(#glow)' }}>
            <foreignObject x="-30" y="-30" width="60" height="60">
              <EnzymeToken color={thrombinColor} label="FIIa" width={60} height={60} />
            </foreignObject>
          </g>
          <text x="0" y="42" textAnchor="middle" fill="#4B5563" fontSize="11" fontWeight="600" fontFamily="system-ui">
            Trombină
          </text>
        </g>

        {/* ═══════════════ LEFT BRANCH: Fibrinogen → Fibrină ═══════════════ */}

        {/* Arrow: FIIa → Fibrinogen */}
        <path
          d="M145 55 L90 90"
          stroke="#D1D5DB"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arr-light)"
          strokeDasharray={cleavageAnimating ? '6 4' : 'none'}
          style={{ animation: cleavageAnimating ? 'dashFlow 0.3s linear infinite' : undefined }}
        />

        {/* Fibrinogen (FI) - CLICKABLE - Simple oval */}
        <g
          transform="translate(80, 130)"
          onClick={handleFibrinogenClick}
          style={{
            cursor: fibrinogenCleaved ? 'default' : 'pointer',
            opacity: fibrinogenCleaved ? 0.35 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <foreignObject x="-40" y="-22" width="80" height="44">
            <ZymogenToken color={fibrinogenColor} label="FI" width={80} height={44} />
          </foreignObject>
        </g>

        {/* Arrow: Fibrinogen → Fibrin */}
        <path
          d="M80 165 L80 190"
          stroke={fibrinogenCleaved ? '#059669' : '#D1D5DB'}
          strokeWidth="2.5"
          fill="none"
          markerEnd={fibrinogenCleaved ? 'url(#arr-green)' : 'url(#arr-gray)'}
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* Fibrină - Simple green oval */}
        <g
          transform="translate(80, 220)"
          style={{
            opacity: fibrinogenCleaved ? 1 : 0.25,
            transition: 'opacity 0.4s ease',
          }}
        >
          <foreignObject x="-40" y="-22" width="80" height="44">
            <ZymogenToken color={fibrinColor} label="Fibrină" width={80} height={44} />
          </foreignObject>
        </g>

        {/* ═══════════════ RIGHT BRANCH: FXIII → FXIIIa ═══════════════ */}

        {/* Arrow: FIIa → FXIII */}
        <path
          d="M215 55 L270 90"
          stroke="#D1D5DB"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arr-light)"
          strokeDasharray={activationAnimating ? '6 4' : 'none'}
          style={{ animation: activationAnimating ? 'dashFlow 0.3s linear infinite' : undefined }}
        />

        {/* FXIII - CLICKABLE - Simple oval */}
        <g
          transform="translate(280, 130)"
          onClick={handleFXIIIClick}
          style={{
            cursor: fxiiiActivated ? 'default' : 'pointer',
            opacity: fxiiiActivated ? 0.35 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <foreignObject x="-35" y="-20" width="70" height="40">
            <ZymogenToken color={fxiiiColor} label="FXIII" width={70} height={40} />
          </foreignObject>
        </g>

        {/* Arrow: FXIII → FXIIIa */}
        <path
          d="M280 160 L280 185"
          stroke={fxiiiActivated ? '#059669' : '#D1D5DB'}
          strokeWidth="2.5"
          fill="none"
          markerEnd={fxiiiActivated ? 'url(#arr-green)' : 'url(#arr-gray)'}
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* FXIIIa - Active enzyme with slot */}
        <g
          transform="translate(280, 220)"
          style={{
            opacity: fxiiiActivated ? 1 : 0.25,
            transition: 'opacity 0.4s ease',
          }}
        >
          <g style={{ filter: fxiiiActivated ? 'url(#glow)' : undefined }}>
            <foreignObject x="-28" y="-28" width="56" height="56">
              <EnzymeToken color={fxiiiActivated ? fxiiiaColor : '#A0A0A0'} label="FXIIIa" width={56} height={56} />
            </foreignObject>
          </g>
        </g>

        {/* ═══════════════ CROSS-LINK ARROW ═══════════════ */}
        {bothComplete && (
          <g style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <path
              d="M248 215 Q 180 240, 125 215"
              stroke="#059669"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="6 3"
              markerEnd="url(#arr-green)"
            />
            <rect x="155" y="238" width="55" height="16" rx="4" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1.5" />
            <text x="182" y="250" textAnchor="middle" fill="#059669" fontSize="9" fontWeight="700" fontFamily="system-ui">
              cross-link
            </text>
          </g>
        )}

        {/* ═══════════════ LABEL: CHEAG STABILIZAT ═══════════════ */}
        {bothComplete && (
          <g style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <rect
              x="100"
              y="290"
              width="160"
              height="28"
              rx="4"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="2"
            />
            <text
              x="180"
              y="310"
              textAnchor="middle"
              fill="#000000"
              fontSize="16"
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
      `}</style>
    </div>
  );
}
