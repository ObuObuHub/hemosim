/**
 * Socket Configuration for Seek & Dock
 *
 * Defines all sockets and ports based on MODEL CELULAR.png
 * Each socket corresponds to a grouped box in the diagram
 *
 * Zone A (TF Cell): Sockets A1, A2
 * Zone B (Platelet): Sockets B1, B2a-c, B3, B4
 */

import {
  DockingSocket,
  Port,
  AgentKind,
} from '../../types/seek-dock';

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

/**
 * Canvas dimensions (left/right layout instead of top/bottom)
 */
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 500;

/**
 * Zone boundaries
 * Zone A (TF Cell) = Left half
 * Zone B (Platelet) = Right half
 */
export const ZONE_A_BOUNDS = {
  minX: 0,
  maxX: 420,
  minY: 0,
  maxY: CANVAS_HEIGHT,
};

export const ZONE_B_BOUNDS = {
  minX: 480,
  maxX: CANVAS_WIDTH,
  minY: 0,
  maxY: CANVAS_HEIGHT,
};

/**
 * Migration corridor (gap between zones)
 */
export const MIGRATION_CORRIDOR = {
  minX: 420,
  maxX: 480,
  minY: 100,
  maxY: 400,
};

/**
 * Circulation tray (bottom)
 */
export const TRAY_BOUNDS = {
  minX: 50,
  maxX: CANVAS_WIDTH - 50,
  minY: CANVAS_HEIGHT + 20,
  maxY: CANVAS_HEIGHT + 80,
};

// =============================================================================
// ZONE A SOCKETS (TF Cell - Initiation)
// =============================================================================

/**
 * A1: TF-VIIa Activation Socket
 * The "factory" that activates IX and X
 */
