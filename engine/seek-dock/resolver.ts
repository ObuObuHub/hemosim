/**
 * Deterministic Seek & Dock Resolver
 *
 * This module implements the target resolution algorithm per spec Section 8.
 * Key properties:
 * - No randomness
 * - Same initial state → same final state every run
 * - IIa(spark) must target PAR first, then V, VIII, XI in that order
 */

import {
  Agent,
  Port,
  DockingSocket,
  ResolverResult,
  Position,
  SocketState,
  SeekDockState,
  IIA_TARGET_PRIORITY,
  canMigrateZones,
} from '../../types/seek-dock';

import {
  ALL_SOCKETS,
  getPort,
  getSocketForPort,
  getCompatiblePorts,
  STAGING_WAYPOINTS,
} from './socket-config';

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
 * Get absolute position of a port
 */
export function getPortAbsolutePosition(port: Port): Position {
  const socket = getSocketForPort(port.portId);
  if (!socket) {
    return { x: 0, y: 0 };
  }
  return {
    x: socket.anchorPosition.x + port.relativePosition.x,
    y: socket.anchorPosition.y + port.relativePosition.y,
  };
}

// =============================================================================
// PORT FILTERING
// =============================================================================

/**
 * Check if agent can target this port (basic compatibility)
 */
function isPortCompatible(agent: Agent, port: Port): boolean {
  return port.acceptsKinds.includes(agent.kind);
}

/**
 * Check if port is available for docking
 */
function isPortAvailable(port: Port, state: SeekDockState): boolean {
  // Not already occupied
  if (port.occupiedByAgentId !== null) {
    return false;
  }

  // Check if port is enabled based on state
  return isPortEnabled(port.portId, state);
}

/**
 * Check if port is enabled based on current state
 */
function isPortEnabled(portId: string, state: SeekDockState): boolean {
  const port = getPort(portId);
  if (!port) return false;

  // Check explicit enabled flag
  if (!port.isEnabled) {
    // Check dynamic enable conditions
    return checkDynamicEnableCondition(portId, state);
  }
  return true;
}

/**
 * Check dynamic enable conditions based on state
 */
function checkDynamicEnableCondition(portId: string, state: SeekDockState): boolean {
  switch (portId) {
    // Zone A ports
    case 'Spark_Xa':
    case 'Spark_II':
      return state.xaZoneAProduced;

    // Zone B activation ports - need platelet activated
    case 'V_Activation_V':
    case 'VIII_Activation_VIII':
    case 'XI_Activation_XI':
    case 'Tenase_IXa':
    case 'Tenase_VIIIa':
    case 'Prothrombinase_Xa':
    case 'Prothrombinase_Va':
      return state.plateletActivated;

    // Tenase substrate - need Tenase assembled
    case 'Tenase_X':
      return state.tenaseAssembled;

    // Prothrombinase substrate - need Prothrombinase assembled
    case 'Prothrombinase_II':
      return state.prothrombinaseAssembled;

    // Fibrin - need thrombin burst
    case 'Fibrin_Fibrinogen':
      return state.thrombinBurstOccurred;

    default:
      return true;
  }
}

/**
 * Check cross-zone constraint
 * Only IXa and IIa can migrate from Zone A to Zone B
 */
function canCrossZone(agent: Agent, targetPort: Port): boolean {
  const socket = getSocketForPort(targetPort.portId);
  if (!socket) return false;

  const agentZone = agent.zone;
  const targetZone = socket.zone;

  // Same zone is always OK
  if (agentZone === targetZone) return true;

  // Circulation can go anywhere
  if (agentZone === 'Circulation') return true;

  // Zone A → Zone B: only IXa and IIa allowed
  if (agentZone === 'ZoneA' && targetZone === 'ZoneB') {
    return canMigrateZones(agent.kind);
  }

  // Zone B → Zone A: not allowed
  if (agentZone === 'ZoneB' && targetZone === 'ZoneA') {
    return false;
  }

  return true;
}

// =============================================================================
// IIa PRIORITY TARGETING (Spec Section 8.3)
// =============================================================================

/**
 * Get priority score for IIa targeting
 * IIa must target in this order: PAR → V → VIII → XI
 */
function getIIaPriorityScore(socketId: string): number {
  const index = IIA_TARGET_PRIORITY.indexOf(socketId);
  if (index === -1) return 1000; // Not in priority list = low priority
  return index; // Lower index = higher priority
}

/**
 * Check if agent is IIa(spark) that should use priority targeting
 */
