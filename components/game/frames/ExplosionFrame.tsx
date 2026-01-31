// components/game/frames/ExplosionFrame.tsx
'use client';

import { useMemo, useEffect } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FibrinMesh } from '../visuals/FibrinMesh';
import { UnifiedPlateletView } from './UnifiedPlateletView';
import type { ExplosionState, PlayMode } from '@/hooks/useCascadeState';

interface ExplosionFrameProps {
  width: number;
  height: number;
  state: ExplosionState;
  onActivateFactor: (factorId: string) => void;
  onDockCofactor?: (cofactorId: 'FVa' | 'FVIIIa') => void;
  onFormComplex: (complexType: 'tenase' | 'prothrombinase' | 'burst') => void;
  onProduceFXa?: () => void;
  onPARThrombinBind?: () => void;
  onPARCleave?: () => void;
  onPARActivate?: () => void;
  onActivatePlatelet?: () => void;
  // Fibrin formation callbacks
  onCleaveFibrinogen?: () => void;
  onPolymerizeFibrin?: () => void;
  onActivateFXIII?: () => void;
  onCrosslinkFibrin?: () => void;
  mode?: PlayMode;
  // FIXa migration state from initiation
  fixaMigrating?: boolean;
}

/**
 * EXPLOSION FRAME - Unified Amplification + Propagation View
 *
 * Displays both phases simultaneously on the activated platelet surface,
 * matching the biological reality where both processes occur concurrently.
 *
 * Layout (Vertical Zones):
 * - TOP ZONE (~40%): Cofactor Activation by Thrombin (IIa)
 *   - FXI → FXIa, FV → FVa, FVIII-vWF → FVIIIa
 * - BOTTOM ZONE (~60%): Enzyme Complex Formation on Membrane
 *   - Tenase (FVIIIa + FIXa) and Prothrombinase (FVa + FXa)
 *
 * Prerequisites gate each activity, not artificial phase transitions.
 */
