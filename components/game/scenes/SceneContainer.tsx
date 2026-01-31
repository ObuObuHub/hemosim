'use client';

import { useState, useEffect, type ReactNode } from 'react';
import type { GameScene } from '@/types/game';

interface SceneContainerProps {
  currentScene: GameScene;
  children: ReactNode;
}

/**
 * Container for scene transitions.
 * Handles fade out -> switch content -> fade in between scenes.
 */
export function SceneContainer({
  currentScene,
  children,
}: SceneContainerProps): React.ReactElement {
  const [displayedScene, setDisplayedScene] = useState<GameScene>(currentScene);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (currentScene !== displayedScene) {
      let fadeInTimer: ReturnType<typeof setTimeout> | null = null;

      // Fade out (deferred to avoid cascading renders)
      const fadeStartTimer = setTimeout(() => setOpacity(0), 0);

      // After fade out completes, switch scene and fade in
      const fadeOutTimer = setTimeout(() => {
        setDisplayedScene(currentScene);

        // Small delay before fade in for clean transition
        fadeInTimer = setTimeout(() => {
          setOpacity(1);
        }, 50);
      }, 300);

      return () => {
        clearTimeout(fadeStartTimer);
        clearTimeout(fadeOutTimer);
        if (fadeInTimer) clearTimeout(fadeInTimer);
      };
    }
  }, [currentScene, displayedScene]);

  return (
    <div
      className="scene-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        opacity,
        transition: 'opacity 300ms ease-in-out',
      }}
    >
      {children}

      {/* Scene label */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '4px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 4,
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {formatSceneName(displayedScene)}
      </div>
    </div>
  );
}

function formatSceneName(scene: GameScene): string {
  switch (scene) {
    case 'initiation':
      return 'Initiation';
    case 'amplification':
      return 'Amplification';
    case 'propagation':
      return 'Propagation';
    case 'stabilization':
      return 'Stabilization';
    case 'victory':
      return 'Victory';
    default: {
      // Exhaustive check - TypeScript will error if a case is missing
      const _exhaustive: never = scene;
      return _exhaustive;
    }
  }
}
