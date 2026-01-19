// engine/game/game-config.ts
import type { Slot, Surface } from '@/types/game';

// =============================================================================
// CANVAS DIMENSIONS
// =============================================================================

export const GAME_CANVAS = {
  width: 1000,
  height: 700,
} as const;

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

export const LAYOUT = {
  // Header area (thrombin meter + message)
  header: {
    y: 0,
    height: 80,
  },
  // Surface panels area
  panels: {
    y: 80,
    height: 480,
  },
  // Factor palette area
  palette: {
    y: 560,
    height: 140,
  },
  // Panel widths (3 equal panels)
  panelWidth: Math.floor(GAME_CANVAS.width / 3),
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
    isComingSoon: true, // v2
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
    },
    {
      id: 'tf-cell-fii',
      surface: 'tf-cell',
      acceptsFactorId: 'FII',
      isLocked: false,
      placedFactorId: null,
      isActive: false,
    },
    // Platelet slots (Amplification) - locked until thrombin threshold
    {
      id: 'platelet-fv',
      surface: 'platelet',
      acceptsFactorId: 'FV',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
    },
    {
      id: 'platelet-fviii',
      surface: 'platelet',
      acceptsFactorId: 'FVIII',
      isLocked: true,
      placedFactorId: null,
      isActive: false,
    },
  ];
}

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
  'tf-cell-fx': { slotId: 'tf-cell-fx', x: 40, y: 200, width: 120, height: 80 },
  'tf-cell-fii': { slotId: 'tf-cell-fii', x: 180, y: 200, width: 120, height: 80 },
  'platelet-fv': { slotId: 'platelet-fv', x: 60, y: 180, width: 120, height: 80 },
  'platelet-fviii': { slotId: 'platelet-fviii', x: 60, y: 280, width: 140, height: 80 },
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
} as const;

// =============================================================================
// ANIMATION TIMING
// =============================================================================

export const ANIMATION = {
  factorFlipDuration: 400, // ms
  slotPulseDuration: 1000, // ms
  messageFadeDuration: 300, // ms
} as const;
