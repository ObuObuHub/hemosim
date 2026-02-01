// components/game/frames/UnifiedPlateletView.tsx
'use client';

import { useMemo } from 'react';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import { PARReceptor } from '../visuals/PARReceptor';
import { ESComplexGlow, CleavageAnimation, ProductReleaseGlow } from '../visuals/EnzymaticActivation';
import { FXIaMembraneBound } from '../visuals/FXIaMembraneBound';
import type { ExplosionState, BurstPhase } from '@/hooks/useCascadeState';

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
  onFXClick: () => void;
  onFIIClick: () => void;
  canActivateFX: boolean;
  canActivateFII: boolean;
  isAutoMode: boolean;
  fixaMigrating: boolean;
  fixaWaiting?: boolean;
  burstPhase?: BurstPhase;
  // FXIa amplification state
  fxiaActivatingFix?: boolean;
  fxiaFixaProduced?: boolean;
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
  onFXClick,
  onFIIClick,
  canActivateFX,
  canActivateFII,
  isAutoMode,
  fixaMigrating,
  fixaWaiting = false,
  burstPhase = 'inactive',
  fxiaActivatingFix = false,
  fxiaFixaProduced = false,
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

  // Dramatic thrombin burst - waves of FIIa CONVERGING to center
  // All particles start from prothrombinase and converge toward center
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
    }> = [];

    const centerX = width * 0.5;
    const centerY = bloodstreamHeight * 0.45;
    const sourceX = prothrombinaseX;
    const sourceY = complexY;

    // Wave 1: Initial burst (8 particles) converging to center - staggered
    for (let i = 0; i < 8; i++) {
      // Start positions fan out slightly from prothrombinase
      const startAngle = ((i - 3.5) / 7) * Math.PI * 0.3;
      const startOffset = 20;
      waves.push({
        id: i,
        startX: sourceX + Math.cos(startAngle) * startOffset,
        startY: sourceY + Math.sin(startAngle) * startOffset * 0.5,
        endX: centerX + deterministicOffset(i, 15),
        endY: centerY + deterministicOffset(i + 50, 10),
        delay: i * 0.12,
        duration: 1.5,
      });
    }

    // Wave 2: Secondary burst (6 particles) - slightly different trajectories
    for (let i = 0; i < 6; i++) {
      const startAngle = ((i - 2.5) / 5) * Math.PI * 0.4;
      const startOffset = 25;
      waves.push({
        id: 8 + i,
        startX: sourceX + Math.cos(startAngle) * startOffset + deterministicOffset(i + 100, 10),
        startY: sourceY + Math.sin(startAngle) * startOffset * 0.4,
        endX: centerX + deterministicOffset(i + 150, 20),
        endY: centerY + deterministicOffset(i + 200, 12),
        delay: 0.6 + i * 0.1,
        duration: 1.4,
      });
    }

    return waves;
  }, [width, bloodstreamHeight, complexY, prothrombinaseX]);

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
            opacity: 0.4,
            filter: 'grayscale(30%)',
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
              opacity: state.parCleavageState === 'activated' ? 1 : 0.4,
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

      {/* FXIa - docks to platelet membrane via GPIb receptor */}
      {state.fxiActivated && (
        <div
          style={{
            position: 'absolute',
            left: (tenaseX + prothrombinaseX) / 2,
            top: membraneY - 64, // Adjusted for membrane anchor height
            transform: 'translateX(-50%)',
            zIndex: 12,
            animation: 'dockToMembrane 1s ease-out',
          }}
        >
          <FXIaMembraneBound isActivating={fxiaActivatingFix} />
        </div>
      )}

      {/* ================================================================= */}
      {/* FXIa AMPLIFICATION - FXIa activates FIX → FIXa (after Tenase forms) */}
      {/* Shows the positive feedback loop distinct from TF:VIIa initiation */}
      {/* ================================================================= */}

      {/* FIXa product emerges from FXIa and moves toward Tenase (to the left) */}
      {state.fxiActivated && state.tenaseFormed && !fxiaFixaProduced && fxiaActivatingFix && (
        <div
          style={{
            position: 'absolute',
            left: (tenaseX + prothrombinaseX) / 2,
            top: membraneY - 50,
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
            animation: 'fixaToTenase 1.2s ease-out forwards',
            ['--tenase-offset' as string]: `${tenaseX - (tenaseX + prothrombinaseX) / 2 + 60}px`,
          }}
        >
          <FactorTokenNew factorId="FIXa" isActive={true} enableHover={false} />
        </div>
      )}

      {/* Cleavage animation at FXIa during activation */}
      {fxiaActivatingFix && (
        <div
          style={{
            position: 'absolute',
            left: (tenaseX + prothrombinaseX) / 2,
            top: membraneY - 28,
            zIndex: 20,
            animation: 'cleavageFlash 1s ease-out 0.8s forwards',
            opacity: 0,
          }}
        >
          <CleavageAnimation x={0} y={0} color="#EC4899" />
        </div>
      )}

      {/* FXIa amplification arrow - starts at FXIa, curves down, points LEFT to Tenase */}
      {fxiaFixaProduced && !state.thrombinBurst && state.fvaDocked && state.fviiaDocked && (
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
            <marker id="amplification-arrow-left" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
              <polygon points="0 0, 8 3, 0 6" fill="#EC4899" />
            </marker>
          </defs>
          {/* Pink arrow: starts at FXIa (center), curves down, goes LEFT to Tenase */}
          <path
            d={`M ${(tenaseX + prothrombinaseX) / 2 - 20} ${membraneY - 28}
                Q ${((tenaseX + prothrombinaseX) / 2 + tenaseX + 80) / 2} ${membraneY - 10}
                ${tenaseX + 80} ${membraneY - 28}`}
            stroke="#EC4899"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="none"
            markerEnd="url(#amplification-arrow-left)"
            style={{ animation: 'amplificationArrowDash 1s linear infinite' }}
          />
        </svg>
      )}

      {/* "Amplificare FIXa" label above FXIa */}
      {fxiaFixaProduced && !state.thrombinBurst && state.fvaDocked && state.fviiaDocked && (
        <div
          style={{
            position: 'absolute',
            left: (tenaseX + prothrombinaseX) / 2,
            top: membraneY - 68,
            transform: 'translateX(-50%)',
            padding: '1px 3px',
            background: '#FDF2F8',
            border: '1px solid #EC4899',
            borderRadius: 2,
            zIndex: 13,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: 7, fontWeight: 600, color: '#BE185D', fontFamily: 'system-ui, sans-serif' }}>
            Amplificare FIXa
          </span>
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
              <path d="M0,0 L4,1.5 L0,3 Z" fill="#DC2626" fillOpacity="0.7" />
            </marker>
          </defs>

          {/* Thrombin → PAR (FIRST arrow - appears immediately when thrombin arrives) */}
          {state.parCleavageState !== 'activated' && (
            <path
              d={`M ${thrombinX - 25} ${thrombinY + 15}
                  C ${thrombinX - 100} ${thrombinY + 80},
                    ${parX + 70} ${membraneY - 120},
                    ${parX + 35} ${membraneY - 70}`}
              stroke="#DC2626"
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
                  stroke="#DC2626"
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
                  stroke="#DC2626"
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
                  stroke="#DC2626"
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
            opacity: 0.4,
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

      {/* TENASE COMPLEX - positioned like TF:VIIa (from top, Gla reaches membrane) */}
      <div
        style={{
          position: 'absolute',
          left: tenaseX,
          top: membraneY - 105,
          transform: 'translateX(-50%)',
        }}
      >
        {state.tenaseFormed ? (
          <TenaseComplex />
        ) : (
          <ComplexAssemblySlot
            name="TENAZĂ"
            enzyme={{ id: 'FIXa', ready: state.fixaArrived }}
            cofactor={{ id: 'FVIIIa', ready: state.fviiaDocked }}
            color="#06B6D4"
          />
        )}
      </div>

      {/* ================================================================= */}
      {/* FX → FXa ENZYMATIC ACTIVATION BY TENASE (E + S → ES → E + P)    */}
      {/* ================================================================= */}

      {/* FX SUBSTRATE - clickable inactive factor (before activation starts) */}
      {state.tenaseFormed && state.plateletFxActivationPhase === 'inactive' && !state.fxaProduced && state.fvaDocked && state.fviiaDocked && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX - 80,
            top: bloodstreamHeight * 0.25,
            transform: 'translate(-50%, -50%)',
            cursor: canActivateFX && !isAutoMode ? 'pointer' : 'default',
            opacity: canActivateFX ? 1 : 0.4,
            zIndex: 15,
            animation: canActivateFX && !isAutoMode ? 'substrateReady 1.5s ease-in-out infinite' : undefined,
          }}
          onClick={() => canActivateFX && !isAutoMode && onFXClick()}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={canActivateFX && !isAutoMode} />
        </div>
      )}

      {/* FX APPROACHING - substrate glides toward Tenase active site */}
      {state.plateletFxActivationPhase === 'approaching' && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX - 80,
            top: bloodstreamHeight * 0.25,
            zIndex: 25,
            animation: 'fxApproachTenase 0.8s ease-out forwards',
            ['--end-x' as string]: `${80}px`,
            ['--end-y' as string]: `${complexY - bloodstreamHeight * 0.25}px`,
            pointerEvents: 'none',
          }}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
        </div>
      )}

      {/* FX ES_COMPLEX - substrate bound at Tenase active site */}
      {state.plateletFxActivationPhase === 'es_complex' && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX,
            top: complexY - 5,
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
          }}
        >
          <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
          <ESComplexGlow color="#22C55E" />
        </div>
      )}

      {/* FX CLEAVING - cleavage animation at Tenase */}
      {state.plateletFxActivationPhase === 'cleaving' && (
        <>
          <div
            style={{
              position: 'absolute',
              left: tenaseX,
              top: complexY - 5,
              transform: 'translate(-50%, -50%)',
              zIndex: 30,
            }}
          >
            <FactorTokenNew factorId="FX" isActive={false} enableHover={false} />
          </div>
          <CleavageAnimation x={tenaseX} y={complexY - 5} color="#22C55E" />
        </>
      )}

      {/* FXa RELEASING - product emerges and moves toward Prothrombinase */}
      {state.plateletFxActivationPhase === 'releasing' && (
        <div
          style={{
            position: 'absolute',
            left: tenaseX,
            top: complexY - 5,
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            animation: 'fxaReleaseToProthrombinase 1.2s ease-out forwards',
            ['--end-x' as string]: `${prothrombinaseX - tenaseX}px`,
          }}
        >
          <FactorTokenNew factorId="FXa" isActive={true} enableHover={false} />
          <ProductReleaseGlow color="#22C55E" />
        </div>
      )}

      {/* FXa flow arrow (Tenase → Prothrombinase) - remains visible after complex forms */}
      {(state.fxaProduced || fxiaFixaProduced) && !state.thrombinBurst && state.fvaDocked && state.fviiaDocked && (
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
          {/* FXa label */}
          <g transform={`translate(${(tenaseX + prothrombinaseX) / 2}, ${complexY - 50})`}>
            <rect x={-28} y={-10} width={56} height={20} rx={3} fill="#DCFCE7" stroke="#22C55E" strokeWidth={2} />
            <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#15803D" style={{ fontFamily: 'system-ui, sans-serif' }}>
              FXa →
            </text>
          </g>
        </svg>
      )}

      {/* PROTHROMBINASE COMPLEX - positioned like TF:VIIa (from top, Gla reaches membrane) */}
      <div
        style={{
          position: 'absolute',
          left: prothrombinaseX,
          top: membraneY - 105,
          transform: 'translateX(-50%)',
        }}
      >
        {state.prothrombinaseFormed ? (
          <ProthrombinaseComplex />
        ) : (
          <ComplexAssemblySlot
            name="PROTROMBINAZĂ"
            enzyme={{ id: 'FXa', ready: state.fxaProduced ?? false }}
            cofactor={{ id: 'FVa', ready: state.fvaDocked }}
            color="#DC2626"
          />
        )}
      </div>

      {/* ================================================================= */}
      {/* FII → FIIa ENZYMATIC ACTIVATION BY PROTHROMBINASE (E + S → ES → E + P) */}
      {/* ================================================================= */}

      {/* FII SUBSTRATE - clickable inactive factor (before activation starts) */}
      {state.prothrombinaseFormed && state.plateletFiiActivationPhase === 'inactive' && !state.thrombinBurst && (
        <div
          style={{
            position: 'absolute',
            left: prothrombinaseX + 80,
            top: bloodstreamHeight * 0.25,
            transform: 'translate(-50%, -50%)',
            cursor: canActivateFII && !isAutoMode ? 'pointer' : 'default',
            opacity: canActivateFII ? 1 : 0.4,
            zIndex: 15,
            animation: canActivateFII && !isAutoMode ? 'substrateReady 1.5s ease-in-out infinite' : undefined,
          }}
          onClick={() => canActivateFII && !isAutoMode && onFIIClick()}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={canActivateFII && !isAutoMode} />
        </div>
      )}

      {/* FII APPROACHING - substrate glides toward Prothrombinase active site */}
      {state.plateletFiiActivationPhase === 'approaching' && (
        <div
          style={{
            position: 'absolute',
            left: prothrombinaseX + 80,
            top: bloodstreamHeight * 0.25,
            zIndex: 25,
            animation: 'fiiApproachProthrombinase 0.8s ease-out forwards',
            ['--end-x' as string]: `${-80}px`,
            ['--end-y' as string]: `${complexY - bloodstreamHeight * 0.25}px`,
            pointerEvents: 'none',
          }}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
        </div>
      )}

      {/* FII ES_COMPLEX - substrate bound at Prothrombinase active site */}
      {state.plateletFiiActivationPhase === 'es_complex' && (
        <div
          style={{
            position: 'absolute',
            left: prothrombinaseX,
            top: complexY - 5,
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
          }}
        >
          <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
          <ESComplexGlow color="#DC2626" />
        </div>
      )}

      {/* FII CLEAVING - cleavage animation at Prothrombinase */}
      {state.plateletFiiActivationPhase === 'cleaving' && (
        <>
          <div
            style={{
              position: 'absolute',
              left: prothrombinaseX,
              top: complexY - 5,
              transform: 'translate(-50%, -50%)',
              zIndex: 30,
            }}
          >
            <FactorTokenNew factorId="FII" isActive={false} enableHover={false} />
          </div>
          <CleavageAnimation x={prothrombinaseX} y={complexY - 5} color="#DC2626" />
        </>
      )}

      {/* FIIa RELEASING - product emerges (thrombin burst will follow) */}
      {state.plateletFiiActivationPhase === 'releasing' && (
        <div
          style={{
            position: 'absolute',
            left: prothrombinaseX,
            top: complexY - 5,
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
          }}
        >
          <FactorTokenNew factorId="FIIa" isActive={true} enableHover={false} />
          <ProductReleaseGlow color="#DC2626" />
        </div>
      )}

      {/* ============ DRAMATIC EXPLOZIA DE TROMBINĂ ============ */}
      {/* Phase 1: CONVERGING - FIIa tokens stream from prothrombinase toward center */}
      {state.thrombinBurst && (burstPhase === 'converging' || burstPhase === 'inactive') && state.phase !== 'clotting' && state.phase !== 'stable' && (
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

          {/* FIIa particles CONVERGING to center using FactorTokenNew */}
          {burstWaves.map((particle) => (
            <div
              key={`fiia-converge-${particle.id}`}
              style={{
                position: 'absolute',
                left: particle.startX,
                top: particle.startY,
                zIndex: 30,
                animation: `fiiaConverge ${particle.duration}s ease-in-out ${particle.delay}s forwards`,
                ['--to-center-x' as string]: `${particle.endX - particle.startX}px`,
                ['--to-center-y' as string]: `${particle.endY - particle.startY}px`,
                pointerEvents: 'none',
                opacity: 0,
              }}
            >
              <div style={{ transform: 'scale(0.7)' }}>
                <FactorTokenNew
                  factorId="FIIa"
                  isActive={true}
                  enableHover={false}
                  hideGlaDomain={true}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {/* Phase 2: EXPLOSION - Central amplification effect */}
      {burstPhase === 'explosion' && state.phase !== 'clotting' && state.phase !== 'stable' && (
        <>
          {/* Expanding radial glow (red → gold gradient) */}
          <div
            style={{
              position: 'absolute',
              left: width * 0.5,
              top: bloodstreamHeight * 0.45,
              transform: 'translate(-50%, -50%)',
              width: 180,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(220,38,38,0.8) 0%, rgba(251,191,36,0.5) 40%, transparent 70%)',
              animation: 'explosionPulse 1s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 30,
            }}
          />

          {/* Flash effect */}
          <div
            style={{
              position: 'absolute',
              left: width * 0.5,
              top: bloodstreamHeight * 0.45,
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)',
              animation: 'explosionFlash 0.4s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 35,
            }}
          />

          {/* Concentration label */}
          <div
            style={{
              position: 'absolute',
              left: width * 0.5,
              top: bloodstreamHeight * 0.45,
              transform: 'translate(-50%, -50%)',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)',
              border: '3px solid #FBBF24',
              borderRadius: 12,
              boxShadow: '0 6px 30px rgba(220, 38, 38, 0.7)',
              animation: 'burstLabelAppear 0.5s ease-out forwards',
              zIndex: 40,
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#FBBF24', fontSize: 14, fontWeight: 800, fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>
              ~350 nM TROMBINĂ
            </div>
            <div style={{ color: '#FECACA', fontSize: 10, fontFamily: 'system-ui, sans-serif', marginTop: 3 }}>
              ×300,000 amplificare
            </div>
          </div>
        </>
      )}



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
        @keyframes complexPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.15); }
          50% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
        }
        /* Substrate approach animations */
        @keyframes substrateReady {
          0%, 100% { transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
          50% { transform: translate(-50%, -50%) scale(1.08); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }
        }
        @keyframes fxApproachTenase {
          0% {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y)));
            opacity: 1;
          }
        }
        @keyframes fiiApproachProthrombinase {
          0% {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y)));
            opacity: 1;
          }
        }
        @keyframes fxaReleaseToProthrombinase {
          0% {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--end-x)), -50%);
            opacity: 1;
          }
        }
        @keyframes cofactorDock {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 1; transform: translateY(var(--dock-distance, 120px)); }
        }
        /* Dramatic Thrombin Burst Animations - Converging to Center */
        @keyframes burstSource {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          40% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        /* FIIa particles CONVERGE to center */
        @keyframes fiiaConverge {
          0% {
            transform: translate(0, 0) scale(0.6);
            opacity: 0;
          }
          15% {
            transform: translate(calc(var(--to-center-x) * 0.1), calc(var(--to-center-y) * 0.1)) scale(0.8);
            opacity: 1;
          }
          80% {
            transform: translate(calc(var(--to-center-x) * 0.9), calc(var(--to-center-y) * 0.9)) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--to-center-x), var(--to-center-y)) scale(0.7);
            opacity: 0;
          }
        }
        /* Central explosion pulse */
        @keyframes explosionPulse {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.3; }
        }
        /* Flash effect at center */
        @keyframes explosionFlash {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        /* Fibrinogen cleavage scene appearance */
        @keyframes fibrinogenSceneAppear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        /* Thrombin approaching E domain - clean approach and exit */
        @keyframes thrombinApproachE {
          0% { transform: translateY(-50%) translateX(-35px) scale(0.5); opacity: 0; }
          15% { transform: translateY(-50%) translateX(-20px) scale(0.5); opacity: 1; }
          40% { transform: translateY(-50%) translateX(5px) scale(0.52); opacity: 1; }
          60% { transform: translateY(-50%) translateX(15px) scale(0.5); opacity: 1; }
          85% { transform: translateY(-50%) translateX(30px) scale(0.5); opacity: 0.6; }
          100% { transform: translateY(-50%) translateX(45px) scale(0.5); opacity: 0; }
        }
        /* Cleavage flash at E domain */
        @keyframes cleavageFlashE {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; transform: scale(1.5); }
          60% { opacity: 0.6; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        /* Fibrinogen fades out after cleavage - CLEAN DISAPPEARANCE */
        @keyframes fibrinogenFadeOut {
          0% { opacity: 1; transform: scale(1); }
          40% { opacity: 0.6; transform: scale(0.98); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        /* Fibrinopeptide A release (flies up-left) */
        @keyframes fpARelease {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          15% { opacity: 1; transform: translate(-5px, -5px) scale(1); }
          50% { opacity: 1; transform: translate(-20px, -18px) scale(0.9); }
          100% { opacity: 0; transform: translate(-45px, -40px) scale(0.5) rotate(-40deg); }
        }
        /* Fibrinopeptide B release (flies up-right) */
        @keyframes fpBRelease {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          15% { opacity: 1; transform: translate(5px, -5px) scale(1); }
          50% { opacity: 1; transform: translate(20px, -18px) scale(0.9); }
          100% { opacity: 0; transform: translate(45px, -40px) scale(0.5) rotate(40deg); }
        }
        /* Fibrin monomer appears AFTER fibrinogen is gone - clean emergence */
        @keyframes fibrinAppear {
          0% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        /* Polymerizing phase appearance */
        @keyframes polymerizingAppear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes burstLabelAppear {
          0% { opacity: 0; transform: translateY(15px); }
          70% { opacity: 1; transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0); }
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
        /* FXIa Amplification Animations */
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 0.8; }
        }
        @keyframes fixaToTenase {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tenase-offset)), -50%) scale(0.9); opacity: 0; }
        }
        @keyframes cleavageFlash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes amplificationArrowDash {
          from { stroke-dashoffset: 18; }
          to { stroke-dashoffset: 0; }
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
        opacity: disabled && !isActivated ? 0.4 : 1,
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
  color: string;
}

