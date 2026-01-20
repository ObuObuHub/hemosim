# Event Bus + Animation System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a proper animation system with event bus architecture that separates game logic from visual feedback, enabling smooth diagram-inspired animations for the coagulation cascade game.

**Architecture:** Event-driven with dual state (logical instant + visual interpolated). Priority-based queue with fast-forward for critical events. Framer Motion for React integration.

**Tech Stack:** React, TypeScript, Framer Motion, useReducer

---

## Roadmap Context

This design covers **Phase 1: Event Bus + Animations**. Future phases:
- Phase 2: Stabilization (fibrin + XIIIa)
- Phase 3: Inhibitors (AT, TFPI, APC, Plasmin)

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Queue behavior | Priority-based interrupt with fast-forward | Critical events accelerate queue (4x), don't cut it - preserves causality |
| Visual style | Diagram-inspired | Tokens morph like textbook diagrams, mechanism labels appear briefly |
| Signal flow | Particle stream | THR particles drift between surfaces - represents soluble signals |
| Mechanism indication | Both token glyph AND connecting arrow | Solid=proteolysis, dotted=activation; full diagram-style |
| Phase transitions | Cause-and-effect chain (~2s) | Shows trigger → reaction → activation; pedagogical |
| Complex output | "Machine produces it" | Docked pair glows, merges, ejects product |

---

## Section 1: Event Bus Architecture

The game logic emits **GameEvents** - semantic descriptions of what happened. The UI consumes these through an **AnimationController** that manages sequencing.

### Event Priority Levels

```
CRITICAL (fast-forward queue, then play):
  - PHASE_UNLOCKED
  - VICTORY
  - GAME_OVER

STANDARD (sequential, ~200ms stagger):
  - FACTOR_CONVERTED
  - COMPLEX_COMPLETED
  - COMPLEX_OUTPUT_SPAWNED

LOW (throttled, update target only):
  - METER_CHANGED
  - ARROW_PULSE
```

### Queue Behavior

- Events enter a FIFO queue
- CRITICAL events set `playbackSpeed = 4x` for existing queue, then play at 1x
- STANDARD events play sequentially with stagger delay
- LOW priority events update target value; UI lerps to latest

### Data Flow

```
GameReducer (logic)
    ↓ returns { state, events[] }
EventBus (middleware)
    ↓ prioritizes & queues
AnimationController (UI)
    ↓ consumes & animates
React Components (render visual state)
```

### Dual State Architecture

**Problem:** Reducer calculates instantly (Thrombin = 100), but animation still playing (showing 80%).

**Solution:** Two sources of truth:
1. **Logical State** - Used for validation (Is move legal? Is game over?)
2. **Visual State** - Used for rendering, lerps toward logical targets

---

## Section 2: State Tree Structure

### Logical State (GameState)

```typescript
interface GameState {
  // Phase progression
  phase: 'initiation' | 'amplification' | 'propagation' | 'stabilization' | 'complete';

  // Meters (logical targets)
  thrombinLevel: number;        // 0-100
  fibrinProgress: number;       // 0-100 (future: stabilization)
  clotIntegrity: number;        // 0-100 (future: stabilization)

  // Surfaces as maps
  surfaces: {
    'tf-cell': SurfaceState;
    'platelet': SurfaceState;
    'activated-platelet': SurfaceState;
  };

  // Circulation tray
  circulation: CirculationState;

  // Player resources
  palette: string[];            // Available factor IDs
  selectedFactorId: string | null;

  // Feedback
  currentMessage: string;
  isError: boolean;

  // Dynamic Modifiers (future)
  activeInhibitors: Record<string, InhibitorState>;
  factorMastery: Record<string, number>;
}

interface SurfaceState {
  isLocked: boolean;
  slots: Record<string, SlotState>;
  complexes: Record<string, ComplexState>;
}

interface SlotState {
  acceptsFactorIds: string[];   // Array for flexible validation
  placedFactorId: string | null;
  isActive: boolean;
  transferredOut: boolean;
}

interface ComplexState {
  enzyme: string | null;
  cofactor: string | null;
  isComplete: boolean;
  efficiency: number;           // 0-1, rate-based output
}

interface CirculationState {
  factors: Array<{
    id: string;
    factorId: string;
    isActive: boolean;
  }>;
}

interface InhibitorState {
  potency: number;              // 0-1
  targetSurface: string;
}
```

