// components/game/GameControls.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { GAME_CANVAS } from '@/engine/game/game-config';

interface GameControlsProps {
  onDeselect: () => void;
  onReset: () => void;
}

export function GameControls({
  onDeselect,
  onReset,
}: GameControlsProps): React.ReactElement {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDeselect();
      }
      if (event.key === 'r' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onReset();
      }
    },
    [onDeselect, onReset]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      onClick={onDeselect}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: GAME_CANVAS.width,
        height: GAME_CANVAS.height,
        pointerEvents: 'none', // Let clicks pass through to children
      }}
    />
  );
}
