# Enhanced Coagulation Cascade - Medical Accuracy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the game into a medically accurate coagulation cascade simulation with feedback loops, TFPI lock, FIX messenger mechanic, FXI reinforcement, and Protein C spatial regulation.

**Architecture:** Separate Platelet Activation meter from Clot Integrity. FIXa becomes a "Messenger" that travels from TF-cell to platelet. FXa stays local on TF-cell. TFPI shuts down TF-VIIa factory after FXa buildup. FXI creates local FIXa on platelet. Thrombin spillover at vessel wall edges triggers Protein C → APC generation.

**Tech Stack:** React 18, TypeScript, Next.js 16, useReducer for state management, requestAnimationFrame for game loop.

---

## Overview of Changes

### New Game Mechanics

1. **Two-Meter System**: Platelet Activation (0-100%, unlocks platelet) + Clot Integrity (0-100%, win condition)
2. **FIX → FIXa Messenger**: FIX placed on TF-cell → converts to FIXa → floats to platelet (escort mission)
3. **FXa Local**: FXa generated on TF-cell stays local (doesn't travel)
4. **TFPI Lock**: After 3 FXa generated, TFPI spawns and disables TF-VIIa factory
5. **FXI Reinforcement**: FXI on platelet → FXIa → produces local FIXa (resource multiplier)
6. **Thrombin Spillover**: Excess thrombin particles drift to vessel wall edges
7. **Protein C Pathway**: Thrombin at edges + Thrombomodulin → APC spawns

### Files to Modify

| File | Changes |
|------|---------|
| `types/game.ts` | Add `plateletActivation` meter, `MessengerFactor`, `ThrombomodulinZone`, `SpilloverParticle` types |
| `engine/game/game-config.ts` | Add FIX slot back, add FXI slot to platelet, add Thrombomodulin zones |
| `engine/game/factor-definitions.ts` | Add FIX, FXI definitions, update FIXa |
| `engine/game/spawn-config.ts` | Update spawn configs per phase |
| `engine/game/validation-rules.ts` | Add TFPI lock logic, FXI prerequisite logic |
| `hooks/useGameState.ts` | Add new actions, messenger system, spillover system |
| `app/game/page.tsx` | Add messenger loop, spillover loop, Protein C trigger |
| `components/game/BloodstreamZone.tsx` | Add messenger factors, spillover particles, Thrombomodulin zones |
| `components/game/GameHUD.tsx` | Add Platelet Activation meter (separate from Clot Integrity) |
| `components/game/SurfacePanel.tsx` | Add FIX slot, FXI slot |

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `types/game.ts`

**Step 1: Add new types for messenger system**

Add after line 103 (after `FloatingFactor` interface):

```typescript
// =============================================================================
// MESSENGER FACTOR (FIXa traveling from TF-cell to Platelet)
// =============================================================================

export interface MessengerFactor {
  id: string;
  factorId: string; // 'FIXa'
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  origin: 'tf-cell' | 'platelet'; // where it was generated
  destination: 'platelet'; // always heading to platelet
  isVulnerableTo: InhibitorVulnerability[];
}

// =============================================================================
// SPILLOVER PARTICLE (Thrombin drifting to vessel wall)
// =============================================================================

export interface SpilloverParticle {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  lifetime: number; // seconds remaining
}

// =============================================================================
// THROMBOMODULIN ZONE (Vessel wall edges)
// =============================================================================

export interface ThrombomodulinZone {
  id: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  isActive: boolean;
}
```

**Step 2: Update GameState interface**

Modify `GameState` interface (around line 119) to add new fields:

```typescript
export interface GameState {
  phase: GamePhase;
  thrombinMeter: number; // 0-100, now represents actual thrombin level
  plateletActivation: number; // NEW: 0-100, threshold at 100 to unlock platelet
  clotIntegrity: number; // 0-100, stabilization phase meter
  bleedingMeter: number; // 0-100, player loses at 100
  tfpiActive: boolean; // NEW: true when TFPI has shut down TF-VIIa
  localFXaCount: number; // NEW: count of FXa generated on TF-cell (triggers TFPI at 3)
  gameResult: GameResult;
  gameStats: GameStats;
  slots: Slot[];
  complexSlots: ComplexSlot[];
  circulationFactors: string[];
  messengerFactors: MessengerFactor[]; // NEW: FIXa traveling from TF-cell
  spilloverParticles: SpilloverParticle[]; // NEW: thrombin drifting to edges
  availableFactors: string[];
  selectedFactorId: string | null;
  currentMessage: string;
  isError: boolean;
  floatingFactors: FloatingFactor[];
  heldFactor: HeldFactor | null;
  antagonists: Antagonist[];
}
```

**Step 3: Add new GameAction types**

Add to `GameAction` union (around line 142):

```typescript
  | { type: 'SPAWN_MESSENGER'; messenger: MessengerFactor }
  | { type: 'TICK_MESSENGERS'; deltaTime: number }
  | { type: 'MESSENGER_ARRIVED'; messengerId: string }
  | { type: 'DESTROY_MESSENGER'; messengerId: string; antagonistId: string }
  | { type: 'INCREMENT_LOCAL_FXA' }
  | { type: 'ACTIVATE_TFPI' }
  | { type: 'SPAWN_SPILLOVER'; particle: SpilloverParticle }
  | { type: 'TICK_SPILLOVER'; deltaTime: number }
  | { type: 'SPILLOVER_HIT_EDGE'; particleId: string }
  | { type: 'TRIGGER_PROTEIN_C' }
  | { type: 'INCREMENT_PLATELET_ACTIVATION'; amount: number }
```

**Step 4: Run build to verify types compile**

Run: `cd /Users/andreichiper/hemosim && npm run build`
Expected: Build may fail with missing implementations (that's okay for now)

**Step 5: Commit**

```bash
git add types/game.ts
git commit -m "feat(types): add messenger, spillover, and TFPI types for enhanced cascade"
```

---

## Task 2: Update Game Configuration

**Files:**
- Modify: `engine/game/game-config.ts`

**Step 1: Add FIX slot back to TF-cell**

In `createInitialSlots()` function (around line 137), add FIX slot after FII slot:

```typescript
    // FIX slot - generates FIXa "Messenger" that travels to platelet
    {
      id: 'tf-cell-fix',
      surface: 'tf-cell',
      acceptsFactorId: 'FIX',
      isLocked: false,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
```

**Step 2: Add FXI slot to platelet**

In `createInitialSlots()`, add FXI slot after FVIII slot (around line 177):

```typescript
    // FXI slot - reinforcement loop (produces local FIXa)
    {
      id: 'platelet-fxi',
      surface: 'platelet',
      acceptsFactorId: 'FXI',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
```

**Step 3: Add slot position for FIX**

In `SLOT_POSITIONS` (around line 293), add:

```typescript
  'tf-cell-fix': { slotId: 'tf-cell-fix', x: 40, y: 300, width: 110, height: 70 },
```

**Step 4: Add slot position for FXI**

In `SLOT_POSITIONS`, add:

```typescript
  'platelet-fxi': { slotId: 'platelet-fxi', x: 60, y: 380, width: 140, height: 80 },
```

**Step 5: Add Thrombomodulin zone configuration**

Add new section after `BLOODSTREAM_ZONE` (around line 39):

```typescript
// =============================================================================
// THROMBOMODULIN ZONES (Vessel Wall Edges)
// =============================================================================

export const THROMBOMODULIN_ZONES = {
  top: {
    id: 'thrombomodulin-top',
    bounds: { minX: 0, maxX: 1200, minY: 0, maxY: 20 },
    color: '#9333EA40', // purple tint
  },
  bottom: {
    id: 'thrombomodulin-bottom',
    bounds: { minX: 0, maxX: 1200, minY: 100, maxY: 120 },
    color: '#9333EA40',
  },
} as const;
```

**Step 6: Commit**

```bash
git add engine/game/game-config.ts
git commit -m "feat(config): add FIX slot, FXI slot, and Thrombomodulin zones"
```

---

## Task 3: Update Factor Definitions

**Files:**
- Modify: `engine/game/factor-definitions.ts`

**Step 1: Update FIX definition**

The FIX definition already exists. Update it to clarify messenger mechanic (around line 21):

```typescript
  FIX: {
    id: 'FIX',
    inactiveLabel: 'FIX',
    activeLabel: 'FIXa',
    category: 'zymogen',
    targetSurface: 'tf-cell',
    activationMessage: 'FIXa generated! Messenger traveling to platelet...',
    errorMessageWrongSlot: 'FIX must be placed on TF-bearing cell where TF+VIIa can activate it.',
    prerequisites: [],
    thrombinContribution: 0,
    color: '#06B6D4', // cyan
  },
```

**Step 2: Add FXI definition**

Add after FVIII definition (around line 68):

```typescript
  FXI: {
    id: 'FXI',
    inactiveLabel: 'FXI',
    activeLabel: 'FXIa',
    category: 'zymogen',
    targetSurface: 'platelet',
    activationMessage: 'FXIa activated! Reinforcement loop active - generating local FIXa.',
    errorMessageWrongSlot: 'FXI must be placed on activated platelet where thrombin can activate it.',
    prerequisites: [], // needs platelet unlocked + thrombin present
    thrombinContribution: 0,
    color: '#14B8A6', // teal
  },
```

**Step 3: Update FIXa definition for clarity**

Update the existing FIXa definition (around line 69):

```typescript
  FIXa: {
    id: 'FIXa',
    inactiveLabel: 'FIXa',
    activeLabel: 'FIXa',
    category: 'enzyme',
    targetSurface: 'activated-platelet',
    activationMessage: 'FIXa docked into Tenase complex',
    errorMessageWrongSlot: 'FIXa docks into Tenase enzyme slot on activated platelet.',
    prerequisites: [],
    thrombinContribution: 0,
    color: '#06B6D4', // cyan (same as FIX)
  },
```

**Step 4: Commit**

```bash
git add engine/game/factor-definitions.ts
git commit -m "feat(factors): add FXI definition, update FIX messenger description"
```

---

## Task 4: Update Spawn Configuration

**Files:**
- Modify: `engine/game/spawn-config.ts`

**Step 1: Update Initiation phase spawn config**

Update `PHASE_SPAWN_CONFIG.initiation` (around line 14):

```typescript
  initiation: {
    // FX generates local FXa (stays on TF-cell, triggers TFPI after 3)
    // FIX generates FIXa "Messenger" (travels to platelet)
    // FII generates Spark Thrombin (fills Platelet Activation meter)
    factorIds: ['FX', 'FIX', 'FII'],
    spawnIntervalMs: 3500,
  },
```

**Step 2: Update Amplification phase spawn config**

Update `PHASE_SPAWN_CONFIG.amplification` (around line 19):

```typescript
  amplification: {
    // FV and FVIII are cofactors activated by Spark Thrombin
    // FXI is reinforcement (generates local FIXa)
    factorIds: ['FV', 'FVIII', 'FXI'],
    spawnIntervalMs: 3000,
  },
```

**Step 3: Update vulnerability mapping**

Update `FACTOR_VULNERABILITIES` (around line 43):

```typescript
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
```

**Step 4: Commit**

```bash
git add engine/game/spawn-config.ts
git commit -m "feat(spawn): add FIX and FXI to spawn config with correct vulnerabilities"
```

---

## Task 5: Update Validation Rules

**Files:**
- Modify: `engine/game/validation-rules.ts`

**Step 1: Add TFPI check for TF-cell placements**

Add new validation message (around line 17):

```typescript
  TFPI_LOCKED: 'TFPI has shut down TF+VIIa factory. No more factors can be activated here.',
```

**Step 2: Update validatePlacement function**

Add TFPI check in `validatePlacement` function (around line 45, after slot lock check):

```typescript
  // Check if TFPI has shut down TF-cell (for FIX and FX placements)
  if (slot.surface === 'tf-cell' && state.tfpiActive) {
    return { isValid: false, errorMessage: MESSAGES.TFPI_LOCKED };
  }
```

**Step 3: Add helper for checking messenger arrival**

Add new helper function (around line 147):

```typescript
// =============================================================================
// HELPER: CHECK IF ANY MESSENGER HAS ARRIVED AT PLATELET
// =============================================================================

export function hasMessengerArrived(state: GameState): boolean {
  // Check if any FIXa is in circulation (arrived from TF-cell)
  return state.circulationFactors.includes('FIXa');
}
```

**Step 4: Commit**

```bash
git add engine/game/validation-rules.ts
git commit -m "feat(validation): add TFPI lock validation and messenger arrival check"
```

---

## Task 6: Update Game State Reducer - Part 1 (Messenger System)

**Files:**
- Modify: `hooks/useGameState.ts`

**Step 1: Update createInitialState function**

Add new fields (around line 130):

```typescript
function createInitialState(): GameState {
  const paletteFactors = getAllFactorIds().filter(
    (id) => id !== 'FXa-tenase' && id !== 'Fibrinogen' && id !== 'FXIII' && id !== 'FIXa'
  );

  return {
    phase: 'initiation',
    thrombinMeter: 0,
    plateletActivation: 0, // NEW
    clotIntegrity: 0,
    bleedingMeter: 0,
    tfpiActive: false, // NEW
    localFXaCount: 0, // NEW
    gameResult: null,
    gameStats: createInitialStats(),
    slots: createInitialSlots(),
    complexSlots: createInitialComplexSlots(),
    circulationFactors: [],
    messengerFactors: [], // NEW
    spilloverParticles: [], // NEW
    availableFactors: paletteFactors,
    selectedFactorId: null,
    currentMessage: 'Drag factors from bloodstream. FIXa must travel to platelet!',
    isError: false,
    floatingFactors: [],
    heldFactor: null,
    antagonists: [],
  };
}
```

**Step 2: Add SPAWN_MESSENGER action handler**

Add in reducer switch statement (around line 885):

```typescript
    case 'SPAWN_MESSENGER': {
      return {
        state: {
          ...state,
          messengerFactors: [...state.messengerFactors, action.messenger],
        },
        events: [],
      };
    }
```

**Step 3: Add TICK_MESSENGERS action handler**

Add after SPAWN_MESSENGER:

```typescript
    case 'TICK_MESSENGERS': {
      // Move all messenger factors toward platelet
      const updatedMessengers = state.messengerFactors.map((messenger) => ({
        ...messenger,
        position: {
          x: messenger.position.x + messenger.velocity.x * action.deltaTime,
          y: messenger.position.y + messenger.velocity.y * action.deltaTime,
        },
      }));

      return {
        state: {
          ...state,
          messengerFactors: updatedMessengers,
        },
        events: [],
      };
    }
```

**Step 4: Add MESSENGER_ARRIVED action handler**

Add after TICK_MESSENGERS:

```typescript
    case 'MESSENGER_ARRIVED': {
      const events: GameEvent[] = [];

      // Remove from messengers, add to circulation
      const arrivedMessenger = state.messengerFactors.find((m) => m.id === action.messengerId);
      if (!arrivedMessenger) {
        return { state, events };
      }

      events.push({
        type: 'FACTOR_TRANSFERRED',
        factorId: 'FIXa',
        fromSurface: 'tf-cell',
        toDestination: 'circulation',
      });

      return {
        state: {
          ...state,
          messengerFactors: state.messengerFactors.filter((m) => m.id !== action.messengerId),
          circulationFactors: [...state.circulationFactors, 'FIXa'],
          currentMessage: 'FIXa Messenger arrived at platelet! Ready to dock into Tenase.',
        },
        events,
      };
    }
```

**Step 5: Add DESTROY_MESSENGER action handler**

Add after MESSENGER_ARRIVED:

```typescript
    case 'DESTROY_MESSENGER': {
      const events: GameEvent[] = [];

      const antagonist = state.antagonists.find((a) => a.id === action.antagonistId);
      if (antagonist) {
        events.push({
          type: 'FACTOR_DESTROYED',
          factorId: 'FIXa',
          antagonistType: antagonist.type,
          antagonistId: action.antagonistId,
        });
      }

      return {
        state: {
          ...state,
          messengerFactors: state.messengerFactors.filter((m) => m.id !== action.messengerId),
        },
        events,
      };
    }
```

**Step 6: Commit**

```bash
git add hooks/useGameState.ts
git commit -m "feat(state): add messenger factor system (spawn, tick, arrive, destroy)"
```

---

## Task 7: Update Game State Reducer - Part 2 (TFPI and Local FXa)

**Files:**
- Modify: `hooks/useGameState.ts`

**Step 1: Add INCREMENT_LOCAL_FXA action handler**

Add in reducer:

```typescript
    case 'INCREMENT_LOCAL_FXA': {
      const newCount = state.localFXaCount + 1;
      const shouldActivateTFPI = newCount >= 3 && !state.tfpiActive;

      let newMessage = state.currentMessage;
      if (shouldActivateTFPI) {
        newMessage = 'TFPI activated! TF+VIIa factory shut down. Use existing factors wisely.';
      }

      return {
        state: {
          ...state,
          localFXaCount: newCount,
          tfpiActive: shouldActivateTFPI ? true : state.tfpiActive,
          currentMessage: newMessage,
        },
        events: shouldActivateTFPI ? [{ type: 'TFPI_ACTIVATED' as const }] : [],
      };
    }
```

**Step 2: Add ACTIVATE_TFPI action handler**

Add after INCREMENT_LOCAL_FXA:

```typescript
    case 'ACTIVATE_TFPI': {
      return {
        state: {
          ...state,
          tfpiActive: true,
          currentMessage: 'TFPI has shut down the TF+VIIa factory!',
        },
        events: [{ type: 'TFPI_ACTIVATED' as const }],
      };
    }
```

**Step 3: Update ATTEMPT_PLACE to handle FIX → Messenger and FX → Local FXa**

In the `ATTEMPT_PLACE` case, after line 341 (transfersToCirculation logic), update:

```typescript
      // FIX generates FIXa Messenger (spawned in game loop, not added to circulation here)
      // FX generates local FXa (stays on TF-cell, counts toward TFPI)
      const isFIXPlacement = factorId === 'FIX';
      const isFXPlacement = factorId === 'FX';

      // Mark as transferred for visual feedback
      const transfersToCirculation = isFIXPlacement || factorId === 'FII';

      let newSlots: Slot[] = state.slots.map((slot) =>
        slot.id === action.slotId
          ? {
              ...slot,
              placedFactorId: factorId,
              isActive: true,
              transferredToCirculation: transfersToCirculation,
            }
          : slot
      );

      // Track local FXa for TFPI trigger
      let newLocalFXaCount = state.localFXaCount;
      let newTfpiActive = state.tfpiActive;

      if (isFXPlacement && !state.tfpiActive) {
        newLocalFXaCount = state.localFXaCount + 1;
        if (newLocalFXaCount >= 3) {
          newTfpiActive = true;
          events.push({ type: 'TFPI_ACTIVATED' as const });
        }
      }
```

**Step 4: Update state return to include TFPI fields**

In the `intermediateState` construction, add:

```typescript
      const intermediateState: GameState = {
        ...state,
        phase: newPhase,
        thrombinMeter: newThrombinMeter,
        plateletActivation: state.plateletActivation, // preserve
        clotIntegrity: newClotIntegrity,
        tfpiActive: newTfpiActive,
        localFXaCount: newLocalFXaCount,
        slots: newSlots,
        // ... rest of fields
      };
```

**Step 5: Commit**

```bash
git add hooks/useGameState.ts
git commit -m "feat(state): add TFPI lock system and local FXa tracking"
```

---

## Task 8: Update Game State Reducer - Part 3 (Platelet Activation Meter)

**Files:**
- Modify: `hooks/useGameState.ts`

**Step 1: Add INCREMENT_PLATELET_ACTIVATION action handler**

Add in reducer:

```typescript
    case 'INCREMENT_PLATELET_ACTIVATION': {
      const newActivation = Math.min(100, state.plateletActivation + action.amount);

      return {
        state: {
          ...state,
          plateletActivation: newActivation,
        },
        events: [{
          type: 'METER_CHANGED',
          meter: 'plateletActivation',
          target: newActivation,
          delta: action.amount,
        }],
      };
    }
```

**Step 2: Update FII placement to use Platelet Activation meter**

In `ATTEMPT_PLACE` case, update the FII handling (around line 386):

```typescript
      // FII generates Spark Thrombin - fills Platelet Activation meter (not thrombin meter)
      let newPlateletActivation = state.plateletActivation;
      if (factorId === 'FII') {
        // Spark Thrombin fills Platelet Activation meter instead of thrombin meter
        const activationContribution = 35; // Each FII gives 35% activation
        newPlateletActivation = Math.min(100, state.plateletActivation + activationContribution);

        events.push({
          type: 'METER_CHANGED',
          meter: 'plateletActivation',
          target: newPlateletActivation,
          delta: activationContribution,
        });

        events.push({
          type: 'SIGNAL_FLOW',
          signal: 'Spark THR',
          fromSurface: 'tf-cell',
          toSurface: 'platelet',
          intensity: 'starter',
        });
      }
```

**Step 3: Update platelet unlock condition**

Change the platelet unlock check to use plateletActivation (around line 450):

```typescript
      // Check if platelet should unlock (Platelet Activation at 100%)
      const plateletUnlocking =
        newPlateletActivation >= 100 && state.plateletActivation < 100;
```

**Step 4: Update shouldUnlockPlatelet calls**

Replace `shouldUnlockPlatelet(newThrombinMeter)` with direct check:

```typescript
      if (plateletUnlocking) {
        newSlots = newSlots.map((slot) =>
          slot.surface === 'platelet' ? { ...slot, isLocked: false } : slot
        );

        events.push({
          type: 'PHASE_UNLOCKED',
          phase: 'amplification',
          trigger: 'platelet_activation',
        });
```

**Step 5: Update intermediateState to include plateletActivation**

```typescript
      const intermediateState: GameState = {
        ...state,
        phase: newPhase,
        thrombinMeter: newThrombinMeter,
        plateletActivation: newPlateletActivation,
        // ... rest
      };
```

**Step 6: Commit**

```bash
git add hooks/useGameState.ts
git commit -m "feat(state): add Platelet Activation meter separate from thrombin"
```

---

## Task 9: Update Game State Reducer - Part 4 (Spillover System)

**Files:**
- Modify: `hooks/useGameState.ts`

**Step 1: Add SPAWN_SPILLOVER action handler**

Add in reducer:

```typescript
    case 'SPAWN_SPILLOVER': {
      return {
        state: {
          ...state,
          spilloverParticles: [...state.spilloverParticles, action.particle],
        },
        events: [],
      };
    }
```

**Step 2: Add TICK_SPILLOVER action handler**

```typescript
    case 'TICK_SPILLOVER': {
      // Move spillover particles and decrease lifetime
      const updatedParticles = state.spilloverParticles
        .map((particle) => ({
          ...particle,
          position: {
            x: particle.position.x + particle.velocity.x * action.deltaTime,
            y: particle.position.y + particle.velocity.y * action.deltaTime,
          },
          lifetime: particle.lifetime - action.deltaTime,
        }))
        .filter((p) => p.lifetime > 0); // Remove expired particles

      return {
        state: {
          ...state,
          spilloverParticles: updatedParticles,
        },
        events: [],
      };
    }
```

**Step 3: Add SPILLOVER_HIT_EDGE action handler**

```typescript
    case 'SPILLOVER_HIT_EDGE': {
      // Remove the particle that hit the edge
      return {
        state: {
          ...state,
          spilloverParticles: state.spilloverParticles.filter(
            (p) => p.id !== action.particleId
          ),
        },
        events: [{ type: 'SPILLOVER_HIT_THROMBOMODULIN' as const, particleId: action.particleId }],
      };
    }
```

**Step 4: Add TRIGGER_PROTEIN_C action handler**

```typescript
    case 'TRIGGER_PROTEIN_C': {
      // Protein C activation - spawns APC antagonist
      // The actual APC spawn is handled in the game loop
      return {
        state: {
          ...state,
          currentMessage: 'Thrombin spillover activated Protein C → APC generated!',
        },
        events: [{ type: 'PROTEIN_C_ACTIVATED' as const }],
      };
    }
```

**Step 5: Commit**

```bash
git add hooks/useGameState.ts
git commit -m "feat(state): add spillover particle system for Protein C pathway"
```

---

## Task 10: Add New Event Types

**Files:**
- Modify: `types/game-events.ts`

**Step 1: Add new event types**

Find the GameEvent union type and add:

```typescript
  | { type: 'TFPI_ACTIVATED' }
  | { type: 'MESSENGER_SPAWNED'; messengerId: string; fromSurface: 'tf-cell' }
  | { type: 'MESSENGER_ARRIVED'; messengerId: string; atSurface: 'platelet' }
  | { type: 'MESSENGER_DESTROYED'; messengerId: string; antagonistType: AntagonistType }
  | { type: 'SPILLOVER_HIT_THROMBOMODULIN'; particleId: string }
  | { type: 'PROTEIN_C_ACTIVATED' }
  | { type: 'LOCAL_FIXA_GENERATED'; source: 'fxi' }
```

**Step 2: Commit**

```bash
git add types/game-events.ts
git commit -m "feat(events): add TFPI, messenger, spillover, and Protein C events"
```

---

## Task 11: Update useGameState Hook Exports

**Files:**
- Modify: `hooks/useGameState.ts`

**Step 1: Add new action dispatchers to hook return**

Update `UseGameStateReturn` interface (around line 1019):

```typescript
export interface UseGameStateReturn {
  state: GameState;
  // ... existing methods ...

  /** Spawn a messenger factor (FIXa traveling from TF-cell) */
  spawnMessenger: (messenger: MessengerFactor) => void;
  /** Update messenger positions */
  tickMessengers: (deltaTime: number) => void;
  /** Handle messenger arrival at platelet */
  messengerArrived: (messengerId: string) => void;
  /** Destroy a messenger (antagonist caught it) */
  destroyMessenger: (messengerId: string, antagonistId: string) => void;
  /** Spawn spillover particle */
  spawnSpillover: (particle: SpilloverParticle) => void;
  /** Update spillover particles */
  tickSpillover: (deltaTime: number) => void;
  /** Handle spillover hitting vessel wall */
  spilloverHitEdge: (particleId: string) => void;
  /** Trigger Protein C activation */
  triggerProteinC: () => void;
  /** Increment platelet activation meter */
  incrementPlateletActivation: (amount: number) => void;
}
```

**Step 2: Add useCallback implementations**

Add after existing useCallback definitions (around line 1180):

```typescript
  const spawnMessenger = useCallback((messenger: MessengerFactor) => {
    dispatch({ type: 'SPAWN_MESSENGER', messenger });
  }, []);

  const tickMessengers = useCallback((deltaTime: number) => {
    dispatch({ type: 'TICK_MESSENGERS', deltaTime });
  }, []);

  const messengerArrived = useCallback((messengerId: string) => {
    dispatch({ type: 'MESSENGER_ARRIVED', messengerId });
  }, []);

  const destroyMessenger = useCallback((messengerId: string, antagonistId: string) => {
    dispatch({ type: 'DESTROY_MESSENGER', messengerId, antagonistId });
  }, []);

  const spawnSpillover = useCallback((particle: SpilloverParticle) => {
    dispatch({ type: 'SPAWN_SPILLOVER', particle });
  }, []);

  const tickSpillover = useCallback((deltaTime: number) => {
    dispatch({ type: 'TICK_SPILLOVER', deltaTime });
  }, []);

  const spilloverHitEdge = useCallback((particleId: string) => {
    dispatch({ type: 'SPILLOVER_HIT_EDGE', particleId });
  }, []);

  const triggerProteinC = useCallback(() => {
    dispatch({ type: 'TRIGGER_PROTEIN_C' });
  }, []);

  const incrementPlateletActivation = useCallback((amount: number) => {
    dispatch({ type: 'INCREMENT_PLATELET_ACTIVATION', amount });
  }, []);
```

**Step 3: Update return object**

Add new methods to the return object:

```typescript
  return {
    state,
    // ... existing methods ...
    spawnMessenger,
    tickMessengers,
    messengerArrived,
    destroyMessenger,
    spawnSpillover,
    tickSpillover,
    spilloverHitEdge,
    triggerProteinC,
    incrementPlateletActivation,
  };
```

**Step 4: Commit**

```bash
git add hooks/useGameState.ts
git commit -m "feat(hook): export messenger, spillover, and Protein C actions"
```

---

## Task 12: Update Game Page - Messenger Loop

**Files:**
- Modify: `app/game/page.tsx`

**Step 1: Import MessengerFactor type**

Add to imports (around line 28):

```typescript
import type { FloatingFactor, AntagonistType, Antagonist, MessengerFactor, SpilloverParticle } from '@/types/game';
```

**Step 2: Add messenger spawn logic in game loop**

In the game loop (around line 295), after factor spawning, add:

```typescript
      // === MESSENGER SPAWNING (when FIX is placed on TF-cell) ===
      // Check if FIX was just placed and spawn messenger
      const fixSlot = state.slots.find((s) => s.id === 'tf-cell-fix');
      if (fixSlot?.isActive && fixSlot?.transferredToCirculation) {
        // Check if messenger already exists for this placement
        const messengerExists = state.messengerFactors.some(
          (m) => m.origin === 'tf-cell'
        );
        if (!messengerExists && !state.circulationFactors.includes('FIXa')) {
          const messenger: MessengerFactor = {
            id: `messenger-${Date.now()}`,
            factorId: 'FIXa',
            position: { x: 150, y: 60 }, // Start near TF-cell
            velocity: { x: 50, y: 0 }, // Move right toward platelet
            origin: 'tf-cell',
            destination: 'platelet',
            isVulnerableTo: ['antithrombin'],
          };
          spawnMessenger(messenger);
        }
      }
```

**Step 3: Add messenger tick and arrival detection**

After messenger spawning logic:

```typescript
      // === MESSENGER MOVEMENT ===
      if (state.messengerFactors.length > 0 && deltaTime > 0 && deltaTime < 1) {
        tickMessengers(deltaTime);

        // Check for messenger arrival at platelet zone (x > 400)
        for (const messenger of state.messengerFactors) {
          if (messenger.position.x >= 400) {
            messengerArrived(messenger.id);
          }
        }
      }
```

**Step 4: Import new hooks**

Destructure new methods from useGameState:

```typescript
  const {
    state,
    // ... existing ...
    spawnMessenger,
    tickMessengers,
    messengerArrived,
    destroyMessenger,
    spawnSpillover,
    tickSpillover,
    spilloverHitEdge,
    triggerProteinC,
  } = useGameState();
```

**Step 5: Commit**

```bash
git add app/game/page.tsx
git commit -m "feat(game): add messenger spawning and movement loop"
```

---

## Task 13: Update Game Page - Spillover System

**Files:**
- Modify: `app/game/page.tsx`

**Step 1: Add spillover spawn logic**

In the game loop, after prothrombinase handling, add:

```typescript
      // === THROMBIN SPILLOVER (during Propagation burst) ===
      // Spawn spillover particles when thrombin is high
      if (
        state.phase === 'propagation' &&
        state.thrombinMeter >= 80 &&
        state.spilloverParticles.length < 5 // Cap at 5 particles
      ) {
        // Random chance to spawn spillover each frame
        if (Math.random() < 0.02) { // ~2% chance per frame
          const goingUp = Math.random() > 0.5;
          const particle: SpilloverParticle = {
            id: `spillover-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            position: {
              x: 600 + Math.random() * 200, // Near center
              y: 60, // Middle of bloodstream
            },
            velocity: {
              x: (Math.random() - 0.5) * 20, // Slight horizontal drift
              y: goingUp ? -30 : 30, // Drift toward top or bottom edge
            },
            lifetime: 3, // 3 seconds
          };
          spawnSpillover(particle);
        }
      }
