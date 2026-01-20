// components/game/SurfacePanel.tsx
'use client';

import type { Slot, ComplexSlot } from '@/types/game';
import type { PanelConfig } from '@/engine/game/game-config';
import { COLORS, SLOT_POSITIONS, PREPLACED_POSITIONS, COMPLEX_SLOT_POSITIONS, COMPLEX_LABELS } from '@/engine/game/game-config';
import { PREPLACED_ELEMENTS, getFactorDefinition } from '@/engine/game/factor-definitions';
import { getValidSlotsForFactor, isTenaseComplete } from '@/engine/game/validation-rules';
import { FactorToken } from './FactorToken';
import type { GameState } from '@/types/game';

interface SurfacePanelProps {
  config: PanelConfig;
  slots: Slot[];
  complexSlots: ComplexSlot[];
  gameState: GameState;
  onSlotClick: (slotId: string) => void;
  onComplexSlotClick: (complexSlotId: string) => void;
}

export function SurfacePanel({
  config,
  slots,
  complexSlots,
  gameState,
  onSlotClick,
  onComplexSlotClick,
}: SurfacePanelProps): React.ReactElement {
  const panelSlots = slots.filter((s) => s.surface === config.surface);
  const isLocked = panelSlots.some((s) => s.isLocked);
  const preplacedElements = PREPLACED_ELEMENTS.filter((e) => e.surface === config.surface);

  // Get valid slots for currently selected factor
  const validSlotIds = gameState.selectedFactorId
    ? getValidSlotsForFactor(gameState, gameState.selectedFactorId)
    : [];

  return (
    <div
      style={{
        position: 'absolute',
        left: config.x,
        top: config.y,
        width: config.width,
        height: config.height,
        backgroundColor: isLocked ? COLORS.panelBackgroundLocked : COLORS.panelBackground,
        borderRight: `1px solid ${COLORS.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
      }}
    >
      {/* Panel Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.textPrimary,
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        {config.title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS.textSecondary,
          marginBottom: 16,
        }}
      >
        {config.subtitle}
      </div>

      {/* Coming Soon overlay for v2 */}
      {config.isComingSoon && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.textDim,
            textAlign: 'center',
          }}
        >
          COMING IN v2
        </div>
      )}

      {/* Locked message */}
      {isLocked && !config.isComingSoon && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.textDim,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {config.lockedMessage}
        </div>
      )}

      {/* Pre-placed elements (TF+VIIa, trace Va) */}
      {!config.isComingSoon &&
        preplacedElements.map((element) => {
          const pos = PREPLACED_POSITIONS[element.id as keyof typeof PREPLACED_POSITIONS];
          if (!pos) return null;

          return (
            <div
              key={element.id}
              title={element.tooltip}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: pos.width,
                height: pos.height,
                backgroundColor: element.isDim ? `${COLORS.textDim}30` : '#F59E0B40',
                border: `2px solid ${element.isDim ? COLORS.textDim : '#F59E0B'}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: element.isDim ? COLORS.textDim : '#F59E0B',
                cursor: 'help',
              }}
            >
              {element.label}
            </div>
          );
        })}

      {/* Slots */}
      {!config.isComingSoon &&
        panelSlots.map((slot) => {
          const pos = SLOT_POSITIONS[slot.id];
          if (!pos) return null;

          const isValidTarget = validSlotIds.includes(slot.id);
          const placedFactor = slot.placedFactorId
            ? getFactorDefinition(slot.placedFactorId)
            : null;

          return (
            <div
              key={slot.id}
              onClick={() => !slot.isLocked && onSlotClick(slot.id)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: pos.width,
                height: pos.height,
                backgroundColor: slot.isLocked
                  ? `${COLORS.slotBackground}50`
                  : COLORS.slotBackground,
                border: `2px dashed ${
                  isValidTarget
                    ? COLORS.slotBorderValid
                    : slot.isLocked
                    ? COLORS.textDim
                    : COLORS.panelBorder
                }`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: slot.isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isValidTarget ? `0 0 10px ${COLORS.slotBorderValid}50` : 'none',
              }}
            >
              {placedFactor ? (
                <FactorToken factor={placedFactor} isActive={slot.isActive} />
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: COLORS.textDim,
                  }}
                >
                  {slot.acceptsFactorId}
                </span>
              )}
            </div>
          );
        })}

      {/* Complex Slots (Activated Platelet only) */}
      {!config.isComingSoon && config.surface === 'activated-platelet' && (
        <>
          {/* Tenase label */}
          <div
            style={{
              position: 'absolute',
              left: 30,
              top: 70,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.textSecondary,
            }}
          >
            {COMPLEX_LABELS.tenase.name}
          </div>

          {/* Prothrombinase label */}
          <div
            style={{
              position: 'absolute',
              left: 30,
              top: 190,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.textSecondary,
            }}
          >
            {COMPLEX_LABELS.prothrombinase.name}
          </div>

          {/* Complex slots */}
          {complexSlots.map((complexSlot) => {
            const pos = COMPLEX_SLOT_POSITIONS[complexSlot.id];
            if (!pos) return null;

            const isEnzymeSlot = !complexSlot.isAutoFilled;
            const isClickable = isEnzymeSlot;
            const placedFactor = complexSlot.placedFactorId
              ? getFactorDefinition(complexSlot.placedFactorId)
              : null;

            // Prothrombinase-enzyme slot is dimmed if Tenase not complete
            const isDimmed =
              complexSlot.id === 'prothrombinase-enzyme' &&
              !isTenaseComplete(gameState);

            return (
              <div
                key={complexSlot.id}
                onClick={() => isClickable && onComplexSlotClick(complexSlot.id)}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: pos.width,
                  height: pos.height,
                  backgroundColor: isDimmed
                    ? `${COLORS.slotBackground}30`
                    : COLORS.slotBackground,
                  border: complexSlot.isAutoFilled
                    ? `2px solid ${COLORS.panelBorder}`
                    : `2px dashed ${COLORS.panelBorder}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: isDimmed ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {placedFactor ? (
                  <FactorToken factor={placedFactor} isActive={true} />
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      color: COLORS.textDim,
                    }}
                  >
                    {complexSlot.role}
                  </span>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
