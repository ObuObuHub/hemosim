// components/game/visuals/EnzymeComplex.tsx
'use client';

import { useMemo } from 'react';
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
        name: 'TENASE',
        labelColor: '#3B82F6', // Blue
        labelGradient: 'linear-gradient(135deg, #2563EB 0%, #1e40af 100%)',
        glowColor: 'rgba(59, 130, 246, 0.6)',
        equation: 'FIXa + FVIIIa → FXa',
        amplification: '×200,000',
      };
    }
    return {
      name: 'PROTHROMBINASE',
      labelColor: '#DC2626', // Red
      labelGradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
      glowColor: 'rgba(220, 38, 38, 0.6)',
      equation: 'FXa + FVa → FIIa',
      amplification: '×300,000',
    };
  }, [type]);

  // Calculate positions for enzyme and cofactor within bracket
  const enzymeOffset = { x: -30, y: 0 };
  const cofactorOffset = { x: 30, y: 0 };

  // Ca²⁺ ion positions along membrane anchor
  const calciumPositions = [
    { x: -20, y: 35 },
    { x: 0, y: 38 },
    { x: 20, y: 35 },
  ];

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
            top: -55,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px 14px',
            background: config.labelGradient,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 6,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            boxShadow: `0 4px 12px ${config.glowColor}, inset 0 1px 2px rgba(255, 255, 255, 0.2)`,
            animation: isProducing ? 'complex-pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {config.name}
        </div>
      )}

      {/* Bracket Container - groups enzyme + cofactor */}
      <div
        style={{
          position: 'relative',
          width: 140,
          height: 70,
          border: isFormed
            ? '2px solid rgba(255, 255, 255, 0.7)'
            : '2px dashed rgba(255, 255, 255, 0.3)',
          borderRadius: '12px 12px 8px 8px',
          background: isFormed
            ? 'radial-gradient(ellipse at top, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.05) 100%)'
            : 'radial-gradient(ellipse at top, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.1) 100%)',
          boxShadow: isFormed
            ? `inset 0 1px 3px rgba(255,255,255,0.25), 0 8px 20px ${config.glowColor}`
            : 'inset 0 1px 2px rgba(255,255,255,0.1)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
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
            <line
              x1={70 + enzymeOffset.x + 20}
              y1={35}
              x2={70 + cofactorOffset.x - 20}
              y2={35}
              stroke="rgba(100, 200, 255, 0.7)"
              strokeWidth={2}
              strokeDasharray={isProducing ? 'none' : '4,3'}
              style={{
                filter: 'drop-shadow(0 0 3px rgba(100, 200, 255, 0.5))',
              }}
            />
          </svg>
        )}

        {/* Cofactor Token */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${cofactorOffset.x}px), calc(-50% + ${cofactorOffset.y}px))`,
            filter: isFormed
              ? `drop-shadow(0 0 12px ${config.glowColor})`
              : 'grayscale(30%)',
            opacity: isFormed ? 1 : 0.6,
            transition: 'all 0.3s ease',
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

      {/* Reaction Equation */}
      {isFormed && (
        <div
          style={{
            position: 'absolute',
            bottom: -45,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 9,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {config.equation}
        </div>
      )}

      {/* Amplification Indicator */}
      {isFormed && amplificationFactor && (
        <div
          style={{
            position: 'absolute',
            top: -55,
            right: -70,
            padding: '3px 8px',
            background: `linear-gradient(135deg, ${config.glowColor} 0%, rgba(0,0,0,0.3) 100%)`,
            border: `1.5px solid ${config.labelColor}`,
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
            animation: isProducing ? 'amp-pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          ⚡ {amplificationFactor}
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
      `}</style>
    </div>
  );
}
