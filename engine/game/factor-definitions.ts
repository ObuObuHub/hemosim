// engine/game/factor-definitions.ts
import type { FactorDefinition, PreplacedElement, Surface } from '@/types/game';

// =============================================================================
// FACTOR DEFINITIONS (v1: Initiation + Amplification)
// =============================================================================

export const FACTOR_DEFINITIONS: Record<string, FactorDefinition> = {
  FX: {
    id: 'FX',
    inactiveLabel: 'FX',
    activeLabel: 'FXa',
    category: 'zymogen',
    targetSurface: 'tf-cell',
    activationMessage: 'FXa generated on TF-cell surface (TF+VIIa catalyzes)',
    errorMessageWrongSlot: 'FX must be placed on TF-bearing cell where TF+VIIa can activate it.',
    prerequisites: [],
    thrombinContribution: 5,
    color: '#3B82F6', // blue
  },
  FII: {
    id: 'FII',
    inactiveLabel: 'FII',
    activeLabel: 'THR',
    category: 'zymogen',
    targetSurface: 'tf-cell',
    activationMessage: 'Starter thrombin generated on TF-cell (FXa + Va required)',
    errorMessageWrongSlot: 'FII must be placed on TF-bearing cell where FXa + Va can generate thrombin.',
    prerequisites: ['FX'], // FXa must be present
    thrombinContribution: 25,
    color: '#EF4444', // red
  },
  FV: {
    id: 'FV',
    inactiveLabel: 'FV',
    activeLabel: 'FVa',
    category: 'procofactor',
    targetSurface: 'platelet',
    activationMessage: 'FVa activated on platelet surface (thrombin cleaves)',
    errorMessageWrongSlot: 'FV must be placed on activated platelet surface.',
    prerequisites: [], // only needs platelet unlocked (thrombin threshold)
    thrombinContribution: 0,
    color: '#8B5CF6', // purple
  },
  FVIII: {
    id: 'FVIII',
    inactiveLabel: 'FVIII+vWF',
    activeLabel: 'FVIIIa',
    category: 'procofactor',
    targetSurface: 'platelet',
    activationMessage: 'FVIIIa activated, dissociates from vWF (thrombin cleaves)',
    errorMessageWrongSlot: 'FVIII must be placed on activated platelet surface.',
    prerequisites: [], // only needs platelet unlocked
    thrombinContribution: 0,
    color: '#EC4899', // pink
  },
} as const;

// =============================================================================
// PRE-PLACED ELEMENTS (always visible on TF-cell)
// =============================================================================

export const PREPLACED_ELEMENTS: PreplacedElement[] = [
  {
    id: 'tf-viia',
    label: 'TF+VIIa',
    tooltip: 'Tissue Factor + Factor VIIa complex. Initiates coagulation.',
    surface: 'tf-cell',
    isDim: false,
  },
  {
    id: 'va-trace',
    label: 'Va (trace)',
    tooltip: 'Trace cofactor activity enables starter thrombin generation.',
    surface: 'tf-cell',
    isDim: true,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getFactorDefinition(factorId: string): FactorDefinition | null {
  return FACTOR_DEFINITIONS[factorId] ?? null;
}

export function getAllFactorIds(): string[] {
  return Object.keys(FACTOR_DEFINITIONS);
}

export function getFactorsByTargetSurface(surface: Surface): FactorDefinition[] {
  return Object.values(FACTOR_DEFINITIONS).filter((f) => f.targetSurface === surface);
}