```

**Step 2: Add spillover tick and edge detection**

After spillover spawning:

```typescript
      // === SPILLOVER MOVEMENT ===
      if (state.spilloverParticles.length > 0 && deltaTime > 0 && deltaTime < 1) {
        tickSpillover(deltaTime);

        // Check for spillover hitting vessel wall edges
        for (const particle of state.spilloverParticles) {
          // Top edge (y < 20) or bottom edge (y > 100)
          if (particle.position.y < 20 || particle.position.y > 100) {
            spilloverHitEdge(particle.id);
            triggerProteinC();

            // Spawn APC if not already present
            const apcExists = state.antagonists.some((a) => a.type === 'apc');
            if (!apcExists) {
              const apc = createAntagonist('apc', generateAntagonistId());
              spawnAntagonist(apc);
            }
          }
        }
      }
```

**Step 3: Commit**

```bash
git add app/game/page.tsx
git commit -m "feat(game): add spillover system and Protein C → APC trigger"
```

---

## Task 14: Update GameHUD - Platelet Activation Meter

**Files:**
- Modify: `components/game/GameHUD.tsx`

**Step 1: Read current GameHUD structure**

First read the file to understand its structure.

**Step 2: Add Platelet Activation meter**

Add a new meter component showing Platelet Activation (0-100%) next to or below the existing thrombin meter. Use yellow color to distinguish from thrombin (red).

```typescript
{/* Platelet Activation Meter */}
{state.phase === 'initiation' && (
  <div style={{ marginTop: 8 }}>
    <div style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 4 }}>
      PLATELET ACTIVATION
    </div>
    <div
      style={{
        width: 200,
        height: 16,
        backgroundColor: COLORS.thrombinMeterBackground,
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${COLORS.panelBorder}`,
      }}
    >
      <div
        style={{
          width: `${state.plateletActivation}%`,
          height: '100%',
          backgroundColor: '#FBBF24', // amber/yellow
          transition: 'width 0.3s ease',
        }}
      />
    </div>
    <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 2 }}>
      {state.plateletActivation}% / 100%
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add components/game/GameHUD.tsx
git commit -m "feat(hud): add Platelet Activation meter for Initiation phase"
```

---

## Task 15: Update BloodstreamZone - Messenger and Spillover Rendering

**Files:**
- Modify: `components/game/BloodstreamZone.tsx`

**Step 1: Add messenger factor rendering**

Add props for messengerFactors and render them with a distinct visual (cyan with trailing effect):

```typescript
// Messenger factors (FIXa traveling from TF-cell)
{messengerFactors.map((messenger) => (
  <div
    key={messenger.id}
    className="messenger-factor"
    style={{
      position: 'absolute',
      left: messenger.position.x - 20,
      top: messenger.position.y - 15,
      width: 40,
      height: 30,
      backgroundColor: '#06B6D480',
      border: '2px solid #06B6D4',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 700,
      color: '#06B6D4',
      boxShadow: '0 0 10px #06B6D4',
    }}
  >
    FIXa
    <span style={{ fontSize: 8, marginLeft: 2 }}>🚀</span>
  </div>
))}
```

**Step 2: Add spillover particle rendering**

Add props for spilloverParticles and render them as small red dots:

```typescript
// Spillover particles (thrombin drifting to edges)
{spilloverParticles.map((particle) => (
  <div
    key={particle.id}
    className="spillover-particle"
    style={{
      position: 'absolute',
      left: particle.position.x - 4,
      top: particle.position.y - 4,
      width: 8,
      height: 8,
      backgroundColor: '#EF4444',
      borderRadius: '50%',
      boxShadow: '0 0 6px #EF4444',
      opacity: particle.lifetime / 3, // Fade as lifetime decreases
    }}
  />
))}
```

**Step 3: Add Thrombomodulin zone visual**

Add visual indicator for vessel wall edges:

```typescript
// Thrombomodulin zones (vessel wall edges)
<div
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    background: 'linear-gradient(to bottom, #9333EA40, transparent)',
    pointerEvents: 'none',
  }}
/>
<div
  style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    background: 'linear-gradient(to top, #9333EA40, transparent)',
    pointerEvents: 'none',
  }}
/>
```

**Step 4: Commit**

```bash
git add components/game/BloodstreamZone.tsx
git commit -m "feat(bloodstream): add messenger, spillover, and Thrombomodulin visuals"
```

---

## Task 16: Update GameCanvas to Pass New Props

**Files:**
- Modify: `components/game/GameCanvas.tsx`

**Step 1: Pass messengerFactors and spilloverParticles to BloodstreamZone**

Update the BloodstreamZone component call to include new props:

```typescript
<BloodstreamZone
  floatingFactors={gameState.floatingFactors}
  messengerFactors={gameState.messengerFactors}
  spilloverParticles={gameState.spilloverParticles}
  antagonists={gameState.antagonists}
  heldFactor={gameState.heldFactor}
  heldFactorDisplayPosition={heldFactorDisplayPosition}
  onFactorDragStart={onFactorDragStart}
/>
```

**Step 2: Commit**

```bash
git add components/game/GameCanvas.tsx
git commit -m "feat(canvas): pass messenger and spillover to BloodstreamZone"
```

---

## Task 17: Update FXI Reinforcement Loop

**Files:**
- Modify: `hooks/useGameState.ts`
- Modify: `app/game/page.tsx`

**Step 1: Handle FXI placement in reducer**

In `ATTEMPT_PLACE` case, add FXI handling:

```typescript
      // FXI generates local FIXa on platelet (reinforcement loop)
      if (factorId === 'FXI' && surface === 'platelet') {
        events.push({
          type: 'LOCAL_FIXA_GENERATED',
          source: 'fxi',
        });

        // Add FIXa to circulation (can dock into Tenase)
        newCirculationFactors = [...newCirculationFactors, 'FIXa'];

        intermediateState = {
          ...intermediateState,
          circulationFactors: newCirculationFactors,
          currentMessage: 'FXIa activated! Local FIXa generated for Tenase.',
        };
      }
```

**Step 2: Commit**

```bash
git add hooks/useGameState.ts app/game/page.tsx
git commit -m "feat(fxi): add FXI reinforcement loop generating local FIXa"
```

---

## Task 18: Add TFPI Visual Indicator

**Files:**
- Modify: `components/game/SurfacePanel.tsx`

**Step 1: Add TFPI lock indicator on TF-cell panel**

When `gameState.tfpiActive` is true, show a visual overlay on the TF-cell panel:

```typescript
{/* TFPI Lock indicator */}
{config.surface === 'tf-cell' && gameState.tfpiActive && (
  <div
    style={{
      position: 'absolute',
      top: 60,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '4px 12px',
      backgroundColor: '#DC262640',
      border: '1px solid #DC2626',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      color: '#DC2626',
      zIndex: 10,
    }}
  >
    TFPI ACTIVE - Factory Shut Down
  </div>
)}
```

**Step 2: Gray out TF+VIIa when TFPI active**

Update PreplacedElementComponent to accept tfpiActive prop and dim the TF+VIIa element:

```typescript
style={{
  // ... existing styles ...
  opacity: tfpiActive && element.id === 'tf-viia' ? 0.3 : 1,
  textDecoration: tfpiActive && element.id === 'tf-viia' ? 'line-through' : 'none',
}}
```

**Step 3: Commit**

```bash
git add components/game/SurfacePanel.tsx
git commit -m "feat(panel): add TFPI lock visual indicator on TF-cell"
```

---

## Task 19: Final Integration and Testing

**Files:**
- All modified files

**Step 1: Run TypeScript build**

```bash
cd /Users/andreichiper/hemosim && npm run build
```

Expected: Build passes with no errors

**Step 2: Run linter**

```bash
npm run lint
```

Expected: No linting errors

**Step 3: Manual testing checklist**

- [ ] FIX spawns in Initiation phase
- [ ] FIX placed on TF-cell → FIXa Messenger spawns
- [ ] FIXa Messenger travels right toward platelet
- [ ] FIXa Messenger arrives and enters circulation
- [ ] FX placed on TF-cell → stays local (no messenger)
- [ ] After 3 FX placements, TFPI activates
- [ ] TFPI visual shows on TF-cell panel
- [ ] Cannot place more FX/FIX after TFPI active
- [ ] Platelet Activation meter fills with FII placements
- [ ] Platelet unlocks at 100% Platelet Activation
- [ ] FXI appears in Amplification spawns
- [ ] FXI placed → generates local FIXa in circulation
- [ ] Thrombin spillover particles appear during Propagation
- [ ] Spillover hitting edge triggers Protein C → APC spawn
- [ ] APC targets FVa and FVIIIa

**Step 4: Commit final integration**

```bash
git add -A
git commit -m "feat: complete enhanced cascade with TFPI, messengers, spillover, and Protein C"
```

---

## Summary of New Mechanics

| Mechanic | Trigger | Result |
|----------|---------|--------|
| **FIXa Messenger** | FIX placed on TF-cell | FIXa travels to platelet |
| **FXa Local** | FX placed on TF-cell | FXa stays, counts toward TFPI |
| **TFPI Lock** | 3 FXa generated | TF-VIIa factory disabled |
| **Platelet Activation** | FII placement | Fills activation meter (not thrombin) |
| **FXI Reinforcement** | FXI placed on platelet | Local FIXa generated |
| **Thrombin Spillover** | Thrombin ≥80% in Propagation | Red particles drift to edges |
| **Protein C Pathway** | Spillover hits vessel wall | APC spawns, targets cofactors |

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `types/game.ts` | MessengerFactor, SpilloverParticle, ThrombomodulinZone, GameState updates |
| `types/game-events.ts` | New event types |
| `engine/game/game-config.ts` | FIX slot, FXI slot, Thrombomodulin zones |
| `engine/game/factor-definitions.ts` | FXI definition, FIX update |
| `engine/game/spawn-config.ts` | Updated spawn configs |
| `engine/game/validation-rules.ts` | TFPI lock validation |
| `hooks/useGameState.ts` | All new actions and state |
| `app/game/page.tsx` | Messenger loop, spillover loop |
| `components/game/GameHUD.tsx` | Platelet Activation meter |
| `components/game/BloodstreamZone.tsx` | Messenger, spillover, Thrombomodulin visuals |
| `components/game/GameCanvas.tsx` | Pass new props |
| `components/game/SurfacePanel.tsx` | TFPI indicator, FXI slot |
