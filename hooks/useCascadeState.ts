// hooks/useCascadeState.ts
// Interactive Learning Tool - Hoffman-Monroe Cellular Model of Coagulation
'use client';

import { useReducer, useCallback } from 'react';
import type { PlayMode } from '@/data/cascadeSteps';

// Re-export PlayMode for convenience
export type { PlayMode };

// =============================================================================
// STATE TYPES - Cascade Learning Model
// =============================================================================

/**
 * Initiation Phase State
 * Location: TF-bearing cell surface (subendothelium, monocytes)
 * Educational focus: TF-VIIa complex formation and initial factor activation
 */
export interface InitiationState {
  tfVIIaDocked: boolean;      // TF-VIIa complex formed
  fixDocked: boolean;         // FIX activated by TF-VIIa
  fxDocked: boolean;          // FX activated by TF-VIIa
  fvDocked: boolean;          // FV present for prothrombinase
  fiiDocked: boolean;         // Prothrombin present
  thrombinProduced: boolean;  // Small thrombin amounts (~0.35 nM)
  // Migration visualization - factors traveling to platelet surface
  fixaMigrating: boolean;
  fiiaMigrating: boolean;
}

/**
 * PAR1 Receptor Cleavage States
 * Educational focus: Thrombin-mediated platelet activation mechanism
 */
export type PARCleavageState = 'intact' | 'thrombin-bound' | 'cleaved' | 'activated';

/**
 * Amplification & Propagation Phase Types
 * Educational focus: Platelet surface reactions and complex formation
 */
export type PlateletPhase = 'dormant' | 'amplifying' | 'propagating' | 'burst' | 'clotting' | 'stable';

/**
 * Platelet Surface State (Amplification + Propagation + Clotting)
 * Location: Activated platelet membrane
 * Educational focus: Cofactor activation, complex assembly, thrombin burst, fibrin formation
 */
export interface PlateletSurfaceState {
  // Current learning phase
  phase: PlateletPhase;

  // Amplification Phase - Thrombin activates cofactors
  thrombinArrived: boolean;       // Trace thrombin from initiation
  parCleavageState: PARCleavageState;  // PAR1 receptor activation
  plateletActivated: boolean;     // Platelet exposes phosphatidylserine
  vwfSplit: boolean;              // vWF-FVIII complex dissociated
  fvActivated: boolean;           // FV → FVa by thrombin
  fviiiActivated: boolean;        // FVIII → FVIIIa by thrombin
  fxiActivated: boolean;          // FXI → FXIa (positive feedback loop)
  fvaDocked: boolean;             // FVa anchored on PS membrane
  fviiaDocked: boolean;           // FVIIIa anchored on PS membrane

  // Propagation Phase - Enzyme complex formation
  fixaArrived: boolean;           // FIXa from initiation phase
  tenaseFormed: boolean;          // FIXa + FVIIIa complex (×200,000 amplification)
  fxaProduced: boolean;           // FXa product from Tenase
  prothrombinaseFormed: boolean;  // FXa + FVa complex (×300,000 amplification)
  thrombinBurst: boolean;         // ~350 nM thrombin generated

  // Clotting Phase - Fibrin mesh formation
  fibrinogenCleaved: boolean;     // Thrombin cleaves fibrinopeptides A & B
  fibrinPolymerized: boolean;     // Fibrin monomers self-assemble
  fxiiiActivated: boolean;        // FXIII → FXIIIa by thrombin
  fibrinCrosslinked: boolean;     // Gamma-chain covalent bonds formed
}

/**
 * Flow Arrow for Inter-phase Communication Visualization
 * Educational focus: Factor migration between cell surfaces
 */
export interface FlowArrow {
  id: string;
  from: 'initiation' | 'platelet';
  to: 'initiation' | 'platelet';
  factor: string;
  progress: number;
  isActive: boolean;
  showTravelingParticle?: boolean;
  particleSize?: number;
  travelDuration?: string;
  particleKey?: string | number;
}

