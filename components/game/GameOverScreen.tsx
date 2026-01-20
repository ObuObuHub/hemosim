// components/game/GameOverScreen.tsx
'use client';

import type { GameStats } from '@/types/game';
import { COLORS } from '@/engine/game/game-config';

interface GameOverScreenProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function GameOverScreen({
  stats,
  onPlayAgain,
  onMainMenu,
}: GameOverScreenProps): React.ReactElement {
  const totalLost =
    stats.factorsLostToEscape +
    stats.factorsLostToAntithrombin +
    stats.factorsLostToAPC +
    stats.factorsLostToPlasmin;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      {/* Screen edge vignette effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: 'inset 0 0 150px 50px rgba(220, 38, 38, 0.3)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 32,
          maxWidth: 500,
          textAlign: 'center',
          border: '2px solid #DC2626',
          boxShadow: '0 0 40px rgba(220, 38, 38, 0.4)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#DC2626',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            textShadow: '0 0 20px rgba(220, 38, 38, 0.6)',
          }}
        >
          Hemorrhage
        </h2>

        <p
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 24,
          }}
        >
          Too many clotting factors were lost. The bleeding could not be controlled.
        </p>

        {/* Stats */}
        <div
          style={{
            backgroundColor: '#0F172A',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.textSecondary,
              textTransform: 'uppercase',
              marginBottom: 12,
              letterSpacing: '1px',
            }}
          >
            Statistics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatRow label="Factors Caught" value={stats.factorsCaught} color="#22C55E" />
            <StatRow label="Total Factors Lost" value={totalLost} color="#EF4444" />

            <div style={{ height: 1, backgroundColor: COLORS.panelBorder, margin: '8px 0' }} />

            <StatRow
              label="Lost to Escape"
              value={stats.factorsLostToEscape}
              color="#F59E0B"
              indent
            />
            <StatRow
              label="Lost to Antithrombin"
              value={stats.factorsLostToAntithrombin}
              color="#8B5CF6"
              indent
            />
            <StatRow
              label="Lost to APC"
              value={stats.factorsLostToAPC}
              color="#EC4899"
              indent
            />
            <StatRow
              label="Lost to Plasmin"
              value={stats.factorsLostToPlasmin}
              color="#06B6D4"
              indent
            />

            <div style={{ height: 1, backgroundColor: COLORS.panelBorder, margin: '8px 0' }} />

            <StatRow
              label="Time Survived"
              value={`${Math.floor(stats.timeTaken)}s`}
              color={COLORS.textSecondary}
            />
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onPlayAgain}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <button
            onClick={onMainMenu}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.panelBorder}`,
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: number | string;
  color: string;
  indent?: boolean;
}

function StatRow({ label, value, color, indent }: StatRowProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: indent ? 16 : 0,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: indent ? COLORS.textDim : COLORS.textSecondary,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}
