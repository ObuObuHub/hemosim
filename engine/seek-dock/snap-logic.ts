/**
 * Snap Logic for MANUAL Mode
 *
 * Handles drag-and-drop docking mechanics.
 * Same rules as AUTO mode resolver, but for user-initiated placement.
 *
 * Contract (spec Section 10):
 * - Agents spawn in tray (Circulation pool)
 * - User drags agent into zones
 * - On release, call snap(agent)
 * - Snap validates and docks, or rejects back to tray
 */

import {
  Agent,
  AgentKind,
  Port,
  Zone,
  SnapResult,
  Position,
  SeekDockState,
  canMigrateZones,
} from '../../types/seek-dock';

import {
  ALL_SOCKETS,
  getSocketForPort,
  TRAY_BOUNDS,
  ZONE_A_BOUNDS,
  ZONE_B_BOUNDS,
} from './socket-config';

import { getPortAbsolutePosition, validateDocking } from './resolver';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Snap radius in pixels
 * Agent must be within this distance of a port to snap
 */
export const SNAP_RADIUS = 50;

/**
 * Snap animation duration in ms
 */
export const SNAP_ANIMATION_MS = 200;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate distance between two positions
 */
function distance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get the tray return position for an agent
 */
function getTrayReturnPosition(agent: Agent): Position {
  // Return to original spawn position in tray, or center of tray
  const trayCenter = {
    x: (TRAY_BOUNDS.minX + TRAY_BOUNDS.maxX) / 2,
    y: (TRAY_BOUNDS.minY + TRAY_BOUNDS.maxY) / 2,
  };

  // Offset based on agent kind for visual spread
  const kindIndex = getKindTrayIndex(agent.kind);
  const offset = (kindIndex - 5) * 60; // Spread agents in tray

  return {
    x: trayCenter.x + offset,
    y: trayCenter.y,
  };
}

/**
 * Get tray position index for agent kind
 */
function getKindTrayIndex(kind: AgentKind): number {
  const order: AgentKind[] = ['IX', 'X', 'II', 'V', 'VIII', 'XI', 'Fibrinogen'];
  const index = order.indexOf(kind);
  return index >= 0 ? index : 5;
}

/**
 * Check if position is in a valid drop zone
 */
function isInValidDropZone(pos: Position): Zone | null {
  if (pos.x >= ZONE_A_BOUNDS.minX && pos.x <= ZONE_A_BOUNDS.maxX &&
      pos.y >= ZONE_A_BOUNDS.minY && pos.y <= ZONE_A_BOUNDS.maxY) {
    return 'ZoneA';
  }
  if (pos.x >= ZONE_B_BOUNDS.minX && pos.x <= ZONE_B_BOUNDS.maxX &&
      pos.y >= ZONE_B_BOUNDS.minY && pos.y <= ZONE_B_BOUNDS.maxY) {
    return 'ZoneB';
  }
  return null;
}

// =============================================================================
// PORT FINDING
// =============================================================================

/**
 * Find all ports within snap radius of a position
 */
function findPortsWithinRadius(position: Position, radius: number): Port[] {
  const result: Port[] = [];

  for (const socket of ALL_SOCKETS) {
    for (const port of socket.ports) {
      const portPos = getPortAbsolutePosition(port);
      if (distance(position, portPos) <= radius) {
        result.push(port);
      }
    }
  }

  return result;
}

/**
 * Check if agent can target this port based on zone constraints
 */
function canAgentTargetPort(agent: Agent, port: Port, state: SeekDockState): boolean {
  const socket = getSocketForPort(port.portId);
  if (!socket) return false;

  // 1. Compatibility check
  if (!port.acceptsKinds.includes(agent.kind)) {
    return false;
  }

  // 2. Availability check
  if (port.occupiedByAgentId !== null) {
    return false;
  }

  // 3. Enable check (based on state)
  if (!isPortEnabledForSnap(port.portId, state)) {
    return false;
  }

  // 4. Cross-zone constraint
  // Tray (Circulation) agents can go anywhere
  if (agent.originZone === 'Circulation') {
    return true;
  }

  // Zone A agents going to Zone B: only IXa and IIa allowed
  if (agent.zone === 'ZoneA' && socket.zone === 'ZoneB') {
    return canMigrateZones(agent.kind);
  }

  // Zone B agents cannot go to Zone A
  if (agent.zone === 'ZoneB' && socket.zone === 'ZoneA') {
    return false;
  }

  return true;
}

