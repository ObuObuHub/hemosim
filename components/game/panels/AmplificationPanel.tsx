// components/game/panels/AmplificationPanel.tsx
'use client';

import { useMemo, useEffect } from 'react';
import { PhospholipidMembrane } from '../visuals/PhospholipidMembrane';
import { PARReceptor } from '../visuals/PARReceptor';
import { FactorTokenNew } from '../tokens/FactorTokenNew';
import type { AmplificationState } from '@/hooks/useThreePanelState';

interface AmplificationPanelProps {
  width: number;
  height: number;
  state: AmplificationState;
  thrombinAvailable: boolean;
  fixaInPropagation?: boolean;  // FIXa has moved to Propagation (hide from Amplification)
  onActivateFactor: (factorId: string) => void;
  onDockCofactor?: (cofactorId: 'FVa' | 'FVIIIa') => void;
  // PAR cleavage callbacks
  onPARThrombinBind?: () => void;
  onPARCleave?: () => void;
  onPARActivate?: () => void;
  // FIXa click callback (to send to Propagation)
  onFIXaClick?: () => void;
}

/**
 * AMPLIFICATION PANEL - Platelet surface activation (Textbook Style)
 *
 * CELL-BASED MODEL - Phase 2: Amplification
 * The "spark" from initiation ignites platelet activation
 *
 * Medical Accuracy:
 * 1. Small amount of thrombin (FIIa) diffuses to nearby platelets
 * 2. Thrombin activates platelets via PAR receptors (Protease-Activated Receptors)
 * 3. Platelet shape change: disc → spiny form with pseudopods
 * 4. Platelet exposes phosphatidylserine (PS) - the negative phospholipid surface
 * 5. Thrombin cleaves: FV → FVa, FVIII → FVIIIa
 * 6. Cofactors BIND to platelet membrane surface (not just float)
 */
