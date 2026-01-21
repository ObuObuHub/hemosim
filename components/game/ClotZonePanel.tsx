// components/game/ClotZonePanel.tsx
'use client';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import type { Slot } from '@/types/game';
import type { PanelConfig } from '@/engine/game/game-config';
import { COLORS, SLOT_POSITIONS } from '@/engine/game/game-config';
import { getFactorDefinition } from '@/engine/game/factor-definitions';
import { getValidSlotsForFactor } from '@/engine/game/validation-rules';
import { FactorToken } from './FactorToken';
import { MembraneBackground } from './MembraneBackground';
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
  color: string;
  onComplete: () => void;
}

function CalciumSparkles({ color: _color, onComplete }: CalciumSparklesProps): React.ReactElement {
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

// Line type for mesh visualization
interface MeshLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  key: string;
  isPlaceholder?: boolean;
  isCrossLink?: boolean;
}

// Generate mesh lines between fibrin slots
function generateMeshLines(
  fibrinSlots: Slot[],
  fxiiiSlot: Slot | undefined,
  isCrossLinked: boolean
): MeshLine[] {
  const lines: MeshLine[] = [];
  const placedFibrinSlots = fibrinSlots.filter(
    (s) => s.placedFactorId === 'Fibrinogen' && s.isActive
  );

  // Show placeholder lines (dotted) between all fibrin slot positions
  // to hint at where the mesh will form
  for (let i = 0; i < fibrinSlots.length; i++) {
    for (let j = i + 1; j < fibrinSlots.length; j++) {
      const pos1 = getSlotCenter(fibrinSlots[i].id);
      const pos2 = getSlotCenter(fibrinSlots[j].id);
      if (pos1 && pos2) {
        const isPlaced1 = fibrinSlots[i].placedFactorId === 'Fibrinogen';
        const isPlaced2 = fibrinSlots[j].placedFactorId === 'Fibrinogen';

        lines.push({
          x1: pos1.x,
          y1: pos1.y,
          x2: pos2.x,
          y2: pos2.y,
          key: `${fibrinSlots[i].id}-${fibrinSlots[j].id}`,
          isPlaceholder: !isPlaced1 || !isPlaced2,
        });
      }
    }
  }

  // Add cross-link lines from FXIII to each fibrin when FXIII is placed
  if (isCrossLinked && fxiiiSlot) {
    const fxiiiPos = getSlotCenter(fxiiiSlot.id);
    if (fxiiiPos) {
      for (const fibrinSlot of placedFibrinSlots) {
        const fibrinPos = getSlotCenter(fibrinSlot.id);
        if (fibrinPos) {
          lines.push({
            x1: fxiiiPos.x,
            y1: fxiiiPos.y,
            x2: fibrinPos.x,
            y2: fibrinPos.y,
            key: `crosslink-${fibrinSlot.id}`,
            isCrossLink: true,
          });
        }
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
        zIndex: 2,
        overflow: 'visible',
      }}
    >
      {/* Ghost outline for empty slots */}
      {!placedFactor && !slot.isLocked && (
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
      {showSparkles && <CalciumSparkles color={factorColor} onComplete={handleSparklesComplete} />}

      {placedFactor ? (
        <div className={showDockingEffects ? 'factor-docking' : 'factor-placed'}>
          <FactorToken factor={placedFactor} isActive={slot.isActive} />
        </div>
      ) : null}
    </div>
  );
}

// =============================================================================
// FIBRIN MESH SVG
// =============================================================================

interface FibrinMeshProps {
  lines: MeshLine[];
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
      {/* Render placeholder lines first (underneath) */}
      {lines.filter(l => l.isPlaceholder).map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={COLORS.textDim}
          strokeWidth={1}
          strokeLinecap="round"
          strokeDasharray="4 4"
          opacity={0.3}
        />
      ))}

      {/* Render solid fibrin lines */}
      {lines.filter(l => !l.isPlaceholder && !l.isCrossLink).map((line) => (
        <line
          key={line.key}
          className={isCrossLinked ? 'fibrin-crosslinked' : 'fibrin-line'}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={isCrossLinked ? COLORS.fibrinStrandCrossLinked : '#F97316'}
          strokeWidth={isCrossLinked ? 5 : 3}
          strokeLinecap="round"
          style={{
            filter: isCrossLinked
              ? 'drop-shadow(0 0 8px rgba(251,191,36,0.8))'
              : 'drop-shadow(0 0 4px rgba(249,115,22,0.5))',
          }}
        />
      ))}

      {/* Render cross-link lines from FXIII to fibrins */}
      {lines.filter(l => l.isCrossLink).map((line) => (
        <line
          key={line.key}
          className="fibrin-crosslinked"
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={COLORS.fibrinStrandCrossLinked}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="8 4"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))',
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
    () => generateMeshLines(fibrinSlots, fxiiiSlot, isCrossLinked),
    [fibrinSlots, fxiiiSlot, isCrossLinked]
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
        overflow: 'hidden',
      }}
    >
      {/* Membrane Background - fibrin mesh texture */}
      <MembraneBackground
        surfaceType="clot-zone"
        width={config.width}
        height={config.height}
      />

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
            zIndex: 2,
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
            zIndex: 3,
          }}
        >
          CROSS-LINKED
        </div>
      )}
    </div>
  );
}
