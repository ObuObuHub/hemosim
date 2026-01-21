// components/game/scenes/PropagationScene.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import type { FloatingFactor } from '@/types/game';

interface PropagationSceneProps {
  width: number;
  height: number;
  floatingFactors: FloatingFactor[];
  // State from Amplification (cofactors already activated)
  tenaseFormed: boolean;
  fxaProduced: boolean;
  prothrombinaseFormed: boolean;
  thrombinBurst: boolean;
  heldFactorId: string | null;
  onFactorCatch: (factorId: string, event: React.MouseEvent) => void;
  onPhaseComplete: () => void;
}

/**
 * PROPAGATION PHASE - Cell-Based Model of Coagulation
 *
 * LAYOUT: Same structure as Initiation/Amplification
 * - Bloodstream (top 75%)
 * - Platelet membrane (bottom 25%) with phospholipid bilayer
 * - Enzyme complexes form on membrane surface
 *
 * MEDICAL ACCURACY (from reference charts):
 * - Tenase Complex: FIXa (enzyme) + FVIIIa (cofactor) → activates FX → FXa
 * - Prothrombinase: FXa (enzyme) + FVa (cofactor) → FII → FIIa (THROMBIN BURST)
 * - This is where the massive thrombin generation occurs (~350 nM peak!)
 *
 * GAMEPLAY:
 * 1. FVIIIa and FVa are pre-docked (from Amplification phase)
 * 2. Catch FIXa (diffused from Initiation), dock with FVIIIa → forms Tenase
 * 3. Tenase produces FXa (visual burst)
 * 4. FXa + FVa → Prothrombinase forms automatically
 * 5. Catch FII, dock with Prothrombinase → THROMBIN BURST!
 */
