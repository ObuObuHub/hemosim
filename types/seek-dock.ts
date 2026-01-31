/**
 * Seek & Dock Architecture Types
 *
 * Directed Mechanical Assembly model for coagulation cascade simulation.
 * Based on MODEL CELULAR.png (Hoffman-Monroe cellular model)
 *
 * Key principles:
 * - No random diffusion - all motion is directed
 * - Complexes are sockets; enzymes/cofactors/substrates dock into ports
 * - Only IXa and IIa migrate from Zone A to Zone B
 * - Deterministic behavior: same initial state → same final state
 */

// =============================================================================
// ZONE DEFINITIONS
// =============================================================================

/**
 * Conceptual zones mapped from diagram (top/bottom → left/right in UI)
 */
export type Zone = 'ZoneA' | 'ZoneB' | 'Circulation';

/**
 * Zone A = TF-bearing cell surface (Initiation phase)
 * Zone B = Activated platelet surface (Amplification + Propagation)
 * Circulation = Neutral reservoir / user tray source
 */

// =============================================================================
// AGENT DEFINITIONS
// =============================================================================

/**
 * Agent state machine
 * SPAWNED → SEEKING → [MIGRATING] → [HOLDING] → DOCKED → [CONSUMED]
 */
export type AgentState =
  | 'SPAWNED'    // Just created, not yet assigned target
  | 'SEEKING'    // Moving toward target port within same zone
  | 'MIGRATING'  // Crossing zone boundary (IXa, IIa only)
  | 'HOLDING'    // Waiting at staging point for target to become available
  | 'DOCKED'     // Successfully docked at port
  | 'CONSUMED';  // Used up in conversion (e.g., II → IIa)

/**
 * Agent kind - all factors and active forms
 */
export type AgentKind =
  // Zymogens (inactive)
  | 'VII' | 'IX' | 'X' | 'II' | 'V' | 'VIII' | 'XI' | 'XIII'
  // Active enzymes
  | 'VIIa' | 'IXa' | 'Xa' | 'IIa' | 'XIa' | 'XIIIa'
  // Cofactors (active)
  | 'Va' | 'VIIIa'
  // Special
  | 'TF'         // Tissue Factor (membrane-bound)
  | 'Fibrinogen' // Substrate for fibrin
  | 'Fibrin'     // Final product
  | 'vWF';       // von Willebrand Factor (carrier for VIII)

/**
 * Agent migration constraint
 * Only certain agents can cross from Zone A to Zone B
 */
export type MigrationConstraint =
  | 'ZoneA_only'           // Cannot leave Zone A
  | 'ZoneB_only'           // Cannot leave Zone B
  | 'ZoneA_to_ZoneB'       // Must migrate (IXa, IIa spark)
  | 'Circulation_to_any';  // Can be placed anywhere from tray

/**
 * Core agent interface
 */
export interface Agent {
  id: string;
  kind: AgentKind;
  state: AgentState;
  zone: Zone;

  // Position (world coordinates)
  position: { x: number; y: number };

  // Target for directed movement
  targetPortId: string | null;
  targetPosition: { x: number; y: number } | null;

  // Form tracking
  isActiveForm: boolean;      // e.g., IX (false) vs IXa (true)
  originZone: Zone;           // Where agent was created/spawned

  // Migration constraint
  constraint: MigrationConstraint;

  // Animation
  animationProgress: number;  // 0-1 for movement interpolation
  holdingWaypointId: string | null; // If HOLDING, which waypoint
}

/**
 * Agents that can migrate Zone A → Zone B (per diagram)
 */
export const ZONE_MIGRATORS: AgentKind[] = ['IXa', 'IIa'];

/**
 * Check if agent kind can migrate between zones
 */
export function canMigrateZones(kind: AgentKind): boolean {
  return ZONE_MIGRATORS.includes(kind);
}

// =============================================================================
// PORT DEFINITIONS
// =============================================================================

/**
 * Port type - what role does this port serve in the socket
 */
