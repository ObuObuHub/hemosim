'use client';

import React, { useState } from 'react';
import { AppState, LabInput, MedicationContext, Hit4TCriteria } from '@/types';
import { MobileLabInput } from './MobileLabInput';
import { MobileInterpretation } from './MobileInterpretation';
import { MobileTabBar } from './MobileTabBar';
import { CascadeCanvas } from './CascadeCanvas';

type TabId = 'labs' | 'cascade' | 'results';

interface MobileLayoutProps {
  state: AppState;
  updateLabInput: (values: LabInput) => void;
  updateMedications: (meds: MedicationContext) => void;
  updateHit4TCriteria: (criteria: Hit4TCriteria) => void;
  reset: () => void;
  setHoveredFactor: (factorId: string | null) => void;
}

export function MobileLayout({
  state,
  updateLabInput,
  updateMedications,
  updateHit4TCriteria,
  reset,
  setHoveredFactor,
}: MobileLayoutProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('labs');
  const [showScenarios, setShowScenarios] = useState(false);

  const hasAbnormality = state.interpretation && state.interpretation.affectedPathway !== 'none';
  const hasWarning = state.interpretation && state.interpretation.warnings.length > 0;
  const hasAbnormalFindings = Boolean(hasAbnormality || hasWarning);

  return (
    <div className="md:hidden h-screen w-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header - compact */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200">
        <h1 className="text-sm font-semibold text-slate-800">HemoSim</h1>
        <div className="flex items-center gap-2">
          {hasAbnormality && activeTab !== 'results' && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
              hasWarning ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className={`text-[10px] font-medium ${hasWarning ? 'text-red-700' : 'text-yellow-700'}`}>
                {state.interpretation?.pattern}
              </span>
            </div>
          )}
          <span className="text-xs text-slate-500">Dr. Chiper</span>
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
            />

            {/* Pattern summary at bottom of labs */}
            {hasAbnormality && (
              <div className={`mt-4 px-3 py-2 rounded-lg flex items-center gap-2 ${
                hasWarning ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className={`text-xs font-medium ${hasWarning ? 'text-red-700' : 'text-yellow-700'}`}>
                  {state.interpretation?.pattern}
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
          {/* Compact pattern indicator */}
          {hasAbnormality && (
            <div className={`flex-shrink-0 px-3 py-1.5 flex items-center gap-2 border-b ${
              hasWarning ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasWarning ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className={`text-[10px] font-medium ${hasWarning ? 'text-red-700' : 'text-yellow-700'}`}>
                {state.interpretation?.pattern}
              </span>
            </div>
          )}

          {/* Canvas takes all remaining space */}
          <div className="flex-1 min-h-0 bg-white">
            <CascadeCanvas
              factors={state.factors}
              mode={state.mode}
              hoveredFactor={state.hoveredFactor}
              hoveredLabValue={null}
              dicPhase={null}
              onFactorHover={setHoveredFactor}
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
              medications={state.medications}
              labInput={state.labInput}
              onHit4TCriteriaChange={updateHit4TCriteria}
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
