// components/game/scenes/AmplificationScene.tsx
'use client';

import { useMemo, useState } from 'react';
import { ConsistentFactorToken, ThrombinSpark, PhospholipidMembraneConsistent } from '../tokens/ConsistentFactorToken';
import type { FloatingFactor } from '@/types/game';

interface AmplificationSceneProps {
  width: number;
  height: number;
  floatingFactors: FloatingFactor[];
  // Activation states
  fxiActivated: boolean;    // XI → XIa (by Thrombin)
  fixActivated: boolean;    // IX → IXa (by XIa)
  fviiiActivated: boolean;  // VIII → VIIIa (by Thrombin)
  fvActivated: boolean;     // V → Va (by Thrombin)
  heldFactorId: string | null;
  onFactorCatch: (factorId: string, event: React.MouseEvent | React.TouchEvent) => void;
  onPhaseComplete: () => void;
}

/**
 * AMPLIFICATION PHASE - Consistent Design
 *
 * REFERENCE DESIGN:
 * - White/cream gradient at top
 * - Thrombin spark (Pac-man) on LEFT side with arrow
 * - Floating zymogens: FXIa (blue), FV (orange), FIX (blue), FVIII (purple)
 * - FX/FXa (green) on right side
 * - Xase Complex: FIXa + FVIIIa + FVa on membrane
 * - Phospholipid membrane (tan/yellow) at bottom (30% height)
 * - All factors are rounded pills (not 3D spheres)
 */
