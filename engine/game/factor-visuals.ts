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
  // Vitamin K-dependent factors (II, VII, IX, X) have Gla domains for membrane binding
  // TEXTBOOK STANDARD COLORS (based on Hoffman-Monroe cell-based model diagrams)
  // Vitamin K-dependent factors (II, VII, IX, X) have Gla domains for membrane binding
  FVII: {
    factorId: 'FVII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#1D4ED8', // Blue (zymogen in plasma)
    activeColor: '#DC2626',   // Red when activated (TF-VIIa complex)
    width: 55,
    height: 40,
    hasGlaDomain: true,
  },
  FIX: {
    factorId: 'FIX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#0891B2', // Cyan (matches reference: FIXa is light blue/cyan)
    activeColor: '#06B6D4',   // Bright cyan when activated
    width: 60,
    height: 45,
    hasGlaDomain: true,
  },
  FX: {
    factorId: 'FX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#15803D', // Green (matches reference: FX/Xa is green)
    activeColor: '#22C55E',   // Bright green when activated (Xa)
    width: 60,
    height: 45,
    hasGlaDomain: true,
  },
  FII: {
    factorId: 'FII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#7C2D12', // Maroon (prothrombin - matches reference)
    activeColor: '#DC2626',   // Bright red (Thrombin/IIa - matches reference)
    width: 60,
    height: 45,
    hasGlaDomain: true, // Prothrombin has Gla domain for membrane binding
  },
  // Thrombin (FIIa) - cleaved from prothrombin, loses Gla domain
  FIIa: {
    factorId: 'FIIa',
    inactiveShape: 'enzyme',
    activeShape: 'enzyme',
    inactiveColor: '#DC2626',
    activeColor: '#DC2626',   // Bright red (Thrombin)
    width: 60,
    height: 45,
    hasGlaDomain: false, // Thrombin loses Gla domain when cleaved from prothrombin
  },
  // Cofactors - larger shapes (non-enzymatic, accelerate reactions)
  FV: {
    factorId: 'FV',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#C2410C', // Orange-brown (inactive in plasma)
    activeColor: '#F97316',   // ORANGE when activated (FVa - matches reference: Va is orange)
    width: 70,
    height: 50,
  },
  FVIII: {
    factorId: 'FVIII',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#22C55E', // Green (bound to vWF in plasma)
    activeColor: '#A855F7',   // PURPLE when activated (FVIIIa - matches reference: VIIIa is purple/magenta)
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
  // Check exact factorId first (e.g., FIIa has its own entry without Gla domain)
  // Then fall back to base form (e.g., FIXa uses FIX's definition)
  const baseId = factorId.replace(/a$/, '');
  const visual = FACTOR_VISUALS[factorId] ?? FACTOR_VISUALS[baseId] ?? null;

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
