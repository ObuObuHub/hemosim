// engine/game/factor-visuals.ts
import type { FactorVisual, DockConfig } from '@/types/game';

/**
 * Bio-accurate visual definitions for each factor
 * TEXTBOOK FIRST: Shapes match biochemical role
 */
export const FACTOR_VISUALS: Record<string, FactorVisual> = {
  // Zymogens (inactive) → Enzymes (active)
  FIX: {
    factorId: 'FIX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#22C55E', // green
    activeColor: '#3B82F6', // blue
    width: 50,
    height: 35,
  },
  FX: {
    factorId: 'FX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#14B8A6', // teal
    activeColor: '#3B82F6', // blue
    width: 50,
    height: 35,
  },
  FII: {
    factorId: 'FII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#3B82F6', // blue (prothrombin)
    activeColor: '#3B82F6', // blue (thrombin - glows)
    width: 50,
    height: 35,
  },
  // Cofactors
  FV: {
    factorId: 'FV',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#F97316', // orange (dimmer)
    activeColor: '#F97316', // orange
    width: 55,
    height: 30,
  },
  FVIII: {
    factorId: 'FVIII',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#A855F7', // purple (dimmer)
    activeColor: '#A855F7', // purple
    width: 55,
    height: 30,
  },
  // Fibrinogen/Fibrin
  Fibrinogen: {
    factorId: 'Fibrinogen',
    inactiveShape: 'fibrinogen',
    activeShape: 'fibrin',
    inactiveColor: '#EAB308', // yellow
    activeColor: '#22C55E', // green (fibrin)
    width: 60,
    height: 25,
  },
};

/**
 * Get visual definition for a factor
 */
export function getFactorVisual(factorId: string): FactorVisual | null {
  // Handle activated forms (FIXa, FXa, etc.)
  const baseId = factorId.replace(/a$/, '');
  return FACTOR_VISUALS[baseId] ?? FACTOR_VISUALS[factorId] ?? null;
}

/**
 * Check if a factor ID represents an activated form
 */
export function isActivatedFactor(factorId: string): boolean {
  return factorId.endsWith('a') && factorId !== 'Fibrinogena';
}

/**
 * Puzzle-dock configurations for enzyme-cofactor complexes
 * TEXTBOOK: Side-by-side docking, both flat on membrane
 */
export const DOCK_CONFIGS: DockConfig[] = [
  {
    enzymeFactorId: 'FXa',
    cofactorFactorId: 'FVa',
    dockOffset: { x: -15, y: 0 },
    snapDistance: 25,
  },
  {
    enzymeFactorId: 'FIXa',
    cofactorFactorId: 'FVIIIa',
    dockOffset: { x: -15, y: 0 },
    snapDistance: 25,
  },
];

/**
 * Get dock config for an enzyme-cofactor pair
 */
export function getDockConfig(
  enzymeFactorId: string,
  cofactorFactorId: string
): DockConfig | null {
  return (
    DOCK_CONFIGS.find(
      (c) =>
        c.enzymeFactorId === enzymeFactorId &&
        c.cofactorFactorId === cofactorFactorId
    ) ?? null
  );
}
