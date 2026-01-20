// components/game/BleedingMeter.tsx
'use client';

import { COLORS } from '@/engine/game/game-config';

interface BleedingMeterProps {
  /** Current bleeding level (0-100) */
  bleedingMeter: number;
  /** Optional interpolated display value for smooth animations */
  bleedingDisplayValue?: number;
}

export function BleedingMeter({
  bleedingMeter,
  bleedingDisplayValue,
}: BleedingMeterProps): React.ReactElement {
  const meterWidth = 200;
  const visualValue = bleedingDisplayValue ?? bleedingMeter;
  const fillWidth = (visualValue / 100) * meterWidth;

  // Determine if we should pulse (high bleeding)
  const isHighBleeding = bleedingMeter > 50;
  const isCriticalBleeding = bleedingMeter > 75;

  // Color intensifies as bleeding increases
  const fillColor = isCriticalBleeding
    ? '#DC2626' // red-600 - critical
    : isHighBleeding
    ? '#EF4444' // red-500 - high
    : '#F87171'; // red-400 - normal

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: isCriticalBleeding ? '#EF4444' : COLORS.textSecondary,
          textTransform: 'uppercase',
        }}
      >
        Bleeding:
      </span>

      {/* Meter bar */}
      <div
        style={{
          position: 'relative',
          width: meterWidth,
          height: 20,
          backgroundColor: '#1E293B',
          borderRadius: 4,
          border: `1px solid ${isCriticalBleeding ? '#EF4444' : COLORS.panelBorder}`,
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: fillWidth,
            height: '100%',
            backgroundColor: fillColor,
            transition: 'width 0.3s ease, background-color 0.3s ease',
            boxShadow: isHighBleeding ? `0 0 8px ${fillColor}80` : undefined,
            animation: isCriticalBleeding ? 'pulse 1s ease-in-out infinite' : undefined,
          }}
        />

        {/* Percentage text */}
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.textPrimary,
          }}
        >
          {bleedingMeter}%
        </span>
      </div>

      {/* Warning indicator at high levels */}
      {isCriticalBleeding && (
        <span
          style={{
            fontSize: 10,
            color: '#EF4444',
            fontWeight: 600,
            animation: 'pulse 1s ease-in-out infinite',
          }}
        >
          CRITICAL
        </span>
      )}

      {/* CSS animation keyframes */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
}
