'use client';

import { useState } from 'react';
import { ClinicalInterpretation, Diagnosis, Hit4TCriteria, ISTHManualCriteria, MedicationContext, LabInput } from '@/types';
import { calculate4TScore, calculateManualISTHScore, shouldShowISTHCalculator, shouldShowHIT4TCalculator } from '@/engine/interpreter';

interface MobileInterpretationProps {
  interpretation: ClinicalInterpretation | null;
  hit4TCriteria: Hit4TCriteria;
  isthManualCriteria: ISTHManualCriteria;
  medications: MedicationContext;
  labInput: LabInput;
  onHit4TCriteriaChange: (criteria: Hit4TCriteria) => void;
  onIsthManualCriteriaChange: (criteria: ISTHManualCriteria) => void;
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

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 flex items-center justify-between"
      >
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        <div className="flex items-center gap-2">
          {badge}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}

function ProbabilityBadge({ probability }: { probability: Diagnosis['probability'] }): React.ReactElement {
  const styles = {
    high: 'bg-red-100 text-red-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    low: 'bg-slate-100 text-slate-600',
  };

  const labels = { high: 'Prob. mare', moderate: 'Posibil', low: 'De considerat' };

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${styles[probability]}`}>
      {labels[probability]}
    </span>
  );
}

function MobileScoreBadge({ score, color }: { score: number; color: string }): React.ReactElement {
  return (
    <div className={`flex items-center justify-center w-7 h-7 rounded-full ${color} font-bold text-xs shrink-0`}>
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
}: MobileInterpretationProps): React.ReactElement {
  const showISTHCalculator = shouldShowISTHCalculator(labInput, medications);
  const showHIT4TCalculator = shouldShowHIT4TCalculator(medications, labInput);

  const manualISTHScore = showISTHCalculator ? calculateManualISTHScore(isthManualCriteria) : null;
  const hit4TScore = showHIT4TCalculator ? calculate4TScore(hit4TCriteria) : null;

  if (!interpretation) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-slate-400">
          Introduceti valorile de laborator pentru interpretare
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Warnings - always visible */}
      {interpretation.warnings.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {interpretation.warnings.map((warning, i) => (
            <div key={i} className="p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[11px] text-red-700">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modern ISTH Calculator for CID */}
      {showISTHCalculator && manualISTHScore && (
        <div className="mb-3 rounded-xl overflow-hidden shadow-sm border border-orange-200">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 flex items-center justify-between">
            <span className="text-white font-semibold text-xs">Scor ISTH - CID</span>
            <div className={`px-2 py-0.5 rounded-full font-bold text-sm ${
              manualISTHScore.total >= 5
                ? 'bg-red-600 text-white'
                : 'bg-white/90 text-orange-600'
            }`}>
              {manualISTHScore.total}/8
            </div>
          </div>

          {/* Criteria rows */}
          <div className="bg-white divide-y divide-orange-100">
            {/* PLT */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={isthManualCriteria.plateletCount}
                color={isthManualCriteria.plateletCount === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.plateletCount === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">Trombocite</div>
                <select
                  value={isthManualCriteria.plateletCount}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, plateletCount: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-orange-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={0}>&gt;100.000/µL</option>
                  <option value={1}>50-100.000/µL</option>
                  <option value={2}>&lt;50.000/µL</option>
                </select>
              </div>
            </div>

            {/* D-dimers */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={isthManualCriteria.dDimerLevel}
                color={isthManualCriteria.dDimerLevel === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.dDimerLevel === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">D-Dimeri</div>
                <select
                  value={isthManualCriteria.dDimerLevel}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, dDimerLevel: Number(e.target.value) as 0 | 2 | 3 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-orange-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={0}>Normal</option>
                  <option value={2}>Crestere moderata</option>
                  <option value={3}>Crestere severa</option>
                </select>
              </div>
            </div>

            {/* PT */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={isthManualCriteria.ptProlongation}
                color={isthManualCriteria.ptProlongation === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.ptProlongation === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">PT (prelungire)</div>
                <select
                  value={isthManualCriteria.ptProlongation}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, ptProlongation: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-orange-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={0}>&lt;3 secunde</option>
                  <option value={1}>3-6 secunde</option>
                  <option value={2}>&gt;6 secunde</option>
                </select>
              </div>
            </div>

            {/* Fibrinogen */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={isthManualCriteria.fibrinogenLevel}
                color={isthManualCriteria.fibrinogenLevel === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">Fibrinogen</div>
                <select
                  value={isthManualCriteria.fibrinogenLevel}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, fibrinogenLevel: Number(e.target.value) as 0 | 1 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-orange-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={0}>&gt;100 mg/dL</option>
                  <option value={1}>≤100 mg/dL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer interpretation */}
          <div className={`px-3 py-2 text-center text-[11px] font-semibold ${
            manualISTHScore.total >= 5
              ? 'bg-red-600 text-white'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {manualISTHScore.interpretation}
          </div>
        </div>
      )}

      {/* Modern 4T Score for HIT */}
      {showHIT4TCalculator && hit4TScore && (
        <div className="mb-3 rounded-xl overflow-hidden shadow-sm border border-slate-200">
          {/* Header with gradient */}
          <div className={`px-3 py-2 flex items-center justify-between ${
            hit4TScore.probability === 'high'
              ? 'bg-gradient-to-r from-red-500 to-rose-500'
              : hit4TScore.probability === 'intermediate'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            <span className="text-white font-semibold text-xs">Scor 4T - HIT</span>
            <div className={`px-2 py-0.5 rounded-full font-bold text-sm ${
              hit4TScore.probability === 'high'
                ? 'bg-white text-red-600'
                : hit4TScore.probability === 'intermediate'
                  ? 'bg-white text-yellow-600'
                  : 'bg-white text-green-600'
            }`}>
              {hit4TScore.total}/8
            </div>
          </div>

          {/* Criteria rows */}
          <div className="bg-white divide-y divide-slate-100">
            {/* Thrombocytopenia */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={hit4TCriteria.thrombocytopenia}
                color={hit4TCriteria.thrombocytopenia === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.thrombocytopenia === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">Trombocitopenie</div>
                <select
                  value={hit4TCriteria.thrombocytopenia}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombocytopenia: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-slate-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={2}>Scadere &gt;50%, nadir ≥20k</option>
                  <option value={1}>Scadere 30-50%, nadir 10-19k</option>
                  <option value={0}>Scadere &lt;30%, nadir &lt;10k</option>
                </select>
              </div>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={hit4TCriteria.timing}
                color={hit4TCriteria.timing === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.timing === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">Timing</div>
                <select
                  value={hit4TCriteria.timing}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, timing: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-slate-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={2}>Ziua 5-10 / ≤1zi reexpunere</option>
                  <option value={1}>&gt;ziua 10 / timing neclar</option>
                  <option value={0}>≤ziua 4 fara expunere</option>
                </select>
              </div>
            </div>

            {/* Thrombosis */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={hit4TCriteria.thrombosis}
                color={hit4TCriteria.thrombosis === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.thrombosis === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">Tromboza</div>
                <select
                  value={hit4TCriteria.thrombosis}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombosis: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-slate-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={2}>Noua confirmata</option>
                  <option value={1}>Progresiva/suspectata</option>
                  <option value={0}>Niciuna</option>
                </select>
              </div>
            </div>

            {/* Other causes */}
            <div className="flex items-center gap-2 px-3 py-2">
              <MobileScoreBadge
                score={hit4TCriteria.otherCauses}
                color={hit4TCriteria.otherCauses === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.otherCauses === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-400 uppercase">Alte cauze</div>
                <select
                  value={hit4TCriteria.otherCauses}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, otherCauses: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-0 py-0.5 text-[11px] border-0 border-b border-slate-200 bg-transparent focus:ring-0 cursor-pointer"
                >
                  <option value={2}>Nu exista alte cauze</option>
                  <option value={1}>Posibile alte cauze</option>
                  <option value={0}>Cauza certa alternativa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer interpretation */}
          <div className={`px-3 py-2 text-center text-[11px] font-semibold ${
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
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
              {interpretation.diagnoses.length}
            </span>
          )
        }
      >
        {interpretation.diagnoses.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-2">
            Profil de coagulare normal
          </p>
        ) : (
          <div className="space-y-2">
            {interpretation.diagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="p-2 border border-slate-200 rounded">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium text-slate-700">{diagnosis.name}</span>
                  <ProbabilityBadge probability={diagnosis.probability} />
                </div>
                <p className="text-[10px] text-slate-500 mb-1">{diagnosis.description}</p>
                {diagnosis.suggestedTests.length > 0 && (
                  <div className="text-[9px] text-blue-600">
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
          <ul className="space-y-1">
            {interpretation.recommendations.map((rec, i) => (
              <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span className="text-blue-500 flex-shrink-0">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
    </div>
  );
}
