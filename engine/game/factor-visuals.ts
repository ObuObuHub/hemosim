// engine/game/factor-visuals.ts
import type { FactorVisual, DockConfig } from '@/types/game';

/**
 * Detect if device is mobile based on screen width
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Get scale factor for mobile devices
 * Mobile tokens are 1.3x larger for easier touch interaction
 */
function getMobileScale(): number {
  return isMobileDevice() ? 1.3 : 1;
}

/**
 * Bio-accurate visual definitions for each factor
 * TEXTBOOK FIRST: Shapes match biochemical role
 * Automatically scales up 30% on mobile for better touch targets
 */
export const FACTOR_VISUALS: Record<string, FactorVisual> = {
  // Zymogens (inactive) → Enzymes (active)
  // TEXTBOOK COLORS - based on standard coagulation cascade diagrams
  // COLORS BASED ON REFERENCE IMAGE
  FVII: {
    factorId: 'FVII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#DC2626', // red (like reference - VIIa is red/orange)
    activeColor: '#EF4444',   // bright red when activated
    width: 55,
    height: 40,
  },
  FIX: {
    factorId: 'FIX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#7C3AED', // purple (like reference - IX is purple)
    activeColor: '#8B5CF6',   // bright purple when activated
    width: 60,
    height: 45,
  },
  FX: {
    factorId: 'FX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#DC2626', // red (like reference - X is red)
    activeColor: '#EF4444',   // bright red when activated (Xa)
    width: 60,
    height: 45,
  },
  FII: {
    factorId: 'FII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#EAB308', // YELLOW (like reference - II/Prothrombin is yellow)
    activeColor: '#991B1B',   // DARK RED (Thrombin/IIa - matches reference chart)
    width: 60,
    height: 45,
  },
  // Cofactors - larger shapes
  FV: {
    factorId: 'FV',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#2563EB', // BLUE (like reference - V is blue)
    activeColor: '#3B82F6',   // bright blue when activated
    width: 70,
    height: 50,
  },
  FVIII: {
    factorId: 'FVIII',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#22C55E', // GREEN (like reference - VIII is green)
    activeColor: '#4ADE80',   // bright green when activated
    width: 70,
    height: 50,
  },
  // FXI - activated by thrombin in Amplification phase
  FXI: {
    factorId: 'FXI',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#DB2777', // PINK/MAGENTA (like reference chart - XIa is magenta)
    activeColor: '#EC4899',   // bright pink when activated
    width: 55,
    height: 40,
  },
  // FXIII - Fibrin stabilizing factor, activated by thrombin
  FXIII: {
    factorId: 'FXIII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#22C55E', // GREEN (crosslinker)
    activeColor: '#16A34A',   // darker green when activated
    width: 55,
    height: 40,
  },
  // Fibrinogen/Fibrin
  Fibrinogen: {
    factorId: 'Fibrinogen',
    inactiveShape: 'fibrinogen',
    activeShape: 'fibrin',
    inactiveColor: '#EAB308', // yellow
    activeColor: '#22C55E',   // green (fibrin)
    width: 80,    // LARGER
    height: 35,
  },
};

/**
 * Get visual definition for a factor
 * Scales dimensions for mobile devices automatically
 */
export function getFactorVisual(factorId: string): FactorVisual | null {
  // Handle activated forms (FIXa, FXa, etc.)
  const baseId = factorId.replace(/a$/, '');
  const visual = FACTOR_VISUALS[baseId] ?? FACTOR_VISUALS[factorId] ?? null;

  if (!visual) return null;

  const scale = getMobileScale();
  if (scale === 1) return visual;

  // Scale dimensions for mobile
  return {
    ...visual,
    width: Math.round(visual.width * scale),
    height: Math.round(visual.height * scale),
  };
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
