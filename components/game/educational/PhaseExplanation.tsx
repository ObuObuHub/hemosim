// components/game/educational/PhaseExplanation.tsx
'use client';

import { useState } from 'react';
import { PHASE_INFO, type PhaseInfoData } from './FactorInfo';

interface PhaseExplanationProps {
  currentPhase: 'initiation' | 'amplification' | 'propagation' | 'burst';
  position?: 'top' | 'bottom';
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Time scale information for each phase
const PHASE_TIME_SCALES: Record<string, { duration: string; rate: string; context: string }> = {
  initiation: {
    duration: '~100 ms - 1 s',
    rate: 'Foarte rapidă',
    context: 'Expunerea TF la leziune declanșează cascada în milisecunde',
  },
  amplification: {
    duration: '~1 - 10 s',
    rate: 'Rapidă',
    context: 'Trombina activează trombocitul și cofactorii în secunde',
  },
  propagation: {
    duration: '~10 - 60 s',
    rate: 'Exponențială',
    context: 'Complexele enzimatice generează burst-ul de trombină',
  },
  burst: {
    duration: '~30 - 120 s',
    rate: 'Maximă',
    context: '~350 nM trombină → conversie rapidă fibrinogen → fibrină',
  },
};

// Phase colors
const PHASE_COLORS: Record<string, string> = {
  initiation: '#22C55E',
  amplification: '#EAB308',
  propagation: '#3B82F6',
  burst: '#DC2626',
};

/**
 * PhaseExplanation - Displays information about the current coagulation phase
 *
 * Shows:
 * - Phase name and Roman numeral
 * - Time scale (milliseconds/seconds/minutes)
 * - Key events happening in this phase
 * - Expected outcome
 */
export function PhaseExplanation({
  currentPhase,
  position = 'bottom',
  isExpanded: controlledExpanded,
  onToggle,
}: PhaseExplanationProps): React.ReactElement {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const handleToggle = (): void => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const phaseInfo = PHASE_INFO[currentPhase];
  const timeInfo = PHASE_TIME_SCALES[currentPhase];
  const phaseColor = PHASE_COLORS[currentPhase];

  if (!phaseInfo) {
    return <></>;
  }

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        maxWidth: 400,
        width: '90%',
      }}
    >
      {/* Collapsed view - just the phase indicator */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: `linear-gradient(135deg, ${phaseColor}E6 0%, ${phaseColor}CC 100%)`,
          border: 'none',
          borderRadius: isExpanded ? '10px 10px 0 0' : 10,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Phase badge */}
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              color: '#FFF',
              letterSpacing: 1,
            }}
          >
            {phaseInfo.romanPhase}
          </span>
          {/* Phase name */}
          <span style={{ color: '#FFF', fontSize: 14, fontWeight: 700 }}>
            {phaseInfo.name.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Time indicator */}
          <span
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              color: '#FFF',
              fontFamily: 'monospace',
            }}
          >
            ⏱ {timeInfo.duration}
          </span>
          {/* Toggle arrow */}
          <span
            style={{
              color: '#FFF',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              fontSize: 10,
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Expanded view - full details */}
      {isExpanded && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: `1px solid ${phaseColor}66`,
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '12px 16px',
            animation: 'phaseSlideDown 0.2s ease-out',
          }}
        >
          {/* Location */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: '#64748B', fontSize: 9, fontWeight: 600 }}>LOCAȚIE: </span>
            <span style={{ color: '#E2E8F0', fontSize: 11 }}>{phaseInfo.location}</span>
          </div>

          {/* Time scale details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 12,
              padding: '8px',
              background: 'rgba(71, 85, 105, 0.3)',
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ color: '#64748B', fontSize: 8, fontWeight: 600, marginBottom: 2 }}>
                DURATĂ
              </div>
              <div style={{ color: phaseColor, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                {timeInfo.duration}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 8, fontWeight: 600, marginBottom: 2 }}>
                VITEZĂ REACȚIE
              </div>
              <div style={{ color: '#E2E8F0', fontSize: 11, fontWeight: 600 }}>
                {timeInfo.rate}
              </div>
            </div>
          </div>

          {/* Context */}
          <div
            style={{
              padding: '6px 10px',
              background: `${phaseColor}20`,
              borderRadius: 6,
              borderLeft: `3px solid ${phaseColor}`,
              marginBottom: 12,
            }}
          >
            <span style={{ color: '#CBD5E1', fontSize: 10, lineHeight: 1.4 }}>
              {timeInfo.context}
            </span>
          </div>

          {/* Key events */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                color: '#64748B',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Evenimente Cheie
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {phaseInfo.keyEvents.map((event, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    padding: '4px 8px',
                    background: 'rgba(71, 85, 105, 0.2)',
                    borderRadius: 4,
                  }}
                >
                  <span style={{ color: phaseColor, fontSize: 10, fontWeight: 700 }}>
                    {index + 1}.
                  </span>
                  <span style={{ color: '#CBD5E1', fontSize: 10, lineHeight: 1.3 }}>
                    {event}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.15) 100%)',
              borderRadius: 8,
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <div style={{ color: '#64748B', fontSize: 8, fontWeight: 600, marginBottom: 4 }}>
              REZULTAT →
            </div>
            <div style={{ color: '#4ADE80', fontSize: 11, fontWeight: 600 }}>
              {phaseInfo.outcome}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes phaseSlideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
      `}</style>
    </div>
  );
}

// Compact phase indicator for use in frames
interface PhaseIndicatorProps {
  phase: 'initiation' | 'amplification' | 'propagation' | 'burst';
  showTimeScale?: boolean;
}

export function PhaseIndicator({ phase, showTimeScale = true }: PhaseIndicatorProps): React.ReactElement {
  const timeInfo = PHASE_TIME_SCALES[phase];
  const phaseInfo = PHASE_INFO[phase];
  const color = PHASE_COLORS[phase];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px',
        background: `${color}20`,
        border: `1px solid ${color}66`,
        borderRadius: 6,
      }}
    >
      <span style={{ color, fontSize: 10, fontWeight: 700 }}>
        {phaseInfo?.romanPhase}
      </span>
      {showTimeScale && (
        <span
          style={{
            color: '#94A3B8',
            fontSize: 9,
            fontFamily: 'monospace',
            padding: '1px 4px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
          }}
        >
          {timeInfo.duration}
        </span>
      )}
    </div>
  );
}
