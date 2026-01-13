'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AppState, LabInput, MedicationContext, ClinicalInterpretation, Factor, Hit4TCriteria } from '@/types';
import { createInitialFactors } from '@/engine/factors';
import { interpretLabValues, updateFactorsFromLab } from '@/engine/interpreter';

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
  doac: false,
  antiplatelet: false,
};

const DEFAULT_HIT4T: Hit4TCriteria = {
  thrombocytopenia: 0,
  timing: 0,
  thrombosis: 0,
  otherCauses: 2, // Default: no other cause evident
};

interface PersistedState {
  labInput: LabInput;
  medications: MedicationContext;
  hit4TCriteria: Hit4TCriteria;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<PersistedState>;
      // Validate and merge with defaults to handle schema changes
      return {
        labInput: { ...DEFAULT_LAB, ...parsed.labInput },
        medications: { ...DEFAULT_MEDS, ...parsed.medications },
        hit4TCriteria: { ...DEFAULT_HIT4T, ...parsed.hit4TCriteria },
      };
    }
  } catch {
    // Invalid JSON or parsing error - use defaults
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
  const [labInput, setLabInput] = useState<LabInput>(DEFAULT_LAB);
  const [medications, setMedications] = useState<MedicationContext>(DEFAULT_MEDS);
  const [hit4TCriteria, setHit4TCriteria] = useState<Hit4TCriteria>(DEFAULT_HIT4T);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load persisted state on mount (client-side only)
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setLabInput(persisted.labInput);
      setMedications(persisted.medications);
      setHit4TCriteria(persisted.hit4TCriteria);
    }
    setIsHydrated(true);
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    savePersistedState({ labInput, medications, hit4TCriteria });
  }, [labInput, medications, hit4TCriteria, isHydrated]);

  const [mode, setMode] = useState<'basic' | 'clinical'>('clinical');
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);
  const [baseFactors] = useState<Record<string, Factor>>(() => createInitialFactors());

  const interpretation = useMemo<ClinicalInterpretation>(() => {
    return interpretLabValues(labInput, medications, hit4TCriteria);
  }, [labInput, medications, hit4TCriteria]);

  const factors = useMemo<Record<string, Factor>>(() => {
    return updateFactorsFromLab(baseFactors, labInput, interpretation);
  }, [baseFactors, labInput, interpretation]);

  const state: AppState = useMemo(() => ({
    labInput,
    medications,
    hit4TCriteria,
    interpretation,
    factors,
    mode,
    hoveredFactor,
  }), [labInput, medications, hit4TCriteria, interpretation, factors, mode, hoveredFactor]);

  const updateLabInput = useCallback((values: LabInput) => {
    setLabInput(values);
  }, []);

  const updateMedications = useCallback((meds: MedicationContext) => {
    setMedications(meds);
  }, []);

  const updateHit4TCriteria = useCallback((criteria: Hit4TCriteria) => {
    setHit4TCriteria(criteria);
  }, []);

  const reset = useCallback(() => {
    setLabInput(DEFAULT_LAB);
    setMedications(DEFAULT_MEDS);
    setHit4TCriteria(DEFAULT_HIT4T);
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
    reset,
    setMode: updateMode,
    setHoveredFactor: updateHoveredFactor,
  };
}
