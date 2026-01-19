# Cell-Based Coagulation Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace arcade-style catch game with didactic surface-based factor placement game teaching the cell-based model of hemostasis.

**Architecture:** Three-panel layout (TF-cell, Platelet, Activated Platelet) with click-to-select/place interaction. Thrombin meter drives phase transitions. State managed via useReducer.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS (no external UI libraries)

**Design Document:** `docs/plans/2026-01-19-cell-based-coagulation-game-design.md`

---

## Task 1: Rewrite Types

**Files:**
- Rewrite: `types/game.ts`

**Step 1: Replace types/game.ts with new type definitions**

```typescript
// types/game.ts
'use strict';

// =============================================================================
// SURFACE & CATEGORY TYPES
// =============================================================================

export type Surface = 'tf-cell' | 'platelet' | 'activated-platelet';

export type FactorCategory = 'zymogen' | 'procofactor' | 'enzyme' | 'cofactor';

// =============================================================================
// FACTOR DEFINITION
// =============================================================================

export interface FactorDefinition {
  id: string;
  inactiveLabel: string;
  activeLabel: string;
  category: FactorCategory;
  targetSurface: Surface;
  activationMessage: string;
  errorMessageWrongSlot: string;
  prerequisites: string[]; // factor IDs that must be placed/active first
  thrombinContribution: number; // how much this adds to thrombin meter (0-100)
  color: string;
}

// =============================================================================
// SLOT
// =============================================================================

export interface Slot {
  id: string;
  surface: Surface;
  acceptsFactorId: string;
  isLocked: boolean;
  placedFactorId: string | null;
  isActive: boolean; // has factor been converted to active form
}

// =============================================================================
// PRE-PLACED ELEMENT (TF+VIIa, trace Va)
// =============================================================================

export interface PreplacedElement {
  id: string;
  label: string;
  tooltip: string;
  surface: Surface;
  isDim: boolean; // trace Va is dim, TF+VIIa is bright
}

// =============================================================================
// GAME PHASE
// =============================================================================

export type GamePhase = 'initiation' | 'amplification' | 'complete';

// =============================================================================
// GAME STATE
// =============================================================================

export interface GameState {
  phase: GamePhase;
  thrombinMeter: number; // 0-100, threshold at 30
  slots: Slot[];
  availableFactors: string[]; // factor IDs still in palette
  selectedFactorId: string | null;
  currentMessage: string;
  isError: boolean; // for error vs success message styling
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

export type GameAction =
  | { type: 'SELECT_FACTOR'; factorId: string }
  | { type: 'DESELECT_FACTOR' }
  | { type: 'ATTEMPT_PLACE'; slotId: string }
  | { type: 'RESET_GAME' };

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit 2>&1 | head -20`

Expected: May show errors in other files (they reference old types). That's OK - we'll fix them.

**Step 3: Commit**

```bash
git add types/game.ts
git commit -m "refactor(types): rewrite game types for cell-based model

- Replace arcade types with didactic game types
- Add Surface, FactorCategory, FactorDefinition types
- Add Slot, PreplacedElement, GamePhase types
- Add GameState, GameAction, ValidationResult types"
```

---

## Task 2: Create Factor Definitions

**Files:**
- Create: `engine/game/factor-definitions.ts`

**Step 1: Create factor definitions file**

```typescript
// engine/game/factor-definitions.ts
import type { FactorDefinition, PreplacedElement } from '@/types/game';

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

export function getFactorsByTargetSurface(surface: string): FactorDefinition[] {
  return Object.values(FACTOR_DEFINITIONS).filter((f) => f.targetSurface === surface);
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit engine/game/factor-definitions.ts 2>&1 | head -10`

Expected: Should compile without errors (types are now correct).

**Step 3: Commit**

```bash
git add engine/game/factor-definitions.ts
git commit -m "feat(engine): add factor definitions for cell-based model

- Define FX, FII, FV, FVIII with activation messages
- Add pre-placed elements (TF+VIIa, trace Va)
- Include thrombin contribution values
- Add helper functions for factor lookup"
```

---

## Task 3: Create Validation Rules

**Files:**
- Create: `engine/game/validation-rules.ts`

**Step 1: Create validation rules file**

