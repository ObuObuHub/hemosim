// components/game/visuals/ThrombinBurst.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { FactorTokenNew } from '../tokens/FactorTokenNew';

interface ThrombinBurstProps {
  isActive: boolean;
  centerX: number;
  centerY: number;
  onComplete?: () => void;
}

/**
 * ThrombinBurst - Dramatic visualization of the thrombin explosion
 *
 * Medical accuracy:
 * - Prothrombinase complex generates ~350 nM thrombin burst
 * - This is 1000x more than initiation phase
 * - Thrombin burst converts fibrinogen → fibrin → stable clot
 *
 * Visual: Radial explosion with multiple thrombin particles
 */
export function ThrombinBurst({
  isActive,
  centerX,
  centerY,
  onComplete,
}: ThrombinBurstProps): React.ReactElement | null {
  const [phase, setPhase] = useState<'initial' | 'explosion' | 'sustained'>('initial');

  useEffect(() => {
    if (isActive) {
      // Defer initial state to avoid cascading renders
      const timerInit = setTimeout(() => setPhase('initial'), 0);
      // Quick flash then explosion
      const timer1 = setTimeout(() => setPhase('explosion'), 100);
      const timer2 = setTimeout(() => {
        setPhase('sustained');
        onComplete?.();
      }, 1200);
      return () => {
        clearTimeout(timerInit);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isActive, onComplete]);

  // Generate burst particles in multiple rings
  const particles = useMemo(() => {
    const result: Array<{
      x: number;
      y: number;
      delay: number;
      scale: number;
      ring: number;
      angle: number;
    }> = [];

    // Deterministic scale variation (avoids Math.random during render)
    const deterministicScale = (idx: number, base: number): number =>
      base + Math.sin(idx * 4.3) * 0.1;

    // Inner ring - 8 particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      result.push({
        x: Math.cos(angle) * 40,
        y: Math.sin(angle) * 25,
        delay: i * 0.03,
        scale: deterministicScale(i, 0.7),
        ring: 0,
        angle: angle * (180 / Math.PI),
      });
    }

    // Outer ring - 12 particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI + Math.PI / 12;
      result.push({
        x: Math.cos(angle) * 70,
        y: Math.sin(angle) * 45,
        delay: 0.15 + i * 0.025,
        scale: deterministicScale(i + 8, 0.5),
        ring: 1,
        angle: angle * (180 / Math.PI),
      });
    }

    return result;
  }, []);

  // Generate shockwave rings
  const shockwaves = useMemo(() => [
    { delay: 0, maxRadius: 60, duration: 0.6 },
    { delay: 0.1, maxRadius: 90, duration: 0.7 },
    { delay: 0.2, maxRadius: 120, duration: 0.8 },
  ], []);

  // Generate debris sparks with deterministic values
  const sparks = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * 2 * Math.PI + Math.sin(i * 3.7) * 0.3,
      distance: 30 + 40 + Math.sin(i * 2.3) * 40,
      delay: (i % 10) * 0.03,
      size: 2 + Math.sin(i * 5.1) * 1,
    }));
  }, []);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: centerY,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Initial flash */}
      {phase === 'initial' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFFFFF 0%, #FBBF24 50%, #EF4444 100%)',
            boxShadow: '0 0 60px 30px rgba(251, 191, 36, 0.8)',
            animation: 'initialFlash 0.1s ease-out forwards',
          }}
        />
      )}

      {/* Shockwave rings */}
      {(phase === 'explosion' || phase === 'sustained') && (
        <svg
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            height: 200,
            overflow: 'visible',
          }}
        >
          <defs>
            <radialGradient id="burst-center-gradient">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </radialGradient>
          </defs>

          {/* Shockwave rings */}
          {shockwaves.map((wave, i) => (
            <ellipse
              key={`wave-${i}`}
              cx={150}
              cy={100}
              rx={5}
              ry={3}
              fill="none"
              stroke="#FBBF24"
              strokeWidth={3 - i * 0.5}
              opacity={0.7}
              style={{
                animation: `shockwaveExpand ${wave.duration}s ease-out ${wave.delay}s forwards`,
                '--max-rx': `${wave.maxRadius}px`,
                '--max-ry': `${wave.maxRadius * 0.6}px`,
              } as React.CSSProperties}
            />
          ))}

          {/* Debris sparks */}
          {sparks.map((spark, i) => (
            <circle
              key={`spark-${i}`}
              cx={150}
              cy={100}
              r={spark.size}
              fill="#FBBF24"
              style={{
                animation: `sparkFly 0.8s ease-out ${spark.delay}s forwards`,
                '--end-x': `${Math.cos(spark.angle) * spark.distance}px`,
                '--end-y': `${Math.sin(spark.angle) * spark.distance * 0.6}px`,
              } as React.CSSProperties}
            />
          ))}

          {/* Central explosion glow */}
          <ellipse
            cx={150}
            cy={100}
            rx={30}
            ry={20}
            fill="url(#burst-center-gradient)"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))',
              animation: 'centralGlow 1s ease-out forwards',
            }}
          />
        </svg>
      )}

      {/* Thrombin particles radiating outward */}
      {(phase === 'explosion' || phase === 'sustained') && (
        <div
          style={{
            position: 'relative',
            width: 200,
            height: 150,
          }}
        >
          {particles.map((particle, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                animation: `particleBurst 0.6s ease-out ${particle.delay}s forwards`,
                '--end-x': `${particle.x}px`,
                '--end-y': `${particle.y}px`,
                '--scale': particle.scale,
              } as React.CSSProperties}
            >
              <FactorTokenNew
                factorId="FIIa"
                isActive
                enableHover={false}
                style={{
                  transform: `scale(${particle.scale})`,
                  filter: 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.8))',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Concentration indicator */}
      {phase === 'sustained' && (
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(127, 29, 29, 0.95) 100%)',
            borderRadius: 10,
            border: '2px solid #EF4444',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
            animation: 'labelAppear 0.3s ease-out',
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#FBBF24', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
            BURST DE TROMBINĂ
          </div>
          <div
            style={{
              marginTop: 4,
              padding: '2px 10px',
              background: 'rgba(239, 68, 68, 0.4)',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'monospace',
            }}
          >
            ~350 nM
          </div>
          <div style={{ color: '#FCA5A5', fontSize: 9, marginTop: 4 }}>
            ×300,000 amplificare
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes initialFlash {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
          }
          @keyframes shockwaveExpand {
            0% {
              rx: 5;
              ry: 3;
              opacity: 0.8;
              stroke-width: 4;
            }
            100% {
              rx: var(--max-rx);
              ry: var(--max-ry);
              opacity: 0;
              stroke-width: 1;
            }
          }
          @keyframes sparkFly {
            0% {
              transform: translate(0, 0);
              opacity: 1;
            }
            100% {
              transform: translate(var(--end-x), var(--end-y));
              opacity: 0;
            }
          }
          @keyframes centralGlow {
            0% {
              rx: 5;
              ry: 3;
              opacity: 1;
            }
            50% {
              rx: 40;
              ry: 25;
              opacity: 0.8;
            }
            100% {
              rx: 25;
              ry: 15;
              opacity: 0.6;
            }
          }
          @keyframes particleBurst {
            0% {
              transform: translate(-50%, -50%) translate(0, 0) scale(0.2);
              opacity: 0;
            }
            40% {
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) translate(var(--end-x), var(--end-y)) scale(var(--scale));
              opacity: 1;
            }
          }
          @keyframes labelAppear {
            0% {
              transform: translateX(-50%) translateY(10px);
              opacity: 0;
            }
            100% {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
