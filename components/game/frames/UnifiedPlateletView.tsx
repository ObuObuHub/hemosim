// components/game/frames/UnifiedPlateletView.tsx
'use client';

import { useMemo } from 'react';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { PARReceptor } from '../visuals/PARReceptor';
import type { ExplosionState } from '@/hooks/useCascadeState';

export interface UnifiedPlateletViewProps {
  width: number;
  membraneY: number;
  bloodstreamHeight: number;
  tenaseX: number;
  prothrombinaseX: number;
  complexY: number;
  state: ExplosionState;
  onActivateFactor: (factorId: string) => void;
  onPARClick: () => void;
  onFormTenase: () => void;
  onProduceFXa: () => void;
  onFormProthrombinase: () => void;
  onTriggerBurst: () => void;
  canFormTenase: boolean;
  canProduceFXa: boolean;
  canFormProthrombinase: boolean;
  canBurst: boolean;
  isAutoMode: boolean;
  fixaMigrating: boolean;
  fixaWaiting?: boolean;
}

/**
 * UnifiedPlateletView - Combines Amplification + Propagation phases
 *
 * Displays both phases simultaneously on the activated platelet surface,
 * matching the biological reality where both processes occur concurrently.
 */
export function UnifiedPlateletView({
  width,
  membraneY,
  bloodstreamHeight,
  tenaseX,
  prothrombinaseX,
  complexY,
  state,
  onActivateFactor,
  onPARClick,
  onFormTenase,
  onProduceFXa,
  onFormProthrombinase,
  onTriggerBurst,
  canFormTenase,
  canProduceFXa,
  canFormProthrombinase,
  canBurst,
  isAutoMode,
  fixaMigrating,
  fixaWaiting = false,
}: UnifiedPlateletViewProps): React.ReactElement {
  // ===== TOP ZONE: Cofactor Activation =====
  const topRowY = bloodstreamHeight * 0.15;
  const thrombinY = bloodstreamHeight * 0.32;

  // PAR receptor position (moved slightly left)
  const parX = width * 0.05;

  // Factor positions in top zone - aligned above their respective complexes
  // FVIII-vWF above Tenase (FVIIIa goes to Tenase)
  // FV above Prothrombinase (FVa goes to Prothrombinase)
  const factorXPositions = {
    fxi: width * 0.15,           // Left side (FXIa docks to membrane middle)
    fviii: tenaseX,              // Above Tenase (FVIIIa → Tenase)
    fv: prothrombinaseX,         // Above Prothrombinase (FVa → Prothrombinase)
  };

  const thrombinX = width * 0.45;

  // Dramatic thrombin burst - waves of FIIa converging on fibrinogen
  const burstWaves = useMemo(() => {
    // Deterministic offset based on index (avoids Math.random during render)
    const deterministicOffset = (idx: number, scale: number): number =>
      Math.sin(idx * 7.3) * scale * 0.5;

    const waves: Array<{
      id: number;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      delay: number;
      duration: number;
      size: number;
    }> = [];

    const centerX = width * 0.5;
    const centerY = bloodstreamHeight * 0.5;
    const sourceX = prothrombinaseX;
    const sourceY = complexY;

    // Wave 1: Initial burst (8 particles) - slow, dramatic
    for (let i = 0; i < 8; i++) {
      const spreadAngle = ((i - 3.5) / 7) * Math.PI * 0.6;
      const targetX = centerX + Math.cos(spreadAngle) * 30;
      const targetY = centerY + Math.sin(spreadAngle) * 20;
      waves.push({
        id: i,
        startX: sourceX,
        startY: sourceY,
        endX: targetX,
        endY: targetY,
        delay: i * 0.15,
        duration: 2.5,
        size: 20,
      });
    }

    // Wave 2: Secondary burst (12 particles)
    for (let i = 0; i < 12; i++) {
      const spreadAngle = ((i - 5.5) / 11) * Math.PI * 0.8;
      const targetX = centerX + Math.cos(spreadAngle) * 50 + deterministicOffset(i, 20);
      const targetY = centerY + Math.sin(spreadAngle) * 30 + deterministicOffset(i + 100, 15);
      waves.push({
        id: 8 + i,
        startX: sourceX + deterministicOffset(i + 200, 20),
        startY: sourceY + deterministicOffset(i + 300, 15),
        endX: targetX,
        endY: targetY,
        delay: 1.0 + i * 0.12,
        duration: 2.8,
        size: 16,
      });
    }

    // Wave 3: Sustained flow (10 particles)
    for (let i = 0; i < 10; i++) {
      const spreadAngle = ((i - 4.5) / 9) * Math.PI * 0.5;
      const targetX = centerX + Math.cos(spreadAngle) * 40 + deterministicOffset(i + 400, 30);
      const targetY = centerY + Math.sin(spreadAngle) * 25 + deterministicOffset(i + 500, 20);
      waves.push({
        id: 20 + i,
        startX: sourceX + deterministicOffset(i + 600, 15),
        startY: sourceY + deterministicOffset(i + 700, 10),
        endX: targetX,
        endY: targetY,
        delay: 2.5 + i * 0.18,
        duration: 3.2,
        size: 14,
      });
    }

    return waves;
  }, [width, bloodstreamHeight, complexY, prothrombinaseX]);

  // Fibrinogen positions (appear in center during burst) - slower timing
  const fibrinogenPositions = useMemo(() => {
    const centerX = width * 0.5;
    const centerY = bloodstreamHeight * 0.5;
    return [
      { x: centerX - 60, y: centerY - 20, delay: 0.5 },
      { x: centerX, y: centerY + 10, delay: 1.0 },
      { x: centerX + 50, y: centerY - 15, delay: 1.5 },
      { x: centerX - 30, y: centerY + 25, delay: 2.0 },
      { x: centerX + 30, y: centerY - 30, delay: 2.5 },
    ];
  }, [width, bloodstreamHeight]);

  return (
    <>
      {/* ========== TOP ZONE: COFACTOR ACTIVATION ========== */}

      {/* Ghost slot for FIIa (before thrombin arrives) */}
      {!state.thrombinArrived && (
        <div
          style={{
            position: 'absolute',
            left: thrombinX,
            top: thrombinY,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            opacity: 0.3,
            filter: 'grayscale(50%)',
          }}
        >
          <FactorTokenNew
            factorId="FIIa"
            isActive={true}
            enableHover={false}
            hideGlaDomain={true}
          />
        </div>
      )}

      {/* Central FIIa (Thrombin) - fades away once cofactors dock to complexes */}
      {state.thrombinArrived && !state.thrombinBurst && !(state.fvaDocked && state.fviiaDocked) && (
        <div
          style={{
            position: 'absolute',
            left: thrombinX,
            top: thrombinY,
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            animation: 'thrombinPulse 2s ease-in-out infinite',
          }}
        >
          <FactorTokenNew
            factorId="FIIa"
            isActive={true}
            enableHover={false}
            hideGlaDomain={true}
          />
        </div>
      )}

      {/* Inactive factors (top row) - only clickable after PAR is activated */}
      {!state.fxiActivated && (
        <FactorSlot
          x={factorXPositions.fxi}
          y={topRowY}
          factorId="FXI"
          onClick={() => state.parCleavageState === 'activated' && !isAutoMode && onActivateFactor('FXI')}
          disabled={state.parCleavageState !== 'activated' || isAutoMode}
        />
      )}

      {!state.fvActivated && (
        <FactorSlot
          x={factorXPositions.fv}
          y={topRowY}
          factorId="FV"
          onClick={() => state.parCleavageState === 'activated' && !isAutoMode && onActivateFactor('FV')}
          disabled={state.parCleavageState !== 'activated' || isAutoMode}
        />
      )}

      {/* FVIII-vWF Complex - only clickable after PAR is activated */}
      {!state.vwfSplit && (
        <div
          style={{
            position: 'absolute',
            left: factorXPositions.fviii,
            top: topRowY,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 8,
              border: state.parCleavageState === 'activated' && !isAutoMode ? '2px solid #22C55E' : '2px solid #E2E8F0',
              cursor: state.parCleavageState === 'activated' && !isAutoMode ? 'pointer' : 'default',
              opacity: state.parCleavageState === 'activated' ? 1 : 0.5,
            }}
            onClick={() => state.parCleavageState === 'activated' && !isAutoMode && onActivateFactor('vWF-VIII')}
          >
            <FactorTokenNew factorId="FVIII" isActive={false} enableHover={state.parCleavageState === 'activated'} />
            <span style={{ color: '#64748B', fontSize: 9, fontFamily: 'system-ui, sans-serif' }}>─</span>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 7,
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
                color: '#FFFFFF',
                border: '2px solid white',
              }}
            >
              vWF
            </div>
          </div>
        </div>
      )}

      {/* vWF floating away */}
      {state.vwfSplit && !state.fviiaDocked && (
        <div
          style={{
            position: 'absolute',
            left: factorXPositions.fviii + 35,
            top: topRowY - 15,
            animation: 'vwfFloat 1.5s ease-out forwards',
            zIndex: 15,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 6,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              color: '#FFFFFF',
              border: '2px solid white',
            }}
          >
            vWF
          </div>
        </div>
      )}

      {/* FVIIIa descending to Tenase complex after vWF split */}
      {state.vwfSplit && !state.fviiaDocked && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX - 18,
            top: topRowY,
            zIndex: 25,
            animation: 'cofactorDock 1s ease-out forwards',
            ['--dock-distance' as string]: `${complexY - topRowY - 10}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <FactorTokenNew factorId="FVIIIa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* FVa descending to Prothrombinase complex after activation */}
      {state.fvActivated && !state.fvaDocked && (
        <div
          style={{
            position: 'absolute',
            left: prothrombinaseX - 18,
            top: topRowY,
            zIndex: 25,
            animation: 'cofactorDock 1s ease-out forwards',
            ['--dock-distance' as string]: `${complexY - topRowY - 10}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* FXIa - docks to platelet membrane in the middle after activation */}
      {state.fxiActivated && (
        <div
          style={{
            position: 'absolute',
            left: (tenaseX + prothrombinaseX) / 2,
            top: membraneY - 28,
            transform: 'translate(-50%, -50%)',
            zIndex: 12,
            animation: 'dockToMembrane 1s ease-out',
          }}
        >
          <FactorTokenNew factorId="FXIa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* PAR Receptor - medically accurate, moved slightly left */}
      <PARReceptor
        x={parX + 25}
        y={membraneY - 65}
        state={state.parCleavageState}
        onClick={onPARClick}
        isClickable={state.parCleavageState === 'thrombin-bound' && !isAutoMode}
        scale={0.85}
      />


      {/* Thrombin activation arrows - sequential: PAR first, then others after PAR activation */}
      {state.thrombinArrived && !state.thrombinBurst && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        >
          <defs>
            <marker id="arrow-thrombin-small" markerWidth="4" markerHeight="3" refX="4" refY="1.5" orient="auto">
              <path d="M0,0 L4,1.5 L0,3 Z" fill="#F97316" fillOpacity="0.7" />
            </marker>
          </defs>

          {/* Thrombin → PAR (FIRST arrow - appears immediately when thrombin arrives) */}
          {state.parCleavageState !== 'activated' && (
            <path
              d={`M ${thrombinX - 25} ${thrombinY + 15}
                  C ${thrombinX - 100} ${thrombinY + 80},
                    ${parX + 70} ${membraneY - 120},
                    ${parX + 35} ${membraneY - 70}`}
              stroke="#F97316"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.6}
              fill="none"
              markerEnd="url(#arrow-thrombin-small)"
              strokeLinecap="round"
            />
          )}

          {/* OTHER ARROWS - appear only AFTER PAR is activated */}
          {state.parCleavageState === 'activated' && (
            <>
              {/* Thrombin → FXI (curve to top-left) */}
              {!state.fxiActivated && (
                <path
                  d={`M ${thrombinX - 25} ${thrombinY - 10}
                      C ${thrombinX - 80} ${thrombinY - 25},
                        ${factorXPositions.fxi + 50} ${topRowY + 30},
                        ${factorXPositions.fxi + 25} ${topRowY + 18}`}
                  stroke="#F97316"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                  fill="none"
                  markerEnd="url(#arrow-thrombin-small)"
                  strokeLinecap="round"
                  style={{ animation: 'arrowAppear 0.5s ease-out' }}
                />
              )}

              {/* Thrombin → FVIII-vWF (gentle curve up-left to Tenase area) */}
              {!state.vwfSplit && (
                <path
                  d={`M ${thrombinX - 15} ${thrombinY - 20}
                      C ${thrombinX - 30} ${thrombinY - 50},
                        ${factorXPositions.fviii + 30} ${topRowY + 50},
                        ${factorXPositions.fviii} ${topRowY + 35}`}
                  stroke="#F97316"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                  fill="none"
                  markerEnd="url(#arrow-thrombin-small)"
                  strokeLinecap="round"
                  style={{ animation: 'arrowAppear 0.5s ease-out 0.1s both' }}
                />
              )}

              {/* Thrombin → FV (gentle curve up-right to Prothrombinase area) */}
              {!state.fvActivated && (
                <path
                  d={`M ${thrombinX + 25} ${thrombinY - 10}
                      C ${thrombinX + 80} ${thrombinY - 30},
                        ${factorXPositions.fv - 30} ${topRowY + 50},
                        ${factorXPositions.fv} ${topRowY + 35}`}
                  stroke="#F97316"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                  fill="none"
                  markerEnd="url(#arrow-thrombin-small)"
                  strokeLinecap="round"
                  style={{ animation: 'arrowAppear 0.5s ease-out 0.2s both' }}
                />
              )}
            </>
          )}
        </svg>
      )}

      {/* ========== BOTTOM ZONE: COMPLEX FORMATION ========== */}

      {/* FIXa WAITING - arrived from left panel, waiting for tenase formation (faded) */}
      {fixaWaiting && !fixaMigrating && !state.fixaArrived && (
        <div
          style={{
            position: 'absolute',
            left: 30,
            top: bloodstreamHeight * 0.45,
            zIndex: 20,
            opacity: 0.35,
            filter: 'grayscale(30%)',
            animation: 'fadeInSlide 0.8s ease-out',
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* FIXa migration animation - smoothly floats from waiting position into Tenase slot */}
      {fixaMigrating && !state.fixaArrived && (
        <div
          style={{
            position: 'absolute',
            left: 30,
            top: bloodstreamHeight * 0.45,
            zIndex: 100,
            animation: 'fixaFloatToTenase 1.6s ease-in-out forwards',
            ['--end-x' as string]: `${tenaseX - 30 + 10}px`,
            ['--end-y' as string]: `${complexY - bloodstreamHeight * 0.45}px`,
            pointerEvents: 'none',
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* TENASE COMPLEX */}
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
            canProduce={canProduceFXa}
            isAutoMode={isAutoMode}
          />
        ) : (
          <ComplexAssemblySlot
            name="TENAZĂ"
            enzyme={{ id: 'FIXa', ready: state.fixaArrived }}
            cofactor={{ id: 'FVIIIa', ready: state.fviiaDocked }}
            canForm={canFormTenase}
            onForm={onFormTenase}
            color="#06B6D4"
            isAutoMode={isAutoMode}
          />
        )}
      </div>

      {/* FXa flow arrow (Tenase → Prothrombinase) */}
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
          <path
            d={`M ${tenaseX + 70} ${complexY}
                Q ${(tenaseX + prothrombinaseX) / 2} ${complexY - 40}
                ${prothrombinaseX - 70} ${complexY}`}
            stroke="#22C55E"
            strokeWidth={3}
            strokeDasharray="8 4"
            fill="none"
            markerEnd="url(#fxa-flow-arrow)"
            style={{ animation: 'dashFlow 1s linear infinite' }}
          />
          {/* Enhanced FXa label with substrate info */}
          <g transform={`translate(${(tenaseX + prothrombinaseX) / 2}, ${complexY - 50})`}>
            <rect x={-35} y={-16} width={70} height={32} rx={4} fill="#DCFCE7" stroke="#22C55E" strokeWidth={2} />
            <text x={0} y={0} textAnchor="middle" fontSize={11} fontWeight={700} fill="#15803D" style={{ fontFamily: 'system-ui, sans-serif' }}>
              FXa →
            </text>
            <text x={0} y={12} textAnchor="middle" fontSize={6} fill="#166534" style={{ fontFamily: 'system-ui, sans-serif' }}>
              FX → FXa produs
            </text>
          </g>
        </svg>
      )}

      {/* PROTHROMBINASE COMPLEX */}
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
            canBurst={canBurst}
            isAutoMode={isAutoMode}
          />
        ) : (
          <ComplexAssemblySlot
            name="PROTROMBINAZĂ"
            enzyme={{ id: 'FXa', ready: state.fxaProduced ?? false }}
            cofactor={{ id: 'FVa', ready: state.fvaDocked }}
            canForm={canFormProthrombinase}
            onForm={onFormProthrombinase}
            color="#DC2626"
            isAutoMode={isAutoMode}
          />
        )}
      </div>

      {/* ============ DRAMATIC EXPLOZIA DE TROMBINĂ ============ */}
      {/* Waves of FIIa converging on fibrinogen in the center */}
      {state.thrombinBurst && state.phase !== 'clotting' && state.phase !== 'stable' && (
        <>
          {/* Source glow at prothrombinase */}
          <div
            style={{
              position: 'absolute',
              left: prothrombinaseX,
              top: complexY,
              transform: 'translate(-50%, -50%)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.6) 0%, rgba(220, 38, 38, 0.2) 40%, transparent 70%)',
              animation: 'burstSource 1.5s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />

          {/* FIIa particles streaming towards center */}
          {burstWaves.map((particle) => (
            <div
              key={`fiia-${particle.id}`}
              style={{
                position: 'absolute',
                left: particle.startX,
                top: particle.startY,
                width: particle.size,
                height: particle.size,
                zIndex: 30,
                animation: `fiiaStream ${particle.duration}s ease-out ${particle.delay}s forwards`,
                ['--end-x' as string]: `${particle.endX - particle.startX}px`,
                ['--end-y' as string]: `${particle.endY - particle.startY}px`,
                pointerEvents: 'none',
              }}
            >
              <svg
                width={particle.size}
                height={particle.size}
                viewBox="0 0 24 24"
                style={{
                  filter: 'drop-shadow(0 2px 6px rgba(220, 38, 38, 0.7))',
                }}
              >
                <defs>
                  <linearGradient id={`burstGrad-${particle.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#B91C1C" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="10" fill={`url(#burstGrad-${particle.id})`} stroke="#FEE2E2" strokeWidth={1.5} />
                <circle cx="19" cy="6" r="3" fill="#FEE2E2" />
                <text x="11" y="15" textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFF" style={{ fontFamily: 'system-ui, sans-serif' }}>FIIa</text>
              </svg>
            </div>
          ))}

          {/* Fibrinogen tokens appearing in center */}
          {fibrinogenPositions.map((fbg, i) => (
            <div
              key={`fbg-${i}`}
              style={{
                position: 'absolute',
                left: fbg.x,
                top: fbg.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 28,
                animation: `fibrinogenAppear 1.2s ease-out ${fbg.delay}s forwards, fibrinogenCleave 1.8s ease-in-out ${fbg.delay + 2.5}s forwards`,
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              {/* Fibrinogen molecule - elongated shape */}
              <svg width="50" height="24" viewBox="0 0 50 24">
                <defs>
                  <linearGradient id={`fbgGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                </defs>
                {/* D-E-D structure */}
                <ellipse cx="8" cy="12" rx="7" ry="10" fill={`url(#fbgGrad-${i})`} stroke="#D97706" strokeWidth={1.5} />
                <rect x="14" y="8" width="22" height="8" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth={1} />
                <ellipse cx="42" cy="12" rx="7" ry="10" fill={`url(#fbgGrad-${i})`} stroke="#D97706" strokeWidth={1.5} />
                <text x="25" y="15" textAnchor="middle" fontSize="6" fontWeight="600" fill="#78350F" style={{ fontFamily: 'system-ui, sans-serif' }}>Fbg</text>
              </svg>
            </div>
          ))}

          {/* Central cleavage zone glow */}
          <div
            style={{
              position: 'absolute',
              left: width * 0.5,
              top: bloodstreamHeight * 0.5,
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.1) 40%, transparent 70%)',
              animation: 'cleavageGlow 4s ease-in-out 2s forwards',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />

          {/* Burst label */}
          <div
            style={{
              position: 'absolute',
              left: prothrombinaseX + 60,
              top: complexY - 50,
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)',
              border: '2px solid #EF4444',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(220, 38, 38, 0.5)',
              animation: 'burstLabelAppear 1s ease-out forwards',
              zIndex: 35,
            }}
          >
            <div style={{ color: '#FBBF24', fontSize: 11, fontWeight: 800, fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>
              EXPLOZIA DE TROMBINĂ
            </div>
            <div style={{ color: '#FECACA', fontSize: 9, fontFamily: 'system-ui, sans-serif', marginTop: 2, textAlign: 'center' }}>
              ~350 nM · ×300,000
            </div>
          </div>

          {/* Fibrin formation indicator */}
          {state.fibrinogenCleaved && (
            <div
              style={{
                position: 'absolute',
                left: width * 0.5,
                top: bloodstreamHeight * 0.5 + 60,
                transform: 'translateX(-50%)',
                padding: '4px 10px',
                background: 'rgba(251, 191, 36, 0.9)',
                border: '2px solid #D97706',
                borderRadius: 6,
                animation: 'fibrinLabelAppear 1s ease-out 3s forwards',
                zIndex: 35,
              }}
            >
              <div style={{ color: '#78350F', fontSize: 10, fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}>
                Fbg → Fibrină
              </div>
            </div>
          )}
        </>
      )}

      {/* Gla domain anchors with PS and Ca²⁺ */}
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
        {/* PS markers */}
        {(state.tenaseFormed || state.prothrombinaseFormed) && (
          <g>
            {[tenaseX - 30, tenaseX - 10, tenaseX + 10, tenaseX + 30,
              prothrombinaseX - 30, prothrombinaseX - 10, prothrombinaseX + 10, prothrombinaseX + 30].map((x, i) => (
              <g key={`ps-${i}`}>
                <circle
                  cx={x}
                  cy={membraneY - 3}
                  r={4}
                  fill="#DC2626"
                  opacity={0.6}
                  style={{ animation: `psPulse 2s ease-in-out ${i * 0.15}s infinite` }}
                />
                <text x={x} y={membraneY + 7} textAnchor="middle" fontSize={4} fill="#DC2626" fontWeight={600} style={{ fontFamily: 'system-ui, sans-serif' }}>PS</text>
              </g>
            ))}
          </g>
        )}

        {/* TENASE membrane anchoring - simplified */}
        {state.tenaseFormed && (
          <g>
            {/* Simple anchor lines to membrane */}
            <line x1={tenaseX - 12} y1={complexY + 40} x2={tenaseX - 12} y2={membraneY - 5} stroke="#A855F7" strokeWidth={2} opacity={0.5} />
            <line x1={tenaseX + 12} y1={complexY + 40} x2={tenaseX + 12} y2={membraneY - 5} stroke="#06B6D4" strokeWidth={2} opacity={0.5} />
            {/* Ca²⁺ indicator */}
            <text x={tenaseX} y={membraneY - 8} textAnchor="middle" fontSize={6} fill="#F59E0B" fontWeight={600} style={{ fontFamily: 'system-ui, sans-serif' }}>Ca²⁺</text>
          </g>
        )}

        {/* PROTHROMBINASE membrane anchoring - simplified */}
        {state.prothrombinaseFormed && (
          <g>
            {/* Simple anchor lines to membrane */}
            <line x1={prothrombinaseX - 12} y1={complexY + 40} x2={prothrombinaseX - 12} y2={membraneY - 5} stroke="#F97316" strokeWidth={2} opacity={0.5} />
            <line x1={prothrombinaseX + 12} y1={complexY + 40} x2={prothrombinaseX + 12} y2={membraneY - 5} stroke="#22C55E" strokeWidth={2} opacity={0.5} />
            {/* Ca²⁺ indicator */}
            <text x={prothrombinaseX} y={membraneY - 8} textAnchor="middle" fontSize={6} fill="#F59E0B" fontWeight={600} style={{ fontFamily: 'system-ui, sans-serif' }}>Ca²⁺</text>
          </g>
        )}

      </svg>

      {/* CSS Animations */}
      <style>{`
        @keyframes dashAnim {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes dashFlow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes activationPulse {
          0%, 100% { opacity: 0.5; stroke-width: 1.5; }
          50% { opacity: 0.9; stroke-width: 2; }
        }
        @keyframes thrombinPulse {
          0%, 100% { filter: drop-shadow(0 4px 8px rgba(220, 38, 38, 0.4)); transform: scale(1); }
          25% { filter: drop-shadow(0 4px 10px rgba(220, 38, 38, 0.5)); transform: scale(1.03); }
          50% { filter: drop-shadow(0 4px 14px rgba(220, 38, 38, 0.6)); transform: scale(1.06); }
          75% { filter: drop-shadow(0 4px 10px rgba(220, 38, 38, 0.5)); transform: scale(1.03); }
        }
        @keyframes burstRadiate {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes burstPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
        }
        @keyframes psPulse {
          0%, 100% { r: 4; opacity: 0.4; }
          50% { r: 5.5; opacity: 0.8; }
        }
        @keyframes complexPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.15); }
          50% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
        }
        @keyframes cofactorDock {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 1; transform: translateY(var(--dock-distance, 120px)); }
        }
        /* Dramatic Thrombin Burst Animations - Slow & Cinematic */
        @keyframes burstSource {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          40% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes fiiaStream {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0;
          }
          10% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          80% {
            transform: translate(calc(-50% + var(--end-x) * 0.9), calc(-50% + var(--end-y) * 0.9)) scale(1);
            opacity: 1;
          }
          95% {
            transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes fibrinogenAppear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          60% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes fibrinogenCleave {
          0% { filter: none; opacity: 1; }
          20% { filter: brightness(1.3) drop-shadow(0 0 6px rgba(220, 38, 38, 0.6)); opacity: 1; }
          40% { filter: brightness(1.6) drop-shadow(0 0 12px rgba(220, 38, 38, 0.9)); opacity: 1; }
          60% { filter: brightness(1.4) drop-shadow(0 0 16px rgba(251, 191, 36, 1)); opacity: 0.9; }
          80% { filter: brightness(1.1) drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); opacity: 0.5; }
          100% { filter: none; opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
        }
        @keyframes cleavageGlow {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          20% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
          80% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.3); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
        }
        @keyframes burstLabelAppear {
          0% { opacity: 0; transform: translateY(15px); }
          70% { opacity: 1; transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fibrinLabelAppear {
          0% { opacity: 0; transform: translateX(-50%) scale(0.7); }
          70% { opacity: 1; transform: translateX(-50%) scale(1.05); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        @keyframes arrowAppear {
          from { opacity: 0; stroke-dashoffset: 50; }
          to { opacity: 0.5; stroke-dashoffset: 0; }
        }
        @keyframes vwfFloat {
          from { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          to { opacity: 0; transform: translate(70px, -45px) rotate(15deg); }
        }
        @keyframes dockToMembrane {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fixaFloatToTenase {
          0% {
            opacity: 0.4;
            transform: translate(0, 0) scale(1);
            filter: grayscale(30%);
          }
          40% {
            opacity: 0.85;
            transform: translate(var(--end-x), calc(var(--end-y) - 25px)) scale(1.05);
            filter: grayscale(0%);
          }
          70% {
            opacity: 1;
            transform: translate(var(--end-x), calc(var(--end-y) - 10px)) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translate(var(--end-x), var(--end-y)) scale(0.9);
          }
        }
        @keyframes fadeInSlide {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FactorSlotProps {
  x: number;
  y: number;
  factorId: string;
  onClick: () => void;
  disabled: boolean;
  isActivated?: boolean;
}

function FactorSlot({
  x,
  y,
  factorId,
  onClick,
  disabled,
  isActivated = false,
}: FactorSlotProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !isActivated ? 0.5 : 1,
        zIndex: 10,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <FactorTokenNew factorId={factorId} isActive={isActivated} enableHover={!disabled} />
    </div>
  );
}

interface ComplexAssemblySlotProps {
  name: string;
  enzyme: { id: string; ready: boolean };
  cofactor: { id: string; ready: boolean };
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
  return (
    <div
      style={{
        position: 'relative',
        padding: '10px 14px',
        border: `2px dashed ${color}`,
        borderRadius: 8,
        background: `${color}08`,
        cursor: canForm && !isAutoMode ? 'pointer' : 'default',
        animation: canForm ? 'complexPulse 2s ease-in-out infinite' : undefined,
      }}
      onClick={() => canForm && !isAutoMode && onForm()}
    >
      <div
        style={{
          position: 'absolute',
          top: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 7px',
          background: '#FFFFFF',
          border: `1px solid ${color}`,
          borderRadius: 4,
          fontSize: 8,
          color: color,
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', marginTop: 6 }}>
        {/* Cofactor with role label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: cofactor.ready ? 'scale(1.1)' : 'scale(1)', opacity: cofactor.ready ? 1 : 0.3 }}>
            <FactorTokenNew factorId={cofactor.id} isActive={cofactor.ready} enableHover={false} />
          </div>
          <span style={{ fontSize: 5, color: '#94A3B8', fontFamily: 'system-ui, sans-serif', marginTop: 2 }}>cofactor</span>
        </div>
        <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>+</div>
        {/* Enzyme with role label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: enzyme.ready ? 'scale(0.9)' : 'scale(1)', opacity: enzyme.ready ? 1 : 0.3 }}>
            <FactorTokenNew factorId={enzyme.id} isActive={enzyme.ready} enableHover={false} />
          </div>
          <span style={{ fontSize: 5, color: '#94A3B8', fontFamily: 'system-ui, sans-serif', marginTop: 2 }}>enzimă</span>
        </div>
      </div>

      {canForm && !isAutoMode && (
        <div
          style={{
            marginTop: 6,
            padding: '3px 7px',
            background: color,
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 8,
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          FORMEAZĂ
        </div>
      )}
    </div>
  );
}

function TenaseComplex({
  isProducing,
  onProduce,
  canProduce,
  isAutoMode,
}: {
  isProducing: boolean;
  onProduce: () => void;
  canProduce: boolean;
  isAutoMode: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px 20px',
        border: '2px solid #06B6D4',
        borderRadius: 8,
        background: 'rgba(6, 182, 212, 0.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 7px',
          background: '#06B6D4',
          borderRadius: 4,
          fontSize: 8,
          color: '#FFFFFF',
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        TENAZĂ
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <div style={{ transform: 'scale(1.1)' }}>
          <FactorTokenNew factorId="FVIIIa" isActive={true} enableHover={false} />
        </div>
        <div style={{ transform: 'scale(0.85)' }}>
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      </div>

      {/* Educational: Enzyme-cofactor roles */}
      <div
        style={{
          marginTop: 4,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          fontSize: 5,
          fontFamily: 'system-ui, sans-serif',
          color: '#64748B',
        }}
      >
        <span title="FVIIIa = cofactor, reorganizează bucla 99 a FIXa">cofactor</span>
        <span title="FIXa = serină protează, enzima activă">enzimă</span>
      </div>

      {isProducing && canProduce && !isAutoMode && (
        <div
          style={{
            marginTop: 6,
            padding: '3px 8px',
            background: '#06B6D4',
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 8,
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
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
  canBurst,
  isAutoMode,
}: {
  isProducing: boolean;
  onTriggerBurst: () => void;
  canBurst: boolean;
  isAutoMode: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px 20px',
        border: '2px solid #3B82F6',
        borderRadius: 8,
        background: 'rgba(59, 130, 246, 0.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 7px',
          background: '#3B82F6',
          borderRadius: 4,
          fontSize: 8,
          color: '#FFFFFF',
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        PROTROMBINAZĂ
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <div style={{ transform: 'scale(1.1)' }}>
          <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />
        </div>
        <div style={{ transform: 'scale(0.85)' }}>
          <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
        </div>
      </div>

      {/* Educational: Enzyme-cofactor roles */}
      <div
        style={{
          marginTop: 4,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          fontSize: 5,
          fontFamily: 'system-ui, sans-serif',
          color: '#64748B',
        }}
      >
        <span title="FVa = cofactor, pozitionează FXa și protrombina">cofactor</span>
        <span title="FXa = serină protează, enzima activă">enzimă</span>
      </div>

      {isProducing && canBurst && !isAutoMode && (
        <div
          style={{
            marginTop: 6,
            padding: '3px 8px',
            background: '#3B82F6',
            borderRadius: 4,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: 8,
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
            cursor: 'pointer',
          }}
          onClick={onTriggerBurst}
        >
          EXPLOZIA DE TROMBINĂ
        </div>
      )}
    </div>
  );
}
