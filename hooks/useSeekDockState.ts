/**
 * useSeekDockState - State management hook for Seek & Dock simulation
 *
 * Implements the phase gating state machine per spec Section 12:
 * - Initiation (Zone A): TF-VIIa → IXa, Xa → IIa spark
 * - Amplification (Zone B): PAR → platelet activation → cofactors
 * - Propagation (Zone B): Tenase → Prothrombinase → thrombin burst
 * - Clotting: Fibrin formation → stable clot
 */
'use client';

import { useReducer, useCallback, useMemo } from 'react';
import {
  Agent,
  AgentKind,
  AgentState,
  Zone,
  SeekDockState,
  SimulationPhase,
  Position,
  SocketState,
  MigrationConstraint,
} from '@/types/seek-dock';
import {
  ALL_SOCKETS,
  getSocket,
  getPort,
  getSocketForPort,
  STAGING_WAYPOINTS,
  TRAY_BOUNDS,
} from '@/engine/seek-dock/socket-config';
import {
  computeSocketState,
  computeAllSocketStates,
  getPortAbsolutePosition,
} from '@/engine/seek-dock/resolver';
import { snap, getInitialTrayPositions } from '@/engine/seek-dock/snap-logic';

// =============================================================================
// ACTION TYPES
// =============================================================================

type SeekDockAction =
  | { type: 'SET_MODE'; mode: 'AUTO' | 'MANUAL' }
  | { type: 'RESET' }
  | { type: 'SPAWN_AGENT'; kind: AgentKind; zone: Zone; position: Position }
  | { type: 'MOVE_AGENT'; agentId: string; position: Position }
  | { type: 'DOCK_AGENT'; agentId: string; portId: string }
  | { type: 'UNDOCK_AGENT'; agentId: string }
  | { type: 'CONSUME_AGENT'; agentId: string }
  | { type: 'SET_AGENT_STATE'; agentId: string; state: AgentState }
  | { type: 'SET_AGENT_TARGET'; agentId: string; targetPortId: string; targetPosition: Position }
  | { type: 'PRODUCE_OUTPUT'; socketId: string; outputKind: AgentKind }
  | { type: 'START_MIGRATION'; agentId: string }
  | { type: 'COMPLETE_MIGRATION'; agentId: string }
  | { type: 'ACTIVATE_PLATELET' }
  | { type: 'ASSEMBLE_TENASE' }
  | { type: 'ASSEMBLE_PROTHROMBINASE' }
  | { type: 'TRIGGER_THROMBIN_BURST' }
  | { type: 'FORM_FIBRIN' }
  | { type: 'SET_PHASE'; phase: SimulationPhase }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'SNAP_AGENT'; agentId: string; dropPosition: Position };

// =============================================================================
// INITIAL STATE
// =============================================================================

