// components/game/frames/SparkFrame.tsx
'use client';

import { useMemo } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { TFProtein } from '../visuals/TFProtein';
import type { SparkState, PlayMode } from '@/hooks/useCascadeState';

interface SparkFrameProps {
  width: number;
  height: number;
  state: SparkState;
  onDockFactor: (factorId: string) => void;
  showFixaMigration?: boolean;
  showFiiaMigration?: boolean;
  mode?: PlayMode;
}

/**
 * SPARK FRAME - "Inițiere" - TF-bearing cell membrane
 *
 * Faza 1 din modelul celular Hoffman-Monroe:
 * Faza de inițiere pe suprafața celulei TF-bearing.
 *
 * Shows:
 * 1. TF + FVII form TF-VIIa complex
 * 2. TF-VIIa activates FIX → FIXa
 * 3. TF-VIIa activates FX → FXa
 * 4. FXa + FVa → Prothrombinase → FII → FIIa (thrombin spark)
 */
export function SparkFrame({
  width,
  height,
  state,
  onDockFactor,
  showFixaMigration = false,
  showFiiaMigration = false,
  mode = 'manual',
}: SparkFrameProps): React.ReactElement {
  const isAutoMode = mode === 'auto';
  // Layout calculations
  const layout = useMemo(() => {
    const membraneHeight = height * 0.28;
    const bloodstreamHeight = height - membraneHeight;
    const membraneY = bloodstreamHeight;

    // Use percentage-based positioning for responsive layout
    // Cascade flows: TF+FVII → FIX/FX → FXa+FVa → FII
    return {
      membraneHeight,
      membraneY,
      bloodstreamHeight,
      centerX: width / 2,
      positions: {
        // TF anchored at membrane (left side)
        tf: { x: width * 0.12, y: membraneY - 20 },
        // FVII docks with TF from above
        fvii: { x: width * 0.12, y: membraneY - 90 },
        // FIX - activated by TF-VIIa, positioned center-left
        fix: { x: width * 0.32, y: membraneY - 70 },
        // FX - activated by TF-VIIa, positioned center
        fx: { x: width * 0.50, y: membraneY - 65 },
        // FV cofactor - binds with FXa, positioned center-right
        fv: { x: width * 0.68, y: membraneY - 60 },
        // FII (prothrombin) - converted to FIIa, positioned right
        fii: { x: width * 0.85, y: membraneY - 70 },
      },
    };
  }, [width, height]);

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
      {/* Bloodstream area - clinical light background */}
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
      {/* Bloodstream label */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          fontSize: 10,
          fontWeight: 500,
          color: '#94A3B8',
          letterSpacing: 0.5,
        }}
      >
        Plasmă
      </div>

      {/* Membrane surface with PhospholipidMembrane */}
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
          top: layout.membraneY - 10,
        }}
      >
        <TFProtein
          x={0}
          y={0}
          hasVIIa={state.tfVIIaDocked}
          isProducing={state.tfVIIaDocked && (!state.fixDocked || !state.fxDocked)}
        />
      </div>

      {/* FVII Ghost Slot / Docked VIIa */}
      <GhostSlot
        x={layout.positions.fvii.x}
        y={layout.positions.fvii.y}
        factorId="FVII"
        isDocked={state.tfVIIaDocked}
        isHighlighted={false}
        onClick={() => !state.tfVIIaDocked && onDockFactor('TF+FVII')}
        disabled={isAutoMode}
      />

      {/* FIX Ghost Slot / Docked FIXa */}
      <GhostSlot
        x={layout.positions.fix.x}
        y={layout.positions.fix.y}
        factorId="FIX"
        isDocked={state.fixDocked}
        isHighlighted={false}
        onClick={() => !state.fixDocked && state.tfVIIaDocked && onDockFactor('FIX')}
        disabled={!state.tfVIIaDocked || isAutoMode}
        showActivated={state.fixDocked}
      />

      {/* FX Ghost Slot / Docked FXa */}
      <GhostSlot
        x={layout.positions.fx.x}
        y={layout.positions.fx.y}
        factorId="FX"
        isDocked={state.fxDocked}
        isHighlighted={false}
        onClick={() => !state.fxDocked && state.tfVIIaDocked && onDockFactor('FX')}
        disabled={!state.tfVIIaDocked || isAutoMode}
        showActivated={state.fxDocked}
      />

      {/* FV Ghost Slot / Docked FVa (cofactor) */}
      <GhostSlot
        x={layout.positions.fv.x}
        y={layout.positions.fv.y}
        factorId="FV"
        isDocked={state.fvDocked}
        isHighlighted={false}
        onClick={() => !state.fvDocked && state.fxDocked && onDockFactor('FV')}
        disabled={!state.fxDocked || isAutoMode}
        showActivated={state.fvDocked}
      />

      {/* FII Ghost Slot / Docked FIIa (thrombin) */}
      <GhostSlot
        x={layout.positions.fii.x}
        y={layout.positions.fii.y}
        factorId="FII"
        isDocked={state.fiiDocked}
        isHighlighted={false}
        onClick={() => !state.fiiDocked && state.fvDocked && onDockFactor('FII')}
        disabled={!state.fvDocked || isAutoMode}
        showActivated={state.thrombinProduced}
      />

      {/* Prothrombinase Complex Assembly Box - visual enclosure around FXa + FVa */}
      {state.fxDocked && state.fvDocked && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fx.x - 35,
            top: layout.positions.fx.y - 30,
            width: (layout.positions.fv.x - layout.positions.fx.x) + 70,
            height: 65,
            border: '2px dashed #3B82F6',
            borderRadius: 8,
            background: 'rgba(59, 130, 246, 0.05)',
            animation: 'complexPulse 2s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
      )}

      {/* Prothrombinase complex label - clinical style */}
      {state.fvDocked && (
        <div
          style={{
            position: 'absolute',
            left: (layout.positions.fx.x + layout.positions.fv.x) / 2 - 45,
            top: layout.membraneY - 18,
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
          Prothrombinase
        </div>
      )}

      {/* Activation Arrows - SVG overlay */}
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
        {/* TF-VIIa → FIX arrow (curved, textbook style) */}
        {state.tfVIIaDocked && !state.fixDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fvii.x + 25}
            fromY={layout.positions.fvii.y}
            toX={layout.positions.fix.x - 15}
            toY={layout.positions.fix.y}
            color="#DC2626"
            label="activează"
            curved={true}
          />
        )}

        {/* TF-VIIa → FX arrow (curved, textbook style) */}
        {state.tfVIIaDocked && !state.fxDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fvii.x + 25}
            fromY={layout.positions.fvii.y + 15}
            toX={layout.positions.fx.x - 15}
            toY={layout.positions.fx.y}
            color="#DC2626"
            label="activează"
            curved={true}
          />
        )}

        {/* FXa complexes with FVa (assembly arrow) */}
        {state.fxDocked && !state.fvDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fx.x + 25}
            fromY={layout.positions.fx.y}
            toX={layout.positions.fv.x - 15}
            toY={layout.positions.fv.y}
            color="#22C55E"
            label="leagă"
            curved={false}
          />
        )}

        {/* Prothrombinase → FII arrow (catalysis) */}
        {state.fvDocked && !state.fiiDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fv.x + 30}
            fromY={layout.positions.fv.y}
            toX={layout.positions.fii.x - 15}
            toY={layout.positions.fii.y}
            color="#3B82F6"
            label="clivează"
            curved={false}
          />
        )}

        {/* FIXa Migration Arrow - slow, toward ExplosionFrame */}
        {showFixaMigration && state.fixDocked && (
          <MigrationArrowSVG
            fromX={layout.positions.fix.x + 30}
            fromY={layout.positions.fix.y}
            toX={width - 20}
            label="FIXa"
            speed="slow"
            color="#F59E0B"
          />
        )}

        {/* FIIa Migration Arrow - fast, toward ExplosionFrame */}
        {showFiiaMigration && state.thrombinProduced && (
          <MigrationArrowSVG
            fromX={layout.positions.fii.x + 30}
            fromY={layout.positions.fii.y}
            toX={width - 20}
            label="FIIa"
            speed="fast"
            color="#DC2626"
          />
        )}
      </svg>

      {/* Trace Thrombin indicator - medical accuracy: initiation produces ~1-2 nM thrombin */}
      {state.thrombinProduced && (
        <div
          style={{
            position: 'absolute',
            bottom: layout.membraneHeight + 12,
            right: 12,
            padding: '10px 14px',
            background: '#FFFFFF',
            border: '2px solid #DC2626',
            borderRadius: 8,
            zIndex: 15,
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                fontWeight: 700,
                color: '#FFFFFF',
                border: '2px solid #FEE2E2',
              }}
            >
              IIa
            </div>
            <div>
              <div style={{ color: '#DC2626', fontSize: 11, fontWeight: 700 }}>
                TROMBINĂ URMĂ
              </div>
              <div style={{ color: '#64748B', fontSize: 9, marginTop: 2 }}>
                ~1-2 nM · Declanșează amplificarea
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes thrombinPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(153, 27, 27, 0.6); }
          50% { box-shadow: 0 4px 30px rgba(239, 68, 68, 0.8); }
        }
        @keyframes thrombinPulseEnhanced {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(153, 27, 27, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 4px 30px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1);
            transform: scale(1.02);
          }
        }
        @keyframes ghostGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.6)); }
          50% { filter: drop-shadow(0 0 16px rgba(74, 222, 128, 0.9)); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes arrowMove {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(4px); opacity: 0.7; }
        }
        @keyframes complexPulse {
          0%, 100% {
            border-color: rgba(59, 130, 246, 0.6);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
          }
          50% {
            border-color: rgba(59, 130, 246, 1);
            box-shadow: 0 0 16px rgba(59, 130, 246, 0.4);
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// GHOST SLOT COMPONENT
// =============================================================================

interface GhostSlotProps {
  x: number;
  y: number;
  factorId: string;
  isDocked: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  disabled: boolean;
  showActivated?: boolean;
}

function GhostSlot({
  x,
  y,
  factorId,
  isDocked,
  isHighlighted,
  onClick,
  disabled,
  showActivated = false,
}: GhostSlotProps): React.ReactElement {
  // Get the activated factor ID (e.g., FVII -> FVIIa)
  const activatedFactorId = `${factorId}a`;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - 25,
        top: y - 20,
        cursor: disabled || isDocked ? 'default' : 'pointer',
        opacity: disabled && !isDocked ? 0.25 : isDocked ? 1 : isHighlighted ? 0.8 : 0.35,
        filter: isDocked
          ? 'drop-shadow(2px 3px 4px rgba(0,0,0,0.4))'
          : isHighlighted
          ? 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.8))'
          : 'grayscale(50%)',
        transform: isHighlighted && !isDocked ? 'scale(1.15)' : 'scale(1)',
        transition: 'all 0.2s ease',
        zIndex: isDocked ? 5 : 3,
      }}
      onClick={disabled || isDocked ? undefined : onClick}
    >
      <FactorTokenNew
        factorId={showActivated && isDocked ? activatedFactorId : factorId}
        isActive={showActivated && isDocked}
      />
    </div>
  );
}