export function PropagationScene({
  width,
  height,
  floatingFactors,
  tenaseFormed,
  fxaProduced,
  prothrombinaseFormed,
  thrombinBurst,
  heldFactorId,
  onFactorCatch,
}: PropagationSceneProps): React.ReactElement {
  // Same layout as Initiation/Amplification: membrane at bottom 25%
  const membraneHeight = height * 0.25;
  const bloodstreamHeight = height - membraneHeight;
  const membraneY = bloodstreamHeight;

  // Docking positions along the membrane
  const dockingPositions = useMemo(() => ({
    // Left side: FVIIIa cofactor slot (pre-docked) + FIXa enzyme slot for Tenase
    fviiia: { x: width * 0.25, y: membraneY - 60 },
    fixa: { x: width * 0.25 - 40, y: membraneY - 60 },  // FIXa docks next to FVIIIa
    // Center: FXa appears here after Tenase, then forms Prothrombinase with FVa
    fxa: { x: width * 0.5, y: membraneY - 50 },
    fva: { x: width * 0.5 + 40, y: membraneY - 50 },  // FVa pre-docked
    // Right side: FII substrate docking for Prothrombinase
    fii: { x: width * 0.75, y: membraneY - 70 },
  }), [width, membraneY]);

  // Visual feedback states
  const isHoldingFIXa = heldFactorId === 'FIXa';
  const isHoldingFII = heldFactorId === 'FII';
  const canDockFIXa = !tenaseFormed && isHoldingFIXa;
  const canDockFII = prothrombinaseFormed && !thrombinBurst && isHoldingFII;

  // Thrombin burst animation state
  const [burstParticles, setBurstParticles] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([]);

  // Trigger burst animation when thrombin burst happens
  useEffect(() => {
    if (thrombinBurst && burstParticles.length === 0) {
      // Create burst particles
      const particles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: dockingPositions.fii.x,
        y: dockingPositions.fii.y,
        angle: (i * 45) * (Math.PI / 180),
      }));
      setBurstParticles(particles);
    }
  }, [thrombinBurst, burstParticles.length, dockingPositions.fii]);

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
        {/* Floating factors (FIX early, then FII after Prothrombinase) */}
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
        {/* TENASE COMPLEX AREA (left side)                                 */}
        {/* FVIIIa (cofactor, pre-docked) + FIX/FIXa (enzyme)               */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* FVIIIa - pre-docked cofactor from Amplification */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.25 - 25,
            top: -60,
          }}
        >
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))' }}>
            <FactorTokenNew factorId="FVIIIa" isActive />
          </div>
        </div>

        {/* FIXa slot - enzyme for Tenase (already activated, diffused from Initiation) */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.25 - 80,
            top: -60,
          }}
        >
          {!tenaseFormed ? (
            // Ghost slot for FIXa (waiting for docking)
            <div
              style={{
                opacity: canDockFIXa ? 0.8 : 0.3,
                filter: canDockFIXa ? 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.9))' : 'grayscale(50%)',
                transform: canDockFIXa ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <FactorTokenNew factorId="FIXa" />
            </div>
          ) : (
            // FIXa docked - Tenase complex formed!
            <div style={{ filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 1))' }}>
              <FactorTokenNew factorId="FIXa" isActive />
            </div>
          )}
        </div>

        {/* Tenase complex label */}
        {tenaseFormed && (
          <div
            style={{
              position: 'absolute',
              left: width * 0.25 - 50,
              top: -100,
              padding: '4px 12px',
              background: 'rgba(59, 130, 246, 0.9)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            TENASE
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PROTHROMBINASE COMPLEX AREA (center)                            */}
        {/* FXa (enzyme, produced by Tenase) + FVa (cofactor, pre-docked)   */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* FVa - pre-docked cofactor from Amplification */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.5 + 15,
            top: -50,
          }}
        >
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' }}>
            <FactorTokenNew factorId="FVa" isActive />
          </div>
        </div>

        {/* FXa slot - enzyme for Prothrombinase (appears after Tenase) */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.5 - 35,
            top: -50,
          }}
        >
          {!fxaProduced ? (
            // Empty slot - waiting for Tenase to produce FXa
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 8,
                border: '2px dashed rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              FXa?
            </div>
          ) : (
            // FXa produced by Tenase!
            <div
              style={{
                filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 1))',
                animation: prothrombinaseFormed ? 'none' : 'pulse-appear 0.5s ease-out',
              }}
            >
              <FactorTokenNew factorId="FXa" isActive />
            </div>
          )}
        </div>

        {/* Prothrombinase complex label */}
        {prothrombinaseFormed && (
          <div
            style={{
              position: 'absolute',
              left: width * 0.5 - 40,
              top: -95,
              padding: '4px 12px',
              background: 'rgba(239, 68, 68, 0.9)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            PROTHROMBINASE
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FII SUBSTRATE SLOT (right side)                                 */}
        {/* Docking FII with Prothrombinase triggers THROMBIN BURST         */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <div
          style={{
            position: 'absolute',
            left: width * 0.75 - 25,
            top: -70,
          }}
        >
          {!thrombinBurst ? (
            // Ghost slot for FII (only active after Prothrombinase forms)
            <div
              style={{
                opacity: canDockFII ? 0.8 : prothrombinaseFormed ? 0.5 : 0.2,
                filter: canDockFII
                  ? 'drop-shadow(0 0 15px rgba(153, 27, 27, 0.9))'
                  : prothrombinaseFormed
                  ? 'none'
                  : 'grayscale(70%)',
                transform: canDockFII ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <FactorTokenNew factorId="FII" />
            </div>
          ) : (
            // THROMBIN BURST! Multiple thrombin tokens exploding outward
            <div style={{ position: 'relative' }}>
              {burstParticles.map((particle) => (
                <div
                  key={particle.id}
                  style={{
                    position: 'absolute',
                    left: Math.cos(particle.angle) * 60,
                    top: Math.sin(particle.angle) * 60 - 20,
                    filter: 'drop-shadow(0 0 20px rgba(153, 27, 27, 1))',
                    animation: 'burst-out 1s ease-out forwards',
                    transform: `translate(-50%, -50%) scale(${0.6 + Math.random() * 0.4})`,
                  }}
                >
                  <FactorTokenNew factorId="FIIa" isActive />
                </div>
              ))}
              {/* Central thrombin */}
              <div
                style={{
                  filter: 'drop-shadow(0 0 25px rgba(153, 27, 27, 1))',
                  animation: 'pulse 0.3s ease-in-out infinite',
                }}
              >
                <FactorTokenNew factorId="FIIa" isActive />
              </div>
            </div>
          )}
        </div>

        {/* Thrombin burst label */}
        {thrombinBurst && (
          <div
            style={{
              position: 'absolute',
              left: width * 0.75 - 60,
              top: -130,
              padding: '6px 16px',
              background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(127, 29, 29, 0.95) 100%)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 800,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 30px rgba(153, 27, 27, 0.6)',
              animation: 'pulse 0.5s ease-in-out infinite',
            }}
          >
            THROMBIN BURST!
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
          <span style={{ fontSize: 10, color: '#FECACA', marginLeft: 8 }}>thrombin generation</span>
        </div>
      </div>

      {/* Phase indicator */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
          borderRadius: 12,
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 500, opacity: 0.9, letterSpacing: 2 }}>
          PHASE 3
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>
          PROPAGATION
        </div>
        <div style={{ color: '#FEE2E2', fontSize: 9, marginTop: 4 }}>
          Thrombin burst generation
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
        <div style={{ color: '#FCA5A5', fontSize: 12, fontWeight: 700 }}>
          ACTIVATED PLATELET
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
          Enzyme complexes assembling
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
        <ProgressDot label="Tenase" done={tenaseFormed} color="#3B82F6" />
        <ProgressDot label="FXa" done={fxaProduced} color="#EF4444" />
        <ProgressDot label="Prothrombinase" done={prothrombinaseFormed} color="#EF4444" />
        <ProgressDot label="Thrombin Burst" done={thrombinBurst} color="#991B1B" />
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse-appear {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes burst-out {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
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