### Visual State (AnimationState)

```typescript
interface AnimationState {
  // Interpolated meter values
  thrombinDisplay: number;
  fibrinDisplay: number;

  // Active visual elements
  activeArrows: ArrowState[];
  activeParticles: ParticleState[];
  activeLabels: LabelState[];
  unlockText: string | null;

  // Queue state
  eventQueue: GameEvent[];
  isProcessing: boolean;
  playbackSpeed: number;        // 1x or 4x
}
```

---

## Section 3: Game Event Types

### CRITICAL Priority

```typescript
interface PhaseUnlockedEvent {
  type: 'PHASE_UNLOCKED';
  phase: 'amplification' | 'propagation' | 'stabilization';
  trigger: string;
}

interface VictoryEvent {
  type: 'VICTORY';
  finalThrombin: number;
  complexesBuilt: string[];
}

interface GameOverEvent {
  type: 'GAME_OVER';
  reason: 'timeout' | 'mistakes_exceeded' | 'inhibitor_overwhelm';
}
```

### STANDARD Priority

```typescript
interface FactorSelectedEvent {
  type: 'FACTOR_SELECTED';
  factorId: string;
  fromLocation: 'palette' | 'circulation';
}

interface FactorPlacedEvent {
  type: 'FACTOR_PLACED';
  factorId: string;
  slotId: string;
  surface: string;
  success: boolean;
  errorReason?: string;
}

interface FactorConvertedEvent {
  type: 'FACTOR_CONVERTED';
  fromId: string;
  toLabel: string;
  surface: string;
  mechanism: 'proteolysis' | 'activation' | 'dissociation';
  catalyst: string;
}

interface FactorTransferredEvent {
  type: 'FACTOR_TRANSFERRED';
  factorId: string;
  fromSurface: string;
  toDestination: 'circulation' | 'signal';
}

interface ComplexPartDockedEvent {
  type: 'COMPLEX_PART_DOCKED';
  complexType: 'tenase' | 'prothrombinase';
  role: 'enzyme' | 'cofactor';
  factorId: string;
}

interface ComplexCompletedEvent {
  type: 'COMPLEX_COMPLETED';
  complexType: 'tenase' | 'prothrombinase';
  efficiency: number;
}

interface ComplexOutputEvent {
  type: 'COMPLEX_OUTPUT';
  complexType: 'tenase' | 'prothrombinase';
  outputFactorId: string;
  quantity: number;
}

interface SignalFlowEvent {
  type: 'SIGNAL_FLOW';
  signal: 'THR';
  fromSurface: string;
  toSurface: string;
  intensity: 'starter' | 'burst';
}

interface PanelStateChangedEvent {
  type: 'PANEL_STATE_CHANGED';
  surface: string;
  state: 'locked' | 'active' | 'completed';
}
```

### LOW Priority

```typescript
interface MeterChangedEvent {
  type: 'METER_CHANGED';
  meter: 'thrombin' | 'fibrin' | 'clotIntegrity';
  target: number;
  delta: number;
}

interface ArrowPulseEvent {
  type: 'ARROW_PULSE';
  fromNode: string;
  toNode: string;
  style: 'solid' | 'dotted';
  label?: string;
}
```

### Union Type

```typescript
type GameEvent =
  | PhaseUnlockedEvent
  | VictoryEvent
  | GameOverEvent
  | FactorSelectedEvent
  | FactorPlacedEvent
  | FactorConvertedEvent
  | FactorTransferredEvent
  | ComplexPartDockedEvent
  | ComplexCompletedEvent
  | ComplexOutputEvent
  | SignalFlowEvent
  | PanelStateChangedEvent
  | MeterChangedEvent
  | ArrowPulseEvent;
```

---

## Section 4: Animation Implementation

### Animation Controller Hook

