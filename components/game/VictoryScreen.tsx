// components/game/VictoryScreen.tsx
'use client';

import type { GameStats } from '@/types/game';
import { COLORS } from '@/engine/game/game-config';

interface VictoryScreenProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function VictoryScreen({
  stats,
  onPlayAgain,
  onMainMenu,
}: VictoryScreenProps): React.ReactElement {
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      {/* Screen edge glow effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: 'inset 0 0 150px 50px rgba(34, 197, 94, 0.15)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 32,
          maxWidth: 540,
          textAlign: 'center',
          border: '2px solid #22C55E',
          boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#22C55E',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            textShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
          }}
        >
          Clot Formed!
        </h2>

        <p
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 24,
          }}
        >
          Hemostasis achieved! The bleeding has been successfully controlled.
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
            Performance
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatRow
              label="Time to Complete"
              value={`${Math.floor(stats.timeTaken)}s`}
              color="#FBBF24"
            />
            <StatRow label="Factors Caught" value={stats.factorsCaught} color="#22C55E" />
            <StatRow label="Factors Lost" value={totalLost} color="#EF4444" />

            {totalLost > 0 && (
              <>
                <div style={{ height: 1, backgroundColor: COLORS.panelBorder, margin: '8px 0' }} />
                {stats.factorsLostToEscape > 0 && (
                  <StatRow
                    label="Escaped"
                    value={stats.factorsLostToEscape}
                    color="#F59E0B"
                    indent
                  />
                )}
                {stats.factorsLostToAntithrombin > 0 && (
                  <StatRow
                    label="Antithrombin"
                    value={stats.factorsLostToAntithrombin}
                    color="#8B5CF6"
                    indent
                  />
                )}
                {stats.factorsLostToAPC > 0 && (
                  <StatRow label="APC" value={stats.factorsLostToAPC} color="#EC4899" indent />
                )}
                {stats.factorsLostToPlasmin > 0 && (
                  <StatRow
                    label="Plasmin"
                    value={stats.factorsLostToPlasmin}
                    color="#06B6D4"
                    indent
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Educational Summary */}
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
              color: '#22C55E',
              textTransform: 'uppercase',
              marginBottom: 12,
              letterSpacing: '1px',
            }}
          >
            What You Accomplished
          </h3>

          <ul
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
              lineHeight: 1.6,
              paddingLeft: 20,
              margin: 0,
            }}
          >
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: COLORS.textPrimary }}>Initiation:</strong> TF+VIIa generated
              FXa and FIXa on TF-bearing cells
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: COLORS.textPrimary }}>Amplification:</strong> Starter
              thrombin activated FV and FVIII on platelets
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: COLORS.textPrimary }}>Propagation:</strong> Tenase and
              Prothrombinase complexes produced thrombin burst
            </li>
            <li>
              <strong style={{ color: COLORS.textPrimary }}>Stabilization:</strong> Fibrin mesh
              cross-linked by FXIIIa for stable clot
            </li>
          </ul>
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
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Play Again
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
