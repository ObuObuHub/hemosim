// hooks/useSceneState.ts
'use client';

import { useReducer, useCallback } from 'react';
import type {
  GameScene,
  SceneObjective,
  DockedComplex,
  FloatingFactor,
  ActivationArrow,
  FibrinStrand,
  KineticState,
  DiffusingFIXaParticle,
  DiffusingFIIaParticle,
  TFPIXaComplexState,
} from '@/types/game';
import { INITIAL_KINETIC_STATE } from '@/types/game';

// =============================================================================
// STATE
// =============================================================================

export interface SceneState {
  currentScene: GameScene;
  floatingFactors: FloatingFactor[];
  dockedComplexes: DockedComplex[];
  activationArrows: ActivationArrow[];
  fibrinStrands: FibrinStrand[];
  objectives: SceneObjective[];
  thrombinCount: number;
  isTransitioning: boolean;

  // Kinetic simulation state (Initiation phase)
  kineticState: KineticState;
  diffusingFIXaParticles: DiffusingFIXaParticle[];
  diffusingFIIaParticles: DiffusingFIIaParticle[];
  tfpiXaComplex: TFPIXaComplexState;
}

const initialState: SceneState = {
  currentScene: 'initiation',
  floatingFactors: [],
  dockedComplexes: [],
  activationArrows: [],
  fibrinStrands: [],
  objectives: [],
  thrombinCount: 0,
  isTransitioning: false,

  // Kinetic simulation state
  kineticState: INITIAL_KINETIC_STATE,
  diffusingFIXaParticles: [],
  diffusingFIIaParticles: [],
  tfpiXaComplex: {
    isForming: false,
    formationProgress: 0,
    isInhibiting: false,
    inhibitionProgress: 0,
    position: { x: 0, y: 0 },
  },
};

// =============================================================================
// ACTIONS
// =============================================================================

type SceneAction =
  | { type: 'SET_SCENE'; scene: GameScene }
  | { type: 'ADD_FLOATING_FACTOR'; factor: FloatingFactor }
  | { type: 'REMOVE_FLOATING_FACTOR'; factorId: string }
  | { type: 'UPDATE_FLOATING_FACTORS'; factors: FloatingFactor[] }
  | { type: 'ADD_DOCKED_COMPLEX'; complex: DockedComplex }
  | { type: 'UPDATE_DOCKED_COMPLEX'; complexId: string; updates: Partial<DockedComplex> }
  | { type: 'REMOVE_DOCKED_COMPLEX'; complexId: string }
  | { type: 'ADD_ACTIVATION_ARROW'; arrow: ActivationArrow }
  | { type: 'REMOVE_ACTIVATION_ARROW'; arrowId: string }
  | { type: 'UPDATE_ACTIVATION_ARROW'; arrowId: string; updates: Partial<ActivationArrow> }
  | { type: 'ADD_FIBRIN_STRAND'; strand: FibrinStrand }
  | { type: 'REMOVE_FIBRIN_STRAND'; strandId: string }
  | { type: 'SET_OBJECTIVES'; objectives: SceneObjective[] }
  | { type: 'COMPLETE_OBJECTIVE'; objectiveId: string }
  | { type: 'INCREMENT_THROMBIN' }
  | { type: 'SET_THROMBIN_COUNT'; count: number }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'RESET' }
  // Kinetic state actions
  | { type: 'UPDATE_KINETIC_STATE'; kineticState: KineticState }
  | { type: 'EXPOSE_TF' }
  | { type: 'ADD_DIFFUSING_FIXA_PARTICLE'; particle: DiffusingFIXaParticle }
  | { type: 'UPDATE_DIFFUSING_FIXA_PARTICLES'; particles: DiffusingFIXaParticle[] }
  | { type: 'REMOVE_DIFFUSING_FIXA_PARTICLE'; particleId: string }
  | { type: 'ADD_DIFFUSING_FIIA_PARTICLE'; particle: DiffusingFIIaParticle }
  | { type: 'UPDATE_DIFFUSING_FIIA_PARTICLES'; particles: DiffusingFIIaParticle[] }
  | { type: 'REMOVE_DIFFUSING_FIIA_PARTICLE'; particleId: string }
  | { type: 'UPDATE_TFPI_XA_COMPLEX'; updates: Partial<TFPIXaComplexState> };

// =============================================================================
// REDUCER
// =============================================================================

