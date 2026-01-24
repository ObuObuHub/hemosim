// components/game/scenes/InitiationScene.tsx
'use client';

import { useState } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { TFProtein } from '../visuals/TFProtein';
import { ActivationArrow } from '../visuals/ActivationArrow';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import type {
  FloatingFactor,
  DockedComplex,
  ActivationArrow as ActivationArrowType,
} from '@/types/game';

interface InitiationSceneProps {
  width: number;
  height: number;
  floatingFactors: FloatingFactor[];
  dockedComplexes: DockedComplex[];
  activationArrows: ActivationArrowType[];
  tfDockingState: Record<number, boolean>;   // TF + FVII → TF+VIIa
  fixDockingState: Record<number, boolean>;  // TF+VIIa activates FIX → FIXa
  fxDockingState: Record<number, boolean>;   // TF+VIIa activates FX → FXa
  fvDockingState: Record<number, boolean>;   // FXa + FVa → PROTHROMBINASE
  fiiDockedState: Record<number, boolean>;   // FII → FIIa (THROMBIN!) via Prothrombinase
  plateletPosition: { x: number; y: number; width: number; height: number };
  isDraggingThrombin: boolean;
  onFactorCatch: (factorId: string, event: React.MouseEvent | React.TouchEvent) => void;
  onFactorDock: (factorId: string, complexId: string) => void;
  onThrombinDrag: (thrombinId: string, targetX: number, targetY: number) => void;
  onThrombinDragStart: (fromIndex: number, event: React.MouseEvent | React.TouchEvent) => void;
  onArrowComplete: (arrowId: string) => void;
}

/**
 * INITIATION PHASE - Cell-Based Model of Coagulation
 *
 * MEDICAL ACCURACY (Hoffman & Monroe model):
 * ═══════════════════════════════════════════
 * Location: TF-bearing cell (fibroblast/subendothelium) - exposed after injury
 *
 * Step 1: TF exposed on damaged tissue
 * Step 2: FVII from blood binds TF → TF+VIIa complex
 * Step 3: TF+VIIa activates:
 *         - FIX → FIXa (small amount)
 *         - FX → FXa (small amount)
 * Step 4: FXa + FVa → small Prothrombinase → small thrombin
 * Step 5: This small thrombin diffuses to activate platelets!
 *
 * GAME OBJECTIVE: Build the Extrinsic Xase complex and generate
 * the initial thrombin "spark" that will activate a nearby platelet.
 *
 * Visual: Two cells visible - TF-bearing fibroblast (active) and
 * resting platelet (waiting for thrombin activation)
 */
