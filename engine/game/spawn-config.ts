// engine/game/spawn-config.ts
import type { GamePhase, InhibitorVulnerability } from '@/types/game';

// =============================================================================
// SPAWN CONFIGURATION BY PHASE
// =============================================================================

export interface PhaseSpawnConfig {
  factorIds: string[];
  spawnIntervalMs: number;
}

export const PHASE_SPAWN_CONFIG: Record<GamePhase, PhaseSpawnConfig> = {
  initiation: {
    // FX becomes FXa (catalyst), FII generates starter thrombin (30%) to unlock platelet
    factorIds: ['FX', 'FII'],
    spawnIntervalMs: 4000,
  },
  amplification: {
    // FV and FVIII are cofactors needed for complexes
    factorIds: ['FV', 'FVIII'],
    spawnIntervalMs: 3000,
  },
  propagation: {
    // Only FIXa needed - cofactors auto-fill, FXa-tenase produced by Tenase
    factorIds: ['FIXa'],
    spawnIntervalMs: 2500,
  },
  stabilization: {
    factorIds: ['Fibrinogen', 'FXIII'],
    spawnIntervalMs: 2000,
  },
  complete: {
    factorIds: [],
    spawnIntervalMs: 0,
  },
} as const;

// =============================================================================
// FACTOR VULNERABILITY MAPPING
// =============================================================================

export const FACTOR_VULNERABILITIES: Record<string, InhibitorVulnerability[]> = {
  // Initiation
  FX: [],
  FII: ['antithrombin'], // prothrombin - targeted by antithrombin

  // Amplification
  FV: ['apc'], // procofactor - targeted by APC
  FVIII: ['apc'], // procofactor - targeted by APC

  // Propagation
  FIXa: ['antithrombin'],

  // Stabilization
  Fibrinogen: ['plasmin'],
  FXIII: [],
} as const;

// =============================================================================
// FLOATING FACTOR VELOCITY CONFIG
// =============================================================================

export const FLOATING_VELOCITY = {
  /** Base horizontal velocity in pixels per second */
  baseVelocityX: 80,
  /** Velocity variation range (+/-) for visual interest */
  variationX: 10,
  /** Vertical velocity (0 for horizontal-only movement) */
  velocityY: 0,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get spawn configuration for the current game phase
 */
export function getSpawnConfigForPhase(phase: GamePhase): PhaseSpawnConfig {
  return PHASE_SPAWN_CONFIG[phase];
}

/**
 * Get vulnerability list for a factor
 */
export function getFactorVulnerabilities(factorId: string): InhibitorVulnerability[] {
  return FACTOR_VULNERABILITIES[factorId] ?? [];
}

/**
 * Generate a random velocity for a floating factor
 */
export function generateFloatingVelocity(): { x: number; y: number } {
  const variation = (Math.random() - 0.5) * 2 * FLOATING_VELOCITY.variationX;
  return {
    x: FLOATING_VELOCITY.baseVelocityX + variation,
    y: FLOATING_VELOCITY.velocityY,
  };
}
