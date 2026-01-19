// components/game/GameControls.tsx
'use client';

import { useEffect, useCallback } from 'react';

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

  // This component only handles keyboard shortcuts - no visual output needed
  return <></>;
}
