// components/game/scenes/InitiationScene.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { TFProtein } from '../visuals/TFProtein';
import { ActivationArrow } from '../visuals/ActivationArrow';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import type {
  FloatingFactor,
  DockedComplex,
  ActivationArrow as ActivationArrowType,
  KineticState,
  DiffusingFIXaParticle,
  DiffusingFIIaParticle,
  TFPIXaComplexState,
} from '@/types/game';
import { getThrombinSparkDisplay } from '@/engine/game/kinetic-engine';

// Conveyor belt factor item
interface ConveyorFactor {
  id: string;
  factorId: string;
  offset: number; // Position in the conveyor (0-1 normalized, wraps around)
}

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
  // Kinetic state props
  kineticState?: KineticState;
  diffusingFIXaParticles?: DiffusingFIXaParticle[];
  diffusingFIIaParticles?: DiffusingFIIaParticle[];
  tfpiXaComplex?: TFPIXaComplexState;
  onTFClick?: () => void;
  // Conveyor belt drag & drop
  onConveyorDragStart?: (factorId: string, event: React.MouseEvent | React.TouchEvent) => void;
  draggingFactorId?: string | null;
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
  // Kinetic props
  kineticState,
  diffusingFIXaParticles = [],
  diffusingFIIaParticles = [],
  tfpiXaComplex,
  onTFClick,
  // Conveyor belt drag & drop
  onConveyorDragStart,
  draggingFactorId,
}: InitiationSceneProps): React.ReactElement {
  // Membrane takes only ~25% at the bottom, bloodstream is 75%
  const membraneHeight = height * 0.25;
  const bloodstreamHeight = height - membraneHeight;
  const membraneY = bloodstreamHeight;

  // Single TF protein position (centered for mobile)
  const tfPositions = [
    { x: width * 0.5, index: 0 },
  ];

  // Conveyor belt animation state
  const [conveyorOffset, setConveyorOffset] = useState(0);

  // All factors available in the conveyor belt
  const allConveyorFactors = useMemo(() => ['FVII', 'FIX', 'FX', 'FV', 'FII'], []);

  // Animate conveyor belt
  useEffect(() => {
    const animate = (): number => {
      setConveyorOffset((prev) => (prev + 0.0005) % 1);
      return requestAnimationFrame(animate);
    };
    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Calculate conveyor positions for each factor
  const getConveyorFactors = (): ConveyorFactor[] => {
    const factors: ConveyorFactor[] = [];
    const spacing = 1 / allConveyorFactors.length;

    allConveyorFactors.forEach((factorId, index) => {
      // Check if this factor is already docked
      const isDocked =
        (factorId === 'FVII' && tfDockingState[0]) ||
        (factorId === 'FIX' && fixDockingState[0]) ||
        (factorId === 'FX' && fxDockingState[0]) ||
        (factorId === 'FV' && fvDockingState[0]) ||
        (factorId === 'FII' && fiiDockedState[0]);

      if (!isDocked && factorId !== draggingFactorId) {
        factors.push({
          id: `conveyor-${factorId}`,
          factorId,
          offset: (index * spacing + conveyorOffset) % 1,
        });
      }
    });

    return factors;
  };

  const conveyorFactors = getConveyorFactors();
  const conveyorWidth = width - 40;
  const conveyorY = 100; // Below the platelet

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {/* Bloodstream area (simplified - no floating factors) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: bloodstreamHeight,
          background: 'linear-gradient(180deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
        }}
      />

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

        {/* Single TF complex - centered for mobile */}
        {tfPositions.map((pos) => (
          <div key={`tf-container-${pos.index}`}>
            {/* FVII docking zone - ghost slot for drop */}
            {!tfDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 5,
                  top: -85,
                  opacity: draggingFactorId === 'FVII' ? 0.8 : 0.25,
                  filter: draggingFactorId === 'FVII' ? 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.8))' : 'grayscale(50%)',
                  transform: draggingFactorId === 'FVII' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
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

            {/* VIIa blob when docked */}
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

            {/* FIX docking slot - ghost slot for drop */}
            {tfDockingState[pos.index] && !fixDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x - 85,
                  top: -45,
                  opacity: draggingFactorId === 'FIX' ? 0.8 : 0.25,
                  filter: draggingFactorId === 'FIX' ? 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.8))' : 'grayscale(50%)',
                  transform: draggingFactorId === 'FIX' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <FactorTokenNew factorId="FIX" />
              </div>
            )}

            {/* FIXa - no longer displayed statically */}
            {/* After docking, FIXa diffuses to platelet via diffusingFIXaParticles */}

            {/* FX docking slot - ghost slot for drop */}
            {tfDockingState[pos.index] && !fxDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 45,
                  top: -55,
                  opacity: draggingFactorId === 'FX' ? 0.8 : 0.25,
                  filter: draggingFactorId === 'FX' ? 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.8))' : 'grayscale(50%)',
                  transform: draggingFactorId === 'FX' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <FactorTokenNew factorId="FX" />
              </div>
            )}

            {/* FXa blob when docked */}
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

            {/* FV docking slot - ghost slot for drop */}
            {fxDockingState[pos.index] && !fvDockingState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 95,
                  top: -45,
                  opacity: draggingFactorId === 'FV' ? 0.8 : 0.25,
                  filter: draggingFactorId === 'FV' ? 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.8))' : 'grayscale(50%)',
                  transform: draggingFactorId === 'FV' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <FactorTokenNew factorId="FV" />
              </div>
            )}

            {/* FVa blob when docked */}
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

            {/* FII docking slot - ghost slot for drop */}
            {fvDockingState[pos.index] && !fiiDockedState[pos.index] && (
              <div
                style={{
                  position: 'absolute',
                  left: pos.x + 145,
                  top: -70,
                  opacity: draggingFactorId === 'FII' ? 0.8 : 0.25,
                  filter: draggingFactorId === 'FII' ? 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.8))' : 'grayscale(50%)',
                  transform: draggingFactorId === 'FII' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <FactorTokenNew factorId="FII" />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* THROMBIN (FIIa) - no longer interactive                 */}
            {/* Auto-floats to platelet via diffusingFIIaParticles      */}
            {/* ═══════════════════════════════════════════════════════ */}
            {/* Static FIIa removed - now handled by auto-diffusion */}

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
      {/* KINETIC SIMULATION STATUS INDICATOR                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {kineticState && kineticState.isTFExposed && (
        <div
          style={{
            position: 'absolute',
            top: 130,
            left: 20,
            padding: '10px 16px',
            background: kineticState.thrombinSpark > 0
              ? 'linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(127, 29, 29, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
            borderRadius: 10,
            boxShadow: kineticState.thrombinSpark > 0
              ? '0 4px 20px rgba(153, 27, 27, 0.6)'
              : '0 4px 15px rgba(59, 130, 246, 0.4)',
            zIndex: 50,
            minWidth: 180,
          }}
        >
          <div style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
            {kineticState.thrombinSpark > 0 ? 'THROMBIN SPARK' : 'SIMULARE CINETICĂ'}
          </div>

          {/* Thrombin concentration when available */}
          {kineticState.thrombinSpark > 0 ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <span style={{ color: '#FBBF24', fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>
                {getThrombinSparkDisplay(kineticState.thrombinSpark)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>nM</span>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 4 }}>
              Andochează FVII → TF pentru a începe
            </div>
          )}

          {/* TF-VIIa activity when active */}
          {kineticState.isTFVIIaActive && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ color: '#4ADE80', fontSize: 9, fontWeight: 500 }}>
                TF-VIIa ACTIV
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>
                  FXa: <span style={{ color: '#3B82F6', fontWeight: 600 }}>{Math.round(kineticState.fxaLocal)}%</span>
                </div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>
                  FIXa: <span style={{ color: '#06B6D4', fontWeight: 600 }}>{Math.round(kineticState.fixaLocal)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Prothrombinase status */}
          {kineticState.isProthrombinaseFormed && (
            <div style={{ color: '#A78BFA', fontSize: 8, marginTop: 4 }}>
              ✓ Protrombinază formată
            </div>
          )}

          {/* Feedback indicators */}
          {kineticState.feedbackVActivated && (
            <div style={{ color: '#4ADE80', fontSize: 8 }}>→ FV activat</div>
          )}
          {kineticState.feedbackVIIIActivated && (
            <div style={{ color: '#4ADE80', fontSize: 8 }}>→ FVIII activat</div>
          )}
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TFPI-Xa INHIBITION INDICATOR                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {kineticState && kineticState.isTFPIActivated && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.9) 0%, rgba(194, 65, 12, 0.9) 100%)',
            borderRadius: 10,
            boxShadow: '0 4px 15px rgba(234, 88, 12, 0.5)',
          }}
        >
          <div style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
            TFPI-Xa INHIBĂ TF-VIIa
          </div>
          <div style={{
            width: '100%',
            height: 6,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <div
              style={{
                width: `${kineticState.tfpiInhibition * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FBBF24, #EF4444)',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, marginTop: 4, textAlign: 'center' }}>
            {Math.round(kineticState.tfpiInhibition * 100)}% inhibat
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FIXa DIFFUSION PARTICLES - Animated to platelet                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {diffusingFIXaParticles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.position.x,
            top: particle.position.y,
            transform: 'translate(-50%, -50%)',
            opacity: particle.opacity,
            pointerEvents: 'none',
            transition: 'left 0.1s linear, top 0.1s linear',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #06B6D4 0%, #0891B2 100%)',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.9)',
              animation: 'pulse 0.8s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              color: '#06B6D4',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            FIXa
          </div>
        </div>
      ))}

      {/* FIXa diffusion trail indicator */}
      {kineticState && kineticState.fixaDiffused > 20 && (
        <div
          style={{
            position: 'absolute',
            left: plateletPosition.x - 60,
            top: plateletPosition.y + plateletPosition.height + 10,
            fontSize: 8,
            color: '#06B6D4',
            fontWeight: 500,
            textAlign: 'center',
            opacity: 0.8,
          }}
        >
          FIXa ajuns: {Math.round(kineticState.fixaDiffused)}%
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FIIa DIFFUSION PARTICLES - Thrombin floating to platelet       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {diffusingFIIaParticles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.position.x,
            top: particle.position.y,
            transform: 'translate(-50%, -50%)',
            opacity: particle.opacity,
            pointerEvents: 'none',
            transition: 'left 0.1s linear, top 0.1s linear',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #DC2626 0%, #991B1B 100%)',
              boxShadow: '0 0 16px rgba(220, 38, 38, 0.9)',
              animation: 'pulse 0.6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 11,
              color: '#FCA5A5',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}
          >
            FIIa
          </div>
        </div>
      ))}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PLATELET READY INDICATOR                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {kineticState && kineticState.isPlateletReady && (
        <div
          style={{
            position: 'absolute',
            left: plateletPosition.x,
            top: plateletPosition.y + plateletPosition.height + 25,
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%)',
            borderRadius: 8,
            boxShadow: '0 4px 15px rgba(34, 197, 94, 0.6)',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        >
          <div style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
            GATA PENTRU AMPLIFICARE
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FACTOR CONVEYOR BELT - Top of screen, circular movement        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: conveyorY,
          left: 20,
          width: conveyorWidth,
          height: 70,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)',
          borderRadius: 35,
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Conveyor belt track lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '200%',
            height: '100%',
            background: `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 42px)`,
            animation: 'conveyorTrack 2s linear infinite',
          }}
        />

        {/* Factor tokens on the conveyor */}
        {conveyorFactors.map((factor) => {
          // Calculate x position based on offset (wrapping around)
          const x = factor.offset * conveyorWidth;

          return (
            <div
              key={factor.id}
              onMouseDown={(e) => onConveyorDragStart?.(factor.factorId, e)}
              onTouchStart={(e) => onConveyorDragStart?.(factor.factorId, e)}
              style={{
                position: 'absolute',
                left: x,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: 'grab',
                zIndex: 10,
                transition: 'transform 0.1s ease',
              }}
            >
              <div
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                  transition: 'transform 0.15s ease',
                }}
              >
                <FactorTokenNew factorId={factor.factorId} />
              </div>
            </div>
          );
        })}

        {/* All docked message */}
        {conveyorFactors.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#4ADE80',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            Toți factorii andocați!
          </div>
        )}
      </div>

      {/* Conveyor belt label */}
      <div
        style={{
          position: 'absolute',
          top: conveyorY - 22,
          left: 20,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Factori din sânge — trage și plasează
      </div>

      {/* CSS animation for conveyor track */}
      <style>{`
        @keyframes conveyorTrack {
          from { transform: translateX(0); }
          to { transform: translateX(-42px); }
        }
      `}</style>

    </div>
  );
}
