'use client';

import { ClinicalInterpretation, Diagnosis, Hit4TCriteria, ISTHManualCriteria, LabInput, MedicationContext } from '@/types';
import { calculate4TScore, calculateManualISTHScore, shouldShowISTHCalculator, shouldShowHIT4TCalculator, SCENARIO_AFFECTED_FACTORS, formatFactorsForDisplay } from '@/engine/interpreter';

interface InterpretationPanelProps {
  interpretation: ClinicalInterpretation | null;
  hit4TCriteria: Hit4TCriteria;
  isthManualCriteria: ISTHManualCriteria;
  medications: MedicationContext;
  labInput: LabInput;
  onHit4TCriteriaChange: (criteria: Hit4TCriteria) => void;
  onIsthManualCriteriaChange: (criteria: ISTHManualCriteria) => void;
  currentScenario?: string | null;
}

function ProbabilityBadge({ probability }: { probability: Diagnosis['probability'] }): React.ReactElement {
  const colors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels = {
    high: 'Probabilitate mare',
    moderate: 'Posibil',
    low: 'De considerat',
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[probability]}`}>
      {labels[probability]}
    </span>
  );
}

function ScoreBadge({ score, max, color }: { score: number; max: number; color: string }): React.ReactElement {
  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${color} font-bold text-sm shrink-0`}>
      {score}
    </div>
  );
}

