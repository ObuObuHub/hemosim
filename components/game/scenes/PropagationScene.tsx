// components/game/scenes/PropagationScene.tsx
'use client';

import { useEffect, useState } from 'react';
import type { FloatingFactor } from '@/types/game';
import {
  ConsistentFactorToken,
  ThrombinSpark,
  PhospholipidMembraneConsistent,
  FibrinMesh,
} from '@/components/game/tokens/ConsistentFactorToken';

interface PropagationSceneProps {
  width: number;
  height: number;
  floatingFactors: FloatingFactor[];
  tenaseFormed: boolean;
  fxaProduced: boolean;
  prothrombinaseFormed: boolean;
  thrombinBurst: boolean;
  heldFactorId: string | null;
  onFactorCatch: (factorId: string, event: React.MouseEvent | React.TouchEvent) => void;
  onPhaseComplete: () => void;
}

/**
 * PROPAGATION PHASE - Textbook-Accurate Visualization
 *
 * ACCURATE ENZYME BEHAVIOR:
 * - IXa docks to form Tenase, then DETACHES after catalysis
 * - IIa (Thrombin) is RELEASED from Prothrombinase after being produced
 *
 * Flow:
 * 1. Show Tenase complex, user docks FIXa
 * 2. IXa catalyzes X → Xa, then IXa detaches
 * 3. Transition to Prothrombinase, user docks FII
 * 4. FII → IIa, thrombin detaches and floats away
 */
