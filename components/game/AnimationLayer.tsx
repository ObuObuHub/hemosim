// components/game/AnimationLayer.tsx
'use client';

import type { VisualState } from '@/types/game';
import { ArrowOverlay, type Arrow } from './ArrowOverlay';
import { ParticleEmitter, type Particle } from './ParticleEmitter';
import { MechanismLabel, type MechanismLabelData } from './MechanismLabel';
import { Toast, type ToastData } from './Toast';

// =============================================================================
// TYPES
// =============================================================================

interface AnimationLayerProps {
  visualState: VisualState;
  /** Optional: Additional arrows not from visual state */
  additionalArrows?: Arrow[];
  /** Optional: Particles for signal flow */
  particles?: Particle[];
  /** Optional: Mechanism labels */
  mechanismLabels?: MechanismLabelData[];
  /** Optional: Additional toasts beyond the active one */
  additionalToasts?: ToastData[];
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Converts pulsing arrows from AnimationState to Arrow format.
 * The visual state uses node IDs while arrows need coordinates.
 * This is a placeholder - actual coordinate resolution will be added
 * when node position registry is implemented.
 */
function convertPulsingArrowsToArrows(
  pulsingArrows: VisualState['animation']['pulsingArrows']
): Arrow[] {
  // For now, return empty array since we don't have node position resolution yet.
  // In the future, this will look up node positions from a registry.
  // The arrows will be provided via additionalArrows prop when positions are known.
  return pulsingArrows.map((arrow, index) => ({
    id: `pulsing-${arrow.fromNode}-${arrow.toNode}-${index}`,
    // Placeholder coordinates - will be resolved when node registry is added
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    style: arrow.style,
    label: arrow.label,
  }));
}

/**
 * Converts active toast from AnimationState to ToastData format.
 */
function convertActiveToastToToastData(
  activeToast: VisualState['animation']['activeToast']
): ToastData | null {
  if (!activeToast) return null;

  return {
    id: 'active-toast',
    message: activeToast.message,
    type: activeToast.type,
    opacity: 1,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Main animation overlay layer.
 * Renders all visual effects on top of the game canvas:
 * - SVG arrows for showing relationships
 * - Canvas particles for signal flow
 * - Floating mechanism labels
 * - Toast notifications
 *
 * This component is positioned absolutely over the game canvas
 * with pointer-events disabled to allow interaction pass-through.
 */
export function AnimationLayer({
  visualState,
  additionalArrows = [],
  particles = [],
  mechanismLabels = [],
  additionalToasts = [],
}: AnimationLayerProps): React.ReactElement {
  // Extract animation data from visual state
  const { animation } = visualState;

  // Convert pulsing arrows to arrow format (coordinates from props or future registry)
  const pulsingArrows = convertPulsingArrowsToArrows(animation.pulsingArrows);

  // Filter out arrows with zero coordinates (not yet resolved)
  const resolvedPulsingArrows = pulsingArrows.filter(
    (arrow) => arrow.fromX !== 0 || arrow.fromY !== 0 || arrow.toX !== 0 || arrow.toY !== 0
  );

  // Combine arrows from visual state and additional arrows
  const allArrows = [...resolvedPulsingArrows, ...additionalArrows];

  // Convert active toast
  const activeToastData = convertActiveToastToToastData(animation.activeToast);

  // Combine toasts
  const allToasts: ToastData[] = [
    ...(activeToastData ? [activeToastData] : []),
    ...additionalToasts,
  ];

  return (
    <div
      className="animation-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* SVG layer for arrow paths */}
      <ArrowOverlay arrows={allArrows} />

      {/* Canvas layer for particles */}
      <ParticleEmitter particles={particles} />

      {/* Mechanism labels */}
      {mechanismLabels.map((label) => (
        <MechanismLabel
          key={label.id}
          id={label.id}
          text={label.text}
          x={label.x}
          y={label.y}
          opacity={label.opacity}
        />
      ))}

      {/* Toast notifications */}
      {allToasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          opacity={toast.opacity}
        />
      ))}
    </div>
  );
}
