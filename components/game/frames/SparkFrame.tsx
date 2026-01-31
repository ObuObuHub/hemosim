// components/game/frames/SparkFrame.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { TFProtein } from '../visuals/TFProtein';
import type { SparkState, PlayMode, IIaMigrationState } from '@/hooks/useCascadeState';

interface SparkFrameProps {
  width: number;
  height: number;
  state: SparkState;
  onDockFactor: (factorId: string) => void;
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
        // FIX floats in plasma, activated by TF-VIIa
        fix: { x: width * 0.35, y: membraneY - 60 },
        // FX floats in plasma, activated by TF-VIIa
        fx: { x: width * 0.52, y: membraneY - 55 },
        // FV binds with FXa
        fv: { x: width * 0.68, y: membraneY - 55 },
        // FII converted to FIIa
        fii: { x: width * 0.84, y: membraneY - 60 },
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

  // Handler: FIX activation
  const handleFIXActivate = (): void => {
    if (state.fixDocked || !state.tfVIIaDocked || isAutoMode || fixActivating) return;
    setFixActivating(true);
    setTimeout(() => {
      onDockFactor('FIX');
      setFixActivating(false);
    }, 600);
  };

  // Handler: FX activation
  const handleFXActivate = (): void => {
    if (state.fxDocked || !state.tfVIIaDocked || isAutoMode || fxActivating) return;
    setFxActivating(true);
    setTimeout(() => {
      onDockFactor('FX');
      setFxActivating(false);
    }, 600);
  };

  // Handler: FV binding
  const handleFVBind = (): void => {
    if (state.fvDocked || !state.fxDocked || isAutoMode) return;
    onDockFactor('FV');
  };