export function AmplificationPanel({
  width,
  height,
  state,
  thrombinAvailable,
  fixaInPropagation = false,
  onActivateFactor,
  onDockCofactor,
  onPARThrombinBind,
  onPARCleave,
  onPARActivate,
  onFIXaClick,
}: AmplificationPanelProps): React.ReactElement {
  const layout = useMemo(() => {
    const membraneHeight = height * 0.32;
    const bloodstreamHeight = height - membraneHeight;
    const membraneY = bloodstreamHeight;

    // Position factors in the bloodstream above the membrane
    const centerX = width / 2;

    return {
      membraneHeight,
      membraneY,
      bloodstreamHeight,
      centerX,
      positions: {
        vwfFviii: { x: width * 0.22, y: bloodstreamHeight * 0.28 },
        fv: { x: width * 0.5, y: bloodstreamHeight * 0.25 },
        fxi: { x: width * 0.78, y: bloodstreamHeight * 0.28 },
      },
      // Docked cofactor positions on membrane
      dockedPositions: {
        fviiia: { x: width * 0.3, y: membraneY + 8 },
        fva: { x: width * 0.5, y: membraneY + 8 },
      },
      // PAR receptor position
      parPosition: { x: width * 0.7, y: membraneY - 15 },
    };
  }, [width, height]);

  // Auto-dock cofactors after activation (with delay for animation)
  useEffect(() => {
    if (state.vwfSplit && !state.fviiiaDocked && onDockCofactor) {
      const timer = setTimeout(() => onDockCofactor('FVIIIa'), 600);
      return () => clearTimeout(timer);
    }
  }, [state.vwfSplit, state.fviiiaDocked, onDockCofactor]);

  useEffect(() => {
    if (state.fvActivated && !state.fvaDocked && onDockCofactor) {
      const timer = setTimeout(() => onDockCofactor('FVa'), 600);
      return () => clearTimeout(timer);
    }
  }, [state.fvActivated, state.fvaDocked, onDockCofactor]);

  // Auto-bind thrombin to PAR when available and PAR is intact
  useEffect(() => {
    if (thrombinAvailable && state.parCleavageState === 'intact' && onPARThrombinBind) {
      const timer = setTimeout(() => onPARThrombinBind(), 500);
      return () => clearTimeout(timer);
    }
  }, [thrombinAvailable, state.parCleavageState, onPARThrombinBind]);

  // Auto-activate PAR after cleavage (tethered ligand folds back)
  useEffect(() => {
    if (state.parCleavageState === 'cleaved' && onPARActivate) {
      const timer = setTimeout(() => onPARActivate(), 1500);
      return () => clearTimeout(timer);
    }
  }, [state.parCleavageState, onPARActivate]);

  // Handle PAR cleavage click
  const handlePARClick = (): void => {
    if (state.parCleavageState === 'thrombin-bound' && onPARCleave) {
      onPARCleave();
    }
  };

  // Check if all cofactors are docked
  const allCofactorsDocked = state.fvaDocked && state.fviiiaDocked;

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

      {/* Membrane surface with PhospholipidMembrane (platelet) */}
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
        {/* Phosphatidylserine (PS) exposure glow when platelet activated */}
        {state.plateletActivated && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.1) 100%)',
              pointerEvents: 'none',
              animation: 'psExposure 2s ease-out',
            }}
          />
        )}
      </div>

      {/* Phase Badge - Yellow for Amplification */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '8px 14px',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.9) 0%, rgba(202, 138, 4, 0.9) 100%)',
          borderRadius: 10,
          boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)',
          zIndex: 20,
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 500, opacity: 0.9, letterSpacing: 1.5 }}>
          FAZA 2
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>
          AMPLIFICARE
        </div>
      </div>

      {/* Thrombin arrival indicator */}
      {thrombinAvailable && !state.plateletActivated && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '6px 12px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
            borderRadius: 8,
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.5)',
            animation: 'thrombinArrival 1.5s ease-in-out infinite',
            zIndex: 20,
          }}
        >
          <div style={{ color: '#FCA5A5', fontSize: 8, fontWeight: 600, letterSpacing: 0.5 }}>
            FIIa SOSEȘTE
          </div>
          <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700 }}>
            Trombina activează
          </div>
        </div>
      )}

      {/* Factors arriving at top border - FIIa and FIXa side by side */}
      {/* FIIa Token (stays in Amplification) */}
      {thrombinAvailable && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '40%',
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
            factorId="FIIa"
            isActive
            style={{
              filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))',
            }}
          />
          <div
            style={{
              padding: '2px 8px',
              background: 'rgba(239, 68, 68, 0.9)',
              borderRadius: 4,
              fontSize: 8,
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            FIIa (rămâne)
          </div>
        </div>
      )}

      {/* FIXa Token (clickable - sends to Propagation) */}
      {state.fixaAtAmplification && !fixaInPropagation && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '60%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            animation: 'factorArriveFromTop 0.8s ease-out',
            zIndex: 25,
            cursor: 'pointer',
          }}
          onClick={onFIXaClick}
        >
          <FactorTokenNew
            factorId="FIXa"
            isActive
            style={{
              filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))',
              transition: 'transform 0.2s ease',
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
              animation: 'fixaClickHint 1.5s ease-in-out infinite',
            }}
          >
            Click → Propagare
          </div>
        </div>
      )}

      {/* PLATELET VISUALIZATION with shape change */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 8,
        }}
      >
        <defs>
          {/* Platelet gradient */}
          <radialGradient id="plateletGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#FFE4B5" />
            <stop offset="100%" stopColor="#DEB887" />
          </radialGradient>
          {/* Activated platelet gradient (golden glow for PS) */}
          <radialGradient id="activatedPlateletGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>

        {/* Platelet silhouette - shows shape change */}
        <g transform={`translate(${layout.parPosition.x - 40}, ${layout.membraneY - 35})`}>
          {state.plateletActivated ? (
            // ACTIVATED: Spiny form with pseudopods
            <g style={{ animation: 'plateletShapeChange 0.8s ease-out' }}>
              {/* Central body */}
              <ellipse
                cx={40}
                cy={20}
                rx={28}
                ry={14}
                fill="url(#activatedPlateletGradient)"
                stroke="#D97706"
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' }}
              />
              {/* Pseudopods (spiny extensions) */}
              <path
                d="M 12 20 L 0 15 M 12 18 L 2 8 M 15 12 L 10 0"
                stroke="#F59E0B"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 68 20 L 80 15 M 68 18 L 78 8 M 65 12 L 70 0"
                stroke="#F59E0B"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 30 30 L 25 42 M 50 30 L 55 42"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />
              {/* PS exposure label */}
              <text x={40} y={45} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight={600}>
                PS expus
              </text>
            </g>
          ) : (
            // RESTING: Smooth disc shape
            <ellipse
              cx={40}
              cy={20}
              rx={25}
              ry={12}
              fill="url(#plateletGradient)"
              stroke="#C4A77D"
              strokeWidth={1}
              opacity={thrombinAvailable ? 1 : 0.6}
            />
          )}
        </g>