function isSparkThrombin(agent: Agent): boolean {
  return agent.kind === 'IIa' && agent.originZone === 'ZoneA';
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Resolve the single best target port for an agent
 *
 * Algorithm:
 * 1. Enforce migration constraints
 * 2. Enforce port compatibility
 * 3. Choose target by priority:
 *    a. For IIa: use fixed priority order (PAR → V → VIII → XI)
 *    b. For others: socket.priority → distance → portId
 */
export function resolveTarget(agent: Agent, state: SeekDockState): ResolverResult {
  // Get all compatible ports
  const compatiblePorts = getCompatiblePorts(agent.kind);

  // Filter by availability and constraints
  const candidatePorts = compatiblePorts.filter(port => {
    // Basic compatibility
    if (!isPortCompatible(agent, port)) return false;

    // Cross-zone constraint
    if (!canCrossZone(agent, port)) return false;

    return true;
  });

  if (candidatePorts.length === 0) {
    return {
      hasTarget: false,
      targetPortId: null,
      targetSocketId: null,
      targetPosition: null,
      shouldHold: false,
      holdWaypointId: null,
    };
  }

  // Separate into enabled and disabled ports
  const enabledPorts = candidatePorts.filter(p => isPortAvailable(p, state));
  const disabledPorts = candidatePorts.filter(p => !isPortAvailable(p, state));

  // If we have enabled ports, target the best one
  if (enabledPorts.length > 0) {
    const bestPort = selectBestPort(agent, enabledPorts, state);
    const socket = getSocketForPort(bestPort.portId);

    return {
      hasTarget: true,
      targetPortId: bestPort.portId,
      targetSocketId: socket?.socketId ?? null,
      targetPosition: getPortAbsolutePosition(bestPort),
      shouldHold: false,
      holdWaypointId: null,
    };
  }

  // If we have disabled ports (future targets), hold at staging
  if (disabledPorts.length > 0) {
    const waypoint = findStagingWaypoint(agent);

    return {
      hasTarget: true, // We know where we want to go
      targetPortId: disabledPorts[0].portId, // First candidate
      targetSocketId: getSocketForPort(disabledPorts[0].portId)?.socketId ?? null,
      targetPosition: waypoint?.position ?? agent.position,
      shouldHold: true,
      holdWaypointId: waypoint?.waypointId ?? null,
    };
  }

  return {
    hasTarget: false,
    targetPortId: null,
    targetSocketId: null,
    targetPosition: null,
    shouldHold: false,
    holdWaypointId: null,
  };
}

/**
 * Select the best port from a list of enabled candidates
 */
function selectBestPort(agent: Agent, ports: Port[], _state: SeekDockState): Port {
  // Special handling for IIa(spark) - use fixed priority order
  if (isSparkThrombin(agent)) {
    return selectBestPortForIIa(agent, ports);
  }

  // Standard selection: priority → distance → portId
  return selectBestPortStandard(agent, ports);
}

/**
 * Select best port for IIa using fixed priority order
 * PAR → V_Activation → VIII_Activation → XI_Activation
 */
function selectBestPortForIIa(agent: Agent, ports: Port[]): Port {
  // Sort by IIa priority order
  const sorted = [...ports].sort((a, b) => {
    const socketA = getSocketForPort(a.portId);
    const socketB = getSocketForPort(b.portId);

    const priorityA = getIIaPriorityScore(socketA?.socketId ?? '');
    const priorityB = getIIaPriorityScore(socketB?.socketId ?? '');

    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Lower score = higher priority
    }

    // Tie-breaker: portId (stable)
    return a.portId.localeCompare(b.portId);
  });

  return sorted[0];
}

/**
 * Select best port using standard priority rules
 * socket.priority → distance → portId
 */
function selectBestPortStandard(agent: Agent, ports: Port[]): Port {
  const sorted = [...ports].sort((a, b) => {
    const socketA = getSocketForPort(a.portId);
    const socketB = getSocketForPort(b.portId);

    // 1. Socket priority (higher = better)
    const priorityA = socketA?.priority ?? 0;
    const priorityB = socketB?.priority ?? 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }

    // 2. Distance (closer = better)
    const distA = distance(agent.position, getPortAbsolutePosition(a));
    const distB = distance(agent.position, getPortAbsolutePosition(b));
    if (Math.abs(distA - distB) > 0.1) {
      return distA - distB; // Closer first
    }

    // 3. Stable tie-breaker: portId
    return a.portId.localeCompare(b.portId);
  });

  return sorted[0];
}

/**
 * Find staging waypoint for agent to wait at
 */
