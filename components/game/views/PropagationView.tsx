// components/game/views/PropagationView.tsx
'use client';

import { FactorTokenNew } from '../tokens/FactorTokenNew';

interface PropagationViewProps {
  width: number;
  height: number;
  membraneY: number;
  state: {
    // Cofactors docked from amplification
    fviiaDocked: boolean;
    fvaDocked: boolean;
    // Enzyme arrival
    fixaArrived: boolean;
    // Complex formation
    tenaseFormed: boolean;
    prothrombinaseFormed: boolean;
    // Product generation
    fxaProduced: boolean;
    thrombinBurst: boolean;
  };
  onFormTenase: () => void;
  onFormProthrombinase: () => void;
  onProduceFXa: () => void;
  onTriggerBurst: () => void;
  isAutoMode?: boolean;
}

/**
 * PropagationView - Faithful representation of Propagation phase
 *
 * Based on Hoffman-Monroe cell-based model and reference diagrams:
 * - TENASE (Intrinsic Xase): FVIIIa + FIXa → converts FX to FXa
 * - PROTHROMBINASE: FVa + FXa → converts FII to FIIa (Thrombin Burst)
 *
 * Layout matches textbook diagrams:
 * - Complexes anchored to PS-exposed platelet membrane via Gla domains
 * - Cofactor (large) positioned above enzyme (small)
 * - Substrates enter from above, products exit horizontally
 * - Ca²⁺ required for complex assembly
 */
