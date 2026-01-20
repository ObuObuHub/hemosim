// engine/game/game-config.ts
import type { Slot, Surface, ComplexSlot } from '@/types/game';

// =============================================================================
// COMPLEX SLOT TYPES
// =============================================================================

export interface ComplexSlotPosition {
  slotId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// CANVAS DIMENSIONS
// =============================================================================

export const GAME_CANVAS = {
  width: 1200,
  height: 820, // 120 (bloodstream) + 80 (header) + 480 (panels) + 140 (palette)
} as const;

// =============================================================================
// BLOODSTREAM ZONE DIMENSIONS
// =============================================================================

export const BLOODSTREAM_ZONE = {
  height: 120,
  y: 0, // positioned at top of canvas
  /** Spawn position (off-screen left) */
  spawnX: -60,
  /** Y range for random spawn position (relative to zone) */
  spawnYMin: 30,
  spawnYMax: 90,
  /** Remove threshold (off-screen right) */
  removeThreshold: 1200,
} as const;

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

export const LAYOUT = {
  // Bloodstream zone (floating factors)
  bloodstream: {
    y: 0,
    height: BLOODSTREAM_ZONE.height,
  },
  // Header area (thrombin meter + message)
  header: {
    y: BLOODSTREAM_ZONE.height,
    height: 80,
  },
  // Surface panels area
  panels: {
    y: BLOODSTREAM_ZONE.height + 80,
    height: 480,
  },
  // Factor palette area
  palette: {
    y: BLOODSTREAM_ZONE.height + 80 + 480,
    height: 140,
  },
  // Panel widths (4 equal panels)
  panelWidth: Math.floor(GAME_CANVAS.width / 4),
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
    isComingSoon: false,
  },
  {
    surface: 'clot-zone',
    title: 'CLOT ZONE',
    subtitle: 'Stabilization',
    x: LAYOUT.panelWidth * 3,
    y: LAYOUT.panels.y,
    width: LAYOUT.panelWidth,
    height: LAYOUT.panels.height,
    lockedMessage: 'LOCKED: Complete Propagation',
    isComingSoon: false,
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
      transferredToCirculation: false,
    },
    {
      id: 'tf-cell-fix',
      surface: 'tf-cell',
      acceptsFactorId: 'FIX',
      isLocked: false,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
    {
      id: 'tf-cell-fii',
      surface: 'tf-cell',
      acceptsFactorId: 'FII',
      isLocked: false,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
    // Platelet slots (Amplification) - locked until thrombin threshold
    {
      id: 'platelet-fv',
      surface: 'platelet',
      acceptsFactorId: 'FV',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
    {
      id: 'platelet-fviii',
      surface: 'platelet',
      acceptsFactorId: 'FVIII',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
    // Clot Zone slots (Stabilization) - locked until propagation complete
    {
      id: 'clot-zone-fibrin-1',
      surface: 'clot-zone',
      acceptsFactorId: 'Fibrinogen',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
    {
      id: 'clot-zone-fibrin-2',
      surface: 'clot-zone',
      acceptsFactorId: 'Fibrinogen',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
    {
      id: 'clot-zone-fibrin-3',
      surface: 'clot-zone',
      acceptsFactorId: 'Fibrinogen',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
    {
      id: 'clot-zone-fxiii',
      surface: 'clot-zone',
      acceptsFactorId: 'FXIII',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
      transferredToCirculation: false,
    },
  ];
}

// =============================================================================
// INITIAL COMPLEX SLOTS (Activated Platelet - Propagation)
// =============================================================================

export function createInitialComplexSlots(): ComplexSlot[] {
  return [
    // Tenase complex
    {
      id: 'tenase-enzyme',
      complexType: 'tenase',
      role: 'enzyme',
      acceptsFactorId: 'FIXa',
      placedFactorId: null,
      isAutoFilled: false,
    },
    {
      id: 'tenase-cofactor',
      complexType: 'tenase',
      role: 'cofactor',
      acceptsFactorId: 'FVIIIa',
      placedFactorId: null,
      isAutoFilled: true,
    },
    // Prothrombinase complex
    {
      id: 'prothrombinase-enzyme',
      complexType: 'prothrombinase',
      role: 'enzyme',
      acceptsFactorId: 'FXa-tenase',
      placedFactorId: null,
      isAutoFilled: false,
    },
    {
      id: 'prothrombinase-cofactor',
      complexType: 'prothrombinase',
      role: 'cofactor',
      acceptsFactorId: 'FVa',
      placedFactorId: null,
      isAutoFilled: true,
    },
  ];
}

// =============================================================================
// COMPLEX SLOT POSITIONS (Activated Platelet panel)
// =============================================================================

export const COMPLEX_SLOT_POSITIONS: Record<string, ComplexSlotPosition> = {
  'tenase-cofactor': { slotId: 'tenase-cofactor', x: 30, y: 100, width: 100, height: 60 },
  'tenase-enzyme': { slotId: 'tenase-enzyme', x: 140, y: 100, width: 100, height: 60 },
  'prothrombinase-cofactor': { slotId: 'prothrombinase-cofactor', x: 30, y: 220, width: 100, height: 60 },
  'prothrombinase-enzyme': { slotId: 'prothrombinase-enzyme', x: 140, y: 220, width: 100, height: 60 },
} as const;

// =============================================================================
// COMPLEX LABELS
// =============================================================================

export const COMPLEX_LABELS = {
  tenase: { name: 'TENASE', output: 'FXa' },
  prothrombinase: { name: 'PROTHROMBINASE', output: 'Thrombin Burst' },
} as const;

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
  'tf-cell-fx': { slotId: 'tf-cell-fx', x: 40, y: 180, width: 100, height: 70 },
  'tf-cell-fix': { slotId: 'tf-cell-fix', x: 160, y: 180, width: 100, height: 70 },
  'tf-cell-fii': { slotId: 'tf-cell-fii', x: 100, y: 280, width: 100, height: 70 },
  'platelet-fv': { slotId: 'platelet-fv', x: 60, y: 180, width: 120, height: 80 },
  'platelet-fviii': { slotId: 'platelet-fviii', x: 60, y: 280, width: 140, height: 80 },
  // Clot Zone slots (Stabilization)
  'clot-zone-fibrin-1': { slotId: 'clot-zone-fibrin-1', x: 30, y: 100, width: 100, height: 70 },
  'clot-zone-fibrin-2': { slotId: 'clot-zone-fibrin-2', x: 170, y: 100, width: 100, height: 70 },
  'clot-zone-fibrin-3': { slotId: 'clot-zone-fibrin-3', x: 100, y: 200, width: 100, height: 70 },
  'clot-zone-fxiii': { slotId: 'clot-zone-fxiii', x: 100, y: 320, width: 100, height: 70 },
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
  clotIntegrityMeterFill: '#F97316', // orange
  clotIntegrityMeterBackground: '#1E293B',
  fibrinStrandColor: '#9CA3AF', // gray-400 - before cross-linking
  fibrinStrandCrossLinked: '#FBBF24', // amber - after FXIIIa
} as const;

// =============================================================================
// ANIMATION TIMING
// =============================================================================

export const ANIMATION = {
  factorFlipDuration: 400, // ms
  slotPulseDuration: 1000, // ms
  messageFadeDuration: 300, // ms
} as const;
