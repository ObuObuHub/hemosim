// components/CoagulationIllustration/useIllustrationDrag.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Position } from './types';

interface UseIllustrationDragProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDragStart: (factorId: string, position: Position) => void;
  onDragMove: (position: Position) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function useIllustrationDrag({
  containerRef,
  onDragMove,
  onDragEnd,
  isDragging,
}: UseIllustrationDragProps): void {
  // Keep refs to callbacks to avoid stale closures
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => {
    onDragMoveRef.current = onDragMove;
    onDragEndRef.current = onDragEnd;
  });

  // Handle pointer move
  const handlePointerMove = useCallback((event: PointerEvent): void => {
    event.preventDefault();
    onDragMoveRef.current({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  // Handle pointer up
  const handlePointerUp = useCallback((): void => {
    onDragEndRef.current();
  }, []);

  // Add/remove document-level listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    // Prevent scrolling during drag on touch devices
    const preventScroll = (e: TouchEvent): void => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    document.addEventListener('touchmove', preventScroll, { passive: false });

    // Add grabbing cursor to body
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      document.removeEventListener('touchmove', preventScroll);

      // Reset cursor
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Prevent default touch actions on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefaultTouch = (e: TouchEvent): void => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchstart', preventDefaultTouch, { passive: false });

    return () => {
      container.removeEventListener('touchstart', preventDefaultTouch);
    };
  }, [containerRef, isDragging]);
}
