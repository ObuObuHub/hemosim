// components/game/visuals/EnzymeComplex.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { FactorTokenNew } from '../tokens/FactorTokenNew';

type ComplexType = 'tenase' | 'prothrombinase';

interface EnzymeComplexProps {
  type: ComplexType;
  isFormed: boolean;
  isProducing?: boolean;
  showSubstrate?: boolean;
  showProduct?: boolean;
  enzymeFactorId: string;
  cofactorFactorId: string;
  substrateId?: string;
  productId?: string;
  amplificationFactor?: string;
  position: { x: number; y: number };
}

/**
 * EnzymeComplex - Visualizes Tenase or Prothrombinase complex
 *
 * MEDICAL ACCURACY (from reference):
 * - Tenase: FIXa (enzyme) + FVIIIa (cofactor) → activates FX → FXa
 *   Amplification: ~200,000× catalytic enhancement
 * - Prothrombinase: FXa (enzyme) + FVa (cofactor) → FII → FIIa
 *   Amplification: ~300,000× (generates ~350 nM thrombin burst)
 *
 * Both require:
 * - Ca²⁺ ions for Gla-domain membrane binding
 * - Phosphatidylserine-exposed membrane surface
 */
export function EnzymeComplex({
  type,
  isFormed,
  isProducing = false,
  showSubstrate = false,
  showProduct = false,
  enzymeFactorId,
  cofactorFactorId,
  substrateId,
  productId,
  amplificationFactor,
  position,
}: EnzymeComplexProps): React.ReactElement {
  const config = useMemo(() => {
    if (type === 'tenase') {
      return {
        name: 'TENASE INTRINSECĂ',
        subtitle: '(Xase)',
        labelColor: '#06B6D4', // Cyan (matches FIXa color)
        labelGradient: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
        glowColor: 'rgba(6, 182, 212, 0.6)',
        equation: 'FX → FXa',
        substrateId: 'FX',
        productId: 'FXa',
        amplification: '×200,000',
      };
    }
    return {
      name: 'PROTROMBINAZĂ',
      subtitle: '',
      labelColor: '#DC2626', // Red (matches thrombin)
      labelGradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
      glowColor: 'rgba(220, 38, 38, 0.6)',
      equation: 'FII → FIIa',
      substrateId: 'FII',
      productId: 'FIIa',
      amplification: '×300,000',
    };
  }, [type]);

  // Calculate positions for enzyme and cofactor within bracket
  // MEDICAL ACCURACY: Cofactor is larger and positioned more prominently
  // Reference images show cofactor (Va, VIIIa) wrapping around enzyme (Xa, IXa)
  const enzymeOffset = { x: -28, y: 5 };   // Enzyme slightly lower
  const cofactorOffset = { x: 28, y: -5 }; // Cofactor slightly higher
  const cofactorScale = 1.15; // Cofactor is visually larger (matches textbook)

  // Ca²⁺ ion positions along membrane anchor
  const calciumPositions = [
    { x: -20, y: 35 },
    { x: 0, y: 38 },
    { x: 20, y: 35 },
  ];

  // Enhanced catalytic cycle animation state
  // 0: Substrate approaching, 1: Binding, 2: Catalysis/Transition, 3: Product release
  const [cyclePhase, setCyclePhase] = useState(0);
  const [substratePosition, setSubstratePosition] = useState({ x: -50, y: 0 });

  useEffect(() => {
    if (isProducing) {
      const interval = setInterval(() => {
        setCyclePhase((prev) => {
          const next = (prev + 1) % 5;
          // Update substrate position based on phase
          switch (next) {
            case 0: // Substrate approaches from left
              setSubstratePosition({ x: -40, y: 0 });
              break;
            case 1: // Substrate enters binding pocket
              setSubstratePosition({ x: -15, y: 0 });
              break;
            case 2: // Substrate bound in active site
              setSubstratePosition({ x: 0, y: 0 });
              break;
            case 3: // Catalysis - conformational change
              setSubstratePosition({ x: 0, y: 0 });
              break;
            case 4: // Product exits to right
              setSubstratePosition({ x: 30, y: 0 });
              break;
          }
          return next;
        });
      }, 350);
      return () => clearInterval(interval);
    }
  }, [isProducing]);

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        // CSS custom property for dynamic glow color in animations
        '--glow-color': config.glowColor,
      } as React.CSSProperties}
    >
      {/* Complex Label - appears when formed */}
      {isFormed && (
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 14px',
            background: config.labelGradient,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 6,
            color: '#FFFFFF',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            boxShadow: `0 4px 12px ${config.glowColor}, inset 0 1px 2px rgba(255, 255, 255, 0.2)`,
            animation: isProducing ? 'complex-pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
            {config.name}
          </div>
          {config.subtitle && (
            <div style={{ fontSize: 8, opacity: 0.8, marginTop: 1 }}>
              {config.subtitle}
            </div>
          )}
        </div>
      )}

      {/* Bracket Container - groups enzyme + cofactor */}
      <div
        style={{
          position: 'relative',
          width: 140,
          height: 70,
          border: isFormed
            ? `2px solid ${isProducing ? config.labelColor : 'rgba(255, 255, 255, 0.7)'}`
            : '2px dashed rgba(255, 255, 255, 0.3)',
          borderRadius: '12px 12px 8px 8px',
          background: isFormed
            ? `radial-gradient(ellipse at top, ${isProducing ? config.glowColor.replace('0.6', '0.2') : 'rgba(255,255,255,0.12)'} 0%, rgba(0,0,0,0.05) 100%)`
            : 'radial-gradient(ellipse at top, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.1) 100%)',
          boxShadow: isFormed
            ? isProducing
              ? `inset 0 1px 3px rgba(255,255,255,0.25), 0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor.replace('0.6', '0.3')}`
              : `inset 0 1px 3px rgba(255,255,255,0.25), 0 8px 20px ${config.glowColor}`
            : 'inset 0 1px 2px rgba(255,255,255,0.1)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          animation: isProducing ? 'complexBreathing 1.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Pulsing ring effect when producing */}
        {isProducing && (
          <>
            <div
              style={{
                position: 'absolute',
                top: -5,
                left: -5,
                right: -5,
                bottom: -5,
                borderRadius: '15px 15px 12px 12px',
                border: `2px solid ${config.labelColor}`,
                opacity: 0.5,
                animation: 'pulseRing 1.5s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: '18px 18px 15px 15px',
                border: `1px solid ${config.labelColor}`,
                opacity: 0.3,
                animation: 'pulseRing 1.5s ease-out infinite 0.3s',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
        {/* Enzyme Token */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${enzymeOffset.x}px), calc(-50% + ${enzymeOffset.y}px))`,
            filter: isFormed
              ? `drop-shadow(0 0 12px ${config.glowColor})`
              : 'grayscale(30%)',
            opacity: isFormed ? 1 : 0.5,
            transition: 'all 0.3s ease',
          }}
        >
          <FactorTokenNew factorId={enzymeFactorId} isActive={isFormed} />
        </div>

        {/* Connection Bond SVG */}
        {isFormed && (
          <svg
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {/* Enzyme-Cofactor bond */}
            <line
              x1={70 + enzymeOffset.x + 20}
              y1={35}
              x2={70 + cofactorOffset.x - 20}
              y2={35}
              stroke={isProducing ? config.labelColor : 'rgba(100, 200, 255, 0.7)'}
              strokeWidth={isProducing ? 3 : 2}
              strokeDasharray={isProducing ? 'none' : '4,3'}
              style={{
                filter: `drop-shadow(0 0 ${isProducing ? '6' : '3'}px ${isProducing ? config.glowColor : 'rgba(100, 200, 255, 0.5)'})`,
                animation: isProducing ? 'catalyticGlow 0.8s ease-in-out infinite' : 'none',
              }}
            />

            {/* Enhanced Catalytic Cycle Visualization */}
            {isProducing && (
              <>
                {/* Active site pocket outline */}
                <ellipse
                  cx={70}
                  cy={35}
                  rx={14}
                  ry={10}
                  fill="none"
                  stroke={config.labelColor}
                  strokeWidth={1.5}
                  strokeDasharray={cyclePhase === 2 || cyclePhase === 3 ? 'none' : '4,2'}
                  opacity={0.6}
                  style={{
                    animation: cyclePhase === 2 || cyclePhase === 3 ? 'activeSitePulse 0.4s ease-in-out infinite' : 'none',
                  }}
                />

                {/* Catalytic energy burst during transition state */}
                {cyclePhase === 3 && (
                  <>
                    <circle
                      cx={70}
                      cy={35}
                      r={20}
                      fill="none"
                      stroke={config.labelColor}
                      strokeWidth={2}
                      opacity={0.4}
                      style={{ animation: 'catalyticBurst 0.35s ease-out forwards' }}
                    />
                    <circle
                      cx={70}
                      cy={35}
                      r={12}
                      fill="none"
                      stroke={config.labelColor}
                      strokeWidth={1.5}
                      opacity={0.6}
                      style={{ animation: 'catalyticBurst 0.35s ease-out 0.1s forwards' }}
                    />
                  </>
                )}

                {/* Substrate/Product token with position animation */}
                <g
                  transform={`translate(${70 + substratePosition.x}, ${35 + substratePosition.y})`}
                  style={{
                    transition: 'transform 0.3s ease-in-out',
                  }}
                >
                  {/* Substrate approaching (phases 0-1) */}
                  {cyclePhase <= 1 && (
                    <>
                      <circle
                        r={9}
                        fill={type === 'tenase' ? '#15803D' : '#7C2D12'}
                        stroke={type === 'tenase' ? '#22C55E' : '#DC2626'}
                        strokeWidth={1.5}
                        style={{
                          filter: `drop-shadow(0 0 4px ${type === 'tenase' ? 'rgba(21, 128, 61, 0.6)' : 'rgba(124, 45, 18, 0.6)'})`,
                        }}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fontSize={7}
                        fontWeight={700}
                        fill="#FFFFFF"
                      >
                        {type === 'tenase' ? 'X' : 'II'}
                      </text>
                    </>
                  )}

                  {/* Bound substrate (phase 2) - conformational change */}
                  {cyclePhase === 2 && (
                    <>
                      <ellipse
                        rx={10}
                        ry={8}
                        fill={type === 'tenase' ? '#15803D' : '#7C2D12'}
                        stroke={config.labelColor}
                        strokeWidth={2}
                        style={{
                          animation: 'substrateConform 0.35s ease-in-out infinite',
                          filter: `drop-shadow(0 0 6px ${config.glowColor})`,
                        }}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fontSize={7}
                        fontWeight={700}
                        fill="#FFFFFF"
                      >
                        {type === 'tenase' ? 'X' : 'II'}
                      </text>
                      {/* Cleavage site indicator */}
                      <line
                        x1={-6}
                        y1={0}
                        x2={6}
                        y2={0}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        strokeDasharray="2,2"
                        opacity={0.8}
                        style={{ animation: 'cleavagePulse 0.3s ease-in-out infinite' }}
                      />
                    </>
                  )}

                  {/* Transition state (phase 3) - cleavage happening */}
                  {cyclePhase === 3 && (
                    <>
                      <ellipse
                        rx={12}
                        ry={6}
                        fill={type === 'tenase' ? '#4ADE80' : '#EF4444'}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        style={{
                          filter: `drop-shadow(0 0 10px ${config.glowColor})`,
                        }}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fontSize={7}
                        fontWeight={700}
                        fill="#FFFFFF"
                      >
                        {type === 'tenase' ? '✂️Xa' : '✂️FIIa'}
                      </text>
                    </>
                  )}

                  {/* Product release (phase 4) */}
                  {cyclePhase === 4 && (
                    <>
                      <circle
                        r={9}
                        fill={type === 'tenase' ? '#4ADE80' : '#EF4444'}
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                        style={{
                          animation: 'productExit 0.35s ease-out forwards',
                          filter: `drop-shadow(0 0 8px ${config.glowColor})`,
                        }}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fontSize={7}
                        fontWeight={700}
                        fill="#FFFFFF"
                      >
                        {type === 'tenase' ? 'Xa' : 'FIIa'}
                      </text>
                    </>
                  )}
                </g>

                {/* Substrate entry arrow */}
                {cyclePhase === 0 && (
                  <g opacity={0.7}>
                    <line x1={25} y1={35} x2={40} y2={35} stroke={type === 'tenase' ? '#22C55E' : '#DC2626'} strokeWidth={2} />
                    <polygon points="40,32 46,35 40,38" fill={type === 'tenase' ? '#22C55E' : '#DC2626'} />
                  </g>
                )}

                {/* Product exit arrow */}
                {cyclePhase === 4 && (
                  <g opacity={0.7}>
                    <line x1={100} y1={35} x2={115} y2={35} stroke={config.labelColor} strokeWidth={2} />
                    <polygon points="115,32 121,35 115,38" fill={config.labelColor} />
                  </g>
                )}
              </>
            )}
          </svg>
        )}

        {/* Cofactor Token - LARGER than enzyme (textbook accuracy) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${cofactorOffset.x}px), calc(-50% + ${cofactorOffset.y}px)) scale(${cofactorScale})`,
            filter: isFormed
              ? `drop-shadow(0 0 12px ${config.glowColor})`
              : 'grayscale(30%)',
            opacity: isFormed ? 1 : 0.6,
            transition: 'all 0.3s ease',
            zIndex: 2, // Cofactor appears "above" enzyme visually
          }}
        >
          <FactorTokenNew factorId={cofactorFactorId} isActive={isFormed} />
        </div>

        {/* Membrane Anchor Lines + Ca²⁺ ions */}
        {isFormed && (
          <svg
            style={{
              position: 'absolute',
              bottom: -25,
              left: 0,
              width: '100%',
              height: 30,
              pointerEvents: 'none',
            }}
          >
            {/* Gla-domain anchor lines */}
            <line
              x1={50}
              y1={0}
              x2={40}
              y2={25}
              stroke="rgba(150, 200, 255, 0.4)"
              strokeWidth={1.5}
              strokeDasharray="3,2"
            />
            <line
              x1={70}
              y1={0}
              x2={70}
              y2={25}
              stroke="rgba(150, 200, 255, 0.4)"
              strokeWidth={1.5}
              strokeDasharray="3,2"
            />
            <line
              x1={90}
              y1={0}
              x2={100}
              y2={25}
              stroke="rgba(150, 200, 255, 0.4)"
              strokeWidth={1.5}
              strokeDasharray="3,2"
            />
          </svg>
        )}
      </div>

      {/* Ca²⁺ Ion Visualization */}
      {isFormed && (
        <div style={{ position: 'absolute', top: 60, width: '100%', height: 20 }}>
          {calciumPositions.map((pos, i) => (
            <div
              key={`ca-${i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${pos.x}px)`,
                top: pos.y - 35,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#87CEEB',
                boxShadow: '0 0 6px rgba(135, 206, 235, 0.9)',
                animation: `float-ca 2.5s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
              title="Ca²⁺"
            />
          ))}
        </div>
      )}

      {/* Reaction Equation - shows substrate → product conversion */}
      {isFormed && (
        <div
          style={{
            position: 'absolute',
            bottom: -48,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(15, 23, 42, 0.8)',
            borderRadius: 4,
            border: `1px solid ${config.labelColor}40`,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: type === 'tenase' ? '#22C55E' : '#DC2626',
            }}
          >
            {config.substrateId}
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>→</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: type === 'tenase' ? '#4ADE80' : '#EF4444',
            }}
          >
            {config.productId}
          </span>
        </div>
      )}

      {/* Amplification Indicator with Educational Content */}
      {isFormed && amplificationFactor && (
        <div
          style={{
            position: 'absolute',
            top: -55,
            right: -85,
            padding: '4px 10px',
            background: `linear-gradient(135deg, ${config.glowColor} 0%, rgba(0,0,0,0.3) 100%)`,
            border: `1.5px solid ${config.labelColor}`,
            borderRadius: 6,
            whiteSpace: 'nowrap',
            animation: isProducing ? 'amp-pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>
            ⚡ {amplificationFactor}
          </div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            eficiență catalitică
          </div>
        </div>
      )}

      {/* Educational: Catalytic Mechanism Explanation */}
      {isFormed && isProducing && (
        <div
          style={{
            position: 'absolute',
            bottom: -75,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 10px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1px solid ${config.labelColor}44`,
            borderRadius: 6,
            maxWidth: 160,
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: 8, lineHeight: 1.3 }}>
            Cofactorul ({cofactorFactorId}) poziționează substratul în situl activ al enzimei ({enzymeFactorId})
          </div>
          <div style={{ color: config.labelColor, fontSize: 9, fontWeight: 600, marginTop: 4 }}>
            Gla-domeniu + Ca²⁺ → ancorat pe PS
          </div>
        </div>
      )}

      {/* Substrate Entry Zone (ghost) */}
      {showSubstrate && substrateId && !showProduct && (
        <div
          style={{
            position: 'absolute',
            left: -60,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.4,
            filter: 'grayscale(50%)',
          }}
        >
          <FactorTokenNew factorId={substrateId} />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: -20,
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            →
          </div>
        </div>
      )}

      {/* Product Exit Zone */}
      {showProduct && productId && (
        <div
          style={{
            position: 'absolute',
            right: -60,
            top: '50%',
            transform: 'translateY(-50%)',
            filter: `drop-shadow(0 0 15px ${config.glowColor})`,
            animation: 'product-emerge 0.6s ease-out',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: -20,
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: config.labelColor,
            }}
          >
            →
          </div>
          <FactorTokenNew factorId={productId} isActive />
        </div>
      )}

      {/* CSS Animations - using CSS custom property var(--glow-color) */}
      <style jsx>{`
        @keyframes complex-pulse {
          0%, 100% {
            box-shadow: 0 4px 12px var(--glow-color);
          }
          50% {
            box-shadow: 0 4px 20px var(--glow-color), 0 0 30px var(--glow-color);
          }
        }
        @keyframes float-ca {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-4px) scale(1.15);
            opacity: 1;
          }
        }
        @keyframes amp-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        @keyframes product-emerge {
          0% {
            transform: translateY(-50%) translateX(-30px) scale(0.5);
            opacity: 0;
          }
          60% {
            transform: translateY(-50%) translateX(5px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(-50%) translateX(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes complexBreathing {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.15);
            opacity: 0;
          }
        }
        @keyframes catalyticGlow {
          0%, 100% {
            filter: brightness(1) saturate(1);
          }
          50% {
            filter: brightness(1.3) saturate(1.2);
          }
        }
        @keyframes activeSitePulse {
          0%, 100% {
            stroke-width: 1.5;
            opacity: 0.6;
          }
          50% {
            stroke-width: 2.5;
            opacity: 0.9;
          }
        }
        @keyframes substrateConform {
          0%, 100% {
            rx: 10;
            ry: 8;
          }
          50% {
            rx: 8;
            ry: 10;
          }
        }
        @keyframes cleavagePulse {
          0%, 100% {
            opacity: 0.5;
            stroke-dashoffset: 0;
          }
          50% {
            opacity: 1;
            stroke-dashoffset: 4;
          }
        }
        @keyframes catalyticBurst {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes productExit {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
