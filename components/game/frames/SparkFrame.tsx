// components/game/frames/SparkFrame.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { TFProtein } from '../visuals/TFProtein';
import { ESComplexGlow, CleavageAnimation, ProductReleaseGlow } from '../visuals/EnzymaticActivation';
import type { SparkState, PlayMode, IIaMigrationState, ActivationPhase } from '@/hooks/useCascadeState';

interface SparkFrameProps {
  width: number;
  height: number;
  state: SparkState;
  onDockFactor: (factorId: string) => void;
  /** Start enzymatic activation sequence (E + S → ES → E + P) */
  onStartActivation?: (factor: 'FIX' | 'FX' | 'FII') => void;
  showFiiaMigration?: boolean;
  mode?: PlayMode;
  /** IIa cross-frame migration state - when 'migrating', FIIa is rendered at container level */
  iiaMigrationState?: IIaMigrationState;
}

/**
 * SPARK FRAME - "Inițiere" - TF-bearing cell membrane
 *
 * Biological visualization: Factors materialize from plasma and interact.
 * No ghost slots - factors appear when biologically relevant.
 *
 * Flow:
 * 1. TF exposed on membrane → FVII materializes → docks to form TF-VIIa
 * 2. TF-VIIa activates FIX → FIXa migrates to platelet (slow)
 * 3. TF-VIIa activates FX → FXa + FVa → Prothrombinase
 * 4. Prothrombinase converts FII → FIIa (trace thrombin)
 * 5. FIIa migrates to platelet (fast) for amplification
 */
