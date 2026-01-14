'use client';

import { CascadeCanvas } from '@/components/CascadeCanvas';
import { LabInputPanel } from '@/components/LabInputPanel';
import { InterpretationPanel } from '@/components/InterpretationPanel';
import { MobileLayout } from '@/components/MobileLayout';
import { useCoagulationState } from '@/hooks/useCoagulationState';

export default function Home(): React.ReactElement {
  const {
    state,
    updateLabInput,
    updateMedications,
    updateHit4TCriteria,
    reset,
    setHoveredFactor,
  } = useCoagulationState();

  const hasAbnormality = state.interpretation && state.interpretation.affectedPathway !== 'none';
  const hasWarning = state.interpretation && state.interpretation.warnings.length > 0;

  return (
    <>
      {/* Desktop Layout - 3 columns */}
      <div className="hidden md:flex h-screen w-screen flex-col overflow-hidden bg-slate-50">
        {/* Desktop Header */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              Calculator și simulator hemostază
            </h1>
            <span className="text-sm text-slate-500">
              @ Dr. Chiper • <a href="mailto:drchiperleferman@gmail.com" className="hover:text-blue-600 hover:underline">drchiperleferman@gmail.com</a>
            </span>
          </div>

          {hasAbnormality && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              hasWarning ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className={`text-sm font-medium ${hasWarning ? 'text-red-700' : 'text-yellow-700'}`}>
                {state.interpretation?.pattern}
              </span>
            </div>
          )}
        </header>

        {/* Desktop Main content */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          <aside className="flex-shrink-0 w-64 lg:w-72 overflow-hidden">
            <LabInputPanel
              values={state.labInput}
              medications={state.medications}
              hit4TCriteria={state.hit4TCriteria}
              onChange={updateLabInput}
              onMedicationChange={updateMedications}
              onHit4TCriteriaChange={updateHit4TCriteria}
              onReset={reset}
            />
          </aside>

          <main className="flex-1 overflow-hidden min-w-0">
            <div className="panel h-full">
              <CascadeCanvas
                factors={state.factors}
                mode={state.mode}
                hoveredFactor={state.hoveredFactor}
                hoveredLabValue={null}
                dicPhase={null}
                onFactorHover={setHoveredFactor}
              />
            </div>
          </main>

          <aside className="flex-shrink-0 w-72 lg:w-80 overflow-hidden">
            <InterpretationPanel interpretation={state.interpretation} />
          </aside>
        </div>

        {/* Desktop Footer */}
        <footer className="flex-shrink-0 h-10 flex items-center justify-center bg-white border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Introduceți valori laborator • Vizualizare cascadă • Diagnostic diferențial
          </p>
        </footer>
      </div>

      {/* Mobile Layout - Tab navigation */}
      <MobileLayout
        state={state}
        updateLabInput={updateLabInput}
        updateMedications={updateMedications}
        updateHit4TCriteria={updateHit4TCriteria}
        reset={reset}
        setHoveredFactor={setHoveredFactor}
      />
    </>
  );
}