{/* PAR Receptor placeholder - component rendered separately */}
      </svg>

      {/* PAR1 Receptor - Interactive serpentine GPCR */}
      <PARReceptor
        x={layout.parPosition.x}
        y={layout.parPosition.y}
        state={state.parCleavageState}
        onClick={handlePARClick}
        isClickable={state.parCleavageState === 'thrombin-bound'}
      />

      {/* vWF-FVIII Complex / FVIIIa - in bloodstream */}
      {!state.fviiiaDocked && (
        <ActivationFactorSlot
          x={layout.positions.vwfFviii.x}
          y={state.vwfSplit ? layout.positions.vwfFviii.y + 30 : layout.positions.vwfFviii.y}
          inactiveFactorId="FVIII"
          activeFactorId="FVIIIa"
          isActivated={state.vwfSplit}
          label={state.vwfSplit ? 'FVIIIa' : 'vWF-VIII'}
          sublabel={state.vwfSplit ? '↓ Se leagă de membrană' : 'Complex circulant'}
          onClick={() => !state.vwfSplit && thrombinAvailable && onActivateFactor('vWF-VIII')}
          disabled={!thrombinAvailable || state.vwfSplit}
          isDocking={state.vwfSplit && !state.fviiiaDocked}
        />
      )}

      {/* FV / FVa - in bloodstream */}
      {!state.fvaDocked && (
        <ActivationFactorSlot
          x={layout.positions.fv.x}
          y={state.fvActivated ? layout.positions.fv.y + 30 : layout.positions.fv.y}
          inactiveFactorId="FV"
          activeFactorId="FVa"
          isActivated={state.fvActivated}
          label={state.fvActivated ? 'FVa' : 'FV'}
          sublabel={state.fvActivated ? '↓ Se leagă de membrană' : 'Procofactor'}
          onClick={() => !state.fvActivated && thrombinAvailable && onActivateFactor('FV')}
          disabled={!thrombinAvailable || state.fvActivated}
          isDocking={state.fvActivated && !state.fvaDocked}
        />
      )}

      {/* FXI / FXIa */}
      <ActivationFactorSlot
        x={layout.positions.fxi.x}
        y={layout.positions.fxi.y}
        inactiveFactorId="FXI"
        activeFactorId="FXIa"
        isActivated={state.fxiActivated}
        label={state.fxiActivated ? 'FXIa' : 'FXI'}
        sublabel={state.fxiActivated ? '→ mai mult FIXa' : 'Zimogen'}
        onClick={() => !state.fxiActivated && thrombinAvailable && onActivateFactor('FXI')}
        disabled={!thrombinAvailable || state.fxiActivated}
      />

      {/* DOCKED COFACTORS on membrane surface */}
      {state.fviiiaDocked && (
        <DockedCofactor
          x={layout.dockedPositions.fviiia.x}
          y={layout.dockedPositions.fviiia.y}
          factorId="FVIIIa"
          label="FVIIIa"
        />
      )}
      {state.fvaDocked && (
        <DockedCofactor
          x={layout.dockedPositions.fva.x}
          y={layout.dockedPositions.fva.y}
          factorId="FVa"
          label="FVa"
        />
      )}

      {/* Thrombin activation arrows */}
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
        {thrombinAvailable && (
          <>
            {/* Central thrombin indicator */}
            <circle
              cx={layout.centerX}
              cy={layout.bloodstreamHeight * 0.55}
              r={16}
              fill="url(#thrombinGradient)"
              style={{ filter: 'drop-shadow(0 0 12px rgba(220, 38, 38, 0.8))' }}
            />
            <text
              x={layout.centerX}
              y={layout.bloodstreamHeight * 0.55 + 4}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill="#FFFFFF"
            >
              IIa
            </text>

            {/* Thrombin → vWF-VIII arrow */}
            {!state.vwfSplit && (
              <ThrombinArrowPath
                fromX={layout.centerX}
                fromY={layout.bloodstreamHeight * 0.55}
                toX={layout.positions.vwfFviii.x}
                toY={layout.positions.vwfFviii.y + 30}
              />
            )}

            {/* Thrombin → FV arrow */}
            {!state.fvActivated && (
              <ThrombinArrowPath
                fromX={layout.centerX}
                fromY={layout.bloodstreamHeight * 0.55}
                toX={layout.positions.fv.x}
                toY={layout.positions.fv.y + 30}
              />
            )}

            {/* Thrombin → FXI arrow */}
            {!state.fxiActivated && (
              <ThrombinArrowPath
                fromX={layout.centerX}
                fromY={layout.bloodstreamHeight * 0.55}
                toX={layout.positions.fxi.x}
                toY={layout.positions.fxi.y + 30}
              />
            )}

            {/* Thrombin → PAR (platelet activation) arrow */}
            {!state.plateletActivated && (
              <ThrombinArrowPath
                fromX={layout.centerX}
                fromY={layout.bloodstreamHeight * 0.55}
                toX={layout.parPosition.x}
                toY={layout.parPosition.y - 15}
              />
            )}
          </>
        )}

        {/* Gradient definition for thrombin */}
        <defs>
          <radialGradient id="thrombinGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>
        </defs>
      </svg>

      {/* Platelet Activation Status */}
      {state.plateletActivated && (
        <div
          style={{
            position: 'absolute',
            bottom: layout.membraneHeight + 50,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%)',
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.6)',
            animation: 'plateletActivatedBadge 1s ease-out',
            zIndex: 15,
          }}
        >
          <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
            TROMBOCIT ACTIVAT
          </div>
          <div style={{ color: '#DCFCE7', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
            PS expus • Gata pentru propagare
          </div>
        </div>
      )}

      {/* Membrane-bound cofactors status */}
      {allCofactorsDocked && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 12px',
            background: 'rgba(245, 158, 11, 0.3)',
            border: '1.5px solid #F59E0B',
            borderRadius: 6,
            zIndex: 15,
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 600, color: '#FCD34D', letterSpacing: 0.5 }}>
            COFACTORI LEGAȚI DE MEMBRANĂ
          </span>
        </div>
      )}

      {/* Progress Dots */}
      <div
        style={{
          position: 'absolute',
          bottom: allCofactorsDocked ? 35 : 8,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          zIndex: 20,
        }}
      >
        <ProgressDot label="VIII" active={state.vwfSplit} docked={state.fviiiaDocked} color="#22C55E" />
        <ProgressDot label="V" active={state.fvActivated} docked={state.fvaDocked} color="#3B82F6" />
        <ProgressDot label="XI" active={state.fxiActivated} color="#EC4899" />
        <ProgressDot label="PLT" active={state.plateletActivated} color="#F59E0B" />
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
        @keyframes thrombinArrival {
          0%, 100% { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 4px 25px rgba(239, 68, 68, 0.8); }
        }
        @keyframes plateletActivatedBadge {
          0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
          60% { transform: translateX(-50%) scale(1.1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes thrombinDash {
          from { stroke-dashoffset: 12; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes psExposure {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes plateletShapeChange {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes thrombinBind {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes dockingMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); opacity: 0; }
        }
        @keyframes dockedAppear {
          0% { transform: translateY(-20px) scale(0.5); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes anchorLine {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes fixaClickHint {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(6, 182, 212, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 2px 15px rgba(6, 182, 212, 0.8);
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// ACTIVATION FACTOR SLOT COMPONENT
// =============================================================================

interface ActivationFactorSlotProps {
  x: number;
  y: number;
  inactiveFactorId: string;
  activeFactorId: string;
  isActivated: boolean;
  label: string;
  sublabel: string;
  onClick: () => void;
  disabled: boolean;
  isDocking?: boolean;
}

function ActivationFactorSlot({
  x,
  y,
  inactiveFactorId,
  activeFactorId,
  isActivated,
  label,
  sublabel,
  onClick,
  disabled,
  isDocking = false,
}: ActivationFactorSlotProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 35,
        top: y - 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !isActivated ? 0.35 : 1,
        filter: isActivated
          ? 'drop-shadow(2px 3px 6px rgba(0,0,0,0.4))'
          : disabled
          ? 'grayscale(50%)'
          : 'none',
        transition: 'all 0.3s ease',
        animation: isDocking ? 'dockingMove 0.6s ease-in forwards' : 'none',
        zIndex: 10,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <FactorTokenNew
        factorId={isActivated ? activeFactorId : inactiveFactorId}
        isActive={isActivated}
      />
      <div
        style={{
          padding: '2px 6px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF' }}>
          {label}
        </div>
        <div style={{ fontSize: 8, color: isActivated ? '#4ADE80' : 'rgba(255, 255, 255, 0.7)' }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DOCKED COFACTOR COMPONENT (on membrane surface)
// =============================================================================

interface DockedCofactorProps {
  x: number;
  y: number;
  factorId: string;
  label: string;
}

function DockedCofactor({ x, y, factorId, label }: DockedCofactorProps): React.ReactElement {
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
        animation: 'dockedAppear 0.5s ease-out',
        zIndex: 12,
      }}
    >
      <FactorTokenNew factorId={factorId} isActive style={{ transform: 'scale(0.85)' }} />
      {/* Membrane anchor lines with Ca²⁺ */}
      <svg width={50} height={20} style={{ marginTop: -5 }}>
        {/* Anchor lines */}
        <line
          x1={15}
          y1={0}
          x2={10}
          y2={18}
          stroke="rgba(135, 206, 235, 0.6)"
          strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ animation: 'anchorLine 2s ease-in-out infinite' }}
        />
        <line
          x1={25}
          y1={0}
          x2={25}
          y2={18}
          stroke="rgba(135, 206, 235, 0.6)"
          strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ animation: 'anchorLine 2s ease-in-out infinite 0.3s' }}
        />
        <line
          x1={35}
          y1={0}
          x2={40}
          y2={18}
          stroke="rgba(135, 206, 235, 0.6)"
          strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ animation: 'anchorLine 2s ease-in-out infinite 0.6s' }}
        />
        {/* Ca²⁺ ions */}
        <circle cx={12} cy={14} r={3} fill="#87CEEB" style={{ filter: 'drop-shadow(0 0 3px rgba(135, 206, 235, 0.8))' }} />
        <circle cx={25} cy={16} r={3} fill="#87CEEB" style={{ filter: 'drop-shadow(0 0 3px rgba(135, 206, 235, 0.8))' }} />
        <circle cx={38} cy={14} r={3} fill="#87CEEB" style={{ filter: 'drop-shadow(0 0 3px rgba(135, 206, 235, 0.8))' }} />
      </svg>
      <div
        style={{
          fontSize: 8,
          fontWeight: 600,
          color: '#FCD34D',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {label} legat
      </div>
    </div>
  );
}

// =============================================================================
// THROMBIN ARROW PATH COMPONENT
// =============================================================================

interface ThrombinArrowPathProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function ThrombinArrowPath({
  fromX,
  fromY,
  toX,
  toY,
}: ThrombinArrowPathProps): React.ReactElement {
  const markerId = `thrombin-arrow-${fromX}-${toX}`;

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="5"
          refX="6"
          refY="2.5"
          orient="auto"
        >
          <polygon points="0 0, 6 2.5, 0 5" fill="#EF4444" />
        </marker>
      </defs>
      <line
        x1={fromX}
        y1={fromY - 16}
        x2={toX}
        y2={toY}
        stroke="#EF4444"
        strokeWidth={2}
        strokeDasharray="4 2"
        markerEnd={`url(#${markerId})`}
        opacity={0.7}
        style={{
          animation: 'thrombinDash 0.8s linear infinite',
        }}
      />
    </g>
  );
}

// =============================================================================
// PROGRESS DOT COMPONENT
// =============================================================================

interface ProgressDotProps {
  label: string;
  active: boolean;
  docked?: boolean;
  color: string;
}

function ProgressDot({ label, active, docked, color }: ProgressDotProps): React.ReactElement {
  const showDocked = docked !== undefined;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 10,
        background: active ? `${color}30` : 'rgba(100, 116, 139, 0.2)',
        border: `1.5px solid ${active ? color : '#475569'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? color : '#475569',
          boxShadow: active ? `0 0 8px ${color}` : 'none',
          transition: 'all 0.3s ease',
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: active ? '#FFFFFF' : '#94A3B8',
        }}
      >
        {label}
      </span>
      {showDocked && active && (
        <span
          style={{
            fontSize: 7,
            fontWeight: 500,
            color: docked ? '#4ADE80' : '#FCD34D',
            marginLeft: 2,
          }}
        >
          {docked ? '✓' : '⏳'}
        </span>
      )}
    </div>
  );
}