function ComplexAssemblySlot({
  name,
  enzyme,
  cofactor,
  color,
}: ComplexAssemblySlotProps): React.ReactElement {
  const bothReady = enzyme.ready && cofactor.ready;

  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px 16px',
        border: `2px dashed ${color}`,
        borderRadius: 8,
        background: `${color}08`,
        animation: bothReady ? 'complexPulse 1s ease-in-out infinite' : undefined,
      }}
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

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', marginTop: 6 }}>
        <div style={{ opacity: cofactor.ready ? 1 : 0.4 }}>
          <FactorTokenNew factorId={cofactor.id} isActive={cofactor.ready} enableHover={false} />
        </div>
        <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>+</div>
        <div style={{ opacity: enzyme.ready ? 1 : 0.4 }}>
          <FactorTokenNew factorId={enzyme.id} isActive={enzyme.ready} enableHover={false} hideGlaDomain={true} />
        </div>
      </div>

    </div>
  );
}

function TenaseComplex(): React.ReactElement {
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
      {/* Label badge */}
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
          whiteSpace: 'nowrap',
        }}
      >
        TENAZĂ
      </div>

      {/* Enzyme + Cofactor layout - identical to TF:VIIa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, position: 'relative' }}>
        {/* FVIIIa - Cofactor */}
        <FactorTokenNew factorId="FVIIIa" isActive={true} enableHover={false} />

        {/* FIXa - Enzyme (circular) with Gla domain - same structure as FVIIa */}
        <div style={{ position: 'relative' }}>
          {/* FIXa serine protease with active site slot */}
          <svg width={42} height={42} viewBox="0 0 42 42">
            {/* Main circle */}
            <circle cx={21} cy={21} r={18} fill="#06B6D4" stroke="#0891B2" strokeWidth={2} />
            {/* Active site slot */}
            <path
              d={`M ${21 - 3.5} 3 L ${21 - 3.5} ${3 + 9} A 3 3 0 0 0 ${21 + 3.5} ${3 + 9} L ${21 + 3.5} 3 Z`}
              fill="#E2E8F0"
            />
            <path
              d={`M ${21 - 3.5} 3 L ${21 - 3.5} ${3 + 9 - 2.5} A 2.5 2.5 0 0 0 ${21 + 3.5} ${3 + 9 - 2.5} L ${21 + 3.5} 3`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            {/* Label */}
            <text x={21} y={26} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF" style={{ fontFamily: 'system-ui, sans-serif' }}>
              FIXa
            </text>
          </svg>

          {/* Gla domain with labels - identical positioning to FVIIa */}
          <svg
            width={50}
            height={48}
            style={{
              position: 'absolute',
              left: 4,
              top: 38,
              overflow: 'visible',
            }}
          >
            <path
              d="M 12 0 Q 16 12, 12 22 Q 8 32, 14 42"
              stroke="#1F2937"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
            {/* Gla label */}
            <text x={20} y={10} fontSize={7} fontWeight={600} fill="#374151" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Gla
            </text>
            {/* Ca²⁺ label */}
            <text x={-6} y={38} fontSize={6} fontWeight={600} fill="#64748B" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Ca²⁺
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

function ProthrombinaseComplex(): React.ReactElement {
  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px 20px',
        border: '2px solid #DC2626',
        borderRadius: 8,
        background: 'rgba(220, 38, 38, 0.08)',
      }}
    >
      {/* Label badge */}
      <div
        style={{
          position: 'absolute',
          top: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 7px',
          background: '#DC2626',
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

      {/* Enzyme + Cofactor layout - identical to TF:VIIa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, position: 'relative' }}>
        {/* FVa - Cofactor */}
        <FactorTokenNew factorId="FVa" isActive={true} enableHover={false} />

        {/* FXa - Enzyme (circular) with Gla domain - same structure as FVIIa */}
        <div style={{ position: 'relative' }}>
          {/* FXa serine protease with active site slot */}
          <svg width={42} height={42} viewBox="0 0 42 42">
            {/* Main circle */}
            <circle cx={21} cy={21} r={18} fill="#22C55E" stroke="#16A34A" strokeWidth={2} />
            {/* Active site slot */}
            <path
              d={`M ${21 - 3.5} 3 L ${21 - 3.5} ${3 + 9} A 3 3 0 0 0 ${21 + 3.5} ${3 + 9} L ${21 + 3.5} 3 Z`}
              fill="#E2E8F0"
            />
            <path
              d={`M ${21 - 3.5} 3 L ${21 - 3.5} ${3 + 9 - 2.5} A 2.5 2.5 0 0 0 ${21 + 3.5} ${3 + 9 - 2.5} L ${21 + 3.5} 3`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            {/* Label */}
            <text x={21} y={26} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF" style={{ fontFamily: 'system-ui, sans-serif' }}>
              FXa
            </text>
          </svg>

          {/* Gla domain with labels - identical positioning to FVIIa */}
          <svg
            width={50}
            height={48}
            style={{
              position: 'absolute',
              left: 4,
              top: 38,
              overflow: 'visible',
            }}
          >
            <path
              d="M 12 0 Q 16 12, 12 22 Q 8 32, 14 42"
              stroke="#1F2937"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
            {/* Gla label */}
            <text x={20} y={10} fontSize={7} fontWeight={600} fill="#374151" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Gla
            </text>
            {/* Ca²⁺ label */}
            <text x={-6} y={38} fontSize={6} fontWeight={600} fill="#64748B" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Ca²⁺
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
