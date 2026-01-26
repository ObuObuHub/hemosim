// components/game/frames/ExplosionFrame.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { PARReceptor } from '../visuals/PARReceptor';
import { EnzymeComplex } from '../visuals/EnzymeComplex';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { ActivationParticles } from '../visuals/ActivationParticles';
import { ThrombinBurst } from '../visuals/ThrombinBurst';
import { FibrinMesh } from '../visuals/FibrinMesh';
import { PropagationView } from '../views/PropagationView';
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
}

/**
 * EXPLOSION FRAME - "Amplificare + Propagare" - Platelet surface
 *
 * Faza 2-3 din modelul celular Hoffman-Monroe:
 * - 'dormant': Waiting for thrombin from initiation
 * - 'amplifying': PAR activation, factor activation (FXI, FV, FVIII)
 * - 'propagating': Tenase/Prothrombinase complex formation
 * - 'burst': Thrombin explosion (~350 nM)
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
}: ExplosionFrameProps): React.ReactElement {
  const isAutoMode = mode === 'auto';
  const layout = useMemo(() => {
    const membraneHeight = height * 0.28;
    const bloodstreamHeight = height - membraneHeight;
    const membraneY = bloodstreamHeight;

    return {
      membraneHeight,
      membraneY,
      bloodstreamHeight,
      centerX: width / 2,
      // Complex positions (propagating phase)
      tenaseX: width * 0.3,
      prothrombinaseX: width * 0.7,
      complexY: membraneY - 55,
      burstY: height * 0.15,
    };
  }, [width, height]);

  const isDormant = state.phase === 'dormant';
  const isAmplifying = state.phase === 'amplifying';
  const isPropagating = state.phase === 'propagating';
  const isBurst = state.phase === 'burst';
  const isClotting = state.phase === 'clotting';
  const isStable = state.phase === 'stable';

  // Activation particles state
  const [showParticles, setShowParticles] = useState({
    fviii: false,
    fv: false,
    fxi: false,
    platelet: false,
    tenase: false,
    prothrombinase: false,
  });

  // Trigger particles on activation
  useEffect(() => {
    if (state.vwfSplit) {
      setShowParticles((prev) => ({ ...prev, fviii: true }));
      const timer = setTimeout(() => setShowParticles((prev) => ({ ...prev, fviii: false })), 800);
      return () => clearTimeout(timer);
    }
  }, [state.vwfSplit]);

  useEffect(() => {
    if (state.fvActivated) {
      setShowParticles((prev) => ({ ...prev, fv: true }));
      const timer = setTimeout(() => setShowParticles((prev) => ({ ...prev, fv: false })), 800);
      return () => clearTimeout(timer);
    }
  }, [state.fvActivated]);

  useEffect(() => {
    if (state.fxiActivated) {
      setShowParticles((prev) => ({ ...prev, fxi: true }));
      const timer = setTimeout(() => setShowParticles((prev) => ({ ...prev, fxi: false })), 800);
      return () => clearTimeout(timer);
    }
  }, [state.fxiActivated]);

  useEffect(() => {
    if (state.plateletActivated) {
      setShowParticles((prev) => ({ ...prev, platelet: true }));
      const timer = setTimeout(() => setShowParticles((prev) => ({ ...prev, platelet: false })), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.plateletActivated]);

  useEffect(() => {
    if (state.tenaseFormed) {
      setShowParticles((prev) => ({ ...prev, tenase: true }));
      const timer = setTimeout(() => setShowParticles((prev) => ({ ...prev, tenase: false })), 800);
      return () => clearTimeout(timer);
    }
  }, [state.tenaseFormed]);

  useEffect(() => {
    if (state.prothrombinaseFormed) {
      setShowParticles((prev) => ({ ...prev, prothrombinase: true }));
      const timer = setTimeout(() => setShowParticles((prev) => ({ ...prev, prothrombinase: false })), 800);
      return () => clearTimeout(timer);
    }
  }, [state.prothrombinaseFormed]);

  // Thrombin burst effect
  const [showBurstEffect, setShowBurstEffect] = useState(false);
  useEffect(() => {
    if (state.thrombinBurst) {
      setShowBurstEffect(true);
    }
  }, [state.thrombinBurst]);

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

  // Auto-activate platelet when all factors are activated
  // Educational note: PS exposure requires activated platelet state
  useEffect(() => {
    if (
      state.vwfSplit &&
      state.fvActivated &&
      state.fxiActivated &&
      !state.plateletActivated &&
      onActivatePlatelet
    ) {
      const timer = setTimeout(() => onActivatePlatelet(), 500);
      return () => clearTimeout(timer);
    }
  }, [state.vwfSplit, state.fvActivated, state.fxiActivated, state.plateletActivated, onActivatePlatelet]);

  const handlePARClick = (): void => {
    if (state.parCleavageState === 'thrombin-bound' && onPARCleave) {
      onPARCleave();
    }
  };

  const allCofactorsDocked = state.fvaDocked && state.fviiaDocked;
  const canFormTenase = isPropagating && state.fixaArrived && !state.tenaseFormed && allCofactorsDocked && !isAutoMode;
  const canFormProthrombinase = isPropagating && state.tenaseFormed && !state.prothrombinaseFormed && !isAutoMode;
  const canBurst = isPropagating && state.prothrombinaseFormed && !state.thrombinBurst && !isAutoMode;

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
          {isDormant ? 'ÎN AȘTEPTARE' :
           isAmplifying ? 'FAZA 2 · AMPLIFICARE' :
           isPropagating ? 'FAZA 3 · PROPAGARE' :
           isBurst ? 'FAZA 3 · BURST' :
           isClotting ? 'FAZA 4 · COAGULARE' :
           'FAZA 4 · CHEAG STABIL'}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            color: 'rgba(255,255,255,0.8)',
            fontSize: 9,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {isClotting || isStable ? 'Rețea de fibrină' : 'Suprafața trombocitului'}
        </div>
      </div>


      {/* Dormant Overlay */}
      {isDormant && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(248, 250, 252, 0.9)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              background: '#FFFFFF',
              borderRadius: 8,
              border: '2px solid #CBD5E1',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>ÎN AȘTEPTARE</div>
            <div style={{ color: '#334155', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              Așteaptă trombina din faza de inițiere
            </div>
          </div>
        </div>
      )}

      {/* ============ AMPLIFYING PHASE ============ */}
      {isAmplifying && (
        <>
          {/* Textbook-style layout */}
          <AmplificationView
            width={width}
            height={height}
            membraneY={layout.membraneY}
            bloodstreamHeight={layout.bloodstreamHeight}
            state={state}
            onActivateFactor={onActivateFactor}
            onPARClick={handlePARClick}
            showParticles={showParticles}
            isAutoMode={isAutoMode}
          />
        </>
      )}

      {/* ============ PROPAGATING PHASE ============ */}
      {/* Using dedicated PropagationView for medical-accurate visualization */}
      {/* Keep visible during burst phase for visual continuity */}
      {(isPropagating || isBurst) && (
        <PropagationView
          width={width}
          height={height}
          membraneY={layout.membraneY}
          state={{
            fviiaDocked: state.fviiaDocked,
            fvaDocked: state.fvaDocked,
            fixaArrived: state.fixaArrived,
            tenaseFormed: state.tenaseFormed,
            fxaProduced: state.fxaProduced ?? state.tenaseFormed, // fallback for existing state
            prothrombinaseFormed: state.prothrombinaseFormed,
            thrombinBurst: state.thrombinBurst,
          }}
          onFormTenase={() => onFormComplex('tenase')}
          onFormProthrombinase={() => onFormComplex('prothrombinase')}
          onProduceFXa={() => onProduceFXa?.()}
          onTriggerBurst={() => onFormComplex('burst')}
          isAutoMode={isAutoMode}
        />
      )}

      {/* BURST PHASE visualization handled by PropagationView */}

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

      {/* Progress dots */}
      {!isDormant && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            zIndex: 20,
          }}
        >
          <ProgressDot label="VIII" active={state.vwfSplit} docked={state.fviiaDocked} color="#22C55E" />
          <ProgressDot label="V" active={state.fvActivated} docked={state.fvaDocked} color="#3B82F6" />
          <ProgressDot label="XI" active={state.fxiActivated} color="#EC4899" />
          <ProgressDot label="PLT" active={state.plateletActivated} color="#F59E0B" />
          {(isPropagating || isBurst || isClotting || isStable) && (
            <>
              <ProgressDot label="TEN" active={state.tenaseFormed} color="#06B6D4" />
              <ProgressDot label="PTH" active={state.prothrombinaseFormed} color="#8B5CF6" />
            </>
          )}
          {(isClotting || isStable) && (
            <>
              <ProgressDot label="FIB" active={state.fibrinPolymerized} color="#F59E0B" />
              <ProgressDot label="XIII" active={state.fxiiiActivated} color="#EF4444" />
              <ProgressDot label="STABIL" active={state.fibrinCrosslinked} color="#22C55E" />
            </>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes dash {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes burstRadiate {
          0% { opacity: 0; transform: translate(-50%, -50%) translate(0px, 0px) scale(0.2); }
          60% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes dockToMembrane {
          0% { transform: translateY(-30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes vwfFloat {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(60px, -40px) rotate(15deg); opacity: 0; }
        }
        @keyframes victoryAppear {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes substrateApproach {
          0% { transform: translateY(-50%) translateX(-15px); opacity: 0.3; }
          50% { transform: translateY(-50%) translateX(0px); opacity: 0.8; }
          100% { transform: translateY(-50%) translateX(-15px); opacity: 0.3; }
        }
        @keyframes productExit {
          0% { transform: translateY(-50%) translateX(-10px); opacity: 0.4; }
          50% { transform: translateY(-50%) translateX(5px); opacity: 1; }
          100% { transform: translateY(-50%) translateX(-10px); opacity: 0.4; }
        }
        @keyframes fixaMigration {
          0% { transform: translateX(0); opacity: 0.7; }
          50% { transform: translateX(15px); opacity: 1; }
          100% { transform: translateX(0); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// AMPLIFICATION VIEW - Clean textbook-style layout
// =============================================================================

interface AmplificationViewProps {
  width: number;
  height: number;
  membraneY: number;
  bloodstreamHeight: number;
  state: ExplosionState;
  onActivateFactor: (factorId: string) => void;
  onPARClick: () => void;
  showParticles: {
    fviii: boolean;
    fv: boolean;
    fxi: boolean;
    platelet: boolean;
  };
  isAutoMode?: boolean;
}

function AmplificationView({
  width,
  height,
  membraneY,
  bloodstreamHeight,
  state,
  onActivateFactor,
  onPARClick,
  showParticles,
  isAutoMode = false,
}: AmplificationViewProps): React.ReactElement {
  // Layout positions - adjusted to avoid header overlap
  const topRowY = bloodstreamHeight * 0.22;
  const thrombinY = bloodstreamHeight * 0.48;
  const bottomRowY = membraneY - 40;

  // PAR receptor position - left of FXI
  const parX = width * 0.08;

  // Factor X positions (shifted slightly right to make room for PAR)
  const factorXPositions = {
    fxi: width * 0.22,
    fv: width * 0.45,
    fviii: width * 0.68,
  };

  // Central thrombin position
  const thrombinX = width * 0.45;

  return (
    <>
      {/* ===== CENTRAL THROMBIN - The Key Activator ===== */}
      {state.thrombinArrived && (
        <div
          style={{
            position: 'absolute',
            left: thrombinX,
            top: thrombinY,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              border: '3px solid #FEE2E2',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
              animation: 'thrombinPulseAmp 2s ease-in-out infinite',
            }}
          >
            IIa
          </div>
          <div
            style={{
              padding: '3px 10px',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid #DC2626',
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 600,
              color: '#DC2626',
            }}
          >
            TROMBINĂ
          </div>
        </div>
      )}

      {/* ===== TOP ROW: Inactive factors in plasma ===== */}

      {/* FXI (inactive) */}
      {!state.fxiActivated && (
        <FactorSlot
          x={factorXPositions.fxi}
          y={topRowY}
          factorId="FXI"
          label="FXI"
          onClick={() => state.thrombinArrived && !isAutoMode && onActivateFactor('FXI')}
          disabled={!state.thrombinArrived || isAutoMode}
        />
      )}

      {/* FV (inactive) */}
      {!state.fvActivated && (
        <FactorSlot
          x={factorXPositions.fv}
          y={topRowY}
          factorId="FV"
          label="FV"
          onClick={() => state.thrombinArrived && !isAutoMode && onActivateFactor('FV')}
          disabled={!state.thrombinArrived || isAutoMode}
        />
      )}

      {/* FVIII-vWF Complex (inactive) */}
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
            padding: '8px 12px',
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
          <span style={{ color: '#64748B', fontSize: 10 }}>─</span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 700,
              color: '#FFFFFF',
              border: '2px solid white',
            }}
          >
            vWF
          </div>
        </div>
      )}

      {/* vWF floating away animation */}
      {state.vwfSplit && !state.fviiaDocked && (
        <div
          style={{
            position: 'absolute',
            left: factorXPositions.fviii + 40,
            top: topRowY - 20,
            animation: 'vwfFloat 1.5s ease-out forwards',
            zIndex: 15,
          }}
        >
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

      {/* ===== PAR RECEPTOR (left side) ===== */}
      <PARReceptor
        x={parX}
        y={membraneY - 50}
        state={state.parCleavageState}
        onClick={onPARClick}
        isClickable={state.parCleavageState === 'thrombin-bound' && !isAutoMode}
        scale={1}
      />

      {/* Thrombin arrow to PAR */}
      {state.thrombinArrived && state.parCleavageState === 'intact' && (
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
          <defs>
            <marker id="par-arrow" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 5 2, 0 4" fill="#DC2626" opacity={0.6} />
            </marker>
          </defs>
          <line
            x1={width * 0.35 - 30}
            y1={thrombinY + 10}
            x2={parX + 20}
            y2={membraneY - 40}
            stroke="#DC2626"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            markerEnd="url(#par-arrow)"
            opacity={0.4}
          />
        </svg>
      )}

      {/* ===== BOTTOM ROW: Activated factors on membrane ===== */}

      {/* FXIa (activated - stays in plasma, doesn't dock to membrane) */}
      {state.fxiActivated && (
        <FactorSlot
          x={factorXPositions.fxi}
          y={bottomRowY - 20}
          factorId="FXIa"
          label="FXIa"
          onClick={() => {}}
          disabled={true}
          isActivated={true}
        />
      )}

      {/* FVa (activated - docking to membrane) */}
      {state.fvActivated && !state.fvaDocked && (
        <FactorSlot
          x={factorXPositions.fv}
          y={bottomRowY}
          factorId="FVa"
          label="FVa"
          onClick={() => {}}
          disabled={true}
          isActivated={true}
          isDocking={true}
        />
      )}
      {state.fvaDocked && (
        <DockedCofactorOnMembrane
          x={factorXPositions.fv}
          y={membraneY - 15}
          factorId="FVa"
          highlight={false}
        />
      )}

      {/* FVIIIa (activated - docking to membrane) */}
      {state.vwfSplit && !state.fviiaDocked && (
        <FactorSlot
          x={factorXPositions.fviii}
          y={bottomRowY}
          factorId="FVIIIa"
          label="FVIIIa"
          onClick={() => {}}
          disabled={true}
          isActivated={true}
          isDocking={true}
        />
      )}
      {state.fviiaDocked && (
        <DockedCofactorOnMembrane
          x={factorXPositions.fviii}
          y={membraneY - 15}
          factorId="FVIIIa"
          highlight={false}
        />
      )}

      {/* Activation arrows - thrombin radiates to factors, then factors dock to membrane */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      >
        <defs>
          <marker id="down-arrow" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
            <polygon points="0 0, 6 0, 3 6" fill="#64748B" />
          </marker>
          <marker id="thrombin-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#DC2626" />
          </marker>
        </defs>

        {/* Thrombin → FXI activation arrow */}
        {state.thrombinArrived && !state.fxiActivated && (
          <path
            d={`M ${thrombinX - 20} ${thrombinY - 15} Q ${(thrombinX + factorXPositions.fxi) / 2 - 30} ${thrombinY - 40} ${factorXPositions.fxi + 10} ${topRowY + 25}`}
            stroke="#DC2626"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="none"
            markerEnd="url(#thrombin-arrow)"
            opacity={0.7}
            style={{ animation: 'dashAnim 1s linear infinite' }}
          />
        )}

        {/* Thrombin → FV activation arrow */}
        {state.thrombinArrived && !state.fvActivated && (
          <path
            d={`M ${thrombinX} ${thrombinY - 25} L ${factorXPositions.fv} ${topRowY + 25}`}
            stroke="#DC2626"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="none"
            markerEnd="url(#thrombin-arrow)"
            opacity={0.7}
            style={{ animation: 'dashAnim 1s linear infinite' }}
          />
        )}

        {/* Thrombin → FVIII-vWF activation arrow */}
        {state.thrombinArrived && !state.vwfSplit && (
          <path
            d={`M ${thrombinX + 20} ${thrombinY - 15} Q ${(thrombinX + factorXPositions.fviii) / 2 + 30} ${thrombinY - 40} ${factorXPositions.fviii - 30} ${topRowY + 25}`}
            stroke="#DC2626"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="none"
            markerEnd="url(#thrombin-arrow)"
            opacity={0.7}
            style={{ animation: 'dashAnim 1s linear infinite' }}
          />
        )}

        {/* FXI → FXIa (activation complete) */}
        {state.fxiActivated && (
          <line
            x1={factorXPositions.fxi}
            y1={topRowY + 30}
            x2={factorXPositions.fxi}
            y2={bottomRowY - 50}
            stroke="#EC4899"
            strokeWidth={2}
            markerEnd="url(#down-arrow)"
          />
        )}

        {/* FV → FVa → membrane */}
        {state.fvActivated && (
          <line
            x1={factorXPositions.fv}
            y1={topRowY + 30}
            x2={factorXPositions.fv}
            y2={bottomRowY - 30}
            stroke="#F97316"
            strokeWidth={2}
            markerEnd="url(#down-arrow)"
          />
        )}

        {/* FVIII → FVIIIa → membrane */}
        {state.vwfSplit && (
          <line
            x1={factorXPositions.fviii}
            y1={topRowY + 30}
            x2={factorXPositions.fviii}
            y2={bottomRowY - 30}
            stroke="#A855F7"
            strokeWidth={2}
            markerEnd="url(#down-arrow)"
          />
        )}
      </svg>
      <style>{`
        @keyframes dashAnim {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes thrombinPulseAmp {
          0%, 100% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4); transform: scale(1); }
          50% { box-shadow: 0 4px 24px rgba(220, 38, 38, 0.6); transform: scale(1.05); }
        }
      `}</style>

      {/* Activation particles */}
      <ActivationParticles
        x={factorXPositions.fxi}
        y={topRowY}
        color="#EC4899"
        isActive={showParticles.fxi}
        particleCount={8}
        radius={25}
      />
      <ActivationParticles
        x={factorXPositions.fv}
        y={topRowY}
        color="#3B82F6"
        isActive={showParticles.fv}
        particleCount={8}
        radius={25}
      />
      <ActivationParticles
        x={factorXPositions.fviii}
        y={topRowY}
        color="#22C55E"
        isActive={showParticles.fviii}
        particleCount={8}
        radius={25}
      />
      <ActivationParticles
        x={parX}
        y={membraneY - 30}
        color="#F59E0B"
        isActive={showParticles.platelet}
        particleCount={12}
        radius={40}
      />

      {/* Platelet activation status */}
      {state.plateletActivated && (
        <div
          style={{
            position: 'absolute',
            bottom: membraneY + 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1.5px solid #F59E0B',
            borderRadius: 6,
            zIndex: 15,
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 600, color: '#D97706' }}>
            TROMBOCIT ACTIVAT · PS expus · Cofactori ancorați
          </span>
        </div>
      )}

      {/* Educational summary - Amplification key actions */}
      {state.thrombinArrived && !state.plateletActivated && (
        <div
          style={{
            position: 'absolute',
            top: 55,
            right: 12,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            fontSize: 9,
            maxWidth: 140,
            zIndex: 8,
          }}
        >
          <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>
            TROMBINA ACTIVEAZĂ:
          </div>
          <div style={{ color: '#64748B', lineHeight: 1.5 }}>
            • FXI → FXIa<br />
            • FV → FVa<br />
            • FVIII → FVIIIa<br />
            • Trombocit (PAR)
          </div>
        </div>
      )}
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
  label: string;
  onClick: () => void;
  disabled: boolean;
  isActivated?: boolean;
  isDocking?: boolean;
}

function FactorSlot({
  x,
  y,
  factorId,
  label,
  onClick,
  disabled,
  isActivated = false,
  isDocking = false,
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
        animation: isDocking ? 'dockToMembrane 0.8s ease-out' : 'none',
        zIndex: 10,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <FactorTokenNew factorId={factorId} isActive={isActivated} enableHover={!disabled} />
      <div
        style={{
          padding: '2px 8px',
          background: isActivated ? 'rgba(34, 197, 94, 0.9)' : 'rgba(100, 116, 139, 0.8)',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          color: '#FFFFFF',
        }}
      >
        {label}
      </div>
    </div>
  );
}

interface DockedCofactorOnMembraneProps {
  x: number;
  y: number;
  factorId: string;
  highlight: boolean;
}

function DockedCofactorOnMembrane({ x, y, factorId, highlight }: DockedCofactorOnMembraneProps): React.ReactElement {
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
        gap: 2,
        zIndex: 12,
        animation: highlight ? 'pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      <FactorTokenNew factorId={factorId} isActive style={{ transform: 'scale(0.85)' }} />
      <div
        style={{
          padding: '2px 6px',
          background: 'rgba(34, 197, 94, 0.9)',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 600,
          color: '#FFFFFF',
        }}
      >
        {factorId}
      </div>
      {/* Anchor line to membrane */}
      <div
        style={{
          width: 2,
          height: 10,
          background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
          borderRadius: 1,
        }}
      />
    </div>
  );
}

interface ComplexFormSlotProps {
  name: string;
  enzyme: string;
  cofactor: string;
  canForm: boolean;
  onClick: () => void;
  color: string;
}

function ComplexFormSlot({ name, enzyme, cofactor, canForm, onClick, color }: ComplexFormSlotProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: canForm ? 'pointer' : 'default',
        opacity: canForm ? 1 : 0.4,
      }}
      onClick={canForm ? onClick : undefined}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: canForm ? color : '#64748B', letterSpacing: 0.5 }}>
        {name}
      </div>
      <div
        style={{
          width: 100,
          height: 65,
          border: `2px dashed ${canForm ? color : '#475569'}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          background: canForm ? `${color}15` : 'rgba(71, 85, 105, 0.1)',
        }}
      >
        <span style={{ fontSize: 11, color: canForm ? color : '#64748B', fontWeight: 600 }}>{enzyme}</span>
        <span style={{ fontSize: 9, color: '#94A3B8' }}>+</span>
        <span style={{ fontSize: 11, color: canForm ? color : '#64748B', fontWeight: 600 }}>{cofactor}</span>
      </div>
      {canForm && (
        <div style={{ fontSize: 8, color, fontWeight: 500 }}>Click pentru a forma</div>
      )}
    </div>
  );
}

interface ProgressDotProps {
  label: string;
  active: boolean;
  docked?: boolean;
  color: string;
}

function ProgressDot({ label, active, docked, color }: ProgressDotProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 10,
        background: active ? `${color}30` : 'rgba(100, 116, 139, 0.2)',
        border: `1.5px solid ${active ? color : '#475569'}`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? color : '#475569',
          boxShadow: active ? `0 0 8px ${color}` : 'none',
        }}
      />
      <span style={{ fontSize: 9, fontWeight: 600, color: active ? '#FFFFFF' : '#94A3B8' }}>{label}</span>
      {docked !== undefined && active && (
        <span style={{ fontSize: 7, fontWeight: 500, color: docked ? '#4ADE80' : '#FCD34D', marginLeft: 2 }}>
          {docked ? '✓' : '⏳'}
        </span>
      )}
    </div>
  );
}

