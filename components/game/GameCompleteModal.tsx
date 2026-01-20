// components/game/GameCompleteModal.tsx
'use client';

import { COLORS } from '@/engine/game/game-config';

interface GameCompleteModalProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function GameCompleteModal({
  onPlayAgain,
  onMainMenu,
}: GameCompleteModalProps): React.ReactElement {
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
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 32,
          maxWidth: 500,
          textAlign: 'center',
          border: `1px solid ${COLORS.panelBorder}`,
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#22C55E',
            marginBottom: 16,
          }}
        >
          Thrombin Burst Achieved!
        </h2>

        {/* Summary */}
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            You completed the full cell-based coagulation cascade!
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>What you learned:</strong>
          </p>
          <ul
            style={{
              textAlign: 'left',
              paddingLeft: 24,
              marginBottom: 12,
            }}
          >
            <li><strong>Initiation:</strong> TF+VIIa generates FXa and FIXa on TF-bearing cells</li>
            <li><strong>Starter thrombin:</strong> FXa + trace Va produces small thrombin (primes platelets)</li>
            <li><strong>Amplification:</strong> Thrombin activates FV→FVa and FVIII→FVIIIa</li>
            <li><strong>Tenase:</strong> FIXa + FVIIIa generates abundant FXa on activated platelet</li>
            <li><strong>Prothrombinase:</strong> FXa + FVa produces the thrombin burst</li>
          </ul>
          <p>
            <strong>Key insight:</strong> Surface segregation and enzyme-cofactor complexes
            amplify the signal from tiny initiation to massive thrombin output.
          </p>
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