```typescript
// engine/game/validation-rules.ts
import type { GameState, Slot, ValidationResult } from '@/types/game';
import { FACTOR_DEFINITIONS, getFactorDefinition } from './factor-definitions';

// =============================================================================
// THROMBIN THRESHOLD
// =============================================================================

export const THROMBIN_STARTER_THRESHOLD = 30;

// =============================================================================
// VALIDATION MESSAGES
// =============================================================================

const MESSAGES = {
  PANEL_LOCKED: 'Platelet not yet activated. Need starter thrombin (≥30%).',
  SLOT_OCCUPIED: 'This slot already has a factor placed.',
  WRONG_FACTOR_FOR_SLOT: (factorId: string) =>
    `${factorId} cannot bind to this slot. Check which surface accepts it.`,
  PREREQUISITE_MISSING: (factorId: string, prereqId: string) =>
    `${factorId} requires ${prereqId}a present. Place ${prereqId} first.`,
} as const;

// =============================================================================
// CORE VALIDATION FUNCTION
// =============================================================================

export function validatePlacement(
  state: GameState,
  factorId: string,
  slotId: string
): ValidationResult {
  const factor = getFactorDefinition(factorId);
  if (!factor) {
    return { isValid: false, errorMessage: `Unknown factor: ${factorId}` };
  }

  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot) {
    return { isValid: false, errorMessage: `Unknown slot: ${slotId}` };
  }

  // Check if slot is locked (platelet surface before thrombin threshold)
  if (slot.isLocked) {
    return { isValid: false, errorMessage: MESSAGES.PANEL_LOCKED };
  }

  // Check if slot already occupied
  if (slot.placedFactorId !== null) {
    return { isValid: false, errorMessage: MESSAGES.SLOT_OCCUPIED };
  }

  // Check if factor matches slot
  if (slot.acceptsFactorId !== factorId) {
    return { isValid: false, errorMessage: MESSAGES.WRONG_FACTOR_FOR_SLOT(factorId) };
  }

  // Check prerequisites (e.g., FII requires FX to be placed first)
  for (const prereqId of factor.prerequisites) {
    const prereqPlaced = state.slots.some(
      (s) => s.placedFactorId === prereqId && s.isActive
    );
    if (!prereqPlaced) {
      return {
        isValid: false,
        errorMessage: MESSAGES.PREREQUISITE_MISSING(factorId, prereqId),
      };
    }
  }

  return { isValid: true, errorMessage: null };
}

// =============================================================================
// HELPER: CHECK IF PLATELET SHOULD UNLOCK
// =============================================================================

export function shouldUnlockPlatelet(thrombinMeter: number): boolean {
  return thrombinMeter >= THROMBIN_STARTER_THRESHOLD;
}

// =============================================================================
// HELPER: CHECK VICTORY CONDITION
// =============================================================================

export function checkVictoryCondition(state: GameState): boolean {
  // Victory when:
  // 1. Thrombin meter >= 30%
  // 2. FVa placed on Platelet
  // 3. FVIIIa placed on Platelet

  if (state.thrombinMeter < THROMBIN_STARTER_THRESHOLD) {
    return false;
  }

  const fvPlaced = state.slots.some(
    (s) => s.placedFactorId === 'FV' && s.isActive
  );
  const fviiiPlaced = state.slots.some(
    (s) => s.placedFactorId === 'FVIII' && s.isActive
  );

  return fvPlaced && fviiiPlaced;
}

// =============================================================================
// HELPER: GET VALID SLOTS FOR FACTOR
// =============================================================================

export function getValidSlotsForFactor(state: GameState, factorId: string): string[] {
  const factor = getFactorDefinition(factorId);
  if (!factor) return [];

  return state.slots
    .filter((slot) => {
      // Must accept this factor
      if (slot.acceptsFactorId !== factorId) return false;
      // Must not be locked
      if (slot.isLocked) return false;
      // Must not be occupied
      if (slot.placedFactorId !== null) return false;
      // Prerequisites must be met
      for (const prereqId of factor.prerequisites) {
        const prereqPlaced = state.slots.some(
          (s) => s.placedFactorId === prereqId && s.isActive
        );
        if (!prereqPlaced) return false;
      }
      return true;
    })
    .map((s) => s.id);
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit engine/game/validation-rules.ts 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add engine/game/validation-rules.ts
git commit -m "feat(engine): add validation rules for factor placement

- Add validatePlacement() with prerequisite checking
- Add shouldUnlockPlatelet() threshold check
- Add checkVictoryCondition() for win state
- Add getValidSlotsForFactor() for UI hints"
```

---

## Task 4: Rewrite Game Config

**Files:**
- Rewrite: `engine/game/game-config.ts`

**Step 1: Replace game-config.ts with new configuration**

