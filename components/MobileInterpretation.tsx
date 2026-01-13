'use client';

import { useState } from 'react';
import { ClinicalInterpretation, Diagnosis, Hit4TCriteria, MedicationContext, LabInput } from '@/types';
import { calculate4TScore } from '@/engine/interpreter';

interface MobileInterpretationProps {
  interpretation: ClinicalInterpretation | null;
  hit4TCriteria: Hit4TCriteria;
  medications: MedicationContext;
  labInput: LabInput;
  onHit4TCriteriaChange: (criteria: Hit4TCriteria) => void;
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

export function MobileInterpretation({
  interpretation,
  hit4TCriteria,
  medications,
  labInput,
  onHit4TCriteriaChange,
}: MobileInterpretationProps): React.ReactElement {
  const show4TScore = (medications.heparin || medications.lmwh) && labInput.platelets < 150;
  const hit4TScore = show4TScore ? calculate4TScore(hit4TCriteria) : null;

  if (!interpretation) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-slate-400">
          Introduceți valorile de laborator pentru interpretare
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

      {/* ISTH Score - if present */}
      {interpretation.isthScore && (
        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-orange-800">Scor ISTH CID</span>
            <span className={`text-sm font-bold ${
              interpretation.isthScore.total >= 5 ? 'text-red-600' : 'text-orange-600'
            }`}>
              {interpretation.isthScore.total}/8
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-1.5">
            {[
              { label: 'PLT', value: interpretation.isthScore.platelets },
              { label: 'D-dim', value: interpretation.isthScore.dDimers },
              { label: 'PT', value: interpretation.isthScore.pt },
              { label: 'Fib', value: interpretation.isthScore.fibrinogen },
            ].map(item => (
              <div key={item.label} className="text-center p-1 bg-white rounded">
                <div className="text-[8px] text-slate-500">{item.label}</div>
                <div className="text-xs font-semibold text-slate-700">{item.value}</div>
              </div>
            ))}
          </div>
          <div className={`text-[10px] font-medium text-center py-1 rounded ${
            interpretation.isthScore.total >= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {interpretation.isthScore.interpretation}
          </div>
        </div>
      )}

      {/* 4T Score for HIT */}
      {show4TScore && (
        <CollapsibleSection
          title="Scor 4T pentru HIT"
          defaultOpen={true}
          badge={
            hit4TScore && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                hit4TScore.probability === 'high'
                  ? 'bg-red-100 text-red-700'
                  : hit4TScore.probability === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
              }`}>
                {hit4TScore.total}/8
              </span>
            )
          }
        >
          <div className="space-y-2">
            {/* Thrombocytopenia */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">1. Trombocitopenie</label>
              <select
                value={hit4TCriteria.thrombocytopenia}
                onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombocytopenia: Number(e.target.value) as 0 | 1 | 2 })}
                className="w-full px-2 py-1.5 text-[11px] border border-slate-200 rounded bg-white"
              >
                <option value={2}>Scădere &gt;50%, nadir ≥20 (2)</option>
                <option value={1}>Scădere 30-50% sau nadir 10-19 (1)</option>
                <option value={0}>Scădere &lt;30% sau nadir &lt;10 (0)</option>
              </select>
            </div>

            {/* Timing */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">2. Timing</label>
              <select
                value={hit4TCriteria.timing}
                onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, timing: Number(e.target.value) as 0 | 1 | 2 })}
                className="w-full px-2 py-1.5 text-[11px] border border-slate-200 rounded bg-white"
              >
                <option value={2}>Ziua 5-10 sau ≤1zi reexpunere (2)</option>
                <option value={1}>Ziua &gt;10 sau timing neclar (1)</option>
                <option value={0}>Ziua ≤4 fără expunere (0)</option>
              </select>
            </div>

            {/* Thrombosis */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">3. Tromboză</label>
              <select
                value={hit4TCriteria.thrombosis}
                onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombosis: Number(e.target.value) as 0 | 1 | 2 })}
                className="w-full px-2 py-1.5 text-[11px] border border-slate-200 rounded bg-white"
              >
                <option value={2}>Nouă/necroză/reacție sistemică (2)</option>
                <option value={1}>Progresivă/recurentă/suspectată (1)</option>
                <option value={0}>Fără tromboză (0)</option>
              </select>
            </div>

            {/* Other causes */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">4. Alte cauze</label>
              <select
                value={hit4TCriteria.otherCauses}
                onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, otherCauses: Number(e.target.value) as 0 | 1 | 2 })}
                className="w-full px-2 py-1.5 text-[11px] border border-slate-200 rounded bg-white"
              >
                <option value={2}>Nicio altă cauză (2)</option>
                <option value={1}>Posibilă altă cauză (1)</option>
                <option value={0}>Cauză alternativă certă (0)</option>
              </select>
            </div>

            {hit4TScore && (
              <div className={`p-2 rounded text-center ${
                hit4TScore.probability === 'high'
                  ? 'bg-red-100 text-red-700'
                  : hit4TScore.probability === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
              }`}>
                <span className="text-[11px] font-medium">{hit4TScore.interpretation}</span>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Diagnoses */}
      <CollapsibleSection
        title="Diagnostic Diferențial"
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
        <CollapsibleSection title="Recomandări" defaultOpen={false}>
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
