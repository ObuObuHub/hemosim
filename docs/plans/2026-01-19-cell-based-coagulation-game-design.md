# Cell-Based Coagulation Game - Design Document

## Summary

Didactic educational game where players place coagulation factors on the correct cell surfaces to learn the cell-based model of hemostasis. Replaces arcade-style "catch floating factors" with "place the right piece on the right surface."

**Core teaching goal:** Small thrombin generated on TF-bearing cells primes platelets and cofactors - the "hinge" of the cell-based model.

**Route:** `/game`
**Scope:** v1 = Initiation + Amplification (Propagation reserved for v2)

---

## Game Mechanics

### Core Loop: Select → Place → Observe
1. **Select**: Click factor in palette to pick it up
2. **Place**: Click valid slot on correct surface
3. **Observe**: Factor converts (zymogen → active), arrow animation shows what was produced
4. **Learn**: One-line feedback explains the mechanism with surface context

### Key Didactic Principles
- **Surface separation**: Factors must go on correct surface (TF-cell vs Platelet)
- **Threshold transitions**: Starter thrombin unlocks amplification (not chapter completion)
- **Mechanistic accuracy**: FII → THR requires FXa + Va (prothrombinase logic)
- **Terminology precision**: Zymogens vs procofactors distinguished

---

## Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  THROMBIN: [████████░░░░░░░░░░░░░░░░░░░░] 35%                  │
│            ↑ Starter (30%)                                      │
├─────────────────────────────────────────────────────────────────┤
│  💬 [Current message / feedback appears here]                   │
├───────────────────┬───────────────────┬─────────────────────────┤
│                   │                   │                         │
│   TF-BEARING      │     PLATELET      │    ACTIVATED PLATELET   │
│      CELL         │    (Priming)      │      (Propagation)      │
│                   │                   │                         │
│  ┌───────┐┌─────┐ │  ┌───────┐┌─────┐ │     [COMING IN v2]      │
│  │TF+VIIa││ Va  │ │  │FV slot││FVIII│ │                         │
│  │       ││trace│ │  │       ││slot │ │                         │
│  └───────┘└─────┘ │  └───────┘└─────┘ │                         │
│  ┌───────┐┌─────┐ │                   │                         │
│  │FX slot││ FII │ │                   │                         │
│  │       ││slot │ │                   │                         │
│  └───────┘└─────┘ │                   │                         │
│                   │                   │                         │
│    [ACTIVE]       │[LOCKED: THR≥30%]  │       [LOCKED]          │
├───────────────────┴───────────────────┴─────────────────────────┤
│                        FACTOR PALETTE                           │
│                                                                 │
│   ┌─────┐   ┌─────┐   ┌─────┐   ┌───────────┐                  │
│   │ FX  │   │ FII │   │ FV  │   │ FVIII+vWF │                  │
│   └─────┘   └─────┘   └─────┘   └───────────┘                  │
│   zymogen   zymogen   procof.    procofactor                   │
│                                                                 │
│   [Click a factor to select, then click a slot to place]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Factor Definitions

### v1 Factor Roster

| Factor | Inactive Label | Active Label | Category | Target Surface | Prerequisites |
|--------|---------------|--------------|----------|----------------|---------------|
| FX | FX | FXa | zymogen | TF-cell | none |
| FII | FII | THR | zymogen | TF-cell | FXa |
| FV | FV | FVa | procofactor | Platelet | THR threshold |
| FVIII | FVIII+vWF | FVIIIa | procofactor | Platelet | THR threshold |

### Pre-placed Elements (TF-cell)
- **TF+VIIa**: Initiation engine, always present, bright
- **Va (trace)**: Dim badge, tooltip: "Trace cofactor enables starter thrombin"

---

## Slot Structure

### TF-Bearing Cell (Initiation)
| Slot ID | Accepts | Locked | Notes |
|---------|---------|--------|-------|
| tf-cell-fx | FX | No | First player action |
| tf-cell-fii | FII | No | Requires FXa present |

### Platelet (Amplification)
| Slot ID | Accepts | Locked | Notes |
|---------|---------|--------|-------|
| platelet-fv | FV | Yes (until THR ≥ 30%) | Unlocked by starter thrombin |
| platelet-fviii | FVIII | Yes (until THR ≥ 30%) | Unlocked by starter thrombin |

### Activated Platelet (Propagation) - v2
Reserved for future implementation.

---

## Thrombin Meter

### Segments
- **0-30%**: Initiation range
- **30%**: "Starter" threshold - unlocks Platelet panel
- **30-100%**: Reserved for Propagation burst (v2)

### Meter Contributions
| Event | Contribution |
|-------|-------------|
| FX → FXa placed | +5% |
| FII → THR placed | +25% |
| **Total after Initiation** | **30% = Starter** |

---

## Validation Rules

| Attempt | Valid? | Response |
|---------|--------|----------|
| FX → TF-cell FX slot | ✓ | Converts to FXa |
| FII → TF-cell FII slot (FXa present) | ✓ | Converts to THR, meter fills |
| FII → TF-cell FII slot (FXa missing) | ✗ | "FII requires FXa present. Place FX first." |
| Any factor → locked Platelet | ✗ | "Platelet not yet activated. Need starter thrombin (≥30%)." |
| FV → Platelet (unlocked) | ✓ | Converts to FVa |
| FVIII+vWF → Platelet (unlocked) | ✓ | Converts to FVIIIa |
| Wrong factor → wrong slot | ✗ | "[Factor] cannot bind here. Check which surface accepts it." |