```typescript
// engine/game/game-config.ts
import type { Slot, Surface } from '@/types/game';

// =============================================================================
// CANVAS DIMENSIONS
// =============================================================================

export const GAME_CANVAS = {
  width: 1000,
  height: 700,
} as const;

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

export const LAYOUT = {
  // Header area (thrombin meter + message)
  header: {
    y: 0,
    height: 80,
  },
  // Surface panels area
  panels: {
    y: 80,
    height: 480,
  },
  // Factor palette area
  palette: {
    y: 560,
    height: 140,
  },
  // Panel widths (3 equal panels)
  panelWidth: Math.floor(GAME_CANVAS.width / 3),
} as const;

// =============================================================================
// SURFACE PANEL POSITIONS
// =============================================================================

export interface PanelConfig {
  surface: Surface;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lockedMessage: string | null;
  isComingSoon: boolean;
}

export const PANEL_CONFIGS: PanelConfig[] = [
  {
    surface: 'tf-cell',
    title: 'TF-BEARING CELL',
    subtitle: 'Initiation',
    x: 0,
    y: LAYOUT.panels.y,
    width: LAYOUT.panelWidth,
    height: LAYOUT.panels.height,
    lockedMessage: null, // always active
    isComingSoon: false,
  },
  {
    surface: 'platelet',
    title: 'PLATELET',
    subtitle: 'Amplification',
    x: LAYOUT.panelWidth,
    y: LAYOUT.panels.y,
    width: LAYOUT.panelWidth,
    height: LAYOUT.panels.height,
    lockedMessage: 'LOCKED: THR ≥ 30%',
    isComingSoon: false,
  },
  {
    surface: 'activated-platelet',
    title: 'ACTIVATED PLATELET',
    subtitle: 'Propagation',
    x: LAYOUT.panelWidth * 2,
    y: LAYOUT.panels.y,
    width: LAYOUT.panelWidth,
    height: LAYOUT.panels.height,
    lockedMessage: null,
    isComingSoon: true, // v2
  },
];

// =============================================================================
// INITIAL SLOTS
// =============================================================================

export function createInitialSlots(): Slot[] {
  return [
    // TF-cell slots (Initiation)
    {
      id: 'tf-cell-fx',
      surface: 'tf-cell',
      acceptsFactorId: 'FX',
      isLocked: false,
      placedFactorId: null,
      isActive: false,
    },
    {
      id: 'tf-cell-fii',
      surface: 'tf-cell',
      acceptsFactorId: 'FII',
      isLocked: false,
      placedFactorId: null,
      isActive: false,
    },
    // Platelet slots (Amplification) - locked until thrombin threshold
    {
      id: 'platelet-fv',
      surface: 'platelet',
      acceptsFactorId: 'FV',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
    },
    {
      id: 'platelet-fviii',
      surface: 'platelet',
      acceptsFactorId: 'FVIII',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
    },
  ];
}

// =============================================================================
// SLOT POSITIONS WITHIN PANELS
// =============================================================================

export interface SlotPosition {
  slotId: string;
  x: number; // relative to panel
  y: number; // relative to panel
  width: number;
  height: number;
}

export const SLOT_POSITIONS: Record<string, SlotPosition> = {
  'tf-cell-fx': { slotId: 'tf-cell-fx', x: 40, y: 200, width: 120, height: 80 },
  'tf-cell-fii': { slotId: 'tf-cell-fii', x: 180, y: 200, width: 120, height: 80 },
  'platelet-fv': { slotId: 'platelet-fv', x: 60, y: 180, width: 120, height: 80 },
  'platelet-fviii': { slotId: 'platelet-fviii', x: 60, y: 280, width: 140, height: 80 },
} as const;

// =============================================================================
// PREPLACED ELEMENT POSITIONS (TF+VIIa, trace Va on TF-cell)
// =============================================================================

export const PREPLACED_POSITIONS = {
  'tf-viia': { x: 40, y: 80, width: 120, height: 60 },
  'va-trace': { x: 180, y: 80, width: 100, height: 50 },
} as const;

// =============================================================================
// COLORS
// =============================================================================

export const COLORS = {
  panelBackground: '#1E293B',
  panelBackgroundLocked: '#0F172A',
  panelBorder: '#334155',
  panelBorderActive: '#3B82F6',
  slotBackground: '#374151',
  slotBackgroundHover: '#4B5563',
  slotBorderValid: '#22C55E',
  slotBorderInvalid: '#EF4444',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDim: '#64748B',
  thrombinMeterFill: '#EF4444',
  thrombinMeterBackground: '#1E293B',
  successMessage: '#22C55E',
  errorMessage: '#EF4444',
} as const;

// =============================================================================
// ANIMATION TIMING
// =============================================================================

export const ANIMATION = {
  factorFlipDuration: 400, // ms
  slotPulseDuration: 1000, // ms
  messageFadeDuration: 300, // ms
} as const;
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit engine/game/game-config.ts 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add engine/game/game-config.ts
git commit -m "refactor(engine): rewrite game-config for cell-based model

- Add three-panel layout configuration
- Define slot positions within panels
- Add preplaced element positions
- Define color scheme and animation timing"
```

---

## Task 5: Rewrite useGameState Hook

**Files:**
- Rewrite: `hooks/useGameState.ts`

**Step 1: Replace useGameState.ts with new implementation**

