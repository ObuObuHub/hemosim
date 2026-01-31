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
    fixaMigrating?: boolean;  // FIXa is actively migrating from SparkFrame
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
  // Anchor complexes at membrane (like Prothrombinase in Initiation)
  const complexY = membraneY - 70;
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
            enzyme={{ id: 'FIXa', docked: state.fixaArrived, awaiting: state.fixaMigrating }}
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
        @keyframes receivingPulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
          }
          50% {
            box-shadow: 0 0 16px rgba(245, 158, 11, 0.4), 0 0 32px rgba(245, 158, 11, 0.2);
          }
        }
        @keyframes enzymeSlotPulse {
          0%, 100% {
            border-color: rgba(245, 158, 11, 0.7);
            background: rgba(245, 158, 11, 0.1);
          }
          50% {
            border-color: rgba(245, 158, 11, 1);
            background: rgba(245, 158, 11, 0.25);
          }
        }
      `}</style>
    </div>
  );
}

// ===== Sub-components =====

interface ComplexAssemblySlotProps {
  name: string;
  subtitle: string;
  enzyme: { id: string; docked: boolean; awaiting?: boolean };
  cofactor: { id: string; docked: boolean };
  canForm: boolean;
  onForm: () => void;
  color: string;
  isAutoMode: boolean;
}

function ComplexAssemblySlot({
  name,
  enzyme,
  cofactor,
  canForm,
  onForm,
  color,
  isAutoMode,
}: ComplexAssemblySlotProps): React.ReactElement {
  const enzymeAwaiting = enzyme.awaiting && !enzyme.docked;

  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px',
        border: `2px dashed ${color}`,
        borderRadius: 8,
        background: `${color}08`,
        cursor: canForm && !isAutoMode ? 'pointer' : 'default',
        animation: canForm ? 'complexPulse 2s ease-in-out infinite' : undefined,
      }}
      onClick={() => canForm && !isAutoMode && onForm()}
    >
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 8px',
          background: '#FFFFFF',
          border: `1px solid ${color}`,
          borderRadius: 4,
          fontSize: 9,
          color: color,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>

      {/* Factor slots - cofactor larger, enzyme smaller with Gla */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'flex-start', marginTop: 8 }}>
        {/* Cofactor - larger */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ transform: cofactor.docked ? 'scale(1.2)' : 'scale(1)', opacity: cofactor.docked ? 1 : 0.3 }}>
            <FactorTokenNew factorId={cofactor.id} isActive={cofactor.docked} enableHover={false} />
          </div>
          <div style={{ fontSize: 8, color: '#64748B', marginTop: 4 }}>{cofactor.id}</div>
        </div>
        <div style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, marginTop: 12 }}>+</div>
        {/* Enzyme - smaller with Gla domain */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            transform: enzyme.docked ? 'scale(0.9)' : 'scale(1)',
            opacity: enzyme.docked ? 1 : enzymeAwaiting ? 0.5 : 0.3,
            animation: enzymeAwaiting ? 'receivingPulse 1.5s ease-in-out infinite' : undefined,
          }}>
            <FactorTokenNew factorId={enzyme.id} isActive={enzyme.docked} enableHover={false} />
          </div>
          {/* Gla domain visualization */}
          <svg width="20" height="24" style={{ marginTop: -2 }}>
            <path
              d="M10 0 Q 5 6, 10 12 Q 15 18, 10 24"
              stroke="#1E293B"
              strokeWidth="1.5"
              fill="none"
              opacity={enzyme.docked ? 1 : 0.3}
            />
          </svg>
          <div style={{ fontSize: 8, color: enzymeAwaiting ? '#F59E0B' : '#64748B', fontWeight: enzymeAwaiting ? 600 : 400 }}>
            {enzyme.id}
            {enzymeAwaiting && <span style={{ fontSize: 7, display: 'block' }}>în drum...</span>}
          </div>
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
        padding: '16px 20px 24px',
        border: '2px dashed #06B6D4',
        borderRadius: 8,
        background: 'rgba(6, 182, 212, 0.05)',
        animation: isProducing ? 'complexPulse 2s ease-in-out infinite' : undefined,
      }}
    >
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 8px',
          background: '#FFFFFF',
          border: '1px solid #06B6D4',
          borderRadius: 4,
          fontSize: 9,
          color: '#06B6D4',
          fontWeight: 600,
        }}
      >
        Tenase
      </div>

      {/* Cofactor (FVIIIa - larger) + Enzyme (FIXa - smaller with Gla) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
        {/* FVIIIa - Cofactor (larger, no Gla domain) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(1.2)' }}>
            <FactorTokenNew factorId="FVIIIa" isActive={true} enableHover={false} />
          </div>
          <div style={{ fontSize: 7, color: '#64748B', marginTop: 4 }}>Gla</div>
        </div>

        {/* FIXa - Enzyme (smaller, has Gla domain) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(0.9)' }}>
            <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
          </div>
          {/* Gla domain visualization */}
          <svg width="20" height="28" style={{ marginTop: -2 }}>
            <path
              d="M10 0 Q 5 8, 10 14 Q 15 20, 10 28"
              stroke="#1E293B"
              strokeWidth="2"
              fill="none"
            />
            <text x="16" y="14" fontSize="7" fill="#374151" fontWeight="600">Gla</text>
          </svg>
        </div>
      </div>

      {/* Ca²⁺ ions at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
        <span style={{ fontSize: 7, color: '#F59E0B', fontWeight: 600 }}>Ca²⁺</span>
      </div>

      {/* Produce button */}
      {isProducing && !isAutoMode && (
        <div
          style={{
            marginTop: 12,
            padding: '4px 10px',
            background: '#06B6D4',
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
        padding: '16px 20px 24px',
        border: '2px dashed #3B82F6',
        borderRadius: 8,
        background: 'rgba(59, 130, 246, 0.05)',
        animation: isProducing ? 'complexPulse 2s ease-in-out infinite' : undefined,
      }}
    >
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 8px',
          background: '#FFFFFF',
          border: '1px solid #3B82F6',
          borderRadius: 4,
          fontSize: 9,
          color: '#3B82F6',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        Prothrombinase
      </div>

      {/* Cofactor (FVa - larger) + Enzyme (FXa - smaller with Gla) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
        {/* FVa - Cofactor (larger, no Gla domain) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(1.2)' }}>
            <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
          </div>
        </div>

        {/* FXa - Enzyme (smaller, has Gla domain) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: 'scale(0.9)' }}>
            <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
          </div>
          {/* Gla domain visualization */}
          <svg width="20" height="28" style={{ marginTop: -2 }}>
            <path
              d="M10 0 Q 5 8, 10 14 Q 15 20, 10 28"
              stroke="#1E293B"
              strokeWidth="2"
              fill="none"
            />
            <text x="16" y="14" fontSize="7" fill="#374151" fontWeight="600">Gla</text>
          </svg>
        </div>
      </div>

      {/* Ca²⁺ ions at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
        <span style={{ fontSize: 7, color: '#F59E0B', fontWeight: 600 }}>Ca²⁺</span>
      </div>

      {/* Trigger burst button */}
      {isProducing && !isAutoMode && (
        <div
          style={{
            marginTop: 12,
            padding: '4px 10px',
            background: '#3B82F6',
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onTriggerBurst}
        >
          THROMBIN BURST
        </div>
      )}
    </div>
  );
}
