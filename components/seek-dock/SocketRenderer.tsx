/**
 * SocketRenderer - Renders a docking socket with its ports
 *
 * Visual representation of grouped boxes from the diagram.
 * Shows socket label, ports, and assembly state.
 */
'use client';

import { DockingSocket, Port, SocketState } from '@/types/seek-dock';

interface SocketRendererProps {
  socket: DockingSocket;
  socketState: SocketState;
  onPortClick?: (portId: string) => void;
  highlightedPortId?: string | null;
  scale?: number;
}

/**
 * Get socket background color based on type and state
 */
function getSocketBackground(socket: DockingSocket, state: SocketState): string {
  if (!state.isEnabled) {
    return 'rgba(100, 116, 139, 0.2)'; // Disabled gray
  }

  if (state.isAssembled) {
    return 'rgba(34, 197, 94, 0.3)'; // Assembled green
  }

  switch (socket.socketType) {
    case 'factory':
      return 'rgba(59, 130, 246, 0.25)'; // Blue for factory
    case 'receptor':
      return 'rgba(168, 85, 247, 0.25)'; // Purple for receptor
    case 'complex':
      return 'rgba(251, 146, 60, 0.25)'; // Orange for complex
    case 'activation':
      return 'rgba(234, 179, 8, 0.25)'; // Yellow for activation
    default:
      return 'rgba(148, 163, 184, 0.2)';
  }
}

/**
 * Get socket border color
 */
function getSocketBorder(socket: DockingSocket, state: SocketState): string {
  if (!state.isEnabled) {
    return 'rgba(100, 116, 139, 0.5)';
  }

  if (state.isAssembled) {
    return 'rgba(34, 197, 94, 0.8)';
  }

  switch (socket.socketType) {
    case 'factory':
      return 'rgba(59, 130, 246, 0.6)';
    case 'receptor':
      return 'rgba(168, 85, 247, 0.6)';
    case 'complex':
      return 'rgba(251, 146, 60, 0.6)';
    case 'activation':
      return 'rgba(234, 179, 8, 0.6)';
    default:
      return 'rgba(148, 163, 184, 0.5)';
  }
}

/**
 * Get port color based on state
 */
function getPortColor(port: Port, isHighlighted: boolean): string {
  if (!port.isEnabled) {
    return 'rgba(100, 116, 139, 0.3)';
  }

  if (port.occupiedByAgentId) {
    return 'rgba(34, 197, 94, 0.8)'; // Occupied green
  }

  if (isHighlighted) {
    return 'rgba(59, 130, 246, 0.8)'; // Highlighted blue
  }

  // Available port
  return 'rgba(251, 146, 60, 0.6)'; // Orange for available
}

export function SocketRenderer({
  socket,
  socketState,
  onPortClick,
  highlightedPortId,
  scale = 1,
}: SocketRendererProps): React.ReactElement {
  const { anchorPosition, width, height, label, ports } = socket;

  return (
    <g transform={`translate(${anchorPosition.x}, ${anchorPosition.y})`}>
      {/* Socket background */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={getSocketBackground(socket, socketState)}
        stroke={getSocketBorder(socket, socketState)}
        strokeWidth={2}
        style={{
          opacity: socketState.isEnabled ? 1 : 0.5,
          transition: 'all 0.3s ease',
        }}
      />

      {/* Socket label */}
      <text
        x={0}
        y={-height / 2 - 8}
        textAnchor="middle"
        fill={socketState.isEnabled ? '#E2E8F0' : '#64748B'}
        fontSize={11 * scale}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>

      {/* Assembly indicator */}
      {socketState.isAssembled && (
        <g transform={`translate(${width / 2 - 12}, ${-height / 2 - 12})`}>
          <circle r={8} fill="#22C55E" />
          <text
            textAnchor="middle"
            dy={4}
            fill="#FFFFFF"
            fontSize={10}
            fontWeight={700}
          >
            ✓
          </text>
        </g>
      )}

      {/* Disabled reason tooltip */}
      {!socketState.isEnabled && (
        <text
          x={0}
          y={height / 2 + 14}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={9 * scale}
          fontStyle="italic"
        >
          {socketState.enabledReason}
        </text>
      )}

      {/* Ports */}
      {ports.map((port) => {
        const isHighlighted = highlightedPortId === port.portId;
        const portColor = getPortColor(port, isHighlighted);

        // Skip pre-filled fixed ports (TF, VIIa, trace Va)
        const isFixedPort =
          port.portId === 'TF_VIIa_TF' ||
          port.portId === 'TF_VIIa_VIIa' ||
          port.portId === 'Spark_Va';

        return (
          <g
            key={port.portId}
            transform={`translate(${port.relativePosition.x}, ${port.relativePosition.y})`}
            style={{ cursor: port.isEnabled && !port.occupiedByAgentId ? 'pointer' : 'default' }}
            onClick={() => {
              if (onPortClick && port.isEnabled && !port.occupiedByAgentId) {
                onPortClick(port.portId);
              }
            }}
          >
            {/* Port circle */}
            <circle
              r={isFixedPort ? 14 : 16}
              fill={portColor}
              stroke={isHighlighted ? '#3B82F6' : 'rgba(255, 255, 255, 0.3)'}
              strokeWidth={isHighlighted ? 3 : 1}
              style={{
                transition: 'all 0.2s ease',
                filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none',
              }}
            />

            {/* Port label */}
            <text
              textAnchor="middle"
              dy={4}
              fill={port.occupiedByAgentId ? '#FFFFFF' : '#1E293B'}
              fontSize={isFixedPort ? 8 : 10}
              fontWeight={600}
              fontFamily="system-ui, sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {port.label}
            </text>

            {/* Fixed port indicator */}
            {isFixedPort && port.occupiedByAgentId && (
              <circle
                r={18}
                fill="none"
                stroke="rgba(34, 197, 94, 0.5)"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
