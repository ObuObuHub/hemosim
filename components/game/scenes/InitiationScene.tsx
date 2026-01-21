// components/game/scenes/InitiationScene.tsx
'use client';

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
  onFactorCatch: (factorId: string) => void;
  onFactorDock: (factorId: string, complexId: string) => void;
  onThrombinDrag: (thrombinId: string, targetX: number, targetY: number) => void;
  onArrowComplete: (arrowId: string) => void;
}

/**
 * Initiation Scene: TF-bearing fibroblast surface
 *
 * TEXTBOOK:
 * - TF+VIIa complex is pre-assembled on fibroblast
 * - Player catches FX, FV from bloodstream
 * - FX -> FXa (via TF+VIIa)
 * - FXa + FVa -> Prothrombinase
 * - Prothrombinase -> Thrombin spark
 * - Player drags thrombin to platelet to activate it
 */
export function InitiationScene({
  width,
  height,
  floatingFactors,
  dockedComplexes,
  activationArrows,
  onFactorCatch,
  onArrowComplete,
}: InitiationSceneProps): React.ReactElement {
  const bloodstreamHeight = height * 0.4;
  const membraneHeight = height * 0.6;
  const membraneY = bloodstreamHeight;

  // TF protein positions along membrane
  const tfPositions = [
    { x: width * 0.25, y: membraneY + 10 },
    { x: width * 0.45, y: membraneY + 10 },
    { x: width * 0.65, y: membraneY + 10 },
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
            }}
            onClick={() => onFactorCatch(factor.id)}
          >
            <FactorTokenNew factorId={factor.factorId} />
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

        {/* TF proteins */}
        {tfPositions.map((pos, i) => (
          <TFProtein key={i} x={pos.x} y={15} />
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

      {/* Platelet target (for thrombin delivery) */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: membraneY - 60,
          width: 80,
          height: 50,
          borderRadius: '50%',
          backgroundColor: 'rgba(249, 168, 212, 0.5)',
          border: '2px dashed #EC4899',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#EC4899',
          fontWeight: 600,
        }}
      >
        PLATELET
      </div>
    </div>
  );
}
