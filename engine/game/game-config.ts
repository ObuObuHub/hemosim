/**
 * Game configuration constants for the Coagulation Cascade Builder game.
 *
 * Players catch floating coagulation factors and dock them to build
 * Tenase and Prothrombinase complexes.
 */

// =============================================================================
// CANVAS DIMENSIONS
// =============================================================================

export const GAME_CANVAS = {
  /** Canvas width in pixels */
  width: 1000,
  /** Canvas height in pixels */
  height: 700,
} as const;

// =============================================================================
// TIMING CONSTANTS (in milliseconds)
// =============================================================================

export const TIMING = {
  /** Interval between factor spawns */
  spawnIntervalMs: 2000,
  /** Time window to catch a factor after tap/click */
  catchTimeoutMs: 500,
  /** Time before an antagonist targets an uncaught factor */
  dockTimeoutMs: 10000,
  /** Duration of catch animation */
  catchAnimationMs: 300,
  /** Duration of dock animation */
  dockAnimationMs: 500,
  /** Delay before next level starts */
  levelTransitionMs: 2000,
  /** Factor lifetime before it exits screen (if not caught) */
  factorLifetimeMs: 15000,
} as const;

// =============================================================================
// PHYSICS CONSTANTS
// =============================================================================

export const PHYSICS = {
  /** Minimum factor movement speed (pixels per frame at 60fps) */
  minSpeed: 1,
  /** Maximum factor movement speed (pixels per frame at 60fps) */
  maxSpeed: 3,
  /** Amplitude of sine wave drift pattern (pixels) */
  driftAmplitude: 20,
  /** Frequency of drift oscillation */
  driftFrequency: 0.02,
  /** Factor hitbox radius for tap detection (pixels) */
  hitboxRadius: 40,
  /** Snap distance for docking zones (pixels) */
  dockSnapDistance: 60,
} as const;

// =============================================================================
// SCORING
// =============================================================================

export const SCORING = {
  /** Points for catching a factor */
  catch: 10,
  /** Points for successfully docking a factor */
  dock: 50,
  /** Points for completing the Tenase complex (IXa + VIIIa) */
  tenaseComplete: 200,
  /** Points for completing the Prothrombinase complex (Xa + Va) */
  prothrombinaseComplete: 200,
  /** Bonus points for completing a level */
  levelBonus: 500,
  /** Multiplier for consecutive catches without miss */
  comboMultiplier: 0.1,
  /** Maximum combo multiplier */
  maxComboMultiplier: 3.0,
} as const;

// =============================================================================
// LIVES AND DIFFICULTY
// =============================================================================

/** Starting number of lives */
export const INITIAL_LIVES = 3;

/** Maximum lives a player can accumulate */
export const MAX_LIVES = 5;

/** Score threshold to earn an extra life */
export const EXTRA_LIFE_THRESHOLD = 1000;

// =============================================================================
// FACTOR VISUAL CONFIGURATION
// =============================================================================

export const FACTOR_VISUALS = {
  /** Base radius of factor circles (pixels) */
  baseRadius: 35,
  /** Font size for factor labels */
  labelFontSize: 14,
  /** Glow effect radius when factor is highlighted */
  glowRadius: 8,
  /** Opacity of inactive/uncatchable factors */
  inactiveOpacity: 0.4,
} as const;

// =============================================================================
// DOCK ZONE CONFIGURATION
// =============================================================================

export const DOCK_ZONES = {
  /** Tenase complex dock zone position */
  tenase: {
    x: 200,
    y: 550,
    width: 180,
    height: 100,
  },
  /** Prothrombinase complex dock zone position */
  prothrombinase: {
    x: 620,
    y: 550,
    width: 180,
    height: 100,
  },
} as const;

// =============================================================================
// LEVEL CONFIGURATION TYPES
// =============================================================================

/** Difficulty settings that scale per level */
export interface LevelDifficulty {
  /** Level number (1-based) */
  level: number;
  /** Factor spawn interval for this level (ms) */
  spawnIntervalMs: number;
  /** Speed multiplier for factors */
  speedMultiplier: number;
  /** Number of antagonist factors active */
  antagonistCount: number;
  /** Required complexes to complete the level */
  requiredComplexes: number;
}

/** Configuration for a specific level */
export interface LevelConfig {
  /** Level number */
  level: number;
  /** Level name/title */
  name: string;
  /** Educational description shown before level */
  description: string;
  /** Difficulty parameters */
  difficulty: LevelDifficulty;
  /** Which factors can spawn in this level */
  availableFactors: string[];
  /** Target complex(es) to build */
  targetComplexes: Array<'tenase' | 'prothrombinase'>;
  /** Optional tutorial hints for this level */
  hints?: string[];
}

