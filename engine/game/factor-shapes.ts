/**
 * Visual mappings for coagulation factors in the game.
 *
 * Maps factor IDs to their visual representation (shape, color) and
 * provides factory functions for creating GameFactor instances.
 */

import type { ShapeType, GameFactor } from '../../types/game';

// =============================================================================
// SHAPE PATH DATA
// =============================================================================

/**
 * Shape path definitions using relative grid coordinates.
 * Each shape is defined as an array of [x, y] coordinate pairs.
 * Coordinates are in grid units (multiply by cell size for pixels).
 */
export const SHAPE_PATHS: Record<ShapeType, readonly (readonly [number, number])[]> = {
  /** L-shape: vertical bar with horizontal extension at bottom */
  L: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
  ] as const,

  /** T-shape: horizontal bar with vertical extension from center */
  T: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ] as const,

  /** Square: 2x2 block */
  square: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const,

  /** Line: 4 cells in a row (horizontal) */
  line: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ] as const,

  /** Zigzag (S-shape): two offset horizontal pairs */
  zigzag: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ] as const,
} as const;

// =============================================================================
// COLOR CONSTANTS
// =============================================================================

/**
 * Pathway colors matching CSS variables from globals.css
 */
export const PATHWAY_COLORS = {
  intrinsic: '#3b82f6',    // Blue - for F9a, F8a (Tenase complex)
  common: '#10b981',       // Teal/green - for F10a, F5a (Prothrombinase complex)
  anticoagulant: '#6b7280', // Gray - for AT, APC, TFPI (antagonists)
} as const;

// =============================================================================
// FACTOR CONFIGURATION
// =============================================================================

/** Role a factor plays in complex assembly */
export type FactorRole = 'enzyme' | 'cofactor' | 'antagonist';

/** Configuration for a single factor's visual representation */
export interface FactorConfig {
  /** Display name (e.g., 'IXa', 'VIIIa') */
  shortName: string;
  /** Tetris-like shape type */
  shape: ShapeType;
  /** Hex color for rendering */
  color: string;
  /** Role in complex assembly */
  role: FactorRole;
  /** Which complex this factor belongs to (if applicable) */
  complex?: 'tenase' | 'prothrombinase';
}

/**
 * Visual configuration for each factor in the game.
 * Maps factor IDs to their visual properties.
 */
export const FACTOR_CONFIG: Record<string, FactorConfig> = {
  // ═══════════════════════════════════════════════════════════════
  // TENASE COMPLEX (Intrinsic pathway - blue)
  // ═══════════════════════════════════════════════════════════════

  F9a: {
    shortName: 'IXa',
    shape: 'L',
    color: PATHWAY_COLORS.intrinsic,
    role: 'enzyme',
    complex: 'tenase',
  },

  F8a: {
    shortName: 'VIIIa',
    shape: 'T',
    color: PATHWAY_COLORS.intrinsic,
    role: 'cofactor',
    complex: 'tenase',
  },

  // ═══════════════════════════════════════════════════════════════
  // PROTHROMBINASE COMPLEX (Common pathway - teal/green)
  // ═══════════════════════════════════════════════════════════════

  F10a: {
    shortName: 'Xa',
    shape: 'line',
    color: PATHWAY_COLORS.common,
    role: 'enzyme',
    complex: 'prothrombinase',
  },

  F5a: {
    shortName: 'Va',
    shape: 'square',
    color: PATHWAY_COLORS.common,
    role: 'cofactor',
    complex: 'prothrombinase',
  },

  // ═══════════════════════════════════════════════════════════════
  // ANTAGONIST FACTORS (Anticoagulant - gray)
  // ═══════════════════════════════════════════════════════════════

  AT: {
    shortName: 'AT',
    shape: 'zigzag',
    color: PATHWAY_COLORS.anticoagulant,
    role: 'antagonist',
  },

  APC: {
    shortName: 'APC',
    shape: 'zigzag',
    color: PATHWAY_COLORS.anticoagulant,
    role: 'antagonist',
  },

  TFPI: {
    shortName: 'TFPI',
    shape: 'zigzag',
    color: PATHWAY_COLORS.anticoagulant,
    role: 'antagonist',
  },
} as const;

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/** Counter for generating unique factor instance IDs */
let factorIdCounter = 0;

/**
 * Resets the factor ID counter.
 * Useful for testing or when starting a new game session.
 */
export function resetFactorIdCounter(): void {
  factorIdCounter = 0;
}

/**
 * Creates a new GameFactor instance from a factor ID.
 *
 * @param factorId - The factor type (e.g., 'F9a', 'F8a', 'F10a', 'F5a')
 * @param spawnPosition - Initial position on the canvas
 * @param initialVelocity - Optional initial velocity (defaults to zero)
 * @returns A new GameFactor instance ready for the game
 * @throws Error if factorId is not found in FACTOR_CONFIG
 */
export function createGameFactor(
  factorId: string,
  spawnPosition: { x: number; y: number },
  initialVelocity?: { x: number; y: number }
): GameFactor {
  const config = FACTOR_CONFIG[factorId];

  if (!config) {
    throw new Error(`Unknown factor ID: ${factorId}. Valid IDs: ${Object.keys(FACTOR_CONFIG).join(', ')}`);
  }

  factorIdCounter += 1;

  return {
    id: `${factorId}_${factorIdCounter}`,
    factorId,
    shortName: config.shortName,
    shape: config.shape,
    color: config.color,
    position: { ...spawnPosition },
    velocity: initialVelocity ? { ...initialVelocity } : { x: 0, y: 0 },
    state: 'floating',
  };
}

/**
 * Gets the shape path coordinates for a given shape type.
 *
 * @param shape - The shape type
 * @returns Array of [x, y] coordinate pairs
 */
export function getShapePath(shape: ShapeType): readonly (readonly [number, number])[] {
  return SHAPE_PATHS[shape];
}

/**
 * Gets the configuration for a factor by ID.
 *
 * @param factorId - The factor ID
 * @returns The factor config or undefined if not found
 */
export function getFactorConfig(factorId: string): FactorConfig | undefined {
  return FACTOR_CONFIG[factorId];
}

/**
 * Gets all factor IDs that match a specific role.
 *
 * @param role - The role to filter by
 * @returns Array of factor IDs with that role
 */
export function getFactorsByRole(role: FactorRole): string[] {
  return Object.entries(FACTOR_CONFIG)
    .filter(([, config]) => config.role === role)
    .map(([id]) => id);
}

/**
 * Gets all factor IDs that belong to a specific complex.
 *
 * @param complexType - 'tenase' or 'prothrombinase'
 * @returns Array of factor IDs for that complex
 */
export function getFactorsForComplex(complexType: 'tenase' | 'prothrombinase'): string[] {
  return Object.entries(FACTOR_CONFIG)
    .filter(([, config]) => config.complex === complexType)
    .map(([id]) => id);
}

/**
 * Checks if a factor is an antagonist (AT, APC, TFPI).
 *
 * @param factorId - The factor ID to check
 * @returns true if the factor is an antagonist
 */
export function isAntagonist(factorId: string): boolean {
  const config = FACTOR_CONFIG[factorId];
  return config?.role === 'antagonist';
}