```typescript
// hooks/useGameState.ts
'use client';

import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, Slot } from '@/types/game';
import { createInitialSlots } from '@/engine/game/game-config';
import { getAllFactorIds, getFactorDefinition } from '@/engine/game/factor-definitions';
import {
  validatePlacement,
  shouldUnlockPlatelet,
  checkVictoryCondition,
  THROMBIN_STARTER_THRESHOLD,
} from '@/engine/game/validation-rules';

// =============================================================================
// INITIAL STATE
// =============================================================================

function createInitialState(): GameState {
  return {
    phase: 'initiation',
    thrombinMeter: 0,
    slots: createInitialSlots(),
    availableFactors: getAllFactorIds(),
    selectedFactorId: null,
    currentMessage: 'Click a factor in the palette, then click a slot to place it.',
    isError: false,
  };
}

// =============================================================================
// REDUCER
// =============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_FACTOR': {
      // Toggle selection if clicking same factor
      if (state.selectedFactorId === action.factorId) {
        return {
          ...state,
          selectedFactorId: null,
          currentMessage: 'Click a factor in the palette, then click a slot to place it.',
          isError: false,
        };
      }

      // Can only select factors still in palette
      if (!state.availableFactors.includes(action.factorId)) {
        return state;
      }

      const factor = getFactorDefinition(action.factorId);
      return {
        ...state,
        selectedFactorId: action.factorId,
        currentMessage: `${factor?.inactiveLabel} selected. Click a valid slot to place.`,
        isError: false,
      };
    }

    case 'DESELECT_FACTOR': {
      return {
        ...state,
        selectedFactorId: null,
        currentMessage: 'Click a factor in the palette, then click a slot to place it.',
        isError: false,
      };
    }

    case 'ATTEMPT_PLACE': {
      // Must have a factor selected
      if (!state.selectedFactorId) {
        return {
          ...state,
          currentMessage: 'Select a factor first.',
          isError: true,
        };
      }

      const factorId = state.selectedFactorId;
      const validation = validatePlacement(state, factorId, action.slotId);

      if (!validation.isValid) {
        return {
          ...state,
          currentMessage: validation.errorMessage ?? 'Invalid placement.',
          isError: true,
        };
      }

      // Valid placement - update state
      const factor = getFactorDefinition(factorId)!;

      // Update slot with placed factor
      let newSlots: Slot[] = state.slots.map((slot) =>
        slot.id === action.slotId
          ? { ...slot, placedFactorId: factorId, isActive: true }
          : slot
      );

      // Calculate new thrombin meter
      const newThrombinMeter = Math.min(
        100,
        state.thrombinMeter + factor.thrombinContribution
      );

      // Check if platelet should unlock
      if (shouldUnlockPlatelet(newThrombinMeter) && !shouldUnlockPlatelet(state.thrombinMeter)) {
        // Just crossed threshold - unlock platelet slots
        newSlots = newSlots.map((slot) =>
          slot.surface === 'platelet' ? { ...slot, isLocked: false } : slot
        );
      }

      // Remove factor from available palette
      const newAvailableFactors = state.availableFactors.filter((f) => f !== factorId);

      // Determine message
      let newMessage = factor.activationMessage;
      let newPhase = state.phase;

      // Check if we just hit thrombin threshold
      if (shouldUnlockPlatelet(newThrombinMeter) && !shouldUnlockPlatelet(state.thrombinMeter)) {
        newMessage = 'Starter thrombin activates platelet via PAR receptors';
        newPhase = 'amplification';
      }

      // Build intermediate state to check victory
      const intermediateState: GameState = {
        ...state,
        phase: newPhase,
        thrombinMeter: newThrombinMeter,
        slots: newSlots,
        availableFactors: newAvailableFactors,
        selectedFactorId: null,
        currentMessage: newMessage,
        isError: false,
      };

      // Check victory condition
      if (checkVictoryCondition(intermediateState)) {
        return {
          ...intermediateState,
          phase: 'complete',
          currentMessage: 'Platelet primed. Cofactors positioned for propagation.',
        };
      }

      return intermediateState;
    }

    case 'RESET_GAME': {
      return createInitialState();
    }

    default:
      return state;
  }
}

// =============================================================================
// HOOK
// =============================================================================

export interface UseGameStateReturn {
  state: GameState;
  selectFactor: (factorId: string) => void;
  deselectFactor: () => void;
  attemptPlace: (slotId: string) => void;
  resetGame: () => void;
}

export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  const selectFactor = useCallback((factorId: string) => {
    dispatch({ type: 'SELECT_FACTOR', factorId });
  }, []);

  const deselectFactor = useCallback(() => {
    dispatch({ type: 'DESELECT_FACTOR' });
  }, []);

  const attemptPlace = useCallback((slotId: string) => {
    dispatch({ type: 'ATTEMPT_PLACE', slotId });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    selectFactor,
    deselectFactor,
    attemptPlace,
    resetGame,
  };
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit hooks/useGameState.ts 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add hooks/useGameState.ts
git commit -m "refactor(hooks): rewrite useGameState for cell-based model

- Implement SELECT_FACTOR, DESELECT_FACTOR, ATTEMPT_PLACE actions
- Add thrombin meter tracking and threshold unlocking
- Add victory condition checking
- Remove arcade mechanics (catch, dock, physics)"
```

---

## Task 6: Create FactorToken Component

**Files:**
- Create: `components/game/FactorToken.tsx`

**Step 1: Create FactorToken component**

