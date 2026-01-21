# Biomechanics Visual Overhaul - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform factor tokens from generic rectangles into biochemically-accurate "lock and key" protein shapes that teach assembly mechanics through visual design.

**Architecture:** SVG-based vector shapes with CSS/JS animations. Factors get distinct shapes based on biochemical role (enzyme, cofactor, zymogen). Complexes merge into unified shapes when assembled.

**Tech Stack:** React, SVG, CSS animations, existing game infrastructure

---

## 1. Shape System

### 1.1 Shape Categories

| Category | Factors | Shape | Description |
|----------|---------|-------|-------------|
| **Enzyme** | VIIa, IXa, Xa, Thrombin | Pac-Man | Globular with wedge "mouth" (active site cleft). Convex bottom bulge. |
| **Cofactor** | Va, VIIIa | Bean/Seat | Elongated oval with concave socket on top. Stable, flat base. |
| **Zymogen** | FIX, FX, FII, FXI | Blob | Smooth rounded shape, no cleft. Dormant appearance. |
| **Procofactor** | FV, FVIII | Flat Bean | Similar to cofactor but socket is shallow/undefined until activated. |

### 1.2 Color Palette (from reference)

- **Blue shades** (#3B82F6, #2563EB): Intrinsic enzymes (IXa, XIa)
- **Teal/Cyan** (#06B6D4, #0891B2): Common pathway (Xa, Thrombin)
- **Orange** (#F97316, #EA580C): Cofactors (Va, VIIIa)
- **Green** (#22C55E, #16A34A): Zymogens (inactive forms)
- **Purple** (#9333EA): Activated platelet surface

### 1.3 SVG Specifications

**Enzyme (60x50 viewBox):**
```svg
- Main body: ~45px diameter rounded blob
- Active site: 30° wedge cut into right side
- Convex bottom: Bulge that interlocks with cofactor
- Idle: 2% scale wobble animation (unstable alone)
```

**Cofactor (80x35 viewBox):**
```svg
- Elongated kidney/bean shape
- Concave socket: Curved indent on top matching enzyme bulge
- Inner shadow in socket for depth
- Static, stable (no wobble)
```

**Zymogen (55x50 viewBox):**
```svg
- Smooth rounded blob
- NO cleft or active site
- Lower color saturation
- Static, dormant
```

**Merged Complex (80x70 viewBox):**
```svg
- Enzyme seated in cofactor socket
- Single continuous outline
- Active site faces outward
- Breathing pulse: 3% scale at 2s interval
- Glow effect on perimeter
```

---

## 2. Three-State Asset System

### State A: Enzyme (The "Key")
- Shape: Globular with convex bottom bump
- Behavior: Wobbly idle animation (unstable alone)
- Meaning: "Needs a partner to function"

### State B: Cofactor (The "Lock")
- Shape: Elongated with concave top socket
- Behavior: Static, waiting
- Meaning: "Empty chair awaiting enzyme"

### State C: Merged Complex (The "Machine")
- Implementation: Unmount individual tokens, mount unified SVG
- Behavior: Breathing animation (unified expansion/contraction)
- Meaning: "Now one functional unit"

---

## 3. Animation Specifications

### 3.1 Activation Animation (Zymogen → Enzyme)
```
Trigger: Factor converts (e.g., FX → FXa via proteolysis)
Duration: 400ms

Timeline:
  0-100ms:  "Cut line" appears - diagonal slash across zymogen
  100-250ms: Fragment "falls away" (opacity fade + downward drift)
  250-400ms: Shape morphs - cleft "opens" where cut occurred

VFX: Golden particle burst at cut point (Ca²⁺ spark)
Sound: Sharp "snip"
```

### 3.2 Complex Assembly Animation
```
Trigger: Both enzyme + cofactor slots filled
Duration: 300ms

Timeline:
  0-150ms:   Both shapes slide toward each other
  150-200ms: "Click" - shapes lock together
  200-300ms: Flash, unified outline appears
  Continuous: Breathing pulse begins (2s cycle)

VFX: Ring pulse outward on lock
Sound: Satisfying "click"
```

### 3.3 Product Ejection Animation
```
Trigger: Complex produces output (Tenase → FXa, Prothrombinase → Thrombin)
Duration: 500ms

Timeline:
  0-100ms:   Product spawns AT active site cleft (not center)
  100-400ms: Bézier arc trajectory to destination
  400-500ms: Landing with bounce

VFX: Particle trail during flight, puff on spawn
Origin: Enzyme's "mouth" (active site)
```

### 3.4 Inhibition Animation (The "Arrest")
```
Trigger: Antagonist (AT, APC) targets enzyme/complex
Duration: 400ms

Timeline:
  0-200ms:  Dark "shackle" icon clamps onto active site
  200-400ms: Breathing stops, color desaturates to grey

VFX: Shackle locks over the cleft
Effect: Complex becomes non-functional
```

### 3.5 Surface Morph Animation
```
Trigger: Phase change (Amplification → Propagation)
Duration: 1500ms

Visual: Smooth pink lipid bilayer ripples and transforms
        into spiky, electric-purple activated platelet texture

Already partially implemented in MembraneBackground.tsx
Enhancement: Add ripple shader effect during transition
```

---

## 4. Component Architecture

### New Components

```
components/game/
├── shapes/
│   ├── EnzymeShape.tsx      # Pac-Man SVG with active site
│   ├── CofactorShape.tsx    # Bean/seat SVG with socket
│   ├── ZymogenShape.tsx     # Smooth blob SVG
│   ├── MergedComplex.tsx    # Combined enzyme+cofactor
│   └── ShapeConfig.ts       # SVG paths and dimensions per factor
├── FactorToken.tsx          # Updated to use shape components
└── ComplexAssembly.tsx      # Handles merge logic
```

### FactorToken Updates

```typescript
// Determine shape based on factor category and activation state
function getShapeComponent(factor: FactorDefinition, isActive: boolean) {
  if (factor.category === 'enzyme') return EnzymeShape;
  if (factor.category === 'cofactor') return CofactorShape;
  if (factor.category === 'zymogen' && isActive) return EnzymeShape; // Activated
  if (factor.category === 'zymogen') return ZymogenShape;
  if (factor.category === 'procofactor' && isActive) return CofactorShape;
  if (factor.category === 'procofactor') return ZymogenShape;
}
```

### ComplexAssembly Component

```typescript
interface ComplexAssemblyProps {
  type: 'tenase' | 'prothrombinase';
  enzyme: FactorDefinition | null;
  cofactor: FactorDefinition | null;
  onProductEject?: (factorId: string) => void;
}

// Renders individual slots OR merged complex based on completion
```

---

## 5. Factor-to-Shape Mapping

| Factor | Inactive Shape | Active Shape | Color |
|--------|---------------|--------------|-------|
| FVII → FVIIa | Zymogen | Enzyme | #F59E0B (amber) |
| FIX → FIXa | Zymogen | Enzyme | #3B82F6 (blue) |
| FX → FXa | Zymogen | Enzyme | #06B6D4 (cyan) |
| FII → Thrombin | Zymogen | Enzyme | #0891B2 (teal) |
| FXI → FXIa | Zymogen | Enzyme | #6366F1 (indigo) |
| FV → FVa | Procofactor | Cofactor | #F97316 (orange) |
| FVIII → FVIIIa | Procofactor | Cofactor | #A855F7 (purple) |

---

## 6. Files to Modify

| File | Changes |
|------|---------|
| `components/game/FactorToken.tsx` | Replace rectangle with shape components |
| `components/game/SurfacePanel.tsx` | Use ComplexAssembly for complex slots |
| `types/game.ts` | Add shape-related type definitions |
| `engine/game/factor-definitions.ts` | Ensure category field is accurate |
| `app/globals.css` | Add shape animations (wobble, breathing, cut) |

## 7. New Files to Create

| File | Purpose |
|------|---------|
| `components/game/shapes/EnzymeShape.tsx` | Pac-Man SVG component |
| `components/game/shapes/CofactorShape.tsx` | Bean/seat SVG component |
| `components/game/shapes/ZymogenShape.tsx` | Smooth blob SVG component |
| `components/game/shapes/MergedComplex.tsx` | Combined complex SVG |
| `components/game/shapes/ShapeConfig.ts` | SVG paths, dimensions, colors |
| `components/game/shapes/index.ts` | Barrel export |
| `components/game/ComplexAssembly.tsx` | Merge logic component |

---

## 8. Success Criteria

1. **Visual Distinction**: Enzymes, cofactors, and zymogens are immediately distinguishable by shape
2. **Lock and Key**: Enzyme's convex bottom visually fits into cofactor's concave socket
3. **Activation Clarity**: Zymogen → Enzyme transformation shows "cleft opening" animation
4. **Assembly Satisfaction**: Complex completion has clear "snap together" feedback
5. **Pedagogical Value**: Players intuitively understand that parts must combine to function
6. **Performance**: SVG animations run at 60fps, no jank

---

## 9. Out of Scope (Future)

- Spark vs Burst thrombin particle differentiation
- Fibrin mesh procedural weaving
- Living membrane ripple shaders
- 3D protein renders

These can be added in subsequent visual polish passes.
