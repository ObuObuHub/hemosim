// components/game/scenes/InitiationScene.tsx
'use client';

import { useState } from 'react';
import { ActivationArrow } from '../visuals/ActivationArrow';
import {
  ConsistentFactorToken,
  ThrombinSpark,
  TFReceptor,
  PhospholipidMembraneConsistent,
} from '../tokens/ConsistentFactorToken';
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

  // Layout from reference (top to bottom):
  // - Bloodstream gradient (70%)
  // - Pink fibroblast tissue at bottom (30%)
  const bloodstreamHeight = height * 0.7;
  const fibroblastHeight = height * 0.3;
  const fibroblastY = bloodstreamHeight;

  // TF receptor positions on fibroblast membrane
  const tfPositions = [
    { x: width * 0.25, index: 0 },
    { x: width * 0.5, index: 1 },
    { x: width * 0.75, index: 2 },
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
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* BLOODSTREAM - Gradient from white/cream to light pink          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: bloodstreamHeight,
          background: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 20%, #FED7AA 50%, #FED7E2 80%, #FFC9D6 100%)',
        }}
      >
        {/* Thrombin spark indicator in upper right */}
        {fiiDockedState[0] && (
          <div style={{ position: 'absolute', top: 20, right: 30 }}>
            <ThrombinSpark size={35} />
          </div>
        )}

        {/* Floating factors in bloodstream */}
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
            <ConsistentFactorToken
              factorId={factor.factorId}
              style={{
                filter: touchedFactorId === factor.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                transition: 'filter 0.2s ease',
              }}
            />
          </div>
        ))}

        {/* Show activated factors floating near TF site */}
        {tfPositions.map((pos) => (
          <div key={`activated-${pos.index}`}>
            {/* FIXa floating */}
            {fixDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 60,
                  top: bloodstreamHeight * 0.6,
                }}
              >
                <ConsistentFactorToken factorId="FIXa" />
              </div>
            )}
            {/* FXa floating */}
            {fxDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 60,
                  top: bloodstreamHeight * 0.5,
                }}
              >
                <ConsistentFactorToken factorId="FXa" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TF-BEARING FIBROBLAST - Pink tissue at bottom                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: fibroblastY,
          left: 0,
          width: '100%',
          height: fibroblastHeight,
        }}
      >
        <svg width={width} height={fibroblastHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="fibroblast-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FED7E2" />
              <stop offset="50%" stopColor="#FBB6CE" />
              <stop offset="100%" stopColor="#F9A8C0" />
            </linearGradient>
            <pattern id="tissue-texture" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="2" fill="#EC4899" opacity={0.1} />
            </pattern>
          </defs>

          {/* Fibroblast cell body - pink tissue matching reference */}
          <rect x={0} y={0} width={width} height={fibroblastHeight} fill="url(#fibroblast-grad)" />
          <rect x={0} y={0} width={width} height={fibroblastHeight} fill="url(#tissue-texture)" />
        </svg>

        {/* Membrane at top of fibroblast */}
        <PhospholipidMembraneConsistent
          width={width}
          height={20}
          variant="fibroblast"
          style={{ position: 'absolute', top: 0, left: 0 }}
        />

        {/* TF Receptors embedded in membrane */}
        {tfPositions.map((pos) => (
          <div key={`tf-receptor-${pos.index}`}>
            <TFReceptor
              height={60}
              style={{
                position: 'absolute',
                left: pos.x - 15,
                top: -10,
              }}
            />

            {/* FVIIa docked to TF */}
            {tfDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 25,
                  top: -25,
                }}
              >
                <ConsistentFactorToken factorId="FVIIa" />
              </div>
            )}

            {/* Ghost FVIIa waiting to dock */}
            {!tfDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 25,
                  top: -25,
                }}
              >
                <ConsistentFactorToken factorId="FVII" isGhost />
              </div>
            )}

            {/* Prothrombinase complex on right side of fibroblast */}
            {fvDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 70,
                  top: 30,
                }}
              >
                {/* FXa + FVa + Prothrombin grouped together */}
                <div style={{ position: 'relative' }}>
                  {/* FXa */}
                  <div style={{ position: 'absolute', left: 0, top: 0 }}>
                    <ConsistentFactorToken factorId="FXa" />
                  </div>
                  {/* FVa */}
                  <div style={{ position: 'absolute', left: 50, top: 0 }}>
                    <ConsistentFactorToken factorId="FVa" />
                  </div>
                  {/* Prothrombin/Thrombin */}
                  {fiiDockedState[pos.index] ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: 25,
                        top: 40,
                        cursor: 'grab',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onThrombinDragStart(pos.index, e as unknown as React.MouseEvent);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        onThrombinDragStart(pos.index, e as unknown as React.TouchEvent);
                      }}
                    >
                      <ConsistentFactorToken
                        factorId="FIIa"
                        style={{
                          animation: 'pulse 1.5s ease-in-out infinite',
                          filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))',
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', left: 25, top: 40 }}>
                      <ConsistentFactorToken factorId="FII" isGhost />
                    </div>
                  )}

                  {/* Label */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: -20,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#881337',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Prothrombinase Complex
                  </div>
                </div>
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
            {complex.enzymeFactorId && <ConsistentFactorToken factorId={complex.enzymeFactorId} />}
            {complex.cofactorFactorId && (
              <div style={{ marginLeft: 5 }}>
                <ConsistentFactorToken factorId={complex.cofactorFactorId} />
              </div>
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
      {/* RESTING PLATELET - Positioned in bloodstream                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          left: plateletPosition.x - plateletPosition.width / 2,
          top: bloodstreamHeight * 0.4,
          width: plateletPosition.width,
          transition: 'filter 0.3s ease',
          filter: isDraggingThrombin
            ? 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.9))'
            : 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
        }}
      >
        <svg
          width={plateletPosition.width}
          height={plateletPosition.height}
          style={{
            animation: isDraggingThrombin ? 'pulse 0.8s ease-in-out infinite' : 'none',
          }}
        >
          <defs>
            <radialGradient id="platelet-grad" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#FED7E2" />
              <stop offset="50%" stopColor="#FBB6CE" />
              <stop offset="100%" stopColor="#F687B3" />
            </radialGradient>
          </defs>

          <ellipse
            cx={plateletPosition.width / 2}
            cy={plateletPosition.height / 2}
            rx={plateletPosition.width / 2 - 5}
            ry={plateletPosition.height / 2 - 5}
            fill="url(#platelet-grad)"
            stroke="#EC4899"
            strokeWidth={3}
          />

          <text
            x={plateletPosition.width / 2}
            y={plateletPosition.height / 2 + 6}
            textAnchor="middle"
            fontSize={18}
            fontWeight={800}
            fill="#831843"
          >
            PLT
          </text>
        </svg>

        {/* Ghosted thrombin docking zone */}
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: isDraggingThrombin ? 0.8 : 0.3,
            transition: 'opacity 0.3s ease',
          }}
        >
          <ConsistentFactorToken factorId="FIIa" isGhost />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PHASE INDICATOR                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: 15,
          left: 15,
          padding: '10px 18px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%)',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          border: '2px solid rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 600, opacity: 0.9, letterSpacing: 1.5 }}>
          FAZA 1
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 800, marginTop: 2 }}>
          INIȚIERE
        </div>
        <div style={{ color: '#DCFCE7', fontSize: 8, marginTop: 3, fontWeight: 500 }}>
          Celulă purtătoare de TF
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CELL LABEL - Fibroblast                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          bottom: 15,
          left: 15,
          padding: '8px 14px',
          background: 'rgba(136, 19, 55, 0.85)',
          borderRadius: 8,
          border: '2px solid rgba(251, 182, 206, 0.6)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ color: '#FED7E2', fontSize: 11, fontWeight: 700 }}>
          TF expressing fibroblasts
        </div>
        <div style={{ color: '#FEF3C7', fontSize: 8, marginTop: 2, fontWeight: 500 }}>
          Subendoteliu expus după leziune
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}