export function SparkFrame({
  width,
  height,
  state,
  onDockFactor,
  onStartActivation,
  showFiiaMigration = false,
  mode = 'manual',
  iiaMigrationState = 'inactive',
}: SparkFrameProps): React.ReactElement {
  const isAutoMode = mode === 'auto';

  // Layout calculations
  const layout = useMemo(() => {
    const membraneHeight = height * 0.28;
    const bloodstreamHeight = height - membraneHeight;
    const membraneY = bloodstreamHeight;

    return {
      membraneHeight,
      membraneY,
      bloodstreamHeight,
      centerX: width / 2,
      positions: {
        // TF anchored at membrane (left side)
        tf: { x: width * 0.10, y: membraneY - 20 },
        // FVII docks ON TOP of TF (like the reference image)
        fvii: { x: width * 0.10, y: membraneY - 85 },
        // TF-VIIa enzyme active site (where substrates dock for activation)
        tfviiaActiveSite: { x: width * 0.10 + 30, y: membraneY - 85 },
        // INACTIVE FACTORS - stacked on LEFT margin
        fix: { x: 45, y: bloodstreamHeight * 0.15 },
        fx: { x: 45, y: bloodstreamHeight * 0.35 },
        fv: { x: 45, y: bloodstreamHeight * 0.55 },
        fii: { x: 45, y: bloodstreamHeight * 0.75 },
        // Prothrombinase forms at membrane (center-right area)
        prothrombinaseActiveSite: { x: width * 0.55, y: membraneY - 60 },
        // FIXa hold position (top-right corner)
        fixaHold: { x: width * 0.90, y: bloodstreamHeight * 0.18 },
        // FIIa hold position (top-right, below FIXa)
        fiiaHold: { x: width * 0.90, y: bloodstreamHeight * 0.45 },
      },
    };
  }, [width, height]);

  // Animation states
  const [fviiMaterializing, setFviiMaterializing] = useState(false);
  const [fixMaterialized, setFixMaterialized] = useState(false);
  const [fixActivating, setFixActivating] = useState(false);
  const [fxMaterialized, setFxMaterialized] = useState(false);
  const [fxActivating, setFxActivating] = useState(false);
  const [fvMaterialized, setFvMaterialized] = useState(false);
  const [fvBinding, setFvBinding] = useState(false);
  const [fiiMaterialized, setFiiMaterialized] = useState(false);
  const [fiiActivating, setFiiActivating] = useState(false);

  // FIXa and FIIa migration states
  const fixaIsHeld = state.fixaMigrationState === 'held_for_migration';
  const fixaIsMigrating = state.fixaMigrationState === 'migrating';
  // IIa migration state is now controlled from parent via prop
  const fiiaIsHeld = iiaMigrationState === 'held_for_migration';

  // Materialize FIX and FX after TF-VIIa forms
  useEffect(() => {
    if (state.tfVIIaDocked && !fixMaterialized) {
      setTimeout(() => setFixMaterialized(true), 300);
      setTimeout(() => setFxMaterialized(true), 500);
    }
  }, [state.tfVIIaDocked, fixMaterialized]);

  // Materialize FV after FX docks
  useEffect(() => {
    if (state.fxDocked && !fvMaterialized) {
      setTimeout(() => setFvMaterialized(true), 300);
    }
  }, [state.fxDocked, fvMaterialized]);

  // Materialize FII after FV docks
  useEffect(() => {
    if (state.fvDocked && !fiiMaterialized) {
      setTimeout(() => setFiiMaterialized(true), 300);
    }
  }, [state.fvDocked, fiiMaterialized]);

  // FIIa migration is now controlled by iiaMigrationState prop from parent
  // The parent (CellularModelExplorer) triggers holdFiiaForMigration when thrombin is produced

  // Handler: FVII materializes and docks to TF
  const handleFVIIDock = (): void => {
    if (state.tfVIIaDocked || isAutoMode || fviiMaterializing) return;
    setFviiMaterializing(true);
    setTimeout(() => {
      onDockFactor('TF+FVII');
      setFviiMaterializing(false);
    }, 800);
  };

  // Handler: FIX activation - starts enzymatic E + S → ES → E + P sequence
  const handleFIXActivate = (): void => {
    if (state.fixDocked || !state.tfVIIaDocked || isAutoMode || fixActivating) return;
    if (state.fixActivationPhase !== 'inactive') return; // Already activating

    if (onStartActivation) {
      // Use new enzymatic activation flow
      onStartActivation('FIX');
    } else {
      // Fallback to legacy instant activation
      setFixActivating(true);
      setTimeout(() => {
        onDockFactor('FIX');
        setFixActivating(false);
      }, 600);
    }
  };

  // Handler: FX activation - starts enzymatic E + S → ES → E + P sequence
  const handleFXActivate = (): void => {
    if (state.fxDocked || !state.tfVIIaDocked || isAutoMode || fxActivating) return;
    if (state.fxActivationPhase !== 'inactive') return; // Already activating

    if (onStartActivation) {
      // Use new enzymatic activation flow
      onStartActivation('FX');
    } else {
      // Fallback to legacy instant activation
      setFxActivating(true);
      setTimeout(() => {
        onDockFactor('FX');
        setFxActivating(false);
      }, 600);
    }
  };

  // Handler: FV binding - animates FV to join FXa forming Prothrombinase
  const handleFVBind = (): void => {
    if (state.fvDocked || !state.fxDocked || isAutoMode || fvBinding) return;
    setFvBinding(true);
    // Animation completes, then dock
    setTimeout(() => {
      onDockFactor('FV');
      setFvBinding(false);
    }, 1500);
  };

  // Handler: FII activation - starts enzymatic E + S → ES → E + P sequence
  const handleFIIActivate = (): void => {
    if (state.fiiDocked || !state.fvDocked || isAutoMode || fiiActivating) return;
    if (state.fiiActivationPhase !== 'inactive') return; // Already activating

    if (onStartActivation) {
      // Use new enzymatic activation flow
      onStartActivation('FII');
    } else {
      // Fallback to legacy instant activation
      setFiiActivating(true);
      setTimeout(() => {
        onDockFactor('FII');
        setFiiActivating(false);
      }, 600);
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
      {/* Plasma background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: layout.bloodstreamHeight,
          background: 'linear-gradient(180deg, #F1F5F9 0%, #F8FAFC 100%)',
        }}
      />

      {/* Plasma label */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          fontSize: 10,
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
          color: '#94A3B8',
          letterSpacing: 0.5,
        }}
      >
        Plasmă
      </div>

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
          variant="fibroblast"
        />
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          FAZA 1 · INIȚIERE
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            color: 'rgba(255,255,255,0.8)',
            fontSize: 9,
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          Celula TF-bearing
        </div>
      </div>

      {/* TF Protein - always visible at membrane */}
      <div
        style={{
          position: 'absolute',
          left: layout.positions.tf.x,
          top: layout.membraneY + 5,
        }}
      >
        <TFProtein
          x={0}
          y={0}
          hasVIIa={state.tfVIIaDocked}
          isProducing={state.tfVIIaDocked && (!state.fixDocked || !state.fxDocked)}
        />
      </div>

      {/* ================================================================= */}
      {/* FVII - Materializes from plasma, docks ON TOP of TF */}
      {/* ================================================================= */}

      {/* FVII clickable target (before dock) */}
      {!state.tfVIIaDocked && !fviiMaterializing && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fvii.x - 22,
            top: layout.positions.fvii.y - 50,
            cursor: 'pointer',
            animation: 'factorFloat 3s ease-in-out infinite',
            zIndex: 15,
          }}
          onClick={handleFVIIDock}
        >
          <div style={{ opacity: 0.4, filter: 'grayscale(30%)' }}>
            <FactorTokenNew factorId="FVII" isActive={false} enableHover={true} />
          </div>
        </div>
      )}

      {/* FVII materializing animation */}
      {fviiMaterializing && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fvii.x - 22,
            top: layout.positions.fvii.y - 80,
            zIndex: 25,
            animation: 'materializeAndDock 1.2s ease-out forwards',
          }}
        >
          <FactorTokenNew factorId="FVII" isActive={false} enableHover={false} />
        </div>
      )}


      {/* ================================================================= */}
      {/* FIX - Enzymatic Activation by TF-VIIa (E + S → ES → E + P)      */}
      {/* ================================================================= */}

      {/* FIX inactive - on LEFT margin */}
      {fixMaterialized && !state.fixDocked && state.fixActivationPhase === 'inactive' && !fixActivating && !fixaIsHeld && !fixaIsMigrating && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fix.x - 22,
            top: layout.positions.fix.y,
            cursor: state.tfVIIaDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out',
            zIndex: 10,
          }}
          onClick={handleFIXActivate}
        >
          <FactorTokenNew factorId="FIX" isActive={false} enableHover={state.tfVIIaDocked} />
        </div>
      )}

      {/* FIX APPROACHING - Substrate gliding from left margin toward TF-VIIa enzyme */}
      {state.fixActivationPhase === 'approaching' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fix.x - 22,
            top: layout.positions.fix.y,
            zIndex: 25,
            animation: 'approachEnzyme 800ms ease-in-out forwards',
            ['--target-x' as string]: `${layout.positions.tfviiaActiveSite.x - layout.positions.fix.x + 50}px`,
            ['--target-y' as string]: `${layout.positions.tfviiaActiveSite.y - layout.positions.fix.y}px`,
          }}
        >
          <FactorTokenNew factorId="FIX" isActive={false} enableHover={false} />
        </div>
      )}

      {/* FIX ES_COMPLEX - Substrate docked at TF-VIIa active site */}
      {state.fixActivationPhase === 'es_complex' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.tfviiaActiveSite.x - 22,
            top: layout.positions.tfviiaActiveSite.y + 5,
            zIndex: 25,
          }}
        >
          <FactorTokenNew factorId="FIX" isActive={false} enableHover={false} />
          <ESComplexGlow color="#06B6D4" />
        </div>
      )}

      {/* FIX CLEAVING - Proteolytic cleavage at enzyme active site */}
      {state.fixActivationPhase === 'cleaving' && (
        <>
          <div
            style={{
              position: 'absolute',
              left: layout.positions.tfviiaActiveSite.x - 22,
              top: layout.positions.tfviiaActiveSite.y + 5,
              zIndex: 25,
              opacity: 0.7,
            }}
          >
            <FactorTokenNew factorId="FIX" isActive={false} enableHover={false} />
          </div>
          <CleavageAnimation
            x={layout.positions.tfviiaActiveSite.x}
            y={layout.positions.tfviiaActiveSite.y + 20}
            color="#06B6D4"
          />
        </>
      )}

      {/* FIXa RELEASING - Product emerging from enzyme */}
      {state.fixActivationPhase === 'releasing' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.tfviiaActiveSite.x - 22,
            top: layout.positions.tfviiaActiveSite.y + 5,
            zIndex: 25,
            animation: 'productRelease 1200ms ease-in-out forwards',
            ['--target-x' as string]: `${layout.positions.fixaHold.x - layout.positions.tfviiaActiveSite.x}px`,
            ['--target-y' as string]: `${layout.positions.fixaHold.y - layout.positions.tfviiaActiveSite.y}px`,
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
          <ProductReleaseGlow color="#06B6D4" />
        </div>
      )}

      {/* Legacy: FIX activating (glow effect) - for backward compatibility */}
      {fixActivating && state.fixActivationPhase === 'inactive' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fix.x - 22,
            top: layout.positions.fix.y,
            zIndex: 25,
            animation: 'activationGlow 1.5s ease-in-out forwards',
          }}
        >
          <FactorTokenNew factorId="FIX" isActive={false} enableHover={false} />
          <ActivationSpark />
        </div>
      )}

      {/* FIXa COMPLETE - at hold position */}
      {state.fixDocked && state.fixActivationPhase !== 'releasing' && !fixaIsHeld && !fixaIsMigrating && state.fixaMigrationState !== 'arrived' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fixaHold.x - 22,
            top: layout.positions.fixaHold.y,
            zIndex: 15,
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* FIXa migrates to right panel when held - no longer rendered here */}

      {/* ================================================================= */}
      {/* FX - Enzymatic Activation by TF-VIIa (E + S → ES → E + P)       */}
      {/* ================================================================= */}

      {/* FX inactive - on LEFT margin */}
      {fxMaterialized && !state.fxDocked && state.fxActivationPhase === 'inactive' && !fxActivating && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fx.x - 22,
            top: layout.positions.fx.y,
            cursor: state.tfVIIaDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out',
            zIndex: 10,
          }}
          onClick={handleFXActivate}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={state.tfVIIaDocked} />
        </div>
      )}

      {/* FX APPROACHING - Substrate gliding from left margin toward TF-VIIa enzyme */}
      {state.fxActivationPhase === 'approaching' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fx.x - 22,
            top: layout.positions.fx.y,
            zIndex: 25,
            animation: 'approachEnzyme 800ms ease-in-out forwards',
            ['--target-x' as string]: `${layout.positions.tfviiaActiveSite.x - layout.positions.fx.x + 50}px`,
            ['--target-y' as string]: `${layout.positions.tfviiaActiveSite.y - layout.positions.fx.y}px`,
          }}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
        </div>
      )}

      {/* FX ES_COMPLEX - Substrate docked at TF-VIIa active site */}
      {state.fxActivationPhase === 'es_complex' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.tfviiaActiveSite.x - 22,
            top: layout.positions.tfviiaActiveSite.y + 5,
            zIndex: 25,
          }}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
          <ESComplexGlow color="#22C55E" />
        </div>
      )}

      {/* FX CLEAVING - Proteolytic cleavage at enzyme active site */}
      {state.fxActivationPhase === 'cleaving' && (
        <>
          <div
            style={{
              position: 'absolute',
              left: layout.positions.tfviiaActiveSite.x - 22,
              top: layout.positions.tfviiaActiveSite.y + 5,
              zIndex: 25,
              opacity: 0.7,
            }}
          >
            <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
          </div>
          <CleavageAnimation
            x={layout.positions.tfviiaActiveSite.x}
            y={layout.positions.tfviiaActiveSite.y + 20}
            color="#22C55E"
          />
        </>
      )}

      {/* FXa RELEASING - Product emerging and moving to membrane position */}
      {state.fxActivationPhase === 'releasing' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.tfviiaActiveSite.x - 22,
            top: layout.positions.tfviiaActiveSite.y + 5,
            zIndex: 25,
            animation: 'productRelease 1200ms ease-in-out forwards',
            ['--target-x' as string]: `${width * 0.50 - layout.positions.tfviiaActiveSite.x + 22}px`,
            ['--target-y' as string]: `${layout.membraneY - 60 - layout.positions.tfviiaActiveSite.y - 5}px`,
          }}
        >
          <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
          <ProductReleaseGlow color="#22C55E" />
        </div>
      )}

      {/* Legacy: FX activating (glow effect) - for backward compatibility */}
      {fxActivating && state.fxActivationPhase === 'inactive' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fx.x - 22,
            top: layout.positions.fx.y,
            zIndex: 25,
            animation: 'activationGlow 1.5s ease-in-out forwards',
          }}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
          <ActivationSpark />
        </div>
      )}

      {/* ================================================================= */}
      {/* FV - Materializes after FXa forms, binds to create Prothrombinase */}
      {/* ================================================================= */}

      {/* FV inactive - on LEFT margin (waiting to bind) */}
      {fvMaterialized && !state.fvDocked && !fvBinding && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fv.x - 22,
            top: layout.positions.fv.y,
            cursor: state.fxDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out',
            zIndex: 10,
          }}
          onClick={handleFVBind}
        >
          <FactorTokenNew factorId="FV" isActive={false} enableHover={state.fxDocked} />
        </div>
      )}

      {/* FV BINDING - animating smoothly from left margin to join FXa */}
      {fvBinding && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fv.x - 22,
            top: layout.positions.fv.y,
            zIndex: 25,
            animation: 'fvBindToProthrombinase 1.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
            ['--target-x' as string]: `${width * 0.55 + 25 - layout.positions.fv.x + 22}px`,
            ['--target-y' as string]: `${layout.membraneY - 85 + 20 - layout.positions.fv.y}px`,
          }}
        >
          <FactorTokenNew factorId="FV" isActive={false} enableHover={false} />
        </div>
      )}

      {/* FXa alone (before FVa binds) */}
      {state.fxDocked && !state.fvDocked && state.fxActivationPhase !== 'releasing' && (
        <div
          style={{
            position: 'absolute',
            left: width * 0.50,
            top: layout.membraneY - 60,
            zIndex: 15,
          }}
        >
          <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* ================================================================= */}
      {/* PROTHROMBINASE COMPLEX - FXa (enzyme) + FVa (cofactor)           */}
      {/* ================================================================= */}
      {state.fxDocked && state.fvDocked && (
        <div
          style={{
            position: 'absolute',
            left: width * 0.55,
            top: layout.membraneY - 85,
            transform: 'translateX(-50%)',
            zIndex: 15,
          }}
        >
          {/* Complex container - standardized with UnifiedPlateletView */}
          <div
            style={{
              position: 'relative',
              padding: '12px 16px 20px',
              border: '2px solid #3B82F6',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.08)',
            }}
          >
            {/* Label badge */}
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
                fontFamily: 'system-ui, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              PROTROMBINAZĂ
            </div>

            {/* Enzyme + Cofactor layout - matches UnifiedPlateletView pattern */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {/* FVa - Cofactor (scaled up) */}
              <div style={{ transform: 'scale(1.1)' }}>
                <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
              </div>
              {/* FXa - Enzyme (scaled down, with Gla domain) */}
              <div style={{ transform: 'scale(0.85)' }}>
                <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
              </div>
            </div>

            {/* Role labels - matches UnifiedPlateletView */}
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                fontSize: 5,
                fontFamily: 'system-ui, sans-serif',
                color: '#64748B',
              }}
            >
              <span title="FVa = cofactor, pozitionează FXa și protrombina">cofactor</span>
              <span title="FXa = serină protează, enzima activă">enzimă</span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* FII → FIIa - Enzymatic Activation by Prothrombinase (E + S → ES → E + P) */}
      {/* ================================================================= */}

      {/* FII inactive - on LEFT margin */}
      {fiiMaterialized && !state.fiiDocked && state.fiiActivationPhase === 'inactive' && !fiiActivating && !fiiaIsHeld && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fii.x - 22,
            top: layout.positions.fii.y,
            cursor: state.fvDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out',
            zIndex: 10,
          }}
          onClick={handleFIIActivate}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={state.fvDocked} />
        </div>
      )}

      {/* FII APPROACHING - Substrate gliding from left margin toward Prothrombinase */}
      {state.fiiActivationPhase === 'approaching' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fii.x - 22,
            top: layout.positions.fii.y,
            zIndex: 25,
            animation: 'approachEnzyme 800ms ease-in-out forwards',
            ['--target-x' as string]: `${layout.positions.prothrombinaseActiveSite.x - layout.positions.fii.x}px`,
            ['--target-y' as string]: `${layout.positions.prothrombinaseActiveSite.y - layout.positions.fii.y}px`,
          }}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
        </div>
      )}

      {/* FII ES_COMPLEX - Substrate docked at Prothrombinase active site */}
      {state.fiiActivationPhase === 'es_complex' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.prothrombinaseActiveSite.x - 22,
            top: layout.positions.prothrombinaseActiveSite.y + 5,
            zIndex: 25,
          }}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
          <ESComplexGlow color="#DC2626" />
        </div>
      )}

      {/* FII CLEAVING - Proteolytic cleavage at Prothrombinase active site */}
      {state.fiiActivationPhase === 'cleaving' && (
        <>
          <div
            style={{
              position: 'absolute',
              left: layout.positions.prothrombinaseActiveSite.x - 22,
              top: layout.positions.prothrombinaseActiveSite.y + 5,
              zIndex: 25,
              opacity: 0.7,
            }}
          >
            <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
          </div>
          <CleavageAnimation
            x={layout.positions.prothrombinaseActiveSite.x}
            y={layout.positions.prothrombinaseActiveSite.y + 20}
            color="#DC2626"
          />
        </>
      )}

      {/* FIIa RELEASING - Product emerging and moving to hold position */}
      {state.fiiActivationPhase === 'releasing' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.prothrombinaseActiveSite.x - 22,
            top: layout.positions.prothrombinaseActiveSite.y + 5,
            zIndex: 25,
            animation: 'productRelease 1200ms ease-in-out forwards',
            ['--target-x' as string]: `${layout.positions.fiiaHold.x - layout.positions.prothrombinaseActiveSite.x}px`,
            ['--target-y' as string]: `${layout.positions.fiiaHold.y - layout.positions.prothrombinaseActiveSite.y}px`,
          }}
        >
          <FactorTokenNew factorId="FIIa" isActive={true} enableHover={false} />
          <ProductReleaseGlow color="#DC2626" />
        </div>
      )}

      {/* Legacy: FII activating (glow effect) - for backward compatibility */}
      {fiiActivating && state.fiiActivationPhase === 'inactive' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fii.x - 22,
            top: layout.positions.fii.y,
            zIndex: 25,
            animation: 'activationGlow 1.5s ease-in-out forwards',
          }}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
          <ActivationSpark color="#DC2626" />
        </div>
      )}

      {/* FIIa COMPLETE - at hold position briefly (before migration starts) */}
      {state.thrombinProduced && state.fiiActivationPhase !== 'releasing' && iiaMigrationState === 'inactive' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fiiaHold.x - 22,
            top: layout.positions.fiiaHold.y,
            zIndex: 15,
          }}
        >
          <FactorTokenNew factorId="FIIa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* FIIa held at hold position for migration (waiting to start cross-frame animation) */}
      {fiiaIsHeld && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fiiaHold.x - 22,
            top: layout.positions.fiiaHold.y - 18,
            zIndex: 20,
            animation: 'slideToHold 1s ease-out',
          }}
        >
          <FactorTokenNew factorId="FIIa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* When fiiaIsMigrating = true, FIIa is rendered at container level (CellularModelExplorer) */}
      {/* The token appears to fly across the frame boundary to ExplosionFrame */}

      {/* ================================================================= */}
      {/* Activation Arrows - SVG overlay */}
      {/* ================================================================= */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 12,
        }}
      >
        {/* Arrows removed - factors appear in sequence */}


        {/* FIIa Migration - Multiple targets in adjacent panel */}
        {fiiaIsHeld && showFiiaMigration && (
          <ThrombinMigrationPaths
            fromX={layout.positions.fiiaHold.x}
            fromY={layout.positions.fiiaHold.y}
            toX={width + 20}
            panelHeight={layout.bloodstreamHeight}
          />
        )}
      </svg>

      {/* Removed trace thrombin indicator box - the FIIa token + migration paths are sufficient */}

      {/* CSS Animations - Simple, GPU-optimized */}
      <style>{`
        @keyframes factorFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes factorMaterialize {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes materializeAndDock {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(62px); }
        }

        @keyframes activationGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)); }
          50% { filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.7)); }
        }

        @keyframes slideToHold {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sparkBurst {
          from { transform: translate(-50%, -50%) scale(0.3); opacity: 0.8; }
          to { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        @keyframes complexPulse {
          0%, 100% { border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 0 8px rgba(59, 130, 246, 0.15); }
          50% { border-color: rgba(59, 130, 246, 0.8); box-shadow: 0 0 16px rgba(59, 130, 246, 0.3); }
        }

        @keyframes dashMove {
          from { stroke-dashoffset: 18; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes anchorPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        /* Enzymatic Activation Animations (E + S → ES → E + P) */
        @keyframes approachEnzyme {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--target-x), var(--target-y)) scale(0.95); opacity: 1; }
        }

        @keyframes productRelease {
          0% { transform: translate(0, 0) scale(0.9); opacity: 0.8; }
          15% { transform: translate(5px, -5px) scale(1.05); opacity: 1; }
          100% { transform: translate(var(--target-x), var(--target-y)) scale(1); opacity: 1; }
        }

        @keyframes fvBindToProthrombinase {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
            filter: grayscale(20%);
          }
          15% {
            transform: translate(calc(var(--target-x) * 0.1), calc(var(--target-y) * 0.05 - 15px)) scale(1.05);
            opacity: 0.75;
            filter: grayscale(10%);
          }
          50% {
            transform: translate(calc(var(--target-x) * 0.5), calc(var(--target-y) * 0.4 - 20px)) scale(1.08);
            opacity: 0.9;
            filter: grayscale(0%);
          }
          80% {
            transform: translate(calc(var(--target-x) * 0.9), calc(var(--target-y) * 0.85 - 8px)) scale(1.03);
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}


// =============================================================================
// ACTIVATION SPARK - Glowing effect during enzymatic activation
// =============================================================================

function ActivationSpark({ color = '#06B6D4' }: { color?: string }): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 70,
        height: 70,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}80 0%, ${color}00 70%)`,
        transform: 'translate(-50%, -50%)',
        animation: 'sparkBurst 0.7s ease-out forwards',
        pointerEvents: 'none',
      }}
    />
  );
}