/**
 * Check if port is enabled based on current state (for snap)
 */
function isPortEnabledForSnap(portId: string, state: SeekDockState): boolean {
  switch (portId) {
    // Zone A always active
    case 'TF_VIIa_TF':
    case 'TF_VIIa_VIIa':
    case 'TF_VIIa_IX':
    case 'TF_VIIa_X':
      return true;

    case 'Spark_Xa':
    case 'Spark_II':
      return state.xaZoneAProduced;

    case 'Spark_Va':
      return true; // Trace Va always available

    // PAR always ready
    case 'PAR_IIa':
      return true;

    // Zone B activation - need platelet activated
    case 'V_Activation_V':
    case 'VIII_Activation_VIII':
    case 'XI_Activation_XI':
    case 'Tenase_IXa':
    case 'Tenase_VIIIa':
    case 'Prothrombinase_Xa':
    case 'Prothrombinase_Va':
      return state.plateletActivated;

    // Complex substrates - need complex assembled
    case 'Tenase_X':
      return state.tenaseAssembled;

    case 'Prothrombinase_II':
      return state.prothrombinaseAssembled;

    // Fibrin - need burst
    case 'Fibrin_Fibrinogen':
      return state.thrombinBurstOccurred;

    default:
      return true;
  }
}

// =============================================================================
// MAIN SNAP FUNCTION
// =============================================================================

/**
 * Attempt to snap an agent to a nearby port
 *
 * Algorithm (spec Section 10.2):
 * 1. Find all ports within snapRadius
 * 2. Filter by: enabled, unoccupied, compatible, cross-zone constraint
 * 3. Select winner: highest priority, then nearest, then stable portId
 * 4. If winner: snap to anchor position
 * 5. Else: reject, bounce back to tray
 */
export function snap(agent: Agent, dropPosition: Position, state: SeekDockState): SnapResult {
  // Check if dropped in valid zone
  const dropZone = isInValidDropZone(dropPosition);
  if (!dropZone) {
    return createRejectResult(agent, 'Dropped outside valid zones');
  }

  // Find ports within snap radius
  const nearbyPorts = findPortsWithinRadius(dropPosition, SNAP_RADIUS);

  if (nearbyPorts.length === 0) {
    return createRejectResult(agent, 'No ports within snap range');
  }

  // Filter by constraints
  const validPorts = nearbyPorts.filter(port =>
    canAgentTargetPort(agent, port, state)
  );

  if (validPorts.length === 0) {
    return createRejectResult(agent, 'No compatible ports available');
  }

  // Select best port (priority → distance → portId)
  const bestPort = selectBestPortForSnap(agent, validPorts, dropPosition);
  const socket = getSocketForPort(bestPort.portId);

  if (!socket) {
    return createRejectResult(agent, 'Socket not found');
  }

  // Final validation
  const validation = validateDocking(agent, bestPort.portId, state);
  if (!validation.valid) {
    return createRejectResult(agent, validation.reason);
  }

  // Success!
  const snapPosition = getPortAbsolutePosition(bestPort);

  return {
    success: true,
    targetPortId: bestPort.portId,
    targetSocketId: socket.socketId,
    snapPosition,
    rejectReason: null,
    returnPosition: null,
  };
}

/**
 * Select best port for snap (same rules as AUTO resolver)
 */
function selectBestPortForSnap(agent: Agent, ports: Port[], dropPosition: Position): Port {
  const sorted = [...ports].sort((a, b) => {
    const socketA = getSocketForPort(a.portId);
    const socketB = getSocketForPort(b.portId);

    // 1. Socket priority (higher = better)
    const priorityA = socketA?.priority ?? 0;
    const priorityB = socketB?.priority ?? 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // 2. Distance from drop position (closer = better)
    const distA = distance(dropPosition, getPortAbsolutePosition(a));
    const distB = distance(dropPosition, getPortAbsolutePosition(b));
    if (Math.abs(distA - distB) > 0.1) {
      return distA - distB;
    }

    // 3. Stable tie-breaker
    return a.portId.localeCompare(b.portId);
  });

  return sorted[0];
}