---

## Feedback Messages

### Success Messages (surface-contextualized)
| Action | Message |
|--------|---------|
| FX → FXa | "FXa generated on TF-cell surface (TF+VIIa catalyzes)" |
| FII → THR | "Starter thrombin generated on TF-cell (FXa + Va required)" |
| Threshold | "Starter thrombin activates platelet via PAR receptors" |
| FV → FVa | "FVa activated on platelet surface (thrombin cleaves)" |
| FVIII → FVIIIa | "FVIIIa activated, dissociates from vWF (thrombin cleaves)" |
| Victory | "Platelet primed. Cofactors positioned for propagation." |

### Error Messages
| Error | Message |
|-------|---------|
| FII before FXa | "FII requires FXa present. Place FX first." |
| Factor on locked panel | "Platelet not yet activated. Need starter thrombin (≥30%)." |
| Wrong slot | "[Factor] cannot bind here. Check which surface accepts it." |

---

## Interaction Flow

### States
1. **Idle**: All factors visible, none selected
2. **Selected**: Factor highlights, valid slots pulse, cursor shows factor
3. **Placing**: Factor animates to slot, flip animation (inactive → active)
4. **Placed**: Factor removed from palette, active form in slot

### Deselect
- Click same factor again
- Click empty area
- Press Escape

---

## Teaching Sequence (v1)

1. Place FX → "FXa generated on TF-cell surface (TF+VIIa catalyzes)"
2. Place FII → "Starter thrombin generated on TF-cell (FXa + Va required)"
3. Meter hits 30% → "Starter thrombin activates platelet via PAR receptors"
4. Platelet panel unlocks
5. Place FV → "FVa activated on platelet surface (thrombin cleaves)"
6. Place FVIII+vWF → "FVIIIa activated, dissociates from vWF (thrombin cleaves)"
7. Victory → "Platelet primed. Cofactors positioned for propagation."

---

## Victory Condition (v1)

All of:
- Thrombin meter ≥ 30% (Starter threshold)
- FVa placed on Platelet
- FVIIIa placed on Platelet

---

## File Structure

```
hemosim/
├── app/game/
│   └── page.tsx                 # Rewrite: didactic game loop
├── components/game/
│   ├── GameCanvas.tsx           # Rewrite: three-panel layout
│   ├── GameHUD.tsx              # Modify: thrombin meter + messages
│   ├── GameControls.tsx         # Rewrite: click-to-select/place
│   ├── GameCompleteModal.tsx    # Modify: v1 victory summary
│   ├── FactorPalette.tsx        # NEW: bottom factor tray
│   ├── SurfacePanel.tsx         # NEW: reusable surface panel
│   └── FactorToken.tsx          # NEW: flip animation component
├── hooks/
│   ├── useGameState.ts          # Rewrite: new state model
│   └── useGameLoop.ts           # Keep: animation loop
├── engine/game/
│   ├── game-config.ts           # Rewrite: slots, thresholds
│   ├── factor-definitions.ts    # NEW: factor metadata
│   └── validation-rules.ts      # NEW: placement logic
└── types/
    └── game.ts                  # Rewrite: new types
```

---

## Types

```typescript
// types/game.ts

type Surface = 'tf-cell' | 'platelet' | 'activated-platelet';
type FactorCategory = 'zymogen' | 'procofactor' | 'enzyme' | 'cofactor';
type FactorState = 'inactive' | 'active' | 'placed';

interface FactorDefinition {
  id: string;
  inactiveLabel: string;
  activeLabel: string;
  category: FactorCategory;
  targetSurface: Surface;
  activationMessage: string;
  prerequisites: string[];
}

interface Slot {
  id: string;
  surface: Surface;
  acceptsFactorId: string;
  isLocked: boolean;
  placedFactor: FactorDefinition | null;
  isActive: boolean;
}

interface GameState {
  phase: 'initiation' | 'amplification' | 'complete';
  thrombinMeter: number;
  slots: Slot[];
  availableFactors: string[];
  selectedFactorId: string | null;
  currentMessage: string;
  isError: boolean;
}

type GameAction =
  | { type: 'SELECT_FACTOR'; factorId: string }
  | { type: 'DESELECT_FACTOR' }
  | { type: 'PLACE_FACTOR'; slotId: string }
  | { type: 'RESET_GAME' };
```

---

## What's Removed (from arcade version)

- Floating factors with velocity/physics
- Catch mechanic (tap to grab)
- Drag-to-dock interaction
- Antagonist system (antithrombin)
- Timer-based pressure
- "Tenase unlocks Prothrombinase" gating

---

## v2 Expansion Path

Add Propagation panel with:
- FIX → FIXa (+ FXI → FXIa optionally)
- Tenase complex (IXa + VIIIa)
- Prothrombinase complex (Xa + Va)
- Thrombin burst as win condition (meter to 100%)
