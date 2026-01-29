// components/game/frames/ExplosionFrame.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { PARReceptor } from '../visuals/PARReceptor';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { FibrinMesh } from '../visuals/FibrinMesh';
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

  // Track burst effect for animations
  const [showBurstEffect, setShowBurstEffect] = useState(false);
  useEffect(() => {
    if (state.thrombinBurst) {
      setShowBurstEffect(true);
    }
  }, [state.thrombinBurst]);

  // Check prerequisites for complex formation (not phase-based)
  const allCofactorsDocked = state.fvaDocked && state.fviiaDocked;
  const canFormTenase = state.fixaArrived && state.fviiaDocked && !state.tenaseFormed && !isAutoMode;
  const canProduceFXaButton = state.tenaseFormed && !state.fxaProduced && !isAutoMode;
  const canFormProthrombinase = state.fxaProduced && state.fvaDocked && !state.prothrombinaseFormed && !isAutoMode;
  const canBurst = state.prothrombinaseFormed && !state.thrombinBurst && !isAutoMode;

  // Auto-trigger fibrin formation after burst
  useEffect(() => {
    if (state.thrombinBurst && !state.fibrinogenCleaved && onCleaveFibrinogen) {
      const timer = setTimeout(() => onCleaveFibrinogen(), 1500);
      return () => clearTimeout(timer);
    }
  }, [state.thrombinBurst, state.fibrinogenCleaved, onCleaveFibrinogen]);

  // Auto-polymerize fibrin after cleavage
  useEffect(() => {
    if (state.fibrinogenCleaved && !state.fibrinPolymerized && onPolymerizeFibrin) {
      const timer = setTimeout(() => onPolymerizeFibrin(), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.fibrinogenCleaved, state.fibrinPolymerized, onPolymerizeFibrin]);

  // Auto-activate FXIII after polymerization
  useEffect(() => {
    if (state.fibrinPolymerized && !state.fxiiiActivated && onActivateFXIII) {
      const timer = setTimeout(() => onActivateFXIII(), 1000);
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
        {/* Phase label inside membrane */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {isDormant ? 'TROMBOCIT CIRCULANT' :
           isBurst ? 'THROMBIN BURST' :
           isClotting ? 'FAZA 4 · COAGULARE' :
           isStable ? 'FAZA 4 · CHEAG STABIL' :
           'FAZA 2-3 · AMPLIFICARE + PROPAGARE'}
        </div>
      </div>


      {/* Resting Platelet - Circulating state (not "waiting") */}
      {isDormant && (
        <div
          style={{
            position: 'absolute',
            top: layout.bloodstreamHeight * 0.35,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          {/* Resting platelet visualization */}
          <div
            style={{
              width: 140,
              height: 70,
              margin: '0 auto',
              background: 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)',
              borderRadius: '50%',
              border: '3px solid #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              Trombocit inactiv
            </span>
          </div>
        </div>
      )}

      {/* ============ UNIFIED VIEW: AMPLIFICATION + PROPAGATION ============ */}
      {/* Both zones visible when thrombin arrives, gated by prerequisites */}
      {isActive && !isClotting && !isStable && (
        <UnifiedPlateletView
          width={width}
          height={height}
          membraneY={layout.membraneY}
          bloodstreamHeight={layout.bloodstreamHeight}
          topZoneEnd={layout.topZoneEnd}
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
        @keyframes fixaMigrateDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(var(--target-y, 150px)); }
        }
        @keyframes trailFade {
          0%, 100% { opacity: 0.2; height: 25px; }
          50% { opacity: 0.8; height: 45px; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// UNIFIED PLATELET VIEW - Combines Amplification + Propagation
// =============================================================================

interface UnifiedPlateletViewProps {
  width: number;
  height: number;
  membraneY: number;
  bloodstreamHeight: number;
  topZoneEnd: number;
  tenaseX: number;
  prothrombinaseX: number;
  complexY: number;
  state: ExplosionState;
  onActivateFactor: (factorId: string) => void;
  onPARClick: () => void;
  onFormTenase: () => void;
  onProduceFXa: () => void;
  onFormProthrombinase: () => void;
  onTriggerBurst: () => void;
  canFormTenase: boolean;
  canProduceFXa: boolean;
  canFormProthrombinase: boolean;
  canBurst: boolean;
  isAutoMode: boolean;
  fixaMigrating: boolean;
}

function UnifiedPlateletView({
  width,
  height,
  membraneY,
  bloodstreamHeight,
  topZoneEnd,
  tenaseX,
  prothrombinaseX,
  complexY,
  state,
  onActivateFactor,
  onPARClick,
  onFormTenase,
  onProduceFXa,
  onFormProthrombinase,
  onTriggerBurst,
  canFormTenase,
  canProduceFXa,
  canFormProthrombinase,
  canBurst,
  isAutoMode,
  fixaMigrating,
}: UnifiedPlateletViewProps): React.ReactElement {
  // ===== TOP ZONE: Cofactor Activation =====
  const topRowY = bloodstreamHeight * 0.15;
  const thrombinY = bloodstreamHeight * 0.32;
  const activatedRowY = topZoneEnd - 20;

  // PAR receptor position
  const parX = width * 0.08;

  // Factor positions in top zone - aligned above their respective complexes
  // FVIII-vWF above Tenase (FVIIIa goes to Tenase)
  // FV above Prothrombinase (FVa goes to Prothrombinase)
  const factorXPositions = {
    fxi: width * 0.15,           // Left side (FXIa docks to membrane middle)
    fviii: tenaseX,              // Above Tenase (FVIIIa → Tenase)
    fv: prothrombinaseX,         // Above Prothrombinase (FVa → Prothrombinase)
  };

  const thrombinX = width * 0.45;

  // Burst particles for thrombin burst visualization
  const burstParticles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(angle) * 40,
      y: Math.sin(angle) * 30,
      delay: i * 0.08,
    };
  });

  return (
    <>
      {/* ========== TOP ZONE: COFACTOR ACTIVATION ========== */}

      {/* Ghost slot for IIa (before thrombin arrives) */}
      {!state.thrombinArrived && (
        <div
          style={{
            position: 'absolute',
            left: thrombinX,
            top: thrombinY,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.05)',
              border: '2px dashed rgba(220, 38, 38, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(220, 38, 38, 0.3)',
            }}
          >
            IIa
          </div>
          <div
            style={{
              padding: '2px 8px',
              background: 'rgba(220, 38, 38, 0.05)',
              border: '1px dashed rgba(220, 38, 38, 0.2)',
              borderRadius: 4,
              fontSize: 8,
              fontWeight: 600,
              color: 'rgba(220, 38, 38, 0.3)',
            }}
          >
            TROMBINĂ
          </div>
        </div>
      )}

      {/* Central Thrombin (IIa) - solid display (no entry animation, token arrives from cross-frame migration) */}
      {state.thrombinArrived && !state.thrombinBurst && (
        <div
          style={{
            position: 'absolute',
            left: thrombinX,
            top: thrombinY,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              border: '3px solid #FEE2E2',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
              animation: 'thrombinPulse 2s ease-in-out infinite',
            }}
          >
            IIa
          </div>
          <div
            style={{
              padding: '2px 8px',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid #DC2626',
              borderRadius: 4,
              fontSize: 8,
              fontWeight: 600,
              color: '#DC2626',
            }}
          >
            TROMBINĂ
          </div>
        </div>
      )}

      {/* Inactive factors (top row) */}
      {!state.fxiActivated && (
        <FactorSlot
          x={factorXPositions.fxi}
          y={topRowY}
          factorId="FXI"
          onClick={() => state.thrombinArrived && !isAutoMode && onActivateFactor('FXI')}
          disabled={!state.thrombinArrived || isAutoMode}
        />
      )}

      {!state.fvActivated && (
        <FactorSlot
          x={factorXPositions.fv}
          y={topRowY}
          factorId="FV"
          onClick={() => state.thrombinArrived && !isAutoMode && onActivateFactor('FV')}
          disabled={!state.thrombinArrived || isAutoMode}
        />
      )}

      {/* FVIII-vWF Complex */}
      {!state.vwfSplit && (
        <div
          style={{
            position: 'absolute',
            left: factorXPositions.fviii,
            top: topRowY,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 8,
            border: state.thrombinArrived && !isAutoMode ? '2px solid #22C55E' : '2px solid #E2E8F0',
            cursor: state.thrombinArrived && !isAutoMode ? 'pointer' : 'default',
            opacity: state.thrombinArrived ? 1 : 0.5,
            zIndex: 10,
          }}
          onClick={() => state.thrombinArrived && !isAutoMode && onActivateFactor('vWF-VIII')}
        >
          <FactorTokenNew factorId="FVIII" isActive={false} enableHover={state.thrombinArrived} />
          <span style={{ color: '#64748B', fontSize: 9 }}>─</span>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 7,
              fontWeight: 700,
              color: '#FFFFFF',
              border: '2px solid white',
            }}
          >
            vWF
          </div>
        </div>
      )}

      {/* vWF floating away */}
      {state.vwfSplit && !state.fviiaDocked && (
        <div
          style={{
            position: 'absolute',
            left: factorXPositions.fviii + 35,
            top: topRowY - 15,
            animation: 'vwfFloat 1.5s ease-out forwards',
            zIndex: 15,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 6,
              fontWeight: 700,
              color: '#FFFFFF',
              border: '2px solid white',
            }}
          >
            vWF
          </div>
        </div>
      )}

      {/* FVIIIa descending to Tenase complex after vWF split */}
      {state.vwfSplit && !state.fviiaDocked && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX - 18,
            top: topRowY,
            zIndex: 25,
            animation: 'cofactorDock 1s ease-out forwards',
            ['--dock-distance' as string]: `${complexY - topRowY - 10}px`,
          }}
        >
          <div style={{ transform: 'translateX(-50%)' }}>
            <FactorTokenNew factorId="FVIIIa" isActive={true} enableHover={false} />
          </div>
        </div>
      )}

      {/* FVa descending to Prothrombinase complex after activation */}
      {state.fvActivated && !state.fvaDocked && (
        <div
          style={{
            position: 'absolute',
            left: prothrombinaseX - 18,
            top: topRowY,
            zIndex: 25,
            animation: 'cofactorDock 1s ease-out forwards',
            ['--dock-distance' as string]: `${complexY - topRowY - 10}px`,
          }}
        >
          <div style={{ transform: 'translateX(-50%)' }}>
            <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
          </div>
        </div>
      )}

      {/* FXIa - docks to platelet membrane in the middle after activation */}
      {/* Medical note: FXIa binds to platelet membrane via GPIb receptor */}
      {state.fxiActivated && (
        <div
          style={{
            position: 'absolute',
            left: (tenaseX + prothrombinaseX) / 2,
            top: membraneY - 28,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 12,
            animation: 'dockToMembrane 1s ease-out',
          }}
        >
          <FactorTokenNew factorId="FXIa" isActive={true} enableHover={false} />
          {/* GPIb anchor indicator */}
          <div
            style={{
              marginTop: 2,
              width: 2,
              height: 12,
              background: 'linear-gradient(180deg, #EC4899 0%, #DB2777 100%)',
              borderRadius: 1,
            }}
          />
          <div style={{ fontSize: 5, color: '#EC4899', fontWeight: 600, marginTop: 1 }}>GPIb</div>
        </div>
      )}

      {/* PAR Receptor */}
      <PARReceptor
        x={parX + 35}
        y={membraneY - 65}
        state={state.parCleavageState}
        onClick={onPARClick}
        isClickable={state.parCleavageState === 'thrombin-bound' && !isAutoMode}
        scale={0.85}
      />

      {/* Thrombin activation arrows - elegant dashed lines showing activation targets */}
      {state.thrombinArrived && !state.thrombinBurst && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        >
          <defs>
            <marker id="arrow-thrombin-small" markerWidth="4" markerHeight="3" refX="4" refY="1.5" orient="auto">
              <path d="M0,0 L4,1.5 L0,3 Z" fill="#F97316" fillOpacity="0.7" />
            </marker>
          </defs>

          {/* Thrombin → PAR (elegant curve to bottom-left) */}
          {state.parCleavageState !== 'activated' && (
            <path
              d={`M ${thrombinX - 25} ${thrombinY + 15}
                  C ${thrombinX - 100} ${thrombinY + 80},
                    ${parX + 80} ${membraneY - 140},
                    ${parX + 45} ${membraneY - 75}`}
              stroke="#F97316"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              fill="none"
              markerEnd="url(#arrow-thrombin-small)"
              strokeLinecap="round"
            />
          )}

          {/* Thrombin → FXI (curve to top-left) */}
          {!state.fxiActivated && (
            <path
              d={`M ${thrombinX - 25} ${thrombinY - 10}
                  C ${thrombinX - 80} ${thrombinY - 25},
                    ${factorXPositions.fxi + 50} ${topRowY + 30},
                    ${factorXPositions.fxi + 25} ${topRowY + 18}`}
              stroke="#F97316"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              fill="none"
              markerEnd="url(#arrow-thrombin-small)"
              strokeLinecap="round"
            />
          )}

          {/* Thrombin → FVIII-vWF (gentle curve up-left to Tenase area) */}
          {!state.vwfSplit && (
            <path
              d={`M ${thrombinX - 15} ${thrombinY - 20}
                  C ${thrombinX - 30} ${thrombinY - 50},
                    ${factorXPositions.fviii + 30} ${topRowY + 50},
                    ${factorXPositions.fviii} ${topRowY + 35}`}
              stroke="#F97316"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              fill="none"
              markerEnd="url(#arrow-thrombin-small)"
              strokeLinecap="round"
            />
          )}

          {/* Thrombin → FV (gentle curve up-right to Prothrombinase area) */}
          {!state.fvActivated && (
            <path
              d={`M ${thrombinX + 25} ${thrombinY - 10}
                  C ${thrombinX + 80} ${thrombinY - 30},
                    ${factorXPositions.fv - 30} ${topRowY + 50},
                    ${factorXPositions.fv} ${topRowY + 35}`}
              stroke="#F97316"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              fill="none"
              markerEnd="url(#arrow-thrombin-small)"
              strokeLinecap="round"
            />
          )}
        </svg>
      )}

      {/* ========== BOTTOM ZONE: COMPLEX FORMATION ========== */}

      {/* FIXa migration animation */}
      {fixaMigrating && !state.fixaArrived && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX,
            top: 0,
            zIndex: 100,
            animation: 'fixaMigrateDown 1.2s ease-out forwards',
            ['--target-y' as string]: `${complexY - 30}px`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translateX(-50%)',
              filter: 'drop-shadow(0 4px 16px rgba(6, 182, 212, 0.6))',
            }}
          >
            <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
            <div
              style={{
                marginTop: 4,
                padding: '3px 8px',
                background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                borderRadius: 5,
                fontSize: 8,
                fontWeight: 700,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
              }}
            >
              FIXa → Tenază
            </div>
          </div>
        </div>
      )}

      {/* TENASE COMPLEX */}
      <div
        style={{
          position: 'absolute',
          left: tenaseX,
          top: complexY,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {state.tenaseFormed ? (
          <TenaseComplex
            isProducing={!state.fxaProduced}
            onProduce={onProduceFXa}
            canProduce={canProduceFXa}
            isAutoMode={isAutoMode}
          />
        ) : (
          <ComplexAssemblySlot
            name="TENAZĂ"
            enzyme={{ id: 'FIXa', ready: state.fixaArrived }}
            cofactor={{ id: 'FVIIIa', ready: state.fviiaDocked }}
            canForm={canFormTenase}
            onForm={onFormTenase}
            color="#06B6D4"
            isAutoMode={isAutoMode}
          />
        )}
      </div>

      {/* FXa flow arrow (Tenase → Prothrombinase) */}
      {state.fxaProduced && !state.prothrombinaseFormed && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <defs>
            <marker id="fxa-flow-arrow" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
              <polygon points="0 0, 10 4, 0 8" fill="#22C55E" />
            </marker>
          </defs>
          <path
            d={`M ${tenaseX + 70} ${complexY}
                Q ${(tenaseX + prothrombinaseX) / 2} ${complexY - 40}
                ${prothrombinaseX - 70} ${complexY}`}
            stroke="#22C55E"
            strokeWidth={3}
            strokeDasharray="8 4"
            fill="none"
            markerEnd="url(#fxa-flow-arrow)"
            style={{ animation: 'dashFlow 1s linear infinite' }}
          />
          <g transform={`translate(${(tenaseX + prothrombinaseX) / 2}, ${complexY - 50})`}>
            <rect x={-30} y={-12} width={60} height={24} rx={5} fill="#DCFCE7" stroke="#22C55E" strokeWidth={2} />
            <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#15803D">
              FXa →
            </text>
          </g>
        </svg>
      )}

      {/* PROTHROMBINASE COMPLEX */}
      <div
        style={{
          position: 'absolute',
          left: prothrombinaseX,
          top: complexY,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {state.prothrombinaseFormed ? (
          <ProthrombinaseComplex
            isProducing={!state.thrombinBurst}
            onTriggerBurst={onTriggerBurst}
            canBurst={canBurst}
            isAutoMode={isAutoMode}
          />
        ) : (
          <ComplexAssemblySlot
            name="PROTROMBINAZĂ"
            enzyme={{ id: 'FXa', ready: state.fxaProduced ?? false }}
            cofactor={{ id: 'FVa', ready: state.fvaDocked }}
            canForm={canFormProthrombinase}
            onForm={onFormProthrombinase}
            color="#DC2626"
            isAutoMode={isAutoMode}
          />
        )}
      </div>

      {/* THROMBIN BURST */}
      {state.thrombinBurst && (
        <div
          style={{
            position: 'absolute',
            right: 30,
            top: complexY,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', width: 100, height: 80 }}>
            {burstParticles.map((p, i) => (
              <div
                key={`burst-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 7,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  border: '2px solid #FEE2E2',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.5)',
                  animation: `burstRadiate 0.6s ease-out ${p.delay}s both`,
                }}
              >
                IIa
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 35,
                height: 35,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
                animation: 'burstPulse 2s ease-in-out infinite',
              }}
            />
          </div>
          <div
            style={{
              marginTop: 6,
              padding: '5px 10px',
              background: '#FEE2E2',
              border: '2px solid #DC2626',
              borderRadius: 5,
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#DC2626', fontSize: 10, fontWeight: 700 }}>
              THROMBIN BURST
            </div>
            <div style={{ color: '#991B1B', fontSize: 8, marginTop: 1 }}>
              ~350 nM
            </div>
          </div>
        </div>
      )}

      {/* Gla domain anchors with PS and Ca²⁺ */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {/* PS markers */}
        {(state.tenaseFormed || state.prothrombinaseFormed) && (
          <g>
            {[tenaseX - 30, tenaseX - 10, tenaseX + 10, tenaseX + 30,
              prothrombinaseX - 30, prothrombinaseX - 10, prothrombinaseX + 10, prothrombinaseX + 30].map((x, i) => (
              <g key={`ps-${i}`}>
                <circle
                  cx={x}
                  cy={membraneY - 3}
                  r={4}
                  fill="#DC2626"
                  opacity={0.6}
                  style={{ animation: `psPulse 2s ease-in-out ${i * 0.15}s infinite` }}
                />
                <text x={x} y={membraneY + 7} textAnchor="middle" fontSize={4} fill="#DC2626" fontWeight={600}>PS</text>
              </g>
            ))}
          </g>
        )}

        {/* TENASE membrane anchoring - medically accurate */}
        {/* FVIIIa (cofactor, left): C2 domain - direct PS binding */}
        {/* FIXa (enzyme, right): Gla domain + Ca²⁺ */}
        {state.tenaseFormed && (
          <g>
            {/* FVIIIa - C2 domain anchor (cofactor, no Gla) */}
            <line x1={tenaseX - 18} y1={complexY + 45} x2={tenaseX - 18} y2={membraneY - 12} stroke="#A855F7" strokeWidth={2} opacity={0.6} />
            <rect x={tenaseX - 24} y={membraneY - 20} width={12} height={8} rx={2} fill="#A855F7" stroke="#7C3AED" strokeWidth={1} />
            <text x={tenaseX - 18} y={membraneY - 14} textAnchor="middle" fontSize={5} fill="#FFF" fontWeight={600}>C2</text>

            {/* FIXa - Gla domain + Ca²⁺ (enzyme, vitamin K-dependent) */}
            <line x1={tenaseX + 18} y1={complexY + 45} x2={tenaseX + 18} y2={membraneY - 15} stroke="#22C55E" strokeWidth={2} strokeDasharray="3 2" opacity={0.7} />
            <circle cx={tenaseX + 18} cy={membraneY - 18} r={5} fill="#22C55E" stroke="#15803D" strokeWidth={1.5} />
            <text x={tenaseX + 18} y={membraneY - 15} textAnchor="middle" fontSize={4} fill="#FFF" fontWeight={700}>Gla</text>
            {/* Ca²⁺ bridge */}
            <circle cx={tenaseX + 18} cy={membraneY - 9} r={2.5} fill="#F59E0B" stroke="#D97706" strokeWidth={1}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text x={tenaseX + 28} y={membraneY - 7} fontSize={4} fill="#D97706" fontWeight={600}>Ca²⁺</text>
          </g>
        )}

        {/* PROTHROMBINASE membrane anchoring - medically accurate */}
        {/* FVa (cofactor, left): C2 domain - direct PS binding */}
        {/* FXa (enzyme, right): Gla domain + Ca²⁺ */}
        {state.prothrombinaseFormed && (
          <g>
            {/* FVa - C2 domain anchor (cofactor, no Gla) */}
            <line x1={prothrombinaseX - 18} y1={complexY + 45} x2={prothrombinaseX - 18} y2={membraneY - 12} stroke="#F97316" strokeWidth={2} opacity={0.6} />
            <rect x={prothrombinaseX - 24} y={membraneY - 20} width={12} height={8} rx={2} fill="#F97316" stroke="#EA580C" strokeWidth={1} />
            <text x={prothrombinaseX - 18} y={membraneY - 14} textAnchor="middle" fontSize={5} fill="#FFF" fontWeight={600}>C2</text>

            {/* FXa - Gla domain + Ca²⁺ (enzyme, vitamin K-dependent) */}
            <line x1={prothrombinaseX + 18} y1={complexY + 45} x2={prothrombinaseX + 18} y2={membraneY - 15} stroke="#22C55E" strokeWidth={2} strokeDasharray="3 2" opacity={0.7} />
            <circle cx={prothrombinaseX + 18} cy={membraneY - 18} r={5} fill="#22C55E" stroke="#15803D" strokeWidth={1.5} />
            <text x={prothrombinaseX + 18} y={membraneY - 15} textAnchor="middle" fontSize={4} fill="#FFF" fontWeight={700}>Gla</text>
            {/* Ca²⁺ bridge */}
            <circle cx={prothrombinaseX + 18} cy={membraneY - 9} r={2.5} fill="#F59E0B" stroke="#D97706" strokeWidth={1}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <text x={prothrombinaseX + 28} y={membraneY - 7} fontSize={4} fill="#D97706" fontWeight={600}>Ca²⁺</text>
          </g>
        )}

        {/* FXIa membrane anchoring - binds via GPIb receptor (middle position) */}
        {/* Medical note: FXI/FXIa binds to platelet GPIbα, not via Gla domain */}
        {state.fxiActivated && (
          <g>
            <circle
              cx={(tenaseX + prothrombinaseX) / 2}
              cy={membraneY - 3}
              r={4}
              fill="#EC4899"
              opacity={0.7}
              style={{ animation: 'psPulse 2s ease-in-out infinite' }}
            />
            <text
              x={(tenaseX + prothrombinaseX) / 2}
              y={membraneY + 7}
              textAnchor="middle"
              fontSize={4}
              fill="#EC4899"
              fontWeight={600}
            >
              GPIb
            </text>
          </g>
        )}
      </svg>

      {/* CSS Animations */}
      <style>{`
        @keyframes dashAnim {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes dashFlow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes activationPulse {
          0%, 100% { opacity: 0.5; stroke-width: 1.5; }
          50% { opacity: 0.9; stroke-width: 2; }
        }
        @keyframes thrombinPulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.35); transform: scale(1); }
          25% { box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5); transform: scale(1.03); }
          50% { box-shadow: 0 4px 28px rgba(220, 38, 38, 0.65); transform: scale(1.06); }
          75% { box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5); transform: scale(1.03); }
        }
        @keyframes burstRadiate {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes burstPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
        }
        @keyframes psPulse {
          0%, 100% { r: 4; opacity: 0.4; }
          50% { r: 5.5; opacity: 0.8; }
        }
        @keyframes fixaMigrateDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(var(--target-y, 150px)); }
        }
        @keyframes complexPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.15); }
          50% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
        }
        @keyframes cofactorDock {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 1; transform: translateY(var(--dock-distance, 120px)); }
        }
      `}</style>
    </>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FactorSlotProps {
  x: number;
  y: number;
  factorId: string;
  onClick: () => void;
  disabled: boolean;
  isActivated?: boolean;
}

function FactorSlot({
  x,
  y,
  factorId,
  onClick,
  disabled,
  isActivated = false,
}: FactorSlotProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !isActivated ? 0.5 : 1,
        zIndex: 10,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <FactorTokenNew factorId={factorId} isActive={isActivated} enableHover={!disabled} />
    </div>
  );
}

interface ComplexAssemblySlotProps {
  name: string;
  enzyme: { id: string; ready: boolean };
  cofactor: { id: string; ready: boolean };
  canForm: boolean;
  onForm: () => void;
  color: string;
  isAutoMode: boolean;
}

function ComplexAssemblySlot({
  name,
  enzyme,
  cofactor,
  canForm,
  onForm,
  color,
  isAutoMode,
}: ComplexAssemblySlotProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '10px 14px',
        border: `2px dashed ${color}`,
        borderRadius: 8,
        background: `${color}08`,
        cursor: canForm && !isAutoMode ? 'pointer' : 'default',
        animation: canForm ? 'complexPulse 2s ease-in-out infinite' : undefined,
      }}
      onClick={() => canForm && !isAutoMode && onForm()}
    >
      <div
        style={{
          position: 'absolute',
          top: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 7px',
          background: '#FFFFFF',
          border: `1px solid ${color}`,
          borderRadius: 4,
          fontSize: 8,
          color: color,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'flex-start', marginTop: 6 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ transform: cofactor.ready ? 'scale(1.1)' : 'scale(1)', opacity: cofactor.ready ? 1 : 0.3 }}>
            <FactorTokenNew factorId={cofactor.id} isActive={cofactor.ready} enableHover={false} />
          </div>
          <div style={{ fontSize: 7, color: '#64748B', marginTop: 3 }}>{cofactor.id}</div>
        </div>
        <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, marginTop: 10 }}>+</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ transform: enzyme.ready ? 'scale(0.9)' : 'scale(1)', opacity: enzyme.ready ? 1 : 0.3 }}>
            <FactorTokenNew factorId={enzyme.id} isActive={enzyme.ready} enableHover={false} />
          </div>
          <div style={{ fontSize: 7, color: '#64748B', marginTop: 3 }}>{enzyme.id}</div>
        </div>
      </div>

      {canForm && !isAutoMode && (
        <div
          style={{
            marginTop: 6,
            padding: '3px 7px',
            background: color,
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 8,
            fontWeight: 600,
          }}
        >
          FORMEAZĂ
        </div>
      )}
    </div>
  );
}

function TenaseComplex({
  isProducing,
  onProduce,
  canProduce,
  isAutoMode,
}: {
  isProducing: boolean;
  onProduce: () => void;
  canProduce: boolean;
  isAutoMode: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px 20px',
        border: '2px solid #06B6D4',
        borderRadius: 8,
        background: 'rgba(6, 182, 212, 0.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 7px',
          background: '#06B6D4',
          borderRadius: 4,
          fontSize: 8,
          color: '#FFFFFF',
          fontWeight: 600,
        }}
      >
        TENAZĂ
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 6 }}>
        {/* FVIIIa - Cofactor (C2 domain, no Gla) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(1.1)' }}>
            <FactorTokenNew factorId="FVIIIa" isActive={true} enableHover={false} />
          </div>
          <div style={{ fontSize: 6, color: '#A855F7', marginTop: 2, fontWeight: 500 }}>C2</div>
        </div>
        {/* FIXa - Enzyme (Gla domain, vitamin K-dependent) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(0.85)' }}>
            <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
          </div>
          <div style={{ fontSize: 6, color: '#22C55E', marginTop: 2, fontWeight: 500 }}>Gla</div>
        </div>
      </div>

      {isProducing && canProduce && !isAutoMode && (
        <div
          style={{
            marginTop: 8,
            padding: '3px 8px',
            background: '#06B6D4',
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onProduce}
        >
          PRODUCE FXa
        </div>
      )}
    </div>
  );
}

function ProthrombinaseComplex({
  isProducing,
  onTriggerBurst,
  canBurst,
  isAutoMode,
}: {
  isProducing: boolean;
  onTriggerBurst: () => void;
  canBurst: boolean;
  isAutoMode: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px 20px',
        border: '2px solid #3B82F6',
        borderRadius: 8,
        background: 'rgba(59, 130, 246, 0.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 7px',
          background: '#3B82F6',
          borderRadius: 4,
          fontSize: 8,
          color: '#FFFFFF',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        PROTROMBINAZĂ
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 6 }}>
        {/* FVa - Cofactor (C2 domain, no Gla) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(1.1)' }}>
            <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
          </div>
          <div style={{ fontSize: 6, color: '#F97316', marginTop: 2, fontWeight: 500 }}>C2</div>
        </div>
        {/* FXa - Enzyme (Gla domain, vitamin K-dependent) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(0.85)' }}>
            <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
          </div>
          <div style={{ fontSize: 6, color: '#22C55E', marginTop: 2, fontWeight: 500 }}>Gla</div>
        </div>
      </div>

      {isProducing && canBurst && !isAutoMode && (
        <div
          style={{
            marginTop: 8,
            padding: '3px 8px',
            background: '#3B82F6',
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onTriggerBurst}
        >
          THROMBIN BURST
        </div>
      )}
    </div>
  );
}
