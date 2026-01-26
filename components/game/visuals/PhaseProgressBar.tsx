// components/game/visuals/PhaseProgressBar.tsx
'use client';

interface PhaseProgressBarProps {
  currentPhase: 'initiation' | 'amplification' | 'propagation' | 'burst' | 'complete';
  initiationProgress: number; // 0-100
  amplificationProgress: number; // 0-100
  propagationProgress: number; // 0-100
  position?: 'top' | 'bottom';
}

/**
 * PhaseProgressBar - Visual progress indicator for Hoffman-Monroe cascade
 *
 * Medical accuracy:
 * - Initiation (~100ms-1s): TF:VIIa → FIXa, FXa, trace FIIa
 * - Amplification (~1-10s): FIIa activates platelet, FV, FVIII, FXI
 * - Propagation (~10-60s): Tenase + Prothrombinase form on platelet
 * - Burst (~30-120s): Massive FIIa generation, fibrin formation
 */
export function PhaseProgressBar({
  currentPhase,
  initiationProgress,
  amplificationProgress,
  propagationProgress,
  position = 'top',
}: PhaseProgressBarProps): React.ReactElement {
  const phases = [
    {
      id: 'initiation',
      label: 'Inițiere',
      color: '#22C55E',
      progress: initiationProgress,
      icon: '⚡',
      duration: '~1s',
    },
    {
      id: 'amplification',
      label: 'Amplificare',
      color: '#EAB308',
      progress: amplificationProgress,
      icon: '🔄',
      duration: '~10s',
    },
    {
      id: 'propagation',
      label: 'Propagare',
      color: '#3B82F6',
      progress: propagationProgress,
      icon: '⚙️',
      duration: '~60s',
    },
    {
      id: 'burst',
      label: 'Burst',
      color: '#EF4444',
      progress: currentPhase === 'burst' || currentPhase === 'complete' ? 100 : 0,
      icon: '💥',
      duration: '~120s',
    },
  ];

  const currentIndex = phases.findIndex((p) => p.id === currentPhase);
  const isComplete = currentPhase === 'complete';

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '10px 20px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 14,
        border: '1px solid rgba(71, 85, 105, 0.6)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        zIndex: 50,
        minWidth: 300,
      }}
      role="progressbar"
      aria-label="Progres model Hoffman-Monroe"
    >
      {/* Phase label */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#CBD5E1',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Model Hoffman-Monroe
      </div>

      {/* Progress track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
        }}
      >
        {phases.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          const isPast = index < currentIndex || isComplete;
          const isFuture = index > currentIndex && !isComplete;

          return (
            <div
              key={phase.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {/* Phase icon/milestone */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isPast || isActive
                    ? phase.color
                    : 'rgba(71, 85, 105, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  border: isActive ? `2px solid ${phase.color}` : '2px solid transparent',
                  boxShadow: isActive
                    ? `0 0 12px ${phase.color}80`
                    : isPast
                    ? `0 0 8px ${phase.color}40`
                    : 'none',
                  transition: 'all 0.3s ease',
                  animation: isActive ? 'phasePulse 1.5s ease-in-out infinite' : 'none',
                }}
              >
                {isPast ? '✓' : phase.icon}
              </div>

              {/* Progress bar segment */}
              <div
                style={{
                  width: '100%',
                  height: 4,
                  background: 'rgba(71, 85, 105, 0.3)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${isPast ? 100 : isActive ? phase.progress : 0}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${phase.color}80 0%, ${phase.color} 100%)`,
                    borderRadius: 2,
                    transition: 'width 0.3s ease',
                    boxShadow: isActive ? `0 0 6px ${phase.color}` : 'none',
                  }}
                />
              </div>

              {/* Phase label */}
              <div
                style={{
                  fontSize: 7,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? phase.color : isPast ? '#94A3B8' : '#64748B',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                {phase.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current phase indicator */}
      {!isComplete && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: `${phases[currentIndex]?.color ?? '#94A3B8'}20`,
            borderRadius: 6,
            marginTop: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: phases[currentIndex]?.color ?? '#94A3B8',
              animation: 'statusBlink 1s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: phases[currentIndex]?.color ?? '#94A3B8',
            }}
          >
            {phases[currentIndex]?.label} în desfășurare
          </span>
        </div>
      )}

      {/* Complete indicator */}
      {isComplete && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: 6,
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 10 }}>✅</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: '#10B981',
            }}
          >
            Cascada completă - Cheag format
          </span>
        </div>
      )}

      <style>
        {`
          @keyframes phasePulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
          @keyframes statusBlink {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.4;
            }
          }
        `}
      </style>
    </div>
  );
}