// =============================================================================
// LEVEL PRESETS
// =============================================================================

/**
 * Default level configurations.
 * Level 1: Tutorial - build Tenase only
 * Level 2: Build Prothrombinase
 * Level 3+: Both complexes with increasing difficulty
 */
export const LEVEL_PRESETS: LevelConfig[] = [
  {
    level: 1,
    name: 'Tenase Complex',
    description:
      'Learn to build the Tenase complex by catching Factor IXa (enzyme) and Factor VIIIa (cofactor).',
    difficulty: {
      level: 1,
      spawnIntervalMs: 2500,
      speedMultiplier: 0.8,
      antagonistCount: 0,
      requiredComplexes: 1,
    },
    availableFactors: ['F9a', 'F8a'],
    targetComplexes: ['tenase'],
    hints: [
      'Tap factors to catch them',
      'Drag caught factors to the dock zone',
      'IXa is the enzyme, VIIIa is the cofactor',
    ],
  },
  {
    level: 2,
    name: 'Prothrombinase Complex',
    description:
      'Build the Prothrombinase complex using Factor Xa (enzyme) and Factor Va (cofactor).',
    difficulty: {
      level: 2,
      spawnIntervalMs: 2200,
      speedMultiplier: 1.0,
      antagonistCount: 0,
      requiredComplexes: 1,
    },
    availableFactors: ['F10a', 'F5a'],
    targetComplexes: ['prothrombinase'],
    hints: [
      'Xa is the enzyme, Va is the cofactor',
      'Together they convert prothrombin to thrombin',
    ],
  },
  {
    level: 3,
    name: 'Both Complexes',
    description: 'Build both Tenase and Prothrombinase complexes before time runs out.',
    difficulty: {
      level: 3,
      spawnIntervalMs: 2000,
      speedMultiplier: 1.2,
      antagonistCount: 1,
      requiredComplexes: 2,
    },
    availableFactors: ['F9a', 'F8a', 'F10a', 'F5a'],
    targetComplexes: ['tenase', 'prothrombinase'],
    hints: ['Watch out for antagonist factors!', 'Build complexes in any order'],
  },
  {
    level: 4,
    name: 'Anticoagulant Challenge',
    description: 'Build complexes while avoiding Antithrombin and Protein C interference.',
    difficulty: {
      level: 4,
      spawnIntervalMs: 1800,
      speedMultiplier: 1.4,
      antagonistCount: 2,
      requiredComplexes: 3,
    },
    availableFactors: ['F9a', 'F8a', 'F10a', 'F5a', 'AT', 'APC'],
    targetComplexes: ['tenase', 'prothrombinase'],
  },
  {
    level: 5,
    name: 'Cascade Master',
    description: 'The ultimate challenge - fast spawns, multiple antagonists, more complexes.',
    difficulty: {
      level: 5,
      spawnIntervalMs: 1500,
      speedMultiplier: 1.6,
      antagonistCount: 3,
      requiredComplexes: 4,
    },
    availableFactors: ['F9a', 'F8a', 'F10a', 'F5a', 'AT', 'APC', 'TFPI'],
    targetComplexes: ['tenase', 'prothrombinase'],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get level configuration by level number.
 * Returns the last level config if level exceeds available presets.
 */
export function getLevelConfig(level: number): LevelConfig {
  const index = Math.min(level - 1, LEVEL_PRESETS.length - 1);
  const baseConfig = LEVEL_PRESETS[Math.max(0, index)];

  // For levels beyond presets, scale difficulty
  if (level > LEVEL_PRESETS.length) {
    const scaleFactor = 1 + (level - LEVEL_PRESETS.length) * 0.1;
    return {
      ...baseConfig,
      level,
      name: `Level ${level}`,
      difficulty: {
        ...baseConfig.difficulty,
        level,
        spawnIntervalMs: Math.max(1000, baseConfig.difficulty.spawnIntervalMs - (level - LEVEL_PRESETS.length) * 100),
        speedMultiplier: baseConfig.difficulty.speedMultiplier * scaleFactor,
        antagonistCount: Math.min(5, baseConfig.difficulty.antagonistCount + Math.floor((level - LEVEL_PRESETS.length) / 2)),
        requiredComplexes: baseConfig.difficulty.requiredComplexes + Math.floor((level - LEVEL_PRESETS.length) / 2),
      },
    };
  }

  return baseConfig;
}

/**
 * Calculate score with combo multiplier.
 */
export function calculateScore(basePoints: number, comboCount: number): number {
  const multiplier = Math.min(
    SCORING.maxComboMultiplier,
    1 + comboCount * SCORING.comboMultiplier
  );
  return Math.round(basePoints * multiplier);
}