export function PropagationScene({
  width,
  height,
  tenaseFormed,
  fxaProduced,
  prothrombinaseFormed,
  thrombinBurst,
  heldFactorId,
  onFactorCatch,
}: PropagationSceneProps): React.ReactElement {
  // Which complex is currently shown
  const showProthrombinase = fxaProduced;

  // Visual feedback for docking
  const isHoldingFIXa = heldFactorId === 'FIXa';
  const isHoldingFII = heldFactorId === 'FII';
  const canDockFIXa = !tenaseFormed && isHoldingFIXa;
  const canDockFII = prothrombinaseFormed && !thrombinBurst && isHoldingFII;

  // Layout
  const paletteHeight = 90;
  const membraneHeight = 80;
  const membraneY = height - membraneHeight - 20;
  const complexCenterX = width / 2;
  const complexY = membraneY - 120;

  // IXa detachment animation state
  const [ixaDetached, setIxaDetached] = useState(false);
  const [ixaPosition, setIxaPosition] = useState({ x: 0, y: 0 });

  // Trigger IXa detachment after Tenase forms
  useEffect(() => {
    if (tenaseFormed && !ixaDetached && !fxaProduced) {
      const timer = setTimeout(() => {
        setIxaDetached(true);
        // Animate IXa floating up and to the side
        setIxaPosition({ x: -100, y: -80 });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tenaseFormed, ixaDetached, fxaProduced]);

  // Thrombin detachment and burst animation
  const [thrombinDetached, setThrombinDetached] = useState(false);
  const [burstPhase, setBurstPhase] = useState(0);

  useEffect(() => {
    if (thrombinBurst && !thrombinDetached) {
      const timer = setTimeout(() => {
        setThrombinDetached(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [thrombinBurst, thrombinDetached]);

  useEffect(() => {
    if (thrombinDetached && burstPhase < 3) {
      const timer = setTimeout(() => setBurstPhase(prev => prev + 1), 400);
      return () => clearTimeout(timer);
    }
  }, [thrombinDetached, burstPhase]);

  // Available factors in palette based on current state
  const getPaletteFactors = (): Array<{ id: string; available: boolean }> => {
    if (!showProthrombinase) {
      return [
        { id: 'FIXa', available: !tenaseFormed },
      ];
    } else {
      return [
        { id: 'FII', available: prothrombinaseFormed && !thrombinBurst },
      ];
    }
  };

  const paletteFactors = getPaletteFactors();

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 30%, #FDE68A 60%, #FCD34D 100%)',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FACTOR PALETTE (top)                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: paletteHeight,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 243, 199, 0.9) 100%)',
          borderBottom: '2px solid rgba(146, 64, 14, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '0 20px',
        }}
      >
        {/* Phase indicator */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(146, 64, 14, 0.6)', letterSpacing: 1 }}>
            PHASE 3
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
            {!showProthrombinase ? 'TENASE' : 'PROTHROMBINASE'}
          </div>
        </div>

        {/* Factor palette */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(146, 64, 14, 0.7)', fontWeight: 600 }}>
            CATCH:
          </span>
          {paletteFactors.map((factor) => (
            <div
              key={factor.id}
              style={{
                opacity: factor.available ? 1 : 0.3,
                cursor: factor.available ? 'grab' : 'not-allowed',
                touchAction: 'none',
              }}
              onMouseDown={(e) => factor.available && onFactorCatch(`palette-${factor.id}`, e)}
              onTouchStart={(e) => factor.available && onFactorCatch(`palette-${factor.id}`, e)}
            >
              <ConsistentFactorToken
                factorId={factor.id}
                scale={1.2}
                style={{
                  animation: factor.available ? 'subtlePulse 2s ease-in-out infinite' : 'none',
                }}
              />
              {factor.available && (
                <div style={{
                  textAlign: 'center',
                  fontSize: 9,
                  color: '#92400E',
                  marginTop: 4,
                  fontWeight: 600,
                }}>
                  DRAG ↓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress indicator */}
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: 8,
          }}
        >
          <ProgressDot done={tenaseFormed} color="#3B82F6" />
          <ProgressDot done={fxaProduced} color="#22C55E" />
          <ProgressDot done={prothrombinaseFormed} color="#F97316" />
          <ProgressDot done={thrombinBurst} color="#3B82F6" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PHOSPHOLIPID MEMBRANE (bottom) - Consistent design              */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <PhospholipidMembraneConsistent
        width={width}
        height={membraneHeight}
        variant="platelet"
        style={{
          position: 'absolute',
          left: 0,
          top: membraneY,
        }}
      />

      {/* Activated platelets label */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: membraneY - 30,
          fontSize: 14,
          fontWeight: 700,
          color: '#92400E',
          textShadow: '0 1px 2px rgba(255,255,255,0.8)',
        }}
      >
        Activated platelets
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TENASE COMPLEX (shown first) - Consistent pill design           */}
      {/* FIXa (blue) + FVIIIa (purple) + FX (green)                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {!showProthrombinase && (
        <div
          style={{
            position: 'absolute',
            left: complexCenterX - 80,
            top: complexY,
          }}
        >
          {/* Complex label */}
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: -50,
              fontSize: 16,
              fontWeight: 800,
              color: tenaseFormed ? '#3B82F6' : 'rgba(146, 64, 14, 0.6)',
              textShadow: '0 1px 3px rgba(255,255,255,0.8)',
            }}
          >
            Tenase complex
          </div>

          {/* FVIIIa - Purple pill on membrane */}
          <ConsistentFactorToken
            factorId="FVIIIa"
            scale={2}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              opacity: tenaseFormed ? 1 : 0.5,
            }}
          />

          {/* FIXa - Blue pill (DETACHES after catalysis) */}
          <ConsistentFactorToken
            factorId="FIXa"
            scale={2}
            isGhost={!tenaseFormed}
            style={{
              position: 'absolute',
              left: ixaDetached ? 110 + ixaPosition.x : 110,
              top: ixaDetached ? 0 + ixaPosition.y : 0,
              opacity: tenaseFormed ? 1 : 0.4,
              transition: ixaDetached ? 'all 1.5s ease-out' : 'all 0.4s ease',
              filter: canDockFIXa ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none',
            }}
          />

          {!tenaseFormed && (
            <div style={{
              position: 'absolute',
              left: 150,
              top: -30,
              fontSize: 10,
              fontWeight: 700,
              color: canDockFIXa ? '#3B82F6' : 'rgba(146, 64, 14, 0.6)',
              whiteSpace: 'nowrap',
              animation: canDockFIXa ? 'pulse 1s ease-in-out infinite' : 'none',
            }}>
              {canDockFIXa ? '↓ DOCK AICI' : 'slot gol'}
            </div>
          )}

          {ixaDetached && (
            <div style={{
              position: 'absolute',
              left: 150,
              top: -30,
              fontSize: 10,
              fontWeight: 700,
              color: '#3B82F6',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 2px rgba(255,255,255,0.8)',
            }}>
              detaches
            </div>
          )}

          {/* FX/FXa - Green pill substrate */}
          <div
            style={{
              position: 'absolute',
              left: 50,
              top: -60,
              transform: fxaProduced ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.4s ease',
            }}
          >
            <ConsistentFactorToken
              factorId={fxaProduced ? 'FXa' : 'FX'}
              scale={2}
            />
            {fxaProduced && (
              <div style={{
                position: 'absolute',
                top: -25,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: 700,
                color: '#22C55E',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(255,255,255,0.8)',
              }}>
                ACTIVATED!
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PROTHROMBINASE COMPLEX - Consistent pill design                 */}
      {/* FXa (green) + FVa (orange) + Prothrombin (blue)                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {showProthrombinase && (
        <div
          style={{
            position: 'absolute',
            left: complexCenterX - 80,
            top: complexY,
            animation: 'fadeIn 0.5s ease-out',
          }}
        >
          {/* FVa - Orange pill on membrane */}
          <ConsistentFactorToken
            factorId="FVa"
            scale={2}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              opacity: prothrombinaseFormed ? 1 : 0.5,
            }}
          />

          {/* FXa - Green pill on membrane */}
          <ConsistentFactorToken
            factorId="FXa"
            scale={2}
            style={{
              position: 'absolute',
              left: 100,
              top: 0,
              opacity: prothrombinaseFormed ? 1 : 0.5,
            }}
          />

          {/* Prothrombin - Blue pill being converted */}
          {!thrombinDetached && (
            <ConsistentFactorToken
              factorId="FII"
              scale={2}
              isGhost={!prothrombinaseFormed}
              style={{
                position: 'absolute',
                left: 40,
                top: -60,
                opacity: prothrombinaseFormed ? 1 : 0.4,
                transform: prothrombinaseFormed ? 'scale(1)' : 'scale(0.85)',
                transition: 'all 0.4s ease',
                filter: canDockFII ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none',
              }}
            />
          )}

          {!prothrombinaseFormed && (
            <div style={{
              position: 'absolute',
              left: 80,
              top: -90,
              fontSize: 10,
              fontWeight: 700,
              color: canDockFII ? '#3B82F6' : 'rgba(146, 64, 14, 0.6)',
              whiteSpace: 'nowrap',
              animation: canDockFII ? 'pulse 1s ease-in-out infinite' : 'none',
            }}>
              {canDockFII ? '↓ DOCK AICI' : 'slot gol'}
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* THROMBIN BURST - Multiple Pac-man shapes flying upward          */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {thrombinDetached && (
        <>
          {/* "Thrombin burst" label */}
          <div
            style={{
              position: 'absolute',
              left: complexCenterX - 60,
              top: paletteHeight + 40,
              fontSize: 16,
              fontWeight: 800,
              color: '#1E40AF',
              textShadow: '0 1px 3px rgba(255,255,255,0.8)',
            }}
          >
            Thrombin burst
          </div>

          {/* Multiple ThrombinSpark pac-man shapes bursting upward */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <ThrombinSpark
              key={`spark-${index}`}
              size={25 + (index % 3) * 5}
              style={{
                position: 'absolute',
                left: complexCenterX - 100 + (index * 30) + ((index % 2) * 15),
                top: complexY - 100 - (index * 20),
                animation: `thrombinFloat ${2 + (index % 3) * 0.5}s ease-out ${index * 0.1}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FIBRIN - Right side showing fibrinogen → crosslinked fibrin     */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {showProthrombinase && (
        <div
          style={{
            position: 'absolute',
            right: 40,
            top: complexY - 40,
          }}
        >
          {/* Fibrinogen pill */}
          <ConsistentFactorToken
            factorId="Fibrinogen"
            scale={1.8}
            style={{
              marginBottom: 20,
            }}
          />

          {/* Arrow pointing down */}
          <div
            style={{
              fontSize: 24,
              color: '#22C55E',
              textAlign: 'center',
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            ↓
          </div>

          {/* Crosslinked fibrin label */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#16A34A',
              marginBottom: 8,
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            Crosslinked fibrin
          </div>

          {/* Fibrin mesh */}
          <FibrinMesh
            width={100}
            height={80}
            style={{
              border: '2px solid #22C55E',
              borderRadius: 8,
              background: 'rgba(187, 247, 208, 0.2)',
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* INSTRUCTIONS (bottom-left)                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <div
        style={{
          position: 'absolute',
          bottom: membraneHeight + 35,
          left: 16,
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 10,
          border: '2px solid rgba(146, 64, 14, 0.3)',
          maxWidth: 200,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: 10, color: '#92400E', lineHeight: 1.5, fontWeight: 600 }}>
          {!tenaseFormed && 'Catch FIXa from above and drag to empty slot'}
          {tenaseFormed && !ixaDetached && 'FIXa catalyzing reaction...'}
          {ixaDetached && !fxaProduced && 'FIXa detaches, X → Xa'}
          {fxaProduced && !prothrombinaseFormed && 'Catch Prothrombin and drag to slot'}
          {prothrombinaseFormed && !thrombinBurst && 'Converting to Thrombin...'}
          {thrombinBurst && !thrombinDetached && 'Thrombin releasing...'}
          {thrombinDetached && '✓ Thrombin burst complete!'}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes subtlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes thrombinFloat {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5) rotate(0deg);
          }
          20% {
            opacity: 1;
            transform: translateY(-50px) scale(1) rotate(10deg);
          }
          100% {
            opacity: 0.3;
            transform: translateY(-200px) scale(0.8) rotate(25deg);
          }
        }
      `}</style>
    </div>
  );
}

function ProgressDot({ done, color }: { done: boolean; color: string }): React.ReactElement {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: done ? color : 'rgba(146, 64, 14, 0.2)',
        boxShadow: done ? `0 0 8px ${color}` : 'none',
        transition: 'all 0.3s ease',
      }}
    />
  );
}
