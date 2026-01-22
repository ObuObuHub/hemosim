'use client';

import { useState } from 'react';
import { ClinicalInterpretation, Diagnosis, Hit4TCriteria, ISTHManualCriteria, MedicationContext, LabInput } from '@/types';
import { calculate4TScore, calculateManualISTHScore, shouldShowISTHCalculator, shouldShowHIT4TCalculator, SCENARIO_AFFECTED_FACTORS, formatFactorsForDisplay } from '@/engine/interpreter';

interface MobileInterpretationProps {
  interpretation: ClinicalInterpretation | null;
  hit4TCriteria: Hit4TCriteria;
  isthManualCriteria: ISTHManualCriteria;
  medications: MedicationContext;
  labInput: LabInput;
  onHit4TCriteriaChange: (criteria: Hit4TCriteria) => void;
  onIsthManualCriteriaChange: (criteria: ISTHManualCriteria) => void;
  currentScenario?: string | null;
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={sectionId}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 px-1 flex items-center justify-between active:bg-slate-50 transition-colors touch-manipulation min-h-[56px]"
      >
        <span className="text-base font-semibold text-slate-700">{title}</span>
        <div className="flex items-center gap-3">
          {badge}
          <svg
            aria-hidden="true"
            className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div id={sectionId} className="pb-5">
          {children}
        </div>
      )}
    </div>
  );
}

function ProbabilityBadge({ probability }: { probability: Diagnosis['probability'] }): React.ReactElement {
  const styles = {
    high: 'bg-red-100 text-red-700 border border-red-200',
    moderate: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    low: 'bg-slate-100 text-slate-600 border border-slate-200',
  };

  const labels = { high: 'Prob. mare', moderate: 'Posibil', low: 'De considerat' };

  return (
    <span className={`text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${styles[probability]}`}>
      {labels[probability]}
    </span>
  );
}