// =============================================================================
// ACTIVATION ARROW SVG COMPONENT
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
  const markerId = `arrowhead-spark-${fromX}-${fromY}-${toX}-${toY}`;

  // Calculate curved path (quadratic bezier)
  // Control point is above the midpoint for a nice arc
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 30; // Arc above the points
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
        opacity={0.85}
        style={{
          animation: 'dashMove 1s linear infinite',
        }}
      />
      {/* Label on the arrow */}
      {label && (
        <text
          x={midX}
          y={curved ? midY - 5 : (fromY + toY) / 2 - 8}
          textAnchor="middle"
          fontSize={9}
          fontWeight={600}
          fill={color}
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
        >
          {label}
        </text>
      )}
      <style>{`
        @keyframes dashMove {
          from { stroke-dashoffset: 18; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </g>
  );
}

// =============================================================================
// MIGRATION ARROW SVG COMPONENT
// =============================================================================

interface MigrationArrowSVGProps {
  fromX: number;
  fromY: number;
  toX: number;
  label: string;
  speed: 'slow' | 'fast';
  color: string;
}

function MigrationArrowSVG({
  fromX,
  fromY,
  toX,
  label,
  speed,
  color,
}: MigrationArrowSVGProps): React.ReactElement {
  const markerId = `migration-arrow-${label}-${fromX}-${fromY}`;
  const duration = speed === 'slow' ? '3s' : '1.5s';

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 10 4, 0 8" fill={color} />
        </marker>
      </defs>
      {/* Main arrow line */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={fromY}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="8 4"
        markerEnd={`url(#${markerId})`}
        opacity={0.9}
        style={{
          animation: `migrationDash ${duration} linear infinite`,
        }}
      />
      {/* Traveling particle */}
      <circle
        r={5}
        fill={color}
        opacity={0.9}
        style={{
          animation: `migrateParticle ${duration} ease-in-out infinite`,
        }}
      >
        <animateMotion
          dur={duration}
          repeatCount="indefinite"
          path={`M${fromX},${fromY} L${toX},${fromY}`}
        />
      </circle>
      {/* Label above the arrow */}
      <text
        x={(fromX + toX) / 2}
        y={fromY - 12}
        fill={color}
        fontSize={10}
        fontWeight={600}
        textAnchor="middle"
        style={{
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
        }}
      >
        {label} →
      </text>
      <style>{`
        @keyframes migrationDash {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes migrateParticle {
          0% { opacity: 0.9; }
          50% { opacity: 1; }
          100% { opacity: 0.9; }
        }
      `}</style>
    </g>
  );
}
