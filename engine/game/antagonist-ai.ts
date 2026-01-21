// engine/game/antagonist-ai.ts
import type {
  Antagonist,
  AntagonistType,
  AntagonistState,
  FloatingFactor,
  GamePhase,
  InhibitorVulnerability,
} from '@/types/game';

// =============================================================================
// ANTAGONIST CONFIGURATION
// =============================================================================

export interface AntagonistConfig {
  type: AntagonistType;
  speed: number; // pixels per second
  targets: InhibitorVulnerability; // vulnerability type this antagonist hunts
  color: string;
  appearInPhases: GamePhase[];
  respawnDelayMs: number;
}

export const ANTAGONIST_CONFIGS: Record<AntagonistType, AntagonistConfig> = {
  antithrombin: {
    type: 'antithrombin',
    speed: 60, // slower hunting speed
    targets: 'antithrombin',
    color: '#EF4444', // red
    // Only appears from Amplification onward (FII is vulnerable to AT)
    // In Initiation, only FX spawns which is not yet activated (zymogen)
    appearInPhases: ['amplification', 'propagation', 'stabilization'],
    respawnDelayMs: 8000, // longer delay between spawns
  },
  apc: {
    type: 'apc',
    speed: 50, // slower hunting speed
    targets: 'apc',
    color: '#A855F7', // purple
    appearInPhases: ['amplification', 'propagation', 'stabilization'],
    respawnDelayMs: 10000, // longer delay between spawns
  },
  plasmin: {
    type: 'plasmin',
    speed: 110,
    targets: 'plasmin',
    color: '#22C55E', // green
    appearInPhases: ['stabilization'],
    respawnDelayMs: 4000,
  },
};

// =============================================================================
// CONSTANTS
// =============================================================================

/** Distance threshold for attacking a factor (pixels) */
const ATTACK_DISTANCE = 30;

/** Patrol speed multiplier (slower than hunting) */
const PATROL_SPEED_MULTIPLIER = 0.4;

/** Bloodstream zone boundaries */
const BLOODSTREAM_BOUNDS = {
  minX: -40,
  maxX: 1240,
  minY: 30,
  maxY: 90,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate distance between two points
 */
function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if an antagonist can target a factor based on vulnerability
 */
function canTarget(antagonist: Antagonist, factor: FloatingFactor): boolean {
  const config = ANTAGONIST_CONFIGS[antagonist.type];
  return factor.isVulnerableTo.includes(config.targets);
}

/**
 * Find the nearest vulnerable factor for an antagonist
 */
function findNearestVulnerableFactor(
  antagonist: Antagonist,
  floatingFactors: FloatingFactor[]
): FloatingFactor | null {
  let nearestFactor: FloatingFactor | null = null;
  let nearestDistance = Infinity;

  for (const factor of floatingFactors) {
    if (!canTarget(antagonist, factor)) {
      continue;
    }

    const dist = distance(antagonist.position, factor.position);
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearestFactor = factor;
    }
  }

  return nearestFactor;
}

/**
 * Move antagonist toward a target position
 */
function moveToward(
  position: { x: number; y: number },
  target: { x: number; y: number },
  speed: number,
  deltaTime: number
): { x: number; y: number } {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1) {
    return { ...position };
  }

  const moveDistance = speed * deltaTime;
  const ratio = Math.min(moveDistance / dist, 1);

  return {
    x: position.x + dx * ratio,
    y: position.y + dy * ratio,
  };
}

// =============================================================================
// AI TICK RESULT
// =============================================================================

export interface AntagonistTickResult {
  antagonist: Antagonist;
  destroyedFactorId: string | null;
}

// =============================================================================
// MAIN AI TICK FUNCTION
// =============================================================================

/**
 * Tick a single antagonist's AI logic
 *
 * @param antagonist - The antagonist to update
 * @param floatingFactors - All floating factors in the bloodstream
 * @param deltaTime - Time since last tick in seconds
 * @returns Updated antagonist state and any destroyed factor ID
 */