```typescript
// components/game/FactorToken.tsx
'use client';

import type { FactorDefinition } from '@/types/game';
import { COLORS } from '@/engine/game/game-config';

interface FactorTokenProps {
  factor: FactorDefinition;
  isActive: boolean;
  isSelected?: boolean;
  isInPalette?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function FactorToken({
  factor,
  isActive,
  isSelected = false,
  isInPalette = false,
  onClick,
  style,
}: FactorTokenProps): React.ReactElement {
  const label = isActive ? factor.activeLabel : factor.inactiveLabel;
  const categoryLabel = factor.category === 'zymogen' ? 'zymogen' : 'procofactor';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        borderRadius: 8,
        backgroundColor: isActive ? factor.color : `${factor.color}40`,
        border: `3px solid ${isSelected ? '#FBBF24' : factor.color}`,
        boxShadow: isSelected ? `0 0 12px ${factor.color}` : 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        minWidth: 80,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: isActive ? '#FFFFFF' : COLORS.textPrimary,
        }}
      >
        {label}
      </span>
      {isInPalette && (
        <span
          style={{
            fontSize: 10,
            color: COLORS.textSecondary,
            marginTop: 2,
          }}
        >
          {categoryLabel}
        </span>
      )}
    </div>
  );
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit components/game/FactorToken.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add components/game/FactorToken.tsx
git commit -m "feat(components): add FactorToken component

- Display factor label (inactive/active form)
- Show category label in palette mode
- Support selected state with glow effect
- Use factor-specific colors"
```

---

## Task 7: Create SurfacePanel Component

**Files:**
- Create: `components/game/SurfacePanel.tsx`

**Step 1: Create SurfacePanel component**