function sceneReducer(state: SceneState, action: SceneAction): SceneState {
  switch (action.type) {
    case 'SET_SCENE':
      return { ...state, currentScene: action.scene };

    case 'ADD_FLOATING_FACTOR':
      return {
        ...state,
        floatingFactors: [...state.floatingFactors, action.factor],
      };

    case 'REMOVE_FLOATING_FACTOR':
      return {
        ...state,
        floatingFactors: state.floatingFactors.filter((f) => f.id !== action.factorId),
      };

    case 'UPDATE_FLOATING_FACTORS':
      return { ...state, floatingFactors: action.factors };

    case 'ADD_DOCKED_COMPLEX':
      return {
        ...state,
        dockedComplexes: [...state.dockedComplexes, action.complex],
      };

    case 'UPDATE_DOCKED_COMPLEX':
      return {
        ...state,
        dockedComplexes: state.dockedComplexes.map((c) =>
          c.id === action.complexId ? { ...c, ...action.updates } : c
        ),
      };

    case 'REMOVE_DOCKED_COMPLEX':
      return {
        ...state,
        dockedComplexes: state.dockedComplexes.filter((c) => c.id !== action.complexId),
      };

    case 'ADD_ACTIVATION_ARROW':
      return {
        ...state,
        activationArrows: [...state.activationArrows, action.arrow],
      };

    case 'REMOVE_ACTIVATION_ARROW':
      return {
        ...state,
        activationArrows: state.activationArrows.filter((a) => a.id !== action.arrowId),
      };

    case 'UPDATE_ACTIVATION_ARROW':
      return {
        ...state,
        activationArrows: state.activationArrows.map((a) =>
          a.id === action.arrowId ? { ...a, ...action.updates } : a
        ),
      };

    case 'ADD_FIBRIN_STRAND':
      return {
        ...state,
        fibrinStrands: [...state.fibrinStrands, action.strand],
      };

    case 'REMOVE_FIBRIN_STRAND':
      return {
        ...state,
        fibrinStrands: state.fibrinStrands.filter((s) => s.id !== action.strandId),
      };

    case 'SET_OBJECTIVES':
      return { ...state, objectives: action.objectives };

    case 'COMPLETE_OBJECTIVE':
      return {
        ...state,
        objectives: state.objectives.map((o) =>
          o.id === action.objectiveId ? { ...o, isComplete: true } : o
        ),
      };

    case 'INCREMENT_THROMBIN':
      return { ...state, thrombinCount: state.thrombinCount + 1 };

    case 'SET_THROMBIN_COUNT':
      return { ...state, thrombinCount: action.count };

    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.isTransitioning };

    case 'RESET':
      return initialState;

    // Kinetic state actions
    case 'UPDATE_KINETIC_STATE':
      return { ...state, kineticState: action.kineticState };

    case 'EXPOSE_TF':
      return {
        ...state,
        kineticState: { ...state.kineticState, isTFExposed: true },
      };

    case 'ADD_DIFFUSING_FIXA_PARTICLE':
      return {
        ...state,
        diffusingFIXaParticles: [...state.diffusingFIXaParticles, action.particle],
      };

    case 'UPDATE_DIFFUSING_FIXA_PARTICLES':
      return { ...state, diffusingFIXaParticles: action.particles };

    case 'REMOVE_DIFFUSING_FIXA_PARTICLE':
      return {
        ...state,
        diffusingFIXaParticles: state.diffusingFIXaParticles.filter(
          (p) => p.id !== action.particleId
        ),
      };

    case 'ADD_DIFFUSING_FIIA_PARTICLE':
      return {
        ...state,
        diffusingFIIaParticles: [...state.diffusingFIIaParticles, action.particle],
      };

    case 'UPDATE_DIFFUSING_FIIA_PARTICLES':
      return { ...state, diffusingFIIaParticles: action.particles };

    case 'REMOVE_DIFFUSING_FIIA_PARTICLE':
      return {
        ...state,
        diffusingFIIaParticles: state.diffusingFIIaParticles.filter(
          (p) => p.id !== action.particleId
        ),
      };

    case 'UPDATE_TFPI_XA_COMPLEX':
      return {
        ...state,
        tfpiXaComplex: { ...state.tfpiXaComplex, ...action.updates },
      };

    default:
      return state;
  }
}

// =============================================================================
// HOOK INTERFACE
// =============================================================================

