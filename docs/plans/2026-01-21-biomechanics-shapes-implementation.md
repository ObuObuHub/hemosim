# Biomechanics Protein Shapes - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace rectangular factor tokens with biochemically-accurate SVG protein shapes (Pac-Man enzymes, bean cofactors, blob zymogens) that snap together into unified complexes.

**Architecture:** Create modular SVG shape components in `components/game/shapes/`. Update FactorToken to select shape based on factor category. Add ComplexAssembly component that renders merged shape when complete.

**Tech Stack:** React, SVG, TypeScript, CSS animations

---

## Task 1: Create Shape Configuration

**Files:**
- Create: `components/game/shapes/ShapeConfig.ts`

**Step 1: Create the shape configuration file**

This file defines SVG paths, dimensions, and colors for each shape type.

```typescript
// components/game/shapes/ShapeConfig.ts
'use strict';

// =============================================================================
// SHAPE DIMENSIONS
// =============================================================================

export const SHAPE_DIMENSIONS = {
  enzyme: { width: 60, height: 50, viewBox: '0 0 60 50' },
  cofactor: { width: 80, height: 35, viewBox: '0 0 80 35' },
  zymogen: { width: 55, height: 50, viewBox: '0 0 55 50' },
  mergedComplex: { width: 80, height: 70, viewBox: '0 0 80 70' },
} as const;

// =============================================================================
// SVG PATHS
// =============================================================================

/**
 * Enzyme (Pac-Man): Globular with active site cleft (wedge cut out)
 * The "mouth" faces right, convex bottom bulge for cofactor fitting
 */
export const ENZYME_PATH = `
  M 30 5
  C 45 5, 55 15, 55 25
  L 45 25
  L 30 35
  L 45 25
  L 55 25
  C 55 35, 50 45, 35 48
  C 30 49, 25 49, 20 48
  C 5 45, 0 35, 0 25
  C 0 10, 15 5, 30 5
  Z
`;

/**
 * Cofactor (Bean/Seat): Elongated with concave socket on top
 * The socket matches enzyme's bottom bulge
 */
export const COFACTOR_PATH = `
  M 5 20
  C 5 30, 15 35, 40 35
  C 65 35, 75 30, 75 20
  C 75 10, 65 5, 55 8
  C 45 3, 35 3, 25 8
  C 15 5, 5 10, 5 20
  Z
`;

/**
 * Zymogen (Blob): Smooth rounded shape, no active site
 * Dormant, inactive appearance
 */
export const ZYMOGEN_PATH = `
  M 27.5 5
  C 45 5, 55 15, 52 30
  C 50 42, 40 48, 27.5 48
  C 15 48, 5 42, 3 30
  C 0 15, 10 5, 27.5 5
  Z
`;

/**
 * Merged Complex: Enzyme seated in cofactor
 * Single unified shape with active site facing outward
 */
export const MERGED_COMPLEX_PATH = `
  M 40 5
  C 55 5, 65 12, 65 22
  L 55 22
  L 40 30
  L 55 22
  L 65 22
  C 65 30, 60 38, 50 42
  L 50 45
  C 50 55, 60 60, 75 60
  C 78 65, 75 70, 40 70
  C 5 70, 2 65, 5 60
  C 20 60, 30 55, 30 45
  L 30 42
  C 20 38, 15 30, 15 22
  C 15 10, 25 5, 40 5
  Z
`;

// =============================================================================
// FACTOR TO SHAPE MAPPING
// =============================================================================

export type ShapeType = 'enzyme' | 'cofactor' | 'zymogen' | 'procofactor';

/**
 * Maps factor IDs to their shape types based on biochemical role
 */
export const FACTOR_SHAPE_MAP: Record<string, { inactive: ShapeType; active: ShapeType }> = {
  // Zymogens that become enzymes
  'FVII': { inactive: 'zymogen', active: 'enzyme' },
  'FIX': { inactive: 'zymogen', active: 'enzyme' },
  'FX': { inactive: 'zymogen', active: 'enzyme' },
  'FII': { inactive: 'zymogen', active: 'enzyme' },
  'FXI': { inactive: 'zymogen', active: 'enzyme' },

  // Procofactors that become cofactors
  'FV': { inactive: 'procofactor', active: 'cofactor' },
  'FVIII': { inactive: 'procofactor', active: 'cofactor' },
};

/**
 * Get the shape type for a factor based on its activation state
 */
export function getShapeType(factorId: string, isActive: boolean): ShapeType {
  const mapping = FACTOR_SHAPE_MAP[factorId];
  if (!mapping) {
    // Default to zymogen for unknown factors
    return 'zymogen';
  }
  return isActive ? mapping.active : mapping.inactive;
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add components/game/shapes/ShapeConfig.ts
git commit -m "feat(shapes): add SVG path configuration for protein shapes"
```

