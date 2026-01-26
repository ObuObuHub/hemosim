// components/game/ModeToggle.tsx
// Learning Mode Toggle for Interactive Coagulation Tool
'use client';

import type { PlayMode } from '@/data/cascadeSteps';

interface ModeToggleProps {
  mode: PlayMode;
  onModeChange: (mode: PlayMode) => void;
  disabled?: boolean;
}

/**
 * Learning Mode Toggle
 * - Ghidat (Guided): Learner controls each step with instructional prompts
 * - Demo (Demonstration): System executes cascade for observation
 */
export function ModeToggle({
  mode,
  onModeChange,
  disabled = false,
}: ModeToggleProps): React.ReactElement {
  const isAuto = mode === 'auto';

  const handleClick = (newMode: PlayMode): void => {
    if (!disabled && newMode !== mode) {
      onModeChange(newMode);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        border: '2px solid #CBD5E1',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
      }}
      role="tablist"
      aria-label="Mod de învățare"
    >
      {/* Guided mode button */}
      <button
        type="button"
        role="tab"
        aria-selected={!isAuto}
        onClick={() => handleClick('manual')}
        disabled={disabled}
        style={{
          padding: '6px 14px',
          borderRadius: 16,
          border: 'none',
          background: !isAuto
            ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
            : 'transparent',
          color: !isAuto ? '#FFFFFF' : '#64748B',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.3,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled && isAuto) {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.color = '#3B82F6';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && isAuto) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Ghidat
      </button>

      {/* Demonstration mode button */}
      <button
        type="button"
        role="tab"
        aria-selected={isAuto}
        onClick={() => handleClick('auto')}
        disabled={disabled}
        style={{
          padding: '6px 14px',
          borderRadius: 16,
          border: 'none',
          background: isAuto
            ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
            : 'transparent',
          color: isAuto ? '#FFFFFF' : '#64748B',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.3,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isAuto) {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
            e.currentTarget.style.color = '#22C55E';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isAuto) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.5)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Demo
      </button>
    </div>
  );
}