/**
 * Create a rejection result
 */
function createRejectResult(agent: Agent, reason: string): SnapResult {
  return {
    success: false,
    targetPortId: null,
    targetSocketId: null,
    snapPosition: null,
    rejectReason: reason,
    returnPosition: getTrayReturnPosition(agent),
  };
}

// =============================================================================
// AFFORDANCES (Visual hints for drag-and-drop)
// =============================================================================

/**
 * Port highlight state for UI feedback
 */
export interface PortHighlight {
  portId: string;
  socketId: string;
  position: Position;
  state: 'compatible' | 'incompatible' | 'disabled';
  label: string;
}

/**
 * Get highlight states for all ports while dragging an agent
 * Used for visual feedback (spec Section 10.3)
 */
export function getPortHighlights(agent: Agent, state: SeekDockState): PortHighlight[] {
  const highlights: PortHighlight[] = [];

  for (const socket of ALL_SOCKETS) {
    for (const port of socket.ports) {
      // Skip already occupied ports
      if (port.occupiedByAgentId !== null) continue;

      // Skip ports that are pre-filled (TF, VIIa, trace Va)
      if (port.portId === 'TF_VIIa_TF' ||
          port.portId === 'TF_VIIa_VIIa' ||
          port.portId === 'Spark_Va') {
        continue;
      }

      const portPos = getPortAbsolutePosition(port);
      const isCompatible = port.acceptsKinds.includes(agent.kind);
      const isEnabled = isPortEnabledForSnap(port.portId, state);
      const canCross = canAgentCrossToPort(agent, port);

      let highlightState: 'compatible' | 'incompatible' | 'disabled';

      if (!isCompatible) {
        highlightState = 'incompatible';
      } else if (!isEnabled) {
        highlightState = 'disabled';
      } else if (!canCross) {
        highlightState = 'incompatible';
      } else {
        highlightState = 'compatible';
      }

      highlights.push({
        portId: port.portId,
        socketId: socket.socketId,
        position: portPos,
        state: highlightState,
        label: `Accepts: ${port.acceptsKinds.join(', ')}`,
      });
    }
  }

  return highlights;
}

/**
 * Check if agent can cross to port's zone
 */
function canAgentCrossToPort(agent: Agent, port: Port): boolean {
  const socket = getSocketForPort(port.portId);
  if (!socket) return false;

  // Tray agents can go anywhere
  if (agent.originZone === 'Circulation') return true;

  // Zone A → Zone B: only migrators
  if (agent.zone === 'ZoneA' && socket.zone === 'ZoneB') {
    return canMigrateZones(agent.kind);
  }

  // Zone B → Zone A: not allowed
  if (agent.zone === 'ZoneB' && socket.zone === 'ZoneA') {
    return false;
  }

  return true;
}

// =============================================================================
// TRAY MANAGEMENT
// =============================================================================

/**
 * Initial tray positions for starting agents
 */
export function getInitialTrayPositions(): Map<AgentKind, Position> {
  const positions = new Map<AgentKind, Position>();

  const trayAgents: AgentKind[] = ['IX', 'X', 'II', 'V', 'VIII', 'XI', 'Fibrinogen'];
  const startX = TRAY_BOUNDS.minX + 50;
  const spacing = 100;

  trayAgents.forEach((kind, index) => {
    positions.set(kind, {
      x: startX + index * spacing,
      y: (TRAY_BOUNDS.minY + TRAY_BOUNDS.maxY) / 2,
    });
  });

  return positions;
}

/**
 * Check if position is in tray area
 */
export function isInTray(position: Position): boolean {
  return position.x >= TRAY_BOUNDS.minX &&
         position.x <= TRAY_BOUNDS.maxX &&
         position.y >= TRAY_BOUNDS.minY &&
         position.y <= TRAY_BOUNDS.maxY;
}
