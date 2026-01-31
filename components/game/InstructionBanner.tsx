// components/game/InstructionBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import type { CascadeStep } from '@/data/cascadeSteps';

interface InstructionBannerProps {
  currentStep: CascadeStep | null;
  currentStepIndex: number;
  totalSteps: number;
  isComplete: boolean;
}

/**
 * Top banner showing current instruction in Manual mode
 * Shows step counter and instruction text with slide animation on step change
 */
export function InstructionBanner({
  currentStep,
  currentStepIndex,
  totalSteps,
  isComplete,
}: InstructionBannerProps): React.ReactElement | null {
  const [animationKey, setAnimationKey] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Trigger animation when step changes
  useEffect(() => {
    // Defer state updates to avoid cascading renders
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

  if (isComplete) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '10px 20px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          ✓
        </div>
        <div>
          <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
            CASCADĂ COMPLETĂ
          </div>
          <div style={{ color: '#D1FAE5', fontSize: 10 }}>
            Toate cele {totalSteps} etape finalizate
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return null;
  }

  // Get phase color
  const getPhaseColor = (): string => {
    switch (currentStep.phase) {
      case 'initiation':
        return '#22C55E';
      case 'amplification':
        return '#EAB308';
      case 'propagation':
        return '#3B82F6';
      default:
        return '#64748B';
    }
  };

  const phaseColor = getPhaseColor();

  return (
    <div
      key={animationKey}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
      role="status"
      aria-live="polite"
    >
      {/* Colored left border indicating phase */}
      <div
        style={{
          width: 4,
          background: phaseColor,
          flexShrink: 0,
        }}
      />

      {/* Step counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 14px',
          background: 'rgba(241, 245, 249, 0.8)',
          borderRight: '1px solid #E2E8F0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: phaseColor,
              lineHeight: 1,
            }}
          >
            {currentStepIndex + 1}
          </div>
          <div
            style={{
              fontSize: 9,
              color: '#94A3B8',
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            / {totalSteps}
          </div>
        </div>
      </div>

      {/* Instruction text */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8px 16px',
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: phaseColor,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 2,
          }}
        >
          {currentStep.phase === 'initiation' && 'Inițiere'}
          {currentStep.phase === 'amplification' && 'Amplificare'}
          {currentStep.phase === 'propagation' && 'Propagare'}
          {currentStep.isAutomatic && ' · Automat'}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#1E293B',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {currentStep.instruction}
        </div>
      </div>

      {/* Auto indicator for automatic steps */}
      {currentStep.isAutomatic && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            background: 'rgba(241, 245, 249, 0.5)',
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '2px solid #94A3B8',
              borderTopColor: phaseColor,
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}

      {/* CSS for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
