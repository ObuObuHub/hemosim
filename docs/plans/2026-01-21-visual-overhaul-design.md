# Visual Overhaul Design: Scene-Based Coagulation Cascade

> **Design Principle:** TEXTBOOK FIRST, GAMIFICATION SECOND
>
> Every visual and mechanical decision must be biologically accurate first, then made interactive/fun without breaking accuracy.

**Goal:** Transform the game from abstract colored panels to a scientifically accurate, illustrated visual style matching textbook coagulation cascade diagrams.

**Architecture:** Three distinct scenes (Initiation → Amplification → Propagation) with automatic transitions. Player catches floating factors and puzzle-docks them onto phospholipid membrane surfaces to build enzyme complexes.

---

## Scene Flow

```
Initiation → (auto) → Amplification → (auto) → Propagation → Victory
```

**Core Loop per Scene:**
1. Factors spawn and float in bloodstream area (top portion)
2. Player taps to catch, drags to membrane surface (bottom portion)
3. Puzzle-dock: enzyme's Pac-man bite fits into cofactor's side concave curve
4. Complex activates → dynamic arrow pulses → product released
5. When scene objectives complete → fade transition to next scene

---

## Scene 1: Initiation

**Visual Layout:**
- **Top 40%:** Bloodstream area - dark red/maroon gradient with subtle flow animation
- **Bottom 60%:** TF-bearing fibroblast surface - tan/beige phospholipid membrane with embedded Y-shaped TF proteins

**Membrane Details:**
- Phospholipid bilayer with visible "lollipop" heads (small circles on stalks)
- 3-4 TF proteins (Y-shapes) embedded at intervals
- Wavy organic top edge, not a straight line
- Subtle depth shading to show it's a surface

**Objectives:**
1. Catch FX (green oval) → dock with TF+VIIa complex → becomes FXa (teal Pac-man)
2. Catch FV (orange rectangle) → puzzle-dock side-by-side with FXa → form Prothrombinase
3. Prothrombinase produces thrombin (blue Pac-man, glowing)
4. **Player catches thrombin → drags to platelet surface (visible at edge) → platelet activates**

**Transition Trigger:** Platelet activation triggers fade to Amplification

---

## Scene 2: Amplification

**Visual Layout:**
- **Top 40%:** Bloodstream with more factors floating
- **Bottom 60%:** Activated platelet membrane - phospholipid bilayer in pink/salmon tones, irregular "activated" appearance

**Membrane Details:**
- Phospholipid bilayer in pink/salmon tones
- More irregular, bumpy platelet shape
- Multiple docking sites visible

**Objectives:**
1. Catch FIX (green oval) → dock → activated by trace thrombin → becomes FIXa (blue Pac-man)
2. Catch FVIII (purple rectangle) → activated by thrombin → becomes FVIIIa
3. Puzzle-dock FIXa + FVIIIa side-by-side on membrane → form **Tenase Complex**
4. Tenase produces FXa (multiple) → float up into bloodstream
5. Catch FV → thrombin activates → FVa
6. Catch FXa + puzzle-dock with FVa → form **Prothrombinase** on platelet surface

**Transition Trigger:** Prothrombinase assembled on platelet triggers fade to Propagation

---

## Scene 3: Propagation

**Visual Layout:**
- **Top 30%:** Bloodstream with fibrinogen (yellow elongated ovals) floating
- **Middle 30%:** Active zone where thrombin burst happens
- **Bottom 40%:** Activated platelet surface with Prothrombinase from previous scene

**Objectives:**
1. Prothrombinase (already assembled) starts producing thrombin rapidly
2. Player catches a few FX and FV to build one more Prothrombinase (reinforcing cascade)
3. **Thrombin Burst:** Glowing Pac-man thrombin molecules move rapidly between fibrinogen ovals
4. Each thrombin "bites" fibrinogen → transforms into green fibrin rod
5. Fibrin rod ends light up (sticky) → snap to adjacent strands → form mesh

**Fibrin Mesh Visual:**
- Fibrin strands animate outward from conversion points
- Strands connect via "sticky ends" forming net/mesh pattern
- Mesh gradually fills the wound area
- Satisfying "web weaving" animation

**Victory Trigger:** Fibrin mesh reaches critical density → "Clot Stabilized!" → Victory screen

---

## Visual Components

### Factor Token Shapes (Bio-Accurate)

| Type | Shape | Size | Visual Details |
|------|-------|------|----------------|
| Zymogen (FIX, FX, FII) | Rounded oval/pill | 50x35px | Gradient fill. FII (Prothrombin) same shape, distinct blue color |
| Enzyme (FIXa, FXa, IIa) | Pac-man with bite | 45x40px | Wedge cut on right side (active site). IIa (Thrombin) = Pac-man with glow/pulse |
| Cofactor (FVa, FVIIIa) | Rounded rectangle | 55x30px | Concave SIDE edge for horizontal dock, sits flat on membrane |
| Fibrinogen | Elongated oval | 60x25px | Yellow/gold |
| Fibrin | Rod with sticky ends | Variable | Ends "light up" when activated, snap to other fibrin |
| TF Protein | Y-shape | 40x50px | Brown, embedded in fibroblast membrane |

