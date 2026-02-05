// hooks/useThreePanelState.ts
'use client';

import { useReducer, useCallback } from 'react';

// =============================================================================
// STATE TYPES
// =============================================================================

export interface InitiationState {
  tfVIIaDocked: boolean;
  fixDocked: boolean;
  fxDocked: boolean;
  fvDocked: boolean;
  fiiDocked: boolean;
  thrombinProduced: boolean;
}

export type PARCleavageState = 'intact' | 'thrombin-bound' | 'cleaved' | 'activated';

export interface AmplificationState {
  vwfSplit: boolean;
  fvActivated: boolean;
  fviiiActivated: boolean;
  fxiActivated: boolean;
  plateletActivated: boolean;
  // Cofactor membrane binding (for propagation readiness)
  fvaDocked: boolean;    // FVa bound to platelet membrane
  fviiiaDocked: boolean;  // FVIIIa bound to platelet membrane
  // PAR1 receptor cleavage state
  parCleavageState: PARCleavageState;
  // FIXa arrival at amplification (before going to propagation)
  fixaAtAmplification: boolean;
}

export interface PropagationState {
  fixaArrived: boolean;
  tenaseFormed: boolean;
  prothrombinaseFormed: boolean;
  thrombinBurst: boolean;
}

export interface FlowArrow {
  id: string;
  from: 'initiation' | 'amplification' | 'propagation';
  to: 'initiation' | 'amplification' | 'propagation';
  factor: string;
  progress: number; // 0-1 animation progress
  isActive: boolean;
  // Particle animation props
  showTravelingParticle?: boolean;
  particleSize?: number;
  travelDuration?: string;
  particleKey?: string | number; // Unique key to restart animation
}

