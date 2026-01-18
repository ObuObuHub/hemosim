'use client';

import React, { useState } from 'react';
import { AppState, LabInput, MedicationContext, Hit4TCriteria, ISTHManualCriteria } from '@/types';
import { MobileLabInput } from './MobileLabInput';
import { MobileInterpretation } from './MobileInterpretation';
import { MobileTabBar } from './MobileTabBar';
import { CascadeCanvas } from './CascadeCanvas';
import { SCENARIO_AFFECTED_FACTORS, formatFactorsForDisplay } from '@/engine/interpreter';

type TabId = 'labs' | 'cascade' | 'results';

interface MobileLayoutProps {
  state: AppState;
  updateLabInput: (values: LabInput) => void;
  updateMedications: (meds: MedicationContext) => void;
  updateHit4TCriteria: (criteria: Hit4TCriteria) => void;
  updateIsthManualCriteria: (criteria: ISTHManualCriteria) => void;
  isthManualCriteria: ISTHManualCriteria;
  reset: () => void;
  setMode: (mode: 'basic' | 'clinical') => void;
  setHoveredFactor: (factorId: string | null) => void;
  setCurrentScenario: (scenario: string | null) => void;
}

export function MobileLayout({
  state,
  updateLabInput,
  updateMedications,
  updateHit4TCriteria,
  updateIsthManualCriteria,
  isthManualCriteria,
  reset,
  setMode,
  setHoveredFactor,
  setCurrentScenario,
}: MobileLayoutProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('cascade');
  const [showScenarios, setShowScenarios] = useState(false);

  const hasAbnormality = state.interpretation && state.interpretation.affectedPathway !== 'none';
  const hasWarning = state.interpretation && state.interpretation.warnings.length > 0;
  const hasAbnormalFindings = Boolean(hasAbnormality || hasWarning);
  const headerLabel = state.currentScenario || state.interpretation?.pattern;

  return (
    <div className="md:hidden fixed inset-0 bg-slate-50 flex flex-col">
      {/* Header - compact */}
      <header className="flex-shrink-0 h-11 flex items-center justify-between px-3 bg-white border-b border-slate-200">
        <h1 className="text-sm font-semibold text-slate-800">HemoSim</h1>
        <div className="flex items-center gap-2">
          {/* Mode Toggle - Pill style */}
          <div className="flex rounded-full bg-slate-100 p-0.5">
            <button
              onClick={() => setMode('basic')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-all ${
                state.mode === 'basic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setMode('clinical')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-all ${
                state.mode === 'clinical'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Clinical
            </button>
          </div>
          {(hasAbnormality || state.currentScenario) && activeTab !== 'results' && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
              hasWarning ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className={`text-[10px] font-medium ${hasWarning ? 'text-red-700' : 'text-yellow-700'}`}>
                {headerLabel}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Tab Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* Labs Tab */}
        <div className={`absolute inset-0 overflow-auto ${activeTab === 'labs' ? 'block' : 'hidden'}`}>
          <section className="bg-white px-3 py-3 min-h-full">
            <MobileLabInput
              values={state.labInput}
              medications={state.medications}
              onChange={updateLabInput}
              onMedicationChange={updateMedications}
              onReset={reset}
              showScenarios={showScenarios}
              onToggleScenarios={() => setShowScenarios(!showScenarios)}
              onScenarioChange={setCurrentScenario}
            />

            {/* Pattern summary at bottom of labs */}
            {(hasAbnormality || state.currentScenario) && (
              <div className={`mt-4 px-3 py-2 rounded-lg flex items-center gap-2 ${
                hasWarning ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className={`text-xs font-medium ${hasWarning ? 'text-red-700' : 'text-yellow-700'}`}>
                  {headerLabel}
                </span>
                <button
                  type="button"
                  className="ml-auto text-[10px] font-medium text-blue-600"
                  onClick={() => setActiveTab('results')}
                >
                  Vezi detalii →
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Cascade Tab */}
        <div className={`absolute inset-0 flex flex-col ${activeTab === 'cascade' ? 'flex' : 'hidden'}`}>
          {/* Context Bar - shows scenario info with affected factors */}
          {state.currentScenario && (
            <div className="flex-shrink-0 px-3 py-2 flex flex-col gap-1 border-b bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasWarning ? 'bg-red-500' : 'bg-purple-500'}`} />
                <span className="text-xs font-semibold text-purple-800">
                  {state.currentScenario}
                </span>
              </div>
              {SCENARIO_AFFECTED_FACTORS[state.currentScenario]?.length > 0 && (
                <div className="flex items-center gap-1.5 ml-4">
                  <span className="text-[10px] text-purple-500">Factori afectați:</span>
                  <span className="text-[10px] font-medium text-purple-700">
                    {formatFactorsForDisplay(SCENARIO_AFFECTED_FACTORS[state.currentScenario])}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Canvas takes all remaining space */}
          <div className="flex-1 min-h-0 bg-white">
            <CascadeCanvas
              factors={state.factors}
              mode={state.mode}
              hoveredFactor={state.hoveredFactor}
              hoveredLabValue={null}
              dDimers={state.labInput.dDimers}
              dicPhase={null}
              onFactorHover={setHoveredFactor}
              showFeedback={state.showFeedback}
              showInhibition={state.showInhibition}
              currentScenario={state.currentScenario}
            />
          </div>
        </div>

        {/* Results Tab */}
        <div className={`absolute inset-0 overflow-auto ${activeTab === 'results' ? 'block' : 'hidden'}`}>
          {/* Warnings banner */}
          {hasWarning && (
            <div className="bg-red-50 border-b border-red-200 px-3 py-2">
              {state.interpretation?.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-red-700">
                  <span className="text-red-500 flex-shrink-0">⚠</span>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          <section className="bg-white px-3 py-3">
            <MobileInterpretation
              interpretation={state.interpretation}
              hit4TCriteria={state.hit4TCriteria}
              isthManualCriteria={isthManualCriteria}
              medications={state.medications}
              labInput={state.labInput}
              onHit4TCriteriaChange={updateHit4TCriteria}
              onIsthManualCriteriaChange={updateIsthManualCriteria}
              currentScenario={state.currentScenario}
            />
          </section>
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasAbnormalFindings={hasAbnormalFindings}
      />
    </div>
  );
}
