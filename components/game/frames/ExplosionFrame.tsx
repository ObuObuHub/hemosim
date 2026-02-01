// components/game/frames/ExplosionFrame.tsx
'use client';

import { useMemo, useEffect } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FibrinMesh } from '../visuals/FibrinMesh';
import { UnifiedPlateletView } from './UnifiedPlateletView';
import { InhibitorToken } from '../tokens/InhibitorToken';
import type { ExplosionState, PlayMode } from '@/hooks/useCascadeState';

interface ExplosionFrameProps {
  width: number;
  height: number;
  state: ExplosionState;
  onActivateFactor: (factorId: string) => void;
  onDockCofactor?: (cofactorId: 'FVa' | 'FVIIIa') => void;
  onFormComplex: (complexType: 'tenase' | 'prothrombinase' | 'burst') => void;
  onFXClick?: () => void;
  onFIIClick?: () => void;
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
  // FIXa is waiting in right panel (arrived from left, waiting for tenase)
  fixaWaiting?: boolean;
  /** Show anticoagulant system (inhibitor tokens) */
  showAnticoagulant?: boolean;
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
  onFXClick,
  onFIIClick,
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
  fixaWaiting = false,
  showAnticoagulant = false,
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

  // Check prerequisites for substrate activation (not phase-based)
  const canActivateFX = state.tenaseFormed && state.plateletFxActivationPhase === 'inactive' && !state.fxaProduced && !isAutoMode;
  const canActivateFII = state.prothrombinaseFormed && state.plateletFiiActivationPhase === 'inactive' && !state.thrombinBurst && !isAutoMode;

  // Handler to enter clotting phase (shows interactive FibrinMesh)
  const handleEnterClottingPhase = (): void => {
    // Just trigger phase transition - FibrinMesh handles the interactive part
    onCleaveFibrinogen?.();
  };

  // Auto-trigger clot formation after burst (auto mode only)
  useEffect(() => {
    if (isAutoMode && state.thrombinBurst && !state.fibrinCrosslinked && onCleaveFibrinogen) {
      const timer = setTimeout(() => {
        // Direct transition to stable clot
        onCleaveFibrinogen();
        onPolymerizeFibrin?.();
        onActivateFXIII?.();
        onCrosslinkFibrin?.();
      }, 2000); // 2s delay after burst
      return () => clearTimeout(timer);
    }
  }, [isAutoMode, state.thrombinBurst, state.fibrinCrosslinked, onCleaveFibrinogen, onPolymerizeFibrin, onActivateFXIII, onCrosslinkFibrin]);

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

  // Auto-form Tenase when FIXa arrived and FVIIIa docked
  useEffect(() => {
    if (state.fixaArrived && state.fviiaDocked && !state.tenaseFormed) {
      const timer = setTimeout(() => onFormComplex('tenase'), 600);
      return () => clearTimeout(timer);
    }
  }, [state.fixaArrived, state.fviiaDocked, state.tenaseFormed, onFormComplex]);

