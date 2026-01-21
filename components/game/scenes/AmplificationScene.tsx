// components/game/scenes/AmplificationScene.tsx
'use client';

import { useMemo } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import type { FloatingFactor } from '@/types/game';

interface AmplificationSceneProps {
  width: number;
  height: number;
  floatingFactors: FloatingFactor[];
  vwfSplit: boolean;
  fvActivated: boolean;
  fviiiActivated: boolean;
  fxiActivated: boolean;
  heldFactorId: string | null;
  onFactorCatch: (factorId: string, event: React.MouseEvent) => void;
  onPhaseComplete: () => void;
}

/**
 * AMPLIFICATION PHASE - Cell-Based Model of Coagulation
 *
 * LAYOUT: Same structure as Initiation
 * - Bloodstream (top 75%)
 * - Platelet membrane (bottom 25%) with phospholipid bilayer
 * - Docking slots extend UP from membrane into bloodstream
 *
 * MEDICAL ACCURACY:
 * - Activated platelet exposes phosphatidylserine (PS) on membrane
 * - Thrombin activates cofactors on/near the platelet surface
 * - FV, FVIII, FXI all activated by thrombin
 */
export function AmplificationScene({
  width,
  height,
  floatingFactors,
  vwfSplit,
  fvActivated,
  fviiiActivated,
  fxiActivated,
  heldFactorId,
  onFactorCatch,
}: AmplificationSceneProps): React.ReactElement {
  // Same layout as Initiation: membrane at bottom 25%
  const membraneHeight = height * 0.25;
  const bloodstreamHeight = height - membraneHeight;
  const membraneY = bloodstreamHeight;

  // Docking positions along the membrane (like TF positions in Initiation)
  const dockingPositions = useMemo(() => ({
    // vWF-FVIII on the right
    vwf: { x: width * 0.7, y: membraneY - 60 },
    fviii: { x: width * 0.7, y: membraneY - 60 },
    // FV on the left
    fv: { x: width * 0.3, y: membraneY - 50 },
    // FXI in the middle
    fxi: { x: width * 0.5, y: membraneY - 70 },
  }), [width, membraneY]);

  const isHoldingThrombin = heldFactorId === 'FIIa';

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
        {/* Floating factors (thrombin) */}
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
            <FactorTokenNew factorId={factor.factorId} isActive={factor.factorId === 'FIIa'} />
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
        {/* DOCKING SLOTS - arranged along the platelet membrane            */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* FV SLOT (left side) */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.3 - 25,
            top: -50,
          }}
        >
          {!fvActivated ? (
            <div
              style={{
                opacity: isHoldingThrombin ? 0.7 : 0.3,
                filter: isHoldingThrombin ? 'drop-shadow(0 0 12px rgba(153, 27, 27, 0.9))' : 'grayscale(50%)',
                transform: isHoldingThrombin ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <FactorTokenNew factorId="FV" />
            </div>
          ) : (
            <div style={{ filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))' }}>
              <FactorTokenNew factorId="FVa" isActive />
            </div>
          )}
        </div>

        {/* FXI SLOT (center) */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.5 - 25,
            top: -70,
          }}
        >
          {!fxiActivated ? (
            <div
              style={{
                opacity: isHoldingThrombin ? 0.7 : 0.3,
                filter: isHoldingThrombin ? 'drop-shadow(0 0 12px rgba(153, 27, 27, 0.9))' : 'grayscale(50%)',
                transform: isHoldingThrombin ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <FactorTokenNew factorId="FXI" />
            </div>
          ) : (
            <div style={{ filter: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.8))' }}>
              <FactorTokenNew factorId="FXIa" isActive />
            </div>
          )}
        </div>

        {/* vWF-FVIII COMPLEX / FVIII SLOT (right side) */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.7 - 40,
            top: -60,
          }}
        >
          {!vwfSplit ? (
            // Combined vWF-FVIII complex
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                filter: isHoldingThrombin ? 'drop-shadow(0 0 12px rgba(153, 27, 27, 0.9))' : 'none',
                transform: isHoldingThrombin ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 35,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4A574 0%, #A67C52 100%)',
                  border: '2px solid #8B6914',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                vWF
              </div>
              <div style={{ marginLeft: -15 }}>
                <FactorTokenNew factorId="FVIII" />
              </div>
            </div>
          ) : !fviiiActivated ? (
            // vWF split, FVIII waiting for activation
            <>
              {/* Faded vWF drifting away */}
              <div
                style={{
                  position: 'absolute',
                  left: -60,
                  top: -20,
                  width: 40,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4A574 0%, #A67C52 100%)',
                  border: '2px solid #8B6914',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  opacity: 0.3,
                }}
              >
                vWF
              </div>
              {/* FVIII ghosted slot */}
              <div
                style={{
                  opacity: isHoldingThrombin ? 0.7 : 0.3,
                  filter: isHoldingThrombin ? 'drop-shadow(0 0 12px rgba(153, 27, 27, 0.9))' : 'grayscale(50%)',
                  transform: isHoldingThrombin ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <FactorTokenNew factorId="FVIII" />
              </div>
            </>
          ) : (
            // FVIIIa activated
            <div style={{ filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.8))' }}>
              <FactorTokenNew factorId="FVIIIa" isActive />
            </div>
          )}
        </div>

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
          <span style={{ fontSize: 10, color: '#FECACA', marginLeft: 8 }}>activated</span>
        </div>
      </div>

      {/* Phase indicator */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.9) 0%, rgba(202, 138, 4, 0.9) 100%)',
          borderRadius: 12,
          boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)',
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 500, opacity: 0.9, letterSpacing: 2 }}>
          PHASE 2
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>
          AMPLIFICATION
        </div>
        <div style={{ color: '#FEF3C7', fontSize: 9, marginTop: 4 }}>
          Activated platelet surface
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
          Phosphatidylserine exposed • Cofactors binding
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
        <ProgressDot label="vWF split" done={vwfSplit} color="#D4A574" />
        <ProgressDot label="FVa" done={fvActivated} color="#3B82F6" />
        <ProgressDot label="FVIIIa" done={fviiiActivated} color="#22C55E" />
        <ProgressDot label="FXIa" done={fxiActivated} color="#EC4899" />
      </div>
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
