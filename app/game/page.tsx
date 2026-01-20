// app/game/page.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { GAME_CANVAS } from '@/engine/game/game-config';
import { useGameState } from '@/hooks/useGameState';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameControls } from '@/components/game/GameControls';
import { GameCompleteModal } from '@/components/game/GameCompleteModal';

export default function GamePage(): ReactElement {
  const router = useRouter();
  const { state, selectFactor, deselectFactor, attemptPlace, attemptComplexPlace, resetGame } = useGameState();

  const handleMainMenu = useCallback((): void => {
    router.push('/');
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#020617',
        padding: 16,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: GAME_CANVAS.width,
          height: GAME_CANVAS.height,
          maxWidth: '100%',
        }}
      >
        {/* Main Game Canvas */}
        <GameCanvas
          gameState={state}
          onFactorSelect={selectFactor}
          onSlotClick={attemptPlace}
          onComplexSlotClick={attemptComplexPlace}
        />

        {/* Keyboard Controls */}
        <GameControls onDeselect={deselectFactor} onReset={resetGame} />

        {/* Victory Modal */}
        {state.phase === 'complete' && (
          <GameCompleteModal
            onPlayAgain={resetGame}
            onMainMenu={handleMainMenu}
          />
        )}
      </div>
    </div>
  );
}
