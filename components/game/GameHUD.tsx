// components/game/GameHUD.tsx
'use client';

import { COLORS, LAYOUT, GAME_CANVAS } from '@/engine/game/game-config';
import { THROMBIN_STARTER_THRESHOLD } from '@/engine/game/validation-rules';

interface GameHUDProps {
  /** Logical thrombin value (instant) - used for threshold checks and display percentage */
  thrombinMeter: number;
  /** Optional interpolated display value (lerped) - used for visual fill width */
  thrombinDisplayValue?: number;
  /** Logical clot integrity value (instant) */
  clotIntegrity: number;
  /** Optional interpolated display value (lerped) */
  clotIntegrityDisplayValue?: number;
  currentMessage: string;
  isError: boolean;
  phase: string;
}

export function GameHUD({
  thrombinMeter,
  thrombinDisplayValue,
  clotIntegrity,
  clotIntegrityDisplayValue,
  currentMessage,
  isError,
  phase,
}: GameHUDProps): React.ReactElement {
  const meterWidth = 300;
  // Use displayValue for visual fill width if provided, otherwise use logical value
  const visualValue = thrombinDisplayValue ?? thrombinMeter;
  const fillWidth = (visualValue / 100) * meterWidth;
  const thresholdPosition = (THROMBIN_STARTER_THRESHOLD / 100) * meterWidth;

  // Use logical value for color thresholds (instant state)
  const fillColor =
    thrombinMeter >= 100
      ? '#22C55E' // Green - complete
      : thrombinMeter >= THROMBIN_STARTER_THRESHOLD
      ? '#EF4444' // Red - above threshold
      : '#F59E0B'; // Amber - building up

  // Clot Integrity meter calculations
  const integrityMeterWidth = 200;
  const integrityVisualValue = clotIntegrityDisplayValue ?? clotIntegrity;
  const integrityFillWidth = (integrityVisualValue / 100) * integrityMeterWidth;

  // Color changes from orange to gold as it fills
  const integrityFillColor =
    clotIntegrity >= 100
      ? '#22C55E' // Green - complete
      : clotIntegrity >= 75
      ? '#FBBF24' // Gold - almost there
      : '#F97316'; // Orange - building up

  // Only show during stabilization phase or after
  const showIntegrityMeter = phase === 'stabilization' || phase === 'complete';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: GAME_CANVAS.width,
        height: LAYOUT.header.height,
        backgroundColor: '#0F172A',
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
      }}
    >
      {/* Meters row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 8,
        }}
      >
        {/* Thrombin meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.textSecondary,
              textTransform: 'uppercase',
            }}
          >
            Thrombin:
          </span>

          {/* Meter bar */}
          <div
            style={{
              position: 'relative',
              width: meterWidth,
              height: 20,
              backgroundColor: COLORS.thrombinMeterBackground,
              borderRadius: 4,
              border: `1px solid ${COLORS.panelBorder}`,
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
              }}
            />

            {/* Threshold marker */}
            <div
              style={{
                position: 'absolute',
                left: thresholdPosition,
                top: 0,
                width: 2,
                height: '100%',
                backgroundColor: '#FBBF24',
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
              {thrombinMeter}%
            </span>
          </div>

          {/* Threshold label */}
          <span
            style={{
              fontSize: 10,
              color: COLORS.textDim,
            }}
          >
            Starter: {THROMBIN_STARTER_THRESHOLD}%
          </span>
        </div>

        {/* Clot Integrity meter - conditionally shown */}
        {showIntegrityMeter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.textSecondary,
                textTransform: 'uppercase',
              }}
            >
              Clot:
            </span>

            {/* Meter bar */}
            <div
              style={{
                position: 'relative',
                width: integrityMeterWidth,
                height: 20,
                backgroundColor: COLORS.clotIntegrityMeterBackground,
                borderRadius: 4,
                border: `1px solid ${COLORS.panelBorder}`,
                overflow: 'hidden',
              }}
            >
              {/* Fill */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: integrityFillWidth,
                  height: '100%',
                  backgroundColor: integrityFillColor,
                  transition: 'width 0.3s ease, background-color 0.3s ease',
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
                {clotIntegrity}%
              </span>
            </div>

            {/* Target label */}
            <span
              style={{
                fontSize: 10,
                color: COLORS.textDim,
              }}
            >
              Target: 100%
            </span>
          </div>
        )}

        {/* Phase indicator */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: phase === 'complete' ? '#22C55E' : '#3B82F6',
            textTransform: 'uppercase',
            marginLeft: 'auto',
          }}
        >
          {phase === 'complete' ? 'Complete!' : phase}
        </span>
      </div>

      {/* Message area */}
      <div
        style={{
          fontSize: 13,
          color: isError ? COLORS.errorMessage : COLORS.successMessage,
          textAlign: 'center',
          minHeight: 20,
          transition: 'color 0.2s ease',
        }}
      >
        {currentMessage}
      </div>
    </div>
  );
}
