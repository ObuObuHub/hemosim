// components/game/ClotZonePanel.tsx
'use client';

import { useRef, useMemo } from 'react';
import type { Slot } from '@/types/game';
import type { PanelConfig } from '@/engine/game/game-config';
import { COLORS, SLOT_POSITIONS } from '@/engine/game/game-config';
import { getFactorDefinition } from '@/engine/game/factor-definitions';
import { getValidSlotsForFactor } from '@/engine/game/validation-rules';
import { FactorToken } from './FactorToken';
import { useAnimationTarget } from '@/hooks/useAnimationTarget';
import type { GameState } from '@/types/game';

interface ClotZonePanelProps {
  config: PanelConfig;
  slots: Slot[];
  gameState: GameState;
  onSlotClick: (slotId: string) => void;
}

// Get slot center position for SVG line drawing
function getSlotCenter(slotId: string): { x: number; y: number } | null {
  const pos = SLOT_POSITIONS[slotId];
  if (!pos) return null;
  return {
    x: pos.x + pos.width / 2,
    y: pos.y + pos.height / 2,
  };
}

// Generate mesh lines between fibrin slots
function generateMeshLines(
  fibrinSlots: Slot[],
  isCrossLinked: boolean
): Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> {
  const placedFibrinSlots = fibrinSlots.filter(
    (s) => s.placedFactorId === 'Fibrinogen' && s.isActive
  );

  if (placedFibrinSlots.length < 2) return [];

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];

  // Connect all placed fibrins to each other
  for (let i = 0; i < placedFibrinSlots.length; i++) {
    for (let j = i + 1; j < placedFibrinSlots.length; j++) {
      const pos1 = getSlotCenter(placedFibrinSlots[i].id);
      const pos2 = getSlotCenter(placedFibrinSlots[j].id);
      if (pos1 && pos2) {
        lines.push({
          x1: pos1.x,
          y1: pos1.y,
          x2: pos2.x,
          y2: pos2.y,
          key: `${placedFibrinSlots[i].id}-${placedFibrinSlots[j].id}`,
        });
      }
    }
  }

  return lines;
}

// Determine panel status
function getPanelStatus(
  slots: Slot[],
  gameState: GameState
): { label: string; color: string } | null {
  const anyLocked = slots.some((s) => s.isLocked);
  const allPlaced = slots.every((s) => s.placedFactorId !== null);

  if (gameState.phase !== 'stabilization' && gameState.phase !== 'complete') {
    return { label: 'LOCKED', color: '#6B7280' };
  }
  if (allPlaced) return { label: 'COMPLETED', color: '#22C55E' };
  return { label: 'ACTIVE', color: '#3B82F6' };
}

// =============================================================================
// SLOT COMPONENT
// =============================================================================

interface SlotComponentProps {
  slot: Slot;
  isValidTarget: boolean;
  placedFactor: ReturnType<typeof getFactorDefinition> | null;
  onSlotClick: (slotId: string) => void;
}

function SlotComponent({
  slot,
  isValidTarget,
  placedFactor,
  onSlotClick,
}: SlotComponentProps): React.ReactElement | null {
  const slotRef = useRef<HTMLDivElement>(null);
  useAnimationTarget(`slot-${slot.id}`, slotRef);

  const pos = SLOT_POSITIONS[slot.id];
  if (!pos) return null;

  // Determine slot label based on factor type
  const slotLabel = slot.acceptsFactorId === 'FXIII' ? 'FXIII' : 'Fibrinogen';

  return (
    <div
      ref={slotRef}
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
            fontSize: 10,
            color: COLORS.textDim,
            textAlign: 'center',
          }}
        >
          {slotLabel}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// FIBRIN MESH SVG
// =============================================================================

interface FibrinMeshProps {
  lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }>;
  isCrossLinked: boolean;
}

function FibrinMesh({ lines, isCrossLinked }: FibrinMeshProps): React.ReactElement {
  const meshRef = useRef<SVGSVGElement>(null);
  useAnimationTarget('fibrin-mesh', meshRef);

  return (
    <svg
      ref={meshRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {lines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={isCrossLinked ? COLORS.fibrinStrandCrossLinked : COLORS.fibrinStrandColor}
          strokeWidth={isCrossLinked ? 4 : 2}
          strokeLinecap="round"
          style={{
            filter: isCrossLinked ? 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' : 'none',
            transition: 'all 0.5s ease',
          }}
        />
      ))}
    </svg>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClotZonePanel({
  config,
  slots,
  gameState,
  onSlotClick,
}: ClotZonePanelProps): React.ReactElement {
  const panelRef = useRef<HTMLDivElement>(null);
  useAnimationTarget('panel-clot-zone', panelRef);

  const panelSlots = slots.filter((s) => s.surface === 'clot-zone');
  const fibrinSlots = panelSlots.filter((s) => s.acceptsFactorId === 'Fibrinogen');
  const fxiiiSlot = panelSlots.find((s) => s.acceptsFactorId === 'FXIII');
  const isCrossLinked = Boolean(fxiiiSlot?.placedFactorId !== null && fxiiiSlot?.isActive);

  const isLocked = panelSlots.some((s) => s.isLocked);
  const panelStatus = getPanelStatus(panelSlots, gameState);

  // Get valid slots for currently selected factor
  const validSlotIds = gameState.selectedFactorId
    ? getValidSlotsForFactor(gameState, gameState.selectedFactorId)
    : [];

  // Generate mesh lines
  const meshLines = useMemo(
    () => generateMeshLines(fibrinSlots, isCrossLinked),
    [fibrinSlots, isCrossLinked]
  );

  return (
    <div
      ref={panelRef}
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
          marginBottom: 8,
        }}
      >
        {config.subtitle}
      </div>

      {/* Status Badge */}
      {panelStatus && (
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: panelStatus.color,
            backgroundColor: `${panelStatus.color}20`,
            padding: '2px 8px',
            borderRadius: 4,
            marginBottom: 12,
            letterSpacing: '0.5px',
          }}
        >
          {panelStatus.label}
        </div>
      )}

      {/* Locked message */}
      {isLocked && (
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

      {/* Fibrin Mesh SVG */}
      <FibrinMesh lines={meshLines} isCrossLinked={isCrossLinked} />

      {/* Slots */}
      {panelSlots.map((slot) => {
        const isValidTarget = validSlotIds.includes(slot.id);
        const placedFactor = slot.placedFactorId
          ? getFactorDefinition(slot.placedFactorId)
          : null;

        return (
          <SlotComponent
            key={slot.id}
            slot={slot}
            isValidTarget={isValidTarget}
            placedFactor={placedFactor}
            onSlotClick={onSlotClick}
          />
        );
      })}

      {/* Cross-Link Label */}
      {isCrossLinked && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            fontWeight: 600,
            color: COLORS.fibrinStrandCrossLinked,
            textAlign: 'center',
            padding: '4px 8px',
            backgroundColor: `${COLORS.fibrinStrandCrossLinked}20`,
            borderRadius: 4,
          }}
        >
          CROSS-LINKED
        </div>
      )}
    </div>
  );
}