export function ExplosionFrame({
  width,
  height,
  state,
  onActivateFactor,
  onDockCofactor,
  onFormComplex,
  onProduceFXa,
  onPARThrombinBind,
  onPARCleave,
  onPARActivate,
  onActivatePlatelet,
  onCleaveFibrinogen,
  onPolymerizeFibrin,
  onActivateFXIII,
  onCrosslinkFibrin,
  mode = 'manual',
  fixaMigrating = false,
}: ExplosionFrameProps): React.ReactElement {
  const isAutoMode = mode === 'auto';

  // Unified layout for both zones
  const layout = useMemo(() => {
    const membraneHeight = height * 0.28; // Aligned with SparkFrame
    const bloodstreamHeight = height - membraneHeight;
    const membraneY = bloodstreamHeight;

    // Zone boundaries
    const topZoneEnd = bloodstreamHeight * 0.45; // Activation zone
    const bottomZoneStart = topZoneEnd; // Complex formation zone

    return {
      membraneHeight,
      membraneY,
      bloodstreamHeight,
      centerX: width / 2,
      // Zone boundaries
      topZoneEnd,
      bottomZoneStart,
      // Complex positions (bottom zone)
      tenaseX: width * 0.3,
      prothrombinaseX: width * 0.7,
      complexY: membraneY - 70,
      burstY: height * 0.15,
    };
  }, [width, height]);

  const isDormant = state.phase === 'dormant';
  const isActive = state.thrombinArrived; // Unified: both zones visible when thrombin arrives
  const isBurst = state.phase === 'burst';
  const isClotting = state.phase === 'clotting';
  const isStable = state.phase === 'stable';

  // Check prerequisites for complex formation (not phase-based)
  const canFormTenase = state.fixaArrived && state.fviiaDocked && !state.tenaseFormed && !isAutoMode;
  const canProduceFXaButton = state.tenaseFormed && !state.fxaProduced && !isAutoMode;
  const canFormProthrombinase = state.fxaProduced && state.fvaDocked && !state.prothrombinaseFormed && !isAutoMode;
  const canBurst = state.prothrombinaseFormed && !state.thrombinBurst && !isAutoMode;

  // Auto-trigger fibrin formation after burst (slow for dramatic effect)
  useEffect(() => {
    if (state.thrombinBurst && !state.fibrinogenCleaved && onCleaveFibrinogen) {
      const timer = setTimeout(() => onCleaveFibrinogen(), 8000);
      return () => clearTimeout(timer);
    }
  }, [state.thrombinBurst, state.fibrinogenCleaved, onCleaveFibrinogen]);

  // Auto-polymerize fibrin after cleavage
  useEffect(() => {
    if (state.fibrinogenCleaved && !state.fibrinPolymerized && onPolymerizeFibrin) {
      const timer = setTimeout(() => onPolymerizeFibrin(), 5000);
      return () => clearTimeout(timer);
    }
  }, [state.fibrinogenCleaved, state.fibrinPolymerized, onPolymerizeFibrin]);

  // Auto-activate FXIII after polymerization
  useEffect(() => {
    if (state.fibrinPolymerized && !state.fxiiiActivated && onActivateFXIII) {
      const timer = setTimeout(() => onActivateFXIII(), 5000);
      return () => clearTimeout(timer);
    }
  }, [state.fibrinPolymerized, state.fxiiiActivated, onActivateFXIII]);

  // Auto-dock cofactors after activation
  useEffect(() => {
    if (state.vwfSplit && !state.fviiaDocked && onDockCofactor) {
      const timer = setTimeout(() => onDockCofactor('FVIIIa'), 800);
      return () => clearTimeout(timer);
    }
  }, [state.vwfSplit, state.fviiaDocked, onDockCofactor]);

  useEffect(() => {
    if (state.fvActivated && !state.fvaDocked && onDockCofactor) {
      const timer = setTimeout(() => onDockCofactor('FVa'), 800);
      return () => clearTimeout(timer);
    }
  }, [state.fvActivated, state.fvaDocked, onDockCofactor]);

  // Auto-bind thrombin to PAR
  useEffect(() => {
    if (state.thrombinArrived && state.parCleavageState === 'intact' && onPARThrombinBind) {
      const timer = setTimeout(() => onPARThrombinBind(), 600);
      return () => clearTimeout(timer);
    }
  }, [state.thrombinArrived, state.parCleavageState, onPARThrombinBind]);

  // Auto-activate PAR after cleavage
  useEffect(() => {
    if (state.parCleavageState === 'cleaved' && onPARActivate) {
      const timer = setTimeout(() => onPARActivate(), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.parCleavageState, onPARActivate]);

  // Auto-activate platelet when PAR is activated (cleaved by thrombin)
  // Educational note: PAR activation triggers platelet shape change and PS exposure IMMEDIATELY
  useEffect(() => {
    if (
      state.parCleavageState === 'activated' &&
      !state.plateletActivated &&
      onActivatePlatelet
    ) {
      // Platelet surface change happens immediately upon PAR activation
      const timer = setTimeout(() => onActivatePlatelet(), 200);
      return () => clearTimeout(timer);
    }
  }, [state.parCleavageState, state.plateletActivated, onActivatePlatelet]);

  const handlePARClick = (): void => {
    if (state.parCleavageState === 'thrombin-bound' && onPARCleave) {
      onPARCleave();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Bloodstream background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: layout.bloodstreamHeight,
          background: '#F8FAFC',
          borderBottom: '2px solid #E2E8F0',
        }}
      />

      {/* Membrane */}
      <div
        style={{
          position: 'absolute',
          top: layout.membraneY,
          left: 0,
          width: '100%',
          height: layout.membraneHeight,
        }}
      >
        <PhospholipidMembrane
          width={width}
          height={layout.membraneHeight}
          variant="platelet"
          showPSExposure={state.plateletActivated}
        />
        {state.plateletActivated && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Phase label inside membrane - centered vertically */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            textAlign: 'center',
          }}
        >
          {isDormant ? 'TROMBOCIT CIRCULANT' :
           isBurst ? 'EXPLOZIA DE TROMBINĂ' :
           isClotting ? 'FAZA 4 · COAGULARE' :
           isStable ? 'FAZA 4 · CHEAG STABIL' :
           'FAZA 2-3 · AMPLIFICARE + PROPAGARE'}
        </div>
      </div>


      {/* Platelet visualization - visible in dormant and active states */}
      {(isDormant || (isActive && !state.fxiActivated && !state.vwfSplit && !state.fvActivated)) && (
        <div
          style={{
            position: 'absolute',
            top: layout.bloodstreamHeight * 0.55,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          {state.plateletActivated ? (
            /* Activated platelet - organic shape with pseudopods */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg
                width="200"
                height="110"
                viewBox="0 0 200 110"
                style={{ animation: 'plateletMorph 1.5s ease-out' }}
              >
                <defs>
                  <linearGradient id="activatedPlateletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F1F5F9" />
                    <stop offset="50%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>
                  <filter id="plateletGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Organic activated platelet shape with pseudopods - curved, natural */}
                <path
                  d="M100,10
                     C115,8 125,15 135,5
                     C140,12 138,25 145,30
                     C155,32 170,28 175,40
                     C178,50 168,55 175,65
                     C170,75 155,72 150,80
                     C145,90 140,95 130,100
                     C120,105 110,98 100,102
                     C90,98 80,105 70,100
                     C60,95 55,90 50,80
                     C45,72 30,75 25,65
                     C32,55 22,50 25,40
                     C30,28 45,32 55,30
                     C62,25 60,12 65,5
                     C75,15 85,8 100,10
                     Z"
                  fill="url(#activatedPlateletGrad)"
                  stroke="#94A3B8"
                  strokeWidth={3}
                  filter="url(#plateletGlow)"
                />
                <text x="100" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#64748B">
                  Trombocit activat
                </text>
                <text x="100" y="60" textAnchor="middle" fontSize="8" fill="#94A3B8">
                  Formare pseudopode
                </text>
                <text x="100" y="73" textAnchor="middle" fontSize="8" fill="#94A3B8">
                  Expunere fosfatidilserină
                </text>
              </svg>
            </div>
          ) : (
            /* Inactive platelet - round/ellipse shape */
            <div
              style={{
                width: 180,
                height: 80,
                background: 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)',
                borderRadius: '50%',
                border: '3px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}
            >
              <span style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>
                Trombocit inactiv
              </span>
            </div>
          )}
        </div>
      )}

      {/* ============ UNIFIED VIEW: AMPLIFICATION + PROPAGATION ============ */}
      {/* Both zones visible when thrombin arrives, gated by prerequisites */}
      {isActive && !isClotting && !isStable && (
        <UnifiedPlateletView
          width={width}
          membraneY={layout.membraneY}
          bloodstreamHeight={layout.bloodstreamHeight}
          tenaseX={layout.tenaseX}
          prothrombinaseX={layout.prothrombinaseX}
          complexY={layout.complexY}
          state={state}
          onActivateFactor={onActivateFactor}
          onPARClick={handlePARClick}
          onFormTenase={() => onFormComplex('tenase')}
          onProduceFXa={() => onProduceFXa?.()}
          onFormProthrombinase={() => onFormComplex('prothrombinase')}
          onTriggerBurst={() => onFormComplex('burst')}
          canFormTenase={canFormTenase}
          canProduceFXa={canProduceFXaButton}
          canFormProthrombinase={canFormProthrombinase}
          canBurst={canBurst}
          isAutoMode={isAutoMode}
          fixaMigrating={fixaMigrating}
        />
      )}

      {/* FIXa migration animation is now handled inside UnifiedPlateletView */}

      {/* ============ CLOTTING PHASE ============ */}
      {(isClotting || isStable) && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            bottom: layout.membraneY + 20,
            zIndex: 15,
          }}
        >
          <FibrinMesh
            width={width}
            height={layout.bloodstreamHeight - 80}
            fibrinogenCleaved={state.fibrinogenCleaved}
            fibrinPolymerized={state.fibrinPolymerized}
            fxiiiActivated={state.fxiiiActivated}
            fibrinCrosslinked={state.fibrinCrosslinked}
          />

          {/* FXIII activation button (manual mode only) - clean style */}
          {state.fxiiiActivated && !state.fibrinCrosslinked && !isAutoMode && (
            <div
              style={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 25,
              }}
            >
              <button
                type="button"
                onClick={() => onCrosslinkFibrin?.()}
                style={{
                  padding: '10px 20px',
                  background: '#059669',
                  border: 'none',
                  borderRadius: 6,
                  color: '#FFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Stabilizează cheagul (FXIII)
              </button>
            </div>
          )}

          {/* Auto-crosslink indicator */}
          {state.fxiiiActivated && !state.fibrinCrosslinked && isAutoMode && (
            <div
              style={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 12px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 6,
                zIndex: 25,
              }}
            >
              <div style={{ color: '#059669', fontSize: 11, fontWeight: 500 }}>
                Cross-linking în curs...
              </div>
            </div>
          )}

          {/* Stable clot indicator */}
          {state.fibrinCrosslinked && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                border: '2px solid #10B981',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
                zIndex: 30,
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
                CHEAG STABIL
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion handled by parent component - no duplicate overlay here */}


      {/* CSS Animations - Simple, GPU-optimized */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes dash {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes burstRadiate {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes dockToMembrane {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vwfFloat {
          from { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          to { opacity: 0; transform: translate(70px, -45px) rotate(15deg); }
        }
        @keyframes victoryAppear {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes substrateApproach {
          0%, 100% { transform: translateY(-50%) translateX(-15px); opacity: 0.3; }
          50% { transform: translateY(-50%) translateX(0); opacity: 0.9; }
        }
        @keyframes productExit {
          0%, 100% { transform: translateY(-50%) translateX(-10px); opacity: 0.3; }
          50% { transform: translateY(-50%) translateX(5px); opacity: 1; }
        }
        @keyframes fixaMigration {
          0%, 100% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(12px); opacity: 1; }
        }
        @keyframes fixaMigrateToTenase {
          0% { opacity: 1; transform: translate(0, 0); }
          100% { opacity: 1; transform: translate(var(--target-x, -200px), var(--target-y, 150px)); }
        }
        @keyframes arrowAppear {
          from { opacity: 0; stroke-dashoffset: 50; }
          to { opacity: 0.5; stroke-dashoffset: 0; }
        }
        @keyframes plateletActivate {
          0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes plateletMorph {
          0% {
            transform: scale(0.7);
            opacity: 0;
            filter: blur(4px);
          }
          20% {
            transform: scale(1.15);
            opacity: 1;
            filter: blur(0);
          }
          40% {
            transform: scale(0.95) rotate(-5deg);
          }
          60% {
            transform: scale(1.08) rotate(3deg);
          }
          80% {
            transform: scale(0.98) rotate(-2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes plateletPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes trailFade {
          0%, 100% { opacity: 0.2; height: 25px; }
          50% { opacity: 0.8; height: 45px; }
        }
      `}</style>
    </div>
  );
}