/**
 * Complete Cascade Learning State
 * Represents the full Hoffman-Monroe cellular model
 */
export interface CascadeState {
  initiation: InitiationState;
  platelet: PlateletSurfaceState;
  activeFlows: FlowArrow[];
  cascadeCompleted: boolean;
  // Learning mode control
  mode: PlayMode;
  currentStepIndex: number;
}

// =============================================================================
// INITIAL STATE - Starting Point for Learning
// =============================================================================

const initialState: CascadeState = {
  initiation: {
    tfVIIaDocked: false,
    fixDocked: false,
    fxDocked: false,
    fvDocked: false,
    fiiDocked: false,
    thrombinProduced: false,
    fixaMigrating: false,
    fiiaMigrating: false,
  },
  platelet: {
    phase: 'dormant',
    // Amplification
    thrombinArrived: false,
    parCleavageState: 'intact',
    plateletActivated: false,
    vwfSplit: false,
    fvActivated: false,
    fviiiActivated: false,
    fxiActivated: false,
    fvaDocked: false,
    fviiaDocked: false,
    // Propagation
    fixaArrived: false,
    tenaseFormed: false,
    fxaProduced: false,
    prothrombinaseFormed: false,
    thrombinBurst: false,
    // Fibrin formation
    fibrinogenCleaved: false,
    fibrinPolymerized: false,
    fxiiiActivated: false,
    fibrinCrosslinked: false,
  },
  activeFlows: [],
  cascadeCompleted: false,
  mode: 'manual',
  currentStepIndex: 0,
};

// =============================================================================
// ACTIONS - Learning Interactions
// =============================================================================

type CascadeAction =
  // Initiation phase actions
  | { type: 'DOCK_TF_VIIA' }
  | { type: 'DOCK_FIX' }
  | { type: 'DOCK_FX' }
  | { type: 'DOCK_FV' }
  | { type: 'DOCK_FII' }
  | { type: 'PRODUCE_THROMBIN' }
  // Factor migration visualization
  | { type: 'START_FIXA_MIGRATION' }
  | { type: 'STOP_FIXA_MIGRATION' }
  | { type: 'START_FIIA_MIGRATION' }
  | { type: 'STOP_FIIA_MIGRATION' }
  // Platelet phase transitions
  | { type: 'THROMBIN_ARRIVES' }
  | { type: 'SET_PLATELET_PHASE'; phase: PlateletPhase }
  // Amplification actions
  | { type: 'SPLIT_VWF' }
  | { type: 'ACTIVATE_FV' }
  | { type: 'ACTIVATE_FVIII' }
  | { type: 'ACTIVATE_FXI' }
  | { type: 'ACTIVATE_PLATELET' }
  | { type: 'DOCK_FVA' }
  | { type: 'DOCK_FVIIIA' }
  // PAR1 cleavage sequence
  | { type: 'PAR_THROMBIN_BIND' }
  | { type: 'PAR_CLEAVE' }
  | { type: 'PAR_ACTIVATE' }
  // Propagation actions
  | { type: 'FIXA_ARRIVES' }
  | { type: 'FORM_TENASE' }
  | { type: 'PRODUCE_FXA' }
  | { type: 'FORM_PROTHROMBINASE' }
  | { type: 'THROMBIN_BURST' }
  // Fibrin formation actions
  | { type: 'CLEAVE_FIBRINOGEN' }
  | { type: 'POLYMERIZE_FIBRIN' }
  | { type: 'ACTIVATE_FXIII' }
  | { type: 'CROSSLINK_FIBRIN' }
  // Flow visualization
  | { type: 'ADD_FLOW'; flow: FlowArrow }
  | { type: 'UPDATE_FLOW'; flowId: string; progress: number }
  | { type: 'REMOVE_FLOW'; flowId: string }
  | { type: 'CLEAR_FLOWS' }
  // Learning control
  | { type: 'COMPLETE_CASCADE' }
  | { type: 'RESTART_LEARNING' }
  | { type: 'SET_MODE'; mode: PlayMode }
  | { type: 'SET_STEP_INDEX'; index: number }
  | { type: 'ADVANCE_STEP' };

