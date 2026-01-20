// components/game/PhaseUnlockBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import type { GamePhase } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

interface PhaseUnlockBannerProps {
  phase: GamePhase;
  onComplete?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PHASE_DISPLAY_NAMES: Record<GamePhase, string> = {
  initiation: 'INITIATION',
  amplification: 'AMPLIFICATION UNLOCKED!',
  propagation: 'PROPAGATION UNLOCKED!',
  stabilization: 'STABILIZATION UNLOCKED!',
  complete: 'CLOT FORMED!',
};

const PHASE_COLORS: Record<GamePhase, string> = {
  initiation: '#3B82F6', // Blue
  amplification: '#8B5CF6', // Purple
  propagation: '#F59E0B', // Amber
  stabilization: '#22C55E', // Green
  complete: '#22C55E', // Green
};

const DISPLAY_DURATION_MS = 2000;
const EXIT_ANIMATION_MS = 400;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Banner that displays when a new phase is unlocked.
 * Shows phase name with animated entrance/exit.
 */
export function PhaseUnlockBanner({
  phase,
  onComplete,
}: PhaseUnlockBannerProps): React.ReactElement | null {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start exit animation after display duration
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, DISPLAY_DURATION_MS);

    // Remove component after exit animation
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, DISPLAY_DURATION_MS + EXIT_ANIMATION_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  const color = PHASE_COLORS[phase];
  const displayName = PHASE_DISPLAY_NAMES[phase];

  return (
    <div
      className={isExiting ? 'phase-unlock-banner-exit' : 'phase-unlock-banner'}
      style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          border: `2px solid ${color}`,
          borderRadius: 12,
          padding: '16px 32px',
          boxShadow: `0 0 40px ${color}60, 0 0 80px ${color}30`,
        }}
      >
        <div
          className="phase-unlock-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 10,
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color,
            letterSpacing: '3px',
            textShadow: `0 0 20px ${color}80`,
            textTransform: 'uppercase',
            position: 'relative',
          }}
        >
          {displayName}
        </span>
      </div>
    </div>
  );
}
