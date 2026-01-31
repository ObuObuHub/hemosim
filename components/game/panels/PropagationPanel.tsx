// components/game/panels/PropagationPanel.tsx
'use client';

import { useMemo } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { EnzymeComplex } from '../visuals/EnzymeComplex';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import type { PropagationState, AmplificationState } from '@/hooks/useThreePanelState';

interface PropagationPanelProps {
  width: number;
  height: number;
  state: PropagationState;
  amplificationState?: AmplificationState;
  amplificationComplete: boolean;
  onFormComplex: (complexType: 'tenase' | 'prothrombinase' | 'burst') => void;
}

/**
 * PROPAGATION PANEL - Activated platelet surface (Textbook Style)
 *
 * CELL-BASED MODEL - Phase 3: Propagation
 * The "explosion" of thrombin generation on the decorated platelet surface
 *
 * Medical Accuracy:
 * 1. Platelet is now "decorated" with bound cofactors (FVa + FVIIIa) on its surface
 * 2. FIXa + FVIIIa (on membrane) → Tenase complex (×200,000 more efficient)
 * 3. FXa + FVa (on membrane) → Prothrombinase complex (×300,000 more efficient)
 * 4. Complexes are membrane-bound via Ca²⁺ and Gla-domains
 * 5. Result: Thrombin Burst (~350 nM) → Fibrin formation
 */