// =============================================================================
// REDUCER - State Transitions
// =============================================================================

function cascadeReducer(state: CascadeState, action: CascadeAction): CascadeState {
  switch (action.type) {
    // Initiation phase
    case 'DOCK_TF_VIIA':
      return { ...state, initiation: { ...state.initiation, tfVIIaDocked: true } };
    case 'DOCK_FIX':
      return { ...state, initiation: { ...state.initiation, fixDocked: true } };
    case 'DOCK_FX':
      return { ...state, initiation: { ...state.initiation, fxDocked: true } };
    case 'DOCK_FV':
      return { ...state, initiation: { ...state.initiation, fvDocked: true } };
    case 'DOCK_FII':
      return { ...state, initiation: { ...state.initiation, fiiDocked: true } };
    case 'PRODUCE_THROMBIN':
      return { ...state, initiation: { ...state.initiation, thrombinProduced: true } };

    // Factor migration visualization
    case 'START_FIXA_MIGRATION':
      return { ...state, initiation: { ...state.initiation, fixaMigrating: true } };
    case 'STOP_FIXA_MIGRATION':
      return { ...state, initiation: { ...state.initiation, fixaMigrating: false } };
    case 'START_FIIA_MIGRATION':
      return { ...state, initiation: { ...state.initiation, fiiaMigrating: true } };
    case 'STOP_FIIA_MIGRATION':
      return { ...state, initiation: { ...state.initiation, fiiaMigrating: false } };

    // Platelet phase transitions
    case 'THROMBIN_ARRIVES':
      return {
        ...state,
        platelet: {
          ...state.platelet,
          thrombinArrived: true,
          phase: 'amplifying',
        },
      };
    case 'SET_PLATELET_PHASE':
      return {
        ...state,
        platelet: { ...state.platelet, phase: action.phase },
      };

    // Amplification phase
    case 'SPLIT_VWF':
      return { ...state, platelet: { ...state.platelet, vwfSplit: true } };
    case 'ACTIVATE_FV':
      return { ...state, platelet: { ...state.platelet, fvActivated: true } };
    case 'ACTIVATE_FVIII':
      return { ...state, platelet: { ...state.platelet, fviiiActivated: true } };
    case 'ACTIVATE_FXI':
      return { ...state, platelet: { ...state.platelet, fxiActivated: true } };
    case 'ACTIVATE_PLATELET':
      return { ...state, platelet: { ...state.platelet, plateletActivated: true } };
    case 'DOCK_FVA':
      return { ...state, platelet: { ...state.platelet, fvaDocked: true } };
    case 'DOCK_FVIIIA':
      return { ...state, platelet: { ...state.platelet, fviiaDocked: true } };

    // PAR1 cleavage sequence
    case 'PAR_THROMBIN_BIND':
      return { ...state, platelet: { ...state.platelet, parCleavageState: 'thrombin-bound' } };
    case 'PAR_CLEAVE':
      return { ...state, platelet: { ...state.platelet, parCleavageState: 'cleaved' } };
    case 'PAR_ACTIVATE':
      return { ...state, platelet: { ...state.platelet, parCleavageState: 'activated' } };

    // Propagation phase
    case 'FIXA_ARRIVES':
      return { ...state, platelet: { ...state.platelet, fixaArrived: true } };
    case 'FORM_TENASE':
      return { ...state, platelet: { ...state.platelet, tenaseFormed: true } };
    case 'PRODUCE_FXA':
      return { ...state, platelet: { ...state.platelet, fxaProduced: true } };
    case 'FORM_PROTHROMBINASE':
      return { ...state, platelet: { ...state.platelet, prothrombinaseFormed: true } };
    case 'THROMBIN_BURST':
      return {
        ...state,
        platelet: { ...state.platelet, thrombinBurst: true, phase: 'burst' },
      };

    // Fibrin formation (clotting phase)
    case 'CLEAVE_FIBRINOGEN':
      return {
        ...state,
        platelet: { ...state.platelet, fibrinogenCleaved: true, phase: 'clotting' },
      };
    case 'POLYMERIZE_FIBRIN':
      return {
        ...state,
        platelet: { ...state.platelet, fibrinPolymerized: true },
      };
    case 'ACTIVATE_FXIII':
      return {
        ...state,
        platelet: { ...state.platelet, fxiiiActivated: true },
      };
    case 'CROSSLINK_FIBRIN':
      return {
        ...state,
        platelet: { ...state.platelet, fibrinCrosslinked: true, phase: 'stable' },
        cascadeCompleted: true,
      };

    // Flow visualization
    case 'ADD_FLOW':
      return { ...state, activeFlows: [...state.activeFlows, action.flow] };
    case 'UPDATE_FLOW':
      return {
        ...state,
        activeFlows: state.activeFlows.map((f) =>
          f.id === action.flowId ? { ...f, progress: action.progress } : f
        ),
      };
    case 'REMOVE_FLOW':
      return {
        ...state,
        activeFlows: state.activeFlows.filter((f) => f.id !== action.flowId),
      };
    case 'CLEAR_FLOWS':
      return { ...state, activeFlows: [] };

    // Learning control
    case 'COMPLETE_CASCADE':
      return { ...state, cascadeCompleted: true };
    case 'RESTART_LEARNING':
      return { ...initialState, mode: state.mode };

    // Mode control
    case 'SET_MODE':
      return { ...initialState, mode: action.mode };
    case 'SET_STEP_INDEX':
      return { ...state, currentStepIndex: action.index };
    case 'ADVANCE_STEP':
      return { ...state, currentStepIndex: state.currentStepIndex + 1 };

    default:
      return state;
  }
}

