# Real Gameplay Design: Floating Factors, Antagonists & Membrane Theming

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform static puzzle into dynamic action game with floating factors, drag-and-drop catching, biological antagonists, and membrane-themed surfaces.

**Architecture:** Factors spawn in bloodstream zone, player drags to dock on membrane surfaces, antagonists hunt specific factor types, bleeding meter tracks failure state.

**Tech Stack:** React, CSS animations, requestAnimationFrame game loop

---

## Core Loop

1. **Spawn** - Factors appear left side of bloodstream, float rightward
2. **Catch** - Player drags factor from stream
3. **Dock** - Drop on valid membrane slot (factor sinks in with ripple)
4. **Protect** - Docked factors safe from antagonists
5. **Complete** - Fill all slots to win phase, progress to next

---

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  BLOODSTREAM ZONE (120px) - factors float left→right       │
│  [FloatingFactor] ──→  [Antithrombin]  ──→  [FloatingFactor]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ TF-Cell  │ │ Platelet │ │ Act.Plat │ │ ClotZone │       │
│  │ (jagged) │ │ (smooth) │ │ (spiky)  │ │ (mesh)   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ BLEEDING METER [████████░░░░░░░░░░░░] 40%           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Factor Spawning by Phase

| Phase | Factors Spawned | Spawn Rate | Notes |
|-------|-----------------|------------|-------|
| Initiation | FX | 1 every 4s | Slow intro |
| Amplification | FII, FV | 1 every 3s | FII vulnerable to AT |
| Propagation | FIXa, FVIIIa, FXa | 1 every 2.5s | Multiple vulnerable |
| Stabilization | Fibrinogen, FXIII | 1 every 2s | Plasmin joins |

---

## Antagonists

