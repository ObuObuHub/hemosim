// components/game/educational/CalciumBridging.tsx
'use client';

import { useState, useEffect } from 'react';

interface CalciumBridgingProps {
  isVisible: boolean;
  position?: { x: number; y: number };
  animated?: boolean;
}

/**
 * CalciumBridging - Educational component explaining Gla-domain calcium bridging
 *
 * Medical Accuracy:
 * - Vitamin K-dependent factors (II, VII, IX, X) have Gla domains
 * - Gla domains contain γ-carboxyglutamic acid residues
 * - Ca²⁺ ions bridge Gla domains to phosphatidylserine (PS) on membrane
 * - This anchors cofactors and enzymes to platelet surface
 */
export function CalciumBridging({ isVisible, position, animated = true }: CalciumBridgingProps): React.ReactElement | null {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isVisible && animated) {
      const interval = setInterval(() => {
        setAnimationPhase((prev) => (prev + 1) % 4);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isVisible, animated]);

  if (!isVisible) return null;

  const x = position?.x ?? 50;
  const y = position?.y ?? 50;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 180,
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.15) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.5)',
        borderRadius: 10,
        padding: '10px 12px',
        zIndex: 30,
        animation: 'fadeInUp 0.3s ease-out',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>🔗</span>
        <span style={{ color: '#22D3EE', fontSize: 11, fontWeight: 700 }}>
          Legare Ca²⁺ - Gla Domeniu
        </span>
      </div>

      {/* Visual representation */}
      <svg width={156} height={60} style={{ marginBottom: 8 }}>
        <defs>
          {/* Glow filter for Ca ions */}
          <filter id="ca-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Gradient for energy flow */}
          <linearGradient id="bridge-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="1" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Membrane surface with PS heads */}
        <rect x={0} y={48} width={156} height={12} fill="rgba(245, 158, 11, 0.2)" rx={2} />
        {[30, 50, 70, 90, 110, 130].map((cx, i) => (
          <g key={`ps-${i}`}>
            <circle
              cx={cx}
              cy={48}
              r={4}
              fill={i >= 2 && i <= 4 ? '#F59E0B' : '#FCD34D'}
              opacity={i >= 2 && i <= 4 ? 1 : 0.5}
              style={{
                animation: i >= 2 && i <= 4 ? `psPulse 2s ease-in-out infinite ${i * 0.1}s` : 'none',
              }}
            />
            {i >= 2 && i <= 4 && (
              <text x={cx} y={51} textAnchor="middle" fontSize={4} fill="#7C2D12" fontWeight={700}>
                PS
              </text>
            )}
          </g>
        ))}

        {/* Gla domain - factor portion */}
        <g style={{ animation: animated ? 'glaFloat 3s ease-in-out infinite' : 'none' }}>
          <rect
            x={55}
            y={2}
            width={46}
            height={18}
            fill="rgba(59, 130, 246, 0.6)"
            rx={6}
            stroke="#3B82F6"
            strokeWidth={1.5}
          />
          <text x={78} y={10} textAnchor="middle" fontSize={6} fill="#DBEAFE" fontWeight={600}>
            Gla domain
          </text>
          <text x={78} y={17} textAnchor="middle" fontSize={5} fill="#93C5FD">
            γ-carboxi-Glu
          </text>
        </g>

        {/* Calcium ions with animated bridging */}
        {[60, 78, 96].map((cx, i) => {
          const isActive = animated && (animationPhase === i || animationPhase === 3);
          return (
            <g key={`ca-${i}`}>
              {/* Bridging energy line */}
              <line
                x1={cx}
                y1={20}
                x2={cx}
                y2={48}
                stroke="url(#bridge-gradient)"
                strokeWidth={isActive ? 3 : 1.5}
                strokeDasharray={isActive ? 'none' : '3,2'}
                opacity={isActive ? 1 : 0.5}
                style={{
                  filter: isActive ? 'url(#ca-glow)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />

              {/* Ca²⁺ ion */}
              <circle
                cx={cx}
                cy={34}
                r={isActive ? 7 : 5}
                fill="#06B6D4"
                filter="url(#ca-glow)"
                style={{
                  transition: 'all 0.3s ease',
                }}
              />
              <text
                x={cx}
                y={37}
                textAnchor="middle"
                fontSize={isActive ? 6 : 5}
                fill="#FFF"
                fontWeight={700}
                style={{ transition: 'all 0.3s ease' }}
              >
                Ca²⁺
              </text>

              {/* Energy pulse ring */}
              {isActive && (
                <circle
                  cx={cx}
                  cy={34}
                  r={10}
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth={1}
                  opacity={0.5}
                  style={{ animation: 'caRingPulse 0.6s ease-out infinite' }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Explanation */}
      <div style={{ color: '#94A3B8', fontSize: 9, lineHeight: 1.4, marginBottom: 6 }}>
        Ionii Ca²⁺ formează punți între:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#60A5FA', fontSize: 8 }}>▸</span>
          <span style={{ color: '#CBD5E1', fontSize: 8 }}>
            Rezidui γ-carboxiglutamat (Gla domain)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#F59E0B', fontSize: 8 }}>▸</span>
          <span style={{ color: '#CBD5E1', fontSize: 8 }}>
            Fosfatidilserină expusă pe membrană
          </span>
        </div>
      </div>

      {/* Vitamin K note */}
      <div
        style={{
          marginTop: 8,
          padding: '4px 8px',
          background: 'rgba(251, 191, 36, 0.15)',
          borderRadius: 4,
          borderLeft: '2px solid #F59E0B',
        }}
      >
        <span style={{ color: '#FCD34D', fontSize: 8 }}>
          Factori Vit. K-dependenți: II, VII, IX, X
        </span>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes calciumPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes glaFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes psPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes caRingPulse {
          0% { r: 7; opacity: 0.8; }
          100% { r: 15; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Compact calcium indicator for inline use
interface CalciumIndicatorProps {
  count?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function CalciumIndicator({ count = 3, showLabel = true, animated = true }: CalciumIndicatorProps): React.ReactElement {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 6,
            fontWeight: 700,
            color: '#FFF',
            boxShadow: '0 0 8px rgba(6, 182, 212, 0.7)',
            animation: animated ? `caIndicatorPulse 1.5s ease-in-out infinite ${i * 0.2}s` : 'none',
          }}
        >
          Ca
        </div>
      ))}
      {showLabel && (
        <span style={{ color: '#22D3EE', fontSize: 8, marginLeft: 2, fontWeight: 500 }}>
          punți Gla-PS
        </span>
      )}
      <style>{`
        @keyframes caIndicatorPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 8px rgba(6, 182, 212, 0.7);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 12px rgba(6, 182, 212, 0.9);
          }
        }
      `}</style>
    </div>
  );
}