export function PropagationPanel({
  width,
  height,
  state,
  amplificationState,
  amplificationComplete,
  onFormComplex,
}: PropagationPanelProps): React.ReactElement {
  const layout = useMemo(() => {
    const membraneHeight = height * 0.30;
    const bloodstreamHeight = height - membraneHeight;
    const membraneY = bloodstreamHeight;

    // Complex positions on the membrane surface
    const tenaseX = width * 0.28;
    const prothrombinaseX = width * 0.72;
    const complexY = membraneY - 45;

    // Pre-docked cofactor positions (visible before complex formation)
    const dockedFviiiaX = width * 0.28;
    const dockedFvaX = width * 0.72;
    const dockedY = membraneY + 10;

    return {
      membraneHeight,
      membraneY,
      bloodstreamHeight,
      tenaseX,
      prothrombinaseX,
      complexY,
      burstY: height * 0.12,
      dockedFviiiaX,
      dockedFvaX,
      dockedY,
    };
  }, [width, height]);

  // Check if complexes can be formed
  const cofactorsDocked = Boolean(amplificationState?.fvaDocked && amplificationState?.fviiaDocked);
  const canFormTenase = amplificationComplete && state.fixaArrived && !state.tenaseFormed && cofactorsDocked;
  const canFormProthrombinase = state.tenaseFormed && !state.prothrombinaseFormed;
  const canBurst = state.prothrombinaseFormed && !state.thrombinBurst;

  // Generate 12 radial positions for thrombin burst particles
  const burstParticles = useMemo(() => {
    const particles: Array<{ x: number; y: number; delay: number; scale: number }> = [];
    const numParticles = 12;
    const radius = 60;

    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * 2 * Math.PI - Math.PI / 2; // Start from top
      // Deterministic scale variation based on index (avoids Math.random during render)
      const scaleVariation = Math.sin(i * 2.7) * 0.1;
      particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.6, // Elliptical spread
        delay: i * 0.06,
        scale: 0.6 + scaleVariation,
      });
    }
    return particles;
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Bloodstream area - red gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: layout.bloodstreamHeight,
          background: 'linear-gradient(180deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
        }}
      />

      {/* Membrane surface - activated platelet (special styling) */}
      <div
        style={{
          position: 'absolute',
          top: layout.membraneY,
          left: 0,
          width: '100%',
          height: layout.membraneHeight,
        }}
      >
        <PhospholipidMembrane
          width={width}
          height={layout.membraneHeight}
          variant="platelet"
        />
        {/* Activated platelet glow overlay (PS exposed) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.08) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Phase Badge - Blue for Propagation */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '8px 14px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
          borderRadius: 10,
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
          zIndex: 20,
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 500, opacity: 0.9, letterSpacing: 1.5 }}>
          FAZA 3
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>
          PROPAGARE
        </div>
      </div>

      {/* FIXa Arrival Indicator */}
      {!state.fixaArrived && amplificationComplete && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '6px 12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.9) 0%, rgba(8, 145, 178, 0.9) 100%)',
            borderRadius: 8,
            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.5)',
            animation: 'fixaArriving 1.5s ease-in-out infinite',
            zIndex: 20,
          }}
        >
          <div style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>
            FIXa SOSEȘTE
          </div>
          <div style={{ color: '#CFFAFE', fontSize: 8 }}>
            Din faza de inițiere
          </div>
        </div>
      )}

      {/* FIXa Token arriving at top border */}
      {state.fixaArrived && !state.tenaseFormed && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            animation: 'factorArriveFromTop 0.8s ease-out',
            zIndex: 25,
          }}
        >
          <FactorTokenNew
            factorId="FIXa"
            isActive
            style={{
              filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))',
            }}
          />
          <div
            style={{
              padding: '2px 8px',
              background: 'rgba(6, 182, 212, 0.9)',
              borderRadius: 4,
              fontSize: 8,
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            FIXa din Inițiere
          </div>
        </div>
      )}

      {/* PRE-DOCKED COFACTORS on membrane (visible from amplification) */}
      {cofactorsDocked && !state.tenaseFormed && (
        <DockedCofactorOnMembrane
          x={layout.dockedFviiiaX}
          y={layout.dockedY}
          factorId="FVIIIa"
          label="FVIIIa"
          highlightForComplex={state.fixaArrived}
        />
      )}
      {cofactorsDocked && !state.prothrombinaseFormed && (
        <DockedCofactorOnMembrane
          x={layout.dockedFvaX}
          y={layout.dockedY}
          factorId="FVa"
          label="FVa"
          highlightForComplex={state.tenaseFormed}
        />
      )}

      {/* TENASE COMPLEX */}
      {state.fixaArrived && (
        <div
          style={{
            position: 'absolute',
            left: layout.tenaseX,
            top: layout.complexY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {state.tenaseFormed ? (
            <EnzymeComplex
              type="tenase"
              isFormed={true}
              isProducing={!state.prothrombinaseFormed}
              enzymeFactorId="FIXa"
              cofactorFactorId="FVIIIa"
              amplificationFactor="×200,000"
              position={{ x: 0, y: 0 }}
            />
          ) : (
            <ComplexFormSlot
              name="TENASE"
              enzyme="FIXa"
              cofactor="FVIIIa"
              canForm={canFormTenase}
              onClick={() => onFormComplex('tenase')}
            />
          )}
        </div>
      )}

      {/* Tenase → Prothrombinase Arrow (FXa production) */}
      {state.tenaseFormed && !state.prothrombinaseFormed && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <defs>
            <marker
              id="fxa-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#EF4444" />
            </marker>
          </defs>
          <line
            x1={layout.tenaseX + 70}
            y1={layout.complexY}
            x2={layout.prothrombinaseX - 70}
            y2={layout.complexY}
            stroke="#EF4444"
            strokeWidth={3}
            strokeDasharray="8 4"
            markerEnd="url(#fxa-arrow)"
            style={{
              animation: 'fxaDash 0.8s linear infinite',
            }}
          />
          <text
            x={(layout.tenaseX + layout.prothrombinaseX) / 2}
            y={layout.complexY - 12}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#EF4444"
          >
            FXa
          </text>
          <text
            x={(layout.tenaseX + layout.prothrombinaseX) / 2}
            y={layout.complexY + 16}
            textAnchor="middle"
            fontSize={8}
            fill="#FCA5A5"
          >
            ×200,000 eficient
          </text>
        </svg>
      )}

      {/* PROTHROMBINASE COMPLEX */}
      {state.tenaseFormed && (
        <div
          style={{
            position: 'absolute',
            left: layout.prothrombinaseX,
            top: layout.complexY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {state.prothrombinaseFormed ? (
            <EnzymeComplex
              type="prothrombinase"
              isFormed={true}
              isProducing={!state.thrombinBurst}
              enzymeFactorId="FXa"
              cofactorFactorId="FVa"
              amplificationFactor="×300,000"
              position={{ x: 0, y: 0 }}
            />
          ) : (
            <ComplexFormSlot
              name="PROTHROMBINASE"
              enzyme="FXa"
              cofactor="FVa"
              canForm={canFormProthrombinase}
              onClick={() => onFormComplex('prothrombinase')}
            />
          )}
        </div>
      )}

      {/* THROMBIN BURST */}
      {state.prothrombinaseFormed && (
        <div
          style={{
            position: 'absolute',
            top: layout.burstY,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 15,
          }}
        >
          {state.thrombinBurst ? (
            <>
              {/* Thrombin Burst Display with concentration */}
              <div
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(127, 29, 29, 0.95) 100%)',
                  borderRadius: 12,
                  boxShadow: '0 4px 25px rgba(220, 38, 38, 0.7)',
                  animation: 'burstPulse 1.5s ease-in-out infinite',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#FBBF24', fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>
                  EXPLOZIE DE TROMBINĂ!
                </div>
                <div style={{ color: '#FCA5A5', fontSize: 10, marginTop: 2 }}>
                  ⚡ ×300,000 amplificare
                </div>
                <div
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    marginTop: 4,
                    padding: '2px 8px',
                    background: 'rgba(220, 38, 38, 0.5)',
                    borderRadius: 4,
                    display: 'inline-block',
                  }}
                >
                  ~350 nM
                </div>
              </div>

              {/* Radiating Thrombin Particles - 12 particles in polar layout */}
              <div
                style={{
                  position: 'relative',
                  width: 150,
                  height: 80,
                }}
              >
                {burstParticles.map((particle, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translate(${particle.x}px, ${particle.y}px)`,
                      animation: `burstRadiate 0.6s ease-out ${particle.delay}s both`,
                    }}
                  >
                    <FactorTokenNew
                      factorId="FIIa"
                      isActive
                      style={{ transform: `scale(${particle.scale})` }}
                    />
                  </div>
                ))}
                {/* Central burst point */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FBBF24 0%, #EF4444 100%)',
                    boxShadow: '0 0 30px rgba(251, 191, 36, 0.8)',
                    animation: 'burstCenter 1s ease-out',
                  }}
                />
              </div>

              {/* Fibrin Formation Indicator */}
              <div
                style={{
                  marginTop: 4,
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.9) 100%)',
                  borderRadius: 10,
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.5)',
                  animation: 'fibrinAppear 0.6s ease-out 0.6s both',
                }}
              >
                <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
                  Fibrinogen → Fibrin → Cheag stabil
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => canBurst && onFormComplex('burst')}
              disabled={!canBurst}
              style={{
                padding: '12px 24px',
                background: canBurst
                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  : 'rgba(100, 116, 139, 0.3)',
                border: 'none',
                borderRadius: 12,
                color: '#FFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: canBurst ? 'pointer' : 'not-allowed',
                boxShadow: canBurst ? '0 4px 25px rgba(239, 68, 68, 0.5)' : 'none',
                animation: canBurst ? 'burstReady 1.5s ease-in-out infinite' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              GENEREAZĂ BURST
            </button>
          )}
        </div>
      )}

      {/* Ca²⁺ Ions visualization along membrane (always visible when complexes form) */}
      {(state.tenaseFormed || state.prothrombinaseFormed) && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {/* Ca²⁺ ions scattered along the membrane surface */}
          {Array.from({ length: 8 }).map((_, i) => {
            const x = (width / 9) * (i + 1);
            const y = layout.membraneY + 5;
            return (
              <g key={`ca-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#87CEEB"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(135, 206, 235, 0.9))',
                    animation: `floatCa 2s ease-in-out infinite ${i * 0.2}s`,
                  }}
                />
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize={5}
                  fill="#FFFFFF"
                  fontWeight={600}
                >
                  Ca
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* Activated Platelet Label on Membrane */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 12px',
          background: 'rgba(245, 158, 11, 0.35)',
          border: '1.5px solid #F59E0B',
          borderRadius: 6,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 600, color: '#FCD34D', letterSpacing: 0.5 }}>
          TROMBOCIT ACTIVAT - &ldquo;decorat&rdquo; cu cofactori
        </span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes factorArriveFromTop {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
          60% {
            opacity: 1;
            transform: translateX(-50%) translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes fixaArriving {
          0%, 100% { box-shadow: 0 4px 15px rgba(6, 182, 212, 0.5); }
          50% { box-shadow: 0 4px 25px rgba(6, 182, 212, 0.8); }
        }
        @keyframes fxaDash {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes burstReady {
          0%, 100% { box-shadow: 0 4px 25px rgba(239, 68, 68, 0.5); transform: scale(1); }
          50% { box-shadow: 0 4px 35px rgba(239, 68, 68, 0.8); transform: scale(1.02); }
        }
        @keyframes burstPulse {
          0%, 100% { box-shadow: 0 4px 25px rgba(220, 38, 38, 0.7); }
          50% { box-shadow: 0 4px 40px rgba(220, 38, 38, 0.9); }
        }
        @keyframes burstRadiate {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0px, 0px) scale(0.2);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(var(--tx, 0px), var(--ty, 0px)) scale(var(--scale, 0.5));
          }
        }
        @keyframes burstCenter {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
        @keyframes fibrinAppear {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatCa {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes highlightCofactor {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6)); }
          50% { filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.9)); }
        }
        @keyframes anchorPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// DOCKED COFACTOR ON MEMBRANE COMPONENT
// =============================================================================

interface DockedCofactorOnMembraneProps {
  x: number;
  y: number;
  factorId: string;
  label: string;
  highlightForComplex?: boolean;
}

function DockedCofactorOnMembrane({
  x,
  y,
  factorId,
  label,
  highlightForComplex = false,
}: DockedCofactorOnMembraneProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 25,
        top: y,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        zIndex: 8,
        animation: highlightForComplex ? 'highlightCofactor 1.5s ease-in-out infinite' : 'none',
      }}
    >
      <FactorTokenNew factorId={factorId} isActive style={{ transform: 'scale(0.8)' }} />
      {/* Membrane anchor lines with Ca²⁺ */}
      <svg width={50} height={18} style={{ marginTop: -4 }}>
        {/* Gla-domain anchor lines */}
        <line
          x1={15}
          y1={0}
          x2={10}
          y2={16}
          stroke="rgba(135, 206, 235, 0.5)"
          strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ animation: 'anchorPulse 2s ease-in-out infinite' }}
        />
        <line
          x1={25}
          y1={0}
          x2={25}
          y2={16}
          stroke="rgba(135, 206, 235, 0.5)"
          strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ animation: 'anchorPulse 2s ease-in-out infinite 0.3s' }}
        />
        <line
          x1={35}
          y1={0}
          x2={40}
          y2={16}
          stroke="rgba(135, 206, 235, 0.5)"
          strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ animation: 'anchorPulse 2s ease-in-out infinite 0.6s' }}
        />
        {/* Ca²⁺ ions */}
        <circle cx={12} cy={12} r={2.5} fill="#87CEEB" style={{ filter: 'drop-shadow(0 0 3px rgba(135, 206, 235, 0.8))' }} />
        <circle cx={25} cy={14} r={2.5} fill="#87CEEB" style={{ filter: 'drop-shadow(0 0 3px rgba(135, 206, 235, 0.8))' }} />
        <circle cx={38} cy={12} r={2.5} fill="#87CEEB" style={{ filter: 'drop-shadow(0 0 3px rgba(135, 206, 235, 0.8))' }} />
      </svg>
      <div
        style={{
          fontSize: 7,
          fontWeight: 600,
          color: highlightForComplex ? '#60A5FA' : '#FCD34D',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {label} legat
      </div>
    </div>
  );
}