export type PortType =
  | 'enzyme'     // Active enzyme (e.g., IXa in Tenase)
  | 'cofactor'   // Cofactor (e.g., VIIIa in Tenase)
  | 'substrate'  // Substrate to be converted (e.g., X → Xa)
  | 'receptor'   // Receptor for signaling (e.g., PAR)
  | 'ligand';    // Ligand that binds receptor (e.g., IIa binding PAR)

/**
 * Port interface - individual docking point within a socket
 */
export interface Port {
  portId: string;
  socketId: string;           // Parent socket

  // Compatibility
  acceptsKinds: AgentKind[];  // Which agent kinds can dock here
  portType: PortType;

  // State
  occupiedByAgentId: string | null;
  isEnabled: boolean;         // Can agents dock here now?

  // Position (relative to socket anchor)
  relativePosition: { x: number; y: number };

  // Visual label
  label: string;              // e.g., "IXa", "VIIIa", "X"
}

// =============================================================================
// SOCKET DEFINITIONS
// =============================================================================

/**
 * Socket - a grouped complex that agents dock into
 * Corresponds to grouped boxes in the diagram
 */
export interface DockingSocket {
  socketId: string;
  zone: Zone;

  // All ports in this socket
  ports: Port[];

  // Position on membrane
  anchorPosition: { x: number; y: number };

  // Deterministic priority for target resolution
  priority: number;           // Higher = targeted first

  // Visual
  label: string;              // e.g., "TF-VIIa", "Tenase"
  width: number;
  height: number;

  // Output tracking
  outputKinds: AgentKind[];   // What this socket produces when assembled

  // Socket type for rendering
  socketType: SocketType;
}

/**
 * Socket types for visual rendering
 */
export type SocketType =
  | 'activation'       // Simple activation (e.g., V → Va)
  | 'complex'          // Multi-port complex (e.g., Tenase)
  | 'receptor'         // Signaling receptor (e.g., PAR)
  | 'factory';         // Fixed factory (e.g., TF-VIIa)

// =============================================================================
// SOCKET RUNTIME STATE
// =============================================================================

/**
 * Runtime state for a socket - computed from port occupancy
 */
export interface SocketState {
  socketId: string;

  // Assembly state
  isAssembled: boolean;       // All required ports filled
  requiredPortsFilled: number;
  totalRequiredPorts: number;

  // Enabling condition
  isEnabled: boolean;         // Can agents dock here now?
  enabledReason: string;      // Why enabled/disabled

  // Output state
  hasProducedOutput: boolean;
  outputAgentIds: string[];   // Agents produced by this socket
}

// =============================================================================
// PHASE STATE MACHINE
// =============================================================================

/**
 * Simulation phase (state machine states)
 */
export type SimulationPhase =
  | 'idle'           // Not started
  | 'initiation'     // Zone A: TF-VIIa active, producing IXa, Xa, IIa spark
  | 'amplification'  // Zone B: IIa activates PAR, V, VIII, XI
  | 'propagation'    // Zone B: Tenase + Prothrombinase assembly
  | 'clotting'       // Fibrin formation
  | 'complete';      // Stable clot formed

/**
 * Phase transition conditions
 */
export interface PhaseGate {
  fromPhase: SimulationPhase;
  toPhase: SimulationPhase;
  condition: string;          // Human-readable condition
  isAutomatic: boolean;       // Auto-transition vs user-triggered
}

// =============================================================================
// IIa TARGETING PRIORITY
// =============================================================================

/**
 * IIa(spark) must target these in fixed order per spec Section 8.3
 */
export const IIA_TARGET_PRIORITY: string[] = [
  'PAR',           // B1 - First priority (activates platelet)
  'V_activation',  // B2a - Second (produces Va)
  'VIII_activation', // B2b - Third (produces VIIIa)
  'XI_activation', // B2c - Fourth (optional, produces XIa)
];

// =============================================================================
// GLOBAL SIMULATION STATE
// =============================================================================

/**
 * Complete simulation state for Seek & Dock
 */
export interface SeekDockState {
  // Mode
  mode: 'AUTO' | 'MANUAL';

  // Phase
  phase: SimulationPhase;

