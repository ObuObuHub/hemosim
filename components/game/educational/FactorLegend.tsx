// components/game/educational/FactorLegend.tsx
'use client';

import { useState } from 'react';

interface FactorLegendProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

interface LegendEntry {
  numeral: string;
  name: string;
  fullName: string;
  type: 'zimogen' | 'enzimă' | 'cofactor';
  color: string;
}

const LEGEND_ENTRIES: LegendEntry[] = [
  { numeral: 'II', name: 'Protrombină', fullName: 'Protrombina', type: 'zimogen', color: '#FBBF24' },
  { numeral: 'IIa', name: 'Trombină', fullName: 'Trombina', type: 'enzimă', color: '#DC2626' },
  { numeral: 'V', name: 'Factor V', fullName: 'Proacelerina', type: 'zimogen', color: '#3B82F6' },
  { numeral: 'Va', name: 'Factor Va', fullName: 'Cofactor Protrombinase', type: 'cofactor', color: '#60A5FA' },
  { numeral: 'VII', name: 'Factor VII', fullName: 'Proconvertina', type: 'zimogen', color: '#F97316' },
  { numeral: 'VIIa', name: 'Factor VIIa', fullName: 'Enzimă TF-pathway', type: 'enzimă', color: '#EA580C' },
  { numeral: 'VIII', name: 'Factor VIII', fullName: 'Antihemofilic A', type: 'zimogen', color: '#22C55E' },
  { numeral: 'VIIIa', name: 'Factor VIIIa', fullName: 'Cofactor Tenase', type: 'cofactor', color: '#4ADE80' },
  { numeral: 'IX', name: 'Factor IX', fullName: 'Factor Christmas', type: 'zimogen', color: '#A855F7' },
  { numeral: 'IXa', name: 'Factor IXa', fullName: 'Enzimă Tenase', type: 'enzimă', color: '#C084FC' },
  { numeral: 'X', name: 'Factor X', fullName: 'Stuart-Prower', type: 'zimogen', color: '#EF4444' },
  { numeral: 'Xa', name: 'Factor Xa', fullName: 'Enzimă Protrombinase', type: 'enzimă', color: '#F87171' },
  { numeral: 'XI', name: 'Factor XI', fullName: 'PTA', type: 'zimogen', color: '#EC4899' },
  { numeral: 'XIa', name: 'Factor XIa', fullName: 'Feedback amplificare', type: 'enzimă', color: '#F472B6' },
];

const TYPE_INFO = {
  zimogen: {
    label: 'Zimogen',
    description: 'Precursor inactiv (formă blob)',
    color: '#94A3B8',
  },
  enzimă: {
    label: 'Enzimă',
    description: 'Serin-protează activă (formă Pac-Man)',
    color: '#EF4444',
  },
  cofactor: {
    label: 'Cofactor',
    description: 'Amplifică activitatea enzimei (formă fasole)',
    color: '#3B82F6',
  },
};

/**
 * FactorLegend - Displays a collapsible legend explaining factor nomenclature
 *
 * Shows:
 * - Roman numeral → Factor name → Full name
 * - Color coding by factor family
 * - Shape explanation (zimogen, enzyme, cofactor)
 */