export function tickAntagonist(
  antagonist: Antagonist,
  floatingFactors: FloatingFactor[],
  deltaTime: number
): AntagonistTickResult {
  const updatedAntagonist: Antagonist = { ...antagonist };
  let destroyedFactorId: string | null = null;

  switch (antagonist.state) {
    case 'patrol': {
      // Move right slowly across the bloodstream
      const patrolSpeed = antagonist.speed * PATROL_SPEED_MULTIPLIER;
      const newX = updatedAntagonist.position.x + patrolSpeed * deltaTime;

      // Wrap around when reaching the right edge
      updatedAntagonist.position = {
        x: newX > BLOODSTREAM_BOUNDS.maxX ? BLOODSTREAM_BOUNDS.minX : newX,
        y: updatedAntagonist.position.y,
      };

      // Look for vulnerable factors
      const target = findNearestVulnerableFactor(updatedAntagonist, floatingFactors);
      if (target) {
        updatedAntagonist.targetFactorId = target.id;
        updatedAntagonist.state = 'hunting';
      }
      break;
    }

    case 'hunting': {
      // Find the target factor
      const target = floatingFactors.find(
        (f) => f.id === updatedAntagonist.targetFactorId
      );

      if (!target) {
        // Target no longer exists, return to patrol
        updatedAntagonist.state = 'patrol';
        updatedAntagonist.targetFactorId = null;
        break;
      }

      // Move toward target
      updatedAntagonist.position = moveToward(
        updatedAntagonist.position,
        target.position,
        updatedAntagonist.speed,
        deltaTime
      );

      // Check if within attack range
      if (distance(updatedAntagonist.position, target.position) < ATTACK_DISTANCE) {
        updatedAntagonist.state = 'attacking';
      }
      break;
    }

    case 'attacking': {
      // Destroy the target factor
      destroyedFactorId = updatedAntagonist.targetFactorId;

      // Return to patrol state
      updatedAntagonist.state = 'patrol';
      updatedAntagonist.targetFactorId = null;
      break;
    }
  }

  return {
    antagonist: updatedAntagonist,
    destroyedFactorId,
  };
}

/**
 * Tick all antagonists and return updated state
 *
 * @param antagonists - Array of all antagonists
 * @param floatingFactors - All floating factors in the bloodstream
 * @param deltaTime - Time since last tick in seconds
 * @returns Updated antagonists array and IDs of destroyed factors
 */
export function tickAllAntagonists(
  antagonists: Antagonist[],
  floatingFactors: FloatingFactor[],
  deltaTime: number
): { antagonists: Antagonist[]; destroyedFactorIds: string[] } {
  const updatedAntagonists: Antagonist[] = [];
  const destroyedFactorIds: string[] = [];

  // Keep track of factors that have been claimed by other antagonists this tick
  let remainingFactors = [...floatingFactors];

  for (const antagonist of antagonists) {
    const result = tickAntagonist(antagonist, remainingFactors, deltaTime);
    updatedAntagonists.push(result.antagonist);

    if (result.destroyedFactorId) {
      destroyedFactorIds.push(result.destroyedFactorId);
      // Remove destroyed factor from remaining factors to prevent
      // multiple antagonists attacking the same factor
      remainingFactors = remainingFactors.filter(
        (f) => f.id !== result.destroyedFactorId
      );
    }
  }

  return {
    antagonists: updatedAntagonists,
    destroyedFactorIds,
  };
}

// =============================================================================
// SPAWNING HELPERS
// =============================================================================

/**
 * Check if an antagonist type should be active in the current phase
 */
export function shouldAntagonistBeActive(
  type: AntagonistType,
  phase: GamePhase
): boolean {
  const config = ANTAGONIST_CONFIGS[type];
  return config.appearInPhases.includes(phase);
}

/**
 * Create a new antagonist
 */
export function createAntagonist(
  type: AntagonistType,
  id: string
): Antagonist {
  const config = ANTAGONIST_CONFIGS[type];

  // Spawn at left edge of bloodstream with random Y
  const spawnY =
    BLOODSTREAM_BOUNDS.minY +
    Math.random() * (BLOODSTREAM_BOUNDS.maxY - BLOODSTREAM_BOUNDS.minY);

  return {
    id,
    type,
    position: { x: BLOODSTREAM_BOUNDS.minX, y: spawnY },
    targetFactorId: null,
    state: 'patrol' as AntagonistState,
    speed: config.speed,
  };
}

/**
 * Get all antagonist types that should be active in a given phase
 */
export function getActiveAntagonistTypes(phase: GamePhase): AntagonistType[] {
  return (Object.keys(ANTAGONIST_CONFIGS) as AntagonistType[]).filter((type) =>
    shouldAntagonistBeActive(type, phase)
  );
}