### Antithrombin
- **Targets:** IIa, Xa, IXa, XIa (serine proteases / enzymes)
- **Ignores:** FV, FVIII, Fibrinogen, FXIII
- **Behavior:** Patrols bloodstream, hunts nearest vulnerable factor
- **Visual:** Serpentine shape (it's a serpin)
- **Appears:** All phases (speeds up over time)

### Activated Protein C (APC)
- **Targets:** FVa, FVIIIa (cofactors only)
- **Ignores:** Enzymes, fibrin
- **Behavior:** Hunts cofactors in bloodstream
- **Visual:** Scissor shape (cleaves cofactors)
- **Appears:** Amplification phase onward

### Plasmin
- **Targets:** Fibrinogen, placed Fibrin
- **Ignores:** Other factors
- **Behavior:** Targets Clot Zone, degrades fibrin
- **Counter:** Cross-linked fibrin (FXIII) is immune
- **Visual:** Dissolving/eating shape
- **Appears:** Stabilization phase only

### Antagonist Targeting Summary

| Antagonist | Targets | Teaching Point |
|------------|---------|----------------|
| Antithrombin | Enzymes (IIa, Xa, IXa, XIa) | Serpins inhibit serine proteases |
| APC | Cofactors (FVa, FVIIIa) | Protein C pathway degrades cofactors |
| Plasmin | Fibrin, Fibrinogen | Fibrinolysis breaks down clots |

---

## Bleeding Meter

- **Range:** 0-100%
- **Increases when:**
  - Factor escapes off screen: +10%
  - Antagonist destroys factor: +15%
- **At 100%:** Game over ("Patient hemorrhaged")
- **Visual:** Red bar, pulses when increasing, screen vignette at high levels

---

## Controls

### Desktop (Mouse)
- Click + hold floating factor → starts drag
- Drag to slot while holding
- Release on valid slot → place (sink + ripple)
- Release elsewhere → factor returns to stream

### Mobile (Touch)
- Touch + hold factor → starts drag
- Drag with finger to slot
- Release on valid slot → place
- Release elsewhere → returns to stream

### Feedback
- **Catch:** "Grab" sound, scale pop
- **Place:** Sink animation, ripple, success chime
- **Antagonist steal:** Warning flash, dissolve, danger sound
- **Factor escape:** Whoosh, bleeding meter pulse

---

## Membrane Theming

### Surface Textures

| Zone | Texture | Color | Animation |
|------|---------|-------|-----------|
| TF-Cell | Jagged/ruptured endothelium | Dark red-brown | Static pulse |
| Resting Platelet | Smooth curved bilayer | Pale pink | Subtle wobble |
| Activated Platelet | Spiky, charged (PS exposed) | Purple/electric green | Scramblase flip |
| Clot Zone | Fibrin mesh background | Dark + orange glow | Strands appear |

### Scramblase Animation (Propagation Unlock)
- Platelet surface transforms from smooth → spiky
- Color shifts pink → purple (Phosphatidylserine exposure)
- Duration: ~1.5 seconds
- Teaching: Shows why complexes can now assemble here

### Docking Animation (Gla Domain + Ca²⁺)
- Factor "sinks" 3-4px into membrane
- Ripple emanates from placement point
- Small Ca²⁺ sparkles around bond
- Factor settles with subtle bounce

### Ghost Outlines
- Empty slots show faint factor shape (20% opacity)
- Pulses when matching factor dragged nearby

---

## Game States

1. **Playing** - Active gameplay
2. **Phase Transition** - Unlock animation, next phase begins
3. **Victory** - 100% clot integrity, celebration
4. **Defeat** - 100% bleeding, hemorrhage screen

### Victory
- All Clot Zone slots filled
- Cross-link animation plays
- Educational summary displayed

### Defeat
- Bleeding meter maxed
- Screen fades red
- Stats: factors lost to each antagonist

### Post-Game Stats
- Factors caught
- Lost to Antithrombin
- Lost to APC
- Lost to Plasmin
- Time taken

---

## Technical Architecture

### New State Properties

```typescript
interface GameState {
  // Existing properties...

  // Floating factors
  floatingFactors: FloatingFactor[];
  heldFactor: HeldFactor | null;

  // Antagonists
  antagonists: Antagonist[];

  // Bleeding meter
  bleedingMeter: number; // 0-100

  // Surface theming
  plateletActivated: boolean;
}

interface FloatingFactor {
  id: string;
  factorId: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isVulnerableTo: ('antithrombin' | 'apc' | 'plasmin')[];
}

interface HeldFactor {
  id: string;
  factorId: string;
  cursorOffset: { x: number; y: number };
}

interface Antagonist {
  id: string;
  type: 'antithrombin' | 'apc' | 'plasmin';
  position: { x: number; y: number };
  targetFactorId: string | null;
  state: 'patrol' | 'hunting' | 'attacking';
  speed: number;
}
```

### New Components

| Component | Purpose |
|-----------|---------|
| `BloodstreamZone.tsx` | Top stream area, renders floating factors |
| `FloatingFactor.tsx` | Draggable factor in stream |
| `AntagonistSprite.tsx` | Renders antagonist with hunt animation |
| `BleedingMeter.tsx` | Red fill bar with pulse effects |
| `MembraneBackground.tsx` | Textured surface backgrounds per zone |

### Game Loop (60fps via requestAnimationFrame)

1. Update floating factor positions (move rightward)
2. Spawn new factors based on phase timing
3. Update antagonist positions (hunt AI)
4. Check antagonist-factor collisions
5. Check factor escape (off right edge)
6. Update bleeding meter if needed
7. Check win/lose conditions
8. Render frame

---

## Implementation Phases

### Phase A: Bloodstream Foundation
- Remove static FactorPalette
- Add BloodstreamZone component (top 120px)
- Implement FloatingFactor with spawn/movement
- Game loop for position updates
- Phase-based spawn timing

### Phase B: Drag & Drop
- Mouse/touch event handling
- HeldFactor state management
- Cursor-following with weight/lag
- Drop detection on slots
- Return-to-stream animation on invalid drop

### Phase C: Antagonists
- Antithrombin sprite and patrol AI
- Hunt behavior (target nearest vulnerable)
- Collision detection and factor destruction
- Add APC (targets cofactors)
- Add Plasmin (targets fibrin, Stabilization only)
- Bleeding meter integration

### Phase D: Bleeding Meter & Game States
- BleedingMeter component
- Increment on factor loss (escape or destroyed)
- Game over state at 100%
- Victory state on clot completion
- Post-game stats screen

### Phase E: Membrane Theming
- MembraneBackground component with textures
- TF-Cell: Jagged ruptured texture
- Platelet: Smooth wobble texture
- Scramblase animation on Propagation unlock
- Activated Platelet: Spiky purple texture

### Phase F: Docking Polish
- Sink animation (Gla domain binding)
- Ripple effect on placement
- Ca²⁺ sparkle particles
- Ghost outlines for empty slots

### Phase G: Final Polish
- Sound effects (catch, place, steal, escape)
- Phase transition animations
- Victory celebration
- Defeat hemorrhage effect
- Mobile touch optimization

---

## Files to Create/Modify

### New Files
- `components/game/BloodstreamZone.tsx`
- `components/game/FloatingFactor.tsx`
- `components/game/AntagonistSprite.tsx`
- `components/game/BleedingMeter.tsx`
- `components/game/MembraneBackground.tsx`
- `hooks/useGameLoop.ts`
- `hooks/useDragAndDrop.ts`
- `engine/game/antagonist-ai.ts`
- `engine/game/spawn-config.ts`

### Modified Files
- `types/game.ts` - Add new interfaces
- `hooks/useGameState.ts` - Add floating/antagonist reducers
- `components/game/GameCanvas.tsx` - Integrate new zones
- `components/game/SurfacePanel.tsx` - Add membrane backgrounds
- `engine/game/game-config.ts` - Add spawn timing, antagonist speeds
- `app/globals.css` - Membrane textures, new animations

---

## Verification

After each phase:
```bash
npm run build
npm run lint
```

Manual testing:
- Factors spawn and float across bloodstream
- Drag and drop works on desktop and mobile
- Antagonists hunt correct factor types
- Bleeding meter increases on factor loss
- Game over triggers at 100% bleeding
- Victory triggers on clot completion
- Membrane textures display correctly
- Scramblase animation plays on phase unlock
- Docking animation shows sink + ripple