export function FactorLegend({
  isExpanded: controlledExpanded,
  onToggle,
  position = 'bottom-right',
}: FactorLegendProps): React.ReactElement {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const handleToggle = (): void => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right': { top: 50, right: 12 },
    'bottom-right': { bottom: 50, right: 12 },
    'top-left': { top: 50, left: 12 },
    'bottom-left': { bottom: 50, left: 12 },
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        zIndex: 100,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: isExpanded
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)'
            : 'rgba(51, 65, 85, 0.9)',
          border: '1px solid',
          borderColor: isExpanded ? '#3B82F6' : '#475569',
          borderRadius: isExpanded ? '8px 8px 0 0' : 8,
          color: '#FFF',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: 14 }}>📚</span>
        <span>Legendă Factori</span>
        <span
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: 10,
          }}
        >
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1px solid #475569',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: '12px',
            maxHeight: 400,
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            animation: 'legendSlideDown 0.2s ease-out',
          }}
        >
          {/* Shape Legend */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                color: '#64748B',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Forme = Tipuri Proteice
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(TYPE_INFO).map(([type, info]) => (
                <div
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    background: 'rgba(71, 85, 105, 0.3)',
                    borderRadius: 6,
                  }}
                >
                  <ShapeIcon type={type as 'zimogen' | 'enzimă' | 'cofactor'} />
                  <div>
                    <div style={{ color: info.color, fontSize: 10, fontWeight: 600 }}>
                      {info.label}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 8 }}>{info.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nomenclature Key */}
          <div
            style={{
              padding: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              borderRadius: 8,
              marginBottom: 12,
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <div style={{ color: '#60A5FA', fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
              Nomenclatură: "a" = Activat
            </div>
            <div style={{ color: '#94A3B8', fontSize: 9 }}>
              FX → Factor X (zimogen) <br />
              FXa → Factor X activat (enzimă)
            </div>
          </div>

          {/* Factor List */}
          <div
            style={{
              color: '#64748B',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Factori Coagulare
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {LEGEND_ENTRIES.map((entry) => (
              <div
                key={entry.numeral}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr',
                  gap: 8,
                  alignItems: 'center',
                  padding: '4px 6px',
                  background: 'rgba(71, 85, 105, 0.2)',
                  borderRadius: 4,
                  borderLeft: `3px solid ${entry.color}`,
                }}
              >
                <span
                  style={{
                    color: entry.color,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  F{entry.numeral}
                </span>
                <div>
                  <span style={{ color: '#E2E8F0', fontSize: 10 }}>{entry.name}</span>
                  <span style={{ color: '#64748B', fontSize: 8, marginLeft: 6 }}>
                    ({entry.fullName})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Special factors */}
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #475569' }}>
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
              Alte Componente
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <LegendSpecialEntry
                abbreviation="TF"
                name="Factor Tisular"
                description="Inițiator cascadă"
                color="#F97316"
              />
              <LegendSpecialEntry
                abbreviation="vWF"
                name="von Willebrand"
                description="Carrier pentru FVIII"
                color="#22C55E"
              />
              <LegendSpecialEntry
                abbreviation="PAR1"
                name="Receptor PAR1"
                description="Activare trombocit"
                color="#8B5CF6"
              />
              <LegendSpecialEntry
                abbreviation="Ca²⁺"
                name="Calciu"
                description="Legare Gla-domeniu"
                color="#06B6D4"
              />
              <LegendSpecialEntry
                abbreviation="PS"
                name="Fosfatidilserină"
                description="Suprafață procoagulantă"
                color="#F59E0B"
              />
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes legendSlideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 400px; }
        }
      `}</style>
    </div>
  );
}

// Shape icon component
function ShapeIcon({ type }: { type: 'zimogen' | 'enzimă' | 'cofactor' }): React.ReactElement {
  const size = 20;

  if (type === 'zimogen') {
    // Blob shape
    return (
      <svg width={size} height={size} viewBox="0 0 20 20">
        <ellipse cx={10} cy={10} rx={8} ry={7} fill="#94A3B8" opacity={0.8} />
      </svg>
    );
  }

  if (type === 'enzimă') {
    // Pac-Man shape
    return (
      <svg width={size} height={size} viewBox="0 0 20 20">
        <path
          d="M 10 2 A 8 8 0 1 1 10 18 A 8 8 0 1 1 10 2 L 10 10 L 18 6 L 10 10 Z"
          fill="#EF4444"
          opacity={0.8}
        />
      </svg>
    );
  }

  // Cofactor - bean shape
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <path
        d="M 4 10 Q 4 4, 10 4 Q 16 4, 16 10 Q 16 16, 10 16 Q 4 16, 4 10 Q 6 8, 10 10 Q 14 12, 16 10"
        fill="#3B82F6"
        opacity={0.8}
      />
    </svg>
  );
}

// Special entry component
interface LegendSpecialEntryProps {
  abbreviation: string;
  name: string;
  description: string;
  color: string;
}

function LegendSpecialEntry({
  abbreviation,
  name,
  description,
  color,
}: LegendSpecialEntryProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr',
        gap: 8,
        alignItems: 'center',
        padding: '4px 6px',
        background: 'rgba(71, 85, 105, 0.2)',
        borderRadius: 4,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <span
        style={{
          color: color,
          fontSize: 9,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {abbreviation}
      </span>
      <div>
        <span style={{ color: '#E2E8F0', fontSize: 10 }}>{name}</span>
        <span style={{ color: '#64748B', fontSize: 8, marginLeft: 4 }}>- {description}</span>
      </div>
    </div>
  );
}