export function InitiationScene({
  width,
  height,
  floatingFactors,
  dockedComplexes,
  activationArrows,
  tfDockingState,
  fixDockingState,
  fxDockingState,
  fvDockingState,
  fiiDockedState,
  plateletPosition,
  isDraggingThrombin,
  onFactorCatch,
  onThrombinDragStart,
  onArrowComplete,
}: InitiationSceneProps): React.ReactElement {
  // Track touched factor for visual feedback
  const [touchedFactorId, setTouchedFactorId] = useState<string | null>(null);

  // Membrane takes only ~25% at the bottom, bloodstream is 75%
  const membraneHeight = height * 0.25;
  const bloodstreamHeight = height - membraneHeight;
  const membraneY = bloodstreamHeight;

  // TF protein positions - extending UP into bloodstream for visibility
  // Positioned at the membrane boundary, reaching into bloodstream
  const tfPositions = [
    { x: width * 0.2, index: 0 },
    { x: width * 0.5, index: 1 },
    { x: width * 0.8, index: 2 },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {/* Bloodstream area */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: bloodstreamHeight,
          background: 'linear-gradient(180deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
        }}
      >
        {/* Floating factors */}
        {floatingFactors.map((factor) => (
          <div
            key={factor.id}
            style={{
              position: 'absolute',
              left: factor.position.x,
              top: factor.position.y,
              transform: 'translate(-50%, -50%)',
              cursor: 'grab',
              padding: '8px',
              margin: '-8px',
              touchAction: 'none',
            }}
            onMouseDown={(e) => {
              setTouchedFactorId(factor.id);
              onFactorCatch(factor.id, e);
            }}
            onTouchStart={(e) => {
              setTouchedFactorId(factor.id);
              onFactorCatch(factor.id, e);
            }}
            onMouseUp={() => setTouchedFactorId(null)}
            onTouchEnd={() => setTouchedFactorId(null)}
          >
            <FactorTokenNew
              factorId={factor.factorId}
              isTouched={touchedFactorId === factor.id}
            />
          </div>
        ))}
      </div>

      {/* Membrane surface */}
      <div
        style={{
          position: 'absolute',
          top: membraneY,
          left: 0,
          width: '100%',
          height: membraneHeight,
        }}
      >
        <PhospholipidMembrane
          width={width}
          height={membraneHeight}
          variant="fibroblast"
        />

        {/* TF complexes - clustered blobs like reference image */}
        {tfPositions.map((pos) => (
          <div key={`tf-container-${pos.index}`}>
            {/* FVII docking zone - ghosted silhouette */}
            {!tfDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 5,
                  top: -85,
                  opacity: 0.25,
                  filter: 'grayscale(50%)',
                  pointerEvents: 'none',
                }}
              >
                <FactorTokenNew factorId="FVII" />
              </div>
            )}

            {/* TF protein (always visible) */}
            <TFProtein
              x={pos.x}
              y={0}
              hasVIIa={tfDockingState[pos.index]}
            />

            {/* VIIa blob sitting ON TOP of TF when docked (like reference) */}
            {tfDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 5,
                  top: -85,
                  filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.4))',
                }}
              >
                <FactorTokenNew factorId="FVIIa" isActive />
              </div>
            )}

            {/* FIX docking slot - ghosted silhouette */}
            {tfDockingState[pos.index] && !fixDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 85,
                  top: -45,
                  opacity: 0.25,
                  filter: 'grayscale(50%)',
                  pointerEvents: 'none',
                }}
              >
                <FactorTokenNew factorId="FIX" />
              </div>
            )}

            {/* FIXa blob when docked (purple, left of complex) */}
            {/* TEXTBOOK: FIXa will diffuse to platelet for Tenase in Propagation */}
            {fixDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 85,
                  top: -45,
                  filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.4))',
                }}
              >
                <FactorTokenNew factorId="FIXa" isActive />
              </div>
            )}

            {/* FX docking slot - ghosted silhouette */}
            {tfDockingState[pos.index] && !fxDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 45,
                  top: -55,
                  opacity: 0.25,
                  filter: 'grayscale(50%)',
                  pointerEvents: 'none',
                }}
              >
                <FactorTokenNew factorId="FX" />
              </div>
            )}

            {/* FXa blob when docked (Extrinsic Xase formed!) */}
            {fxDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 45,
                  top: -55,
                  filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.4))',
                }}
              >
                <FactorTokenNew factorId="FXa" isActive />
              </div>
            )}

            {/* FV docking slot - ghosted silhouette */}
            {fxDockingState[pos.index] && !fvDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 95,
                  top: -45,
                  opacity: 0.25,
                  filter: 'grayscale(50%)',
                  pointerEvents: 'none',
                }}
              >
                <FactorTokenNew factorId="FV" />
              </div>
            )}

            {/* FVa blob when docked - PROTHROMBINASE FORMED! */}
            {fvDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 95,
                  top: -45,
                  filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.4))',
                }}
              >
                <FactorTokenNew factorId="FVa" isActive />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* FII SUBSTRATE SLOT - Prothrombinase needs FII!         */}
            {/* ═══════════════════════════════════════════════════════ */}
            {fvDockingState[pos.index] && !fiiDockedState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 145,
                  top: -70,
                  opacity: 0.25,
                  filter: 'grayscale(50%)',
                  pointerEvents: 'none',
                }}
              >
                <FactorTokenNew factorId="FII" />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* THROMBIN (FIIa) - the product after FII conversion!    */}
            {/* Pulsing glow indicates it can be grabbed and moved     */}
            {/* ═══════════════════════════════════════════════════════ */}
            {fiiDockedState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 145,
                  top: -75,
                  cursor: 'grab',
                  zIndex: 50,
                  padding: '8px',
                  margin: '-8px',
                  touchAction: 'none',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  console.log('🟢 THROMBIN CLICKED at index:', pos.index);
                  onThrombinDragStart(pos.index, e);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  console.log('🟢 THROMBIN TOUCHED at index:', pos.index);
                  onThrombinDragStart(pos.index, e);
                }}
              >
                {/* Pulsing glow effect to indicate draggability */}
                <div
                  style={{
                    position: 'absolute',
                    inset: -25,
                    background: 'radial-gradient(circle, rgba(153, 27, 27, 0.8) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    filter: 'drop-shadow(0 0 18px rgba(153, 27, 27, 1))',
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }}
                >
                  <FactorTokenNew factorId="FIIa" isActive />
                </div>
              </div>
            )}

            {/* Prothrombinase label when formed */}
            {fvDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 60,
                  top: 10,
                  padding: '3px 8px',
                  background: 'rgba(59, 130, 246, 0.8)',
                  borderRadius: 6,
                  fontSize: 8,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                PROTHROMBINASE
              </div>
            )}
          </div>
        ))}

        {/* Docked complexes */}
        {dockedComplexes.map((complex) => (
          <div
            key={complex.id}
            style={{
              position: 'absolute',
              left: complex.position.x,
              top: complex.position.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {complex.enzymeFactorId && (
              <FactorTokenNew factorId={complex.enzymeFactorId} isActive />
            )}
            {complex.cofactorFactorId && (
              <FactorTokenNew factorId={complex.cofactorFactorId} isActive />
            )}
          </div>
        ))}
      </div>

      {/* Activation arrows */}
      {activationArrows.map((arrow) => (
        <ActivationArrow
          key={arrow.id}
          fromX={arrow.fromPosition.x}
          fromY={arrow.fromPosition.y}
          toX={arrow.toPosition.x}
          toY={arrow.toPosition.y}
          color={arrow.color}
          onComplete={() => onArrowComplete(arrow.id)}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RESTING PLATELET - uses same PhospholipidMembrane component    */}
      {/* Positioned at top-middle, membrane facing down into bloodstream */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          left: plateletPosition.x - plateletPosition.width / 2,
          top: 0,
          width: plateletPosition.width,
          transition: 'filter 0.3s ease',
          filter: isDraggingThrombin
            ? 'drop-shadow(0 0 30px rgba(153, 27, 27, 0.9))'
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
      >
        {/* Reuse the same membrane component as fibroblast */}
        <div style={{
          animation: isDraggingThrombin ? 'pulse 0.8s ease-in-out infinite' : 'none',
        }}>
          <PhospholipidMembrane
            width={plateletPosition.width}
            height={plateletPosition.height}
            variant="platelet"
          />
        </div>

        {/* PLT label overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 16,
            fontWeight: 800,
            color: isDraggingThrombin ? '#1E40AF' : '#9F1239',
            textShadow: '0 1px 2px rgba(255,255,255,0.8)',
          }}
        >
          PLT
        </div>

        {/* Ghosted thrombin docking zone below */}
        <div
          style={{
            position: 'absolute',
            bottom: -45,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: isDraggingThrombin ? 0.7 : 0.25,
            transition: 'opacity 0.3s ease',
          }}
        >
          <FactorTokenNew factorId="FIIa" isActive />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PHASE INDICATOR - Educational label                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.9) 100%)',
          borderRadius: 12,
          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 500, opacity: 0.9, letterSpacing: 2 }}>
          FAZA 1
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>
          INIȚIERE
        </div>
        <div style={{ color: '#DCFCE7', fontSize: 9, marginTop: 4 }}>
          Suprafața celulei cu TF
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CELL LABEL - Fibroblast identification                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div style={{ color: '#F9DC5C', fontSize: 12, fontWeight: 700 }}>
          FIBROBLAST CU TF
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
          Suprafața subendotelială expusă după leziune
        </div>
      </div>

    </div>
  );
}
