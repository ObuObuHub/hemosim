'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppState, LabInput, MedicationContext, ClinicalInterpretation, Factor, Hit4TCriteria, ISTHManualCriteria, InverseMappingResult } from '@/types';
import { createInitialFactors } from '@/engine/factors';
import { interpretLabValues, updateFactorsFromLab } from '@/engine/interpreter';
import { calculateFactorConcentrations } from '@/engine/inverse-mapping';

const STORAGE_KEY = 'hemosim_state';

const DEFAULT_LAB: LabInput = {
  pt: 12.0,
  inr: 1.0,
  aptt: 30.0,
  tt: 16.0,
  fibrinogen: 300,
  platelets: 250,
  dDimers: 200,
  bleedingTime: 5.0,
  mixingTest: 'not_performed',
};

const DEFAULT_MEDS: MedicationContext = {
  warfarin: false,
  heparin: false,
  lmwh: false,
  doacXa: false,
  doacIIa: false,
  antiplatelet: false,
};

const DEFAULT_HIT4T: Hit4TCriteria = {
  thrombocytopenia: 0,
  timing: 0,
  thrombosis: 0,
  otherCauses: 2, // Default: no other cause evident
};

const DEFAULT_ISTH_MANUAL: ISTHManualCriteria = {
  plateletCount: 0,
  dDimerLevel: 0,
  ptProlongation: 0,
  fibrinogenLevel: 0,
};

interface PersistedState {
  labInput: LabInput;
  medications: MedicationContext;
  hit4TCriteria: Hit4TCriteria;
  isthManualCriteria: ISTHManualCriteria;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<PersistedState>;
      return {
        labInput: { ...DEFAULT_LAB, ...parsed.labInput },
        medications: { ...DEFAULT_MEDS, ...parsed.medications },
        hit4TCriteria: { ...DEFAULT_HIT4T, ...parsed.hit4TCriteria },
        isthManualCriteria: { ...DEFAULT_ISTH_MANUAL, ...parsed.isthManualCriteria },
      };
    }
  } catch {
    // Invalid JSON or parsing error
  }
  return null;
}

function savePersistedState(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or not available - ignore
  }
}

export function useCoagulationState() {
  // Always start with defaults to match SSR
  const [labInput, setLabInput] = useState<LabInput>(DEFAULT_LAB);
  const [medications, setMedications] = useState<MedicationContext>(DEFAULT_MEDS);
  const [hit4TCriteria, setHit4TCriteria] = useState<Hit4TCriteria>(DEFAULT_HIT4T);
  const [isthManualCriteria, setIsthManualCriteria] = useState<ISTHManualCriteria>(DEFAULT_ISTH_MANUAL);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const hasHydrated = useRef(false);

  // Hydrate from localStorage after mount (client-only)
  // This pattern is intentional for SSR - we start with defaults on server,
  // then hydrate from localStorage on client to avoid hydration mismatch
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const persisted = loadPersistedState();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabInput(persisted.labInput);
      setMedications(persisted.medications);
      setHit4TCriteria(persisted.hit4TCriteria);
      setIsthManualCriteria(persisted.isthManualCriteria);
    }
  }, []);

  // Save state changes to localStorage (only after hydration)
  useEffect(() => {
    if (!hasHydrated.current) return;
    savePersistedState({ labInput, medications, hit4TCriteria, isthManualCriteria });
  }, [labInput, medications, hit4TCriteria, isthManualCriteria]);

  const [mode, setMode] = useState<'basic' | 'clinical'>('clinical');
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);
  const [baseFactors] = useState<Record<string, Factor>>(() => createInitialFactors());

  // Toggle-uri pentru vizualizare relații în cascadă
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInhibition, setShowInhibition] = useState(false);

  const interpretation = useMemo<ClinicalInterpretation>(() => {
    return interpretLabValues(labInput, medications, hit4TCriteria);
  }, [labInput, medications, hit4TCriteria]);

  // Calculează concentrațiile factorilor din valorile de laborator
  const factorConcentrations = useMemo<InverseMappingResult>(() => {
    return calculateFactorConcentrations(labInput, medications);
  }, [labInput, medications]);

  const factors = useMemo<Record<string, Factor>>(() => {
    return updateFactorsFromLab(baseFactors, labInput, interpretation, medications, currentScenario);
  }, [baseFactors, labInput, interpretation, medications, currentScenario]);

  const state: AppState = useMemo(() => ({
    labInput,
    medications,
    hit4TCriteria,
    interpretation,
    factors,
    mode,
    hoveredFactor,
    currentScenario,
    factorConcentrations,
    showFeedback,
    showInhibition,
  }), [labInput, medications, hit4TCriteria, interpretation, factors, mode, hoveredFactor, currentScenario, factorConcentrations, showFeedback, showInhibition]);

  const updateLabInput = useCallback((values: LabInput) => {
    setLabInput(values);
  }, []);

  const updateMedications = useCallback((meds: MedicationContext) => {
    setMedications(meds);
  }, []);

  const updateHit4TCriteria = useCallback((criteria: Hit4TCriteria) => {
    setHit4TCriteria(criteria);
  }, []);

  const updateIsthManualCriteria = useCallback((criteria: ISTHManualCriteria) => {
    setIsthManualCriteria(criteria);
  }, []);

  const reset = useCallback(() => {
    setLabInput(DEFAULT_LAB);
    setMedications(DEFAULT_MEDS);
    setHit4TCriteria(DEFAULT_HIT4T);
    setIsthManualCriteria(DEFAULT_ISTH_MANUAL);
    setCurrentScenario(null);
  }, []);

  const updateMode = useCallback((newMode: 'basic' | 'clinical') => {
    setMode(newMode);
  }, []);

  const updateHoveredFactor = useCallback((factorId: string | null) => {
    setHoveredFactor(factorId);
  }, []);

  return {
    state,
    updateLabInput,
    updateMedications,
    updateHit4TCriteria,
    updateIsthManualCriteria,
    isthManualCriteria,
    reset,
    setMode: updateMode,
    setHoveredFactor: updateHoveredFactor,
    setCurrentScenario,
    factorConcentrations,
    setShowFeedback,
    setShowInhibition,
  };
}