function createInitialState(): SeekDockState {
  return {
    mode: 'MANUAL',
    phase: 'idle',
    agents: [],
    sockets: ALL_SOCKETS,
    socketStates: computeAllSocketStates({
      mode: 'MANUAL',
      phase: 'idle',
      agents: [],
      sockets: ALL_SOCKETS,
      socketStates: [],
      plateletActivated: false,
      tenaseAssembled: false,
      prothrombinaseAssembled: false,
      thrombinBurstOccurred: false,
      fibrinFormed: false,
      ixaProduced: false,
      xaZoneAProduced: false,
      iiaSparkProduced: false,
      xaZoneBProduced: false,
      iiaBurstProduced: false,
      currentTime: 0,
      animatingAgents: [],
      stagingWaypoints: STAGING_WAYPOINTS,
    }),
    plateletActivated: false,
    tenaseAssembled: false,
    prothrombinaseAssembled: false,
    thrombinBurstOccurred: false,
    fibrinFormed: false,
    ixaProduced: false,
    xaZoneAProduced: false,
    iiaSparkProduced: false,
    xaZoneBProduced: false,
    iiaBurstProduced: false,
    currentTime: 0,
    animatingAgents: [],
    stagingWaypoints: STAGING_WAYPOINTS,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

let agentIdCounter = 0;

function generateAgentId(): string {
  return `agent_${++agentIdCounter}`;
}

function getConstraintForKind(kind: AgentKind, originZone: Zone): MigrationConstraint {
  // Migrators that must go from Zone A to Zone B
  if ((kind === 'IXa' || kind === 'IIa') && originZone === 'ZoneA') {
    return 'ZoneA_to_ZoneB';
  }

  // Zone A only (non-migrators produced in Zone A)
  if (originZone === 'ZoneA' && kind === 'Xa') {
    return 'ZoneA_only';
  }

  // Zone B only (produced on platelet)
  if (originZone === 'ZoneB') {
    return 'ZoneB_only';
  }

  // Tray agents can go anywhere
  return 'Circulation_to_any';
}

function createAgent(
  kind: AgentKind,
  zone: Zone,
  position: Position,
  isActiveForm: boolean = false
): Agent {
  return {
    id: generateAgentId(),
    kind,
    state: 'SPAWNED',
    zone,
    position,
    targetPortId: null,
    targetPosition: null,
    isActiveForm,
    originZone: zone,
    constraint: getConstraintForKind(kind, zone),
    animationProgress: 0,
    holdingWaypointId: null,
  };
}

/**
 * Update socket states based on current simulation state
 */
function updateSocketStates(state: SeekDockState): SocketState[] {
  return ALL_SOCKETS.map(socket => computeSocketState(socket, state));
}

/**
 * Check phase transition conditions
 */
function checkPhaseTransitions(state: SeekDockState): SimulationPhase {
  const { phase, plateletActivated, thrombinBurstOccurred, fibrinFormed } = state;

  switch (phase) {
    case 'idle':
      // Start initiation when first agent is placed in Zone A
      if (state.agents.some(a => a.zone === 'ZoneA' && a.state === 'DOCKED')) {
        return 'initiation';
      }
      break;

    case 'initiation':
      // Move to amplification when IIa arrives at Zone B
      if (state.agents.some(a => a.kind === 'IIa' && a.zone === 'ZoneB')) {
        return 'amplification';
      }
      break;

    case 'amplification':
      // Move to propagation when Tenase is ready to form
      if (plateletActivated && state.agents.some(a => a.kind === 'VIIIa' && a.state === 'DOCKED')) {
        return 'propagation';
      }
      break;

    case 'propagation':
      // Move to clotting when thrombin burst occurs
      if (thrombinBurstOccurred) {
        return 'clotting';
      }
      break;

    case 'clotting':
      // Move to complete when fibrin is crosslinked
      if (fibrinFormed) {
        return 'complete';
      }
      break;

    default:
      break;
  }

  return phase;
}

// =============================================================================
// REDUCER
// =============================================================================

function seekDockReducer(state: SeekDockState, action: SeekDockAction): SeekDockState {
  let newState: SeekDockState;

  switch (action.type) {
    case 'SET_MODE':
      newState = { ...state, mode: action.mode };
      break;

    case 'RESET':
      agentIdCounter = 0;
      newState = createInitialState();
      break;

    case 'SPAWN_AGENT': {
      const newAgent = createAgent(action.kind, action.zone, action.position);
      newState = {
        ...state,
        agents: [...state.agents, newAgent],
      };
      break;
    }

    case 'MOVE_AGENT': {
      newState = {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.agentId
            ? { ...agent, position: action.position }
            : agent
        ),
      };
      break;
    }

    case 'SET_AGENT_STATE': {
      newState = {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.agentId
            ? { ...agent, state: action.state }
            : agent
        ),
      };
      break;
    }

    case 'SET_AGENT_TARGET': {
      newState = {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.agentId
            ? {
                ...agent,
                targetPortId: action.targetPortId,
                targetPosition: action.targetPosition,
                state: 'SEEKING' as AgentState,
              }
            : agent
        ),
      };
      break;
    }

    case 'DOCK_AGENT': {
      const port = getPort(action.portId);
      const socket = getSocketForPort(action.portId);

      if (!port || !socket) {
        return state;
      }

      const portPosition = getPortAbsolutePosition(port);

      // Update agent state
      const updatedAgents = state.agents.map(agent =>
        agent.id === action.agentId
          ? {
              ...agent,
              state: 'DOCKED' as AgentState,
              position: portPosition,
              zone: socket.zone as Zone,
              targetPortId: null,
              targetPosition: null,
            }
          : agent
      );

      // Update port occupancy in sockets
      const updatedSockets = state.sockets.map(s => ({
        ...s,
        ports: s.ports.map(p =>
          p.portId === action.portId
            ? { ...p, occupiedByAgentId: action.agentId }
            : p
        ),
      }));

      newState = {
        ...state,
        agents: updatedAgents,
        sockets: updatedSockets,
      };

      // Check for socket assembly
      const socketState = computeSocketState(
        updatedSockets.find(s => s.socketId === socket.socketId)!,
        newState
      );

      if (socketState.isAssembled && !state.socketStates.find(s => s.socketId === socket.socketId)?.isAssembled) {
        // Socket just became assembled - handle based on socket type
        switch (socket.socketId) {
          case 'PAR':
            newState = { ...newState, plateletActivated: true };
            break;
          case 'Tenase':
            newState = { ...newState, tenaseAssembled: true };
            break;
          case 'Prothrombinase':
            newState = { ...newState, prothrombinaseAssembled: true };
            break;
        }
      }
      break;
    }

    case 'UNDOCK_AGENT': {
      // Find current port
      const agent = state.agents.find(a => a.id === action.agentId);
      if (!agent) return state;

      // Update sockets to clear port occupancy
      const updatedSockets = state.sockets.map(s => ({
        ...s,
        ports: s.ports.map(p =>
          p.occupiedByAgentId === action.agentId
            ? { ...p, occupiedByAgentId: null }
            : p
        ),
      }));

      newState = {
        ...state,
        agents: state.agents.map(a =>
          a.id === action.agentId
            ? { ...a, state: 'SPAWNED' as AgentState }
            : a
        ),
        sockets: updatedSockets,
      };
      break;
    }

    case 'CONSUME_AGENT': {
      newState = {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.agentId
            ? { ...agent, state: 'CONSUMED' as AgentState }
            : agent
        ),
      };
      break;
    }

    case 'PRODUCE_OUTPUT': {
      const socket = getSocket(action.socketId);
      if (!socket) return state;

      // Determine spawn position (near socket)
      const spawnPosition = {
        x: socket.anchorPosition.x,
        y: socket.anchorPosition.y + socket.height / 2 + 30,
      };

      const newAgent = createAgent(
        action.outputKind,
        socket.zone as Zone,
        spawnPosition,
        true // outputs are active forms
      );

      newState = {
        ...state,
        agents: [...state.agents, newAgent],
      };

      // Update production flags
      switch (action.outputKind) {
        case 'IXa':
          newState.ixaProduced = true;
          break;
        case 'Xa':
          if (socket.zone === 'ZoneA') {
            newState.xaZoneAProduced = true;
          } else {
            newState.xaZoneBProduced = true;
          }
          break;
        case 'IIa':
          if (socket.socketId === 'Spark_Prothrombinase') {
            newState.iiaSparkProduced = true;
          } else {
            newState.iiaBurstProduced = true;
          }
          break;
      }
      break;
    }

    case 'START_MIGRATION': {
      newState = {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.agentId
            ? { ...agent, state: 'MIGRATING' as AgentState }
            : agent
        ),
        animatingAgents: [...state.animatingAgents, action.agentId],
      };
      break;
    }

    case 'COMPLETE_MIGRATION': {
      const agent = state.agents.find(a => a.id === action.agentId);
      if (!agent) return state;

      newState = {
        ...state,
        agents: state.agents.map(a =>
          a.id === action.agentId
            ? { ...a, state: 'SPAWNED' as AgentState, zone: 'ZoneB' }
            : a
        ),
        animatingAgents: state.animatingAgents.filter(id => id !== action.agentId),
      };
      break;
    }

    case 'ACTIVATE_PLATELET':
      newState = { ...state, plateletActivated: true };
      break;

    case 'ASSEMBLE_TENASE':
      newState = { ...state, tenaseAssembled: true };
      break;

    case 'ASSEMBLE_PROTHROMBINASE':
      newState = { ...state, prothrombinaseAssembled: true };
      break;

    case 'TRIGGER_THROMBIN_BURST':
      newState = { ...state, thrombinBurstOccurred: true };
      break;

    case 'FORM_FIBRIN':
      newState = { ...state, fibrinFormed: true };
      break;

    case 'SET_PHASE':
      newState = { ...state, phase: action.phase };
      break;

    case 'TICK': {
      // Update animation progress for moving agents
      const updatedAgents = state.agents.map(agent => {
        if (agent.state === 'SEEKING' || agent.state === 'MIGRATING') {
          const newProgress = Math.min(1, agent.animationProgress + action.deltaMs / 1000);

          // If animation complete, update position
          if (newProgress >= 1 && agent.targetPosition) {
            return {
              ...agent,
              animationProgress: 0,
              position: agent.targetPosition,
              state: agent.state === 'MIGRATING' ? 'SPAWNED' as AgentState : agent.state,
            };
          }

          // Interpolate position
          if (agent.targetPosition) {
            const t = easeInOut(newProgress);
            const newX = agent.position.x + (agent.targetPosition.x - agent.position.x) * t;
            const newY = agent.position.y + (agent.targetPosition.y - agent.position.y) * t;

            return {
              ...agent,
              animationProgress: newProgress,
              position: { x: newX, y: newY },
            };
          }
        }
        return agent;
      });

      newState = {
        ...state,
        agents: updatedAgents,
        currentTime: state.currentTime + action.deltaMs,
      };
      break;
    }

    case 'SNAP_AGENT': {
      const agent = state.agents.find(a => a.id === action.agentId);
      if (!agent) return state;

      const snapResult = snap(agent, action.dropPosition, state);

      if (snapResult.success && snapResult.targetPortId && snapResult.snapPosition) {
        // Successful snap - dock the agent
        const port = getPort(snapResult.targetPortId);
        const socket = getSocketForPort(snapResult.targetPortId);

        if (port && socket) {
          const updatedAgents = state.agents.map(a =>
            a.id === action.agentId
              ? {
                  ...a,
                  state: 'DOCKED' as AgentState,
                  position: snapResult.snapPosition!,
                  zone: socket.zone as Zone,
                }
              : a
          );

          const updatedSockets = state.sockets.map(s => ({
            ...s,
            ports: s.ports.map(p =>
              p.portId === snapResult.targetPortId
                ? { ...p, occupiedByAgentId: action.agentId }
                : p
            ),
          }));

          newState = {
            ...state,
            agents: updatedAgents,
            sockets: updatedSockets,
          };
        } else {
          return state;
        }
      } else {
        // Failed snap - return to tray
        newState = {
          ...state,
          agents: state.agents.map(a =>
            a.id === action.agentId
              ? {
                  ...a,
                  position: snapResult.returnPosition ?? a.position,
                  state: 'SPAWNED' as AgentState,
                }
              : a
          ),
        };
      }
      break;
    }

    default:
      return state;
  }

  // Update socket states
  newState.socketStates = updateSocketStates(newState);

  // Check phase transitions
  const newPhase = checkPhaseTransitions(newState);
  if (newPhase !== newState.phase) {
    newState = { ...newState, phase: newPhase };
  }

  return newState;
}

