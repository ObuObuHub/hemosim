/**
 * SeekDockExplorer - Main educational component for Seek & Dock model
 *
 * Implements the Directed Mechanical Assembly visualization of the
 * Hoffman-Monroe cellular coagulation model.
 *
 * Features:
 * - Two modes: AUTO (demonstration) and MANUAL (interactive learning)
 * - Zone A (TF Cell) and Zone B (Platelet) visualization
 * - Migration corridor for IXa and IIa
 * - Drag-and-drop snap-to-dock mechanics
 * - Phase gating state machine
 */
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSeekDockState } from '@/hooks/useSeekDockState';
import { SeekDockCanvas } from './SeekDockCanvas';
import { AgentKind, Position } from '@/types/seek-dock';
import { ModeToggle } from '@/components/game/ModeToggle';

interface SeekDockExplorerProps {
  className?: string;
}

export function SeekDockExplorer({ className = '' }: SeekDockExplorerProps): React.ReactElement {
  const {
    state,
    socketStates,
    setMode,
    reset,
    spawnFromTray,
    moveAgent,
    snapAgent,
    tick,
  } = useSeekDockState();

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const draggingAgentRef = useRef<string | null>(null);

  // Animation loop for AUTO mode
  useEffect(() => {
    if (state.mode !== 'AUTO') return;

    const animate = (time: number): void => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }

      const deltaMs = time - lastTimeRef.current;
      lastTimeRef.current = time;

      tick(deltaMs);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [state.mode, tick]);

  // Handle agent drag start
  const handleAgentDragStart = useCallback((agentId: string, _position: Position) => {
    draggingAgentRef.current = agentId;
  }, []);

  // Handle agent drag move
  const handleAgentDragMove = useCallback((agentId: string, position: Position) => {
    moveAgent(agentId, position);
  }, [moveAgent]);

  // Handle agent drag end (snap attempt)
  const handleAgentDragEnd = useCallback((agentId: string, position: Position) => {
    snapAgent(agentId, position);
    draggingAgentRef.current = null;
  }, [snapAgent]);

  // Handle tray agent click (spawn new agent)
  const handleTrayAgentClick = useCallback((kind: AgentKind) => {
    if (state.mode === 'MANUAL') {
      spawnFromTray(kind);
    }
  }, [state.mode, spawnFromTray]);

  // Handle port click (for manual docking)
  const handlePortClick = useCallback((portId: string) => {
    // In AUTO mode, this is handled automatically
    if (state.mode === 'AUTO') return;

    // Find if we have a selected agent that can dock here
    // For now, just log the click
    console.log('Port clicked:', portId);
  }, [state.mode]);

  // Mode change handler
  const handleModeChange = useCallback((mode: 'manual' | 'auto') => {
    setMode(mode === 'manual' ? 'MANUAL' : 'AUTO');
  }, [setMode]);

  // Get current phase text
  const getPhaseText = (): string => {
    switch (state.phase) {
      case 'idle':
        return 'Gata de start - trageți factorii din tăviță';
      case 'initiation':
        return 'Faza 1: Inițiere - TF-VIIa activează factorii';
      case 'amplification':
        return 'Faza 2: Amplificare - Trombina activează trombocitul';
      case 'propagation':
        return 'Faza 3: Propagare - Formarea complexelor enzimice';
      case 'clotting':
        return 'Faza 4: Coagulare - Formarea fibrinei';
      case 'complete':
        return 'Cheag stabil format!';
      default:
        return '';
    }
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0F172A',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          background: 'rgba(15, 23, 42, 0.9)',
          zIndex: 100,
        }}
      >
        {/* Mode Toggle */}
        <ModeToggle
          mode={state.mode === 'AUTO' ? 'auto' : 'manual'}
          onModeChange={handleModeChange}
          disabled={state.phase === 'complete'}
        />

        {/* Phase indicator */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '8px 20px',
              background: state.phase === 'complete'
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(59, 130, 246, 0.2)',
              border: `1px solid ${state.phase === 'complete' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
              borderRadius: 8,
            }}
          >
            <span
              style={{
                color: state.phase === 'complete' ? '#4ADE80' : '#60A5FA',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {getPhaseText()}
            </span>
          </div>
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '6px 14px',
            background: 'rgba(100, 116, 139, 0.3)',
            border: '1px solid rgba(100, 116, 139, 0.5)',
            borderRadius: 6,
            color: '#E2E8F0',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(100, 116, 139, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(100, 116, 139, 0.3)';
          }}
        >
          Repornește
        </button>
      </div>

      {/* Main Canvas */}
      <div
        key={`canvas-${state.resetKey}`}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <SeekDockCanvas
          state={state}
          socketStates={socketStates}
          onAgentDragStart={handleAgentDragStart}
          onAgentDragMove={handleAgentDragMove}
          onAgentDragEnd={handleAgentDragEnd}
          onPortClick={handlePortClick}
          onTrayAgentClick={handleTrayAgentClick}
        />
      </div>

      {/* Instructions panel (MANUAL mode only) */}
      {state.mode === 'MANUAL' && state.phase !== 'complete' && (
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: 8,
            maxWidth: 400,
            textAlign: 'center',
            zIndex: 50,
          }}
        >
          <p
            style={{
              color: '#E2E8F0',
              fontSize: 12,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {state.phase === 'idle' && (
              <>
                <strong>Instrucțiuni:</strong> Trageți factorii din tăvița de circulație
                și plasați-i în socketurile corespunzătoare.
                <br />
                Începeți cu <span style={{ color: '#60A5FA' }}>FIX</span> sau{' '}
                <span style={{ color: '#60A5FA' }}>FX</span> în Zona TF-VIIa.
              </>
            )}
            {state.phase === 'initiation' && (
              <>
                <strong>Faza 1:</strong> Completați activarea în Zona TF.
                <br />
                IXa și IIa vor migra către trombocit după producere.
              </>
            )}
            {state.phase === 'amplification' && (
              <>
                <strong>Faza 2:</strong> Trombina activează trombocitul.
                <br />
                Plasați cofactorii (V, VIII) pentru activare.
              </>
            )}
            {state.phase === 'propagation' && (
              <>
                <strong>Faza 3:</strong> Formați complexele Tenase și Protrombinază.
                <br />
                Aceasta va genera explozia de trombină!
              </>
            )}
            {state.phase === 'clotting' && (
              <>
                <strong>Faza 4:</strong> Trombina convertește fibrinogenul în fibrină.
                <br />
                Plasați fibrinogenul pentru a forma cheagul.
              </>
            )}
          </p>
        </div>
      )}

      {/* Victory overlay */}
      {state.phase === 'complete' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.85)',
            zIndex: 200,
          }}
        >
          <div
            style={{
              padding: '40px 60px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid rgba(34, 197, 94, 0.5)',
              borderRadius: 16,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
              }}
            >
              ✓
            </div>
            <h2
              style={{
                color: '#4ADE80',
                fontSize: 24,
                fontWeight: 700,
                margin: '0 0 12px 0',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              CHEAG STABIL FORMAT
            </h2>
            <p
              style={{
                color: '#94A3B8',
                fontSize: 14,
                margin: '0 0 24px 0',
                maxWidth: 300,
              }}
            >
              Cascada de coagulare este completă.
              Fibrina crosslinkată formează un cheag stabil.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: 6,
                  color: '#60A5FA',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                ~350 nM Trombină
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  borderRadius: 6,
                  color: '#A78BFA',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                ×300.000 Amplificare
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 24,
                padding: '10px 24px',
                background: 'rgba(34, 197, 94, 0.3)',
                border: '1px solid rgba(34, 197, 94, 0.5)',
                borderRadius: 8,
                color: '#4ADE80',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
              }}
            >
              Explorează din nou
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
