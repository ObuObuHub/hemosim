// components/game/SurfacePanel.tsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Slot, ComplexSlot, GamePhase } from '@/types/game';
import type { PanelConfig } from '@/engine/game/game-config';
import { COLORS, SLOT_POSITIONS, PREPLACED_POSITIONS } from '@/engine/game/game-config';
import { PREPLACED_ELEMENTS, getFactorDefinition } from '@/engine/game/factor-definitions';
import { getValidSlotsForFactor, isTenaseComplete } from '@/engine/game/validation-rules';
import { FactorToken } from './FactorToken';
import { MembraneBackground } from './MembraneBackground';
import { ComplexAssembly } from './ComplexAssembly';
import { useAnimationTarget } from '@/hooks/useAnimationTarget';
import type { GameState } from '@/types/game';

// =============================================================================
// DOCKING ANIMATION COMPONENTS
// =============================================================================

interface RippleEffectProps {
  color: string;
  onComplete: () => void;
}

function RippleEffect({ color, onComplete }: RippleEffectProps): React.ReactElement {
  useEffect(() => {
    const timer = setTimeout(onComplete, 400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="docking-ripple"
      style={{
        top: '50%',
        left: '50%',
        marginTop: -30,
        marginLeft: -30,
        border: `3px solid ${color}`,
        backgroundColor: `${color}20`,
      }}
    />
  );
}

interface CalciumSparklesProps {
  onComplete: () => void;
}

function CalciumSparkles({ onComplete }: CalciumSparklesProps): React.ReactElement {
  useEffect(() => {
    const timer = setTimeout(onComplete, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // 6 sparkles at different angles
  const sparkleAngles = [0, 60, 120, 180, 240, 300];
  const sparkleDistance = 25;

  return (
    <>
      {sparkleAngles.map((angle, i) => {
        const radians = (angle * Math.PI) / 180;
        const dx = Math.cos(radians) * sparkleDistance;
        const dy = Math.sin(radians) * sparkleDistance;
        return (
          <div
            key={i}
            className="calcium-sparkle"
            style={{
              top: '50%',
              left: '50%',
              marginTop: -3,
              marginLeft: -3,
              '--dx': `${dx}px`,
              '--dy': `${dy}px`,
              animationDelay: `${i * 30}ms`,
            } as React.CSSProperties}
          />
        );
      })}
    </>
  );
}

interface GhostOutlineProps {
  factorId: string;
  isPulsing: boolean;
  width: number;
  height: number;
}

function GhostOutline({ factorId, isPulsing, width, height }: GhostOutlineProps): React.ReactElement {
  const factor = getFactorDefinition(factorId);
  if (!factor) return <></>;

  return (
    <div
      className={`ghost-outline ${isPulsing ? 'ghost-outline-pulsing' : ''}`}
      style={{
        width: width - 16,
        height: height - 16,
        borderRadius: 10,
        border: `2px dashed ${factor.color}`,
        backgroundColor: `${factor.color}10`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: factor.color,
          opacity: 0.4,
        }}
      >
        {factor.inactiveLabel}
      </span>
    </div>
  );
}

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
    if (gameState.tfpiActive) return { label: 'TFPI LOCKED', color: '#DC2626' };
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

  // Track previous placed state to detect new placements
  const prevPlacedRef = useRef<string | null>(null);
  const [showDockingEffects, setShowDockingEffects] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  // Detect when a factor is newly placed
  useEffect(() => {
    const wasEmpty = prevPlacedRef.current === null;
    const isNowFilled = slot.placedFactorId !== null;

    if (wasEmpty && isNowFilled) {
      // Factor just placed - trigger animations
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: triggering animations on prop change
      setShowDockingEffects(true);
      setShowRipple(true);
      setShowSparkles(true);

      // Clear docking animation after completion
      const dockingTimer = setTimeout(() => {
        setShowDockingEffects(false);
      }, 350);

      return () => clearTimeout(dockingTimer);
    }

    prevPlacedRef.current = slot.placedFactorId;
  }, [slot.placedFactorId]);

  const handleRippleComplete = useCallback(() => setShowRipple(false), []);
  const handleSparklesComplete = useCallback(() => setShowSparkles(false), []);

  const pos = SLOT_POSITIONS[slot.id];
  if (!pos) return null;

  // Build className for CSS animations
  const classNames = ['game-interactive'];
  if (isValidTarget) classNames.push('slot-valid-target');

  // Get factor color for effects
  const factorColor = placedFactor?.color || getFactorDefinition(slot.acceptsFactorId)?.color || COLORS.panelBorder;

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
        overflow: 'visible',
      }}
    >
      {/* Ghost outline for empty slots */}
      {!placedFactor && !slot.isLocked && !slot.transferredToCirculation && (
        <GhostOutline
          factorId={slot.acceptsFactorId}
          isPulsing={isValidTarget}
          width={pos.width}
          height={pos.height}
        />
      )}

      {/* Ripple effect on placement */}
      {showRipple && <RippleEffect color={factorColor} onComplete={handleRippleComplete} />}

      {/* Ca²⁺ sparkles on placement */}
      {showSparkles && <CalciumSparkles onComplete={handleSparklesComplete} />}

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
        <div className={showDockingEffects ? 'factor-docking' : 'factor-placed'}>
          <FactorToken factor={placedFactor} isActive={slot.isActive} />
        </div>
      ) : null}
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
  tfpiActive?: boolean;
}