// =============================================================================
// HOOK INTERFACE - Learning Tool API
// =============================================================================

export interface CascadeStateHook {
  state: CascadeState;
  // Initiation phase actions
  dockTFVIIa: () => void;
  dockFIX: () => void;
  dockFX: () => void;
  dockFV: () => void;
  dockFII: () => void;
  produceThrombin: () => void;
  // Migration visualization
  startFixaMigration: () => void;
  stopFixaMigration: () => void;
  startFiiaMigration: () => void;
  stopFiiaMigration: () => void;
  // Platelet phase actions
  thrombinArrives: () => void;
  setPlateletPhase: (phase: PlateletPhase) => void;
  // Amplification actions
  splitVWF: () => void;
  activateFV: () => void;
  activateFVIII: () => void;
  activateFXI: () => void;
  activatePlatelet: () => void;
  dockFVa: () => void;
  dockFVIIIa: () => void;
  // PAR1 cleavage
  parThrombinBind: () => void;
  parCleave: () => void;
  parActivate: () => void;
  // Propagation actions
  fixaArrives: () => void;
  formTenase: () => void;
  produceFXa: () => void;
  formProthrombinase: () => void;
  thrombinBurst: () => void;
  // Fibrin formation
  cleaveFibrinogen: () => void;
  polymerizeFibrin: () => void;
  activateFXIII: () => void;
  crosslinkFibrin: () => void;
  // Flow visualization
  addFlow: (flow: FlowArrow) => void;
  updateFlow: (flowId: string, progress: number) => void;
  removeFlow: (flowId: string) => void;
  clearFlows: () => void;
  // Learning control
  completeCascade: () => void;
  restartLearning: () => void;
  setMode: (mode: PlayMode) => void;
  setStepIndex: (index: number) => void;
  advanceStep: () => void;
  // Educational helpers - prerequisite checking
  canProduceThrombin: () => boolean;
  canTransitionToPropagating: () => boolean;
  canFormTenase: () => boolean;
  canFormProthrombinase: () => boolean;
  canThrombinBurst: () => boolean;
  canCrosslink: () => boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useCascadeState(): CascadeStateHook {
  const [state, dispatch] = useReducer(cascadeReducer, initialState);

  // Initiation phase actions
  const dockTFVIIa = useCallback((): void => dispatch({ type: 'DOCK_TF_VIIA' }), []);
  const dockFIX = useCallback((): void => dispatch({ type: 'DOCK_FIX' }), []);
  const dockFX = useCallback((): void => dispatch({ type: 'DOCK_FX' }), []);
  const dockFV = useCallback((): void => dispatch({ type: 'DOCK_FV' }), []);
  const dockFII = useCallback((): void => dispatch({ type: 'DOCK_FII' }), []);
  const produceThrombin = useCallback((): void => dispatch({ type: 'PRODUCE_THROMBIN' }), []);

  // Migration visualization
  const startFixaMigration = useCallback((): void => dispatch({ type: 'START_FIXA_MIGRATION' }), []);
  const stopFixaMigration = useCallback((): void => dispatch({ type: 'STOP_FIXA_MIGRATION' }), []);
  const startFiiaMigration = useCallback((): void => dispatch({ type: 'START_FIIA_MIGRATION' }), []);
  const stopFiiaMigration = useCallback((): void => dispatch({ type: 'STOP_FIIA_MIGRATION' }), []);

  // Platelet phase actions
  const thrombinArrives = useCallback((): void => dispatch({ type: 'THROMBIN_ARRIVES' }), []);
  const setPlateletPhase = useCallback(
    (phase: PlateletPhase): void => dispatch({ type: 'SET_PLATELET_PHASE', phase }),
    []
  );

  // Amplification actions
  const splitVWF = useCallback((): void => dispatch({ type: 'SPLIT_VWF' }), []);
  const activateFV = useCallback((): void => dispatch({ type: 'ACTIVATE_FV' }), []);
  const activateFVIII = useCallback((): void => dispatch({ type: 'ACTIVATE_FVIII' }), []);
  const activateFXI = useCallback((): void => dispatch({ type: 'ACTIVATE_FXI' }), []);
  const activatePlatelet = useCallback((): void => dispatch({ type: 'ACTIVATE_PLATELET' }), []);
  const dockFVa = useCallback((): void => dispatch({ type: 'DOCK_FVA' }), []);
  const dockFVIIIa = useCallback((): void => dispatch({ type: 'DOCK_FVIIIA' }), []);

  // PAR1 cleavage
  const parThrombinBind = useCallback((): void => dispatch({ type: 'PAR_THROMBIN_BIND' }), []);
  const parCleave = useCallback((): void => dispatch({ type: 'PAR_CLEAVE' }), []);
  const parActivate = useCallback((): void => dispatch({ type: 'PAR_ACTIVATE' }), []);

  // Propagation actions
  const fixaArrives = useCallback((): void => dispatch({ type: 'FIXA_ARRIVES' }), []);
  const formTenase = useCallback((): void => dispatch({ type: 'FORM_TENASE' }), []);
  const produceFXa = useCallback((): void => dispatch({ type: 'PRODUCE_FXA' }), []);
  const formProthrombinase = useCallback((): void => dispatch({ type: 'FORM_PROTHROMBINASE' }), []);
  const thrombinBurst = useCallback((): void => dispatch({ type: 'THROMBIN_BURST' }), []);

  // Fibrin formation
  const cleaveFibrinogen = useCallback((): void => dispatch({ type: 'CLEAVE_FIBRINOGEN' }), []);
  const polymerizeFibrin = useCallback((): void => dispatch({ type: 'POLYMERIZE_FIBRIN' }), []);
  const activateFXIII = useCallback((): void => dispatch({ type: 'ACTIVATE_FXIII' }), []);
  const crosslinkFibrin = useCallback((): void => dispatch({ type: 'CROSSLINK_FIBRIN' }), []);

  // Flow visualization
  const addFlow = useCallback((flow: FlowArrow): void => dispatch({ type: 'ADD_FLOW', flow }), []);
  const updateFlow = useCallback(
    (flowId: string, progress: number): void => dispatch({ type: 'UPDATE_FLOW', flowId, progress }),
    []
  );
  const removeFlow = useCallback((flowId: string): void => dispatch({ type: 'REMOVE_FLOW', flowId }), []);
  const clearFlows = useCallback((): void => dispatch({ type: 'CLEAR_FLOWS' }), []);

  // Learning control
  const completeCascade = useCallback((): void => dispatch({ type: 'COMPLETE_CASCADE' }), []);
  const restartLearning = useCallback((): void => dispatch({ type: 'RESTART_LEARNING' }), []);
  const setMode = useCallback((mode: PlayMode): void => dispatch({ type: 'SET_MODE', mode }), []);
  const setStepIndex = useCallback((index: number): void => dispatch({ type: 'SET_STEP_INDEX', index }), []);
  const advanceStep = useCallback((): void => dispatch({ type: 'ADVANCE_STEP' }), []);

  // Educational helpers - prerequisite checking
  const canProduceThrombin = useCallback((): boolean => {
    const { initiation } = state;
    return (
      initiation.tfVIIaDocked &&
      initiation.fxDocked &&
      initiation.fvDocked &&
      initiation.fiiDocked
    );
  }, [state]);

  const canTransitionToPropagating = useCallback((): boolean => {
    const { platelet } = state;
    return (
      platelet.plateletActivated &&
      platelet.fvaDocked &&
      platelet.fviiaDocked &&
      platelet.fixaArrived
    );
  }, [state]);

  const canFormTenase = useCallback((): boolean => {
    const { platelet } = state;
    return platelet.fviiaDocked && platelet.fixaArrived;
  }, [state]);

  const canFormProthrombinase = useCallback((): boolean => {
    const { platelet } = state;
    return platelet.fvaDocked && platelet.tenaseFormed;
  }, [state]);

  const canThrombinBurst = useCallback((): boolean => {
    return state.platelet.prothrombinaseFormed;
  }, [state]);

  const canCrosslink = useCallback((): boolean => {
    return state.platelet.fxiiiActivated && state.platelet.fibrinPolymerized;
  }, [state]);

  return {
    state,
    // Initiation
    dockTFVIIa,
    dockFIX,
    dockFX,
    dockFV,
    dockFII,
    produceThrombin,
    // Migration
    startFixaMigration,
    stopFixaMigration,
    startFiiaMigration,
    stopFiiaMigration,
    // Platelet phase
    thrombinArrives,
    setPlateletPhase,
    // Amplification
    splitVWF,
    activateFV,
    activateFVIII,
    activateFXI,
    activatePlatelet,
    dockFVa,
    dockFVIIIa,
    // PAR1 cleavage
    parThrombinBind,
    parCleave,
    parActivate,
    // Propagation
    fixaArrives,
    formTenase,
    produceFXa,
    formProthrombinase,
    thrombinBurst,
    // Fibrin formation
    cleaveFibrinogen,
    polymerizeFibrin,
    activateFXIII,
    crosslinkFibrin,
    // Flow visualization
    addFlow,
    updateFlow,
    removeFlow,
    clearFlows,
    // Learning control
    completeCascade,
    restartLearning,
    setMode,
    setStepIndex,
    advanceStep,
    // Helpers
    canProduceThrombin,
    canTransitionToPropagating,
    canFormTenase,
    canFormProthrombinase,
    canThrombinBurst,
    canCrosslink,
  };
}

// =============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// Re-export with old names to maintain compatibility during migration
// =============================================================================

// Type aliases for backward compatibility
export type SparkState = InitiationState;
export type ExplosionState = PlateletSurfaceState;
export type ExplosionPhase = PlateletPhase;
export type TwoFrameState = CascadeState;
export type TwoFrameStateHook = CascadeStateHook;

// Hook alias for backward compatibility
export const useTwoFrameState = useCascadeState;