  // Entities
  agents: Agent[];
  sockets: DockingSocket[];
  socketStates: SocketState[];

  // Key state flags
  plateletActivated: boolean;     // Set when IIa docks at PAR
  tenaseAssembled: boolean;       // IXa + VIIIa docked
  prothrombinaseAssembled: boolean; // Xa + Va docked
  thrombinBurstOccurred: boolean; // Massive IIa production
  fibrinFormed: boolean;          // Final clot

  // Zone A outputs
  ixaProduced: boolean;           // IXa created from IX
  xaZoneAProduced: boolean;       // Xa created in Zone A (for spark)
  iiaSparkProduced: boolean;      // Spark thrombin created

  // Zone B outputs (after tenase)
  xaZoneBProduced: boolean;       // Xa created by Tenase
  iiaBurstProduced: boolean;      // Burst thrombin created

  // Animation state
  currentTime: number;            // For deterministic animation
  animatingAgents: string[];      // Agent IDs currently animating

  // Staging waypoints (for HOLDING state)
  stagingWaypoints: StagingWaypoint[];

  // Reset key - changes on reset to force component remount
  resetKey: number;
}

/**
 * Staging waypoint - where agents wait if target not yet available
 */
export interface StagingWaypoint {
  waypointId: string;
  zone: Zone;
  position: { x: number; y: number };
  forAgentKinds: AgentKind[];     // Which agents use this waypoint
  occupiedByAgentId: string | null;
}

// =============================================================================
// SNAP RESULT (MANUAL MODE)
// =============================================================================

/**
 * Result of snap logic in MANUAL mode
 */
export interface SnapResult {
  success: boolean;

  // If success
  targetPortId: string | null;
  targetSocketId: string | null;
  snapPosition: { x: number; y: number } | null;

  // If failure
  rejectReason: string | null;
  returnPosition: { x: number; y: number } | null; // Where to bounce back
}

// =============================================================================
// RESOLVER RESULT (AUTO MODE)
// =============================================================================

/**
 * Result of target resolution in AUTO mode
 */
export interface ResolverResult {
  hasTarget: boolean;
  targetPortId: string | null;
  targetSocketId: string | null;
  targetPosition: { x: number; y: number } | null;
  shouldHold: boolean;            // Target exists but not enabled yet
  holdWaypointId: string | null;
}

// =============================================================================
// EVENTS
// =============================================================================

/**
 * Events emitted during simulation
 */
export type SeekDockEvent =
  | { type: 'AGENT_SPAWNED'; agentId: string; kind: AgentKind; zone: Zone }
  | { type: 'AGENT_SEEKING'; agentId: string; targetPortId: string }
  | { type: 'AGENT_MIGRATING'; agentId: string; fromZone: Zone; toZone: Zone }
  | { type: 'AGENT_HOLDING'; agentId: string; waypointId: string }
  | { type: 'AGENT_DOCKED'; agentId: string; portId: string; socketId: string }
  | { type: 'AGENT_CONSUMED'; agentId: string }
  | { type: 'SOCKET_ASSEMBLED'; socketId: string; outputKinds: AgentKind[] }
  | { type: 'OUTPUT_PRODUCED'; socketId: string; outputAgentId: string; outputKind: AgentKind }
  | { type: 'PHASE_CHANGED'; fromPhase: SimulationPhase; toPhase: SimulationPhase }
  | { type: 'PLATELET_ACTIVATED' }
  | { type: 'THROMBIN_BURST' }
  | { type: 'FIBRIN_FORMED' };

// =============================================================================
// DIAGRAM ROUTING RULES (Section 11 of spec)
// =============================================================================

/**
 * Explicit directed edges from the diagram
 */
export interface RoutingRule {
  ruleId: string;
  description: string;

  // Source
  sourceSocket: string;
  inputKind: AgentKind;

  // Output
  outputKind: AgentKind;
  outputZone: Zone;

  // Target (where output should go)
  targetSocket: string;
  targetPortId: string;

  // Is this a cross-zone migration?
  isMigration: boolean;
}

/**
 * All routing rules per spec Section 11
 */
