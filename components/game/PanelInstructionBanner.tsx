// components/game/PanelInstructionBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import type { CascadeStep } from '@/data/cascadeSteps';

interface PanelInstructionBannerProps {
  panelId: 'spark' | 'platelet';
  currentStep: CascadeStep | null;
  currentStepIndex: number;
  totalSteps: number;
  isComplete: boolean;
  isActive: boolean;  // Dimmed when another panel is active
  phaseName: string;  // e.g., "Inițiere", "Amplificare", "Propagare", "Coagulare"
}

/**
 * Compact instruction banner for display inside each panel
 *
 * Shows biochemical instructions describing biological events,
 * NOT UI actions ("click on X").
 *
 * Format:
 * ┌─────────────────────────────────────────────┐
 * │ ● Etapa 3/5 · Inițiere                      │
 * │ TF-VIIa activează FX - formarea FXa         │
 * └─────────────────────────────────────────────┘
 */
export function PanelInstructionBanner({
  panelId,
  currentStep,
  currentStepIndex,
  totalSteps,
  isComplete,
  isActive,
  phaseName,
}: PanelInstructionBannerProps): React.ReactElement | null {
  const [animationKey, setAnimationKey] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Trigger animation when step changes
  useEffect(() => {
    const hideTimer = setTimeout(() => setIsVisible(false), 0);
    const showTimer = setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setIsVisible(true);
    }, 150);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }, [currentStepIndex]);

  // Get phase color based on current phase
  const getPhaseColor = (): string => {
    if (!currentStep) return '#64748B';
    switch (currentStep.phase) {
      case 'initiation':
        return '#22C55E'; // Green
      case 'amplification':
        return '#EAB308'; // Amber
      case 'propagation':
        return '#3B82F6'; // Blue
      case 'clotting':
        return '#DC2626'; // Red
      default:
        return '#64748B'; // Gray
    }
  };

  const phaseColor = getPhaseColor();
  const dimmedOpacity = isActive ? 1 : 0.5;

  // Completed state
  if (isComplete) {
    const completionMessage = panelId === 'spark'
      ? 'Faza de Inițiere completă'
      : 'Cascada de coagulare completă';

    return (
      <div
        style={{
          position: 'relative',
          margin: '8px 8px 0',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.1) 100%)',
          borderRadius: 6,
          border: '1px solid rgba(34, 197, 94, 0.3)',
          opacity: dimmedOpacity,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            ✓
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              color: '#16A34A',
            }}
          >
            {completionMessage}
          </div>
        </div>
      </div>
    );
  }

  // Not yet started - show nothing
  if (currentStepIndex < 0 || !currentStep) {
    return null;
  }

  // Active instruction
  const displayStepNumber = Math.min(currentStepIndex + 1, totalSteps);

  return (
    <div
      key={animationKey}
      style={{
        position: 'relative',
        margin: '8px 8px 0',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 8,
        border: '1px solid #CBD5E1',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        opacity: isVisible ? dimmedOpacity : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
      role="status"
      aria-live="polite"
    >
      {/* Colored left accent */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: phaseColor,
        }}
      />

      <div style={{ padding: '10px 12px 12px 16px' }}>
        {/* Header row: step counter and phase */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          {/* Active indicator dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: phaseColor,
              animation: isActive ? 'pulseIndicator 2s ease-in-out infinite' : 'none',
            }}
          />

          {/* Step counter */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              color: phaseColor,
            }}
          >
            Etapa {displayStepNumber}/{totalSteps}
          </span>

          {/* Separator */}
          <span
            style={{
              fontSize: 10,
              color: '#CBD5E1',
            }}
          >
            ·
          </span>

          {/* Phase name */}
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {phaseName}
          </span>

          {/* Auto indicator */}
          {currentStep.isAutomatic && (
            <div
              style={{
                marginLeft: 'auto',
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1.5px solid #94A3B8',
                borderTopColor: phaseColor,
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
        </div>

        {/* Instruction text */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
            color: '#0F172A',
            lineHeight: 1.5,
          }}
        >
          {currentStep.instruction}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulseIndicator {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
