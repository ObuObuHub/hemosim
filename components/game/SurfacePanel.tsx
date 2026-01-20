// components/game/SurfacePanel.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import type { Slot, ComplexSlot, GamePhase } from '@/types/game';
import type { PanelConfig } from '@/engine/game/game-config';
import { COLORS, SLOT_POSITIONS, PREPLACED_POSITIONS, COMPLEX_SLOT_POSITIONS, COMPLEX_LABELS } from '@/engine/game/game-config';
import { PREPLACED_ELEMENTS, getFactorDefinition } from '@/engine/game/factor-definitions';
import { getValidSlotsForFactor, isTenaseComplete } from '@/engine/game/validation-rules';
import { FactorToken } from './FactorToken';
import { MembraneBackground } from './MembraneBackground';
import { useAnimationTarget } from '@/hooks/useAnimationTarget';
import type { GameState } from '@/types/game';

interface SurfacePanelProps {
  config: PanelConfig;
  slots: Slot[];
  complexSlots: ComplexSlot[];
  gameState: GameState;
  onSlotClick: (slotId: string) => void;
  onComplexSlotClick: (complexSlotId: string) => void;
}

// Determine panel status badge
function getPanelStatus(
  surface: string,
  slots: Slot[],
  gameState: GameState
): { label: string; color: string } | null {
  const panelSlots = slots.filter((s) => s.surface === surface);
  const allPlaced = panelSlots.every((s) => s.placedFactorId !== null);
  const anyLocked = panelSlots.some((s) => s.isLocked);

  if (surface === 'tf-cell') {
    if (allPlaced) return { label: 'COMPLETED', color: '#22C55E' };
    return { label: 'ACTIVE', color: '#3B82F6' };
  }

  if (surface === 'platelet') {
    if (anyLocked) return { label: 'LOCKED', color: '#6B7280' };
    if (allPlaced) return { label: 'COMPLETED', color: '#22C55E' };
    return { label: 'ACTIVE', color: '#3B82F6' };
  }

  if (surface === 'activated-platelet') {
    if (gameState.phase === 'initiation' || gameState.phase === 'amplification') {
      return { label: 'LOCKED', color: '#6B7280' };
    }
    if (gameState.phase === 'complete') return { label: 'COMPLETED', color: '#22C55E' };
    return { label: 'ACTIVE', color: '#3B82F6' };
  }

  return null;
}

// =============================================================================
// SLOT COMPONENT (with animation target registration)
// =============================================================================

interface SlotComponentProps {
  slot: Slot;
  isValidTarget: boolean;
  placedFactor: ReturnType<typeof getFactorDefinition> | null;
  onSlotClick: (slotId: string) => void;
}

