# Stabilization Phase Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the Stabilization phase with fibrin mesh formation and FXIII cross-linking

**Architecture:** New Clot Zone panel with 4 slots (3 Fibrinogen + 1 FXIII), SVG mesh visualization, phase gating from Propagation

**Tech Stack:** React, TypeScript, SVG for mesh lines, existing event bus

---

## Design Summary

### Scope
Core fibrin + XIIIa + visual fibrin mesh (no plasmin antagonist - saved for Phase 3: Inhibitors)

### New Panel: Clot Zone
- 4th panel to the right of Activated Platelet
- 3 Fibrinogen slots
- 1 FXIII slot

### New Factors in Palette
| Factor | Inactive | Active | Color | Target Surface |
|--------|----------|--------|-------|----------------|
| Fibrinogen | Fibrinogen | Fibrin | #F97316 (orange) | clot-zone |
| FXIII | FXIII | FXIIIa | #FBBF24 (amber) | clot-zone |

### Mechanics

1. **Phase Gating**
   - Prothrombinase complete (FXa docked) → Clot Zone unlocks
   - Phase transitions: propagation → stabilization

2. **Fibrinogen Conversion**
   - Player catches Fibrinogen from palette
   - Docks in Clot Zone slot
   - Thrombin converts Fibrinogen → Fibrin
   - Each fibrin adds +25% Clot Integrity

3. **FXIII Activation**
   - Player catches FXIII from palette
   - Docks in Clot Zone FXIII slot
   - Thrombin activates FXIII → FXIIIa
   - Adds +25% Clot Integrity bonus
   - **Visual effect:** Existing fibrin lines transform from thin white strands to thick, glowing gold beams

4. **Victory Condition**
   - All 4 Clot Zone slots filled
   - Clot Integrity = 100%
   - Phase transitions: stabilization → complete

### Visual Design

#### Fibrin Mesh (SVG Network)
- SVG lines connecting docked fibrin tokens
- Lines animate in as each fibrinogen is placed
- Initial appearance: thin white/gray strands

