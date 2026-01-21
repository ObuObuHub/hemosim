# Visual Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the coagulation game from abstract colored panels to scientifically accurate scene-based gameplay with phospholipid membranes, bio-accurate factor shapes, and puzzle-dock mechanics.

**Architecture:** Replace current 4-panel layout with 3 sequential scenes (Initiation → Amplification → Propagation). Each scene has a membrane surface, floating factors in bloodstream, and puzzle-dock assembly. Auto-transition when objectives complete.

**Tech Stack:** React 18, Next.js 14, TypeScript, SVG for shapes, CSS animations for arrows/transitions

**Design Principle:** TEXTBOOK FIRST, GAMIFICATION SECOND

---

## Phase 1: Foundation - New Types & Scene State

### Task 1.1: Add Scene Types

**Files:**
- Modify: `types/game.ts`

**Step 1: Add scene-related types to types/game.ts**

Add after line 89 (after GamePhase definition):

```typescript
// =============================================================================
// SCENE TYPES (Visual Overhaul)
// =============================================================================

export type GameScene = 'initiation' | 'amplification' | 'propagation' | 'victory';

export interface SceneObjective {
  id: string;
  description: string;
  isComplete: boolean;
}

export interface DockedComplex {
  id: string;
  complexType: 'tf-viia' | 'prothrombinase-init' | 'tenase' | 'prothrombinase';
  enzymeFactorId: string | null;
  cofactorFactorId: string | null;
  position: { x: number; y: number };
  isComplete: boolean;
}

export interface FibrinStrand {
  id: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  connectedTo: string[]; // IDs of other strands
  opacity: number;
}

export interface ActivationArrow {
  id: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  color: string;
  progress: number; // 0-1 for animation
  expiresAt: number;
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors (types are additive)

**Step 3: Commit**

```bash
git add types/game.ts
git commit -m "feat(types): add scene types for visual overhaul"
```

---

### Task 1.2: Add Factor Shape Types

**Files:**
- Modify: `types/game.ts`

**Step 1: Add bio-accurate factor shape types**

Add after the SceneObjective types:

```typescript
// =============================================================================
// FACTOR SHAPE TYPES (Bio-Accurate)
// =============================================================================

/**
 * Bio-accurate shape types based on biochemical role
 * - zymogen: Rounded oval (inactive enzyme precursor)
 * - enzyme: Pac-man with bite (active site visible)
 * - cofactor: Rounded rectangle with side socket
 * - fibrinogen: Elongated oval
 * - fibrin: Rod with sticky ends
 */
export type BioShapeType = 'zymogen' | 'enzyme' | 'cofactor' | 'fibrinogen' | 'fibrin';

export interface FactorVisual {
  factorId: string;
  inactiveShape: BioShapeType;
  activeShape: BioShapeType;
  inactiveColor: string;
  activeColor: string;
  width: number;
  height: number;
}

/**
 * Puzzle-dock configuration for enzyme-cofactor pairing
 */
