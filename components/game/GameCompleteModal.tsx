'use client';

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import type { ComplexState } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

interface GameCompleteModalProps {
  /** Whether the player won or lost */
  isVictory: boolean;
  /** Final score achieved */
  score: number;
  /** Current level number (1-based) */
  currentLevel: number;
  /** Name of the level */
  levelName: string;
  /** Complexes that were built during the game */
  complexesBuilt: ComplexState[];
  /** Callback when player wants to play the same level again */
  onPlayAgain: () => void;
  /** Callback when player wants to proceed to next level (victory only) */
  onNextLevel: () => void;
  /** Callback when player wants to return to main menu */
  onMainMenu: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS = {
  backdrop: 'rgba(10, 15, 26, 0.85)',
  modal: {
    background: '#1e293b',
    border: 'rgba(71, 85, 105, 0.5)',
  },
  victory: {
    primary: '#22c55e',    // Green
    secondary: '#86efac',  // Light green
    glow: 'rgba(34, 197, 94, 0.3)',
  },
  defeat: {
    primary: '#ef4444',    // Red
    secondary: '#fca5a5',  // Light red
    glow: 'rgba(239, 68, 68, 0.3)',
  },
  text: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
  pathway: {
    intrinsic: '#3b82f6',    // Blue - Tenase
    common: '#10b981',       // Emerald - Prothrombinase
  },
  button: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: 'transparent',
    secondaryBorder: '#475569',
    secondaryHover: '#334155',
  },
} as const;

const EDUCATIONAL_CONTENT = {
  tenase: {
    title: 'Tenase Complex',
    description: 'Factor IXa (enzyme) + Factor VIIIa (cofactor) on platelet membrane produces Factor Xa',
    shortDescription: 'You built the Tenase complex (IXa + VIIIa)',
  },
  prothrombinase: {
    title: 'Prothrombinase Complex',
    description: 'Factor Xa (enzyme) + Factor Va (cofactor) converts Prothrombin to Thrombin',
    shortDescription: 'You built the Prothrombinase complex (Xa + Va)',
  },
  cascade: {
    fact: 'Together, these enzyme complexes amplify the coagulation cascade by 1000x',
  },
  defeatHints: [
    'Remember: Enzymes (IXa, Xa) go in the left slots, cofactors (VIIIa, Va) in the right slots.',
    'Build the Tenase complex first - it produces Factor Xa needed for Prothrombinase.',
    'Catch factors quickly as they float by - timing is crucial!',
    'Focus on one complex at a time for better efficiency.',
  ],
} as const;