  // Auto-form Prothrombinase when FXa produced and FVa docked
  useEffect(() => {
    if (state.fxaProduced && state.fvaDocked && !state.prothrombinaseFormed) {
      const timer = setTimeout(() => onFormComplex('prothrombinase'), 600);
      return () => clearTimeout(timer);
    }
  }, [state.fxaProduced, state.fvaDocked, state.prothrombinaseFormed, onFormComplex]);

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
        {/* Cell type label with phase info - centered */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}
          >
            {isDormant ? 'TROMBOCIT CIRCULANT' :
             isBurst ? 'EXPLOZIA DE TROMBINĂ' :
             isClotting ? 'FAZA COAGULARE' :
             isStable ? 'CHEAG STABIL' :
             'TROMBOCIT ACTIVAT'}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 8,
              fontFamily: 'system-ui, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              marginTop: 2,
            }}
          >
            {isDormant ? 'În așteptare pentru activare' :
             isBurst ? '~350 nM trombină · ×300,000 amplificare' :
             isClotting ? 'Formarea rețelei de fibrină' :
             isStable ? 'Fibrină cross-linkată (FXIIIa)' :
             'Suprafață fosfatidilserină expusă'}
          </div>
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
                <text x="100" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#64748B" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Trombocit activat
                </text>
                <text x="100" y="60" textAnchor="middle" fontSize="8" fill="#94A3B8" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Formare pseudopode
                </text>
                <text x="100" y="73" textAnchor="middle" fontSize="8" fill="#94A3B8" style={{ fontFamily: 'system-ui, sans-serif' }}>
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
              <span style={{ fontSize: 14, color: '#64748B', fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>
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
          onFXClick={() => onFXClick?.()}
          onFIIClick={() => onFIIClick?.()}
          canActivateFX={canActivateFX}
          canActivateFII={canActivateFII}
          isAutoMode={isAutoMode}
          fixaMigrating={fixaMigrating}
          fixaWaiting={fixaWaiting}
          burstPhase={state.burstPhase}
          fxiaActivatingFix={state.fxiaActivatingFix}
          fxiaFixaProduced={state.fxiaFixaProduced}
        />
      )}

      {/* ============ MANUAL MODE: Single "Formează Cheag" button (during burst phase) ============ */}
      {!isAutoMode && state.thrombinBurst && !state.fibrinCrosslinked && !isClotting && !isStable && (
        <div
          style={{
            position: 'absolute',
            bottom: layout.membraneY + 40,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
          }}
        >
          <button
            type="button"
            onClick={handleEnterClottingPhase}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#FFF',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
            }}
          >
            Formarea cheagului
          </button>
        </div>
      )}

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
          {/* FibrinMesh diagram - interactive clot formation */}
          <FibrinMesh
            width={width}
            height={layout.bloodstreamHeight - 80}
            isStable={state.fibrinCrosslinked}
            onClotStabilized={() => {
              // When user completes both interactions, trigger state updates
              if (!state.fibrinCrosslinked) {
                onCleaveFibrinogen?.();
                onPolymerizeFibrin?.();
                onActivateFXIII?.();
                onCrosslinkFibrin?.();
              }
            }}
          />
        </div>
      )}

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
        @keyframes stableClotAppear {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.8);
          }
          50% {
            transform: translateX(-50%) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
        @keyframes fadeInAnticoagulant {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Anticoagulant System */}
      {showAnticoagulant && (
        <>
          {/* AT (Antithrombin) - inhibits FIIa, FXa, FIXa, FXIa */}
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              animation: 'fadeInAnticoagulant 0.3s ease-out',
            }}
          >
            <InhibitorToken
              color="#06B6D4"
              label="AT"
              width={40}
              height={36}
            />
            <div style={{ fontSize: 7, color: '#06B6D4', fontWeight: 600, fontFamily: 'system-ui' }}>
              Antitrombină
            </div>
          </div>

          {/* aPC (Activated Protein C) - inhibits FVa, FVIIIa */}
          <div
            style={{
              position: 'absolute',
              right: 60,
              top: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              animation: 'fadeInAnticoagulant 0.3s ease-out 0.1s both',
            }}
          >
            <InhibitorToken
              color="#EC4899"
              label="aPC"
              width={40}
              height={36}
            />
            <div style={{ fontSize: 7, color: '#EC4899', fontWeight: 600, fontFamily: 'system-ui' }}>
              Prot. C act.
            </div>
          </div>

          {/* Plasmin - inhibits Fibrin (only show if fibrin exists) */}
          {(isClotting || isStable) && (
            <div
              style={{
                position: 'absolute',
                right: 108,
                top: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                animation: 'fadeInAnticoagulant 0.3s ease-out 0.2s both',
              }}
            >
              <InhibitorToken
                color="#F97316"
                label="Plasmin"
                width={40}
                height={36}
              />
              <div style={{ fontSize: 7, color: '#F97316', fontWeight: 600, fontFamily: 'system-ui' }}>
                Fibrinoliză
              </div>
            </div>
          )}

          {/* Inhibition arrows overlay */}
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <marker
                id="inhibit-arrow-at"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L3,3 Z" fill="#06B6D4" />
              </marker>
              <marker
                id="inhibit-arrow-apc"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L3,3 Z" fill="#EC4899" />
              </marker>
              <marker
                id="inhibit-arrow-plasmin"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L3,3 Z" fill="#F97316" />
              </marker>
            </defs>

            {/* AT inhibition arrows - to thrombin area */}
            {state.thrombinBurst && (
              <g opacity={0.7}>
                <line
                  x1={width - 32}
                  y1={50}
                  x2={width * 0.5}
                  y2={layout.burstY + 20}
                  stroke="#06B6D4"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  markerEnd="url(#inhibit-arrow-at)"
                />
                <text
                  x={width * 0.7}
                  y={layout.burstY - 5}
                  fill="#06B6D4"
                  fontSize={10}
                  fontWeight={700}
                >
                  ⊣
                </text>
              </g>
            )}

            {/* aPC inhibition arrows - to FVa and FVIIIa positions */}
            {(state.fvaDocked || state.fviiaDocked) && (
              <g opacity={0.7}>
                {state.fvaDocked && (
                  <>
                    <line
                      x1={width - 80}
                      y1={50}
                      x2={layout.prothrombinaseX - 20}
                      y2={layout.complexY - 10}
                      stroke="#EC4899"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                      markerEnd="url(#inhibit-arrow-apc)"
                    />
                    <text
                      x={layout.prothrombinaseX + 10}
                      y={layout.complexY - 30}
                      fill="#EC4899"
                      fontSize={10}
                      fontWeight={700}
                    >
                      ⊣FVa
                    </text>
                  </>
                )}
                {state.fviiaDocked && (
                  <>
                    <line
                      x1={width - 80}
                      y1={50}
                      x2={layout.tenaseX + 20}
                      y2={layout.complexY - 10}
                      stroke="#EC4899"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                      markerEnd="url(#inhibit-arrow-apc)"
                    />
                    <text
                      x={layout.tenaseX - 25}
                      y={layout.complexY - 30}
                      fill="#EC4899"
                      fontSize={10}
                      fontWeight={700}
                    >
                      ⊣FVIIIa
                    </text>
                  </>
                )}
              </g>
            )}

            {/* Plasmin inhibition arrow - to fibrin */}
            {(isClotting || isStable) && (
              <g opacity={0.7}>
                <line
                  x1={width - 128}
                  y1={50}
                  x2={width * 0.5}
                  y2={layout.membraneY - 30}
                  stroke="#F97316"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  markerEnd="url(#inhibit-arrow-plasmin)"
                />
                <text
                  x={width * 0.45}
                  y={layout.membraneY - 45}
                  fill="#F97316"
                  fontSize={10}
                  fontWeight={700}
                >
                  ⊣Fibrină
                </text>
              </g>
            )}
          </svg>
        </>
      )}
    </div>
  );
}
