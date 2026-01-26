// components/game/panels/InitiationPanel.tsx
'use client';

import { useMemo } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { TFProtein } from '../visuals/TFProtein';
import type { InitiationState } from '@/hooks/useThreePanelState';

interface InitiationPanelProps {
  width: number;
  height: number;
  state: InitiationState;
  onDockFactor: (factorId: string) => void;
}

/**
 * INITIATION PANEL - TF-bearing cell membrane (Textbook Style)
 *
 * Visual design based on InitiationScene with:
 * - Red bloodstream gradient background
 * - PhospholipidMembrane at bottom (fibroblast variant)
 * - Ghost slots for factor docking
 * - Phase badge with gradient
 *
 * Shows the initial phase where:
 * 1. TF + FVII form TF-VIIa complex
 * 2. TF-VIIa activates FIX → FIXa
 * 3. TF-VIIa activates FX → FXa
 * 4. FXa + FVa → Prothrombinase → FII → FIIa (thrombin spark)
 */
export function InitiationPanel({
  width,
  height,
  state,
  onDockFactor,
}: InitiationPanelProps): React.ReactElement {
  // Layout calculations
  const layout = useMemo(() => {
    const membraneHeight = height * 0.28;
    const bloodstreamHeight = height - membraneHeight;
    const membraneY = bloodstreamHeight;

    // Factor docking positions along the membrane surface
    const centerX = width / 2;
    const spacing = Math.min(width * 0.12, 55);

    return {
      membraneHeight,
      membraneY,
      bloodstreamHeight,
      centerX,
      spacing,
      positions: {
        tf: { x: centerX - spacing * 1.5, y: membraneY - 30 },
        fvii: { x: centerX - spacing * 1.5, y: membraneY - 75 },
        fix: { x: centerX - spacing * 0.5, y: membraneY - 50 },
        fx: { x: centerX + spacing * 0.5, y: membraneY - 50 },
        fv: { x: centerX + spacing * 1.3, y: membraneY - 45 },
        fii: { x: centerX + spacing * 2.1, y: membraneY - 55 },
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
      {/* Bloodstream area - red gradient like InitiationScene */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: layout.bloodstreamHeight,
          background: 'linear-gradient(180deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
        }}
      />

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
      </div>

      {/* Phase Badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '8px 14px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.9) 100%)',
          borderRadius: 10,
          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
          zIndex: 20,
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 500, opacity: 0.9, letterSpacing: 1.5 }}>
          FAZA 1
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>
          INIȚIERE
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
        disabled={false}
      />

      {/* FIX Ghost Slot / Docked FIXa */}
      <GhostSlot
        x={layout.positions.fix.x}
        y={layout.positions.fix.y}
        factorId="FIX"
        isDocked={state.fixDocked}
        isHighlighted={false}
        onClick={() => !state.fixDocked && state.tfVIIaDocked && onDockFactor('FIX')}
        disabled={!state.tfVIIaDocked}
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
        disabled={!state.tfVIIaDocked}
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
        disabled={!state.fxDocked}
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
        disabled={!state.fvDocked}
        showActivated={state.thrombinProduced}
      />

      {/* Prothrombinase label when FXa + FVa are docked */}
      {state.fvDocked && (
        <div
          style={{
            position: 'absolute',
            left: layout.positions.fv.x - 25,
            top: layout.membraneY - 15,
            padding: '3px 8px',
            background: 'rgba(59, 130, 246, 0.85)',
            borderRadius: 6,
            fontSize: 8,
            color: '#FFFFFF',
            fontWeight: 600,
            letterSpacing: 0.5,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
          }}
        >
          PROTHROMBINASE
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
        {/* TF-VIIa → FIX arrow */}
        {state.tfVIIaDocked && !state.fixDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fvii.x + 25}
            fromY={layout.positions.fvii.y}
            toX={layout.positions.fix.x - 15}
            toY={layout.positions.fix.y}
            color="#EF4444"
          />
        )}

        {/* TF-VIIa → FX arrow */}
        {state.tfVIIaDocked && !state.fxDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fvii.x + 25}
            fromY={layout.positions.fvii.y}
            toX={layout.positions.fx.x - 15}
            toY={layout.positions.fx.y}
            color="#EF4444"
          />
        )}

        {/* FXa → FV arrow */}
        {state.fxDocked && !state.fvDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fx.x + 25}
            fromY={layout.positions.fx.y}
            toX={layout.positions.fv.x - 15}
            toY={layout.positions.fv.y}
            color="#EF4444"
          />
        )}

        {/* Prothrombinase → FII arrow */}
        {state.fvDocked && !state.fiiDocked && (
          <ActivationArrowSVG
            fromX={layout.positions.fv.x + 30}
            fromY={layout.positions.fv.y}
            toX={layout.positions.fii.x - 15}
            toY={layout.positions.fii.y}
            color="#3B82F6"
          />
        )}
      </svg>

      {/* Thrombin Spark Indicator */}
      {state.thrombinProduced && (
        <div
          style={{
            position: 'absolute',
            bottom: layout.membraneHeight + 8,
            right: 12,
            padding: '6px 12px',
            background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(127, 29, 29, 0.95) 100%)',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(153, 27, 27, 0.6)',
            animation: 'thrombinPulse 1.5s ease-in-out infinite',
            zIndex: 15,
          }}
        >
          <div style={{ color: '#FCA5A5', fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>
            TROMBINĂ GENERATĂ
          </div>
          <div style={{ color: '#FBBF24', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
            FIIa →
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes thrombinPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(153, 27, 27, 0.6); }
          50% { box-shadow: 0 4px 30px rgba(239, 68, 68, 0.8); }
        }
        @keyframes ghostGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.6)); }
          50% { filter: drop-shadow(0 0 16px rgba(74, 222, 128, 0.9)); }
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
}

function ActivationArrowSVG({
  fromX,
  fromY,
  toX,
  toY,
  color,
}: ActivationArrowSVGProps): React.ReactElement {
  const markerId = `arrowhead-${fromX}-${fromY}-${toX}-${toY}`;

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
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="6 3"
        markerEnd={`url(#${markerId})`}
        opacity={0.8}
        style={{
          animation: 'dashMove 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes dashMove {
          from { stroke-dashoffset: 18; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </g>
  );
}