```typescript
// components/game/SurfacePanel.tsx
'use client';

import type { Slot } from '@/types/game';
import type { PanelConfig } from '@/engine/game/game-config';
import { COLORS, SLOT_POSITIONS, PREPLACED_POSITIONS } from '@/engine/game/game-config';
import { PREPLACED_ELEMENTS, getFactorDefinition } from '@/engine/game/factor-definitions';
import { getValidSlotsForFactor } from '@/engine/game/validation-rules';
import { FactorToken } from './FactorToken';
import type { GameState } from '@/types/game';

interface SurfacePanelProps {
  config: PanelConfig;
  slots: Slot[];
  gameState: GameState;
  onSlotClick: (slotId: string) => void;
}

export function SurfacePanel({
  config,
  slots,
  gameState,
  onSlotClick,
}: SurfacePanelProps): React.ReactElement {
  const panelSlots = slots.filter((s) => s.surface === config.surface);
  const isLocked = panelSlots.some((s) => s.isLocked);
  const preplacedElements = PREPLACED_ELEMENTS.filter((e) => e.surface === config.surface);

  // Get valid slots for currently selected factor
  const validSlotIds = gameState.selectedFactorId
    ? getValidSlotsForFactor(gameState, gameState.selectedFactorId)
    : [];

  return (
    <div
      style={{
        position: 'absolute',
        left: config.x,
        top: config.y,
        width: config.width,
        height: config.height,
        backgroundColor: isLocked ? COLORS.panelBackgroundLocked : COLORS.panelBackground,
        borderRight: `1px solid ${COLORS.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
      }}
    >
      {/* Panel Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.textPrimary,
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        {config.title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS.textSecondary,
          marginBottom: 16,
        }}
      >
        {config.subtitle}
      </div>

      {/* Coming Soon overlay for v2 */}
      {config.isComingSoon && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.textDim,
            textAlign: 'center',
          }}
        >
          COMING IN v2
        </div>
      )}

      {/* Locked message */}
      {isLocked && !config.isComingSoon && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.textDim,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {config.lockedMessage}
        </div>
      )}

      {/* Pre-placed elements (TF+VIIa, trace Va) */}
      {!config.isComingSoon &&
        preplacedElements.map((element) => {
          const pos = PREPLACED_POSITIONS[element.id as keyof typeof PREPLACED_POSITIONS];
          if (!pos) return null;

          return (
            <div
              key={element.id}
              title={element.tooltip}
              style={{
                position: 'absolute',
                left: pos.x,
                top: config.y - LAYOUT_PANELS_Y + pos.y,
                width: pos.width,
                height: pos.height,
                backgroundColor: element.isDim ? `${COLORS.textDim}30` : '#F59E0B40',
                border: `2px solid ${element.isDim ? COLORS.textDim : '#F59E0B'}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: element.isDim ? COLORS.textDim : '#F59E0B',
                cursor: 'help',
              }}
            >
              {element.label}
            </div>
          );
        })}

      {/* Slots */}
      {!config.isComingSoon &&
        panelSlots.map((slot) => {
          const pos = SLOT_POSITIONS[slot.id];
          if (!pos) return null;

          const isValidTarget = validSlotIds.includes(slot.id);
          const placedFactor = slot.placedFactorId
            ? getFactorDefinition(slot.placedFactorId)
            : null;

          return (
            <div
              key={slot.id}
              onClick={() => !slot.isLocked && onSlotClick(slot.id)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: config.y - LAYOUT_PANELS_Y + pos.y,
                width: pos.width,
                height: pos.height,
                backgroundColor: slot.isLocked
                  ? `${COLORS.slotBackground}50`
                  : COLORS.slotBackground,
                border: `2px dashed ${
                  isValidTarget
                    ? COLORS.slotBorderValid
                    : slot.isLocked
                    ? COLORS.textDim
                    : COLORS.panelBorder
                }`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: slot.isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isValidTarget ? `0 0 10px ${COLORS.slotBorderValid}50` : 'none',
              }}
            >
              {placedFactor ? (
                <FactorToken factor={placedFactor} isActive={slot.isActive} />
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: COLORS.textDim,
                  }}
                >
                  {slot.acceptsFactorId}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
}

// Helper constant to offset positions
const LAYOUT_PANELS_Y = 80;
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit components/game/SurfacePanel.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add components/game/SurfacePanel.tsx
git commit -m "feat(components): add SurfacePanel component

- Render panel title and subtitle
- Display pre-placed elements (TF+VIIa, trace Va)
- Render slots with valid/locked states
- Highlight valid targets when factor selected
- Show 'Coming in v2' for activated platelet"
```

---

## Task 8: Create FactorPalette Component

**Files:**
- Create: `components/game/FactorPalette.tsx`

**Step 1: Create FactorPalette component**

```typescript
// components/game/FactorPalette.tsx
'use client';

import { COLORS, LAYOUT, GAME_CANVAS } from '@/engine/game/game-config';
import { getFactorDefinition } from '@/engine/game/factor-definitions';
import { FactorToken } from './FactorToken';

interface FactorPaletteProps {
  availableFactors: string[];
  selectedFactorId: string | null;
  onFactorClick: (factorId: string) => void;
}

export function FactorPalette({
  availableFactors,
  selectedFactorId,
  onFactorClick,
}: FactorPaletteProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: LAYOUT.palette.y,
        width: GAME_CANVAS.width,
        height: LAYOUT.palette.height,
        backgroundColor: '#0F172A',
        borderTop: `1px solid ${COLORS.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.textSecondary,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Factor Palette
      </div>

      {/* Factors */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {availableFactors.map((factorId) => {
          const factor = getFactorDefinition(factorId);
          if (!factor) return null;

          return (
            <FactorToken
              key={factorId}
              factor={factor}
              isActive={false}
              isSelected={selectedFactorId === factorId}
              isInPalette={true}
              onClick={() => onFactorClick(factorId)}
            />
          );
        })}

        {availableFactors.length === 0 && (
          <div
            style={{
              fontSize: 14,
              color: COLORS.textDim,
              fontStyle: 'italic',
            }}
          >
            All factors placed
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          fontSize: 11,
          color: COLORS.textDim,
          marginTop: 12,
        }}
      >
        Click a factor to select, then click a slot to place
      </div>
    </div>
  );
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit components/game/FactorPalette.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add components/game/FactorPalette.tsx
git commit -m "feat(components): add FactorPalette component

- Display available factors as clickable tokens
- Show selected state with highlight
- Include category labels (zymogen/procofactor)
- Show instruction text"
```

---

## Task 9: Rewrite GameHUD Component

**Files:**
- Rewrite: `components/game/GameHUD.tsx`

**Step 1: Replace GameHUD with thrombin meter and message display**

```typescript
// components/game/GameHUD.tsx
'use client';

import { COLORS, LAYOUT, GAME_CANVAS } from '@/engine/game/game-config';
import { THROMBIN_STARTER_THRESHOLD } from '@/engine/game/validation-rules';

interface GameHUDProps {
  thrombinMeter: number;
  currentMessage: string;
  isError: boolean;
  phase: string;
}

export function GameHUD({
  thrombinMeter,
  currentMessage,
  isError,
  phase,
}: GameHUDProps): React.ReactElement {
  const meterWidth = 300;
  const fillWidth = (thrombinMeter / 100) * meterWidth;
  const thresholdPosition = (THROMBIN_STARTER_THRESHOLD / 100) * meterWidth;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: GAME_CANVAS.width,
        height: LAYOUT.header.height,
        backgroundColor: '#0F172A',
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
      }}
    >
      {/* Top row: Thrombin meter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textSecondary,
            textTransform: 'uppercase',
          }}
        >
          Thrombin:
        </span>

        {/* Meter bar */}
        <div
          style={{
            position: 'relative',
            width: meterWidth,
            height: 20,
            backgroundColor: COLORS.thrombinMeterBackground,
            borderRadius: 4,
            border: `1px solid ${COLORS.panelBorder}`,
            overflow: 'hidden',
          }}
        >
          {/* Fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: fillWidth,
              height: '100%',
              backgroundColor: COLORS.thrombinMeterFill,
              transition: 'width 0.3s ease',
            }}
          />

          {/* Threshold marker */}
          <div
            style={{
              position: 'absolute',
              left: thresholdPosition,
              top: 0,
              width: 2,
              height: '100%',
              backgroundColor: '#FBBF24',
            }}
          />

          {/* Percentage text */}
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.textPrimary,
            }}
          >
            {thrombinMeter}%
          </span>
        </div>

        {/* Threshold label */}
        <span
          style={{
            fontSize: 10,
            color: COLORS.textDim,
          }}
        >
          Starter: {THROMBIN_STARTER_THRESHOLD}%
        </span>

        {/* Phase indicator */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: phase === 'complete' ? '#22C55E' : '#3B82F6',
            textTransform: 'uppercase',
            marginLeft: 'auto',
          }}
        >
          {phase === 'complete' ? 'Complete!' : phase}
        </span>
      </div>

      {/* Message area */}
      <div
        style={{
          fontSize: 13,
          color: isError ? COLORS.errorMessage : COLORS.successMessage,
          textAlign: 'center',
          minHeight: 20,
          transition: 'color 0.2s ease',
        }}
      >
        {currentMessage}
      </div>
    </div>
  );
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit components/game/GameHUD.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add components/game/GameHUD.tsx
git commit -m "refactor(components): rewrite GameHUD for cell-based model

- Add thrombin meter with threshold marker
- Display current message with error/success styling
- Show phase indicator (initiation/amplification/complete)
- Remove score/timer/lives from arcade version"
```

---

## Task 10: Rewrite GameCanvas Component

**Files:**
- Rewrite: `components/game/GameCanvas.tsx`

**Step 1: Replace GameCanvas with three-panel layout**

```typescript
// components/game/GameCanvas.tsx
'use client';

import type { GameState } from '@/types/game';
import { GAME_CANVAS, PANEL_CONFIGS } from '@/engine/game/game-config';
import { GameHUD } from './GameHUD';
import { SurfacePanel } from './SurfacePanel';
import { FactorPalette } from './FactorPalette';

interface GameCanvasProps {
  gameState: GameState;
  onFactorSelect: (factorId: string) => void;
  onSlotClick: (slotId: string) => void;
}

export function GameCanvas({
  gameState,
  onFactorSelect,
  onSlotClick,
}: GameCanvasProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        width: GAME_CANVAS.width,
        height: GAME_CANVAS.height,
        backgroundColor: '#0F172A',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* HUD (thrombin meter + message) */}
      <GameHUD
        thrombinMeter={gameState.thrombinMeter}
        currentMessage={gameState.currentMessage}
        isError={gameState.isError}
        phase={gameState.phase}
      />

      {/* Surface Panels */}
      {PANEL_CONFIGS.map((config) => (
        <SurfacePanel
          key={config.surface}
          config={config}
          slots={gameState.slots}
          gameState={gameState}
          onSlotClick={onSlotClick}
        />
      ))}

      {/* Factor Palette */}
      <FactorPalette
        availableFactors={gameState.availableFactors}
        selectedFactorId={gameState.selectedFactorId}
        onFactorClick={onFactorSelect}
      />
    </div>
  );
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit components/game/GameCanvas.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add components/game/GameCanvas.tsx
git commit -m "refactor(components): rewrite GameCanvas for cell-based model

- Compose HUD, SurfacePanel, and FactorPalette components
- Remove canvas 2D rendering in favor of DOM elements
- Pass game state and callbacks to child components"
```

---

## Task 11: Rewrite GameControls Component

**Files:**
- Rewrite: `components/game/GameControls.tsx`

**Step 1: Replace GameControls with keyboard handler**

```typescript
// components/game/GameControls.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { GAME_CANVAS } from '@/engine/game/game-config';

interface GameControlsProps {
  onDeselect: () => void;
  onReset: () => void;
}

export function GameControls({
  onDeselect,
  onReset,
}: GameControlsProps): React.ReactElement {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDeselect();
      }
      if (event.key === 'r' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onReset();
      }
    },
    [onDeselect, onReset]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      onClick={onDeselect}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: GAME_CANVAS.width,
        height: GAME_CANVAS.height,
        pointerEvents: 'none', // Let clicks pass through to children
      }}
    />
  );
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit components/game/GameControls.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add components/game/GameControls.tsx
git commit -m "refactor(components): simplify GameControls for click-to-place