export interface DockConfig {
  enzymeFactorId: string;
  cofactorFactorId: string;
  /** Horizontal offset where enzyme bite meets cofactor socket */
  dockOffset: { x: number; y: number };
  /** Snap distance in pixels */
  snapDistance: number;
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add types/game.ts
git commit -m "feat(types): add bio-accurate factor shape types"
```

---

### Task 1.3: Create Factor Visual Definitions

**Files:**
- Create: `engine/game/factor-visuals.ts`

**Step 1: Create the factor visuals file**

```typescript
// engine/game/factor-visuals.ts
import type { FactorVisual, DockConfig } from '@/types/game';

/**
 * Bio-accurate visual definitions for each factor
 * TEXTBOOK FIRST: Shapes match biochemical role
 */
export const FACTOR_VISUALS: Record<string, FactorVisual> = {
  // Zymogens (inactive) → Enzymes (active)
  FIX: {
    factorId: 'FIX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#22C55E', // green
    activeColor: '#3B82F6', // blue
    width: 50,
    height: 35,
  },
  FX: {
    factorId: 'FX',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#14B8A6', // teal
    activeColor: '#3B82F6', // blue
    width: 50,
    height: 35,
  },
  FII: {
    factorId: 'FII',
    inactiveShape: 'zymogen',
    activeShape: 'enzyme',
    inactiveColor: '#3B82F6', // blue (prothrombin)
    activeColor: '#3B82F6', // blue (thrombin - glows)
    width: 50,
    height: 35,
  },
  // Cofactors
  FV: {
    factorId: 'FV',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#F97316', // orange (dimmer)
    activeColor: '#F97316', // orange
    width: 55,
    height: 30,
  },
  FVIII: {
    factorId: 'FVIII',
    inactiveShape: 'cofactor',
    activeShape: 'cofactor',
    inactiveColor: '#A855F7', // purple (dimmer)
    activeColor: '#A855F7', // purple
    width: 55,
    height: 30,
  },
  // Fibrinogen/Fibrin
  Fibrinogen: {
    factorId: 'Fibrinogen',
    inactiveShape: 'fibrinogen',
    activeShape: 'fibrin',
    inactiveColor: '#EAB308', // yellow
    activeColor: '#22C55E', // green (fibrin)
    width: 60,
    height: 25,
  },
};

/**
 * Get visual definition for a factor
 */
export function getFactorVisual(factorId: string): FactorVisual | null {
  // Handle activated forms (FIXa, FXa, etc.)
  const baseId = factorId.replace(/a$/, '');
  return FACTOR_VISUALS[baseId] ?? FACTOR_VISUALS[factorId] ?? null;
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
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add engine/game/factor-visuals.ts
git commit -m "feat(engine): add bio-accurate factor visual definitions"
```

---

## Phase 2: Visual Components - Factor Tokens

### Task 2.1: Create Zymogen Token (Oval Shape)

**Files:**
- Create: `components/game/tokens/ZymogenToken.tsx`

**Step 1: Create the component**

```typescript
// components/game/tokens/ZymogenToken.tsx
'use client';

interface ZymogenTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Zymogen shape: Rounded oval/pill
 * Represents inactive enzyme precursors (FIX, FX, FII)
 * TEXTBOOK: Zymogens are dormant, smooth shapes
 */
export function ZymogenToken({
  color,
  label,
  width = 50,
  height = 35,
  style,
}: ZymogenTokenProps): React.ReactElement {
  const id = `zymogen-${label}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      className="zymogen-token"
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="50%" stopColor={color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Rounded oval/pill shape */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - 2}
        ry={height / 2 - 2}
        fill={`url(#${id}-gradient)`}
        stroke={color}
        strokeWidth={2}
        filter={`url(#${id}-shadow)`}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>
    </svg>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/tokens/ZymogenToken.tsx
git commit -m "feat(ui): add ZymogenToken component (oval shape)"
```

---

### Task 2.2: Create Enzyme Token (Pac-man Shape)

**Files:**
- Create: `components/game/tokens/EnzymeToken.tsx`

**Step 1: Create the component**

```typescript
// components/game/tokens/EnzymeToken.tsx
'use client';

interface EnzymeTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  isGlowing?: boolean; // For thrombin burst effect
  style?: React.CSSProperties;
}

/**
 * Enzyme shape: Pac-man with active site "bite"
 * Represents active serine proteases (FIXa, FXa, IIa/Thrombin)
 * TEXTBOOK: Active site is where catalysis happens
 */
export function EnzymeToken({
  color,
  label,
  width = 45,
  height = 40,
  isGlowing = false,
  style,
}: EnzymeTokenProps): React.ReactElement {
  const id = `enzyme-${label}`;

  // Pac-man path: circle with wedge cut out on right side
  // Active site faces right (where substrate binds)
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 3;
  const biteAngle = 35; // degrees for the "bite"

  // Calculate bite points
  const startAngle = biteAngle * (Math.PI / 180);
  const endAngle = -biteAngle * (Math.PI / 180);

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);

  const pacmanPath = `
    M ${cx} ${cy}
    L ${x1} ${y1}
    A ${r} ${r} 0 1 0 ${x2} ${y2}
    Z
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      className={`enzyme-token ${isGlowing ? 'enzyme-glowing' : ''}`}
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
          <stop offset="50%" stopColor={color} stopOpacity={0.8} />
          <stop offset="100%" stopColor={color} stopOpacity={0.95} />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
        {isGlowing && (
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Pac-man shape with bite (active site) */}
      <path
        d={pacmanPath}
        fill={`url(#${id}-gradient)`}
        stroke={color}
        strokeWidth={2}
        filter={isGlowing ? `url(#${id}-glow)` : `url(#${id}-shadow)`}
      />

      {/* Label - offset left to avoid bite */}
      <text
        x={cx - 4}
        y={cy + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>
    </svg>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/tokens/EnzymeToken.tsx
git commit -m "feat(ui): add EnzymeToken component (Pac-man with active site)"
```

---

### Task 2.3: Create Cofactor Token (Rectangle with Side Socket)

**Files:**
- Create: `components/game/tokens/CofactorToken.tsx`

**Step 1: Create the component**

```typescript
// components/game/tokens/CofactorToken.tsx
'use client';

interface CofactorTokenProps {
  color: string;
  label: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Cofactor shape: Rounded rectangle with concave SIDE socket
 * Represents cofactors (FVa, FVIIIa)
 * TEXTBOOK: Cofactor sits side-by-side with enzyme on membrane
 * The socket receives the enzyme's "bite" (active site)
 */
export function CofactorToken({
  color,
  label,
  width = 55,
  height = 30,
  style,
}: CofactorTokenProps): React.ReactElement {
  const id = `cofactor-${label}`;

  // Rectangle with concave socket on LEFT side for enzyme docking
  // Both enzyme and cofactor remain flat on membrane (side-by-side)
  const socketDepth = 8;
  const socketHeight = 16;
  const cornerRadius = 6;
  const socketY = (height - socketHeight) / 2;

  const cofactorPath = `
    M ${cornerRadius} 0
    H ${width - cornerRadius}
    Q ${width} 0 ${width} ${cornerRadius}
    V ${height - cornerRadius}
    Q ${width} ${height} ${width - cornerRadius} ${height}
    H ${cornerRadius}
    Q 0 ${height} 0 ${height - cornerRadius}
    V ${socketY + socketHeight}
    Q ${socketDepth} ${socketY + socketHeight} ${socketDepth} ${socketY + socketHeight / 2}
    Q ${socketDepth} ${socketY} 0 ${socketY}
    V ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    Z
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      className="cofactor-token"
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="50%" stopColor={color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Cofactor shape with side socket */}
      <path
        d={cofactorPath}
        fill={`url(#${id}-gradient)`}
        stroke={color}
        strokeWidth={2}
        filter={`url(#${id}-shadow)`}
      />

      {/* Label */}
      <text
        x={width / 2 + 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>
    </svg>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/tokens/CofactorToken.tsx
git commit -m "feat(ui): add CofactorToken component (rectangle with side socket)"
```

---

### Task 2.4: Create Fibrinogen/Fibrin Tokens

**Files:**
- Create: `components/game/tokens/FibrinogenToken.tsx`

**Step 1: Create the component**

```typescript
// components/game/tokens/FibrinogenToken.tsx
'use client';

interface FibrinogenTokenProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Fibrinogen shape: Elongated oval (yellow)
 * TEXTBOOK: Fibrinogen is the substrate for thrombin
 */
export function FibrinogenToken({
  width = 60,
  height = 25,
  style,
}: FibrinogenTokenProps): React.ReactElement {
  const id = 'fibrinogen';
  const color = '#EAB308'; // yellow

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      className="fibrinogen-token"
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="50%" stopColor={color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="1" dy="2" stdDeviation="1" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Elongated oval */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - 2}
        ry={height / 2 - 2}
        fill={`url(#${id}-gradient)`}
        stroke={color}
        strokeWidth={1.5}
        filter={`url(#${id}-shadow)`}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 3}
        textAnchor="middle"
        fontSize={8}
        fontWeight={600}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}
      >
        Fbg
      </text>
    </svg>
  );
}

interface FibrinStrandTokenProps {
  length?: number;
  stickyEnds?: boolean;
  style?: React.CSSProperties;
}

/**
 * Fibrin strand: Rod with sticky ends
 * TEXTBOOK: Fibrin monomers polymerize via sticky ends
 */
export function FibrinStrandToken({
  length = 50,
  stickyEnds = true,
  style,
}: FibrinStrandTokenProps): React.ReactElement {
  const height = 8;
  const color = '#22C55E'; // green
  const endRadius = stickyEnds ? 5 : 3;

  return (
    <svg
      width={length}
      height={height + endRadius * 2}
      viewBox={`0 0 ${length} ${height + endRadius * 2}`}
      style={style}
      className="fibrin-strand-token"
    >
      {/* Main rod */}
      <rect
        x={endRadius}
        y={endRadius}
        width={length - endRadius * 2}
        height={height}
        rx={2}
        fill={color}
        opacity={0.9}
      />

      {/* Sticky ends (glow when active) */}
      {stickyEnds && (
        <>
          <circle
            cx={endRadius}
            cy={endRadius + height / 2}
            r={endRadius}
            fill={color}
            className="fibrin-sticky-end"
          />
          <circle
            cx={length - endRadius}
            cy={endRadius + height / 2}
            r={endRadius}
            fill={color}
            className="fibrin-sticky-end"
          />
        </>
      )}
    </svg>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/tokens/FibrinogenToken.tsx
git commit -m "feat(ui): add Fibrinogen and FibrinStrand token components"
```

---

### Task 2.5: Create Token Index and FactorToken Wrapper

**Files:**
- Create: `components/game/tokens/index.ts`
- Create: `components/game/tokens/FactorTokenNew.tsx`

**Step 1: Create the index file**

```typescript
// components/game/tokens/index.ts
export { ZymogenToken } from './ZymogenToken';
export { EnzymeToken } from './EnzymeToken';
export { CofactorToken } from './CofactorToken';
export { FibrinogenToken, FibrinStrandToken } from './FibrinogenToken';
export { FactorTokenNew } from './FactorTokenNew';
```

**Step 2: Create the wrapper component**

```typescript
// components/game/tokens/FactorTokenNew.tsx
'use client';

import { ZymogenToken } from './ZymogenToken';
import { EnzymeToken } from './EnzymeToken';
import { CofactorToken } from './CofactorToken';
import { FibrinogenToken } from './FibrinogenToken';
import { getFactorVisual, isActivatedFactor } from '@/engine/game/factor-visuals';

interface FactorTokenNewProps {
  factorId: string;
  isActive?: boolean;
  isGlowing?: boolean;
  style?: React.CSSProperties;
}

/**
 * Unified factor token component
 * Automatically selects the correct shape based on factor type and activation state
 * TEXTBOOK FIRST: Shape represents biochemical role
 */
export function FactorTokenNew({
  factorId,
  isActive,
  isGlowing = false,
  style,
}: FactorTokenNewProps): React.ReactElement | null {
  const visual = getFactorVisual(factorId);
  if (!visual) {
    console.warn(`No visual definition for factor: ${factorId}`);
    return null;
  }

  // Determine if this is an activated form
  const activated = isActive ?? isActivatedFactor(factorId);
  const shape = activated ? visual.activeShape : visual.inactiveShape;
  const color = activated ? visual.activeColor : visual.inactiveColor;

  // Determine label (e.g., FIX → FIXa when active)
  const label = activated && !factorId.endsWith('a')
    ? `${factorId}a`
    : factorId;

  switch (shape) {
    case 'zymogen':
      return (
        <ZymogenToken
          color={color}
          label={label}
          width={visual.width}
          height={visual.height}
          style={style}
        />
      );

    case 'enzyme':
      return (
        <EnzymeToken
          color={color}
          label={label}
          width={visual.width}
          height={visual.height}
          isGlowing={isGlowing}
          style={style}
        />
      );

    case 'cofactor':
      return (
        <CofactorToken
          color={color}
          label={label}
          width={visual.width}
          height={visual.height}
          style={style}
        />
      );

    case 'fibrinogen':
      return <FibrinogenToken width={visual.width} height={visual.height} style={style} />;

    default:
      return null;
  }
}
```

**Step 3: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add components/game/tokens/
git commit -m "feat(ui): add FactorTokenNew wrapper for bio-accurate tokens"
```

---

## Phase 3: Membrane Layer

### Task 3.1: Create Phospholipid Membrane Component

**Files:**
- Create: `components/game/visuals/PhospholipidMembrane.tsx`

**Step 1: Create the component**

```typescript
// components/game/visuals/PhospholipidMembrane.tsx
'use client';

interface PhospholipidMembraneProps {
  width: number;
  height: number;
  variant: 'fibroblast' | 'platelet';
  className?: string;
}

/**
 * Phospholipid bilayer membrane surface
 * TEXTBOOK: Membrane is where coagulation complexes assemble
 * Visual: Tan/beige for fibroblast, pink/salmon for activated platelet
 */
export function PhospholipidMembrane({
  width,
  height,
  variant,
  className,
}: PhospholipidMembraneProps): React.ReactElement {
  const colors = variant === 'fibroblast'
    ? { light: '#D4A574', dark: '#A67B5B', head: '#E8D4B8' }
    : { light: '#F9A8D4', dark: '#EC4899', head: '#FDF2F8' };

  // Generate phospholipid head positions (randomized but consistent)
  const headSpacing = 12;
  const headCount = Math.floor(width / headSpacing);
  const heads = Array.from({ length: headCount }, (_, i) => ({
    x: i * headSpacing + headSpacing / 2 + (Math.sin(i * 1.5) * 2),
    y: 8 + (Math.cos(i * 2) * 2),
  }));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Gradient for membrane depth */}
        <linearGradient id={`membrane-gradient-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="40%" stopColor={colors.dark} stopOpacity={0.8} />
          <stop offset="100%" stopColor={colors.dark} />
        </linearGradient>
      </defs>

      {/* Wavy top edge path */}
      <path
        d={generateWavyPath(width, height)}
        fill={`url(#membrane-gradient-${variant})`}
      />

      {/* Phospholipid heads (lollipop pattern) */}
      {heads.map((head, i) => (
        <g key={i}>
          {/* Tail (line) */}
          <line
            x1={head.x}
            y1={head.y}
            x2={head.x}
            y2={head.y + 15}
            stroke={colors.dark}
            strokeWidth={1.5}
            opacity={0.5}
          />
          {/* Head (circle) */}
          <circle
            cx={head.x}
            cy={head.y}
            r={4}
            fill={colors.head}
            stroke={colors.dark}
            strokeWidth={0.5}
            opacity={0.8}
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * Generate a wavy path for the top edge of the membrane
 */
function generateWavyPath(width: number, height: number): string {
  const waveHeight = 8;
  const waveCount = Math.floor(width / 40);
  let path = `M 0 ${waveHeight}`;

  for (let i = 0; i < waveCount; i++) {
    const x1 = (i * width) / waveCount + width / waveCount / 4;
    const x2 = (i * width) / waveCount + (width / waveCount / 4) * 3;
    const x3 = ((i + 1) * width) / waveCount;
    const y1 = waveHeight - 4;
    const y2 = waveHeight + 4;

    path += ` Q ${x1} ${y1}, ${x2} ${y2} T ${x3} ${waveHeight}`;
  }

  path += ` L ${width} ${height} L 0 ${height} Z`;
  return path;
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/visuals/PhospholipidMembrane.tsx
git commit -m "feat(ui): add PhospholipidMembrane component with lollipop heads"
```

---

### Task 3.2: Create TF Protein Component

**Files:**
- Create: `components/game/visuals/TFProtein.tsx`

**Step 1: Create the component**

```typescript
// components/game/visuals/TFProtein.tsx
'use client';

interface TFProteinProps {
  x: number;
  y: number;
  isActive?: boolean;
}

/**
 * Tissue Factor (TF) protein embedded in membrane
 * TEXTBOOK: TF is the initiator of coagulation, Y-shaped transmembrane protein
 */
export function TFProtein({
  x,
  y,
  isActive = true,
}: TFProteinProps): React.ReactElement {
  const width = 30;
  const height = 45;
  const color = isActive ? '#8B4513' : '#A0A0A0';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y,
      }}
      className="tf-protein"
    >
      {/* Y-shaped transmembrane protein */}
      {/* Stem (transmembrane domain) */}
      <rect
        x={12}
        y={20}
        width={6}
        height={25}
        fill={color}
        rx={2}
      />

      {/* Left arm */}
      <path
        d="M 15 20 L 5 5 L 8 3 L 15 15"
        fill={color}
      />

      {/* Right arm */}
      <path
        d="M 15 20 L 25 5 L 22 3 L 15 15"
        fill={color}
      />

      {/* Label */}
      <text
        x={15}
        y={38}
        textAnchor="middle"
        fontSize={7}
        fontWeight={600}
        fill="#FFFFFF"
      >
        TF
      </text>
    </svg>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/visuals/TFProtein.tsx
git commit -m "feat(ui): add TFProtein component (Y-shaped transmembrane)"
```

---

### Task 3.3: Create Activation Arrow Component

**Files:**
- Create: `components/game/visuals/ActivationArrow.tsx`

**Step 1: Create the component**

```typescript
// components/game/visuals/ActivationArrow.tsx
'use client';

import { useEffect, useState } from 'react';

interface ActivationArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  onComplete?: () => void;
}

/**
 * Dynamic activation arrow that pulses and fades
 * TEXTBOOK: Shows conversion/activation pathway
 */
export function ActivationArrow({
  fromX,
  fromY,
  toX,
  toY,
  color,
  onComplete,
}: ActivationArrowProps): React.ReactElement | null {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Animate arrow progress
    const duration = 600;
    const startTime = Date.now();

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);

      if (p < 0.7) {
        // Drawing phase
        setProgress(p / 0.7);
        setOpacity(1);
      } else {
        // Fade phase
        setProgress(1);
        setOpacity(1 - (p - 0.7) / 0.3);
      }

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  if (opacity <= 0) return null;

  // Calculate path
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Curved path control point
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2 - 20;

  // Arrow head
  const angle = Math.atan2(toY - midY, toX - midX);
  const headLength = 10;
  const headAngle = Math.PI / 6;

  const headX1 = toX - headLength * Math.cos(angle - headAngle);
  const headY1 = toY - headLength * Math.sin(angle - headAngle);
  const headX2 = toX - headLength * Math.cos(angle + headAngle);
  const headY2 = toY - headLength * Math.sin(angle + headAngle);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
      }}
    >
      <defs>
        <filter id="arrow-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Curved arrow path */}
      <path
        d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
        filter="url(#arrow-glow)"
      />

      {/* Arrow head */}
      {progress > 0.8 && (
        <polygon
          points={`${toX},${toY} ${headX1},${headY1} ${headX2},${headY2}`}
          fill={color}
          filter="url(#arrow-glow)"
        />
      )}
    </svg>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/visuals/ActivationArrow.tsx
git commit -m "feat(ui): add ActivationArrow component with pulse animation"
```

---

### Task 3.4: Create Visuals Index

**Files:**
- Create: `components/game/visuals/index.ts`

**Step 1: Create the index file**

```typescript
// components/game/visuals/index.ts
export { PhospholipidMembrane } from './PhospholipidMembrane';
export { TFProtein } from './TFProtein';
export { ActivationArrow } from './ActivationArrow';
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/visuals/index.ts
git commit -m "feat(ui): add visuals index export"
```

---

## Phase 4: Scene Infrastructure

### Task 4.1: Create Scene Container Component

**Files:**
- Create: `components/game/scenes/SceneContainer.tsx`

**Step 1: Create the component**

```typescript
// components/game/scenes/SceneContainer.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import type { GameScene } from '@/types/game';

interface SceneContainerProps {
  currentScene: GameScene;
  children: ReactNode;
}

/**
 * Container for scene transitions
 * Handles fade in/out between scenes
 */
export function SceneContainer({
  currentScene,
  children,
}: SceneContainerProps): React.ReactElement {
  const [displayedScene, setDisplayedScene] = useState(currentScene);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (currentScene !== displayedScene) {
      // Start transition
      setIsTransitioning(true);
      setOpacity(0);

      // After fade out, switch scene
      const fadeOutTimer = setTimeout(() => {
        setDisplayedScene(currentScene);

        // Fade in new scene
        const fadeInTimer = setTimeout(() => {
          setOpacity(1);
          setIsTransitioning(false);
        }, 50);

        return () => clearTimeout(fadeInTimer);
      }, 300);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [currentScene, displayedScene]);

  return (
    <div
      className="scene-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        opacity,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      {children}

      {/* Scene label */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '4px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 4,
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {formatSceneName(displayedScene)}
      </div>
    </div>
  );
}

function formatSceneName(scene: GameScene): string {
  switch (scene) {
    case 'initiation':
      return 'Initiation';
    case 'amplification':
      return 'Amplification';
    case 'propagation':
      return 'Propagation';
    case 'victory':
      return 'Victory';
    default:
      return scene;
  }
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/scenes/SceneContainer.tsx
git commit -m "feat(ui): add SceneContainer with fade transitions"
```

---

### Task 4.2: Create Scene State Hook

**Files:**
- Create: `hooks/useSceneState.ts`

**Step 1: Create the hook**

```typescript
// hooks/useSceneState.ts
'use client';

import { useReducer, useCallback } from 'react';
import type {
  GameScene,
  SceneObjective,
  DockedComplex,
  FloatingFactor,
  ActivationArrow,
  FibrinStrand,
} from '@/types/game';

// =============================================================================
// STATE
// =============================================================================

export interface SceneState {
  currentScene: GameScene;
  floatingFactors: FloatingFactor[];
  dockedComplexes: DockedComplex[];
  activationArrows: ActivationArrow[];
  fibrinStrands: FibrinStrand[];
  objectives: SceneObjective[];
  thrombinCount: number; // For propagation burst
  isTransitioning: boolean;
}

const initialState: SceneState = {
  currentScene: 'initiation',
  floatingFactors: [],
  dockedComplexes: [],
  activationArrows: [],
  fibrinStrands: [],
  objectives: [],
  thrombinCount: 0,
  isTransitioning: false,
};

// =============================================================================
// ACTIONS
// =============================================================================

type SceneAction =
  | { type: 'SET_SCENE'; scene: GameScene }
  | { type: 'ADD_FLOATING_FACTOR'; factor: FloatingFactor }
  | { type: 'REMOVE_FLOATING_FACTOR'; factorId: string }
  | { type: 'UPDATE_FLOATING_FACTORS'; factors: FloatingFactor[] }
  | { type: 'ADD_DOCKED_COMPLEX'; complex: DockedComplex }
  | { type: 'UPDATE_DOCKED_COMPLEX'; complexId: string; updates: Partial<DockedComplex> }
  | { type: 'ADD_ACTIVATION_ARROW'; arrow: ActivationArrow }
  | { type: 'REMOVE_ACTIVATION_ARROW'; arrowId: string }
  | { type: 'ADD_FIBRIN_STRAND'; strand: FibrinStrand }
  | { type: 'SET_OBJECTIVES'; objectives: SceneObjective[] }
  | { type: 'COMPLETE_OBJECTIVE'; objectiveId: string }
  | { type: 'INCREMENT_THROMBIN' }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'RESET' };

// =============================================================================
// REDUCER
// =============================================================================

function sceneReducer(state: SceneState, action: SceneAction): SceneState {
  switch (action.type) {
    case 'SET_SCENE':
      return { ...state, currentScene: action.scene };

    case 'ADD_FLOATING_FACTOR':
      return {
        ...state,
        floatingFactors: [...state.floatingFactors, action.factor],
      };

    case 'REMOVE_FLOATING_FACTOR':
      return {
        ...state,
        floatingFactors: state.floatingFactors.filter(
          (f) => f.id !== action.factorId
        ),
      };

    case 'UPDATE_FLOATING_FACTORS':
      return { ...state, floatingFactors: action.factors };

    case 'ADD_DOCKED_COMPLEX':
      return {
        ...state,
        dockedComplexes: [...state.dockedComplexes, action.complex],
      };

    case 'UPDATE_DOCKED_COMPLEX':
      return {
        ...state,
        dockedComplexes: state.dockedComplexes.map((c) =>
          c.id === action.complexId ? { ...c, ...action.updates } : c
        ),
      };

    case 'ADD_ACTIVATION_ARROW':
      return {
        ...state,
        activationArrows: [...state.activationArrows, action.arrow],
      };

    case 'REMOVE_ACTIVATION_ARROW':
      return {
        ...state,
        activationArrows: state.activationArrows.filter(
          (a) => a.id !== action.arrowId
        ),
      };

    case 'ADD_FIBRIN_STRAND':
      return {
        ...state,
        fibrinStrands: [...state.fibrinStrands, action.strand],
      };

    case 'SET_OBJECTIVES':
      return { ...state, objectives: action.objectives };

    case 'COMPLETE_OBJECTIVE':
      return {
        ...state,
        objectives: state.objectives.map((o) =>
          o.id === action.objectiveId ? { ...o, isComplete: true } : o
        ),
      };

    case 'INCREMENT_THROMBIN':
      return { ...state, thrombinCount: state.thrombinCount + 1 };

    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.isTransitioning };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// =============================================================================
// HOOK
// =============================================================================

export interface SceneStateHook {
  state: SceneState;
  setScene: (scene: GameScene) => void;
  addFloatingFactor: (factor: FloatingFactor) => void;
  removeFloatingFactor: (factorId: string) => void;
  updateFloatingFactors: (factors: FloatingFactor[]) => void;
  addDockedComplex: (complex: DockedComplex) => void;
  updateDockedComplex: (complexId: string, updates: Partial<DockedComplex>) => void;
  addActivationArrow: (arrow: ActivationArrow) => void;
  removeActivationArrow: (arrowId: string) => void;
  addFibrinStrand: (strand: FibrinStrand) => void;
  setObjectives: (objectives: SceneObjective[]) => void;
  completeObjective: (objectiveId: string) => void;
  incrementThrombin: () => void;
  setTransitioning: (isTransitioning: boolean) => void;
  reset: () => void;
  areAllObjectivesComplete: () => boolean;
}

export function useSceneState(): SceneStateHook {
  const [state, dispatch] = useReducer(sceneReducer, initialState);

  const setScene = useCallback((scene: GameScene) => {
    dispatch({ type: 'SET_SCENE', scene });
  }, []);

  const addFloatingFactor = useCallback((factor: FloatingFactor) => {
    dispatch({ type: 'ADD_FLOATING_FACTOR', factor });
  }, []);

  const removeFloatingFactor = useCallback((factorId: string) => {
    dispatch({ type: 'REMOVE_FLOATING_FACTOR', factorId });
  }, []);

  const updateFloatingFactors = useCallback((factors: FloatingFactor[]) => {
    dispatch({ type: 'UPDATE_FLOATING_FACTORS', factors });
  }, []);

  const addDockedComplex = useCallback((complex: DockedComplex) => {
    dispatch({ type: 'ADD_DOCKED_COMPLEX', complex });
  }, []);

  const updateDockedComplex = useCallback(
    (complexId: string, updates: Partial<DockedComplex>) => {
      dispatch({ type: 'UPDATE_DOCKED_COMPLEX', complexId, updates });
    },
    []
  );

  const addActivationArrow = useCallback((arrow: ActivationArrow) => {
    dispatch({ type: 'ADD_ACTIVATION_ARROW', arrow });
  }, []);

  const removeActivationArrow = useCallback((arrowId: string) => {
    dispatch({ type: 'REMOVE_ACTIVATION_ARROW', arrowId });
  }, []);

  const addFibrinStrand = useCallback((strand: FibrinStrand) => {
    dispatch({ type: 'ADD_FIBRIN_STRAND', strand });
  }, []);

  const setObjectives = useCallback((objectives: SceneObjective[]) => {
    dispatch({ type: 'SET_OBJECTIVES', objectives });
  }, []);

  const completeObjective = useCallback((objectiveId: string) => {
    dispatch({ type: 'COMPLETE_OBJECTIVE', objectiveId });
  }, []);

  const incrementThrombin = useCallback(() => {
    dispatch({ type: 'INCREMENT_THROMBIN' });
  }, []);

  const setTransitioning = useCallback((isTransitioning: boolean) => {
    dispatch({ type: 'SET_TRANSITIONING', isTransitioning });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const areAllObjectivesComplete = useCallback(() => {
    return state.objectives.length > 0 && state.objectives.every((o) => o.isComplete);
  }, [state.objectives]);

  return {
    state,
    setScene,
    addFloatingFactor,
    removeFloatingFactor,
    updateFloatingFactors,
    addDockedComplex,
    updateDockedComplex,
    addActivationArrow,
    removeActivationArrow,
    addFibrinStrand,
    setObjectives,
    completeObjective,
    incrementThrombin,
    setTransitioning,
    reset,
    areAllObjectivesComplete,
  };
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add hooks/useSceneState.ts
git commit -m "feat(hooks): add useSceneState for scene-based game management"
```

---

## Phase 5: Initiation Scene

### Task 5.1: Create Initiation Scene Component (Structure)

**Files:**
- Create: `components/game/scenes/InitiationScene.tsx`

**Step 1: Create the basic scene structure**

```typescript
// components/game/scenes/InitiationScene.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { PhospholipidMembrane, TFProtein, ActivationArrow } from '../visuals';
import { FactorTokenNew } from '../tokens';
import type { FloatingFactor, DockedComplex, ActivationArrow as ArrowType } from '@/types/game';

interface InitiationSceneProps {
  width: number;
  height: number;
  floatingFactors: FloatingFactor[];
  dockedComplexes: DockedComplex[];
  activationArrows: ArrowType[];
  onFactorCatch: (factorId: string) => void;
  onFactorDock: (factorId: string, complexId: string) => void;
  onThrombinDrag: (thrombinId: string, targetX: number, targetY: number) => void;
  onArrowComplete: (arrowId: string) => void;
}

/**
 * Initiation Scene: TF-bearing fibroblast surface
 *
 * TEXTBOOK:
 * - TF+VIIa complex is pre-assembled on fibroblast
 * - Player catches FX, FV from bloodstream
 * - FX → FXa (via TF+VIIa)
 * - FXa + FVa → Prothrombinase
 * - Prothrombinase → Thrombin spark
 * - Player drags thrombin to platelet to activate it
 */
export function InitiationScene({
  width,
  height,
  floatingFactors,
  dockedComplexes,
  activationArrows,
  onFactorCatch,
  onFactorDock,
  onThrombinDrag,
  onArrowComplete,
}: InitiationSceneProps): React.ReactElement {
  const bloodstreamHeight = height * 0.4;
  const membraneHeight = height * 0.6;
  const membraneY = bloodstreamHeight;

  // TF protein positions along membrane
  const tfPositions = [
    { x: width * 0.25, y: membraneY + 10 },
    { x: width * 0.45, y: membraneY + 10 },
    { x: width * 0.65, y: membraneY + 10 },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {/* Bloodstream area */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: bloodstreamHeight,
          background: 'linear-gradient(180deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
        }}
      >
        {/* Floating factors */}
        {floatingFactors.map((factor) => (
          <div
            key={factor.id}
            style={{
              position: 'absolute',
              left: factor.position.x,
              top: factor.position.y,
              transform: 'translate(-50%, -50%)',
              cursor: 'grab',
            }}
            onClick={() => onFactorCatch(factor.id)}
          >
            <FactorTokenNew factorId={factor.factorId} />
          </div>
        ))}
      </div>

      {/* Membrane surface */}
      <div
        style={{
          position: 'absolute',
          top: membraneY,
          left: 0,
          width: '100%',
          height: membraneHeight,
        }}
      >
        <PhospholipidMembrane
          width={width}
          height={membraneHeight}
          variant="fibroblast"
        />

        {/* TF proteins */}
        {tfPositions.map((pos, i) => (
          <TFProtein key={i} x={pos.x} y={15} />
        ))}

        {/* Docked complexes */}
        {dockedComplexes.map((complex) => (
          <div
            key={complex.id}
            style={{
              position: 'absolute',
              left: complex.position.x,
              top: complex.position.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Render docked factors */}
            {complex.enzymeFactorId && (
              <FactorTokenNew factorId={complex.enzymeFactorId} isActive />
            )}
            {complex.cofactorFactorId && (
              <FactorTokenNew factorId={complex.cofactorFactorId} isActive />
            )}
          </div>
        ))}
      </div>

      {/* Activation arrows */}
      {activationArrows.map((arrow) => (
        <ActivationArrow
          key={arrow.id}
          fromX={arrow.fromPosition.x}
          fromY={arrow.fromPosition.y}
          toX={arrow.toPosition.x}
          toY={arrow.toPosition.y}
          color={arrow.color}
          onComplete={() => onArrowComplete(arrow.id)}
        />
      ))}

      {/* Platelet target (for thrombin delivery) */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: membraneY - 60,
          width: 80,
          height: 50,
          borderRadius: '50%',
          backgroundColor: 'rgba(249, 168, 212, 0.5)',
          border: '2px dashed #EC4899',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#EC4899',
          fontWeight: 600,
        }}
      >
        PLATELET
      </div>
    </div>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/scenes/InitiationScene.tsx
git commit -m "feat(ui): add InitiationScene component structure"
```

---

### Task 5.2: Create Scenes Index

**Files:**
- Create: `components/game/scenes/index.ts`

**Step 1: Create the index file**

```typescript
// components/game/scenes/index.ts
export { SceneContainer } from './SceneContainer';
export { InitiationScene } from './InitiationScene';
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/scenes/index.ts
git commit -m "feat(ui): add scenes index export"
```

---

## Phase 6: Integration - Scene-Based Game Page

### Task 6.1: Create New Game Page (Scene-Based)

**Files:**
- Create: `app/game-v2/page.tsx`

**Step 1: Create the new game page**

```typescript
// app/game-v2/page.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useSceneState } from '@/hooks/useSceneState';
import { SceneContainer, InitiationScene } from '@/components/game/scenes';
import type { FloatingFactor } from '@/types/game';

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;

/**
 * Scene-based coagulation cascade game
 * TEXTBOOK FIRST, GAMIFICATION SECOND
 */
export default function GamePageV2(): ReactElement {
  const {
    state,
    setScene,
    addFloatingFactor,
    removeFloatingFactor,
    updateFloatingFactors,
    addDockedComplex,
    updateDockedComplex,
    addActivationArrow,
    removeActivationArrow,
    setObjectives,
    completeObjective,
    areAllObjectivesComplete,
  } = useSceneState();

  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Initialize scene objectives
  useEffect(() => {
    if (state.currentScene === 'initiation') {
      setObjectives([
        { id: 'dock-fx', description: 'Dock FX with TF+VIIa', isComplete: false },
        { id: 'dock-fv', description: 'Dock FV to form Prothrombinase', isComplete: false },
        { id: 'deliver-thrombin', description: 'Deliver thrombin to platelet', isComplete: false },
      ]);
    }
  }, [state.currentScene, setObjectives]);

  // Check for scene transition
  useEffect(() => {
    if (areAllObjectivesComplete()) {
      // Transition to next scene
      if (state.currentScene === 'initiation') {
        setTimeout(() => setScene('amplification'), 500);
      } else if (state.currentScene === 'amplification') {
        setTimeout(() => setScene('propagation'), 500);
      } else if (state.currentScene === 'propagation') {
        setTimeout(() => setScene('victory'), 500);
      }
    }
  }, [state.currentScene, areAllObjectivesComplete, setScene]);

  // Spawn floating factors for initiation
  useEffect(() => {
    if (state.currentScene !== 'initiation') return;

    const spawnFactor = (): void => {
      const factors = ['FX', 'FV', 'FII'];
      const factorId = factors[Math.floor(Math.random() * factors.length)];
      const factor: FloatingFactor = {
        id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        factorId,
        position: { x: -50, y: 50 + Math.random() * 150 },
        velocity: { x: 50 + Math.random() * 30, y: (Math.random() - 0.5) * 20 },
        isVulnerableTo: [],
      };
      addFloatingFactor(factor);
    };

    // Initial spawn
    spawnFactor();

    // Periodic spawning
    const interval = setInterval(spawnFactor, 3000);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor]);

  // Game loop for factor movement
  useEffect(() => {
    const gameLoop = (timestamp: number): void => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      // Update floating factor positions
      const updatedFactors = state.floatingFactors
        .map((factor) => ({
          ...factor,
          position: {
            x: factor.position.x + factor.velocity.x * deltaTime,
            y: factor.position.y + factor.velocity.y * deltaTime,
          },
        }))
        .filter((factor) => factor.position.x < GAME_WIDTH + 100);

      if (updatedFactors.length !== state.floatingFactors.length ||
          updatedFactors.some((f, i) => f.position.x !== state.floatingFactors[i]?.position.x)) {
        updateFloatingFactors(updatedFactors);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [state.floatingFactors, updateFloatingFactors]);

  // Handlers
  const handleFactorCatch = useCallback((factorId: string) => {
    console.log('Caught factor:', factorId);
    removeFloatingFactor(factorId);
    // TODO: Add to held factors
  }, [removeFloatingFactor]);

  const handleFactorDock = useCallback((factorId: string, complexId: string) => {
    console.log('Docked factor:', factorId, 'to complex:', complexId);
    // TODO: Implement docking logic
  }, []);

  const handleThrombinDrag = useCallback((thrombinId: string, targetX: number, targetY: number) => {
    console.log('Thrombin dragged to:', targetX, targetY);
    // TODO: Check if dropped on platelet
  }, []);

  const handleArrowComplete = useCallback((arrowId: string) => {
    removeActivationArrow(arrowId);
  }, [removeActivationArrow]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        padding: 20,
      }}
    >
      <h1
        style={{
          color: '#FFFFFF',
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Coagulation Cascade
      </h1>

      <div
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          border: '2px solid #334155',
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#1E293B',
        }}
      >
        <SceneContainer currentScene={state.currentScene}>
          {state.currentScene === 'initiation' && (
            <InitiationScene
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              floatingFactors={state.floatingFactors}
              dockedComplexes={state.dockedComplexes}
              activationArrows={state.activationArrows}
              onFactorCatch={handleFactorCatch}
              onFactorDock={handleFactorDock}
              onThrombinDrag={handleThrombinDrag}
              onArrowComplete={handleArrowComplete}
            />
          )}

          {state.currentScene === 'victory' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#FFFFFF',
              }}
            >
              <h2 style={{ fontSize: 48, marginBottom: 20 }}>Clot Stabilized!</h2>
              <p style={{ fontSize: 18, opacity: 0.8 }}>
                You successfully built the coagulation cascade.
              </p>
            </div>
          )}
        </SceneContainer>
      </div>

      {/* Objectives display */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: '#1E293B',
          borderRadius: 8,
          color: '#FFFFFF',
          width: GAME_WIDTH,
        }}
      >
        <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Objectives:</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {state.objectives.map((obj) => (
            <li
              key={obj.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0',
                opacity: obj.isComplete ? 0.5 : 1,
              }}
            >
              <span style={{ color: obj.isComplete ? '#22C55E' : '#64748B' }}>
                {obj.isComplete ? '✓' : '○'}
              </span>
              <span style={{ textDecoration: obj.isComplete ? 'line-through' : 'none' }}>
                {obj.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

**Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/game-v2/page.tsx
git commit -m "feat(game): add scene-based game page v2 with initiation scene"
```

---

## Remaining Tasks (To Be Detailed)

The following tasks need to be implemented to complete the visual overhaul. They follow the same pattern as above:

### Phase 7: Amplification Scene
- Task 7.1: Create AmplificationScene component
- Task 7.2: Add Tenase complex assembly logic
- Task 7.3: Add FXa production from Tenase

### Phase 8: Propagation Scene
- Task 8.1: Create PropagationScene component
- Task 8.2: Add FibrinMesh component
- Task 8.3: Implement thrombin burst animation
- Task 8.4: Add fibrinogen → fibrin conversion

### Phase 9: Puzzle-Dock Mechanics
- Task 9.1: Create usePuzzleDock hook
- Task 9.2: Implement magnetic snap behavior
- Task 9.3: Add side-by-side docking validation

### Phase 10: Polish & Integration
- Task 10.1: Add CSS animations for token interactions
- Task 10.2: Add sound effects (optional)
- Task 10.3: Migrate old game to /game-legacy
- Task 10.4: Move new game to /game
- Task 10.5: Remove deprecated components

---

## Verification

After each phase:
```bash
npm run build
npm run lint
```

Manual testing:
1. Navigate to `/game-v2`
2. Verify factors spawn and float
3. Verify membrane and TF proteins render
4. Test factor catching (click)
5. Test scene transitions (when implemented)
