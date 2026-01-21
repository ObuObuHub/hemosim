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
    // FX generates local FXa (stays on TF-cell, triggers TFPI after 3)
    // FIX generates FIXa "Messenger" (travels to platelet)
    // FII generates Spark Thrombin (fills Platelet Activation meter)
    factorIds: ['FX', 'FIX', 'FII'],
    spawnIntervalMs: 3500,
  },
  amplification: {
    // FV and FVIII are cofactors activated by Spark Thrombin
    // FXI is reinforcement (generates local FIXa)
    factorIds: ['FV', 'FVIII', 'FXI'],
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
  // Initiation - zymogens are NOT vulnerable to Antithrombin
  FX: [], // zymogen
  FIX: [], // zymogen
  FII: [], // zymogen (prothrombin)

  // Amplification
  FV: ['apc'], // procofactor - targeted by APC
  FVIII: ['apc'], // procofactor - targeted by APC
  FXI: [], // zymogen until activated

  // Propagation (activated enzymes ARE vulnerable)
  FIXa: ['antithrombin'], // serine protease - AT target

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