const STYLES = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: COLORS.backdrop,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.3s ease-out',
  },
  modal: {
    backgroundColor: COLORS.modal.background,
    borderRadius: '16px',
    border: `1px solid ${COLORS.modal.border}`,
    padding: '32px 40px',
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'slideIn 0.4s ease-out',
    textAlign: 'center' as const,
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  subtitle: {
    fontSize: '16px',
    color: COLORS.text.secondary,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  scoreSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '12px',
    padding: '16px 24px',
    marginBottom: '24px',
  },
  scoreLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: COLORS.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  scoreValue: {
    fontSize: '36px',
    fontWeight: 700,
    color: COLORS.text.primary,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  educationalSection: {
    textAlign: 'left' as const,
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.text.secondary,
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  complexItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  complexIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 700,
    color: COLORS.text.primary,
    flexShrink: 0,
  },
  complexText: {
    flex: 1,
  },
  complexTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.text.primary,
    marginBottom: '2px',
  },
  complexDescription: {
    fontSize: '12px',
    color: COLORS.text.secondary,
    lineHeight: 1.4,
  },
  factBox: {
    padding: '12px 16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeft: `3px solid ${COLORS.pathway.intrinsic}`,
    borderRadius: '0 8px 8px 0',
    marginTop: '16px',
  },
  factText: {
    fontSize: '13px',
    color: COLORS.text.secondary,
    fontStyle: 'italic' as const,
    lineHeight: 1.5,
  },
  hintBox: {
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeft: `3px solid ${COLORS.defeat.primary}`,
    borderRadius: '0 8px 8px 0',
    textAlign: 'left' as const,
  },
  hintText: {
    fontSize: '13px',
    color: COLORS.text.secondary,
    lineHeight: 1.5,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginTop: '24px',
  },
  primaryButton: {
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  secondaryButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    backgroundColor: COLORS.button.secondary,
    border: `1px solid ${COLORS.button.secondaryBorder}`,
    color: COLORS.text.secondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns a random hint for defeat scenarios.
 */
function getRandomHint(): string {
  const index = Math.floor(Math.random() * EDUCATIONAL_CONTENT.defeatHints.length);
  return EDUCATIONAL_CONTENT.defeatHints[index];
}

/**
 * Gets the color for a complex type.
 */
function getComplexColor(type: 'tenase' | 'prothrombinase'): string {
  return type === 'tenase' ? COLORS.pathway.intrinsic : COLORS.pathway.common;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ComplexItemProps {
  type: 'tenase' | 'prothrombinase';
  isActive: boolean;
}

function ComplexItem({ type, isActive }: ComplexItemProps): ReactElement {
  const content = EDUCATIONAL_CONTENT[type];
  const color = getComplexColor(type);
  const icon = type === 'tenase' ? 'T' : 'P';

  return (
    <div style={STYLES.complexItem}>
      <div
        style={{
          ...STYLES.complexIcon,
          backgroundColor: isActive ? color : 'rgba(100, 116, 139, 0.3)',
          opacity: isActive ? 1 : 0.5,
        }}
      >
        {icon}
      </div>
      <div style={STYLES.complexText}>
        <div
          style={{
            ...STYLES.complexTitle,
            color: isActive ? COLORS.text.primary : COLORS.text.muted,
          }}
        >
          {content.shortDescription}
        </div>
        <div style={STYLES.complexDescription}>{content.description}</div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Modal displayed when the game completes (victory or defeat).
 * Shows educational summary of what was accomplished and provides navigation options.
 */
export function GameCompleteModal({
  isVictory,
  score,
  currentLevel,
  levelName,
  complexesBuilt,
  onPlayAgain,
  onNextLevel,
  onMainMenu,
}: GameCompleteModalProps): ReactElement {
  const themeColors = isVictory ? COLORS.victory : COLORS.defeat;

  // Find which complexes were built and active
  const tenaseComplex = complexesBuilt.find((c) => c.type === 'tenase');
  const prothrombinaseComplex = complexesBuilt.find((c) => c.type === 'prothrombinase');

  // Memoize random hint to prevent changes on re-render
  const defeatHint = useMemo(() => getRandomHint(), []);

  return (
    <div style={STYLES.backdrop}>
      <div
        style={{
          ...STYLES.modal,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px ${themeColors.glow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={STYLES.header}>
          <h2
            style={{
              ...STYLES.title,
              color: themeColors.primary,
            }}
          >
            {isVictory ? 'Congratulations!' : "Time's Up!"}
          </h2>
          <p style={STYLES.subtitle}>
            {isVictory
              ? `Level ${currentLevel}: ${levelName} Complete`
              : `Level ${currentLevel}: ${levelName}`}
          </p>
        </div>

        {/* Score */}
        <div style={STYLES.scoreSection}>
          <div style={STYLES.scoreLabel}>Final Score</div>
          <div
            style={{
              ...STYLES.scoreValue,
              color: themeColors.primary,
            }}
          >
            {score.toLocaleString()}
          </div>
        </div>

        {/* Educational Summary */}
        <div style={STYLES.educationalSection}>
          <h3 style={STYLES.sectionTitle}>
            {isVictory ? 'What You Built' : 'What Went Wrong'}
          </h3>

          {isVictory ? (
            <>
              {/* Show built complexes */}
              <ComplexItem
                type="tenase"
                isActive={tenaseComplex?.isActive ?? false}
              />
              <ComplexItem
                type="prothrombinase"
                isActive={prothrombinaseComplex?.isActive ?? false}
              />

              {/* Educational fact */}
              <div style={STYLES.factBox}>
                <p style={STYLES.factText}>{EDUCATIONAL_CONTENT.cascade.fact}</p>
              </div>
            </>
          ) : (
            <>
              {/* Show progress and hint */}
              <ComplexItem
                type="tenase"
                isActive={tenaseComplex?.isActive ?? false}
              />
              <ComplexItem
                type="prothrombinase"
                isActive={prothrombinaseComplex?.isActive ?? false}
              />

              {/* Hint for improvement */}
              <div style={STYLES.hintBox}>
                <p style={STYLES.hintText}>{defeatHint}</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={STYLES.buttonGroup}>
          {isVictory ? (
            <>
              <button
                type="button"
                onClick={onNextLevel}
                style={{
                  ...STYLES.primaryButton,
                  backgroundColor: themeColors.primary,
                  color: COLORS.text.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                Next Level
              </button>
              <div style={STYLES.buttonRow}>
                <button
                  type="button"
                  onClick={onPlayAgain}
                  style={STYLES.secondaryButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.button.secondaryHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.button.secondary;
                  }}
                >
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={onMainMenu}
                  style={STYLES.secondaryButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.button.secondaryHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.button.secondary;
                  }}
                >
                  Main Menu
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onPlayAgain}
                style={{
                  ...STYLES.primaryButton,
                  backgroundColor: COLORS.button.primary,
                  color: COLORS.text.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.backgroundColor = COLORS.button.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = COLORS.button.primary;
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onMainMenu}
                style={STYLES.secondaryButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.button.secondaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.button.secondary;
                }}
              >
                Main Menu
              </button>
            </>
          )}
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default GameCompleteModal;
