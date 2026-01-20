// hooks/useDragAndDrop.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { HeldFactor, Slot, ComplexSlot } from '@/types/game';
import { SLOT_POSITIONS, COMPLEX_SLOT_POSITIONS, PANEL_CONFIGS } from '@/engine/game/game-config';

// =============================================================================
// TYPES
// =============================================================================

interface Position {
  x: number;
  y: number;
}

interface UseDragAndDropProps {
  heldFactor: HeldFactor | null;
  slots: Slot[];
  complexSlots: ComplexSlot[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onGrab: (floatingFactorId: string, cursorPosition: Position) => void;
  onMove: (cursorPosition: Position) => void;
  onDrop: () => void;
  onSlotDrop: (slotId: string) => void;
  onComplexSlotDrop: (complexSlotId: string) => void;
}

interface UseDragAndDropReturn {
  /** Handle mouse/touch start on a floating factor */
  handleDragStart: (
    floatingFactorId: string,
    event: React.MouseEvent | React.TouchEvent
  ) => void;
}

// =============================================================================
// HELPER: GET SLOT ABSOLUTE BOUNDS
// =============================================================================

function getSlotAbsoluteBounds(
  slotId: string,
  slots: Slot[]
): { x: number; y: number; width: number; height: number } | null {
  const pos = SLOT_POSITIONS[slotId];
  if (!pos) return null;

  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return null;

  // Find the panel config for this slot's surface
  const panelConfig = PANEL_CONFIGS.find((p) => p.surface === slot.surface);
  if (!panelConfig) return null;

  return {
    x: panelConfig.x + pos.x,
    y: panelConfig.y + pos.y,
    width: pos.width,
    height: pos.height,
  };
}

function getComplexSlotAbsoluteBounds(
  complexSlotId: string
): { x: number; y: number; width: number; height: number } | null {
  const pos = COMPLEX_SLOT_POSITIONS[complexSlotId];
  if (!pos) return null;

  // Complex slots are on activated-platelet panel
  const panelConfig = PANEL_CONFIGS.find((p) => p.surface === 'activated-platelet');
  if (!panelConfig) return null;

  return {
    x: panelConfig.x + pos.x,
    y: panelConfig.y + pos.y,
    width: pos.width,
    height: pos.height,
  };
}

// =============================================================================
// HELPER: CHECK IF POINT IS WITHIN BOUNDS
// =============================================================================

function isPointInBounds(
  point: Position,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useDragAndDrop({
  heldFactor,
  slots,
  complexSlots,
  canvasRef,
  onGrab,
  onMove,
  onDrop,
  onSlotDrop,
  onComplexSlotDrop,
}: UseDragAndDropProps): UseDragAndDropReturn {
  // Store refs to callbacks to avoid stale closures in event handlers
  const onMoveRef = useRef(onMove);
  const onDropRef = useRef(onDrop);
  const onSlotDropRef = useRef(onSlotDrop);
  const onComplexSlotDropRef = useRef(onComplexSlotDrop);
  const slotsRef = useRef(slots);
  const complexSlotsRef = useRef(complexSlots);
  const heldFactorRef = useRef(heldFactor);

  // Keep refs in sync
  useEffect(() => {
    onMoveRef.current = onMove;
    onDropRef.current = onDrop;
    onSlotDropRef.current = onSlotDrop;
    onComplexSlotDropRef.current = onComplexSlotDrop;
    slotsRef.current = slots;
    complexSlotsRef.current = complexSlots;
    heldFactorRef.current = heldFactor;
  });

  // Convert client coordinates to canvas-relative coordinates
  const getCanvasPosition = useCallback(
    (clientX: number, clientY: number): Position | null => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [canvasRef]
  );

  // Find which slot (if any) contains the drop position
  const findDropTarget = useCallback(
    (
      position: Position,
      currentSlots: Slot[],
      currentComplexSlots: ComplexSlot[]
    ): { type: 'slot'; id: string } | { type: 'complexSlot'; id: string } | null => {
      // Check regular slots
      for (const slot of currentSlots) {
        if (slot.isLocked || slot.placedFactorId !== null) continue;

        const bounds = getSlotAbsoluteBounds(slot.id, currentSlots);
        if (bounds && isPointInBounds(position, bounds)) {
          return { type: 'slot', id: slot.id };
        }
      }

      // Check complex slots (only enzyme slots are user-placeable)
      for (const complexSlot of currentComplexSlots) {
        if (complexSlot.isAutoFilled || complexSlot.placedFactorId !== null) continue;

        const bounds = getComplexSlotAbsoluteBounds(complexSlot.id);
        if (bounds && isPointInBounds(position, bounds)) {
          return { type: 'complexSlot', id: complexSlot.id };
        }
      }

      return null;
    },
    []
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (floatingFactorId: string, event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();

      let clientX: number;
      let clientY: number;

      if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const position = getCanvasPosition(clientX, clientY);
      if (position) {
        onGrab(floatingFactorId, position);
      }
    },
    [getCanvasPosition, onGrab]
  );

  // Handle mouse/touch move and end events
  useEffect(() => {
    if (!heldFactor) return;

    const handleMove = (event: MouseEvent | TouchEvent): void => {
      let clientX: number;
      let clientY: number;

      if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const position = getCanvasPosition(clientX, clientY);
      if (position) {
        onMoveRef.current(position);
      }
    };

    const handleEnd = (): void => {
      const currentHeldFactor = heldFactorRef.current;
      if (!currentHeldFactor) return;

      const position = currentHeldFactor.cursorPosition;

      // Check if dropped on a valid slot
      const dropTarget = findDropTarget(
        position,
        slotsRef.current,
        complexSlotsRef.current
      );

      if (dropTarget) {
        if (dropTarget.type === 'slot') {
          onSlotDropRef.current(dropTarget.id);
        } else {
          onComplexSlotDropRef.current(dropTarget.id);
        }
      } else {
        // Return to bloodstream
        onDropRef.current();
      }
    };

    // Add listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [heldFactor, getCanvasPosition, findDropTarget]);

  return {
    handleDragStart,
  };
}
