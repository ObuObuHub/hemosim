'use strict';

// =============================================================================
// SHAPE DIMENSIONS
// =============================================================================

export const SHAPE_DIMENSIONS = {
  enzyme: { width: 60, height: 50, viewBox: '0 0 60 50' },
  cofactor: { width: 80, height: 35, viewBox: '0 0 80 35' },
  zymogen: { width: 55, height: 50, viewBox: '0 0 55 50' },
  mergedComplex: { width: 80, height: 70, viewBox: '0 0 80 70' },
} as const;

// =============================================================================
// SVG PATHS
// =============================================================================

/**
 * Enzyme (Pac-Man): Globular with active site cleft (wedge cut out)
 * The "mouth" faces right, convex bottom bulge for cofactor fitting
 */
export const ENZYME_PATH = `
  M 30 5
  C 45 5, 55 15, 55 25
  L 45 25
  L 30 35
  L 45 25
  L 55 25
  C 55 35, 50 45, 35 48
  C 30 49, 25 49, 20 48
  C 5 45, 0 35, 0 25
  C 0 10, 15 5, 30 5
  Z
`;

/**
 * Cofactor (Bean/Seat): Elongated with concave socket on top
 * The socket matches enzyme's bottom bulge
 */
export const COFACTOR_PATH = `
  M 5 20
  C 5 30, 15 35, 40 35
  C 65 35, 75 30, 75 20
  C 75 10, 65 5, 55 8
  C 45 3, 35 3, 25 8
  C 15 5, 5 10, 5 20
  Z
`;

/**
 * Zymogen (Blob): Smooth rounded shape, no active site
 * Dormant, inactive appearance
 */
export const ZYMOGEN_PATH = `
  M 27.5 5
  C 45 5, 55 15, 52 30
  C 50 42, 40 48, 27.5 48
  C 15 48, 5 42, 3 30
  C 0 15, 10 5, 27.5 5
  Z
`;

/**
 * Merged Complex: Enzyme seated in cofactor
 * Single unified shape with active site facing outward
 */
export const MERGED_COMPLEX_PATH = `
  M 40 5
  C 55 5, 65 12, 65 22
  L 55 22
  L 40 30
  L 55 22
  L 65 22
  C 65 30, 60 38, 50 42
  L 50 45
  C 50 55, 60 60, 75 60
  C 78 65, 75 70, 40 70
  C 5 70, 2 65, 5 60
  C 20 60, 30 55, 30 45
  L 30 42
  C 20 38, 15 30, 15 22
  C 15 10, 25 5, 40 5
  Z
`;

// =============================================================================
// FACTOR TO SHAPE MAPPING
// =============================================================================

export type ShapeType = 'enzyme' | 'cofactor' | 'zymogen' | 'procofactor';

/**
 * Maps factor IDs to their shape types based on biochemical role
 */
export const FACTOR_SHAPE_MAP: Record<string, { inactive: ShapeType; active: ShapeType }> = {
  // Zymogens that become enzymes
  'FVII': { inactive: 'zymogen', active: 'enzyme' },
  'FIX': { inactive: 'zymogen', active: 'enzyme' },
  'FX': { inactive: 'zymogen', active: 'enzyme' },
  'FII': { inactive: 'zymogen', active: 'enzyme' },
  'FXI': { inactive: 'zymogen', active: 'enzyme' },

  // Procofactors that become cofactors
  'FV': { inactive: 'procofactor', active: 'cofactor' },
  'FVIII': { inactive: 'procofactor', active: 'cofactor' },
};

/**
 * Get the shape type for a factor based on its activation state
 */
export function getShapeType(factorId: string, isActive: boolean): ShapeType {
  const mapping = FACTOR_SHAPE_MAP[factorId];
  if (!mapping) {
    // Default to zymogen for unknown factors
    return 'zymogen';
  }
  return isActive ? mapping.active : mapping.inactive;
}
