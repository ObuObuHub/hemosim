// components/game/TutorialOverlay.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { COLORS } from '@/engine/game/game-config';

// =============================================================================
// TYPES
// =============================================================================

interface TutorialOverlayProps {
  onDismiss: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Tutorial overlay for first-time players.
 * Shows basic instructions on how to play the game.
 */
export function TutorialOverlay({
  onDismiss,
}: TutorialOverlayProps): React.ReactElement {
  // Handle keyboard dismissal
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onDismiss();
      }
    },
    [onDismiss]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="tutorial-overlay"
      onClick={onDismiss}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
        cursor: 'pointer',
      }}
    >
      <div
        className="tutorial-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 32,
          maxWidth: 480,
          textAlign: 'center',
          border: `2px solid ${COLORS.panelBorder}`,
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)',
          cursor: 'default',
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#3B82F6',
            marginBottom: 8,
            letterSpacing: '1px',
          }}
        >
          How to Play
        </h2>

        <p
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 24,
          }}
        >
          Build the coagulation cascade to stop the bleeding!
        </p>

        {/* Instructions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          <div className="tutorial-step" style={stepStyle}>
            <div style={stepNumberStyle}>1</div>
            <div>
              <strong style={{ color: COLORS.textPrimary }}>Drag factors</strong>
              <p style={stepTextStyle}>
                Drag coagulation factors from the bloodstream to their matching slots on cell surfaces.
              </p>
            </div>
          </div>

          <div className="tutorial-step" style={stepStyle}>
            <div style={stepNumberStyle}>2</div>
            <div>
              <strong style={{ color: COLORS.textPrimary }}>Watch for antagonists</strong>
              <p style={stepTextStyle}>
                Antithrombin, APC, and Plasmin will try to destroy your factors. Grab factors before they do!
              </p>
            </div>
          </div>

          <div className="tutorial-step" style={stepStyle}>
            <div style={stepNumberStyle}>3</div>
            <div>
              <strong style={{ color: COLORS.textPrimary }}>Complete all phases</strong>
              <p style={stepTextStyle}>
                Progress through Initiation, Amplification, Propagation, and Stabilization to form a stable clot.
              </p>
            </div>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          style={{
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Got it!
        </button>

        <p
          style={{
            fontSize: 11,
            color: COLORS.textDim,
            marginTop: 12,
          }}
        >
          Press ESC, Enter, or click anywhere to dismiss
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const stepStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
};

const stepNumberStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  backgroundColor: '#3B82F6',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 700,
  color: '#FFFFFF',
  flexShrink: 0,
};

const stepTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94A3B8',
  marginTop: 4,
  lineHeight: 1.4,
};
