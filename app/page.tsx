'use client';

import { useState, useCallback } from 'react';
import { CascadeCanvas } from '@/components/CascadeCanvas';
import { LabInputPanel } from '@/components/LabInputPanel';
import { InterpretationPanel } from '@/components/InterpretationPanel';
import { MobileLayout } from '@/components/MobileLayout';
import { DisclaimerPopup } from '@/components/DisclaimerPopup';
import { useCoagulationState } from '@/hooks/useCoagulationState';

export default function Home(): React.ReactElement {
  const {
    state,
    updateLabInput,
    updateMedications,
    updateHit4TCriteria,
    updateIsthManualCriteria,
    isthManualCriteria,
    reset,
    setHoveredFactor,
    setCurrentScenario,
    setShowFeedback,
    setShowInhibition,
  } = useCoagulationState();

  const [hoveredLabValue, setHoveredLabValue] = useState<string | null>(null);
  const [blockedFactors, setBlockedFactors] = useState<Set<string>>(new Set());

  const handleFactorClick = useCallback((factorId: string): void => {
    setBlockedFactors(prev => {
      const next = new Set(prev);
      if (next.has(factorId)) {
        next.delete(factorId);
      } else {
        next.add(factorId);
      }
      return next;
    });
  }, []);

  const hasAbnormality = state.interpretation && state.interpretation.affectedPathway !== 'none';
  const hasWarning = state.interpretation && state.interpretation.warnings.length > 0;
  // Show scenario name if selected, otherwise show pattern
  const headerLabel = state.currentScenario || state.interpretation?.pattern;

  return (
    <>
      {/* Disclaimer Popup - shown on both desktop and mobile */}
      <DisclaimerPopup />

      {/* Desktop Layout - 3 columns */}
      <div className="hidden md:flex h-screen w-screen flex-col overflow-hidden bg-slate-50">
        {/* Desktop Header */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              Calculator și simulator hemostază
            </h1>
            <span className="text-sm text-slate-500">
              @ Dr. Chiper • <a href="mailto:drchiperleferman@gmail.com" className="text-blue-500 hover:text-blue-600 hover:underline">drchiperleferman@gmail.com</a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle-uri relații */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFeedback(!state.showFeedback)}
                className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                  state.showFeedback
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                }`}
                title="Arată buclele de feedback pozitiv (trombina activează V, VIII, XI)"
              >
                {state.showFeedback ? '⟳ Feedback ON' : '⟳ Feedback'}
              </button>
              <button
                onClick={() => setShowInhibition(!state.showInhibition)}
                className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                  state.showInhibition
                    ? 'bg-slate-200 text-slate-700 border border-slate-400'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                }`}
                title="Arată relațiile de inhibiție (AT, PC/PS)"
              >
                {state.showInhibition ? '⊣ Inhibiție ON' : '⊣ Inhibiție'}
              </button>
            </div>

          {(hasAbnormality || state.currentScenario) && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              hasWarning ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className={`text-sm font-medium ${hasWarning ? 'text-red-700' : 'text-yellow-700'}`}>
                {headerLabel}
              </span>
            </div>
          )}
          </div>
        </header>

        {/* Desktop Main content */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          <aside className="flex-shrink-0 w-64 lg:w-72 overflow-hidden">
            <LabInputPanel
              values={state.labInput}
              medications={state.medications}
              onChange={updateLabInput}
              onMedicationChange={updateMedications}
              onReset={reset}
              onScenarioChange={setCurrentScenario}
              onLabHover={setHoveredLabValue}
            />
          </aside>

          <main className="flex-1 overflow-hidden min-w-0">
            <div className="panel h-full">
              <CascadeCanvas
                factors={state.factors}
                mode={state.mode}
                hoveredFactor={state.hoveredFactor}
                hoveredLabValue={hoveredLabValue}
                dDimers={state.labInput.dDimers}
                dicPhase={null}
                onFactorHover={setHoveredFactor}
                blockedFactors={blockedFactors}
                onFactorClick={handleFactorClick}
                showFeedback={state.showFeedback}
                showInhibition={state.showInhibition}
                currentScenario={state.currentScenario}
              />
            </div>
          </main>

          <aside className="flex-shrink-0 w-72 lg:w-80 overflow-hidden">
            <InterpretationPanel
              interpretation={state.interpretation}
              hit4TCriteria={state.hit4TCriteria}
              isthManualCriteria={isthManualCriteria}
              medications={state.medications}
              labInput={state.labInput}
              onHit4TCriteriaChange={updateHit4TCriteria}
              onIsthManualCriteriaChange={updateIsthManualCriteria}
              currentScenario={state.currentScenario}
            />
          </aside>
        </div>

      </div>

      {/* Mobile Layout - Tab navigation */}
      <MobileLayout
        state={state}
        updateLabInput={updateLabInput}
        updateMedications={updateMedications}
        updateHit4TCriteria={updateHit4TCriteria}
        updateIsthManualCriteria={updateIsthManualCriteria}
        isthManualCriteria={isthManualCriteria}
        reset={reset}
        setHoveredFactor={setHoveredFactor}
        setCurrentScenario={setCurrentScenario}
      />
    </>
  );
}