---

## Task 2: Create Zymogen Shape Component

**Files:**
- Create: `components/game/shapes/ZymogenShape.tsx`

**Step 1: Create the zymogen (blob) shape component**

```typescript
// components/game/shapes/ZymogenShape.tsx
'use client';

import { SHAPE_DIMENSIONS, ZYMOGEN_PATH } from './ShapeConfig';

interface ZymogenShapeProps {
  color: string;
  label: string;
  style?: React.CSSProperties;
}

/**
 * Zymogen shape: Smooth rounded blob without active site
 * Represents inactive enzyme precursors (FIX, FX, FII, etc.)
 */
export function ZymogenShape({ color, label, style }: ZymogenShapeProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.zymogen;

  // Desaturate color slightly for inactive appearance
  const inactiveColor = color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className="zymogen-shape"
    >
      <defs>
        <linearGradient id={`zymogen-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={inactiveColor} stopOpacity={0.7} />
          <stop offset="50%" stopColor={inactiveColor} stopOpacity={0.5} />
          <stop offset="100%" stopColor={inactiveColor} stopOpacity={0.7} />
        </linearGradient>
        <filter id={`zymogen-shadow-${label}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Main blob shape */}
      <path
        d={ZYMOGEN_PATH}
        fill={`url(#zymogen-gradient-${label})`}
        stroke={inactiveColor}
        strokeWidth={2}
        filter={`url(#zymogen-shadow-${label})`}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize={12}
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

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/shapes/ZymogenShape.tsx
git commit -m "feat(shapes): add ZymogenShape component (smooth blob)"
```

---

## Task 3: Create Enzyme Shape Component

**Files:**
- Create: `components/game/shapes/EnzymeShape.tsx`

**Step 1: Create the enzyme (Pac-Man) shape component**

```typescript
// components/game/shapes/EnzymeShape.tsx
'use client';

import { SHAPE_DIMENSIONS, ENZYME_PATH } from './ShapeConfig';

interface EnzymeShapeProps {
  color: string;
  label: string;
  isWobbling?: boolean;
  style?: React.CSSProperties;
}

/**
 * Enzyme shape: Pac-Man with active site cleft (wedge mouth)
 * Represents activated serine proteases (IXa, Xa, Thrombin, etc.)
 * Has convex bottom that fits into cofactor socket
 */
export function EnzymeShape({
  color,
  label,
  isWobbling = true,
  style
}: EnzymeShapeProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.enzyme;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className={isWobbling ? 'enzyme-shape enzyme-wobble' : 'enzyme-shape'}
    >
      <defs>
        <linearGradient id={`enzyme-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor={color} stopOpacity={0.85} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <filter id={`enzyme-glow-${label}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`enzyme-shadow-${label}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Active site highlight (the "mouth" interior) */}
      <path
        d="M 45 25 L 30 35 L 45 25"
        fill="rgba(0,0,0,0.2)"
        stroke="none"
      />

      {/* Main Pac-Man shape */}
      <path
        d={ENZYME_PATH}
        fill={`url(#enzyme-gradient-${label})`}
        stroke={color}
        strokeWidth={2}
        filter={`url(#enzyme-shadow-${label})`}
      />

      {/* Active site edge highlight */}
      <path
        d="M 45 25 L 30 35"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
      />

      {/* Label */}
      <text
        x={25}
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

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/shapes/EnzymeShape.tsx
git commit -m "feat(shapes): add EnzymeShape component (Pac-Man with active site)"
```

---

## Task 4: Create Cofactor Shape Component

**Files:**
- Create: `components/game/shapes/CofactorShape.tsx`

**Step 1: Create the cofactor (bean/seat) shape component**

```typescript
// components/game/shapes/CofactorShape.tsx
'use client';

import { SHAPE_DIMENSIONS, COFACTOR_PATH } from './ShapeConfig';

interface CofactorShapeProps {
  color: string;
  label: string;
  style?: React.CSSProperties;
}

/**
 * Cofactor shape: Bean/seat with concave socket on top
 * Represents activated cofactors (Va, VIIIa)
 * The socket fits the enzyme's convex bottom
 */
export function CofactorShape({ color, label, style }: CofactorShapeProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.cofactor;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className="cofactor-shape"
    >
      <defs>
        <linearGradient id={`cofactor-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor={color} stopOpacity={0.85} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        {/* Inner shadow for socket depth */}
        <filter id={`cofactor-socket-${label}`}>
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite operator="out" in="SourceGraphic" />
        </filter>
        <filter id={`cofactor-shadow-${label}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Socket shadow (depth cue) */}
      <ellipse
        cx={40}
        cy={12}
        rx={18}
        ry={6}
        fill="rgba(0,0,0,0.15)"
      />

      {/* Main bean shape */}
      <path
        d={COFACTOR_PATH}
        fill={`url(#cofactor-gradient-${label})`}
        stroke={color}
        strokeWidth={2}
        filter={`url(#cofactor-shadow-${label})`}
      />

      {/* Socket highlight rim */}
      <ellipse
        cx={40}
        cy={10}
        rx={16}
        ry={4}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
      />

      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 6}
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

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/shapes/CofactorShape.tsx
git commit -m "feat(shapes): add CofactorShape component (bean with socket)"
```

---

## Task 5: Create Merged Complex Component

**Files:**
- Create: `components/game/shapes/MergedComplex.tsx`

**Step 1: Create the merged complex shape component**

```typescript
// components/game/shapes/MergedComplex.tsx
'use client';

import { SHAPE_DIMENSIONS, MERGED_COMPLEX_PATH } from './ShapeConfig';

interface MergedComplexProps {
  complexType: 'tenase' | 'prothrombinase';
  enzymeColor: string;
  cofactorColor: string;
  style?: React.CSSProperties;
}

/**
 * Merged Complex: Enzyme seated in cofactor as single unified shape
 * Shows the complete functional complex with active site facing outward
 * Has breathing animation to show it's active
 */
export function MergedComplex({
  complexType,
  enzymeColor,
  cofactorColor,
  style
}: MergedComplexProps): React.ReactElement {
  const { width, height, viewBox } = SHAPE_DIMENSIONS.mergedComplex;
  const label = complexType === 'tenase' ? 'Tenase' : 'PTase';

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      className="merged-complex complex-breathing"
    >
      <defs>
        {/* Two-tone gradient: enzyme on top, cofactor on bottom */}
        <linearGradient id={`complex-gradient-${complexType}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={enzymeColor} />
          <stop offset="45%" stopColor={enzymeColor} />
          <stop offset="55%" stopColor={cofactorColor} />
          <stop offset="100%" stopColor={cofactorColor} />
        </linearGradient>

        {/* Glow effect for active complex */}
        <filter id={`complex-glow-${complexType}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`complex-shadow-${complexType}`}>
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer glow */}
      <path
        d={MERGED_COMPLEX_PATH}
        fill="none"
        stroke={enzymeColor}
        strokeWidth={6}
        opacity={0.3}
        filter={`url(#complex-glow-${complexType})`}
      />

      {/* Main unified shape */}
      <path
        d={MERGED_COMPLEX_PATH}
        fill={`url(#complex-gradient-${complexType})`}
        stroke="#FFFFFF"
        strokeWidth={2}
        filter={`url(#complex-shadow-${complexType})`}
      />

      {/* Active site cleft highlight */}
      <path
        d="M 55 22 L 40 30"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1}
      />

      {/* Active site interior shadow */}
      <path
        d="M 55 22 L 40 30 L 55 22"
        fill="rgba(0,0,0,0.2)"
      />

      {/* Seam line between enzyme and cofactor */}
      <path
        d="M 30 42 C 35 44, 45 44, 50 42"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
        strokeDasharray="3 2"
      />

      {/* Complex label */}
      <text
        x={width / 2}
        y={height / 2 + 5}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#FFFFFF"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
      >
        {label}
      </text>
    </svg>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/shapes/MergedComplex.tsx
git commit -m "feat(shapes): add MergedComplex component (unified enzyme+cofactor)"
```

---

## Task 6: Create Shape Components Barrel Export

**Files:**
- Create: `components/game/shapes/index.ts`

**Step 1: Create the barrel export file**

```typescript
// components/game/shapes/index.ts
'use strict';

export { ZymogenShape } from './ZymogenShape';
export { EnzymeShape } from './EnzymeShape';
export { CofactorShape } from './CofactorShape';
export { MergedComplex } from './MergedComplex';
export {
  SHAPE_DIMENSIONS,
  FACTOR_SHAPE_MAP,
  getShapeType,
  type ShapeType
} from './ShapeConfig';
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/shapes/index.ts
git commit -m "feat(shapes): add barrel export for shape components"
```

---

## Task 7: Add Shape CSS Animations

**Files:**
- Modify: `app/globals.css`

**Step 1: Add shape animations to globals.css**

Find the game animations section (search for "GAME ANIMATIONS") and add these new animations:

```css
/* =============================================================================
   PROTEIN SHAPE ANIMATIONS
   ============================================================================= */

/* Enzyme wobble - unstable when alone */
@keyframes enzyme-wobble {
  0%, 100% { transform: rotate(-1deg) scale(1); }
  25% { transform: rotate(1deg) scale(1.01); }
  50% { transform: rotate(-0.5deg) scale(1); }
  75% { transform: rotate(0.5deg) scale(1.01); }
}

.enzyme-wobble {
  animation: enzyme-wobble 2s ease-in-out infinite;
  transform-origin: center bottom;
}

/* Complex breathing - unified pulsing */
@keyframes complex-breathing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.complex-breathing {
  animation: complex-breathing 2s ease-in-out infinite;
  transform-origin: center center;
}

/* Activation cut animation */
@keyframes activation-cut {
  0% {
    clip-path: inset(0 0 0 0);
    opacity: 1;
  }
  50% {
    clip-path: inset(0 0 0 50%);
    opacity: 0.7;
  }
  100% {
    clip-path: inset(0 0 0 100%);
    opacity: 0;
  }
}

.activation-cut {
  animation: activation-cut 300ms ease-out forwards;
}

/* Fragment falling away */
@keyframes fragment-fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(10px, 20px) rotate(15deg);
    opacity: 0;
  }
}

.fragment-falling {
  animation: fragment-fall 250ms ease-in forwards;
}

/* Complex assembly snap */
@keyframes assembly-snap {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.assembly-snap {
  animation: assembly-snap 300ms ease-out forwards;
}

/* Assembly flash on completion */
@keyframes assembly-flash {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
  100% { filter: brightness(1); }
}

.assembly-flash {
  animation: assembly-flash 200ms ease-out;
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(css): add protein shape animations (wobble, breathing, assembly)"
```

---

## Task 8: Update FactorToken to Use Shapes

**Files:**
- Modify: `components/game/FactorToken.tsx`

**Step 1: Update FactorToken to render SVG shapes**

Replace the entire file with:

```typescript
// components/game/FactorToken.tsx
'use client';

import type { FactorDefinition } from '@/types/game';
import { ZymogenShape, EnzymeShape, CofactorShape, getShapeType } from './shapes';

interface FactorTokenProps {
  factor: FactorDefinition;
  isActive: boolean;
  isSelected?: boolean;
  isInPalette?: boolean;
  isInComplex?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function FactorToken({
  factor,
  isActive,
  isSelected = false,
  isInPalette = false,
  isInComplex = false,
  onClick,
  style,
}: FactorTokenProps): React.ReactElement {
  const label = isActive ? factor.activeLabel : factor.inactiveLabel;
  const shapeType = getShapeType(factor.id, isActive);

  // Selection glow effect
  const selectionStyle: React.CSSProperties = isSelected ? {
    filter: `drop-shadow(0 0 8px ${factor.color}) drop-shadow(0 0 16px ${factor.color})`,
    transform: 'scale(1.08)',
  } : {};

  // Combine styles
  const combinedStyle: React.CSSProperties = {
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
    ...selectionStyle,
    ...style,
  };

  // Render appropriate shape based on factor type and activation state
  const renderShape = (): React.ReactElement => {
    switch (shapeType) {
      case 'enzyme':
        return (
          <EnzymeShape
            color={factor.color}
            label={label}
            isWobbling={!isInComplex} // Don't wobble when part of complex
            style={combinedStyle}
          />
        );

      case 'cofactor':
        return (
          <CofactorShape
            color={factor.color}
            label={label}
            style={combinedStyle}
          />
        );

      case 'zymogen':
      case 'procofactor':
      default:
        return (
          <ZymogenShape
            color={factor.color}
            label={label}
            style={combinedStyle}
          />
        );
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick && !isSelected) {
          const target = e.currentTarget.querySelector('svg');
          if (target) {
            target.style.transform = 'scale(1.05)';
            target.style.filter = `drop-shadow(0 0 12px ${factor.color})`;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !isSelected) {
          const target = e.currentTarget.querySelector('svg');
          if (target) {
            target.style.transform = '';
            target.style.filter = '';
          }
        }
      }}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {renderShape()}

      {/* Category label for palette view */}
      {isInPalette && (
        <span
          style={{
            position: 'absolute',
            bottom: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          {factor.category}
        </span>
      )}
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/FactorToken.tsx
git commit -m "feat(token): update FactorToken to render SVG protein shapes"
```

---

## Task 9: Create ComplexAssembly Component

**Files:**
- Create: `components/game/ComplexAssembly.tsx`

**Step 1: Create the ComplexAssembly component**

```typescript
// components/game/ComplexAssembly.tsx
'use client';

import { useState, useEffect } from 'react';
import type { FactorDefinition } from '@/types/game';
import { MergedComplex } from './shapes';
import { FactorToken } from './FactorToken';
import { getFactorDefinition } from '@/engine/game/factor-definitions';

interface ComplexAssemblyProps {
  complexType: 'tenase' | 'prothrombinase';
  enzymeFactor: FactorDefinition | null;
  cofactorFactor: FactorDefinition | null;
  onEnzymeSlotClick?: () => void;
  onCofactorSlotClick?: () => void;
  isLocked?: boolean;
}

/**
 * ComplexAssembly: Renders either individual slots OR merged complex
 * When both enzyme and cofactor are placed, shows unified MergedComplex shape
 */
export function ComplexAssembly({
  complexType,
  enzymeFactor,
  cofactorFactor,
  onEnzymeSlotClick,
  onCofactorSlotClick,
  isLocked = false,
}: ComplexAssemblyProps): React.ReactElement {
  const isComplete = enzymeFactor !== null && cofactorFactor !== null;
  const [showMerged, setShowMerged] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);

  // Handle assembly animation
  useEffect(() => {
    if (isComplete && !showMerged) {
      setIsAssembling(true);
      // Delay showing merged to allow assembly animation
      const timer = setTimeout(() => {
        setShowMerged(true);
        setIsAssembling(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    if (!isComplete) {
      setShowMerged(false);
    }
  }, [isComplete, showMerged]);

  // Get expected factors for ghost outlines
  const expectedEnzyme = complexType === 'tenase' ? 'FIXa' : 'FXa';
  const expectedCofactor = complexType === 'tenase' ? 'FVIIIa' : 'FVa';
  const expectedEnzymeDef = getFactorDefinition(expectedEnzyme.replace('a', ''));
  const expectedCofactorDef = getFactorDefinition(expectedCofactor.replace('a', ''));

  // Render merged complex when complete
  if (showMerged && enzymeFactor && cofactorFactor) {
    return (
      <div
        className={isAssembling ? 'assembly-snap assembly-flash' : ''}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <MergedComplex
          complexType={complexType}
          enzymeColor={enzymeFactor.color}
          cofactorColor={cofactorFactor.color}
        />
        <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
          {complexType === 'tenase' ? 'Tenase Active' : 'Prothrombinase Active'}
        </span>
      </div>
    );
  }

  // Render individual slots
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Enzyme slot (top) */}
      <div
        onClick={onEnzymeSlotClick}
        style={{
          width: 70,
          height: 55,
          border: `2px dashed ${isLocked ? '#4B5563' : enzymeFactor ? 'transparent' : '#6B7280'}`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.5 : 1,
          backgroundColor: enzymeFactor ? 'transparent' : 'rgba(107,114,128,0.1)',
        }}
      >
        {enzymeFactor ? (
          <FactorToken factor={enzymeFactor} isActive={true} isInComplex={true} />
        ) : (
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            {expectedEnzyme}
          </span>
        )}
      </div>

      {/* Cofactor slot (bottom) */}
      <div
        onClick={onCofactorSlotClick}
        style={{
          width: 90,
          height: 45,
          border: `2px dashed ${isLocked ? '#4B5563' : cofactorFactor ? 'transparent' : '#6B7280'}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.5 : 1,
          backgroundColor: cofactorFactor ? 'transparent' : 'rgba(107,114,128,0.1)',
        }}
      >
        {cofactorFactor ? (
          <FactorToken factor={cofactorFactor} isActive={true} isInComplex={true} />
        ) : (
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            {expectedCofactor}
          </span>
        )}
      </div>

      {/* Complex label */}
      <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
        {complexType === 'tenase' ? 'Tenase' : 'Prothrombinase'}
      </span>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/game/ComplexAssembly.tsx
git commit -m "feat(complex): add ComplexAssembly component with merge animation"
```

---

## Task 10: Update SurfacePanel to Use ComplexAssembly

**Files:**
- Modify: `components/game/SurfacePanel.tsx`

**Step 1: Import ComplexAssembly**

At the top of the file, add the import:

```typescript
import { ComplexAssembly } from './ComplexAssembly';
```

**Step 2: Update the activated-platelet section**

Find the section that renders complex slots (around line 714, inside the `{config.surface === 'activated-platelet' && (` block).

Replace the complex slot rendering with ComplexAssembly components. Find the section with `{complexSlots.map((complexSlot) => (` and replace it with:

```typescript
{/* Tenase Complex Assembly */}
<div style={{ position: 'absolute', left: 30, top: 90 }}>
  <ComplexAssembly
    complexType="tenase"
    enzymeFactor={
      complexSlots.find(s => s.id === 'tenase-enzyme')?.placedFactorId
        ? getFactorDefinition(complexSlots.find(s => s.id === 'tenase-enzyme')!.placedFactorId!)
        : null
    }
    cofactorFactor={
      complexSlots.find(s => s.id === 'tenase-cofactor')?.placedFactorId
        ? getFactorDefinition(complexSlots.find(s => s.id === 'tenase-cofactor')!.placedFactorId!)
        : null
    }
    onEnzymeSlotClick={() => onComplexSlotClick('tenase-enzyme')}
    isLocked={gameState.phase !== 'propagation' && gameState.phase !== 'complete'}
  />
</div>

{/* Prothrombinase Complex Assembly */}
<div style={{ position: 'absolute', left: 30, top: 210 }}>
  <ComplexAssembly
    complexType="prothrombinase"
    enzymeFactor={
      complexSlots.find(s => s.id === 'prothrombinase-enzyme')?.placedFactorId
        ? getFactorDefinition(complexSlots.find(s => s.id === 'prothrombinase-enzyme')!.placedFactorId!)
        : null
    }
    cofactorFactor={
      complexSlots.find(s => s.id === 'prothrombinase-cofactor')?.placedFactorId
        ? getFactorDefinition(complexSlots.find(s => s.id === 'prothrombinase-cofactor')!.placedFactorId!)
        : null
    }
    onEnzymeSlotClick={() => onComplexSlotClick('prothrombinase-enzyme')}
    isLocked={
      (gameState.phase !== 'propagation' && gameState.phase !== 'complete') ||
      !isTenaseComplete(gameState)
    }
  />
</div>
```

Also remove the old `COMPLEX_LABELS` divs since ComplexAssembly handles labeling.

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add components/game/SurfacePanel.tsx
git commit -m "feat(panel): integrate ComplexAssembly for tenase/prothrombinase"
```

---

## Task 11: Final Integration and Testing

**Files:**
- All shape components

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new errors from our changes

**Step 3: Run tests**

Run: `npm test`
Expected: All existing tests pass

**Step 4: Manual verification checklist**

Start dev server: `npm run dev`
Open: http://localhost:3000/game

Verify:
- [ ] Factors in palette show as blobs (zymogens) or bean shapes (procofactors)
- [ ] When placed and activated, zymogens transform to Pac-Man (enzyme) shape
- [ ] Enzymes have visible "mouth" (active site cleft)
- [ ] Cofactors show bean shape with concave socket
- [ ] Enzymes wobble slightly when standalone
- [ ] When both enzyme + cofactor placed in complex, they merge into single shape
- [ ] Merged complex has breathing animation
- [ ] Complex shows correct two-tone gradient (enzyme color top, cofactor bottom)

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(shapes): complete biomechanics protein shape system

- Enzymes: Pac-Man shape with active site cleft
- Cofactors: Bean shape with concave socket
- Zymogens: Smooth blob (inactive)
- Merged complexes: Unified breathing shape
- Animations: wobble, breathing, assembly snap"
```

---

## Summary

| Task | Component | Purpose |
|------|-----------|---------|
| 1 | ShapeConfig.ts | SVG paths and factor mapping |
| 2 | ZymogenShape.tsx | Inactive blob shape |
| 3 | EnzymeShape.tsx | Pac-Man with active site |
| 4 | CofactorShape.tsx | Bean with socket |
| 5 | MergedComplex.tsx | Unified complex shape |
| 6 | index.ts | Barrel export |
| 7 | globals.css | Shape animations |
| 8 | FactorToken.tsx | Use shape components |
| 9 | ComplexAssembly.tsx | Merge logic |
| 10 | SurfacePanel.tsx | Integrate ComplexAssembly |
| 11 | Integration | Build, lint, test, verify |
