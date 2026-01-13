'use client';

import { ClinicalInterpretation, Diagnosis } from '@/types';

interface InterpretationPanelProps {
  interpretation: ClinicalInterpretation | null;
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

export function InterpretationPanel({
  interpretation,
}: InterpretationPanelProps): React.ReactElement {
  if (!interpretation) {
    return (
      <div className="panel p-3 md:p-4 h-full w-full flex flex-col">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Interpretare Clinică
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400 text-center">
            Introduceți valorile de laborator<br />pentru interpretare automată
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-3 md:p-4 h-full w-full flex flex-col">
      {/* Header */}
      <div className="mb-3 md:mb-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Interpretare Clinică
        </h2>
      </div>

      {/* Pattern summary */}
      <div className={`p-3 rounded-lg mb-3 md:mb-4 ${
        interpretation.affectedPathway === 'none'
          ? 'bg-green-50 border border-green-200'
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="text-xs font-medium text-slate-500 mb-1">Pattern Identificat</div>
        <div className={`text-sm md:text-sm font-semibold ${
          interpretation.affectedPathway === 'none' ? 'text-green-700' : 'text-blue-700'
        }`}>
          {interpretation.pattern}
        </div>
        {interpretation.affectedPathway !== 'none' && (
          <div className="text-xs text-slate-500 mt-1">
            Cale afectată: {interpretation.affectedPathway === 'intrinsic' ? 'Intrinsecă' :
              interpretation.affectedPathway === 'extrinsic' ? 'Extrinsecă' :
              interpretation.affectedPathway === 'common' ? 'Comună' :
              interpretation.affectedPathway === 'platelet' ? 'Plachetară' : 'Mixtă'}
          </div>
        )}
      </div>

      {/* Warnings */}
      {interpretation.warnings.length > 0 && (
        <div className="mb-3 md:mb-4 space-y-2">
          {interpretation.warnings.map((warning, i) => (
            <div
              key={i}
              className="p-2.5 md:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
            >
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm md:text-xs text-red-700">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* ISTH DIC Score */}
      {interpretation.isthScore && (
        <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-orange-800">Scor ISTH pentru CID</h3>
            <span className={`text-base md:text-lg font-bold ${
              interpretation.isthScore.total >= 5 ? 'text-red-600' : 'text-orange-600'
            }`}>
              {interpretation.isthScore.total}/8
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 md:gap-2 mb-2">
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-orange-100">
              <div className="text-[10px] text-slate-500">PLT</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.isthScore.platelets}</div>
            </div>
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-orange-100">
              <div className="text-[10px] text-slate-500">D-dim</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.isthScore.dDimers}</div>
            </div>
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-orange-100">
              <div className="text-[10px] text-slate-500">PT</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.isthScore.pt}</div>
            </div>
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-orange-100">
              <div className="text-[10px] text-slate-500">Fib</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.isthScore.fibrinogen}</div>
            </div>
          </div>
          <div className={`text-xs font-medium text-center py-1.5 md:py-1 rounded ${
            interpretation.isthScore.total >= 5
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {interpretation.isthScore.interpretation}
          </div>
        </div>
      )}

      {/* 4T Score for HIT */}
      {interpretation.hit4TScore && (
        <div className={`mb-3 md:mb-4 p-2.5 md:p-3 rounded-lg border ${
          interpretation.hit4TScore.probability === 'high'
            ? 'bg-red-50 border-red-200'
            : interpretation.hit4TScore.probability === 'intermediate'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs font-semibold ${
              interpretation.hit4TScore.probability === 'high'
                ? 'text-red-800'
                : interpretation.hit4TScore.probability === 'intermediate'
                  ? 'text-yellow-800'
                  : 'text-green-800'
            }`}>
              Scor 4T pentru HIT
            </h3>
            <span className={`text-base md:text-lg font-bold ${
              interpretation.hit4TScore.probability === 'high'
                ? 'text-red-600'
                : interpretation.hit4TScore.probability === 'intermediate'
                  ? 'text-yellow-600'
                  : 'text-green-600'
            }`}>
              {interpretation.hit4TScore.total}/8
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 md:gap-2 mb-2">
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-slate-100">
              <div className="text-[10px] text-slate-500">Plt↓</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.hit4TScore.thrombocytopenia}</div>
            </div>
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-slate-100">
              <div className="text-[10px] text-slate-500">Timing</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.hit4TScore.timing}</div>
            </div>
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-slate-100">
              <div className="text-[10px] text-slate-500">Tromb</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.hit4TScore.thrombosis}</div>
            </div>
            <div className="text-center p-1.5 md:p-1 bg-white rounded border border-slate-100">
              <div className="text-[10px] text-slate-500">Alte</div>
              <div className="text-sm font-semibold text-slate-700">{interpretation.hit4TScore.otherCauses}</div>
            </div>
          </div>
          <div className={`text-xs font-medium text-center py-1.5 md:py-1 rounded ${
            interpretation.hit4TScore.probability === 'high'
              ? 'bg-red-100 text-red-700'
              : interpretation.hit4TScore.probability === 'intermediate'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
          }`}>
            {interpretation.hit4TScore.interpretation}
          </div>
        </div>
      )}

      {/* Diagnoses */}
      <div className="flex-1 overflow-auto -mx-1 px-1">
        <h3 className="text-xs font-semibold text-slate-600 mb-2">
          Diagnostic Diferențial
        </h3>

        {interpretation.diagnoses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Profil de coagulare în limite normale
          </p>
        ) : (
          <div className="space-y-2.5 md:space-y-3">
            {interpretation.diagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className="p-2.5 md:p-3 border border-slate-200 rounded-lg active:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-slate-700">
                    {diagnosis.name}
                  </h4>
                  <ProbabilityBadge probability={diagnosis.probability} />
                </div>
                <p className="text-sm md:text-xs text-slate-500 mb-2">
                  {diagnosis.description}
                </p>
                {diagnosis.affectedFactors.length > 0 && (
                  <div className="text-[10px] text-slate-400 mb-1">
                    Factori: {diagnosis.affectedFactors.join(', ')}
                  </div>
                )}
                {diagnosis.suggestedTests.length > 0 && (
                  <div className="text-xs md:text-[10px] text-blue-600">
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
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-600 mb-2">
            Recomandări
          </h3>
          <ul className="space-y-1.5 md:space-y-1">
            {interpretation.recommendations.map((rec, i) => (
              <li key={i} className="text-sm md:text-xs text-slate-600 flex items-start gap-2">
                <span className="text-blue-500 flex-shrink-0">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