const TF_VIIA_SOCKET: DockingSocket = {
  socketId: 'TF_VIIa',
  zone: 'ZoneA',
  priority: 100, // Highest priority in Zone A

  anchorPosition: { x: 200, y: 150 },
  width: 180,
  height: 120,

  label: 'TF-VIIa',
  socketType: 'factory',

  outputKinds: ['IXa', 'Xa'],

  ports: [
    {
      portId: 'TF_VIIa_TF',
      socketId: 'TF_VIIa',
      acceptsKinds: ['TF'],
      portType: 'enzyme',
      occupiedByAgentId: 'TF_FIXED', // TF is always present
      isEnabled: true,
      relativePosition: { x: -40, y: 0 },
      label: 'TF',
    },
    {
      portId: 'TF_VIIa_VIIa',
      socketId: 'TF_VIIa',
      acceptsKinds: ['VIIa'],
      portType: 'enzyme',
      occupiedByAgentId: 'VIIa_FIXED', // VIIa bound to TF at start
      isEnabled: true,
      relativePosition: { x: 40, y: 0 },
      label: 'VIIa',
    },
    {
      portId: 'TF_VIIa_IX',
      socketId: 'TF_VIIa',
      acceptsKinds: ['IX'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: true,
      relativePosition: { x: -60, y: 40 },
      label: 'IX',
    },
    {
      portId: 'TF_VIIa_X',
      socketId: 'TF_VIIa',
      acceptsKinds: ['X'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: true,
      relativePosition: { x: 60, y: 40 },
      label: 'X',
    },
  ],
};

/**
 * A2: Spark Prothrombinase Socket
 * Xa + Va(trace) → converts II → IIa(spark)
 */
const SPARK_PROTHROMBINASE_SOCKET: DockingSocket = {
  socketId: 'Spark_Prothrombinase',
  zone: 'ZoneA',
  priority: 90,

  anchorPosition: { x: 200, y: 350 },
  width: 160,
  height: 100,

  label: 'Xa + Va',
  socketType: 'complex',

  outputKinds: ['IIa'],

  ports: [
    {
      portId: 'Spark_Xa',
      socketId: 'Spark_Prothrombinase',
      acceptsKinds: ['Xa'],
      portType: 'enzyme',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after TF-VIIa produces Xa
      relativePosition: { x: -30, y: 0 },
      label: 'Xa',
    },
    {
      portId: 'Spark_Va',
      socketId: 'Spark_Prothrombinase',
      acceptsKinds: ['Va'],
      portType: 'cofactor',
      occupiedByAgentId: 'Va_TRACE', // Trace Va available
      isEnabled: true,
      relativePosition: { x: 30, y: 0 },
      label: 'Va(trace)',
    },
    {
      portId: 'Spark_II',
      socketId: 'Spark_Prothrombinase',
      acceptsKinds: ['II'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after Xa docks
      relativePosition: { x: 0, y: 35 },
      label: 'II',
    },
  ],
};

// =============================================================================
// ZONE B SOCKETS (Platelet - Amplification & Propagation)
// =============================================================================

/**
 * B1: PAR Receptor Socket
 * IIa binds → triggers platelet activation
 */
const PAR_SOCKET: DockingSocket = {
  socketId: 'PAR',
  zone: 'ZoneB',
  priority: 200, // Highest priority - IIa must target this FIRST

  anchorPosition: { x: 580, y: 100 },
  width: 80,
  height: 60,

  label: 'PAR',
  socketType: 'receptor',

  outputKinds: [], // No direct output, just triggers activation

  ports: [
    {
      portId: 'PAR_IIa',
      socketId: 'PAR',
      acceptsKinds: ['IIa'],
      portType: 'ligand',
      occupiedByAgentId: null,
      isEnabled: true,
      relativePosition: { x: 0, y: 0 },
      label: 'IIa',
    },
  ],
};

/**
 * B2a: V Activation Socket
 * IIa triggers: V → Va
 */
const V_ACTIVATION_SOCKET: DockingSocket = {
  socketId: 'V_Activation',
  zone: 'ZoneB',
  priority: 150, // Second priority for IIa after PAR

  anchorPosition: { x: 700, y: 100 },
  width: 80,
  height: 60,

  label: 'V→Va',
  socketType: 'activation',

  outputKinds: ['Va'],

  ports: [
    {
      portId: 'V_Activation_V',
      socketId: 'V_Activation',
      acceptsKinds: ['V'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after platelet activation
      relativePosition: { x: 0, y: 0 },
      label: 'V',
    },
  ],
};

/**
 * B2b: VIII Activation Socket
 * IIa triggers: VIII → VIIIa (with vWF context)
 */
const VIII_ACTIVATION_SOCKET: DockingSocket = {
  socketId: 'VIII_Activation',
  zone: 'ZoneB',
  priority: 140, // Third priority for IIa

  anchorPosition: { x: 820, y: 100 },
  width: 80,
  height: 60,

  label: 'VIII→VIIIa',
  socketType: 'activation',

  outputKinds: ['VIIIa'],

  ports: [
    {
      portId: 'VIII_Activation_VIII',
      socketId: 'VIII_Activation',
      acceptsKinds: ['VIII'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after platelet activation
      relativePosition: { x: 0, y: 0 },
      label: 'VIII',
    },
  ],
};

/**
 * B2c: XI Activation Socket (Optional)
 * IIa triggers: XI → XIa
 */
const XI_ACTIVATION_SOCKET: DockingSocket = {
  socketId: 'XI_Activation',
  zone: 'ZoneB',
  priority: 130, // Lowest priority for IIa

  anchorPosition: { x: 580, y: 180 },
  width: 70,
  height: 50,

  label: 'XI→XIa',
  socketType: 'activation',

  outputKinds: ['XIa'],

  ports: [
    {
      portId: 'XI_Activation_XI',
      socketId: 'XI_Activation',
      acceptsKinds: ['XI'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after platelet activation
      relativePosition: { x: 0, y: 0 },
      label: 'XI',
    },
  ],
};

/**
 * B3: Tenase Complex Socket
 * IXa + VIIIa → produces Xa (platelet-local)
 */
const TENASE_SOCKET: DockingSocket = {
  socketId: 'Tenase',
  zone: 'ZoneB',
  priority: 180, // High priority for IXa (migrator)

  anchorPosition: { x: 650, y: 280 },
  width: 140,
  height: 100,

  label: 'Tenase',
  socketType: 'complex',

  outputKinds: ['Xa'],

  ports: [
    {
      portId: 'Tenase_IXa',
      socketId: 'Tenase',
      acceptsKinds: ['IXa'],
      portType: 'enzyme',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after platelet activation
      relativePosition: { x: -35, y: -15 },
      label: 'IXa',
    },
    {
      portId: 'Tenase_VIIIa',
      socketId: 'Tenase',
      acceptsKinds: ['VIIIa'],
      portType: 'cofactor',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after platelet activation
      relativePosition: { x: 35, y: -15 },
      label: 'VIIIa',
    },
    {
      portId: 'Tenase_X',
      socketId: 'Tenase',
      acceptsKinds: ['X'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after Tenase assembled
      relativePosition: { x: 0, y: 35 },
      label: 'X',
    },
  ],
};

/**
 * B4: Platelet Prothrombinase Socket
 * Xa + Va → produces IIa(burst) → Fibrin
 */
const PROTHROMBINASE_SOCKET: DockingSocket = {
  socketId: 'Prothrombinase',
  zone: 'ZoneB',
  priority: 170,

  anchorPosition: { x: 800, y: 280 },
  width: 140,
  height: 100,

  label: 'Prothrombinase',
  socketType: 'complex',

  outputKinds: ['IIa'],

  ports: [
    {
      portId: 'Prothrombinase_Xa',
      socketId: 'Prothrombinase',
      acceptsKinds: ['Xa'],
      portType: 'enzyme',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after platelet activation
      relativePosition: { x: -35, y: -15 },
      label: 'Xa',
    },
    {
      portId: 'Prothrombinase_Va',
      socketId: 'Prothrombinase',
      acceptsKinds: ['Va'],
      portType: 'cofactor',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after platelet activation
      relativePosition: { x: 35, y: -15 },
      label: 'Va',
    },
    {
      portId: 'Prothrombinase_II',
      socketId: 'Prothrombinase',
      acceptsKinds: ['II'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after Prothrombinase assembled
      relativePosition: { x: 0, y: 35 },
      label: 'II',
    },
  ],
};

/**
 * Fibrin Output Socket (endpoint)
 */
const FIBRIN_OUTPUT_SOCKET: DockingSocket = {
  socketId: 'Fibrin_Output',
  zone: 'ZoneB',
  priority: 160,

  anchorPosition: { x: 725, y: 420 },
  width: 100,
  height: 50,

  label: 'Fibrin',
  socketType: 'activation',

  outputKinds: ['Fibrin'],

  ports: [
    {
      portId: 'Fibrin_Fibrinogen',
      socketId: 'Fibrin_Output',
      acceptsKinds: ['Fibrinogen'],
      portType: 'substrate',
      occupiedByAgentId: null,
      isEnabled: false, // Enabled after thrombin burst
      relativePosition: { x: 0, y: 0 },
      label: 'Fibrinogen',
    },
  ],
};

// =============================================================================
// EXPORTED SOCKET COLLECTIONS
// =============================================================================

/**
 * All Zone A sockets
 */
export const ZONE_A_SOCKETS: DockingSocket[] = [
  TF_VIIA_SOCKET,
  SPARK_PROTHROMBINASE_SOCKET,
];

/**
 * All Zone B sockets
 */
export const ZONE_B_SOCKETS: DockingSocket[] = [
  PAR_SOCKET,
  V_ACTIVATION_SOCKET,
  VIII_ACTIVATION_SOCKET,
  XI_ACTIVATION_SOCKET,
  TENASE_SOCKET,
  PROTHROMBINASE_SOCKET,
  FIBRIN_OUTPUT_SOCKET,
];

/**
 * All sockets
 */
export const ALL_SOCKETS: DockingSocket[] = [
  ...ZONE_A_SOCKETS,
  ...ZONE_B_SOCKETS,
];

// =============================================================================
// SOCKET LOOKUP HELPERS
// =============================================================================

/**
 * Get socket by ID
 */
export function getSocket(socketId: string): DockingSocket | undefined {
  return ALL_SOCKETS.find(s => s.socketId === socketId);
}

/**
 * Get port by ID
 */
export function getPort(portId: string): Port | undefined {
  for (const socket of ALL_SOCKETS) {
    const port = socket.ports.find(p => p.portId === portId);
    if (port) return port;
  }
  return undefined;
}

/**
 * Get all ports that accept a given agent kind
 */
export function getCompatiblePorts(kind: AgentKind): Port[] {
  const result: Port[] = [];
  for (const socket of ALL_SOCKETS) {
    for (const port of socket.ports) {
      if (port.acceptsKinds.includes(kind)) {
        result.push(port);
      }
    }
  }
  return result;
}

/**
 * Get socket for a given port
 */
export function getSocketForPort(portId: string): DockingSocket | undefined {
  for (const socket of ALL_SOCKETS) {
    if (socket.ports.some(p => p.portId === portId)) {
      return socket;
    }
  }
  return undefined;
}

// =============================================================================
// STAGING WAYPOINTS
// =============================================================================

import { StagingWaypoint } from '../../types/seek-dock';

/**
 * Waypoints where agents wait if their target isn't ready
 */
export const STAGING_WAYPOINTS: StagingWaypoint[] = [
  // IXa waiting to enter Zone B (in migration corridor)
  {
    waypointId: 'IXa_staging',
    zone: 'Circulation',
    position: { x: 450, y: 250 },
    forAgentKinds: ['IXa'],
    occupiedByAgentId: null,
  },
  // IIa waiting to enter Zone B (in migration corridor)
  {
    waypointId: 'IIa_staging',
    zone: 'Circulation',
    position: { x: 450, y: 180 },
    forAgentKinds: ['IIa'],
    occupiedByAgentId: null,
  },
  // General Zone A staging
  {
    waypointId: 'ZoneA_staging',
    zone: 'ZoneA',
    position: { x: 100, y: 250 },
    forAgentKinds: ['IX', 'X', 'II', 'V', 'VIII'],
    occupiedByAgentId: null,
  },
  // General Zone B staging
  {
    waypointId: 'ZoneB_staging',
    zone: 'ZoneB',
    position: { x: 550, y: 350 },
    forAgentKinds: ['V', 'VIII', 'X', 'II', 'Fibrinogen'],
    occupiedByAgentId: null,
  },
];

// =============================================================================
// PORT ENABLING CONDITIONS
// =============================================================================

/**
 * Conditions for enabling ports (evaluated at runtime)
 */
export interface PortEnableCondition {
  portId: string;
  condition: (state: { plateletActivated: boolean; tenaseAssembled: boolean; prothrombinaseAssembled: boolean; thrombinBurst: boolean; xaZoneAProduced: boolean }) => boolean;
}

export const PORT_ENABLE_CONDITIONS: PortEnableCondition[] = [
  // Spark prothrombinase - Xa port enabled after TF-VIIa produces Xa
  { portId: 'Spark_Xa', condition: (s) => s.xaZoneAProduced },
  // Spark prothrombinase - II port enabled after Xa docks
  { portId: 'Spark_II', condition: (s) => s.xaZoneAProduced },

  // Zone B activation sockets - enabled after PAR activation
  { portId: 'V_Activation_V', condition: (s) => s.plateletActivated },
  { portId: 'VIII_Activation_VIII', condition: (s) => s.plateletActivated },
  { portId: 'XI_Activation_XI', condition: (s) => s.plateletActivated },

  // Tenase ports - enabled after platelet activation
  { portId: 'Tenase_IXa', condition: (s) => s.plateletActivated },
  { portId: 'Tenase_VIIIa', condition: (s) => s.plateletActivated },
  { portId: 'Tenase_X', condition: (s) => s.tenaseAssembled },

  // Prothrombinase ports - enabled after platelet activation
  { portId: 'Prothrombinase_Xa', condition: (s) => s.plateletActivated },
  { portId: 'Prothrombinase_Va', condition: (s) => s.plateletActivated },
  { portId: 'Prothrombinase_II', condition: (s) => s.prothrombinaseAssembled },

  // Fibrin - enabled after thrombin burst
  { portId: 'Fibrin_Fibrinogen', condition: (s) => s.thrombinBurst },
];

/**
 * Get enable condition for a port
 */
export function getPortEnableCondition(portId: string): PortEnableCondition | undefined {
  return PORT_ENABLE_CONDITIONS.find(c => c.portId === portId);
}
