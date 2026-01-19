'use client';

import { useCallback, useState, useRef } from 'react';
import type { GameFactor, DockingSlot } from '@/types/game';
import { PHYSICS, DOCK_ZONES } from '@/engine/game/game-config';

// =============================================================================
// TYPES
// =============================================================================

interface GameControlsProps {
  factors: GameFactor[];
  dockingSlots: DockingSlot[];
  caughtFactor: GameFactor | null;
  onCatchFactor: (factorId: string) => void;
  onDockFactor: (factorId: string, slotId: string) => void;
  onReleaseFactor: (factorId: string) => void;
  canvasWidth: number;
  canvasHeight: number;
}

interface Position {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startPosition: Position | null;
  currentPosition: Position | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets the pointer position relative to the target element.
 */
function getPointerPosition(
  event: React.PointerEvent<HTMLDivElement>,
  element: HTMLDivElement
): Position {
  const rect = element.getBoundingClientRect();

  // Account for scaling if canvas is responsive
  const scaleX = element.offsetWidth / rect.width;
  const scaleY = element.offsetHeight / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

/**
 * Calculates the distance between two positions.
 */
function distanceBetween(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Finds a floating factor at the given position using hitbox radius.
 */
function findFactorAtPosition(
  position: Position,
  factors: GameFactor[]
): GameFactor | null {
  // Search in reverse order so factors rendered on top are detected first
  for (let i = factors.length - 1; i >= 0; i--) {
    const factor = factors[i];

    // Only detect floating factors
    if (factor.state !== 'floating') continue;

    const distance = distanceBetween(position, factor.position);

    if (distance <= PHYSICS.hitboxRadius) {
      return factor;
    }
  }

  return null;
}

/**
 * Finds a docking slot at the given position.
 * Returns the slot ID if found, null otherwise.
 */
function findSlotAtPosition(
  position: Position,
  dockingSlots: DockingSlot[]
): DockingSlot | null {
  // Check each dock zone
  for (const slot of dockingSlots) {
    const zone = slot.complexType === 'tenase' ? DOCK_ZONES.tenase : DOCK_ZONES.prothrombinase;

    // Calculate individual slot positions within the zone
    const slotWidth = 70;
    const slotHeight = 60;
    const slotY = zone.y + 28;
    const gap = 10;

    let slotX: number;
    if (slot.role === 'enzyme') {
      slotX = zone.x + (zone.width / 2 - slotWidth - gap / 2);
    } else {
      slotX = zone.x + (zone.width / 2 + gap / 2);
    }

    // Check if position is within slot bounds (with some padding for easier targeting)
    const padding = 10;
    if (
      position.x >= slotX - padding &&
      position.x <= slotX + slotWidth + padding &&
      position.y >= slotY - padding &&
      position.y <= slotY + slotHeight + padding
    ) {
      return slot;
    }
  }

  return null;
}

/**
 * Checks if a factor can be docked in a specific slot.
 */
function canDockFactor(factor: GameFactor, slot: DockingSlot): boolean {
  // Check if slot is locked
  if (slot.isLocked) {
    return false;
  }

  // Check if slot accepts this factor type
  if (!slot.acceptsFactors.includes(factor.factorId)) {
    return false;
  }

  return true;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Invisible overlay component that handles mouse/touch input for the game.
 * Provides catch mechanic (tap/click), drag-to-dock, and touch support.
 */
export function GameControls({
  factors,
  dockingSlots,
  caughtFactor,
  onCatchFactor,
  onDockFactor,
  onReleaseFactor,
  canvasWidth,
  canvasHeight,
}: GameControlsProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: null,
    currentPosition: null,
  });

  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null);

  /**
   * Handles pointer down events (start of catch/drag).
   */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = containerRef.current;
      if (!element) return;

      const pos = getPointerPosition(event, element);

      // If we don't have a caught factor, try to catch one
      if (!caughtFactor) {
        const hitFactor = findFactorAtPosition(pos, factors);

        if (hitFactor) {
          onCatchFactor(hitFactor.id);
          setDragState({
            isDragging: true,
            startPosition: pos,
            currentPosition: pos,
          });

          // Capture pointer for drag tracking
          element.setPointerCapture(event.pointerId);
        }
      } else {
        // Already have a caught factor, start dragging it
        setDragState({
          isDragging: true,
          startPosition: pos,
          currentPosition: pos,
        });

        element.setPointerCapture(event.pointerId);
      }
    },
    [factors, caughtFactor, onCatchFactor]
  );

  /**
   * Handles pointer move events (dragging).
   */
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.isDragging || !caughtFactor) return;

      const element = containerRef.current;
      if (!element) return;

      const pos = getPointerPosition(event, element);

      setDragState((prev) => ({
        ...prev,
        currentPosition: pos,
      }));

      // Check if dragging over a valid slot
      const targetSlot = findSlotAtPosition(pos, dockingSlots);

      if (targetSlot && canDockFactor(caughtFactor, targetSlot)) {
        setHighlightedSlotId(targetSlot.id);
      } else {
        setHighlightedSlotId(null);
      }
    },
    [dragState.isDragging, caughtFactor, dockingSlots]
  );

  /**
   * Handles pointer up events (end of drag, attempt dock).
   */
  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = containerRef.current;
      if (!element) return;

      // Release pointer capture
      element.releasePointerCapture(event.pointerId);

      if (!caughtFactor) {
        setDragState({
          isDragging: false,
          startPosition: null,
          currentPosition: null,
        });
        setHighlightedSlotId(null);
        return;
      }

      const pos = getPointerPosition(event, element);
      const targetSlot = findSlotAtPosition(pos, dockingSlots);

      if (targetSlot && canDockFactor(caughtFactor, targetSlot)) {
        // Successfully dock the factor
        onDockFactor(caughtFactor.id, targetSlot.id);
      } else {
        // Release the factor (returns to floating)
        onReleaseFactor(caughtFactor.id);
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        startPosition: null,
        currentPosition: null,
      });
      setHighlightedSlotId(null);
    },
    [caughtFactor, dockingSlots, onDockFactor, onReleaseFactor]
  );

  /**
   * Handles pointer cancel events (e.g., when touch is interrupted).
   */
  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = containerRef.current;
      if (!element) return;

      element.releasePointerCapture(event.pointerId);

      if (caughtFactor) {
        onReleaseFactor(caughtFactor.id);
      }

      setDragState({
        isDragging: false,
        startPosition: null,
        currentPosition: null,
      });
      setHighlightedSlotId(null);
    },
    [caughtFactor, onReleaseFactor]
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        maxWidth: '100%',
        touchAction: 'none', // Prevent browser gestures (scroll, zoom)
        cursor: caughtFactor ? 'grabbing' : 'pointer',
        // Invisible but interactive
        background: 'transparent',
      }}
    >
      {/* Visual feedback: drag preview and slot highlight */}
      {dragState.isDragging && caughtFactor && dragState.currentPosition && (
        <div
          style={{
            position: 'absolute',
            left: dragState.currentPosition.x,
            top: dragState.currentPosition.y,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `3px solid ${caughtFactor.color}`,
            backgroundColor: `${caughtFactor.color}30`,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)', // Center on cursor position
            animation: 'pulse 0.5s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Highlight valid drop zone when dragging */}
      {highlightedSlotId && caughtFactor && (
        <DockHighlight
          slotId={highlightedSlotId}
          dockingSlots={dockingSlots}
          color={caughtFactor.color}
        />
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          from {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          to {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface DockHighlightProps {
  slotId: string;
  dockingSlots: DockingSlot[];
  color: string;
}

/**
 * Visual highlight for a valid docking slot.
 */
function DockHighlight({
  slotId,
  dockingSlots,
  color,
}: DockHighlightProps): React.ReactElement | null {
  const slot = dockingSlots.find((s) => s.id === slotId);
  if (!slot) return null;

  const zone = slot.complexType === 'tenase' ? DOCK_ZONES.tenase : DOCK_ZONES.prothrombinase;

  // Calculate slot position (same as in findSlotAtPosition)
  const slotWidth = 70;
  const slotHeight = 60;
  const slotY = zone.y + 28;
  const gap = 10;

  let slotX: number;
  if (slot.role === 'enzyme') {
    slotX = zone.x + (zone.width / 2 - slotWidth - gap / 2);
  } else {
    slotX = zone.x + (zone.width / 2 + gap / 2);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: slotX,
        top: slotY,
        width: slotWidth,
        height: slotHeight,
        borderRadius: 8,
        border: `3px solid ${color}`,
        backgroundColor: `${color}40`,
        pointerEvents: 'none',
        boxShadow: `0 0 20px ${color}80`,
        animation: 'glow 0.3s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes glow {
          from {
            box-shadow: 0 0 10px ${color}60;
          }
          to {
            box-shadow: 0 0 25px ${color}90;
          }
        }
      `}</style>
    </div>
  );
}

export default GameControls;