export interface SceneStateHook {
  state: SceneState;
  // Scene management
  setScene: (scene: GameScene) => void;
  setTransitioning: (isTransitioning: boolean) => void;
  reset: () => void;
  // Floating factors
  addFloatingFactor: (factor: FloatingFactor) => void;
  removeFloatingFactor: (factorId: string) => void;
  updateFloatingFactors: (factors: FloatingFactor[]) => void;
  // Docked complexes
  addDockedComplex: (complex: DockedComplex) => void;
  updateDockedComplex: (complexId: string, updates: Partial<DockedComplex>) => void;
  removeDockedComplex: (complexId: string) => void;
  // Activation arrows
  addActivationArrow: (arrow: ActivationArrow) => void;
  removeActivationArrow: (arrowId: string) => void;
  updateActivationArrow: (arrowId: string, updates: Partial<ActivationArrow>) => void;
  // Fibrin strands
  addFibrinStrand: (strand: FibrinStrand) => void;
  removeFibrinStrand: (strandId: string) => void;
  // Objectives
  setObjectives: (objectives: SceneObjective[]) => void;
  completeObjective: (objectiveId: string) => void;
  // Thrombin
  incrementThrombin: () => void;
  setThrombinCount: (count: number) => void;
  // Kinetic state management
  updateKineticState: (kineticState: KineticState) => void;
  exposeTF: () => void;
  addDiffusingFIXaParticle: (particle: DiffusingFIXaParticle) => void;
  updateDiffusingFIXaParticles: (particles: DiffusingFIXaParticle[]) => void;
  removeDiffusingFIXaParticle: (particleId: string) => void;
  addDiffusingFIIaParticle: (particle: DiffusingFIIaParticle) => void;
  updateDiffusingFIIaParticles: (particles: DiffusingFIIaParticle[]) => void;
  removeDiffusingFIIaParticle: (particleId: string) => void;
  updateTFPIXaComplex: (updates: Partial<TFPIXaComplexState>) => void;
  // Helpers
  areAllObjectivesComplete: () => boolean;
  getObjectiveById: (objectiveId: string) => SceneObjective | undefined;
  getDockedComplexById: (complexId: string) => DockedComplex | undefined;
  getFloatingFactorById: (factorId: string) => FloatingFactor | undefined;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useSceneState(): SceneStateHook {
  const [state, dispatch] = useReducer(sceneReducer, initialState);

  // Scene management
  const setScene = useCallback((scene: GameScene): void => {
    dispatch({ type: 'SET_SCENE', scene });
  }, []);

  const setTransitioning = useCallback((isTransitioning: boolean): void => {
    dispatch({ type: 'SET_TRANSITIONING', isTransitioning });
  }, []);

  const reset = useCallback((): void => {
    dispatch({ type: 'RESET' });
  }, []);

  // Floating factors
  const addFloatingFactor = useCallback((factor: FloatingFactor): void => {
    dispatch({ type: 'ADD_FLOATING_FACTOR', factor });
  }, []);

  const removeFloatingFactor = useCallback((factorId: string): void => {
    dispatch({ type: 'REMOVE_FLOATING_FACTOR', factorId });
  }, []);

  const updateFloatingFactors = useCallback((factors: FloatingFactor[]): void => {
    dispatch({ type: 'UPDATE_FLOATING_FACTORS', factors });
  }, []);

  // Docked complexes
  const addDockedComplex = useCallback((complex: DockedComplex): void => {
    dispatch({ type: 'ADD_DOCKED_COMPLEX', complex });
  }, []);

  const updateDockedComplex = useCallback(
    (complexId: string, updates: Partial<DockedComplex>): void => {
      dispatch({ type: 'UPDATE_DOCKED_COMPLEX', complexId, updates });
    },
    []
  );

  const removeDockedComplex = useCallback((complexId: string): void => {
    dispatch({ type: 'REMOVE_DOCKED_COMPLEX', complexId });
  }, []);

  // Activation arrows
  const addActivationArrow = useCallback((arrow: ActivationArrow): void => {
    dispatch({ type: 'ADD_ACTIVATION_ARROW', arrow });
  }, []);

  const removeActivationArrow = useCallback((arrowId: string): void => {
    dispatch({ type: 'REMOVE_ACTIVATION_ARROW', arrowId });
  }, []);

  const updateActivationArrow = useCallback(
    (arrowId: string, updates: Partial<ActivationArrow>): void => {
      dispatch({ type: 'UPDATE_ACTIVATION_ARROW', arrowId, updates });
    },
    []
  );

  // Fibrin strands
  const addFibrinStrand = useCallback((strand: FibrinStrand): void => {
    dispatch({ type: 'ADD_FIBRIN_STRAND', strand });
  }, []);

  const removeFibrinStrand = useCallback((strandId: string): void => {
    dispatch({ type: 'REMOVE_FIBRIN_STRAND', strandId });
  }, []);

  // Objectives
  const setObjectives = useCallback((objectives: SceneObjective[]): void => {
    dispatch({ type: 'SET_OBJECTIVES', objectives });
  }, []);

  const completeObjective = useCallback((objectiveId: string): void => {
    dispatch({ type: 'COMPLETE_OBJECTIVE', objectiveId });
  }, []);

  // Thrombin
  const incrementThrombin = useCallback((): void => {
    dispatch({ type: 'INCREMENT_THROMBIN' });
  }, []);

  const setThrombinCount = useCallback((count: number): void => {
    dispatch({ type: 'SET_THROMBIN_COUNT', count });
  }, []);

  // Kinetic state management
  const updateKineticState = useCallback((kineticState: KineticState): void => {
    dispatch({ type: 'UPDATE_KINETIC_STATE', kineticState });
  }, []);

  const exposeTF = useCallback((): void => {
    dispatch({ type: 'EXPOSE_TF' });
  }, []);

  const addDiffusingFIXaParticle = useCallback(
    (particle: DiffusingFIXaParticle): void => {
      dispatch({ type: 'ADD_DIFFUSING_FIXA_PARTICLE', particle });
    },
    []
  );

  const updateDiffusingFIXaParticles = useCallback(
    (particles: DiffusingFIXaParticle[]): void => {
      dispatch({ type: 'UPDATE_DIFFUSING_FIXA_PARTICLES', particles });
    },
    []
  );

  const removeDiffusingFIXaParticle = useCallback((particleId: string): void => {
    dispatch({ type: 'REMOVE_DIFFUSING_FIXA_PARTICLE', particleId });
  }, []);

  const addDiffusingFIIaParticle = useCallback(
    (particle: DiffusingFIIaParticle): void => {
      dispatch({ type: 'ADD_DIFFUSING_FIIA_PARTICLE', particle });
    },
    []
  );

  const updateDiffusingFIIaParticles = useCallback(
    (particles: DiffusingFIIaParticle[]): void => {
      dispatch({ type: 'UPDATE_DIFFUSING_FIIA_PARTICLES', particles });
    },
    []
  );

  const removeDiffusingFIIaParticle = useCallback((particleId: string): void => {
    dispatch({ type: 'REMOVE_DIFFUSING_FIIA_PARTICLE', particleId });
  }, []);

  const updateTFPIXaComplex = useCallback(
    (updates: Partial<TFPIXaComplexState>): void => {
      dispatch({ type: 'UPDATE_TFPI_XA_COMPLEX', updates });
    },
    []
  );

  // Helpers
  const areAllObjectivesComplete = useCallback((): boolean => {
    return state.objectives.length > 0 && state.objectives.every((o) => o.isComplete);
  }, [state.objectives]);

  const getObjectiveById = useCallback(
    (objectiveId: string): SceneObjective | undefined => {
      return state.objectives.find((o) => o.id === objectiveId);
    },
    [state.objectives]
  );

  const getDockedComplexById = useCallback(
    (complexId: string): DockedComplex | undefined => {
      return state.dockedComplexes.find((c) => c.id === complexId);
    },
    [state.dockedComplexes]
  );

  const getFloatingFactorById = useCallback(
    (factorId: string): FloatingFactor | undefined => {
      return state.floatingFactors.find((f) => f.id === factorId);
    },
    [state.floatingFactors]
  );

  return {
    state,
    // Scene management
    setScene,
    setTransitioning,
    reset,
    // Floating factors
    addFloatingFactor,
    removeFloatingFactor,
    updateFloatingFactors,
    // Docked complexes
    addDockedComplex,
    updateDockedComplex,
    removeDockedComplex,
    // Activation arrows
    addActivationArrow,
    removeActivationArrow,
    updateActivationArrow,
    // Fibrin strands
    addFibrinStrand,
    removeFibrinStrand,
    // Objectives
    setObjectives,
    completeObjective,
    // Thrombin
    incrementThrombin,
    setThrombinCount,
    // Kinetic state management
    updateKineticState,
    exposeTF,
    addDiffusingFIXaParticle,
    updateDiffusingFIXaParticles,
    removeDiffusingFIXaParticle,
    addDiffusingFIIaParticle,
    updateDiffusingFIIaParticles,
    removeDiffusingFIIaParticle,
    updateTFPIXaComplex,
    // Helpers
    areAllObjectivesComplete,
    getObjectiveById,
    getDockedComplexById,
    getFloatingFactorById,
  };
}