### Puzzle-Dock Mechanics (Side-by-Side)

```
[Cofactor]──[Enzyme]   (horizontal, both touching membrane)
     ════════════════   (membrane surface)
```

- Enzyme's right-side bite (~15px wedge) fits into cofactor's left-side concave curve (~15px)
- Both remain flat on membrane, visually showing membrane interaction is required
- When within 20px and horizontally aligned → subtle magnetic pull
- Snap sound + glow effect on successful dock

### Membrane Layer

- SVG pattern of phospholipid heads (small circles on short lines)
- Repeating pattern, slightly randomized for organic feel
- Depth gradient (lighter at top, darker below)
- Wavy top edge, not straight
- Scene-specific coloring:
  - Initiation: Tan/beige (fibroblast)
  - Amplification/Propagation: Pink/salmon (activated platelet)

### Activation Arrows

- Curved SVG path with animated stroke-dashoffset (flowing effect)
- Appear on activation event, pulse 2-3 times, fade out over 500ms
- Color matches the product being created

### Thrombin → Fibrinogen Animation

- Glowing Pac-man thrombin moves rapidly between fibrinogen ovals
- Each contact = "bite" animation (Pac-man mouth closes briefly)
- Fibrinogen oval immediately transforms into green fibrin rod
- Fibrin rod ends light up, snap to adjacent strands
- Teaches: Thrombin CUTS/MODIFIES fibrinogen, doesn't magically transform it

---

## Technical Approach

### State Management

```typescript
type GameScene = 'initiation' | 'amplification' | 'propagation' | 'victory';

interface SceneState {
  scene: GameScene;
  floatingFactors: FloatingFactor[];
  dockedComplexes: Complex[];
  activationArrows: Arrow[];
  fibrinStrands: FibrinStrand[];  // Propagation only
  objectives: Objective[];
}
```

### Scene Transition Logic

- Each scene has `objectives: Objective[]` with completion conditions
- When all objectives met → trigger 500ms fade → load next scene
- Scene components are lazy-loaded (only mount active scene)

### Rendering Approach

- **Membrane:** Static SVG background per scene (phospholipid pattern)
- **Factors:** React components with absolute positioning
- **Docking:** Collision detection checks horizontal alignment + proximity
- **Arrows:** SVG paths with CSS stroke-dashoffset animation
- **Fibrin mesh:** Canvas overlay for performance (many strands)

### File Structure

```
components/game/
├── scenes/
│   ├── InitiationScene.tsx
│   ├── AmplificationScene.tsx
│   ├── PropagationScene.tsx
│   └── VictoryScene.tsx
├── visuals/
│   ├── MembraneLayer.tsx
│   ├── TFProtein.tsx
│   ├── FibrinMesh.tsx
│   └── ActivationArrow.tsx
├── factors/
│   ├── ZymogenToken.tsx       # Oval (FIX, FX, FII)
│   ├── EnzymeToken.tsx        # Pac-man (FIXa, FXa, IIa)
│   ├── CofactorToken.tsx      # Rectangle (FVa, FVIIIa)
│   └── FibrinogenToken.tsx    # Elongated oval
└── mechanics/
    ├── PuzzleDock.tsx         # Side-by-side docking logic
    └── SceneTransition.tsx    # Fade between scenes
```

### What Gets Replaced

| Current | New |
|---------|-----|
| `SurfacePanel.tsx` (4 panels) | `InitiationScene.tsx`, `AmplificationScene.tsx`, `PropagationScene.tsx` |
| `ZymogenShape.tsx` (blob) | `ZymogenToken.tsx` (oval), `EnzymeToken.tsx` (Pac-man), `CofactorToken.tsx` |
| Abstract colored panels | `MembraneLayer.tsx` (phospholipid SVG) |
| `useGameState.ts` | Refactor for scene-based flow |

### What Gets Kept

- Core drag/drop mechanics (refactored for puzzle-dock)
- Factor spawning logic (adapted per scene)
- Game loop timing

---

## Design Principle Applied

**TEXTBOOK FIRST, GAMIFICATION SECOND**

| Decision | Textbook | Gamification |
|----------|----------|--------------|
| Thrombin shape | Pac-man enzyme (same as FXa, FIXa) | Glows/pulses to show activity |
| Complex docking | Side-by-side on membrane | Satisfying snap sound + glow |
| Thrombin action | "Bites" fibrinogen (proteolytic cut) | Fast, satisfying animation |
| Factor shapes | Match biochemical role | Colorful, easy to distinguish |
| Membrane surface | Phospholipid bilayer | Subtle animation, organic feel |