// =============================================================================
// ACTIVATION ARROW SVG
// =============================================================================

interface ActivationArrowSVGProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  label?: string;
  curved?: boolean;
}

function ActivationArrowSVG({
  fromX,
  fromY,
  toX,
  toY,
  color,
  label,
  curved = true,
}: ActivationArrowSVGProps): React.ReactElement {
  const markerId = `arrow-${fromX}-${fromY}-${toX}-${toY}`;
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 35;
  const pathD = curved
    ? `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`
    : `M ${fromX} ${fromY} L ${toX} ${toY}`;

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={color} />
        </marker>
      </defs>
      <path
        d={pathD}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="6 3"
        fill="none"
        markerEnd={`url(#${markerId})`}
        opacity={0.8}
        style={{ animation: 'dashMove 1s linear infinite' }}
      />
      {label && (
        <text
          x={midX}
          y={curved ? midY - 5 : (fromY + toY) / 2 - 10}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill={color}
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.9)' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}


// =============================================================================
// THROMBIN MIGRATION PATHS - FIIa migrates to multiple targets
// =============================================================================

interface ThrombinMigrationPathsProps {
  fromX: number;
  fromY: number;
  toX: number;
  panelHeight: number;
}

function ThrombinMigrationPaths({
  fromX,
  fromY,
  toX,
  panelHeight,
}: ThrombinMigrationPathsProps): React.ReactElement {
  // Target positions in the adjacent panel (spread vertically)
  // PAR is first and highlighted - activates platelet surface change immediately
  const targets = [
    { label: 'PAR', y: panelHeight * 0.15, color: '#7C3AED', delay: '0s', primary: true },      // Platelet receptor - PRIMARY
    { label: 'FXI', y: panelHeight * 0.35, color: '#F59E0B', delay: '0.3s', primary: false },   // Factor XI
    { label: 'FV', y: panelHeight * 0.55, color: '#10B981', delay: '0.5s', primary: false },    // Factor V
    { label: 'FVIII', y: panelHeight * 0.75, color: '#3B82F6', delay: '0.7s', primary: false }, // Factor VIII-vWF
  ];

  return (
    <g>
      {/* Migration paths to each target - minimal, just animated dots */}
      {targets.map((target) => {
        const midX = fromX + (toX - fromX) * 0.5;
        const pathD = `M ${fromX} ${fromY} Q ${midX} ${(fromY + target.y) / 2} ${toX} ${target.y}`;

        return (
          <g key={target.label}>
            <path
              d={pathD}
              stroke={target.color}
              strokeWidth={target.primary ? 2 : 1.5}
              strokeDasharray="4 3"
              fill="none"
              opacity={target.primary ? 0.4 : 0.2}
            />
            <circle
              r={target.primary ? 7 : 5}
              fill={target.color}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              opacity={0.9}
            >
              <animateMotion
                dur={target.primary ? '1.5s' : '2s'}
                repeatCount="indefinite"
                begin={target.delay}
                path={pathD}
              />
            </circle>
          </g>
        );
      })}
    </g>
  );
}
