/**
 * SeekDockCanvas - Main visualization component for Seek & Dock
 *
 * Renders the two-zone coagulation cascade with:
 * - Zone A (TF Cell) on the left
 * - Zone B (Platelet) on the right
 * - Migration corridor in between
 * - Circulation tray at bottom
 */
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { AgentKind, SeekDockState, SocketState, Position } from '@/types/seek-dock';
import {
  ALL_SOCKETS,
  ZONE_A_BOUNDS,
  ZONE_B_BOUNDS,
  MIGRATION_CORRIDOR,
  TRAY_BOUNDS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/engine/seek-dock';
import { SocketRenderer } from './SocketRenderer';
import { AgentToken, TrayToken } from './AgentToken';
import { MigrationCorridor } from './MigrationCorridor';
import { ZoneBackground } from './ZoneBackground';

interface SeekDockCanvasProps {
  state: SeekDockState;
  socketStates: SocketState[];
  onAgentDragStart?: (agentId: string, position: Position) => void;
  onAgentDragMove?: (agentId: string, position: Position) => void;
  onAgentDragEnd?: (agentId: string, position: Position) => void;
  onPortClick?: (portId: string) => void;
  onTrayAgentClick?: (kind: AgentKind) => void;
  className?: string;
}

/**
 * Tray agents available for placement
 */
const TRAY_AGENTS: AgentKind[] = ['IX', 'X', 'II', 'V', 'VIII', 'XI', 'Fibrinogen'];

export function SeekDockCanvas({
  state,
  socketStates,
  onAgentDragStart,
  onAgentDragMove,
  onAgentDragEnd,
  onPortClick,
  onTrayAgentClick,
  className = '',
}: SeekDockCanvasProps): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [draggingAgentId, setDraggingAgentId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<Position | null>(null);

  // Measure container for responsive scaling
  useEffect(() => {
    const updateSize = (): void => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate scale to fit canvas in container
  const scale = containerSize.width > 0 && containerSize.height > 0
    ? Math.min(
        containerSize.width / (CANVAS_WIDTH + 100), // Extra for tray
        containerSize.height / (CANVAS_HEIGHT + 100)
      )
    : 1;

  // Convert screen coordinates to SVG coordinates
  const screenToSvg = useCallback((screenX: number, screenY: number): Position => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();
    const x = (screenX - rect.left) / scale;
    const y = (screenY - rect.top) / scale;
    return { x, y };
  }, [scale]);

  // Handle mouse/touch drag
  const handleDragStart = useCallback((agentId: string, e: React.MouseEvent | React.TouchEvent): void => {
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = screenToSvg(clientX, clientY);

    setDraggingAgentId(agentId);
    setDragPosition(pos);
    onAgentDragStart?.(agentId, pos);
  }, [screenToSvg, onAgentDragStart]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent): void => {
    if (!draggingAgentId) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = screenToSvg(clientX, clientY);

    setDragPosition(pos);
    onAgentDragMove?.(draggingAgentId, pos);
  }, [draggingAgentId, screenToSvg, onAgentDragMove]);

  const handleDragEnd = useCallback((_e: MouseEvent | TouchEvent): void => {
    if (!draggingAgentId || !dragPosition) return;

    onAgentDragEnd?.(draggingAgentId, dragPosition);
    setDraggingAgentId(null);
    setDragPosition(null);
  }, [draggingAgentId, dragPosition, onAgentDragEnd]);

  // Attach global drag listeners
  useEffect(() => {
    if (draggingAgentId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggingAgentId, handleDragMove, handleDragEnd]);

  // Get socket state by ID
  const getSocketState = (socketId: string): SocketState => {
    return socketStates.find(s => s.socketId === socketId) ?? {
      socketId,
      isAssembled: false,
      requiredPortsFilled: 0,
      totalRequiredPorts: 0,
      isEnabled: false,
      enabledReason: 'Unknown',
      hasProducedOutput: false,
      outputAgentIds: [],
    };
  };

  // Calculate tray positions
  const trayStartX = 80;
  const traySpacing = 110;
  const trayY = CANVAS_HEIGHT + 50;

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT + 100}`}
        style={{
          width: '100%',
          height: '100%',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradients for zones */}
          <linearGradient id="zoneAGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
          </linearGradient>

          <linearGradient id="zoneBGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.1)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
          </linearGradient>

          <linearGradient id="trayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(30, 41, 59, 0.9)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0.95)" />
          </linearGradient>

          {/* Membrane pattern */}
          <pattern id="membranePattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <circle cx="10" cy="10" r="2" fill="rgba(255, 255, 255, 0.05)" />
          </pattern>
        </defs>

        {/* Zone backgrounds */}
        <ZoneBackground
          zone="ZoneA"
          bounds={ZONE_A_BOUNDS}
          label="CELULĂ TF"
          sublabel="Faza de Inițiere"
          isActive={state.phase === 'initiation'}
        />

        <ZoneBackground
          zone="ZoneB"
          bounds={ZONE_B_BOUNDS}
          label="TROMBOCIT"
          sublabel={
            state.phase === 'amplification'
              ? 'Faza de Amplificare'
              : state.phase === 'propagation'
              ? 'Faza de Propagare'
              : state.phase === 'clotting'
              ? 'Formarea Fibrinei'
              : 'Inactiv'
          }
          isActive={state.plateletActivated}
        />

        {/* Migration corridor */}
        <MigrationCorridor
          bounds={MIGRATION_CORRIDOR}
          activeMigrators={state.agents.filter(a => a.state === 'MIGRATING')}
        />

        {/* Sockets */}
        {ALL_SOCKETS.map(socket => (
          <SocketRenderer
            key={socket.socketId}
            socket={socket}
            socketState={getSocketState(socket.socketId)}
            onPortClick={onPortClick}
            scale={1}
          />
        ))}

        {/* Agents (non-dragging) */}
        {state.agents
          .filter(a => a.id !== draggingAgentId && a.state !== 'CONSUMED')
          .map(agent => (
            <AgentToken
              key={agent.id}
              agent={agent}
              onMouseDown={(e) => handleDragStart(agent.id, e)}
              onTouchStart={(e) => handleDragStart(agent.id, e)}
            />
          ))}

        {/* Dragging agent (rendered last for z-index) */}
        {draggingAgentId && dragPosition && (
          <AgentToken
            agent={{
              ...state.agents.find(a => a.id === draggingAgentId)!,
              position: dragPosition,
            }}
            isDragging
          />
        )}

        {/* Circulation Tray */}
        <g>
          {/* Tray background */}
          <rect
            x={TRAY_BOUNDS.minX - 20}
            y={TRAY_BOUNDS.minY - 20}
            width={TRAY_BOUNDS.maxX - TRAY_BOUNDS.minX + 40}
            height={TRAY_BOUNDS.maxY - TRAY_BOUNDS.minY + 40}
            rx={12}
            fill="url(#trayGradient)"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth={2}
          />

          {/* Tray label */}
          <text
            x={TRAY_BOUNDS.minX}
            y={TRAY_BOUNDS.minY - 6}
            fill="#94A3B8"
            fontSize={11}
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
          >
            CIRCULAȚIE
          </text>

          {/* Tray tokens */}
          {TRAY_AGENTS.map((kind, index) => {
            // Check if this kind has available instances
            const usedCount = state.agents.filter(a => a.kind === kind && a.state !== 'SPAWNED').length;
            const isAvailable = usedCount < 2; // Allow max 2 of each

            return (
              <TrayToken
                key={kind}
                kind={kind}
                position={{ x: trayStartX + index * traySpacing, y: trayY }}
                isAvailable={isAvailable}
                onMouseDown={() => {
                  if (isAvailable && onTrayAgentClick) {
                    onTrayAgentClick(kind);
                  }
                }}
              />
            );
          })}
        </g>

        {/* Phase indicator */}
        <g transform={`translate(${CANVAS_WIDTH / 2}, 20)`}>
          <rect
            x={-80}
            y={-12}
            width={160}
            height={24}
            rx={12}
            fill={
              state.phase === 'complete'
                ? 'rgba(34, 197, 94, 0.9)'
                : 'rgba(30, 41, 59, 0.9)'
            }
            stroke={
              state.phase === 'complete'
                ? 'rgba(34, 197, 94, 0.5)'
                : 'rgba(148, 163, 184, 0.3)'
            }
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dy={4}
            fill="#FFFFFF"
            fontSize={11}
            fontWeight={700}
            fontFamily="system-ui, sans-serif"
          >
            {state.phase === 'idle' && 'GATA DE START'}
            {state.phase === 'initiation' && 'FAZA 1: INIȚIERE'}
            {state.phase === 'amplification' && 'FAZA 2: AMPLIFICARE'}
            {state.phase === 'propagation' && 'FAZA 3: PROPAGARE'}
            {state.phase === 'clotting' && 'FAZA 4: COAGULARE'}
            {state.phase === 'complete' && 'CHEAG STABIL ✓'}
          </text>
        </g>

        {/* CSS Animations */}
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            @keyframes rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </svg>
    </div>
  );
}
