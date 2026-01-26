// components/game/educational/ReactionEquation.tsx
'use client';

interface ReactionEquationProps {
  reaction: keyof typeof REACTIONS;
  isActive?: boolean;
  showCatalyst?: boolean;
  compact?: boolean;
}

// Predefined reaction equations based on Hoffman-Monroe model
const REACTIONS = {
  // Initiation phase
  'TF-VIIa-formation': {
    reactants: ['TF', 'FVII'],
    products: ['TF-VIIa'],
    catalyst: null,
    description: 'Formarea complexului inițiator',
    phase: 'initiation',
  },
  'FIX-activation-TFVIIa': {
    reactants: ['FIX'],
    products: ['FIXa'],
    catalyst: 'TF-VIIa',
    description: 'Activarea FIX de către TF-VIIa',
    phase: 'initiation',
  },
  'FX-activation-TFVIIa': {
    reactants: ['FX'],
    products: ['FXa'],
    catalyst: 'TF-VIIa',
    description: 'Activarea FX de către TF-VIIa',
    phase: 'initiation',
  },
  'initial-thrombin': {
    reactants: ['FII'],
    products: ['FIIa'],
    catalyst: 'FXa + FVa',
    description: 'Generarea trombinei inițiale',
    phase: 'initiation',
  },

  // Amplification phase
  'FV-activation': {
    reactants: ['FV'],
    products: ['FVa'],
    catalyst: 'FIIa',
    description: 'Activarea cofactorului FV',
    phase: 'amplification',
  },
  'FVIII-release': {
    reactants: ['vWF-FVIII'],
    products: ['vWF', 'FVIIIa'],
    catalyst: 'FIIa',
    description: 'Eliberarea și activarea FVIII',
    phase: 'amplification',
  },
  'FXI-activation': {
    reactants: ['FXI'],
    products: ['FXIa'],
    catalyst: 'FIIa',
    description: 'Activarea FXI (feedback pozitiv)',
    phase: 'amplification',
  },
  'PAR-cleavage': {
    reactants: ['PAR1'],
    products: ['PAR1*'],
    catalyst: 'FIIa',
    description: 'Clivarea receptorului PAR1',
    phase: 'amplification',
  },

  // Propagation phase
  'tenase-FX': {
    reactants: ['FX'],
    products: ['FXa'],
    catalyst: 'FIXa + FVIIIa',
    description: 'Tenase: ×200.000 mai eficient',
    phase: 'propagation',
  },
  'prothrombinase-FII': {
    reactants: ['FII'],
    products: ['FIIa'],
    catalyst: 'FXa + FVa',
    description: 'Protrombinase: ×300.000 mai eficient',
    phase: 'propagation',
  },
  'FIX-activation-FXIa': {
    reactants: ['FIX'],
    products: ['FIXa'],
    catalyst: 'FXIa',
    description: 'Feedback: mai mult FIXa',
    phase: 'propagation',
  },

  // Burst phase
  'fibrin-formation': {
    reactants: ['Fibrinogen'],
    products: ['Fibrină'],
    catalyst: 'FIIa',
    description: 'Conversie fibrinogen → fibrină',
    phase: 'burst',
  },
  'FXIII-activation': {
    reactants: ['FXIII'],
    products: ['FXIIIa'],
    catalyst: 'FIIa',
    description: 'Activarea factor XIII',
    phase: 'burst',
  },
  'fibrin-crosslink': {
    reactants: ['Fibrină'],
    products: ['Fibrină (cross-linked)'],
    catalyst: 'FXIIIa',
    description: 'Stabilizarea cheagului',
    phase: 'burst',
  },
} as const;

// Phase colors
const PHASE_COLORS: Record<string, { primary: string; secondary: string }> = {
  initiation: { primary: '#22C55E', secondary: '#4ADE80' },
  amplification: { primary: '#EAB308', secondary: '#FCD34D' },
  propagation: { primary: '#3B82F6', secondary: '#60A5FA' },
  burst: { primary: '#DC2626', secondary: '#F87171' },
};

/**
 * ReactionEquation - Displays a biochemical reaction equation
 *
 * Shows substrate → product with catalyst above arrow
 */
export function ReactionEquation({
  reaction,
  isActive = true,
  showCatalyst = true,
  compact = false,
}: ReactionEquationProps): React.ReactElement {
  const data = REACTIONS[reaction];
  if (!data) return <></>;

  const colors = PHASE_COLORS[data.phase];
  const opacity = isActive ? 1 : 0.5;

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 6px',
          background: `${colors.primary}20`,
          borderRadius: 4,
          opacity,
        }}
      >
        <span style={{ color: '#CBD5E1', fontSize: 9, fontFamily: 'monospace' }}>
          {data.reactants.join(' + ')}
        </span>
        <span style={{ color: colors.primary, fontSize: 10 }}>→</span>
        <span style={{ color: colors.secondary, fontSize: 9, fontWeight: 600, fontFamily: 'monospace' }}>
          {data.products.join(' + ')}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        border: `1px solid ${colors.primary}66`,
        borderRadius: 8,
        opacity,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Description */}
      <div style={{ color: '#94A3B8', fontSize: 9, marginBottom: 6 }}>
        {data.description}
      </div>

      {/* Equation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '6px 0',
        }}
      >
        {/* Reactants */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {data.reactants.map((r, i) => (
            <span key={i}>
              <span
                style={{
                  color: '#E2E8F0',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  background: 'rgba(71, 85, 105, 0.4)',
                  borderRadius: 4,
                }}
              >
                {r}
              </span>
              {i < data.reactants.length - 1 && (
                <span style={{ color: '#64748B', margin: '0 2px' }}>+</span>
              )}
            </span>
          ))}
        </div>

        {/* Arrow with catalyst */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {showCatalyst && data.catalyst && (
            <span
              style={{
                color: colors.secondary,
                fontSize: 8,
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              {data.catalyst}
            </span>
          )}
          <span
            style={{
              color: colors.primary,
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            →
          </span>
        </div>

        {/* Products */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {data.products.map((p, i) => (
            <span key={i}>
              <span
                style={{
                  color: colors.secondary,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  background: `${colors.primary}30`,
                  borderRadius: 4,
                  border: `1px solid ${colors.primary}66`,
                }}
              >
                {p}
              </span>
              {i < data.products.length - 1 && (
                <span style={{ color: '#64748B', margin: '0 2px' }}>+</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reaction cascade display - shows multiple equations in sequence
interface ReactionCascadeProps {
  reactions: Array<keyof typeof REACTIONS>;
  activeIndex?: number;
  orientation?: 'vertical' | 'horizontal';
}

export function ReactionCascade({
  reactions,
  activeIndex,
  orientation = 'vertical',
}: ReactionCascadeProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: orientation === 'vertical' ? 8 : 12,
        alignItems: orientation === 'vertical' ? 'stretch' : 'center',
      }}
    >
      {reactions.map((reaction, index) => (
        <div key={reaction} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ReactionEquation
            reaction={reaction}
            isActive={activeIndex === undefined || index <= activeIndex}
            compact={orientation === 'horizontal'}
          />
          {orientation === 'vertical' && index < reactions.length - 1 && (
            <div
              style={{
                alignSelf: 'center',
                color: activeIndex !== undefined && index < activeIndex ? '#4ADE80' : '#475569',
                fontSize: 12,
              }}
            >
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Export REACTIONS for external use
export { REACTIONS };
