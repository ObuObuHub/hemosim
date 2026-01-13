'use client';

import { CascadeCanvas } from '@/components/CascadeCanvas';
import { LabInputPanel } from '@/components/LabInputPanel';
import { InterpretationPanel } from '@/components/InterpretationPanel';
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-800">
            Calculator și simulator hemostază
          </h1>
          <span className="text-sm text-slate-500">
            @ Dr. Chiper • <a href="mailto:drchiperleferman@gmail.com" className="hover:text-blue-600 hover:underline">drchiperleferman@gmail.com</a>
          </span>
        </div>

        {state.interpretation && state.interpretation.affectedPathway !== 'none' && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            state.interpretation.warnings.length > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              state.interpretation.warnings.length > 0 ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className={`text-sm font-medium ${
              state.interpretation.warnings.length > 0 ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {state.interpretation.pattern}
            </span>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left panel - Lab Input */}
        <aside className="flex-shrink-0 w-64 overflow-hidden">
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

        {/* Center - Canvas */}
        <main className="flex-1 overflow-hidden">
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

        {/* Right panel - Interpretation */}
        <aside className="flex-shrink-0 w-80 overflow-hidden">
          <InterpretationPanel
            interpretation={state.interpretation}
          />
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 h-10 flex items-center justify-center bg-white border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Introduceți valori laborator • Vizualizare automată a cascadei afectate • Diagnostic diferențial și recomandări
        </p>
      </footer>
    </div>
  );
}