export function AmplificationScene({
  width,
  height,
  floatingFactors,
  fxiActivated,
  fixActivated,
  fviiiActivated,
  fvActivated,
  heldFactorId,
  onFactorCatch,
}: AmplificationSceneProps): React.ReactElement {
  const [touchedFactorId, setTouchedFactorId] = useState<string | null>(null);

  // Layout: fluid area (70%), membrane (30%)
  const membraneHeight = height * 0.30;
  const fluidHeight = height - membraneHeight;
  const membraneY = fluidHeight;

  // Thrombin spark position (left side, upper area)
  const thrombinSparkPos = useMemo(() => ({
    x: width * 0.15,
    y: fluidHeight * 0.25,
  }), [width, fluidHeight]);

  // Xase complex docking positions on membrane (FIXa, FVIIIa, FVa cluster)
  const xasePositions = useMemo(() => ({
    fixa: {
      x: width * 0.4,
      y: membraneY - 20,
    },
    fviiia: {
      x: width * 0.5,
      y: membraneY - 20,
    },
    fva: {
      x: width * 0.6,
      y: membraneY - 20,
    },
  }), [width, membraneY]);

  // XIa position (for activating IX)
  const xiaPos = useMemo(() => ({
    x: width * 0.25,
    y: membraneY - 60,
  }), [width, membraneY]);

  // Xase complex formed when FIXa + FVIIIa are both docked
  const xaseComplexFormed = fixActivated && fviiiActivated;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: `linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 ${fluidHeight * 0.3}px, #FDE68A ${fluidHeight * 0.6}px, #FCD34D ${membraneY}px)`,
      }}
    >
      {/* Fluid area with gradient background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: fluidHeight,
          pointerEvents: 'none',
        }}
      />
      {/* Thrombin Spark - Pac-man shape on left side */}
      <div
        style={{
          position: 'absolute',
          left: thrombinSparkPos.x,
          top: thrombinSparkPos.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
      >
        <ThrombinSpark size={35} />

        {/* Arrow pointing to floating factors */}
        <svg
          style={{
            position: 'absolute',
            left: 40,
            top: 10,
            width: 60,
            height: 20,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <marker id="arrow-gray" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
            </marker>
          </defs>
          <line
            x1={0}
            y1={10}
            x2={55}
            y2={10}
            stroke="#9CA3AF"
            strokeWidth={2}
            markerEnd="url(#arrow-gray)"
          />
        </svg>
      </div>

      {/* XIa - Left side (for activating IX) */}
      {fxiActivated && (
        <div
          style={{
            position: 'absolute',
            left: xiaPos.x,
            top: xiaPos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
          }}
        >
          <ConsistentFactorToken factorId="FXIa" />
        </div>
      )}

      {/* Xase Complex - FIXa + FVIIIa + FVa on membrane */}
      {fixActivated && (
        <div
          style={{
            position: 'absolute',
            left: xasePositions.fixa.x,
            top: xasePositions.fixa.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
          }}
        >
          <ConsistentFactorToken factorId="FIXa" />
        </div>
      )}

      {fviiiActivated && (
        <div
          style={{
            position: 'absolute',
            left: xasePositions.fviiia.x,
            top: xasePositions.fviiia.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
          }}
        >
          <ConsistentFactorToken factorId="FVIIIa" />
        </div>
      )}

      {fvActivated && (
        <div
          style={{
            position: 'absolute',
            left: xasePositions.fva.x,
            top: xasePositions.fva.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
          }}
        >
          <ConsistentFactorToken factorId="FVa" />
        </div>
      )}

      {/* Xase Complex label when formed */}
      {xaseComplexFormed && (
        <div
          style={{
            position: 'absolute',
            left: xasePositions.fviiia.x,
            top: xasePositions.fviiia.y - 40,
            transform: 'translateX(-50%)',
            padding: '4px 10px',
            background: 'rgba(139, 92, 246, 0.9)',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
            zIndex: 20,
          }}
        >
          Xase Complex
        </div>
      )}

      {/* Floating zymogens */}
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
            zIndex: 20,
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
              filter: touchedFactorId === factor.id ? 'brightness(1.2)' : 'none',
              transition: 'filter 0.2s ease',
            }}
          />
        </div>
      ))}

      {/* Ghost hints for docking positions */}
      {!fixActivated && (
        <div
          style={{
            position: 'absolute',
            left: xasePositions.fixa.x,
            top: xasePositions.fixa.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          <ConsistentFactorToken factorId="FIX" isGhost />
        </div>
      )}

      {!fviiiActivated && (
        <div
          style={{
            position: 'absolute',
            left: xasePositions.fviiia.x,
            top: xasePositions.fviiia.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          <ConsistentFactorToken factorId="FVIII" isGhost />
        </div>
      )}

      {!fvActivated && (
        <div
          style={{
            position: 'absolute',
            left: xasePositions.fva.x,
            top: xasePositions.fva.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          <ConsistentFactorToken factorId="FV" isGhost />
        </div>
      )}

      {!fxiActivated && (
        <div
          style={{
            position: 'absolute',
            left: xiaPos.x,
            top: xiaPos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          <ConsistentFactorToken factorId="FXI" isGhost />
        </div>
      )}

      {/* Phospholipid membrane - detailed bilayer at bottom */}
      <div
        style={{
          position: 'absolute',
          top: membraneY,
          left: 0,
          width: '100%',
          height: membraneHeight,
          zIndex: 5,
        }}
      >
        <PhospholipidMembraneConsistent
          width={width}
          height={membraneHeight}
          variant="platelet"
        />

        {/* Membrane label */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 10,
            transform: 'translateX(-50%)',
            padding: '4px 12px',
            background: 'rgba(120, 113, 108, 0.85)',
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 600,
            color: '#FEF3C7',
            whiteSpace: 'nowrap',
          }}
        >
          Phospholipid membrane on activated platelets
        </div>
      </div>

      {/* Phase indicator */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          padding: '10px 18px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          zIndex: 30,
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 600, opacity: 0.9, letterSpacing: 1.5 }}>
          PHASE 2
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>
          AMPLIFICATION
        </div>
        <div style={{ color: '#FEF3C7', fontSize: 8, marginTop: 3 }}>
          Thrombin activates cofactors
        </div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: membraneHeight + 10,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.75)',
          borderRadius: 8,
          zIndex: 30,
        }}
      >
        <ProgressDot label="XIa" done={fxiActivated} color="#6366F1" />
        <ProgressDot label="IXa" done={fixActivated} color="#3B82F6" />
        <ProgressDot label="VIIIa" done={fviiiActivated} color="#8B5CF6" />
        <ProgressDot label="Va" done={fvActivated} color="#F97316" />
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
          background: done ? color : 'rgba(255,255,255,0.15)',
          margin: '0 auto 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#FFFFFF',
          border: done ? 'none' : '2px dashed rgba(255,255,255,0.3)',
        }}
      >
        {done ? '✓' : ''}
      </div>
      <div style={{ fontSize: 9, color: done ? color : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
