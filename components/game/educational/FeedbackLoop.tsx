// components/game/educational/FeedbackLoop.tsx
'use client';

interface FeedbackLoopProps {
  isActive: boolean;
  showExplanation?: boolean;
  position?: { x: number; y: number };
  compact?: boolean;
}

/**
 * FeedbackLoop - Visualizes the positive feedback amplification in coagulation
 *
 * Medical Accuracy (Hoffman-Monroe model):
 * 1. Small amounts of thrombin (FIIa) are generated in initiation
 * 2. Thrombin activates FXI → FXIa on platelet surface
 * 3. FXIa activates more FIX → FIXa
 * 4. More FIXa → more Tenase → more FXa → more Prothrombinase → MORE THROMBIN
 * 5. This creates exponential amplification (positive feedback loop)
 *
 * This is why small amounts of thrombin from initiation can generate a burst!
 */
export function FeedbackLoop({
  isActive,
  showExplanation = true,
  position,
  compact = false,
}: FeedbackLoopProps): React.ReactElement {
  const x = position?.x ?? 0;
  const y = position?.y ?? 0;

  if (compact) {
    return (
      <div
        style={{
          position: position ? 'absolute' : 'relative',
          left: x,
          top: y,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: isActive
            ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.2) 100%)'
            : 'rgba(71, 85, 105, 0.2)',
          border: `1px solid ${isActive ? '#EC4899' : '#475569'}`,
          borderRadius: 6,
          opacity: isActive ? 1 : 0.5,
        }}
      >
        <span style={{ fontSize: 12 }}>🔄</span>
        <div>
          <div style={{ color: isActive ? '#F472B6' : '#94A3B8', fontSize: 9, fontWeight: 600 }}>
            FEEDBACK POZITIV
          </div>
          <div style={{ color: '#94A3B8', fontSize: 8 }}>
            FIIa → FXIa → FIXa → ↑↑ FIIa
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: position ? 'absolute' : 'relative',
        left: x,
        top: y,
        width: 200,
        padding: '12px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        border: `1px solid ${isActive ? '#EC4899' : '#475569'}`,
        borderRadius: 12,
        boxShadow: isActive ? '0 8px 32px rgba(236, 72, 153, 0.3)' : 'none',
        transition: 'all 0.3s ease',
        zIndex: 25,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 16,
            animation: isActive ? 'spinLoop 3s linear infinite' : 'none',
          }}
        >
          🔄
        </span>
        <div>
          <div style={{ color: '#F472B6', fontSize: 12, fontWeight: 700 }}>
            FEEDBACK POZITIV
          </div>
          <div style={{ color: '#94A3B8', fontSize: 9 }}>
            Amplificare exponențială
          </div>
        </div>
      </div>

      {/* Visual Loop Diagram */}
      <svg width={176} height={80} style={{ marginBottom: 8 }}>
        {/* Loop arrow background */}
        <defs>
          <marker
            id="feedback-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={isActive ? '#EC4899' : '#64748B'} />
          </marker>
        </defs>

        {/* Circular loop path */}
        <path
          d="M 88 15 C 140 15, 160 40, 140 60 C 120 80, 56 80, 36 60 C 16 40, 36 15, 88 15"
          fill="none"
          stroke={isActive ? '#EC4899' : '#475569'}
          strokeWidth={2}
          strokeDasharray={isActive ? 'none' : '6,3'}
          markerEnd="url(#feedback-arrow)"
          style={{
            animation: isActive ? 'loopDash 2s linear infinite' : 'none',
          }}
        />

        {/* Factor nodes */}
        {/* FIIa (Thrombin) - top */}
        <g transform="translate(88, 15)">
          <circle r={14} fill={isActive ? '#DC2626' : '#475569'} />
          <text textAnchor="middle" y={4} fontSize={8} fontWeight={700} fill="#FFF">
            IIa
          </text>
        </g>

        {/* FXI → FXIa - right */}
        <g transform="translate(145, 40)">
          <circle r={12} fill={isActive ? '#EC4899' : '#475569'} />
          <text textAnchor="middle" y={4} fontSize={7} fontWeight={600} fill="#FFF">
            XIa
          </text>
        </g>

        {/* FIX → FIXa - bottom */}
        <g transform="translate(88, 65)">
          <circle r={12} fill={isActive ? '#A855F7' : '#475569'} />
          <text textAnchor="middle" y={4} fontSize={7} fontWeight={600} fill="#FFF">
            IXa
          </text>
        </g>

        {/* Tenase → FXa - left */}
        <g transform="translate(31, 40)">
          <circle r={12} fill={isActive ? '#EF4444' : '#475569'} />
          <text textAnchor="middle" y={4} fontSize={7} fontWeight={600} fill="#FFF">
            Xa
          </text>
        </g>

        {/* Arrows between nodes */}
        {isActive && (
          <>
            <text x={120} y={22} fontSize={8} fill="#F472B6">→</text>
            <text x={120} y={58} fontSize={8} fill="#F472B6">↓</text>
            <text x={55} y={58} fontSize={8} fill="#F472B6">←</text>
            <text x={55} y={28} fontSize={8} fill="#F472B6">↑</text>
          </>
        )}

        {/* Center label */}
        <text x={88} y={42} textAnchor="middle" fontSize={6} fill="#94A3B8">
          ×amplificare
        </text>
      </svg>

      {/* Explanation */}
      {showExplanation && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              color: '#64748B',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            Mecanism
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { step: 1, text: 'FIIa (din inițiere) activează FXI', color: '#DC2626' },
              { step: 2, text: 'FXIa activează mai mult FIX', color: '#EC4899' },
              { step: 3, text: 'FIXa → Tenase → mai mult FXa', color: '#A855F7' },
              { step: 4, text: 'FXa → Protrombinase → BURST FIIa', color: '#EF4444' },
            ].map(({ step, text, color }) => (
              <div
                key={step}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                <span
                  style={{
                    color: color,
                    fontSize: 9,
                    fontWeight: 700,
                    minWidth: 14,
                  }}
                >
                  {step}.
                </span>
                <span style={{ color: '#CBD5E1', fontSize: 9, lineHeight: 1.3 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result indicator */}
      {isActive && (
        <div
          style={{
            marginTop: 10,
            padding: '6px 10px',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)',
            borderRadius: 6,
            border: '1px solid rgba(220, 38, 38, 0.4)',
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#F87171', fontSize: 10, fontWeight: 700 }}>
            Rezultat: Amplificare exponențială
          </div>
          <div style={{ color: '#94A3B8', fontSize: 8, marginTop: 2 }}>
            Cantități mici de FIIa → BURST masiv
          </div>
        </div>
      )}

      <style>{`
        @keyframes spinLoop {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loopDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  );
}

// Compact feedback indicator for use in frame badges
interface FeedbackIndicatorProps {
  isActive: boolean;
}

export function FeedbackIndicator({ isActive }: FeedbackIndicatorProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        background: isActive ? 'rgba(236, 72, 153, 0.2)' : 'rgba(71, 85, 105, 0.2)',
        border: `1px solid ${isActive ? '#EC4899' : '#475569'}`,
        borderRadius: 4,
      }}
    >
      <span
        style={{
          fontSize: 10,
          animation: isActive ? 'spinLoop 3s linear infinite' : 'none',
        }}
      >
        🔄
      </span>
      <span style={{ color: isActive ? '#F472B6' : '#94A3B8', fontSize: 8, fontWeight: 600 }}>
        FXI→FIXa
      </span>
      <style>{`
        @keyframes spinLoop {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
