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
 * COLORS MATCH REFERENCE IMAGE (propagation phase textbook figure)
 * Automatically scales up 30% on mobile for better touch targets
 */
export const FACTOR_VISUALS: Record<string, FactorVisual> = {
  // ═══════════════════════════════════════════════════════════════
  // TENASE COMPLEX COMPONENTS (from reference image)
  // ═══════════════════════════════════════════════════════════════

  // FIX/FIXa - CYAN (serine protease, enzyme of Tenase)
  FIX: {
    factorId: 'FIX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#67E8F9', // lighter cyan (zymogen)
    activeColor: '#22D3EE',   // CYAN - matches reference IXa
    width: 50,
    height: 50,
  },

  // FVIII/FVIIIa - PURPLE/MAGENTA (cofactor of Tenase)
  FVIII: {
    factorId: 'FVIII',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#C084FC', // lighter purple
    activeColor: '#A855F7',   // PURPLE - matches reference VIIIa
    width: 70,
    height: 55,
  },

  // ═══════════════════════════════════════════════════════════════
  // PROTHROMBINASE COMPLEX COMPONENTS (from reference image)
  // ═══════════════════════════════════════════════════════════════

  // FX/FXa - GREEN (substrate of Tenase, enzyme of Prothrombinase)
  FX: {
    factorId: 'FX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#86EFAC', // lighter green (zymogen)
    activeColor: '#22C55E',   // GREEN - matches reference X/Xa
    width: 50,
    height: 50,
  },

  // FV/FVa - ORANGE (cofactor of Prothrombinase)
  FV: {
    factorId: 'FV',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#FDBA74', // lighter orange
    activeColor: '#F97316',   // ORANGE - matches reference Va
    width: 70,
    height: 55,
  },

  // ═══════════════════════════════════════════════════════════════
  // THROMBIN (product of Prothrombinase)
  // ═══════════════════════════════════════════════════════════════

  // FII/FIIa - MAROON → RED (Prothrombin → Thrombin)
  FII: {
    factorId: 'FII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#9F1239', // MAROON - matches reference II
    activeColor: '#EF4444',   // RED - matches reference IIa (Thrombin)
    width: 55,
    height: 55,
  },

  // ═══════════════════════════════════════════════════════════════
  // OTHER FACTORS
  // ═══════════════════════════════════════════════════════════════

  // FVII/FVIIa - TEAL (Tissue Factor pathway)
  FVII: {
    factorId: 'FVII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#5EEAD4', // lighter teal
    activeColor: '#14B8A6',   // TEAL
    width: 50,
    height: 45,
  },

  // FXI/FXIa - PINK/MAGENTA (activated by thrombin in Amplification)
  FXI: {
    factorId: 'FXI',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#F9A8D4', // lighter pink
    activeColor: '#EC4899',   // PINK
    width: 55,
    height: 40,
  },

  // FXIII/FXIIIa - BLUE (Fibrin stabilizing factor)
  FXIII: {
    factorId: 'FXIII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#93C5FD', // lighter blue
    activeColor: '#3B82F6',   // BLUE
    width: 55,
    height: 40,
  },

  // Fibrinogen/Fibrin - GOLD → GREEN
  Fibrinogen: {
    factorId: 'Fibrinogen',
    inactiveShape: 'fibrinogen',
    activeShape: 'fibrin',
    inactiveColor: '#FCD34D', // gold
    activeColor: '#22C55E',   // green (fibrin)
    width: 80,
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
