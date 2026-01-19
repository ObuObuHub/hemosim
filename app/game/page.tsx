'use client';

import type { ReactElement } from 'react';
import { GAME_CANVAS } from '../../engine/game/game-config';

export default function GamePage(): ReactElement {
  return (
    <div className="game-container">
      {/* Game canvas will be rendered here */}
      <div
        className="game-canvas-wrapper"
        style={{
          width: GAME_CANVAS.width,
          height: GAME_CANVAS.height,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Placeholder until GameCanvas component is created */}
        <div className="flex items-center justify-center h-full text-white text-lg">
          Game Loading...
        </div>
      </div>
    </div>
  );
}
