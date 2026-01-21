// components/game/scenes/StabilizationScene.tsx
'use client';

import { useMemo } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import type { FloatingFactor } from '@/types/game';

interface StabilizationSceneProps {
  width: number;
  height: number;
  floatingFactors: FloatingFactor[];
  fibrinCount: number;        // Number of fibrin strands formed
  fxiiiActivated: boolean;    // FXIII → FXIIIa by thrombin
  meshCrosslinked: boolean;   // FXIIIa crosslinked the mesh
  heldFactorId: string | null;
  onFactorCatch: (factorId: string, event: React.MouseEvent) => void;
  onPhaseComplete: () => void;
}

/**
 * STABILIZATION PHASE - Cell-Based Model of Coagulation
 *
 * LAYOUT: Same structure as previous phases
 * - Bloodstream (top 75%)
 * - Platelet membrane (bottom 25%) - now covered with fibrin mesh
 *
 * MEDICAL ACCURACY (from reference chart - FORMAREA CHEAGULUI):
 * - Thrombin cleaves Fibrinogen → Fibrin monomers
 * - Fibrin monomers polymerize into strands
 * - Thrombin activates FXIII → FXIIIa
 * - FXIIIa crosslinks fibrin strands → stable clot
 *
 * GAMEPLAY:
 * 1. Thrombin (from Propagation) is active on membrane
 * 2. Catch Fibrinogen, dock with thrombin → Fibrin strand appears
 * 3. Repeat until enough fibrin (3 strands)
 * 4. Catch FXIII, dock with thrombin → FXIIIa
 * 5. FXIIIa crosslinks mesh → STABLE CLOT → Victory!
 */