export const ROUTING_RULES: RoutingRule[] = [
  // 1. Zone A TF-VIIa: IX → IXa, then IXa targets Zone B Tenase
  {
    ruleId: 'IX_to_IXa',
    description: 'TF-VIIa activates IX → IXa, which migrates to Zone B Tenase',
    sourceSocket: 'TF_VIIa',
    inputKind: 'IX',
    outputKind: 'IXa',
    outputZone: 'ZoneB',
    targetSocket: 'Tenase',
    targetPortId: 'Tenase_IXa',
    isMigration: true,
  },

  // 2. Zone A TF-VIIa: X → Xa (local)
  {
    ruleId: 'X_to_Xa_ZoneA',
    description: 'TF-VIIa activates X → Xa (Zone A local for spark)',
    sourceSocket: 'TF_VIIa',
    inputKind: 'X',
    outputKind: 'Xa',
    outputZone: 'ZoneA',
    targetSocket: 'Spark_Prothrombinase',
    targetPortId: 'Spark_Xa',
    isMigration: false,
  },

  // 3. Zone A Spark: Xa + Va + II → IIa(spark), migrates to Zone B
  {
    ruleId: 'II_to_IIa_spark',
    description: 'Spark prothrombinase converts II → IIa(spark), which migrates to Zone B PAR',
    sourceSocket: 'Spark_Prothrombinase',
    inputKind: 'II',
    outputKind: 'IIa',
    outputZone: 'ZoneB',
    targetSocket: 'PAR',
    targetPortId: 'PAR_IIa',
    isMigration: true,
  },

  // 4. Zone B: IIa activates V → Va
  {
    ruleId: 'V_to_Va',
    description: 'IIa activates V → Va on platelet',
    sourceSocket: 'V_Activation',
    inputKind: 'V',
    outputKind: 'Va',
    outputZone: 'ZoneB',
    targetSocket: 'Prothrombinase',
    targetPortId: 'Prothrombinase_Va',
    isMigration: false,
  },

  // 5. Zone B: IIa activates VIII → VIIIa
  {
    ruleId: 'VIII_to_VIIIa',
    description: 'IIa activates VIII → VIIIa on platelet',
    sourceSocket: 'VIII_Activation',
    inputKind: 'VIII',
    outputKind: 'VIIIa',
    outputZone: 'ZoneB',
    targetSocket: 'Tenase',
    targetPortId: 'Tenase_VIIIa',
    isMigration: false,
  },

  // 6. Zone B Tenase: produces Xa (platelet-local)
  {
    ruleId: 'Tenase_Xa',
    description: 'Tenase (IXa+VIIIa) converts X → Xa on platelet',
    sourceSocket: 'Tenase',
    inputKind: 'X',
    outputKind: 'Xa',
    outputZone: 'ZoneB',
    targetSocket: 'Prothrombinase',
    targetPortId: 'Prothrombinase_Xa',
    isMigration: false,
  },

  // 7. Zone B Prothrombinase: produces IIa(burst) → Fibrin
  {
    ruleId: 'Prothrombinase_IIa',
    description: 'Prothrombinase (Xa+Va) converts II → IIa(burst) → Fibrin',
    sourceSocket: 'Prothrombinase',
    inputKind: 'II',
    outputKind: 'IIa',
    outputZone: 'ZoneB',
    targetSocket: 'Fibrin_Output',
    targetPortId: 'Fibrin_endpoint',
    isMigration: false,
  },
];

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Position helper
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Bounding box
 */
export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Agent spawn configuration
 */
export interface AgentSpawnConfig {
  kind: AgentKind;
  zone: Zone;
  position: Position;
  isActiveForm: boolean;
  constraint: MigrationConstraint;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  durationMs: number;
  easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

/**
 * Default animation settings
 */
export const DEFAULT_ANIMATION: AnimationConfig = {
  durationMs: 800,
  easing: 'ease-in',
};

/**
 * Migration animation (slower, more dramatic)
 */
export const MIGRATION_ANIMATION: AnimationConfig = {
  durationMs: 1500,
  easing: 'ease-in-out',
};