function SlotComponent({ slot, isValidTarget, placedFactor, onSlotClick }: SlotComponentProps): React.ReactElement | null {
  const slotRef = useRef<HTMLDivElement>(null);
  useAnimationTarget(`slot-${slot.id}`, slotRef);

  const pos = SLOT_POSITIONS[slot.id];
  if (!pos) return null;

  // Build className for CSS animations
  const classNames = ['game-interactive'];
  if (isValidTarget) classNames.push('slot-valid-target');

  return (
    <div
      ref={slotRef}
      className={classNames.join(' ')}
      onClick={() => !slot.isLocked && onSlotClick(slot.id)}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: pos.width,
        height: pos.height,
        backgroundColor: slot.isLocked
          ? `${COLORS.slotBackground}50`
          : isValidTarget
          ? `${COLORS.slotBorderValid}20`
          : COLORS.slotBackground,
        border: `3px ${isValidTarget ? 'solid' : 'dashed'} ${
          isValidTarget
            ? COLORS.slotBorderValid
            : slot.isLocked
            ? COLORS.textDim
            : COLORS.panelBorder
        }`,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: slot.isLocked ? 'not-allowed' : 'pointer',
        transition: slot.isLocked ? 'none' : 'background-color 0.2s ease',
      }}
    >
      {slot.transferredToCirculation ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 10, color: COLORS.textDim }}>
            {placedFactor?.activeLabel}
          </span>
          <span style={{ fontSize: 9, color: slot.acceptsFactorId === 'FII' ? '#EF4444' : '#06B6D4' }}>
            {slot.acceptsFactorId === 'FII' ? '→ primes platelet' : '→ circulation'}
          </span>
        </div>
      ) : placedFactor ? (
        <div className="factor-placed">
          <FactorToken factor={placedFactor} isActive={slot.isActive} />
        </div>
      ) : (
        <span
          style={{
            fontSize: 11,
            color: isValidTarget ? COLORS.slotBorderValid : COLORS.textDim,
            fontWeight: isValidTarget ? 600 : 400,
          }}
        >
          {slot.acceptsFactorId}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// PREPLACED ELEMENT COMPONENT (with animation target registration)
// =============================================================================

interface PreplacedElementComponentProps {
  element: {
    id: string;
    label: string;
    tooltip: string;
    isDim: boolean;
  };
}

function PreplacedElementComponent({ element }: PreplacedElementComponentProps): React.ReactElement | null {
  const elementRef = useRef<HTMLDivElement>(null);
  useAnimationTarget(`preplaced-${element.id}`, elementRef);

  const pos = PREPLACED_POSITIONS[element.id as keyof typeof PREPLACED_POSITIONS];
  if (!pos) return null;

  return (
    <div
      ref={elementRef}
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
}

// =============================================================================
// COMPLEX SLOT COMPONENT (with animation target registration)
// =============================================================================

interface ComplexSlotComponentProps {
  complexSlot: ComplexSlot;
  gameState: GameState;
  onComplexSlotClick: (complexSlotId: string) => void;
}

function ComplexSlotComponent({ complexSlot, gameState, onComplexSlotClick }: ComplexSlotComponentProps): React.ReactElement | null {
  const slotRef = useRef<HTMLDivElement>(null);
  // Register as complex-{complexType}-{role} (e.g., complex-tenase-enzyme)
  useAnimationTarget(`complex-${complexSlot.complexType}-${complexSlot.role}`, slotRef);

  const pos = COMPLEX_SLOT_POSITIONS[complexSlot.id];
  if (!pos) return null;

  const isEnzymeSlot = !complexSlot.isAutoFilled;
  const isClickable = isEnzymeSlot && gameState.phase === 'propagation';
  const placedFactor = complexSlot.placedFactorId
    ? getFactorDefinition(complexSlot.placedFactorId)
    : null;

  // For cofactor slots, show expected factor even before placed (greyed)
  const previewFactorId = complexSlot.isAutoFilled
    ? (complexSlot.id === 'tenase-cofactor' ? 'FVIII' : 'FV')
    : null;
  const previewFactor = previewFactorId ? getFactorDefinition(previewFactorId) : null;

  // Determine if slot should be dimmed
  const isLocked = gameState.phase !== 'propagation' && gameState.phase !== 'complete';
  const needsTenase = complexSlot.id === 'prothrombinase-enzyme' && !isTenaseComplete(gameState);
  const isDimmed = isLocked || needsTenase;

  return (
    <div
      ref={slotRef}
      onClick={() => isClickable && !needsTenase && onComplexSlotClick(complexSlot.id)}
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
          ? `2px solid ${isDimmed ? COLORS.textDim : COLORS.panelBorder}`
          : `2px dashed ${isDimmed ? COLORS.textDim : COLORS.panelBorder}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isClickable && !needsTenase ? 'pointer' : 'default',
        opacity: isDimmed ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {placedFactor ? (
        <FactorToken factor={placedFactor} isActive={true} />
      ) : previewFactor ? (
        <FactorToken
          factor={previewFactor}
          isActive={true}
          style={{ opacity: 0.4 }}
        />
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
}

// =============================================================================
// MAIN SURFACE PANEL COMPONENT
// =============================================================================

export function SurfacePanel({
  config,
  slots,
  complexSlots,
  gameState,
  onSlotClick,
  onComplexSlotClick,
}: SurfacePanelProps): React.ReactElement {
  // Register panel as animation target
  const panelRef = useRef<HTMLDivElement>(null);
  useAnimationTarget(`panel-${config.surface}`, panelRef);

  const panelSlots = slots.filter((s) => s.surface === config.surface);
  const isLocked = panelSlots.some((s) => s.isLocked);
  const preplacedElements = PREPLACED_ELEMENTS.filter((e) => e.surface === config.surface);

  // Get panel status badge
  const panelStatus = getPanelStatus(config.surface, slots, gameState);

  // Get valid slots for currently selected factor
  const validSlotIds = gameState.selectedFactorId
    ? getValidSlotsForFactor(gameState, gameState.selectedFactorId)
    : [];

  // Track scramblase animation for activated platelet
  const [prevPhase, setPrevPhase] = useState<GamePhase>(gameState.phase);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Trigger scramblase animation when transitioning to propagation phase
    if (
      config.surface === 'activated-platelet' &&
      prevPhase !== 'propagation' &&
      gameState.phase === 'propagation'
    ) {
      setIsActivating(true);
      // Reset after animation completes
      const timer = setTimeout(() => {
        setIsActivating(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setPrevPhase(gameState.phase);
  }, [gameState.phase, prevPhase, config.surface]);

  // Determine membrane surface type for background
  const membraneSurfaceType = config.surface === 'activated-platelet' && isActivating
    ? 'activated-platelet'
    : config.surface;

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
        overflow: 'hidden',
      }}
    >
      {/* Membrane Background - renders biological texture for each surface */}
      {!config.isComingSoon && (
        <MembraneBackground
          surfaceType={membraneSurfaceType}
          isActivating={isActivating}
          width={config.width}
          height={config.height}
        />
      )}
      {/* Panel Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.textPrimary,
          textAlign: 'center',
          marginBottom: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {config.title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS.textSecondary,
          marginBottom: 8,
          position: 'relative',
          zIndex: 1,
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
            position: 'relative',
            zIndex: 1,
          }}
        >
          {panelStatus.label}
        </div>
      )}

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
            zIndex: 2,
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
            zIndex: 2,
          }}
        >
          {config.lockedMessage}
        </div>
      )}

      {/* Pre-placed elements (TF+VIIa, trace Va) */}
      {!config.isComingSoon &&
        preplacedElements.map((element) => (
          <PreplacedElementComponent key={element.id} element={element} />
        ))}

      {/* Slots */}
      {!config.isComingSoon &&
        panelSlots.map((slot) => {
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
              zIndex: 2,
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
              zIndex: 2,
            }}
          >
            {COMPLEX_LABELS.prothrombinase.name}
          </div>

          {/* Complex slots */}
          {complexSlots.map((complexSlot) => (
            <ComplexSlotComponent
              key={complexSlot.id}
              complexSlot={complexSlot}
              gameState={gameState}
              onComplexSlotClick={onComplexSlotClick}
            />
          ))}
        </>
      )}
    </div>
  );
}
