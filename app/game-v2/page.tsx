// app/game-v2/page.tsx
'use client';

import type { ReactElement } from 'react';
import { InteractiveGame } from '@/components/InteractiveGame';

/**
 * Standalone game page that uses the InteractiveGame component.
 * This route is kept for direct access to the game at /game-v2
 */
export default function GamePageV2(): ReactElement {
  return (
    <div className="fixed inset-0 bg-slate-900">
      <InteractiveGame className="w-full h-full" />
    </div>
  );
}
