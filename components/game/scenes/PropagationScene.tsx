// components/game/scenes/PropagationScene.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { EnzymeComplex } from '../visuals/EnzymeComplex';
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
  onFactorCatch: (factorId: string, event: React.MouseEvent | React.TouchEvent) => void;
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
  const [touchedFactorId, setTouchedFactorId] = useState<string | null>(null);

  // Same layout as Initiation/Amplification: membrane at bottom 25%
  const membraneHeight = height * 0.25;
  const bloodstreamHeight = height - membraneHeight;
  const membraneY = bloodstreamHeight;

  // Complex and docking positions along the membrane
  const positions = useMemo(() => ({
    // Tenase complex position (left side)
    tenase: { x: width * 0.22, y: membraneY - 35 },
    // Prothrombinase complex position (center)
    prothrombinase: { x: width * 0.52, y: membraneY - 35 },
    // FII substrate docking for Prothrombinase (right side)
    fii: { x: width * 0.78, y: membraneY - 50 },
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
      // Create burst particles (~350 nM thrombin burst = 12 particles for visual impact)
      // Defer state update to avoid cascading renders
      const timer = setTimeout(() => {
        const particles = Array.from({ length: 12 }, (_, i) => ({
          id: i,
          x: positions.fii.x,
          y: positions.fii.y,
          angle: (i * 30) * (Math.PI / 180),
        }));
        setBurstParticles(particles);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [thrombinBurst, burstParticles.length, positions.fii]);

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
        {/* TENASE COMPLEX (left side)                                      */}
        {/* FIXa (enzyme) + FVIIIa (cofactor) → ~200,000× amplification     */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* Pre-docking ghost slot for FIXa when not yet formed */}
        {!tenaseFormed && (
          <div
            style={{
              position: 'absolute',
              left: positions.tenase.x - 70,
              top: -60,
              opacity: canDockFIXa ? 0.9 : 0.35,
              filter: canDockFIXa
                ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.9))'
                : 'grayscale(50%)',
              transform: canDockFIXa ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <FactorTokenNew factorId="FIXa" />
            {canDockFIXa && (
              <div style={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 9,
                color: '#60A5FA',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                animation: 'pulse 1s ease-in-out infinite',
              }}>
                ANDOCHEAZĂ AICI
              </div>
            )}
          </div>
        )}

        {/* Pre-docked FVIIIa cofactor (waiting for FIXa) */}
        {!tenaseFormed && (
          <div
            style={{
              position: 'absolute',
              left: positions.tenase.x + 10,
              top: -60,
            }}
          >
            <div style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))' }}>
              <FactorTokenNew factorId="FVIIIa" isActive />
            </div>
          </div>
        )}

        {/* Tenase EnzymeComplex - appears when formed */}
        {tenaseFormed && (
          <EnzymeComplex
            type="tenase"
            isFormed={tenaseFormed}
            isProducing={tenaseFormed && !fxaProduced}
            showSubstrate={tenaseFormed && !fxaProduced}
            showProduct={fxaProduced && !prothrombinaseFormed}
            enzymeFactorId="FIXa"
            cofactorFactorId="FVIIIa"
            substrateId="FX"
            productId="FXa"
            amplificationFactor="×200,000"
            position={positions.tenase}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PROTHROMBINASE COMPLEX (center)                                 */}
        {/* FXa (enzyme) + FVa (cofactor) → ~300,000× amplification         */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* Pre-docked FVa cofactor (waiting for FXa from Tenase) */}
        {!prothrombinaseFormed && (
          <div
            style={{
              position: 'absolute',
              left: positions.prothrombinase.x + 10,
              top: -50,
              opacity: fxaProduced ? 1 : 0.4,
              filter: fxaProduced
                ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))'
                : 'grayscale(40%)',
              transition: 'all 0.3s ease',
            }}
          >
            <FactorTokenNew factorId="FVa" isActive={fxaProduced} />
          </div>
        )}

        {/* FXa slot placeholder (waiting for Tenase to produce) */}
        {!fxaProduced && (
          <div
            style={{
              position: 'absolute',
              left: positions.prothrombinase.x - 35,
              top: -50,
              width: 44,
              height: 44,
              borderRadius: 8,
              border: '2px dashed rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            FXa?
          </div>
        )}

        {/* FXa appearing animation (produced by Tenase, before Prothrombinase forms) */}
        {fxaProduced && !prothrombinaseFormed && (
          <div
            style={{
              position: 'absolute',
              left: positions.prothrombinase.x - 35,
              top: -50,
              filter: 'drop-shadow(0 0 18px rgba(239, 68, 68, 1))',
              animation: 'pulse-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <FactorTokenNew factorId="FXa" isActive />
          </div>
        )}

        {/* Prothrombinase EnzymeComplex - appears when formed */}
        {prothrombinaseFormed && (
          <EnzymeComplex
            type="prothrombinase"
            isFormed={prothrombinaseFormed}
            isProducing={prothrombinaseFormed && !thrombinBurst}
            showSubstrate={prothrombinaseFormed && !thrombinBurst}
            showProduct={thrombinBurst}
            enzymeFactorId="FXa"
            cofactorFactorId="FVa"
            substrateId="FII"
            productId="FIIa"
            amplificationFactor="×300,000"
            position={positions.prothrombinase}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FII SUBSTRATE SLOT (right side)                                 */}
        {/* Docking FII with Prothrombinase triggers THROMBIN BURST         */}
        {/* ~350 nM peak thrombin concentration (from reference)            */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <div
          style={{
            position: 'absolute',
            left: positions.fii.x - 22,
            top: -70,
          }}
        >
          {!thrombinBurst ? (
            // Ghost slot for FII (only active after Prothrombinase forms)
            <div
              style={{
                opacity: canDockFII ? 0.9 : prothrombinaseFormed ? 0.55 : 0.2,
                filter: canDockFII
                  ? 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.9))'
                  : prothrombinaseFormed
                  ? 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.4))'
                  : 'grayscale(70%)',
                transform: canDockFII ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <FactorTokenNew factorId="FII" />
              {canDockFII && (
                <div style={{
                  position: 'absolute',
                  top: -20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 9,
                  color: '#F87171',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  animation: 'pulse 1s ease-in-out infinite',
                }}>
                  ANDOCHEAZĂ AICI
                </div>
              )}
            </div>
          ) : (
            // THROMBIN BURST! ~350 nM peak - multiple thrombin tokens exploding
            <div style={{ position: 'relative' }}>
              {/* Outer ring of thrombin particles */}
              {burstParticles.map((particle) => (
                <div
                  key={particle.id}
                  style={{
                    position: 'absolute',
                    left: Math.cos(particle.angle) * (50 + (particle.id % 2) * 25),
                    top: Math.sin(particle.angle) * (50 + (particle.id % 2) * 25) - 15,
                    filter: 'drop-shadow(0 0 15px rgba(220, 38, 38, 0.9))',
                    animation: `burst-out ${0.8 + (particle.id % 3) * 0.2}s ease-out forwards`,
                    animationDelay: `${particle.id * 0.05}s`,
                    transform: `translate(-50%, -50%) scale(${0.5 + (particle.id % 3) * 0.15})`,
                  }}
                >
                  <FactorTokenNew factorId="FIIa" isActive />
                </div>
              ))}
              {/* Central thrombin (largest) */}
              <div
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 1))',
                  animation: 'thrombin-pulse 0.4s ease-in-out infinite',
                }}
              >
                <FactorTokenNew factorId="FIIa" isActive />
              </div>
            </div>
          )}
        </div>

        {/* Thrombin burst label with concentration */}
        {thrombinBurst && (
          <div
            style={{
              position: 'absolute',
              left: positions.fii.x - 70,
              top: -140,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(153, 27, 27, 0.95) 100%)',
                borderRadius: 10,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 0 40px rgba(220, 38, 38, 0.7), inset 0 1px 2px rgba(255,255,255,0.2)',
                animation: 'burst-label 0.6s ease-out',
              }}
            >
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}>
                EXPLOZIE DE TROMBINĂ!
              </div>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#FEE2E2',
                marginTop: 2,
              }}>
                ~350 nM peak
              </div>
            </div>
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
          <span style={{ fontSize: 10, color: '#FECACA', marginLeft: 8 }}>generare de trombină</span>
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
          FAZA 3
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>
          PROPAGARE
        </div>
        <div style={{ color: '#FEE2E2', fontSize: 9, marginTop: 4 }}>
          Generarea exploziei de trombină
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
          TROMBOCIT ACTIVAT
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
          Asamblarea complexelor enzimatice
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
        <ProgressDot label="Explozie Trombină" done={thrombinBurst} color="#991B1B" />
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse-appear {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes burst-out {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            opacity: 0.85;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes thrombin-pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(220, 38, 38, 1));
          }
          50% {
            transform: scale(1.15);
            filter: drop-shadow(0 0 45px rgba(220, 38, 38, 1));
          }
        }
        @keyframes burst-label {
          0% {
            transform: scale(0.5) translateY(20px);
            opacity: 0;
          }
          60% {
            transform: scale(1.1) translateY(-5px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
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
