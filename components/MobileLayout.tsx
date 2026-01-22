'use client';

import React, { useState, useCallback } from 'react';
import { AppState, LabInput, MedicationContext, Hit4TCriteria, ISTHManualCriteria } from '@/types';
import { MobileLabInput } from './MobileLabInput';
import { MobileInterpretation } from './MobileInterpretation';
import { MobileTabBar } from './MobileTabBar';
import { CascadeCanvas } from './CascadeCanvas';
import { InteractiveGame } from './InteractiveGame';
import { SCENARIO_AFFECTED_FACTORS, formatFactorsForDisplay } from '@/engine/interpreter';

type TabId = 'labs' | 'cascade' | 'interactiv' | 'results';

interface MobileLayoutProps {
  state: AppState;
  updateLabInput: (values: LabInput) => void;
  updateMedications: (meds: MedicationContext) => void;
  updateHit4TCriteria: (criteria: Hit4TCriteria) => void;
  updateIsthManualCriteria: (criteria: ISTHManualCriteria) => void;
  isthManualCriteria: ISTHManualCriteria;
  reset: () => void;
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
  setHoveredFactor,
  setCurrentScenario,
}: MobileLayoutProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('cascade');
  const [showScenarios, setShowScenarios] = useState(false);

  const handleToggleScenarios = useCallback(() => {
    setShowScenarios(prev => !prev);
  }, []);

  const handleNavigateToResults = useCallback(() => {
    setActiveTab('results');
  }, []);

  const hasAbnormality = state.interpretation && state.interpretation.affectedPathway !== 'none';
  const hasWarning = state.interpretation && state.interpretation.warnings.length > 0;
  const hasAbnormalFindings = Boolean(hasAbnormality || hasWarning);
  const headerLabel = state.currentScenario || state.interpretation?.pattern;

  return (
    <div className="md:hidden fixed inset-0 bg-slate-50 flex flex-col safe-area-top">
      {/* Header - improved touch-friendly sizing */}
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 bg-white border-b border-slate-200 shadow-sm">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">HemoSim</h1>
        <div className="flex items-center gap-2">
          {(hasAbnormality || state.currentScenario) && activeTab !== 'results' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              hasWarning ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className={`text-xs font-semibold ${hasWarning ? 'text-red-700' : 'text-yellow-700'} max-w-[180px] truncate`}>
                {headerLabel}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Tab Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* Labs Tab */}
        {activeTab === 'labs' && (
          <div
            className="absolute inset-0 overflow-auto mobile-tab-panel"
            role="tabpanel"
            id="tabpanel-labs"
            aria-labelledby="tab-labs"
          >
            <section className="bg-white px-4 py-4 min-h-full">
              <MobileLabInput
                values={state.labInput}
                medications={state.medications}
                onChange={updateLabInput}
                onMedicationChange={updateMedications}
                onReset={reset}
                showScenarios={showScenarios}
                onToggleScenarios={handleToggleScenarios}
                onScenarioChange={setCurrentScenario}
              />

              {/* Pattern summary at bottom of labs */}
              {(hasAbnormality || state.currentScenario) && (
                <div className={`mt-6 px-4 py-4 rounded-xl flex items-center gap-3 transition-all duration-200 shadow-sm ${
                  hasWarning ? 'bg-red-50 border-2 border-red-200' : 'bg-yellow-50 border-2 border-yellow-200'
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <span className={`text-sm font-bold ${hasWarning ? 'text-red-800' : 'text-yellow-800'} flex-1`}>
                    {headerLabel}
                  </span>
                  <button
                    type="button"
                    className="ml-auto text-xs font-bold text-white bg-blue-600 px-4 py-2.5 rounded-lg active:bg-blue-700 active:scale-95 transition-all duration-150 min-h-[44px] flex items-center gap-1 shadow-md"
                    onClick={handleNavigateToResults}
                  >
                    Vezi detalii
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Cascade Tab */}
        {activeTab === 'cascade' && (
          <div
            className="absolute inset-0 flex flex-col mobile-tab-panel"
            role="tabpanel"
            id="tabpanel-cascade"
            aria-labelledby="tab-cascade"
          >
            {/* Context Bar - shows scenario info with affected factors */}
            {state.currentScenario && (
              <div className="flex-shrink-0 px-4 py-3 flex flex-col gap-2.5 border-b bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${hasWarning ? 'bg-red-500' : 'bg-purple-500'}`} />
                  <span className="text-sm font-bold text-purple-900">
                    {state.currentScenario}
                  </span>
                </div>
                {SCENARIO_AFFECTED_FACTORS[state.currentScenario]?.length > 0 && (
                  <div className="flex flex-col gap-1 ml-4 pl-2 border-l-2 border-purple-300">
                    <span className="text-[10px] text-purple-600 font-semibold uppercase tracking-wide">Factori afectați</span>
                    <span className="text-xs font-medium text-purple-800 leading-relaxed">
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
                mode="clinical"
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
        )}

        {/* Interactiv Tab */}
        {activeTab === 'interactiv' && (
          <div
            className="absolute inset-0 mobile-tab-panel"
            role="tabpanel"
            id="tabpanel-interactiv"
            aria-labelledby="tab-interactiv"
          >
            <InteractiveGame className="h-full w-full" />
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div
            className="absolute inset-0 overflow-auto mobile-tab-panel"
            role="tabpanel"
            id="tabpanel-results"
            aria-labelledby="tab-results"
          >
            {/* Warnings banner */}
            {hasWarning && (
              <div
                role="alert"
                aria-live="polite"
                className="bg-red-50 border-b border-red-200 px-4 py-3 shadow-sm"
              >
                {state.interpretation?.warnings.map((warning) => (
                  <div key={`warning-${warning.slice(0, 30)}`} className="flex items-start gap-3 text-sm text-red-700 leading-relaxed">
                    <span className="text-red-500 flex-shrink-0 text-base">⚠</span>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            <section className="bg-white px-4 py-4">
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
        )}
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