```typescript
function useAnimationController(gameState: GameState) {
  const [visualState, setVisualState] = useState<VisualState>(initialVisual);
  const queueRef = useRef<GameEvent[]>([]);
  const processingRef = useRef(false);
  const speedRef = useRef(1);

  const enqueue = useCallback((events: GameEvent[]) => {
    const sorted = events.sort((a, b) => getPriority(a) - getPriority(b));

    const hasCritical = sorted.some(e => getPriority(e) === 0);
    if (hasCritical && queueRef.current.length > 0) {
      speedRef.current = 4;  // Fast-forward existing queue
    }

    queueRef.current.push(...sorted);
    processNext();
  }, []);

  const processNext = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;

    processingRef.current = true;
    const event = queueRef.current.shift()!;
    const config = getAnimationConfig(event);

    await executeAnimation(config, speedRef.current);

    if (getPriority(event) === 0) {
      speedRef.current = 1;
    }

    processingRef.current = false;

    if (queueRef.current.length > 0) {
      await delay(200 / speedRef.current);
      processNext();
    }
  }, []);

  // Lerp meters toward logical targets (60fps)
  useEffect(() => {
    const interval = setInterval(() => {
      setVisualState(prev => ({
        ...prev,
        thrombinDisplay: lerp(prev.thrombinDisplay, gameState.thrombinLevel, 0.1),
        fibrinDisplay: lerp(prev.fibrinDisplay, gameState.fibrinProgress, 0.1),
      }));
    }, 16);
    return () => clearInterval(interval);
  }, [gameState.thrombinLevel, gameState.fibrinProgress]);

  return { visualState, enqueue };
}
```

### Animation Configs

#### FACTOR_CONVERTED (800ms)

```typescript
const factorConvertedAnimation = {
  duration: 800,
  priority: 'standard',
  sequence: [
    // Arrow from catalyst (200ms)
    { target: 'arrow-overlay', delay: 0, duration: 200 },
    // Token flips (300ms)
    { target: 'token', delay: 200, duration: 300, animation: { rotateY: [0,90,90,0] } },
    // Mechanism label (300ms)
    { target: 'label', delay: 350, duration: 300, label: 'proteolysis' },
  ],
};
```

#### SIGNAL_FLOW (1200ms)

```typescript
const signalFlowAnimation = {
  duration: 1200,
  priority: 'standard',
  sequence: [
    // Spawn 10 particles at source
    { target: 'emitter', particleCount: 10, color: '#EF4444' },
    // Particles follow bezier path
    { target: 'particles', pathDuration: 1000, stagger: 80 },
  ],
};
```

#### PHASE_UNLOCKED (2000ms)

```typescript
const phaseUnlockedAnimation = {
  duration: 2000,
  priority: 'critical',
  sequence: [
    // Trigger particles arrive (600ms)
    { target: 'signal-particles', delay: 0, duration: 600 },
    // Lock shakes (400ms)
    { target: 'lock', delay: 600, duration: 400, animation: { x: [-5,5,-5,5,0] } },
    // Lock shatters (300ms)
    { target: 'lock', delay: 1000, duration: 300, animation: { scale: [1,1.2,0] } },
    // Panel brightens + "UNLOCKED" (700ms)
    { target: 'panel', delay: 1300, duration: 700 },
    { target: 'unlock-text', delay: 1300, duration: 700, label: 'UNLOCKED' },
  ],
};
```

#### COMPLEX_COMPLETED (1500ms)

```typescript
const complexCompletedAnimation = {
  duration: 1500,
  priority: 'standard',
  sequence: [
    // Both slots glow (400ms, repeat 2x)
    { target: 'complex', delay: 0, duration: 400 },
    // Bridge connects (300ms)
    { target: 'bridge', delay: 400, duration: 300, animation: { scaleX: [0,1] } },
    // Output emerges (500ms)
    { target: 'output-token', delay: 700, duration: 500, animation: { scale: [0,1.2,1] } },
    // Label (300ms)
    { target: 'output-label', delay: 1000, duration: 300, label: 'FXa generated' },
  ],
};
```

---

## Section 5: Component Structure