/**
 * Ease-in-out interpolation
 */
function easeInOut(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// =============================================================================
// HOOK
// =============================================================================

export interface SeekDockStateHook {
  state: SeekDockState;
  socketStates: SocketState[];

  // Mode control
  setMode: (mode: 'AUTO' | 'MANUAL') => void;
  reset: () => void;

  // Agent management
  spawnAgent: (kind: AgentKind, zone: Zone, position: Position) => void;
  spawnFromTray: (kind: AgentKind) => void;
  moveAgent: (agentId: string, position: Position) => void;
  snapAgent: (agentId: string, dropPosition: Position) => void;
  dockAgent: (agentId: string, portId: string) => void;

  // Phase control
  setPhase: (phase: SimulationPhase) => void;

  // Animation
  tick: (deltaMs: number) => void;

  // Production triggers
  produceOutput: (socketId: string, outputKind: AgentKind) => void;
  startMigration: (agentId: string) => void;
  completeMigration: (agentId: string) => void;

  // State triggers
  activatePlatelet: () => void;
  assembleTenase: () => void;
  assembleProthrombinase: () => void;
  triggerThrombinBurst: () => void;
  formFibrin: () => void;
}

export function useSeekDockState(): SeekDockStateHook {
  const [state, dispatch] = useReducer(seekDockReducer, null, createInitialState);

  const setMode = useCallback((mode: 'AUTO' | 'MANUAL') => {
    dispatch({ type: 'SET_MODE', mode });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const spawnAgent = useCallback((kind: AgentKind, zone: Zone, position: Position) => {
    dispatch({ type: 'SPAWN_AGENT', kind, zone, position });
  }, []);

  const spawnFromTray = useCallback((kind: AgentKind) => {
    const trayPositions = getInitialTrayPositions();
    const position = trayPositions.get(kind) ?? { x: TRAY_BOUNDS.minX + 50, y: TRAY_BOUNDS.minY + 30 };
    dispatch({ type: 'SPAWN_AGENT', kind, zone: 'Circulation', position });
  }, []);

  const moveAgent = useCallback((agentId: string, position: Position) => {
    dispatch({ type: 'MOVE_AGENT', agentId, position });
  }, []);

  const snapAgent = useCallback((agentId: string, dropPosition: Position) => {
    dispatch({ type: 'SNAP_AGENT', agentId, dropPosition });
  }, []);

  const dockAgent = useCallback((agentId: string, portId: string) => {
    dispatch({ type: 'DOCK_AGENT', agentId, portId });
  }, []);

  const setPhase = useCallback((phase: SimulationPhase) => {
    dispatch({ type: 'SET_PHASE', phase });
  }, []);

  const tick = useCallback((deltaMs: number) => {
    dispatch({ type: 'TICK', deltaMs });
  }, []);

  const produceOutput = useCallback((socketId: string, outputKind: AgentKind) => {
    dispatch({ type: 'PRODUCE_OUTPUT', socketId, outputKind });
  }, []);

  const startMigration = useCallback((agentId: string) => {
    dispatch({ type: 'START_MIGRATION', agentId });
  }, []);

  const completeMigration = useCallback((agentId: string) => {
    dispatch({ type: 'COMPLETE_MIGRATION', agentId });
  }, []);

  const activatePlatelet = useCallback(() => {
    dispatch({ type: 'ACTIVATE_PLATELET' });
  }, []);

  const assembleTenase = useCallback(() => {
    dispatch({ type: 'ASSEMBLE_TENASE' });
  }, []);

  const assembleProthrombinase = useCallback(() => {
    dispatch({ type: 'ASSEMBLE_PROTHROMBINASE' });
  }, []);

  const triggerThrombinBurst = useCallback(() => {
    dispatch({ type: 'TRIGGER_THROMBIN_BURST' });
  }, []);

  const formFibrin = useCallback(() => {
    dispatch({ type: 'FORM_FIBRIN' });
  }, []);

  const socketStates = useMemo(() => state.socketStates, [state.socketStates]);

  return {
    state,
    socketStates,
    setMode,
    reset,
    spawnAgent,
    spawnFromTray,
    moveAgent,
    snapAgent,
    dockAgent,
    setPhase,
    tick,
    produceOutput,
    startMigration,
    completeMigration,
    activatePlatelet,
    assembleTenase,
    assembleProthrombinase,
    triggerThrombinBurst,
    formFibrin,
  };
}