export function InterpretationPanel({
  interpretation,
  hit4TCriteria,
  isthManualCriteria,
  medications,
  labInput,
  onHit4TCriteriaChange,
  onIsthManualCriteriaChange,
  currentScenario,
}: InterpretationPanelProps): React.ReactElement {
  const showISTHCalculator = shouldShowISTHCalculator(labInput, medications);
  const showHIT4TCalculator = shouldShowHIT4TCalculator(medications, labInput);

  const manualISTHScore = showISTHCalculator ? calculateManualISTHScore(isthManualCriteria) : null;
  const hit4TScore = showHIT4TCalculator ? calculate4TScore(hit4TCriteria) : null;

  if (!interpretation) {
    return (
      <div className="panel p-4 h-full flex flex-col">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Interpretare Clinica
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400 text-center">
            Introduceti valorile de laborator<br />pentru interpretare automata
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Interpretare Clinica
        </h2>
      </div>

      {/* Educational Scenario Badge */}
      {currentScenario && (
        <div className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Mod Educațional</span>
          </div>
          <div className="text-sm font-medium text-purple-800">
            {currentScenario}
          </div>
          {SCENARIO_AFFECTED_FACTORS[currentScenario] && SCENARIO_AFFECTED_FACTORS[currentScenario].length > 0 && (
            <div className="mt-1 text-xs text-purple-600">
              Factori afectați: {formatFactorsForDisplay(SCENARIO_AFFECTED_FACTORS[currentScenario])}
            </div>
          )}

          {/* Special note for Factor XIII deficiency */}
          {currentScenario === 'Deficit factor XIII' && (
            <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="text-xs font-bold text-orange-800 mb-1">
                    ⚠️ TESTE UZUALE = NORMALE!
                  </div>
                  <p className="text-[10px] text-orange-700 leading-relaxed">
                    PT, aPTT, TT, Fibrinogen sunt <strong>toate normale</strong> în deficit de F.XIII!
                  </p>
                  <p className="text-[10px] text-orange-700 leading-relaxed mt-1">
                    Sângele formează un cheag inițial, dar acesta este <strong>instabil</strong>.
                    Fără Factor XIII, rețeaua de fibrină nu se întărește și cheagul se dezintegrează rapid.
                  </p>
                  <p className="text-[10px] text-orange-800 font-semibold mt-1">
                    → Necesită test specific: dozare F.XIII sau test de solubilitate a cheagului în uree 5M
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pattern summary */}
      <div className={`p-3 rounded-lg mb-4 ${
        interpretation.affectedPathway === 'none'
          ? 'bg-green-50 border border-green-200'
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="text-xs font-medium text-slate-500 mb-1">Pattern Identificat</div>
        <div className={`text-sm font-semibold ${
          interpretation.affectedPathway === 'none' ? 'text-green-700' : 'text-blue-700'
        }`}>
          {interpretation.pattern}
        </div>
        {interpretation.affectedPathway !== 'none' && (
          <div className="text-xs text-slate-500 mt-1">
            Cale afectata: {interpretation.affectedPathway === 'intrinsic' ? 'Intrinseca' :
              interpretation.affectedPathway === 'extrinsic' ? 'Extrinseca' :
              interpretation.affectedPathway === 'common' ? 'Comuna' :
              interpretation.affectedPathway === 'platelet' ? 'Plachetara' : 'Mixta'}
          </div>
        )}
      </div>

      {/* Warnings */}
      {interpretation.warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {interpretation.warnings.map((warning, i) => (
            <div
              key={i}
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
            >
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-red-700">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modern ISTH DIC Calculator */}
      {showISTHCalculator && manualISTHScore && (
        <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-orange-200">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-white font-semibold text-sm">Scor ISTH - CID</span>
            </div>
            <div className={`px-3 py-1 rounded-full font-bold text-lg ${
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
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={isthManualCriteria.plateletCount}
                max={2}
                color={isthManualCriteria.plateletCount === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.plateletCount === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Trombocite</div>
                <select
                  value={isthManualCriteria.plateletCount}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, plateletCount: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer"
                >
                  <option value={0}>&gt;100.000/µL</option>
                  <option value={1}>50-100.000/µL</option>
                  <option value={2}>&lt;50.000/µL</option>
                </select>
              </div>
            </div>

            {/* D-dimers */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={isthManualCriteria.dDimerLevel}
                max={3}
                color={isthManualCriteria.dDimerLevel === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.dDimerLevel === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">D-Dimeri</div>
                <select
                  value={isthManualCriteria.dDimerLevel}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, dDimerLevel: Number(e.target.value) as 0 | 2 | 3 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer"
                >
                  <option value={0}>Normal</option>
                  <option value={2}>Crestere moderata</option>
                  <option value={3}>Crestere severa</option>
                </select>
              </div>
            </div>

            {/* PT */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={isthManualCriteria.ptProlongation}
                max={2}
                color={isthManualCriteria.ptProlongation === 0 ? 'bg-green-100 text-green-700' : isthManualCriteria.ptProlongation === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">PT (prelungire)</div>
                <select
                  value={isthManualCriteria.ptProlongation}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, ptProlongation: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer"
                >
                  <option value={0}>&lt;3 secunde</option>
                  <option value={1}>3-6 secunde</option>
                  <option value={2}>&gt;6 secunde</option>
                </select>
              </div>
            </div>

            {/* Fibrinogen */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={isthManualCriteria.fibrinogenLevel}
                max={1}
                color={isthManualCriteria.fibrinogenLevel === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Fibrinogen</div>
                <select
                  value={isthManualCriteria.fibrinogenLevel}
                  onChange={(e) => onIsthManualCriteriaChange({ ...isthManualCriteria, fibrinogenLevel: Number(e.target.value) as 0 | 1 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-orange-200 bg-transparent focus:ring-0 focus:border-orange-400 cursor-pointer"
                >
                  <option value={0}>&gt;100 mg/dL</option>
                  <option value={1}>≤100 mg/dL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer interpretation */}
          <div className={`px-4 py-3 text-center text-sm font-semibold ${
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
        <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-slate-200">
          {/* Header with gradient */}
          <div className={`px-4 py-3 flex items-center justify-between ${
            hit4TScore.probability === 'high'
              ? 'bg-gradient-to-r from-red-500 to-rose-500'
              : hit4TScore.probability === 'intermediate'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-white font-semibold text-sm">Scor 4T - HIT</span>
            </div>
            <div className={`px-3 py-1 rounded-full font-bold text-lg ${
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
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={hit4TCriteria.thrombocytopenia}
                max={2}
                color={hit4TCriteria.thrombocytopenia === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.thrombocytopenia === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Trombocitopenie</div>
                <select
                  value={hit4TCriteria.thrombocytopenia}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombocytopenia: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-slate-200 bg-transparent focus:ring-0 focus:border-blue-400 cursor-pointer"
                >
                  <option value={2}>Scadere &gt;50% si nadir ≥20k</option>
                  <option value={1}>Scadere 30-50% sau nadir 10-19k</option>
                  <option value={0}>Scadere &lt;30% sau nadir &lt;10k</option>
                </select>
              </div>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={hit4TCriteria.timing}
                max={2}
                color={hit4TCriteria.timing === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.timing === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Timing</div>
                <select
                  value={hit4TCriteria.timing}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, timing: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-slate-200 bg-transparent focus:ring-0 focus:border-blue-400 cursor-pointer"
                >
                  <option value={2}>Ziua 5-10 sau ≤1 zi (expunere &lt;30 zile)</option>
                  <option value={1}>&gt;ziua 10 sau ≤1 zi (expunere 30-100 zile)</option>
                  <option value={0}>≤ziua 4 (fara expunere anterioara)</option>
                </select>
              </div>
            </div>

            {/* Thrombosis */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={hit4TCriteria.thrombosis}
                max={2}
                color={hit4TCriteria.thrombosis === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.thrombosis === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Tromboza</div>
                <select
                  value={hit4TCriteria.thrombosis}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombosis: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-slate-200 bg-transparent focus:ring-0 focus:border-blue-400 cursor-pointer"
                >
                  <option value={2}>Tromboza noua confirmata</option>
                  <option value={1}>Progresiva/suspectata</option>
                  <option value={0}>Niciuna</option>
                </select>
              </div>
            </div>

            {/* Other causes */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <ScoreBadge
                score={hit4TCriteria.otherCauses}
                max={2}
                color={hit4TCriteria.otherCauses === 2 ? 'bg-green-100 text-green-700' : hit4TCriteria.otherCauses === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Alte cauze</div>
                <select
                  value={hit4TCriteria.otherCauses}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, otherCauses: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full mt-0.5 px-0 py-1 text-sm border-0 border-b border-slate-200 bg-transparent focus:ring-0 focus:border-blue-400 cursor-pointer"
                >
                  <option value={2}>Nu exista alte cauze</option>
                  <option value={1}>Posibile alte cauze</option>
                  <option value={0}>Cauza certa alternativa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer interpretation */}
          <div className={`px-4 py-3 text-center text-sm font-semibold ${
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
      <div className="flex-1 overflow-auto">
        <h3 className="text-xs font-semibold text-slate-600 mb-2">
          Diagnostic Diferential
        </h3>

        {interpretation.diagnoses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Profil de coagulare in limite normale
          </p>
        ) : (
          <div className="space-y-3">
            {interpretation.diagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-slate-700">
                    {diagnosis.name}
                  </h4>
                  <ProbabilityBadge probability={diagnosis.probability} />
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {diagnosis.description}
                </p>
                {diagnosis.affectedFactors.length > 0 && (
                  <div className="text-[10px] text-slate-400 mb-1">
                    Factori: {diagnosis.affectedFactors.join(', ')}
                  </div>
                )}
                {diagnosis.suggestedTests.length > 0 && (
                  <div className="text-[10px] text-blue-600">
                    → {diagnosis.suggestedTests.join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {interpretation.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-600 mb-2">
            Recomandari
          </h3>
          <ul className="space-y-1">
            {interpretation.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-blue-500">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