```
app/game/page.tsx
└── GameProvider (context: state + events + animations)
    └── GameCanvas
        ├── GameHeader
        │   ├── ThrombinMeter (visual state lerp)
        │   ├── PhaseIndicator
        │   └── MessageBar
        ├── SurfacePanelsContainer
        │   ├── SurfacePanel (tf-cell)
        │   │   ├── PanelHeader
        │   │   ├── PreplacedElements
        │   │   ├── SlotGrid → FactorSlot[]
        │   │   └── LockOverlay
        │   ├── SurfacePanel (platelet)
        │   └── SurfacePanel (activated-platelet)
        │       ├── ComplexAssembly (tenase)
        │       │   ├── ComplexSlot (enzyme)
        │       │   ├── ComplexSlot (cofactor)
        │       │   ├── ComplexBridge
        │       │   └── OutputSpawnPoint
        │       └── ComplexAssembly (prothrombinase)
        ├── AnimationLayer (z-index top)
        │   ├── ArrowOverlay (SVG)
        │   ├── ParticleEmitter
        │   ├── MechanismLabel
        │   └── UnlockText
        ├── CirculationTray
        └── FactorPalette
```

### Key Components

#### FactorSlot
- Registers with AnimationController via `useAnimationTarget`
- Renders based on `labelVisibility` mode
- Pulses when `isValidTarget`

#### ComplexAssembly
- Shows enzyme + cofactor slots
- Bridge element animates when complete
- Output spawn point with efficiency indicator

#### AnimationLayer
- Absolute positioned overlay
- SVG paths for arrows
- Canvas for particles
- Floating labels

#### ThrombinMeter
- Uses `visualState.thrombinDisplay` for smooth fill
- Threshold marker at 30%

---

## Section 6: Reducer Logic

### Signature

```typescript
interface ReducerResult {
  state: GameState;
  events: GameEvent[];
}

function gameReducer(state: GameState, action: GameAction): ReducerResult
```

### Conversion Rules

| Factor | Surface | Active Label | Mechanism | Catalyst |
|--------|---------|--------------|-----------|----------|
| FX | tf-cell | FXa | proteolysis | TF+VIIa |
| FIX | tf-cell | FIXa | proteolysis | TF+VIIa |
| FII | tf-cell | Starter THR | proteolysis | FXa + trace Va |
| FV | platelet | FVa | activation | THR signal |
| FVIII | platelet | FVIIIa | dissociation | THR signal |

### Conversion Effects

| Factor | Effect |
|--------|--------|
| FIX → FIXa | Transfer to circulation tray |
| FII → THR | Signal flow to platelet, +30% thrombin, unlock amplification if ≥30% |
| FV + FVIII complete | Unlock propagation, auto-transfer cofactors to complex slots |
| Tenase complete | Spawn FXa-tenase for prothrombinase |
| Prothrombinase complete | Thrombin burst (100%), VICTORY |

---

## Implementation Tasks

### Task 1: Types & Interfaces
- Create `types/game-events.ts` with all event interfaces
- Update `types/game.ts` with new state structure
- Add `ReducerResult` type

### Task 2: Event Bus Infrastructure
- Create `hooks/useAnimationController.ts`
- Create `hooks/useAnimationTarget.ts` (ref registration)
- Create `lib/event-priority.ts` (priority helpers)

### Task 3: Refactor Reducer
- Update `hooks/useGameState.ts` to return `{ state, events }`
- Add conversion rules
- Add effect handlers
- Wire up event emission

### Task 4: Animation Layer Components
- Create `components/game/AnimationLayer.tsx`
- Create `components/game/ArrowOverlay.tsx`
- Create `components/game/ParticleEmitter.tsx`
- Create `components/game/MechanismLabel.tsx`

### Task 5: Animation Configs
- Create `engine/game/animation-configs.ts`
- Define all animation sequences
- Map events to configs

### Task 6: Update Existing Components
- Add `useAnimationTarget` to FactorSlot, ComplexSlot
- Update ThrombinMeter to use visual state
- Add AnimationLayer to GameCanvas

### Task 7: Integration & Polish
- Wire GameProvider with animation controller
- Test all animation sequences
- Tune timing and easing

---

## Verification

After implementation:
```bash
npm run build
npm run dev
```

Manual testing checklist:
- [ ] Factor placement triggers flip animation + mechanism label
- [ ] Arrow appears from catalyst to factor (solid/dotted)
- [ ] THR signal shows particle stream to platelet
- [ ] Phase unlock shows cause-and-effect chain (~2s)
- [ ] Complex completion shows machine effect + output spawn
- [ ] Thrombin meter lerps smoothly (no snapping)
- [ ] Critical events fast-forward existing queue
- [ ] Victory animation plays after all effects complete