// =============================================================================
// COMPLEX FORM SLOT COMPONENT
// =============================================================================

interface ComplexFormSlotProps {
  name: string;
  enzyme: string;
  cofactor: string;
  canForm: boolean;
  onClick: () => void;
}

function ComplexFormSlot({
  name,
  enzyme,
  cofactor,
  canForm,
  onClick,
}: ComplexFormSlotProps): React.ReactElement {
  const borderColor = name === 'TENASE' ? '#3B82F6' : '#DC2626';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: canForm ? 'pointer' : 'default',
        opacity: canForm ? 1 : 0.4,
        transition: 'all 0.3s ease',
      }}
      onClick={canForm ? onClick : undefined}
    >
      {/* Complex name */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: canForm ? borderColor : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {name}
      </div>

      {/* Dashed slot */}
      <div
        style={{
          width: 100,
          height: 65,
          border: `2px dashed ${canForm ? borderColor : '#475569'}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          background: canForm ? `${borderColor}15` : 'rgba(71, 85, 105, 0.1)',
          transition: 'all 0.3s ease',
        }}
      >
        <span style={{ fontSize: 11, color: canForm ? borderColor : '#64748B', fontWeight: 600 }}>
          {enzyme}
        </span>
        <span style={{ fontSize: 9, color: '#94A3B8' }}>+</span>
        <span style={{ fontSize: 11, color: canForm ? borderColor : '#64748B', fontWeight: 600 }}>
          {cofactor}
        </span>
      </div>

      {/* Click to form hint */}
      {canForm && (
        <div style={{ fontSize: 8, color: borderColor, fontWeight: 500 }}>
          Click pentru a forma
        </div>
      )}
    </div>
  );
}
