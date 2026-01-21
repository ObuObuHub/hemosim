// app/game-v2/page.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useSceneState } from '@/hooks/useSceneState';
import { SceneContainer, InitiationScene } from '@/components/game/scenes';
import type { FloatingFactor } from '@/types/game';

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;

/**
 * Scene-based coagulation cascade game
 * TEXTBOOK FIRST, GAMIFICATION SECOND
 */
export default function GamePageV2(): ReactElement {
  const {
    state,
    setScene,
    addFloatingFactor,
    removeFloatingFactor,
    updateFloatingFactors,
    removeActivationArrow,
    setObjectives,
    areAllObjectivesComplete,
  } = useSceneState();

  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Initialize scene objectives
  useEffect(() => {
    if (state.currentScene === 'initiation') {
      setObjectives([
        { id: 'dock-fx', description: 'Dock FX with TF+VIIa', isComplete: false },
        { id: 'dock-fv', description: 'Dock FV to form Prothrombinase', isComplete: false },
        { id: 'deliver-thrombin', description: 'Deliver thrombin to platelet', isComplete: false },
      ]);
    }
  }, [state.currentScene, setObjectives]);

  // Check for scene transition
  useEffect(() => {
    if (areAllObjectivesComplete()) {
      if (state.currentScene === 'initiation') {
        setTimeout(() => setScene('amplification'), 500);
      } else if (state.currentScene === 'amplification') {
        setTimeout(() => setScene('propagation'), 500);
      } else if (state.currentScene === 'propagation') {
        setTimeout(() => setScene('victory'), 500);
      }
    }
  }, [state.currentScene, areAllObjectivesComplete, setScene]);

  // Spawn floating factors for initiation
  useEffect(() => {
    if (state.currentScene !== 'initiation') return;

    const spawnFactor = (): void => {
      const factors = ['FX', 'FV', 'FII'];
      const factorId = factors[Math.floor(Math.random() * factors.length)];
      const factor: FloatingFactor = {
        id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        factorId,
        position: { x: -50, y: 50 + Math.random() * 150 },
        velocity: { x: 50 + Math.random() * 30, y: (Math.random() - 0.5) * 20 },
        isVulnerableTo: [],
      };
      addFloatingFactor(factor);
    };

    spawnFactor();
    const interval = setInterval(spawnFactor, 3000);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor]);

  // Game loop for factor movement
  useEffect(() => {
    const gameLoop = (timestamp: number): void => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      const updatedFactors = state.floatingFactors
        .map((factor) => ({
          ...factor,
          position: {
            x: factor.position.x + factor.velocity.x * deltaTime,
            y: factor.position.y + factor.velocity.y * deltaTime,
          },
        }))
        .filter((factor) => factor.position.x < GAME_WIDTH + 100);

      if (updatedFactors.length !== state.floatingFactors.length ||
          updatedFactors.some((f, i) => f.position.x !== state.floatingFactors[i]?.position.x)) {
        updateFloatingFactors(updatedFactors);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [state.floatingFactors, updateFloatingFactors]);

  // Handlers
  const handleFactorCatch = useCallback((factorId: string): void => {
    console.log('Caught factor:', factorId);
    removeFloatingFactor(factorId);
  }, [removeFloatingFactor]);

  const handleFactorDock = useCallback((_factorId: string, _complexId: string): void => {
    // Placeholder for docking logic
  }, []);

  const handleThrombinDrag = useCallback((_thrombinId: string, _targetX: number, _targetY: number): void => {
    // Placeholder for thrombin drag logic
  }, []);

  const handleArrowComplete = useCallback((arrowId: string): void => {
    removeActivationArrow(arrowId);
  }, [removeActivationArrow]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0F172A', padding: 20 }}>
      <h1 style={{ color: '#FFFFFF', marginBottom: 20, fontSize: 24, fontWeight: 600 }}>
        Coagulation Cascade
      </h1>

      <div style={{ width: GAME_WIDTH, height: GAME_HEIGHT, border: '2px solid #334155', borderRadius: 8, overflow: 'hidden', backgroundColor: '#1E293B' }}>
        <SceneContainer currentScene={state.currentScene}>
          {state.currentScene === 'initiation' && (
            <InitiationScene
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              floatingFactors={state.floatingFactors}
              dockedComplexes={state.dockedComplexes}
              activationArrows={state.activationArrows}
              onFactorCatch={handleFactorCatch}
              onFactorDock={handleFactorDock}
              onThrombinDrag={handleThrombinDrag}
              onArrowComplete={handleArrowComplete}
            />
          )}

          {state.currentScene === 'victory' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#FFFFFF' }}>
              <h2 style={{ fontSize: 48, marginBottom: 20 }}>Clot Stabilized!</h2>
              <p style={{ fontSize: 18, opacity: 0.8 }}>You successfully built the coagulation cascade.</p>
            </div>
          )}
        </SceneContainer>
      </div>

      {/* Objectives display */}
      <div style={{ marginTop: 20, padding: 16, backgroundColor: '#1E293B', borderRadius: 8, color: '#FFFFFF', width: GAME_WIDTH }}>
        <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Objectives:</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {state.objectives.map((obj) => (
            <li key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', opacity: obj.isComplete ? 0.5 : 1 }}>
              <span style={{ color: obj.isComplete ? '#22C55E' : '#64748B' }}>
                {obj.isComplete ? '\u2713' : '\u25CB'}
              </span>
              <span style={{ textDecoration: obj.isComplete ? 'line-through' : 'none' }}>
                {obj.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