export function StabilizationScene({
  width,
  height,
  floatingFactors,
  fibrinCount,
  fxiiiActivated,
  meshCrosslinked,
  heldFactorId,
  onFactorCatch,
}: StabilizationSceneProps): React.ReactElement {
  // Same layout as previous phases
  const membraneHeight = height * 0.25;
  const bloodstreamHeight = height - membraneHeight;
  const membraneY = bloodstreamHeight;

  // Docking positions
  const dockingPositions = useMemo(() => ({
    // Thrombin is active in center (from Propagation)
    thrombin: { x: width * 0.5, y: membraneY - 50 },
    // Fibrinogen docking zone (wide area around thrombin)
    fibrinogen: { x: width * 0.5, y: membraneY - 80 },
    // FXIII docking (right of thrombin)
    fxiii: { x: width * 0.7, y: membraneY - 60 },
  }), [width, membraneY]);

  // Visual feedback
  const isHoldingFibrinogen = heldFactorId === 'Fibrinogen';
  const isHoldingFXIII = heldFactorId === 'FXIII';
  const canDockFibrinogen = fibrinCount < 3 && isHoldingFibrinogen;
  const canDockFXIII = fibrinCount >= 3 && !fxiiiActivated && isHoldingFXIII;

  // Fibrin strand positions (accumulate as player docks fibrinogen)
  const fibrinPositions = useMemo(() => [
    { x: width * 0.3, y: membraneY - 30, angle: -15 },
    { x: width * 0.5, y: membraneY - 40, angle: 5 },
    { x: width * 0.7, y: membraneY - 35, angle: -8 },
  ], [width, membraneY]);

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
            }}
            onMouseDown={(e) => onFactorCatch(factor.id, e)}
          >
            <FactorTokenNew factorId={factor.factorId} />
          </div>
        ))}
      </div>

      {/* Platelet membrane surface (bottom 25%) */}
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
          variant="platelet"
        />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ACTIVE THROMBIN (from Propagation burst)                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.5 - 25,
            top: -50,
          }}
        >
          <div style={{ filter: 'drop-shadow(0 0 15px rgba(153, 27, 27, 0.9))' }}>
            <FactorTokenNew factorId="FIIa" isActive />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FIBRINOGEN DOCKING ZONE                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {fibrinCount < 3 && (
          <div
            style={{
              position: 'absolute',
              left: width * 0.5 - 40,
              top: -100,
            }}
          >
            <div
              style={{
                opacity: canDockFibrinogen ? 0.8 : 0.3,
                filter: canDockFibrinogen ? 'drop-shadow(0 0 15px rgba(234, 179, 8, 0.9))' : 'grayscale(50%)',
                transform: canDockFibrinogen ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <FactorTokenNew factorId="Fibrinogen" />
            </div>
            <div style={{
              position: 'absolute',
              top: 45,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 9,
              color: 'rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
            }}>
              {fibrinCount}/3 fibrin
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FIBRIN STRANDS (appear as fibrinogen is converted)              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {fibrinPositions.slice(0, fibrinCount).map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: `rotate(${pos.angle}deg)`,
            }}
          >
            {/* Fibrin strand visual */}
            <div
              style={{
                width: 120,
                height: 8,
                background: meshCrosslinked
                  ? 'linear-gradient(90deg, #22C55E 0%, #16A34A 50%, #22C55E 100%)'
                  : 'linear-gradient(90deg, #EAB308 0%, #CA8A04 50%, #EAB308 100%)',
                borderRadius: 4,
                boxShadow: meshCrosslinked
                  ? '0 0 12px rgba(34, 197, 94, 0.8)'
                  : '0 0 8px rgba(234, 179, 8, 0.6)',
                animation: meshCrosslinked ? 'none' : 'pulse 2s ease-in-out infinite',
              }}
            />
            {/* Crosslink markers when FXIIIa active */}
            {meshCrosslinked && (
              <>
                <div style={{
                  position: 'absolute',
                  left: 30,
                  top: -4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#22C55E',
                  border: '2px solid #15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  color: '#FFFFFF',
                  fontWeight: 700,
                }}>X</div>
                <div style={{
                  position: 'absolute',
                  left: 80,
                  top: -4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#22C55E',
                  border: '2px solid #15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  color: '#FFFFFF',
                  fontWeight: 700,
                }}>X</div>
              </>
            )}
          </div>
        ))}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FXIII SLOT (appears after enough fibrin)                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {fibrinCount >= 3 && (
          <div
            style={{
              position: 'absolute',
              left: width * 0.7 - 25,
              top: -60,
            }}
          >
            {!fxiiiActivated ? (
              <div
                style={{
                  opacity: canDockFXIII ? 0.8 : 0.4,
                  filter: canDockFXIII ? 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.9))' : 'grayscale(50%)',
                  transform: canDockFXIII ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <FactorTokenNew factorId="FXIII" />
              </div>
            ) : (
              <div style={{ filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 1))' }}>
                <FactorTokenNew factorId="FXIIIa" isActive />
              </div>
            )}
          </div>
        )}

        {/* Crosslink label when complete */}
        {meshCrosslinked && (
          <div
            style={{
              position: 'absolute',
              left: width * 0.5 - 60,
              top: -130,
              padding: '8px 20px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%)',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 800,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.7)',
              animation: 'pulse 0.8s ease-in-out infinite',
            }}
          >
            STABLE CLOT!
          </div>
        )}

        {/* PLT* label */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 40,
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            background: 'rgba(127, 29, 29, 0.8)',
            borderRadius: 8,
            border: '2px solid #DC2626',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: '#FEE2E2' }}>PLT*</span>
          <span style={{ fontSize: 10, color: '#FECACA', marginLeft: 8 }}>fibrin stabilization</span>
        </div>
      </div>

      {/* Phase indicator */}
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
          PHASE 4
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>
          STABILIZATION
        </div>
        <div style={{ color: '#DCFCE7', fontSize: 9, marginTop: 4 }}>
          Fibrin mesh crosslinking
        </div>
      </div>

      {/* Cell label */}
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
        <div style={{ color: '#86EFAC', fontSize: 12, fontWeight: 700 }}>
          CLOT FORMATION
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
          Fibrin polymerization + crosslinking
        </div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 20,
          padding: '12px 24px',
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 12,
        }}
      >
        <ProgressDot label="Fibrin 1" done={fibrinCount >= 1} color="#EAB308" />
        <ProgressDot label="Fibrin 2" done={fibrinCount >= 2} color="#EAB308" />
        <ProgressDot label="Fibrin 3" done={fibrinCount >= 3} color="#EAB308" />
        <ProgressDot label="FXIIIa" done={fxiiiActivated} color="#22C55E" />
        <ProgressDot label="Crosslinked" done={meshCrosslinked} color="#22C55E" />
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

function ProgressDot({ label, done, color }: { label: string; done: boolean; color: string }): React.ReactElement {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: done ? color : 'rgba(255,255,255,0.2)',
          margin: '0 auto 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#FFFFFF',
        }}
      >
        {done ? '✓' : ''}
      </div>
      <div style={{ fontSize: 9, color: done ? color : 'rgba(255,255,255,0.5)' }}>{label}</div>
    </div>
  );
}