function MobileScoreBadge({ score, color }: { score: number; color: string }): React.ReactElement {
  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${color} font-bold text-lg shrink-0`}>
      <span className="sr-only">Scor: </span>
      {score}
    </div>
  );
}

export function MobileInterpretation({
  interpretation,
  hit4TCriteria,
  isthManualCriteria,
  medications,
  labInput,
  onHit4TCriteriaChange,
  onIsthManualCriteriaChange,
  currentScenario,
}: MobileInterpretationProps): React.ReactElement {
  const showISTHCalculator = shouldShowISTHCalculator(labInput, medications);
  const showHIT4TCalculator = shouldShowHIT4TCalculator(medications, labInput);

  const manualISTHScore = showISTHCalculator ? calculateManualISTHScore(isthManualCriteria) : null;
  const hit4TScore = showHIT4TCalculator ? calculate4TScore(hit4TCriteria) : null;

  if (!interpretation) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-base text-slate-500">
          Introduceti valorile de laborator pentru interpretare
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Educational Scenario Badge */}
      {currentScenario && (
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <svg aria-hidden="true" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Mod Educațional</span>
          </div>
          <div className="text-base font-medium text-purple-900 mb-1">
            {currentScenario}
          </div>
          {SCENARIO_AFFECTED_FACTORS[currentScenario] && SCENARIO_AFFECTED_FACTORS[currentScenario].length > 0 && (
            <div className="text-sm text-purple-600">
              Factori: {formatFactorsForDisplay(SCENARIO_AFFECTED_FACTORS[currentScenario])}
            </div>
          )}

          {/* Special note for Factor XIII deficiency */}
          {currentScenario === 'Deficit factor XIII' && (
            <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-1.5">
                <span className="text-lg">⚠️</span>
                TESTE UZUALE = NORMALE!
              </div>
              <p className="text-sm text-orange-700 leading-relaxed mb-2">
                PT, aPTT, TT, Fibrinogen sunt <strong>toate normale</strong>!
                Cheagul se formează dar este <strong>instabil</strong> și se dezintegrează rapid.
              </p>
              <p className="text-sm text-orange-900 font-semibold">
                → Test specific: dozare F.XIII / solubilitate uree 5M
              </p>
            </div>
          )}
        </div>
      )}

      {/* Warnings - always visible */}
      {interpretation.warnings.length > 0 && (
        <div className="space-y-3">
          {interpretation.warnings.map((warning) => (
            <div key={`warning-${warning.slice(0, 30)}`} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
              <svg aria-hidden="true" className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-base text-red-800 leading-relaxed">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modern ISTH Calculator for CID */}
      {showISTHCalculator && manualISTHScore && (
        <div className="rounded-xl overflow-hidden shadow-md border border-orange-200">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 flex items-center justify-between">
            <span className="text-white font-semibold text-base">Scor ISTH - CID</span>
            <div className={`px-4 py-2 rounded-full font-bold text-lg ${
              manualISTHScore.total >= 5
                ? 'bg-red-600 text-white'
                : 'bg-white/95 text-orange-700'
            }`}>
              {manualISTHScore.total}/8
            </div>
          </div>

          {/* Criteria rows */}
          <div className="bg-white divide-y divide-orange-100">
            {/* PLT */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={isthManualCriteria.plateletCount}
                color={isthManualCriteria.plateletCount === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.plateletCount === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-isth-platelet" className="text-sm font-medium text-slate-500 uppercase mb-2">Trombocite</div>
                <select
                  aria-labelledby="label-isth-platelet"
                  value={isthManualCriteria.plateletCount}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, plateletCount: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer touch-manipulation"
                >
                  <option value={0}>&gt;100.000/µL</option>
                  <option value={1}>50-100.000/µL</option>
                  <option value={2}>&lt;50.000/µL</option>
                </select>
              </div>
            </div>

            {/* D-dimers */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={isthManualCriteria.dDimerLevel}
                color={isthManualCriteria.dDimerLevel === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.dDimerLevel === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-isth-ddimer" className="text-sm font-medium text-slate-500 uppercase mb-2">D-Dimeri</div>
                <select
                  aria-labelledby="label-isth-ddimer"
                  value={isthManualCriteria.dDimerLevel}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, dDimerLevel: Number(e.target.value) as 0 | 2 | 3 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer touch-manipulation"
                >
                  <option value={0}>Normal</option>
                  <option value={2}>Crestere moderata</option>
                  <option value={3}>Crestere severa</option>
                </select>
              </div>
            </div>

            {/* PT */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={isthManualCriteria.ptProlongation}
                color={isthManualCriteria.ptProlongation === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.ptProlongation === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-isth-pt" className="text-sm font-medium text-slate-500 uppercase mb-2">PT (prelungire)</div>
                <select
                  aria-labelledby="label-isth-pt"
                  value={isthManualCriteria.ptProlongation}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, ptProlongation: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer touch-manipulation"
                >
                  <option value={0}>&lt;3 secunde</option>
                  <option value={1}>3-6 secunde</option>
                  <option value={2}>&gt;6 secunde</option>
                </select>
              </div>
            </div>

            {/* Fibrinogen */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={isthManualCriteria.fibrinogenLevel}
                color={isthManualCriteria.fibrinogenLevel === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-isth-fibrinogen" className="text-sm font-medium text-slate-500 uppercase mb-2">Fibrinogen</div>
                <select
                  aria-labelledby="label-isth-fibrinogen"
                  value={isthManualCriteria.fibrinogenLevel}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, fibrinogenLevel: Number(e.target.value) as 0 | 1 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer touch-manipulation"
                >
                  <option value={0}>&gt;100 mg/dL</option>
                  <option value={1}>≤100 mg/dL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer interpretation */}
          <div className={`px-4 py-4 text-center text-base font-semibold ${
            manualISTHScore.total >= 5
              ? 'bg-red-600 text-white'
              : 'bg-amber-100 text-amber-900'
          }`}>
            {manualISTHScore.interpretation}
          </div>
        </div>
      )}

      {/* Modern 4T Score for HIT */}
      {showHIT4TCalculator && hit4TScore && (
        <div className="rounded-xl overflow-hidden shadow-md border border-slate-200">
          {/* Header with gradient */}
          <div className={`px-4 py-4 flex items-center justify-between ${
            hit4TScore.probability === 'high'
              ? 'bg-gradient-to-r from-red-500 to-rose-500'
              : hit4TScore.probability === 'intermediate'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            <span className="text-white font-semibold text-base">Scor 4T - HIT</span>
            <div className={`px-4 py-2 rounded-full font-bold text-lg ${
              hit4TScore.probability === 'high'
                ? 'bg-white text-red-600'
                : hit4TScore.probability === 'intermediate'
                  ? 'bg-white text-yellow-700'
                  : 'bg-white text-green-700'
            }`}>
              {hit4TScore.total}/8
            </div>
          </div>

          {/* Criteria rows */}
          <div className="bg-white divide-y divide-slate-100">
            {/* Thrombocytopenia */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={hit4TCriteria.thrombocytopenia}
                color={hit4TCriteria.thrombocytopenia === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.thrombocytopenia === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-hit4t-thrombocytopenia" className="text-sm font-medium text-slate-500 uppercase mb-2">Trombocitopenie</div>
                <select
                  aria-labelledby="label-hit4t-thrombocytopenia"
                  value={hit4TCriteria.thrombocytopenia}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombocytopenia: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-slate-200 bg-transparent focus:ring-0 focus:border-slate-400 cursor-pointer touch-manipulation"
                >
                  <option value={2}>Scadere &gt;50%, nadir ≥20k</option>
                  <option value={1}>Scadere 30-50%, nadir 10-19k</option>
                  <option value={0}>Scadere &lt;30%, nadir &lt;10k</option>
                </select>
              </div>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={hit4TCriteria.timing}
                color={hit4TCriteria.timing === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.timing === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-hit4t-timing" className="text-sm font-medium text-slate-500 uppercase mb-2">Timing</div>
                <select
                  aria-labelledby="label-hit4t-timing"
                  value={hit4TCriteria.timing}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, timing: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-slate-200 bg-transparent focus:ring-0 focus:border-slate-400 cursor-pointer touch-manipulation"
                >
                  <option value={2}>Ziua 5-10 / ≤1zi reexpunere</option>
                  <option value={1}>&gt;ziua 10 / timing neclar</option>
                  <option value={0}>≤ziua 4 fara expunere</option>
                </select>
              </div>
            </div>

            {/* Thrombosis */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={hit4TCriteria.thrombosis}
                color={hit4TCriteria.thrombosis === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.thrombosis === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-hit4t-thrombosis" className="text-sm font-medium text-slate-500 uppercase mb-2">Tromboza</div>
                <select
                  aria-labelledby="label-hit4t-thrombosis"
                  value={hit4TCriteria.thrombosis}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombosis: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-slate-200 bg-transparent focus:ring-0 focus:border-slate-400 cursor-pointer touch-manipulation"
                >
                  <option value={2}>Noua confirmata</option>
                  <option value={1}>Progresiva/suspectata</option>
                  <option value={0}>Niciuna</option>
                </select>
              </div>
            </div>

            {/* Other causes */}
            <div className="flex items-center gap-4 px-4 py-4">
              <MobileScoreBadge
                score={hit4TCriteria.otherCauses}
                color={hit4TCriteria.otherCauses === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.otherCauses === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div id="label-hit4t-othercauses" className="text-sm font-medium text-slate-500 uppercase mb-2">Alte cauze</div>
                <select
                  aria-labelledby="label-hit4t-othercauses"
                  value={hit4TCriteria.otherCauses}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, otherCauses: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-2 text-base border-0 border-b-2 border-slate-200 bg-transparent focus:ring-0 focus:border-slate-400 cursor-pointer touch-manipulation"
                >
                  <option value={2}>Nu exista alte cauze</option>
                  <option value={1}>Posibile alte cauze</option>
                  <option value={0}>Cauza certa alternativa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer interpretation */}
          <div className={`px-4 py-4 text-center text-base font-semibold ${
            hit4TScore.probability === 'high'
              ? 'bg-red-600 text-white'
              : hit4TScore.probability === 'intermediate'
                ? 'bg-yellow-500 text-white'
                : 'bg-green-600 text-white'
          }`}>
            {hit4TScore.interpretation}
          </div>
        </div>
      )}

      {/* Diagnoses */}
      <CollapsibleSection
        title="Diagnostic Diferential"
        defaultOpen={true}
        badge={
          interpretation.diagnoses.length > 0 && (
            <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium">
              {interpretation.diagnoses.length}
            </span>
          )
        }
      >
        {interpretation.diagnoses.length === 0 ? (
          <p className="text-base text-slate-500 text-center py-6">
            Profil de coagulare normal
          </p>
        ) : (
          <div className="space-y-4">
            {interpretation.diagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-base font-semibold text-slate-800 leading-tight">{diagnosis.name}</span>
                  <ProbabilityBadge probability={diagnosis.probability} />
                </div>
                <p className="text-base text-slate-600 mb-3 leading-relaxed">{diagnosis.description}</p>
                {diagnosis.suggestedTests.length > 0 && (
                  <div className="text-sm text-blue-700 font-medium bg-blue-50 px-3 py-2 rounded">
                    → {diagnosis.suggestedTests.join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Recommendations */}
      {interpretation.recommendations.length > 0 && (
        <CollapsibleSection title="Recomandari" defaultOpen={false}>
          <ul className="space-y-3">
            {interpretation.recommendations.map((rec) => (
              <li key={`rec-${rec.slice(0, 30)}`} className="text-base text-slate-700 flex items-start gap-3 leading-relaxed">
                <span className="text-blue-600 flex-shrink-0 font-bold text-lg mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
    </div>
  );
}