function PreplacedElementComponent({ element, tfpiActive = false }: PreplacedElementComponentProps): React.ReactElement | null {
  const elementRef = useRef<HTMLDivElement>(null);
  useAnimationTarget(`preplaced-${element.id}`, elementRef);

  const pos = PREPLACED_POSITIONS[element.id as keyof typeof PREPLACED_POSITIONS];
  if (!pos) return null;

  // Dim TF+VIIa when TFPI is active
  const isDimmed = element.isDim || (tfpiActive && element.id === 'tf-viia');

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
        backgroundColor: isDimmed ? `${COLORS.textDim}30` : '#F59E0B40',
        border: `2px solid ${isDimmed ? COLORS.textDim : '#F59E0B'}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: isDimmed ? COLORS.textDim : '#F59E0B',
        cursor: 'help',
        opacity: tfpiActive && element.id === 'tf-viia' ? 0.4 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {element.label}
    </div>
  );
}

// =============================================================================
// HELPER: Get factor from complex slot safely
// =============================================================================

function getComplexSlotFactor(
  complexSlots: ComplexSlot[],
  slotId: string
): ReturnType<typeof getFactorDefinition> | null {
  const slot = complexSlots.find((s) => s.id === slotId);
  if (!slot?.placedFactorId) return null;
  return getFactorDefinition(slot.placedFactorId);
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
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    // Trigger scramblase animation when transitioning to propagation phase
    if (
      config.surface === 'activated-platelet' &&
      prevPhase !== 'propagation' &&
      gameState.phase === 'propagation'
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: triggering animation on phase change
      setIsActivating(true);
      // Reset after animation completes
      const timer = setTimeout(() => {
        setIsActivating(false);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Trigger panel unlock glow for any surface that transitions from locked to unlocked
    const wasLocked = prevPhase === 'initiation' && config.surface === 'platelet';
    const isNowUnlocked = gameState.phase === 'amplification' && config.surface === 'platelet';

    const wasLockedProp = prevPhase !== 'propagation' && config.surface === 'activated-platelet';
    const isNowUnlockedProp = gameState.phase === 'propagation' && config.surface === 'activated-platelet';

    if ((wasLocked && isNowUnlocked) || (wasLockedProp && isNowUnlockedProp)) {
      setIsUnlocking(true);
      const unlockTimer = setTimeout(() => setIsUnlocking(false), 1000);
      return () => clearTimeout(unlockTimer);
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
      className={isUnlocking ? 'phase-unlocking' : undefined}
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

      {/* TFPI Lock overlay for TF-cell */}
      {config.surface === 'tf-cell' && gameState.tfpiActive && (
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            backgroundColor: '#DC262640',
            border: '2px solid #DC2626',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            color: '#DC2626',
            zIndex: 10,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          TFPI ACTIVE
          <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2 }}>
            Factory Shut Down
          </div>
        </div>
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
          <PreplacedElementComponent
            key={element.id}
            element={element}
            tfpiActive={gameState.tfpiActive}
          />
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

      {/* Complex Assemblies (Activated Platelet only) */}
      {!config.isComingSoon && config.surface === 'activated-platelet' && (
        <>
          {/* Tenase Complex Assembly */}
          <div style={{ position: 'absolute', left: 30, top: 90, zIndex: 2 }}>
            <ComplexAssembly
              complexType="tenase"
              enzymeFactor={getComplexSlotFactor(complexSlots, 'tenase-enzyme')}
              cofactorFactor={getComplexSlotFactor(complexSlots, 'tenase-cofactor')}
              onEnzymeSlotClick={() => onComplexSlotClick('tenase-enzyme')}
              isLocked={gameState.phase !== 'propagation' && gameState.phase !== 'complete'}
            />
          </div>

          {/* Prothrombinase Complex Assembly */}
          <div style={{ position: 'absolute', left: 30, top: 210, zIndex: 2 }}>
            <ComplexAssembly
              complexType="prothrombinase"
              enzymeFactor={getComplexSlotFactor(complexSlots, 'prothrombinase-enzyme')}
              cofactorFactor={getComplexSlotFactor(complexSlots, 'prothrombinase-cofactor')}
              onEnzymeSlotClick={() => onComplexSlotClick('prothrombinase-enzyme')}
              isLocked={
                (gameState.phase !== 'propagation' && gameState.phase !== 'complete') ||
                !isTenaseComplete(gameState)
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