export function PropagationView({
  width,
  height,
  membraneY,
  state,
  onFormTenase,
  onFormProthrombinase,
  onProduceFXa,
  onTriggerBurst,
  isAutoMode = false,
}: PropagationViewProps): React.ReactElement {
  // Layout calculations
  const bloodstreamHeight = membraneY;
  const tenaseX = width * 0.28;
  const prothrombinaseX = width * 0.72;
  const complexY = bloodstreamHeight * 0.55;
  const substrateY = bloodstreamHeight * 0.18;

  // Burst particles positions (radiating pattern)
  const burstParticles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(angle) * 50,
      y: Math.sin(angle) * 35,
      delay: i * 0.08,
    };
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* ===== SUBSTRATE ROW (Top) ===== */}

      {/* FIX substrate - arrives from Amplification */}
      {!state.tenaseFormed && state.fixaArrived && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX - 40,
            top: substrateY,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'substrateFloat 2s ease-in-out infinite',
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
          <div style={{ fontSize: 9, color: '#06B6D4', fontWeight: 600, marginTop: 4 }}>
            FIXa
          </div>
          <div style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>
            din Inițiere
          </div>
        </div>
      )}

      {/* FX substrate - enters Tenase */}
      {state.tenaseFormed && !state.fxaProduced && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX + 20,
            top: substrateY + 30,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'substrateDescend 1.5s ease-in-out infinite',
          }}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
          <div style={{ fontSize: 9, color: '#15803D', fontWeight: 600, marginTop: 4 }}>
            FX
          </div>
          <svg width="20" height="30" style={{ marginTop: 4 }}>
            <defs>
              <marker id="substrate-arrow" markerWidth="6" markerHeight="5" refX="3" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill="#15803D" />
              </marker>
            </defs>
            <line x1="10" y1="0" x2="10" y2="24" stroke="#15803D" strokeWidth="2" markerEnd="url(#substrate-arrow)" />
          </svg>
        </div>
      )}

      {/* FII substrates - enter Prothrombinase (multiple shown for burst effect) */}
      {state.prothrombinaseFormed && !state.thrombinBurst && (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={`fii-${i}`}
              style={{
                position: 'absolute',
                left: prothrombinaseX - 20 + i * 25,
                top: substrateY + 20 + i * 15,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 1 - i * 0.2,
                animation: `substrateDescend ${1.5 + i * 0.3}s ease-in-out infinite`,
              }}
            >
              <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
              {i === 0 && (
                <div style={{ fontSize: 9, color: '#7C2D12', fontWeight: 600, marginTop: 4 }}>
                  FII
                </div>
              )}
            </div>
          ))}
          <svg
            style={{ position: 'absolute', left: prothrombinaseX, top: substrateY + 60, transform: 'translateX(-50%)' }}
            width="20"
            height="40"
          >
            <defs>
              <marker id="fii-arrow" markerWidth="6" markerHeight="5" refX="3" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill="#7C2D12" />
              </marker>
            </defs>
            <line x1="10" y1="0" x2="10" y2="34" stroke="#7C2D12" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#fii-arrow)" />
          </svg>
        </>
      )}

      {/* ===== TENASE COMPLEX (Left) ===== */}
      <div
        style={{
          position: 'absolute',
          left: tenaseX,
          top: complexY,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {state.tenaseFormed ? (
          <TenaseComplex
            isProducing={!state.fxaProduced}
            onProduce={onProduceFXa}
            isAutoMode={isAutoMode}
          />
        ) : (
          <ComplexAssemblySlot
            name="TENASE"
            subtitle="(Intrinsic Xase)"
            enzyme={{ id: 'FIXa', docked: state.fixaArrived }}
            cofactor={{ id: 'FVIIIa', docked: state.fviiaDocked }}
            canForm={state.fixaArrived && state.fviiaDocked}
            onForm={onFormTenase}
            color="#06B6D4"
            isAutoMode={isAutoMode}
          />
        )}
      </div>

      {/* ===== FXa FLOW ARROW (Tenase → Prothrombinase) ===== */}
      {state.fxaProduced && !state.prothrombinaseFormed && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <defs>
            <marker id="fxa-flow-arrow" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
              <polygon points="0 0, 10 4, 0 8" fill="#22C55E" />
            </marker>
          </defs>
          {/* Curved arrow from Tenase to Prothrombinase */}
          <path
            d={`M ${tenaseX + 80} ${complexY}
                Q ${(tenaseX + prothrombinaseX) / 2} ${complexY - 50}
                ${prothrombinaseX - 80} ${complexY}`}
            stroke="#22C55E"
            strokeWidth={3}
            strokeDasharray="8 4"
            fill="none"
            markerEnd="url(#fxa-flow-arrow)"
            style={{ animation: 'dashFlow 1s linear infinite' }}
          />
          {/* FXa label on arrow */}
          <g transform={`translate(${(tenaseX + prothrombinaseX) / 2}, ${complexY - 60})`}>
            <rect x={-35} y={-14} width={70} height={28} rx={6} fill="#DCFCE7" stroke="#22C55E" strokeWidth={2} />
            <text x={0} y={5} textAnchor="middle" fontSize={12} fontWeight={700} fill="#15803D">
              FXa →
            </text>
          </g>
        </svg>
      )}

      {/* ===== PROTHROMBINASE COMPLEX (Right) ===== */}
      <div
        style={{
          position: 'absolute',
          left: prothrombinaseX,
          top: complexY,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {state.prothrombinaseFormed ? (
          <ProthrombinaseComplex
            isProducing={!state.thrombinBurst}
            onTriggerBurst={onTriggerBurst}
            isAutoMode={isAutoMode}
          />
        ) : state.fxaProduced ? (
          <ComplexAssemblySlot
            name="PROTROMBINAZĂ"
            subtitle=""
            enzyme={{ id: 'FXa', docked: state.fxaProduced }}
            cofactor={{ id: 'FVa', docked: state.fvaDocked }}
            canForm={state.fxaProduced && state.fvaDocked}
            onForm={onFormProthrombinase}
            color="#DC2626"
            isAutoMode={isAutoMode}
          />
        ) : (
          <div
            style={{
              width: 140,
              height: 90,
              border: '2px dashed rgba(220, 38, 38, 0.3)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(220, 38, 38, 0.05)',
            }}
          >
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 10 }}>
              PROTROMBINAZĂ<br />
              <span style={{ fontSize: 8 }}>așteaptă FXa</span>
            </div>
          </div>
        )}
      </div>

      {/* ===== THROMBIN BURST (Output) ===== */}
      {state.thrombinBurst && (
        <div
          style={{
            position: 'absolute',
            right: 40,
            top: complexY,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Multiple IIa molecules radiating */}
          <div style={{ position: 'relative', width: 120, height: 100 }}>
            {burstParticles.map((p, i) => (
              <div
                key={`burst-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  border: '2px solid #FEE2E2',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.5)',
                  animation: `burstRadiate 0.6s ease-out ${p.delay}s both`,
                }}
              >
                IIa
              </div>
            ))}
            {/* Central burst indicator */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
                animation: 'burstPulse 1s ease-in-out infinite',
              }}
            />
          </div>
          {/* Burst label */}
          <div
            style={{
              marginTop: 8,
              padding: '6px 12px',
              background: '#FEE2E2',
              border: '2px solid #DC2626',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#DC2626', fontSize: 11, fontWeight: 700 }}>
              THROMBIN BURST
            </div>
            <div style={{ color: '#991B1B', fontSize: 9, marginTop: 2 }}>
              ~350 nM
            </div>
          </div>
        </div>
      )}

      {/* ===== Gla DOMAIN ANCHORS with PS and Ca²⁺ (medical accuracy) ===== */}
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
        {/* PS (phosphatidylserine) exposed on activated platelet membrane */}
        {(state.tenaseFormed || state.prothrombinaseFormed) && (
          <g>
            {/* PS markers - red circles showing exposed PS on membrane */}
            {[tenaseX - 35, tenaseX - 15, tenaseX + 5, tenaseX + 25,
              prothrombinaseX - 35, prothrombinaseX - 15, prothrombinaseX + 5, prothrombinaseX + 25].map((x, i) => (
              <g key={`ps-${i}`}>
                <circle
                  cx={x}
                  cy={membraneY - 3}
                  r={5}
                  fill="#DC2626"
                  opacity={0.7}
                  style={{ animation: `psPulse 2s ease-in-out ${i * 0.15}s infinite` }}
                />
                <text x={x} y={membraneY + 8} textAnchor="middle" fontSize={5} fill="#DC2626" fontWeight={600}>PS</text>
              </g>
            ))}
          </g>
        )}

        {/* Gla domains for Tenase with Ca²⁺ bridge */}
        {state.tenaseFormed && (
          <g>
            {/* Gla domain anchor lines */}
            <line x1={tenaseX - 25} y1={complexY + 50} x2={tenaseX - 25} y2={membraneY - 18} stroke="#22C55E" strokeWidth={2} strokeDasharray="3 2" opacity={0.7} />
            <line x1={tenaseX + 25} y1={complexY + 50} x2={tenaseX + 25} y2={membraneY - 18} stroke="#22C55E" strokeWidth={2} strokeDasharray="3 2" opacity={0.7} />

            {/* Gla domain balls (green) */}
            <circle cx={tenaseX - 25} cy={membraneY - 22} r={6} fill="#22C55E" stroke="#15803D" strokeWidth={1.5} />
            <circle cx={tenaseX + 25} cy={membraneY - 22} r={6} fill="#22C55E" stroke="#15803D" strokeWidth={1.5} />

            {/* Ca²⁺ ions (gold circles) bridging Gla to PS */}
            <circle cx={tenaseX - 25} cy={membraneY - 12} r={3} fill="#F59E0B" stroke="#D97706" strokeWidth={1}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={tenaseX + 25} cy={membraneY - 12} r={3} fill="#F59E0B" stroke="#D97706" strokeWidth={1}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
            </circle>

            {/* Label */}
            <text x={tenaseX} y={membraneY - 32} textAnchor="middle" fontSize={8} fill="#15803D" fontWeight={700}>Gla</text>
            <text x={tenaseX} y={membraneY - 12} textAnchor="middle" fontSize={6} fill="#D97706" fontWeight={600}>Ca²⁺</text>
          </g>
        )}

        {/* Gla domains for Prothrombinase with Ca²⁺ bridge */}
        {state.prothrombinaseFormed && (
          <g>
            {/* Gla domain anchor lines */}
            <line x1={prothrombinaseX - 25} y1={complexY + 50} x2={prothrombinaseX - 25} y2={membraneY - 18} stroke="#22C55E" strokeWidth={2} strokeDasharray="3 2" opacity={0.7} />
            <line x1={prothrombinaseX + 25} y1={complexY + 50} x2={prothrombinaseX + 25} y2={membraneY - 18} stroke="#22C55E" strokeWidth={2} strokeDasharray="3 2" opacity={0.7} />

            {/* Gla domain balls (green) */}
            <circle cx={prothrombinaseX - 25} cy={membraneY - 22} r={6} fill="#22C55E" stroke="#15803D" strokeWidth={1.5} />
            <circle cx={prothrombinaseX + 25} cy={membraneY - 22} r={6} fill="#22C55E" stroke="#15803D" strokeWidth={1.5} />

            {/* Ca²⁺ ions (gold circles) bridging Gla to PS */}
            <circle cx={prothrombinaseX - 25} cy={membraneY - 12} r={3} fill="#F59E0B" stroke="#D97706" strokeWidth={1}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={prothrombinaseX + 25} cy={membraneY - 12} r={3} fill="#F59E0B" stroke="#D97706" strokeWidth={1}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" begin="0.8s" repeatCount="indefinite" />
            </circle>

            {/* Label */}
            <text x={prothrombinaseX} y={membraneY - 32} textAnchor="middle" fontSize={8} fill="#15803D" fontWeight={700}>Gla</text>
            <text x={prothrombinaseX} y={membraneY - 12} textAnchor="middle" fontSize={6} fill="#D97706" fontWeight={600}>Ca²⁺</text>
          </g>
        )}
      </svg>

      {/* ===== EDUCATIONAL PANEL ===== */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.97)',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          maxWidth: 200,
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 11, marginBottom: 8 }}>
          FAZA 3: PROPAGARE
        </div>

        {/* Visual flow diagram */}
        <div style={{ fontSize: 9, color: '#64748B', lineHeight: 1.6 }}>
          {/* Tenase reaction */}
          <div style={{
            padding: '4px 6px',
            marginBottom: 4,
            background: state.tenaseFormed ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
            borderRadius: 4,
            border: state.tenaseFormed ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
          }}>
            <div style={{ color: '#06B6D4', fontWeight: 600, marginBottom: 2 }}>TENASE</div>
            <div style={{ fontSize: 8 }}>
              <span style={{ color: '#7C3AED' }}>VIIIa</span> + <span style={{ color: '#06B6D4' }}>IXa</span>
            </div>
            <div style={{ fontSize: 8, marginTop: 2 }}>
              FX → <span style={{ color: '#22C55E', fontWeight: 600 }}>FXa</span>
              {state.fxaProduced && <span style={{ marginLeft: 4 }}>✓</span>}
            </div>
          </div>

          {/* FXa arrow */}
          {state.fxaProduced && (
            <div style={{ textAlign: 'center', color: '#22C55E', fontSize: 10, margin: '2px 0' }}>
              ↓ FXa
            </div>
          )}

          {/* Prothrombinase reaction */}
          <div style={{
            padding: '4px 6px',
            marginBottom: 4,
            background: state.prothrombinaseFormed ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
            borderRadius: 4,
            border: state.prothrombinaseFormed ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid transparent',
          }}>
            <div style={{ color: '#DC2626', fontWeight: 600, marginBottom: 2 }}>PROTROMBINAZĂ</div>
            <div style={{ fontSize: 8 }}>
              <span style={{ color: '#F97316' }}>Va</span> + <span style={{ color: '#22C55E' }}>Xa</span>
            </div>
            <div style={{ fontSize: 8, marginTop: 2 }}>
              FII → <span style={{ color: '#DC2626', fontWeight: 600 }}>FIIa</span>
              {state.thrombinBurst && <span style={{ marginLeft: 4 }}>✓</span>}
            </div>
          </div>

          {/* Stats */}
          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 6, paddingTop: 6, fontSize: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tenase:</span>
              <span style={{ color: '#06B6D4', fontWeight: 600 }}>×200.000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Protrombinază:</span>
              <span style={{ color: '#DC2626', fontWeight: 600 }}>×300.000</span>
            </div>
            {state.thrombinBurst && (
              <div style={{ marginTop: 4, textAlign: 'center', color: '#DC2626', fontWeight: 700 }}>
                ~350 nM Trombină
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 6, paddingTop: 6, fontSize: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}></span>
              <span>Gla domain (Ca²⁺)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }}></span>
              <span>PS (fosfolipide)</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes substrateFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-8px); }
        }
        @keyframes substrateDescend {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) translateY(10px); opacity: 1; }
        }
        @keyframes dashFlow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes burstRadiate {
          0% { transform: translate(-50%, -50%) translate(0, 0) scale(0.3); opacity: 0; }
          60% { opacity: 1; }
          100% { opacity: 1; transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) scale(1); }
        }
        @keyframes burstPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
        }
        @keyframes psPulse {
          0%, 100% { r: 5; opacity: 0.6; }
          50% { r: 6; opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

// ===== Sub-components =====

interface ComplexAssemblySlotProps {
  name: string;
  subtitle: string;
  enzyme: { id: string; docked: boolean };
  cofactor: { id: string; docked: boolean };
  canForm: boolean;
  onForm: () => void;
  color: string;
  isAutoMode: boolean;
}

function ComplexAssemblySlot({
  name,
  subtitle,
  enzyme,
  cofactor,
  canForm,
  onForm,
  color,
  isAutoMode,
}: ComplexAssemblySlotProps): React.ReactElement {
  return (
    <div
      style={{
        width: 150,
        padding: '12px',
        border: canForm ? `2px solid ${color}` : '2px dashed rgba(148, 163, 184, 0.5)',
        borderRadius: 12,
        background: canForm ? `${color}10` : 'rgba(248, 250, 252, 0.8)',
        cursor: canForm && !isAutoMode ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
      onClick={() => canForm && !isAutoMode && onForm()}
    >
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ color: canForm ? color : '#94A3B8', fontSize: 11, fontWeight: 700 }}>
          {name}
        </div>
        {subtitle && (
          <div style={{ color: '#94A3B8', fontSize: 8 }}>{subtitle}</div>
        )}
      </div>

      {/* Factor slots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `2px ${cofactor.docked ? 'solid' : 'dashed'} ${cofactor.docked ? color : '#CBD5E1'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: cofactor.docked ? `${color}20` : 'transparent',
            }}
          >
            {cofactor.docked && <FactorTokenNew factorId={cofactor.id} isActive={true} enableHover={false} />}
          </div>
          <div style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>{cofactor.id}</div>
        </div>
        <div style={{ color: '#CBD5E1', alignSelf: 'center' }}>+</div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `2px ${enzyme.docked ? 'solid' : 'dashed'} ${enzyme.docked ? color : '#CBD5E1'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: enzyme.docked ? `${color}20` : 'transparent',
            }}
          >
            {enzyme.docked && <FactorTokenNew factorId={enzyme.id} isActive={true} enableHover={false} />}
          </div>
          <div style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>{enzyme.id}</div>
        </div>
      </div>

      {canForm && !isAutoMode && (
        <div
          style={{
            marginTop: 8,
            padding: '4px 8px',
            background: color,
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: 600,
          }}
        >
          FORMEAZĂ COMPLEX
        </div>
      )}
    </div>
  );
}

function TenaseComplex({
  isProducing,
  onProduce,
  isAutoMode,
}: {
  isProducing: boolean;
  onProduce: () => void;
  isAutoMode: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        border: '2px solid #06B6D4',
        borderRadius: 16,
        boxShadow: isProducing ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none',
      }}
    >
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 12px',
          background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
          borderRadius: 4,
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        TENASE
      </div>

      {/* Cofactor + Enzyme arrangement (cofactor on top, larger) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* VIIIa - Cofactor (larger, on top) */}
        <div style={{ transform: 'scale(1.1)' }}>
          <FactorTokenNew factorId="FVIIIa" isActive={true} enableHover={false} />
        </div>
        {/* IXa - Enzyme (smaller, below) */}
        <div style={{ transform: 'scale(0.9)' }}>
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      </div>

      {/* Reaction equation */}
      <div
        style={{
          marginTop: 8,
          padding: '4px 8px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 4,
          textAlign: 'center',
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <span style={{ color: '#15803D' }}>FX</span>
        <span style={{ color: '#64748B' }}> → </span>
        <span style={{ color: '#22C55E' }}>FXa</span>
      </div>

      {/* Produce button */}
      {isProducing && !isAutoMode && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 12px',
            background: '#22C55E',
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onProduce}
        >
          PRODUCE FXa
        </div>
      )}

      {/* Amplification indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          right: -8,
          padding: '2px 6px',
          background: '#06B6D4',
          borderRadius: 4,
          color: '#FFFFFF',
          fontSize: 8,
          fontWeight: 700,
        }}
      >
        ×200k
      </div>
    </div>
  );
}

function ProthrombinaseComplex({
  isProducing,
  onTriggerBurst,
  isAutoMode,
}: {
  isProducing: boolean;
  onTriggerBurst: () => void;
  isAutoMode: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
        border: '2px solid #DC2626',
        borderRadius: 16,
        boxShadow: isProducing ? '0 0 20px rgba(220, 38, 38, 0.4)' : 'none',
        animation: isProducing ? 'complexPulse 1.5s ease-in-out infinite' : 'none',
      }}
    >
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 12px',
          background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
          borderRadius: 4,
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        PROTROMBINAZĂ
      </div>

      {/* Cofactor + Enzyme arrangement */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* Va - Cofactor (larger, on top) */}
        <div style={{ transform: 'scale(1.1)' }}>
          <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
        </div>
        {/* Xa - Enzyme (smaller, below) */}
        <div style={{ transform: 'scale(0.9)' }}>
          <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
        </div>
      </div>

      {/* Reaction equation */}
      <div
        style={{
          marginTop: 8,
          padding: '4px 8px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 4,
          textAlign: 'center',
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <span style={{ color: '#7C2D12' }}>FII</span>
        <span style={{ color: '#64748B' }}> → </span>
        <span style={{ color: '#DC2626' }}>FIIa</span>
      </div>

      {/* Trigger burst button */}
      {isProducing && !isAutoMode && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 12px',
            background: '#DC2626',
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: 600,
            cursor: 'pointer',
            animation: 'buttonPulse 1s ease-in-out infinite',
          }}
          onClick={onTriggerBurst}
        >
          THROMBIN BURST
        </div>
      )}

      {/* Amplification indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          right: -8,
          padding: '2px 6px',
          background: '#DC2626',
          borderRadius: 4,
          color: '#FFFFFF',
          fontSize: 8,
          fontWeight: 700,
        }}
      >
        ×300k
      </div>

      <style>{`
        @keyframes complexPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.4); }
          50% { box-shadow: 0 0 35px rgba(220, 38, 38, 0.6); }
        }
        @keyframes buttonPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