- Handle Escape key for deselect
- Handle Ctrl+R for reset
- Remove drag-to-dock and catch mechanics"
```

---

## Task 12: Rewrite Game Page

**Files:**
- Rewrite: `app/game/page.tsx`

**Step 1: Replace page.tsx with new game orchestration**

```typescript
// app/game/page.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { GAME_CANVAS } from '@/engine/game/game-config';
import { useGameState } from '@/hooks/useGameState';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameControls } from '@/components/game/GameControls';
import { GameCompleteModal } from '@/components/game/GameCompleteModal';

export default function GamePage(): ReactElement {
  const router = useRouter();
  const { state, selectFactor, deselectFactor, attemptPlace, resetGame } = useGameState();

  const handleMainMenu = useCallback((): void => {
    router.push('/');
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#020617',
        padding: 16,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: GAME_CANVAS.width,
          height: GAME_CANVAS.height,
          maxWidth: '100%',
        }}
      >
        {/* Main Game Canvas */}
        <GameCanvas
          gameState={state}
          onFactorSelect={selectFactor}
          onSlotClick={attemptPlace}
        />

        {/* Keyboard Controls */}
        <GameControls onDeselect={deselectFactor} onReset={resetGame} />

        {/* Victory Modal */}
        {state.phase === 'complete' && (
          <GameCompleteModal
            onPlayAgain={resetGame}
            onMainMenu={handleMainMenu}
          />
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit app/game/page.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add app/game/page.tsx
git commit -m "refactor(app): rewrite game page for cell-based model

- Wire up useGameState with GameCanvas
- Handle factor selection and slot placement
- Show victory modal on completion
- Remove game loop and spawning logic"
```

---

## Task 13: Rewrite GameCompleteModal

**Files:**
- Rewrite: `components/game/GameCompleteModal.tsx`

**Step 1: Replace GameCompleteModal with victory summary**

```typescript
// components/game/GameCompleteModal.tsx
'use client';

import { COLORS } from '@/engine/game/game-config';

interface GameCompleteModalProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function GameCompleteModal({
  onPlayAgain,
  onMainMenu,
}: GameCompleteModalProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 32,
          maxWidth: 500,
          textAlign: 'center',
          border: `1px solid ${COLORS.panelBorder}`,
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#22C55E',
            marginBottom: 16,
          }}
        >
          Platelet Primed!
        </h2>

        {/* Summary */}
        <div
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            You successfully completed the <strong>Initiation</strong> and{' '}
            <strong>Amplification</strong> phases of coagulation.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>What you learned:</strong>
          </p>
          <ul
            style={{
              textAlign: 'left',
              paddingLeft: 24,
              marginBottom: 12,
            }}
          >
            <li>TF+VIIa on TF-bearing cells generates FXa</li>
            <li>FXa + trace Va produces starter thrombin</li>
            <li>Starter thrombin activates platelets via PAR</li>
            <li>Thrombin cleaves FV → FVa and FVIII → FVIIIa</li>
            <li>Cofactors are now positioned for propagation</li>
          </ul>
          <p>
            <strong>Next:</strong> In v2, you'll assemble Tenase and Prothrombinase
            on the activated platelet to generate the thrombin burst.
          </p>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onPlayAgain}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.panelBorder}`,
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/andreichiper/hemosim && npx tsc --noEmit components/game/GameCompleteModal.tsx 2>&1 | head -10`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add components/game/GameCompleteModal.tsx
git commit -m "refactor(components): rewrite GameCompleteModal for didactic summary

