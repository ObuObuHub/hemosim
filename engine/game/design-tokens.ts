// engine/game/design-tokens.ts
// Centralized design tokens for visual consistency across all components

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const TYPOGRAPHY = {
  // Font family - use for all SVG text elements
  fontFamily: 'system-ui, sans-serif',

  // Factor labels (inside tokens/shapes)
  factorLabel: {
    fontSize: 11,
    fontWeight: 700,
    fill: '#FFFFFF',
  },

  // Small factor labels (for longer text like "FVIIIa")
  factorLabelSmall: {
    fontSize: 10,
    fontWeight: 700,
    fill: '#FFFFFF',
  },

  // Badge labels (complex names like "TF:VIIa", "Tenază")
  badgeLabel: {
    fontSize: 9,
    fontWeight: 700,
    fill: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Gla domain labels
  glaLabel: {
    fontSize: 7,
    fontWeight: 600,
    fill: '#374151',
  },
  calciumLabel: {
    fontSize: 6,
    fontWeight: 600,
    fill: '#64748B',
  },

  // UI text (banners, tooltips)
  heading: {
    fontSize: 14,
    fontWeight: 700,
  },
  body: {
    fontSize: 12,
    fontWeight: 600,
  },
  caption: {
    fontSize: 10,
    fontWeight: 500,
  },
  micro: {
    fontSize: 9,
    fontWeight: 600,
  },
} as const;

// =============================================================================
// COLORS - PHASE COLORS (consistent across all components)
// =============================================================================

export const PHASE_COLORS = {
  initiation: '#22C55E',      // Green - TF-cell, extrinsic pathway
  amplification: '#EAB308',   // Yellow/Amber - platelet activation
  propagation: '#3B82F6',     // Blue - activated platelet, thrombin burst
  stabilization: '#8B5CF6',   // Purple - fibrin cross-linking
  complete: '#22C55E',        // Green - success
} as const;

// =============================================================================
// COLORS - FACTOR COLORS (by type)
// =============================================================================

export const FACTOR_COLORS = {
  // Zymogens (inactive) - muted tones
  zymogen: {
    FII: '#06B6D4',     // Cyan
    FV: '#F97316',      // Orange
    FVII: '#DC2626',    // Red
    FVIII: '#8B5CF6',   // Purple
    FIX: '#06B6D4',     // Cyan
    FX: '#22C55E',      // Green
    FXI: '#3B82F6',     // Blue
    FXIII: '#EC4899',   // Pink
    Fibrinogen: '#FBBF24', // Amber
  },

  // Enzymes (active) - vibrant
  enzyme: {
    FIIa: '#DC2626',    // Thrombin - Red
    FVIIa: '#DC2626',   // Red
    FIXa: '#06B6D4',    // Cyan
    FXa: '#22C55E',     // Green
    FXIa: '#3B82F6',    // Blue
    FXIIIa: '#EC4899',  // Pink
  },

  // Cofactors (non-enzymatic)
  cofactor: {
    TF: '#22C55E',      // Tissue Factor - Green
    FVa: '#F97316',     // Orange
    FVIIIa: '#8B5CF6',  // Purple
  },
} as const;

// =============================================================================
// COLORS - UI COLORS
// =============================================================================

export const UI_COLORS = {
  // Backgrounds
  panelBg: '#1E293B',
  panelBgLocked: '#0F172A',
  tooltipBg: 'rgba(15, 23, 42, 0.98)',
  overlayBg: 'rgba(0, 0, 0, 0.9)',

  // Borders
  border: '#334155',
  borderActive: '#3B82F6',
  borderValid: '#22C55E',
  borderInvalid: '#EF4444',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDim: '#64748B',
  textMuted: '#475569',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

// =============================================================================
// SPACING & SIZING
// =============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const BORDER_RADIUS = {
  xs: 4,    // Small elements (badges, chips)
  sm: 6,    // Tokens, small cards
  md: 8,    // Panels, cards
  lg: 10,   // Complex containers
  xl: 12,   // Modals, large cards
} as const;

// =============================================================================
// STROKES & BORDERS
// =============================================================================

export const STROKES = {
  // SVG stroke widths
  thin: 1.5,
  normal: 2,
  thick: 3,
  heavy: 3.5,

  // Token/shape stroke color (white outline for contrast)
  tokenStroke: '#FFFFFF',
} as const;

// =============================================================================
// ANIMATION TIMINGS
// =============================================================================

export const ANIMATION = {
  // Duration tiers
  instant: 100,   // Micro-interactions
  fast: 150,      // Hover states, quick feedback
  normal: 300,    // Standard transitions
  slow: 500,      // Major state changes
  deliberate: 800, // Dramatic effects

  // Specific durations
  tooltipFade: 150,
  stepTransition: 200,
  phaseUnlock: 400,
  complexAssembly: 500,

  // Display durations (how long something stays visible)
  toastDisplay: 2000,
  bannerDisplay: 2000,

  // Easing functions
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const SHADOWS = {
  // Drop shadows for SVG elements
  token: 'drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.3))',
  tokenHover: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.4))',

  // Box shadows for HTML elements
  card: '0 4px 12px rgba(0, 0, 0, 0.15)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.5)',
  glow: (color: string, intensity: number = 0.4) =>
    `0 0 20px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
} as const;

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================

export const Z_INDEX = {
  base: 0,
  tokens: 10,
  labels: 20,
  animations: 30,
  overlay: 50,
  tooltip: 100,
  modal: 200,
  banner: 300,
} as const;

// =============================================================================
// TOKEN DIMENSIONS
// =============================================================================

export const TOKEN_SIZES = {
  // Enzyme tokens (circles with active site)
  enzyme: {
    width: 42,
    height: 42,
  },

  // Cofactor tokens (rectangles)
  cofactor: {
    width: 44,
    height: 36,
  },

  // Zymogen tokens (ovals)
  zymogen: {
    width: 50,
    height: 35,
  },

  // Active site dot
  activeSite: {
    width: 8,
    height: 8,
  },
} as const;

// =============================================================================
// COMPLEX COLORS (for EnzymeComplexV2 and similar)
// =============================================================================

export const COMPLEX_STYLES = {
  'extrinsic-tenase': {
    label: 'TF:VIIa',
    labelBg: '#16A34A',
    borderColor: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.08)',
    enzyme: { label: 'FVIIa', bg: '#DC2626', border: '#991B1B' },
    cofactor: { label: 'FT', bg: '#22C55E', border: '#15803D' },
  },
  'intrinsic-tenase': {
    label: 'Tenază',
    labelBg: '#0891B2',
    borderColor: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.08)',
    enzyme: { label: 'FIXa', bg: '#06B6D4', border: '#0E7490' },
    cofactor: { label: 'FVIIIa', bg: '#8B5CF6', border: '#6D28D9' },
  },
  prothrombinase: {
    label: 'Protrombinază',
    labelBg: '#3B82F6',
    borderColor: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.05)',
    enzyme: { label: 'FXa', bg: '#22C55E', border: '#15803D' },
    cofactor: { label: 'FVa', bg: '#F97316', border: '#C2410C' },
  },
} as const;