export interface ThreePanelState {
  initiation: InitiationState;
  amplification: AmplificationState;
  propagation: PropagationState;
  activeFlows: FlowArrow[];
  isComplete: boolean;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ThreePanelState = {
  initiation: {
    tfVIIaDocked: false,
    fixDocked: false,
    fxDocked: false,
    fvDocked: false,
    fiiDocked: false,
    thrombinProduced: false,
  },
  amplification: {
    vwfSplit: false,
    fvActivated: false,
    fviiiActivated: false,
    fxiActivated: false,
    plateletActivated: false,
    fvaDocked: false,
    fviiiaDocked: false,
    parCleavageState: 'intact',
    fixaAtAmplification: false,
  },
  propagation: {
    fixaArrived: false,
    tenaseFormed: false,
    prothrombinaseFormed: false,
    thrombinBurst: false,
  },
  activeFlows: [],
  isComplete: false,
};

// =============================================================================
// ACTIONS
// =============================================================================

type ThreePanelAction =
  // Initiation actions
  | { type: 'DOCK_TF_VIIA' }
  | { type: 'DOCK_FIX' }
  | { type: 'DOCK_FX' }
  | { type: 'DOCK_FV' }
  | { type: 'DOCK_FII' }
  | { type: 'PRODUCE_THROMBIN' }
  // Amplification actions
  | { type: 'SPLIT_VWF' }
  | { type: 'ACTIVATE_FV' }
  | { type: 'ACTIVATE_FVIII' }
  | { type: 'ACTIVATE_FXI' }
  | { type: 'ACTIVATE_PLATELET' }
  | { type: 'DOCK_FVA' }      // FVa binds to platelet membrane
  | { type: 'DOCK_FVIIIA' }   // FVIIIa binds to platelet membrane
  | { type: 'FIXA_AT_AMPLIFICATION' }  // FIXa arrives at amplification border
  // PAR1 cleavage actions
  | { type: 'PAR_THROMBIN_BIND' }
  | { type: 'PAR_CLEAVE' }
  | { type: 'PAR_ACTIVATE' }
  // Propagation actions
  | { type: 'FIXA_ARRIVES' }
  | { type: 'FORM_TENASE' }
  | { type: 'FORM_PROTHROMBINASE' }
  | { type: 'THROMBIN_BURST' }
  // Flow arrow actions
  | { type: 'ADD_FLOW'; flow: FlowArrow }
  | { type: 'UPDATE_FLOW'; flowId: string; progress: number }
  | { type: 'REMOVE_FLOW'; flowId: string }
  | { type: 'CLEAR_FLOWS' }
  // General actions
  | { type: 'COMPLETE_GAME' }
  | { type: 'RESET' };

// =============================================================================
// REDUCER
// =============================================================================

function threePanelReducer(state: ThreePanelState, action: ThreePanelAction): ThreePanelState {
  switch (action.type) {
    // Initiation
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

    // Amplification
    case 'SPLIT_VWF':
      return { ...state, amplification: { ...state.amplification, vwfSplit: true } };
    case 'ACTIVATE_FV':
      return { ...state, amplification: { ...state.amplification, fvActivated: true } };
    case 'ACTIVATE_FVIII':
      return { ...state, amplification: { ...state.amplification, fviiiActivated: true } };
    case 'ACTIVATE_FXI':
      return { ...state, amplification: { ...state.amplification, fxiActivated: true } };
    case 'ACTIVATE_PLATELET':
      return { ...state, amplification: { ...state.amplification, plateletActivated: true } };
    case 'DOCK_FVA':
      return { ...state, amplification: { ...state.amplification, fvaDocked: true } };
    case 'DOCK_FVIIIA':
      return { ...state, amplification: { ...state.amplification, fviiiaDocked: true } };
    case 'FIXA_AT_AMPLIFICATION':
      return { ...state, amplification: { ...state.amplification, fixaAtAmplification: true } };

    // PAR1 cleavage states
    case 'PAR_THROMBIN_BIND':
      return { ...state, amplification: { ...state.amplification, parCleavageState: 'thrombin-bound' } };
    case 'PAR_CLEAVE':
      return { ...state, amplification: { ...state.amplification, parCleavageState: 'cleaved' } };
    case 'PAR_ACTIVATE':
      return { ...state, amplification: { ...state.amplification, parCleavageState: 'activated' } };

    // Propagation
    case 'FIXA_ARRIVES':
      return { ...state, propagation: { ...state.propagation, fixaArrived: true } };
    case 'FORM_TENASE':
      return { ...state, propagation: { ...state.propagation, tenaseFormed: true } };
    case 'FORM_PROTHROMBINASE':
      return { ...state, propagation: { ...state.propagation, prothrombinaseFormed: true } };
    case 'THROMBIN_BURST':
      return { ...state, propagation: { ...state.propagation, thrombinBurst: true } };

    // Flow arrows
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

    // General
    case 'COMPLETE_GAME':
      return { ...state, isComplete: true };
    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// =============================================================================
// HOOK INTERFACE
// =============================================================================

export interface ThreePanelStateHook {
  state: ThreePanelState;
  // Initiation actions
  dockTFVIIa: () => void;
  dockFIX: () => void;
  dockFX: () => void;
  dockFV: () => void;
  dockFII: () => void;
  produceThrombin: () => void;
  // Amplification actions
  splitVWF: () => void;
  activateFV: () => void;
  activateFVIII: () => void;
  activateFXI: () => void;
  activatePlatelet: () => void;
  dockFVa: () => void;
  dockFVIIIa: () => void;
  fixaAtAmplification: () => void;
  // PAR1 cleavage actions
  parThrombinBind: () => void;
  parCleave: () => void;
  parActivate: () => void;
  // Propagation actions
  fixaArrives: () => void;
  formTenase: () => void;
  formProthrombinase: () => void;
  thrombinBurst: () => void;
  // Flow arrow actions
  addFlow: (flow: FlowArrow) => void;
  updateFlow: (flowId: string, progress: number) => void;
  removeFlow: (flowId: string) => void;
  clearFlows: () => void;
  // General
  completeGame: () => void;
  reset: () => void;
  // Helpers
  canProduceThrombin: () => boolean;
  canFormTenase: () => boolean;
  canFormProthrombinase: () => boolean;
  canThrombinBurst: () => boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useThreePanelState(): ThreePanelStateHook {
  const [state, dispatch] = useReducer(threePanelReducer, initialState);

  // Initiation actions
  const dockTFVIIa = useCallback((): void => dispatch({ type: 'DOCK_TF_VIIA' }), []);
  const dockFIX = useCallback((): void => dispatch({ type: 'DOCK_FIX' }), []);
  const dockFX = useCallback((): void => dispatch({ type: 'DOCK_FX' }), []);
  const dockFV = useCallback((): void => dispatch({ type: 'DOCK_FV' }), []);
  const dockFII = useCallback((): void => dispatch({ type: 'DOCK_FII' }), []);
  const produceThrombin = useCallback((): void => dispatch({ type: 'PRODUCE_THROMBIN' }), []);

  // Amplification actions
  const splitVWF = useCallback((): void => dispatch({ type: 'SPLIT_VWF' }), []);
  const activateFV = useCallback((): void => dispatch({ type: 'ACTIVATE_FV' }), []);
  const activateFVIII = useCallback((): void => dispatch({ type: 'ACTIVATE_FVIII' }), []);
  const activateFXI = useCallback((): void => dispatch({ type: 'ACTIVATE_FXI' }), []);
  const activatePlatelet = useCallback((): void => dispatch({ type: 'ACTIVATE_PLATELET' }), []);
  const dockFVa = useCallback((): void => dispatch({ type: 'DOCK_FVA' }), []);
  const dockFVIIIa = useCallback((): void => dispatch({ type: 'DOCK_FVIIIA' }), []);
  const fixaAtAmplificationAction = useCallback((): void => dispatch({ type: 'FIXA_AT_AMPLIFICATION' }), []);

  // PAR1 cleavage actions
  const parThrombinBind = useCallback((): void => dispatch({ type: 'PAR_THROMBIN_BIND' }), []);
  const parCleave = useCallback((): void => dispatch({ type: 'PAR_CLEAVE' }), []);
  const parActivate = useCallback((): void => dispatch({ type: 'PAR_ACTIVATE' }), []);

  // Propagation actions
  const fixaArrives = useCallback((): void => dispatch({ type: 'FIXA_ARRIVES' }), []);
  const formTenase = useCallback((): void => dispatch({ type: 'FORM_TENASE' }), []);
  const formProthrombinase = useCallback((): void => dispatch({ type: 'FORM_PROTHROMBINASE' }), []);
  const thrombinBurst = useCallback((): void => dispatch({ type: 'THROMBIN_BURST' }), []);

  // Flow arrow actions
  const addFlow = useCallback((flow: FlowArrow): void => dispatch({ type: 'ADD_FLOW', flow }), []);
  const updateFlow = useCallback(
    (flowId: string, progress: number): void => dispatch({ type: 'UPDATE_FLOW', flowId, progress }),
    []
  );
  const removeFlow = useCallback((flowId: string): void => dispatch({ type: 'REMOVE_FLOW', flowId }), []);
  const clearFlows = useCallback((): void => dispatch({ type: 'CLEAR_FLOWS' }), []);

  // General
  const completeGame = useCallback((): void => dispatch({ type: 'COMPLETE_GAME' }), []);
  const reset = useCallback((): void => dispatch({ type: 'RESET' }), []);

  // Helpers
  const canProduceThrombin = useCallback((): boolean => {
    const { initiation } = state;
    return (
      initiation.tfVIIaDocked &&
      initiation.fxDocked &&
      initiation.fvDocked &&
      initiation.fiiDocked
    );
  }, [state]);

  const canFormTenase = useCallback((): boolean => {
    const { amplification, propagation } = state;
    // Requires FVIIIa docked on membrane + FIXa arrival
    return amplification.fviiiaDocked && propagation.fixaArrived;
  }, [state]);

  const canFormProthrombinase = useCallback((): boolean => {
    const { amplification, propagation } = state;
    // Requires FVa docked on membrane + Tenase formed (produces FXa)
    return amplification.fvaDocked && propagation.tenaseFormed;
  }, [state]);

  const canThrombinBurst = useCallback((): boolean => {
    return state.propagation.prothrombinaseFormed;
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
    // Amplification
    splitVWF,
    activateFV,
    activateFVIII,
    activateFXI,
    activatePlatelet,
    dockFVa,
    dockFVIIIa,
    fixaAtAmplification: fixaAtAmplificationAction,
    // PAR1 cleavage
    parThrombinBind,
    parCleave,
    parActivate,
    // Propagation
    fixaArrives,
    formTenase,
    formProthrombinase,
    thrombinBurst,
    // Flow arrows
    addFlow,
    updateFlow,
    removeFlow,
    clearFlows,
    // General
    completeGame,
    reset,
    // Helpers
    canProduceThrombin,
    canFormTenase,
    canFormProthrombinase,
    canThrombinBurst,
  };
}