- Display educational summary of what was learned
- List key mechanisms from initiation and amplification
- Preview v2 propagation content
- Simplify to Play Again and Main Menu buttons"
```

---

## Task 14: Build Verification

**Files:**
- None (verification only)

**Step 1: Run full build**

Run: `cd /Users/andreichiper/hemosim && npm run build 2>&1 | tail -30`

Expected: Build succeeds with no errors.

**Step 2: Fix any type errors**

If errors occur, fix them and re-run build until it passes.

**Step 3: Start dev server and test manually**

Run: `cd /Users/andreichiper/hemosim && npm run dev`

Manual test checklist:
- [ ] Game loads at `/game`
- [ ] Three panels visible (TF-cell, Platelet, Activated Platelet)
- [ ] Factor palette shows FX, FII, FV, FVIII+vWF
- [ ] Clicking FX selects it (yellow border)
- [ ] Clicking FX slot places it, shows FXa
- [ ] Thrombin meter increases to 5%
- [ ] Clicking FII selects it
- [ ] Clicking FII slot (with FXa present) places it, shows THR
- [ ] Thrombin meter hits 30%, message shows PAR activation
- [ ] Platelet panel unlocks (slots become clickable)
- [ ] Clicking FV, then FV slot places it
- [ ] Clicking FVIII+vWF, then FVIII slot places it
- [ ] Victory modal appears with educational summary
- [ ] Play Again resets game
- [ ] Escape deselects factor
- [ ] Wrong placements show error messages

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address build errors and polish game flow"
```

---

## Summary

This plan implements the cell-based coagulation game in 14 tasks:

1. **Types** - New type definitions
2. **Factor Definitions** - Factor metadata and messages
3. **Validation Rules** - Placement logic and victory check
4. **Game Config** - Layout and slot positions
5. **useGameState** - State management reducer
6. **FactorToken** - Factor display component
7. **SurfacePanel** - Panel with slots and pre-placed elements
8. **FactorPalette** - Bottom factor tray
9. **GameHUD** - Thrombin meter and messages
10. **GameCanvas** - Three-panel layout composition
11. **GameControls** - Keyboard handling
12. **Game Page** - Orchestration
13. **GameCompleteModal** - Victory summary
14. **Build Verification** - Test and fix

Each task is independent and can be committed separately.
