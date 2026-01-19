'use client';

import { memo } from 'react';
import type { ReactElement } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface GameHUDProps {
  /** Current player score */
  score: number;
  /** Seconds remaining on the timer */
  timer: number;
  /** Remaining lives (0-5) */
  lives: number;
  /** Current level number (1-based) */
  currentLevel: number;
  /** Optional level name/title */
  levelName?: string;
  /** Current combo count for consecutive catches */
  combo?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_DISPLAYABLE_LIVES = 5;

const COLORS = {
  background: 'rgba(15, 23, 42, 0.85)', // Dark slate with transparency
  text: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    accent: '#fbbf24', // Amber for combo/highlights
  },
  heart: {
    filled: '#ef4444',   // Red for active lives
    empty: '#374151',    // Gray for lost lives
  },
  timer: {
    normal: '#22c55e',   // Green when time is plenty
    warning: '#eab308',  // Yellow when running low
    critical: '#ef4444', // Red when critical
  },
} as const;

const STYLES = {
  hud: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: COLORS.background,
    borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    color: COLORS.text.primary,
    userSelect: 'none' as const,
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: COLORS.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginRight: '4px',
  },
  value: {
    fontSize: '18px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  combo: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '12px',
    background: 'rgba(251, 191, 36, 0.2)',
    color: COLORS.text.accent,
    fontSize: '13px',
    fontWeight: 600,
  },
  level: {
    textAlign: 'center' as const,
  },
  levelNumber: {
    fontSize: '20px',
    fontWeight: 700,
  },
  levelName: {
    fontSize: '12px',
    color: COLORS.text.secondary,
    marginTop: '2px',
  },
  lives: {
    display: 'flex',
    gap: '4px',
  },
  heart: {
    fontSize: '18px',
    lineHeight: 1,
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Formats seconds into mm:ss display format.
 * Handles float values by flooring to whole seconds.
 */
function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Returns appropriate color for timer based on remaining time.
 */
function getTimerColor(seconds: number): string {
  if (seconds <= 10) return COLORS.timer.critical;
  if (seconds <= 30) return COLORS.timer.warning;
  return COLORS.timer.normal;
}

/**
 * Renders heart symbols for lives display.
 * Filled hearts for remaining lives, empty for lost lives.
 */
function renderLives(lives: number): ReactElement[] {
  const hearts: ReactElement[] = [];
  const displayLives = Math.min(lives, MAX_DISPLAYABLE_LIVES);

  for (let i = 0; i < MAX_DISPLAYABLE_LIVES; i++) {
    const isFilled = i < displayLives;
    hearts.push(
      <span
        key={i}
        style={{
          ...STYLES.heart,
          color: isFilled ? COLORS.heart.filled : COLORS.heart.empty,
          opacity: isFilled ? 1 : 0.4,
        }}
        aria-hidden="true"
      >
        {isFilled ? '\u2665' : '\u2661'}
      </span>
    );
  }

  return hearts;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Heads-Up Display component showing game stats.
 * Positioned at the top of the game area with score, timer, lives, and level info.
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 */
export const GameHUD = memo(function GameHUD({
  score,
  timer,
  lives,
  currentLevel,
  levelName,
  combo = 0,
}: GameHUDProps): ReactElement {
  const timerColor = getTimerColor(timer);

  return (
    <div style={STYLES.hud} role="status" aria-live="off">
      {/* Left section: Score and Combo */}
      <div style={STYLES.section}>
        <div>
          <span style={STYLES.label}>Score</span>
          <span style={STYLES.value}>{score.toLocaleString()}</span>
        </div>
        {combo > 0 && (
          <span style={STYLES.combo} aria-label={`${combo}x combo`}>
            x{combo}
          </span>
        )}
      </div>

      {/* Center section: Level info */}
      <div style={STYLES.level}>
        <div style={STYLES.levelNumber}>Level {currentLevel}</div>
        {levelName && <div style={STYLES.levelName}>{levelName}</div>}
      </div>

      {/* Right section: Timer and Lives */}
      <div style={STYLES.section}>
        <div>
          <span style={STYLES.label}>Time</span>
          <span
            style={{
              ...STYLES.value,
              color: timerColor,
            }}
          >
            {formatTime(timer)}
          </span>
        </div>
        <div>
          <span style={STYLES.label}>Lives</span>
          <div
            style={STYLES.lives}
            role="img"
            aria-label={`${lives} lives remaining`}
            aria-live="polite"
          >
            {renderLives(lives)}
          </div>
        </div>
      </div>
    </div>
  );
});

export default GameHUD;