function findStagingWaypoint(agent: Agent): typeof STAGING_WAYPOINTS[0] | null {
  // Find waypoint that accepts this agent kind
  for (const waypoint of STAGING_WAYPOINTS) {
    if (waypoint.forAgentKinds.includes(agent.kind)) {
      // Check if not already occupied
      if (waypoint.occupiedByAgentId === null) {
        return waypoint;
      }
    }
  }

  // Fallback: return first compatible waypoint even if occupied
  for (const waypoint of STAGING_WAYPOINTS) {
    if (waypoint.forAgentKinds.includes(agent.kind)) {
      return waypoint;
    }
  }

  return null;
}

// =============================================================================
// BATCH RESOLUTION (for AUTO mode initialization)
// =============================================================================

/**
 * Resolve targets for all seeking agents
 * Returns map of agentId → ResolverResult
 */
export function resolveAllTargets(state: SeekDockState): Map<string, ResolverResult> {
  const results = new Map<string, ResolverResult>();

  for (const agent of state.agents) {
    if (agent.state === 'SPAWNED' || agent.state === 'SEEKING' || agent.state === 'HOLDING') {
      const result = resolveTarget(agent, state);
      results.set(agent.id, result);
    }
  }

  return results;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate that a docking action is legal
 */
export function validateDocking(
  agent: Agent,
  portId: string,
  state: SeekDockState
): { valid: boolean; reason: string } {
  const port = getPort(portId);
  if (!port) {
    return { valid: false, reason: 'Port not found' };
  }

  // Compatibility check
  if (!isPortCompatible(agent, port)) {
    return { valid: false, reason: `Port ${portId} does not accept ${agent.kind}` };
  }

  // Availability check
  if (port.occupiedByAgentId !== null) {
    return { valid: false, reason: `Port ${portId} is already occupied` };
  }

  // Enable check
  if (!isPortEnabled(portId, state)) {
    return { valid: false, reason: `Port ${portId} is not enabled yet` };
  }

  // Cross-zone check
  if (!canCrossZone(agent, port)) {
    return { valid: false, reason: `${agent.kind} cannot cross from ${agent.zone} to ${getSocketForPort(portId)?.zone}` };
  }

  return { valid: true, reason: 'OK' };
}

// =============================================================================
// SOCKET STATE COMPUTATION
// =============================================================================

/**
 * Compute the current state of a socket based on port occupancy
 */
export function computeSocketState(socket: DockingSocket, state: SeekDockState): SocketState {
  // Count filled required ports (enzyme and cofactor ports)
  const requiredPorts = socket.ports.filter(p =>
    p.portType === 'enzyme' || p.portType === 'cofactor' || p.portType === 'ligand'
  );

  const filledRequired = requiredPorts.filter(p => p.occupiedByAgentId !== null);

  // For socket to be assembled, all required ports must be filled
  const isAssembled = requiredPorts.length > 0 &&
    filledRequired.length === requiredPorts.length;

  // Check if socket is enabled (based on phase gates)
  const isEnabled = checkSocketEnabled(socket, state);

  return {
    socketId: socket.socketId,
    isAssembled,
    requiredPortsFilled: filledRequired.length,
    totalRequiredPorts: requiredPorts.length,
    isEnabled,
    enabledReason: isEnabled ? 'Active' : getDisabledReason(socket, state),
    hasProducedOutput: false, // Tracked separately
    outputAgentIds: [],
  };
}

/**
 * Check if socket is enabled based on state
 */
function checkSocketEnabled(socket: DockingSocket, state: SeekDockState): boolean {
  switch (socket.socketId) {
    case 'TF_VIIa':
      return true; // Always enabled (starting point)

    case 'Spark_Prothrombinase':
      return state.xaZoneAProduced; // Needs Xa from TF-VIIa

    case 'PAR':
      return true; // Always ready to receive IIa

    case 'V_Activation':
    case 'VIII_Activation':
    case 'XI_Activation':
    case 'Tenase':
    case 'Prothrombinase':
      return state.plateletActivated;

    case 'Fibrin_Output':
      return state.thrombinBurstOccurred;

    default:
      return true;
  }
}

/**
 * Get reason why socket is disabled
 */
function getDisabledReason(socket: DockingSocket, _state: SeekDockState): string {
  switch (socket.socketId) {
    case 'Spark_Prothrombinase':
      return 'Waiting for Xa from TF-VIIa';

    case 'V_Activation':
    case 'VIII_Activation':
    case 'XI_Activation':
    case 'Tenase':
    case 'Prothrombinase':
      return 'Waiting for platelet activation (PAR)';

    case 'Fibrin_Output':
      return 'Waiting for thrombin burst';

    default:
      return 'Unknown';
  }
}

// =============================================================================
// COMPUTE ALL SOCKET STATES
// =============================================================================

/**
 * Compute states for all sockets
 */
export function computeAllSocketStates(state: SeekDockState): SocketState[] {
  return ALL_SOCKETS.map(socket => computeSocketState(socket, state));
}