#### Cross-Link Effect (FXIII Activation)
- When FXIIIa activates, all fibrin lines transform:
  - **Before:** 2px white/gray (#9CA3AF) strands
  - **After:** 4px glowing gold (#FBBF24) beams with glow effect
- Animation: color/thickness transition over 500ms
- Reinforces concept: "clot without Factor XIII is unstable"

#### Clot Integrity Meter
- New meter in GameHUD (similar to Thrombin meter)
- Fills incrementally: 0% → 25% → 50% → 75% → 100%
- Color: Orange (#F97316) to Gold (#FBBF24) gradient

### Events to Add

```typescript
// New event types for Stabilization phase

interface FibrinogenDockedEvent {
  type: 'FIBRINOGEN_DOCKED';
  slotId: string;
  timestamp: number;
}

interface FibrinogenConvertedEvent {
  type: 'FIBRINOGEN_CONVERTED';
  slotId: string;
  integrityDelta: number; // +25
  totalIntegrity: number;
  timestamp: number;
}

interface FXIIIDockedEvent {
  type: 'FXIII_DOCKED';
  slotId: string;
  timestamp: number;
}

interface FXIIIActivatedEvent {
  type: 'FXIII_ACTIVATED';
  slotId: string;
  integrityDelta: number; // +25
  totalIntegrity: number;
  timestamp: number;
}

interface CrossLinkFormedEvent {
  type: 'CROSS_LINK_FORMED';
  fibrinSlotIds: string[];
  timestamp: number;
}

interface ClotStabilizedEvent {
  type: 'CLOT_STABILIZED';
  finalIntegrity: number; // 100
  timestamp: number;
}
```

### Event Priority

| Event | Priority | Reason |
|-------|----------|--------|
| CLOT_STABILIZED | CRITICAL | Victory condition - must process immediately |
| FXIII_ACTIVATED | CRITICAL | Triggers cross-link visual transformation |
| CROSS_LINK_FORMED | STANDARD | Visual feedback for cross-linking |
| FIBRINOGEN_CONVERTED | STANDARD | Standard conversion animation |
| FIBRINOGEN_DOCKED | LOW | Placement feedback |
| FXIII_DOCKED | LOW | Placement feedback |

---

## Implementation Tasks

### Task 1: Type Definitions

**Files:**
- Modify: `types/game.ts`
- Modify: `types/game-events.ts`

**Steps:**
1. Add `'clot-zone'` to Surface type
2. Add `'stabilization'` to GamePhase type
3. Add `clotIntegrity: number` to GameState
4. Add Fibrinogen and FXIII to factor definitions
5. Add 6 new event interfaces to game-events.ts
6. Update GameEvent union type

### Task 2: Factor Definitions

**Files:**
- Modify: `engine/game/factor-definitions.ts`

**Steps:**
1. Add Fibrinogen factor definition
2. Add FXIII factor definition
3. Add clot-zone as valid target surface

### Task 3: Game Config Updates

**Files:**
- Modify: `engine/game/game-config.ts`

**Steps:**
1. Add CLOT_ZONE_PANEL config (4th panel position)
2. Add slot positions for 3 Fibrinogen + 1 FXIII slots
3. Add Clot Integrity meter config

### Task 4: Validation Rules

**Files:**
- Modify: `engine/game/validation-rules.ts`

**Steps:**
1. Add clot-zone slot validation
2. Add phase gating: stabilization unlocks when prothrombinase complete
3. Add fibrinogen/FXIII placement rules

### Task 5: Reducer Updates

**Files:**
- Modify: `hooks/useGameState.ts`

**Steps:**
1. Add clot-zone slots to initial state
2. Add clotIntegrity to initial state (0)
3. Handle Fibrinogen placement → conversion → +25% integrity
4. Handle FXIII placement → activation → +25% integrity + cross-link
5. Check for stabilization phase completion (100% integrity)
6. Emit appropriate events

### Task 6: Animation Configs

**Files:**
- Modify: `engine/game/animation-configs.ts`

**Steps:**
1. Add FIBRINOGEN_CONVERTED animation config
2. Add FXIII_ACTIVATED animation config
3. Add CROSS_LINK_FORMED animation config (line transformation)
4. Add CLOT_STABILIZED animation config

### Task 7: Clot Zone Panel Component

**Files:**
- Create: `components/game/ClotZonePanel.tsx`

**Steps:**
1. Create panel with 4 slots (3 Fibrinogen + 1 FXIII)
2. Add SVG layer for fibrin mesh lines
3. Implement line drawing between occupied fibrin slots
4. Implement cross-link visual transformation (white → gold)
5. Register animation targets

### Task 8: GameHUD Updates

**Files:**
- Modify: `components/game/GameHUD.tsx`

**Steps:**
1. Add Clot Integrity meter
2. Wire up to visualState.clotIntegrity (lerped)
3. Style: orange to gold gradient

### Task 9: Integration

**Files:**
- Modify: `components/game/GameCanvas.tsx`
- Modify: `app/game/page.tsx`

**Steps:**
1. Import and render ClotZonePanel
2. Pass clot-zone slots and state
3. Wire up onSlotClick handler
4. Add Fibrinogen and FXIII to palette

### Task 10: Animation Controller Updates

**Files:**
- Modify: `hooks/useAnimationController.ts`

**Steps:**
1. Add clotIntegrity to VisualState
2. Add lerp interpolation for clotIntegrity
3. Handle new event types

---

## Verification

After implementation:
```bash
npm run build
npm run lint
npm test
```

Manual testing:
- [ ] Clot Zone panel appears (locked) during Initiation/Amplification/Propagation
- [ ] Clot Zone unlocks when Prothrombinase completes
- [ ] Fibrinogen appears in palette during Stabilization
- [ ] Fibrinogen can be docked in Clot Zone slots
- [ ] Fibrin lines appear connecting docked fibrins
- [ ] FXIII can be docked in FXIII slot
- [ ] Cross-link effect transforms line appearance (white → gold)
- [ ] Clot Integrity meter fills correctly (25% per placement)
- [ ] Victory triggers at 100% integrity (all slots filled)