  // Handler: FII activation
  const handleFIIActivate = (): void => {
    if (state.fiiDocked || !state.fvDocked || isAutoMode || fiiActivating) return;
    setFiiActivating(true);
    setTimeout(() => {
      onDockFactor('FII');
      setFiiActivating(false);
    }, 600);
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
      {/* FIX - Materializes after TF-VIIa forms */}
      {/* ================================================================= */}

      {/* FIX floating in plasma (materialized, not yet activated) */}
      {fixMaterialized && !state.fixDocked && !fixActivating && !fixaIsHeld && !fixaIsMigrating && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fix.x - 22,
            top: layout.positions.fix.y - 18,
            cursor: state.tfVIIaDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out, factorFloat 3s ease-in-out 0.8s infinite',
            zIndex: 10,
          }}
          onClick={handleFIXActivate}
        >
          <FactorTokenNew factorId="FIX" isActive={false} enableHover={state.tfVIIaDocked} />
          {/* Membrane anchor (Ca2+ / GLA domain) */}
          <MembraneAnchor />
        </div>
      )}

      {/* FIX activating (glow effect) */}
      {fixActivating && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fix.x - 22,
            top: layout.positions.fix.y - 18,
            zIndex: 25,
            animation: 'activationGlow 1.5s ease-in-out forwards',
          }}
        >
          <FactorTokenNew factorId="FIX" isActive={false} enableHover={false} />
          <ActivationSpark />
        </div>
      )}

      {/* FIXa at original position briefly before sliding up (hidden once arrived at platelet) */}
      {state.fixDocked && !fixaIsHeld && !fixaIsMigrating && state.fixaMigrationState !== 'arrived' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fix.x - 22,
            top: layout.positions.fix.y - 18,
            zIndex: 15,
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* FIXa held at top-right for migration */}
      {(fixaIsHeld || fixaIsMigrating) && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fixaHold.x - 22,
            top: layout.positions.fixaHold.y - 18,
            zIndex: 20,
            animation: 'slideToHold 1s ease-out',
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* ================================================================= */}
      {/* FX - Materializes after TF-VIIa forms */}
      {/* ================================================================= */}

      {/* FX floating in plasma */}
      {fxMaterialized && !state.fxDocked && !fxActivating && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fx.x - 22,
            top: layout.positions.fx.y - 18,
            cursor: state.tfVIIaDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out, factorFloat 3.5s ease-in-out 0.8s infinite',
            zIndex: 10,
          }}
          onClick={handleFXActivate}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={state.tfVIIaDocked} />
          <MembraneAnchor />
        </div>
      )}

      {/* FX activating */}
      {fxActivating && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fx.x - 22,
            top: layout.positions.fx.y - 18,
            zIndex: 25,
            animation: 'activationGlow 1.5s ease-in-out forwards',
          }}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
          <ActivationSpark />
        </div>
      )}

      {/* FXa docked */}
      {state.fxDocked && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fx.x - 22,
            top: layout.positions.fx.y - 18,
            zIndex: 15,
            filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.3))',
          }}
        >
          <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
          <MembraneAnchor />
        </div>
      )}

      {/* ================================================================= */}
      {/* FV - Materializes after FXa forms, binds to create Prothrombinase */}
      {/* ================================================================= */}

      {/* FV floating in plasma */}
      {fvMaterialized && !state.fvDocked && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fv.x - 22,
            top: layout.positions.fv.y - 18,
            cursor: state.fxDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out, factorFloat 4s ease-in-out 0.8s infinite',
            zIndex: 10,
          }}
          onClick={handleFVBind}
        >
          <FactorTokenNew factorId="FV" isActive={false} enableHover={state.fxDocked} />
        </div>
      )}

      {/* FVa bound (cofactor) */}
      {state.fvDocked && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fv.x - 22,
            top: layout.positions.fv.y - 18,
            zIndex: 15,
            filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.3))',
          }}
        >
          <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* Prothrombinase complex box */}
      {state.fxDocked && state.fvDocked && (
        <>
          <div
            style={{
              position: 'absolute',
              left: layout.positions.fx.x - 35,
              top: layout.positions.fx.y - 30,
              width: (layout.positions.fv.x - layout.positions.fx.x) + 70,
              height: 60,
              border: '2px dashed #3B82F6',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.05)',
              animation: 'complexPulse 2s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: (layout.positions.fx.x + layout.positions.fv.x) / 2 - 40,
              top: layout.positions.fx.y - 45,
              padding: '3px 8px',
              background: '#FFFFFF',
              border: '1px solid #3B82F6',
              borderRadius: 4,
              fontSize: 9,
              color: '#3B82F6',
              fontWeight: 600,
              zIndex: 6,
            }}
          >
            Protrombinază
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* FII → FIIa (Trace Thrombin) */}
      {/* ================================================================= */}

      {/* FII floating in plasma */}
      {fiiMaterialized && !state.fiiDocked && !fiiActivating && !fiiaIsHeld && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fii.x - 22,
            top: layout.positions.fii.y - 18,
            cursor: state.fvDocked && !isAutoMode ? 'pointer' : 'default',
            animation: 'factorMaterialize 0.8s ease-out, factorFloat 3s ease-in-out 0.8s infinite',
            zIndex: 10,
          }}
          onClick={handleFIIActivate}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={state.fvDocked} />
          <MembraneAnchor />
        </div>
      )}

      {/* FII activating */}
      {fiiActivating && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fii.x - 22,
            top: layout.positions.fii.y - 18,
            zIndex: 25,
            animation: 'activationGlow 1.5s ease-in-out forwards',
          }}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
          <ActivationSpark color="#DC2626" />
        </div>
      )}

      {/* FIIa at original position briefly (before migration starts) */}
      {state.thrombinProduced && iiaMigrationState === 'inactive' && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fii.x - 22,
            top: layout.positions.fii.y - 18,
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
        {/* TF-VIIa → FIX activation arrow */}
        {state.tfVIIaDocked && fixMaterialized && !state.fixDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fvii.x + 25}
            fromY={layout.positions.fvii.y - 10}
            toX={layout.positions.fix.x - 20}
            toY={layout.positions.fix.y - 5}
            color="#DC2626"
            label="activează"
          />
        )}

        {/* TF-VIIa → FX activation arrow */}
        {state.tfVIIaDocked && fxMaterialized && !state.fxDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fvii.x + 25}
            fromY={layout.positions.fvii.y + 5}
            toX={layout.positions.fx.x - 20}
            toY={layout.positions.fx.y - 5}
            color="#DC2626"
            label="activează"
          />
        )}

        {/* FXa → FVa binding arrow */}
        {state.fxDocked && fvMaterialized && !state.fvDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fx.x + 30}
            fromY={layout.positions.fx.y - 5}
            toX={layout.positions.fv.x - 20}
            toY={layout.positions.fv.y - 5}
            color="#22C55E"
            label="leagă"
            curved={false}
          />
        )}

        {/* Prothrombinase → FII cleavage arrow */}
        {state.fvDocked && fiiMaterialized && !state.fiiDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fv.x + 30}
            fromY={layout.positions.fv.y - 5}
            toX={layout.positions.fii.x - 20}
            toY={layout.positions.fii.y - 5}
            color="#3B82F6"
            label="clivează"
            curved={false}
          />
        )}


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
      `}</style>
    </div>
  );
}

// =============================================================================
// MEMBRANE ANCHOR - Visual representation of Ca2+/GLA domain binding
// =============================================================================

function MembraneAnchor(): React.ReactElement {
  // Removed the gray vertical line - only keeping for layout compatibility
  return <div style={{ height: 0 }} />;
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
