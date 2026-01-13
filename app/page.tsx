'use client';

import { useState } from 'react';
import { CascadeCanvas } from '@/components/CascadeCanvas';
import { LabInputPanel } from '@/components/LabInputPanel';
import { InterpretationPanel } from '@/components/InterpretationPanel';
import { useCoagulationState } from '@/hooks/useCoagulationState';

type MobileTab = 'lab' | 'cascade' | 'results';

export default function Home(): React.ReactElement {
  const {
    state,
    updateLabInput,
    updateMedications,
    updateHit4TCriteria,
    reset,
    setHoveredFactor,
  } = useCoagulationState();

  const [mobileTab, setMobileTab] = useState<MobileTab>('lab');

  const hasAbnormality = state.interpretation && state.interpretation.affectedPathway !== 'none';
  const hasWarning = state.interpretation && state.interpretation.warnings.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Header - responsive */}
      <header className="flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between px-3 md:px-6 py-2 md:py-0 md:h-14 bg-white border-b border-slate-200 gap-1 md:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
          <h1 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 leading-tight">
            Calculator hemostază
          </h1>
          <span className="text-xs sm:text-sm text-slate-500">
            <span className="hidden xs:inline">@ </span>Dr. Chiper
            <span className="hidden sm:inline"> • <a href="mailto:drchiperleferman@gmail.com" className="hover:text-blue-600 hover:underline">drchiperleferman@gmail.com</a></span>
          </span>
        </div>

        {hasAbnormality && (
          <div className={`flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border self-start md:self-auto ${
            hasWarning
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              hasWarning ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className={`text-xs md:text-sm font-medium truncate max-w-[200px] md:max-w-none ${
              hasWarning ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {state.interpretation?.pattern}
            </span>
          </div>
        )}
      </header>

      {/* Mobile Navigation Tabs - only visible on small screens */}
      <nav className="md:hidden flex-shrink-0 flex bg-white border-b border-slate-200">
        <button
          onClick={() => setMobileTab('lab')}
          className={`flex-1 py-3 text-xs font-medium transition-colors relative ${
            mobileTab === 'lab'
              ? 'text-blue-600'
              : 'text-slate-500'
          }`}
        >
          Date Lab
          {mobileTab === 'lab' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setMobileTab('cascade')}
          className={`flex-1 py-3 text-xs font-medium transition-colors relative ${
            mobileTab === 'cascade'
              ? 'text-blue-600'
              : 'text-slate-500'
          }`}
        >
          Cascadă
          {mobileTab === 'cascade' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setMobileTab('results')}
          className={`flex-1 py-3 text-xs font-medium transition-colors relative ${
            mobileTab === 'results'
              ? 'text-blue-600'
              : 'text-slate-500'
          }`}
        >
          Rezultate
          {hasAbnormality && (
            <span className={`ml-1 w-2 h-2 rounded-full inline-block ${
              hasWarning ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
          )}
          {mobileTab === 'results' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </nav>

      {/* Main content - responsive */}
      <div className="flex-1 flex overflow-hidden p-2 md:p-4 gap-2 md:gap-4">
        {/* Left panel - Lab Input (hidden on mobile unless tab selected) */}
        <aside className={`${
          mobileTab === 'lab' ? 'flex' : 'hidden'
        } md:flex flex-shrink-0 w-full md:w-64 lg:w-72 overflow-hidden`}>
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

        {/* Center - Canvas (hidden on mobile unless tab selected) */}
        <main className={`${
          mobileTab === 'cascade' ? 'flex' : 'hidden'
        } md:flex flex-1 overflow-hidden min-w-0`}>
          <div className="panel h-full w-full">
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

        {/* Right panel - Interpretation (hidden on mobile unless tab selected) */}
        <aside className={`${
          mobileTab === 'results' ? 'flex' : 'hidden'
        } md:flex flex-shrink-0 w-full md:w-72 lg:w-80 overflow-hidden`}>
          <InterpretationPanel
            interpretation={state.interpretation}
          />
        </aside>
      </div>

      {/* Footer - hidden on mobile */}
      <footer className="hidden sm:flex flex-shrink-0 h-8 md:h-10 items-center justify-center bg-white border-t border-slate-200 px-4">
        <p className="text-[10px] md:text-xs text-slate-500 text-center">
          Introduceți valori laborator • Vizualizare cascadă • Diagnostic diferențial
        </p>
      </footer>
    </div>
  );
}
