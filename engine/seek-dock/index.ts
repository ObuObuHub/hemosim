/**
 * Seek & Dock Engine Module
 *
 * Directed Mechanical Assembly model for coagulation cascade simulation.
 */

// Socket configuration
export {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ZONE_A_BOUNDS,
  ZONE_B_BOUNDS,
  MIGRATION_CORRIDOR,
  TRAY_BOUNDS,
  ZONE_A_SOCKETS,
  ZONE_B_SOCKETS,
  ALL_SOCKETS,
  STAGING_WAYPOINTS,
  getSocket,
  getPort,
  getCompatiblePorts,
  getSocketForPort,
  getPortEnableCondition,
  PORT_ENABLE_CONDITIONS,
} from './socket-config';

// Resolver
export {
  resolveTarget,
  resolveAllTargets,
  validateDocking,
  computeSocketState,
  computeAllSocketStates,
  getPortAbsolutePosition,
} from './resolver';

// Snap logic
export {
  SNAP_RADIUS,
  SNAP_ANIMATION_MS,
  snap,
  getPortHighlights,
  getInitialTrayPositions,
  isInTray,
  type PortHighlight,
} from './snap-logic';
