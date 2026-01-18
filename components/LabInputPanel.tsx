'use client';

import { useState } from 'react';
import { LabInput, MedicationContext } from '@/types';
import { LAB_RANGES, calculateINRFromPT, calculatePTFromINR } from '@/engine/coagulation';

interface Preset {
  id: string;
  name: string;
  lab: Partial<LabInput>;
  meds?: Partial<MedicationContext>;
}

const TREATMENT_PRESETS: Preset[] = [
  {
    id: 'normal',
    name: 'Normal',
    lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'warfarin',
    name: 'Warfarină/AVK',
    lab: { pt: 28, inr: 2.3, aptt: 38, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 250, bleedingTime: 5 },
    meds: { warfarin: true },
  },
  {
    id: 'heparin',
    name: 'Heparină UFH',
    lab: { pt: 14, inr: 1.2, aptt: 85, tt: 35, fibrinogen: 300, platelets: 220, dDimers: 300, bleedingTime: 6 },
    meds: { heparin: true },
  },
  {
    id: 'lmwh',
    name: 'LMWH',
    lab: { pt: 12, inr: 1.0, aptt: 38, tt: 18, fibrinogen: 300, platelets: 240, dDimers: 280, bleedingTime: 5 },
    meds: { lmwh: true },
  },
  {
    id: 'doac_xa',
    name: 'DOAC anti-Xa',
    lab: { pt: 12, inr: 1.0, aptt: 33, tt: 17, fibrinogen: 300, platelets: 250, dDimers: 250, bleedingTime: 5 },
    meds: { doacXa: true },
  },
  {
    id: 'doac_iia',
    name: 'DOAC anti-IIa',
    lab: { pt: 13, inr: 1.1, aptt: 38, tt: 35, fibrinogen: 300, platelets: 250, dDimers: 250, bleedingTime: 5 },
    meds: { doacIIa: true },
  },
  {
    id: 'antiplatelet',
    name: 'Antiagregant',
    lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 9 },
    meds: { antiplatelet: true },
  },
];

const PATHOLOGY_PRESETS: Preset[] = [
  {
    id: 'hemophilia_a',
    name: 'Hemofilie A',
    lab: { pt: 12, inr: 1.0, aptt: 65, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'hemophilia_b',
    name: 'Hemofilie B',
    lab: { pt: 12, inr: 1.0, aptt: 58, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'hemophilia_c',
    name: 'Hemofilie C',
    lab: { pt: 12, inr: 1.0, aptt: 52, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'f12_deficiency',
    name: 'Deficit Factor XII',
    lab: { pt: 12, inr: 1.0, aptt: 85, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'vwd',
    name: 'Boala von Willebrand',
    lab: { pt: 12, inr: 1.0, aptt: 45, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 12 },
  },
  {
    id: 'itp',
    name: 'Purpura Trombocitopenică',
    lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 25, dDimers: 300, bleedingTime: 12 },
  },
  {
    id: 'dic_activation',
    name: 'CID - Faza Activare',
    lab: { pt: 18, inr: 1.5, aptt: 33, tt: 18, fibrinogen: 280, platelets: 120, dDimers: 1500, bleedingTime: 6 },
  },
  {
    id: 'dic_consumption',
    name: 'CID - Faza Consum',
    lab: { pt: 22, inr: 1.8, aptt: 45, tt: 24, fibrinogen: 150, platelets: 70, dDimers: 3000, bleedingTime: 8 },
  },
  {
    id: 'dic_bleeding',
    name: 'CID - Faza Hemoragică',
    lab: { pt: 32, inr: 2.7, aptt: 65, tt: 35, fibrinogen: 60, platelets: 25, dDimers: 6000, bleedingTime: 15 },
  },
  {
    id: 'liver_failure',
    name: 'Insuficiență Hepatică',
    lab: { pt: 20, inr: 1.7, aptt: 48, tt: 22, fibrinogen: 120, platelets: 90, dDimers: 800, bleedingTime: 8 },
  },
  {
    id: 'vitk_def',
    name: 'Deficit Vitamina K',
    lab: { pt: 24, inr: 2.0, aptt: 50, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 300, bleedingTime: 5 },
  },
  {
    id: 'aps',
    name: 'Sindrom Antifosfolipidic',
    lab: { pt: 13, inr: 1.1, aptt: 52, tt: 16, fibrinogen: 320, platelets: 180, dDimers: 900, bleedingTime: 5 },
  },
  {
    id: 'thrombophilia',
    name: 'Trombofilie',
    lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 350, platelets: 280, dDimers: 1200, bleedingTime: 5 },
  },
];

interface LabInputPanelProps {
  values: LabInput;
  medications: MedicationContext;
  onChange: (values: LabInput) => void;
  onMedicationChange: (meds: MedicationContext) => void;
  onReset: () => void;
  onScenarioChange: (scenario: string | null) => void;
  onLabHover?: (labKey: string | null) => void;
}

type NumericLabKey = 'pt' | 'inr' | 'aptt' | 'tt' | 'fibrinogen' | 'platelets' | 'dDimers' | 'bleedingTime';

// PT and INR are handled separately in a special row
const LAB_FIELDS: { key: NumericLabKey; label: string; step: number }[] = [
  { key: 'aptt', label: 'aPTT', step: 0.1 },
  { key: 'tt', label: 'TT', step: 0.1 },
  { key: 'fibrinogen', label: 'Fibrinogen', step: 10 },
  { key: 'platelets', label: 'Trombocite', step: 1 },
  { key: 'dDimers', label: 'D-Dimeri', step: 50 },
  { key: 'bleedingTime', label: 'Timp sângerare', step: 0.5 },
];

const MEDICATION_OPTIONS: { key: keyof MedicationContext; label: string }[] = [
  { key: 'warfarin', label: 'Warfarină/AVK' },
  { key: 'heparin', label: 'Heparină UFH' },
  { key: 'lmwh', label: 'LMWH' },
  { key: 'doacXa', label: 'Anti-Xa (Xabani)' },
  { key: 'doacIIa', label: 'Anti-IIa (Dabigatran)' },
  { key: 'antiplatelet', label: 'Antiagregant' },
];

function getInputStatus(value: number, key: NumericLabKey): 'normal' | 'abnormal' | 'critical' {
  const range = LAB_RANGES[key];
  if (!range) return 'normal';

  if (range.criticalLow !== undefined && value < range.criticalLow) return 'critical';
  if (range.criticalHigh !== undefined && value > range.criticalHigh) return 'critical';
  if (value < range.min || value > range.max) return 'abnormal';
  return 'normal';
}

export function LabInputPanel({
  values,
  medications,
  onChange,
  onMedicationChange,
  onReset,
  onScenarioChange,
  onLabHover,
}: LabInputPanelProps): React.ReactElement {
  const [editingValues, setEditingValues] = useState<Partial<Record<NumericLabKey, string>>>({});
  const [activeTab, setActiveTab] = useState<'lab' | 'scenarios'>('lab');

  const handleInputChange = (key: NumericLabKey, value: string): void => {
    setEditingValues(prev => ({ ...prev, [key]: value }));
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange({ ...values, [key]: numValue });
      // Clear scenario when manually changing lab values
      onScenarioChange(null);
    }
  };

  const handleInputBlur = (key: NumericLabKey): void => {
    setEditingValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getInputValue = (key: NumericLabKey): string | number => {
    if (key in editingValues) {
      return editingValues[key] ?? '';
    }
    return values[key];
  };

  const handleMedChange = (key: keyof MedicationContext): void => {
    onMedicationChange({ ...medications, [key]: !medications[key] });
  };

  // PT change → auto-update INR
  const handlePTChange = (value: string): void => {
    setEditingValues(prev => ({ ...prev, pt: value }));
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newINR = calculateINRFromPT(numValue);
      onChange({ ...values, pt: numValue, inr: newINR });
      // Clear scenario when manually changing lab values
      onScenarioChange(null);
    }
  };

  // INR change → auto-update PT
  const handleINRChange = (value: string): void => {
    setEditingValues(prev => ({ ...prev, inr: value }));
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newPT = calculatePTFromINR(numValue);
      onChange({ ...values, inr: numValue, pt: newPT });
      // Clear scenario when manually changing lab values
      onScenarioChange(null);
    }
  };

  const applyPreset = (preset: Preset): void => {
    const newLab: LabInput = {
      pt: preset.lab.pt ?? 12,
      inr: preset.lab.inr ?? 1.0,
      aptt: preset.lab.aptt ?? 30,
      tt: preset.lab.tt ?? 16,
      fibrinogen: preset.lab.fibrinogen ?? 300,
      platelets: preset.lab.platelets ?? 250,
      dDimers: preset.lab.dDimers ?? 200,
      bleedingTime: preset.lab.bleedingTime ?? 5,
      mixingTest: preset.lab.mixingTest ?? 'not_performed',
      apttMix: undefined,
    };
    onChange(newLab);
    setEditingValues({});

    const newMeds: MedicationContext = {
      warfarin: preset.meds?.warfarin ?? false,
      heparin: preset.meds?.heparin ?? false,
      lmwh: preset.meds?.lmwh ?? false,
      doacXa: preset.meds?.doacXa ?? false,
      doacIIa: preset.meds?.doacIIa ?? false,
      antiplatelet: preset.meds?.antiplatelet ?? false,
    };
    onMedicationChange(newMeds);
    onScenarioChange(preset.name);
    setActiveTab('lab');
  };

  return (
    <div className="panel p-4 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-1 mb-3 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'lab'
              ? 'bg-white text-slate-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Date Lab
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'scenarios'
              ? 'bg-white text-slate-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Scenarii
        </button>
      </div>

      {activeTab === 'scenarios' ? (
        <div className="flex-1 overflow-auto">
          {/* Treatment Section */}
          <div className="mb-4">
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Tratament Anticoagulant
            </h3>
            <div className="space-y-1">
              {TREATMENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="w-full px-2 py-1.5 text-xs font-medium text-left text-slate-600 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Pathology Section */}
          <div>
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Patologii Coagulare
            </h3>
            <div className="space-y-1">
              {PATHOLOGY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="w-full px-2 py-1.5 text-xs font-medium text-left text-slate-600 bg-white border border-slate-200 rounded hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Valori Laborator
            </h2>
            <button
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Reset
            </button>
          </div>

          <div className="flex-1 overflow-auto space-y-3">
            {/* PT / INR Row - Two columns */}
            <div className="grid grid-cols-2 gap-2">
              {/* PT */}
              <div
                className="space-y-1"
                onMouseEnter={() => onLabHover?.('pt')}
                onMouseLeave={() => onLabHover?.(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">PT</label>
                  <span className="text-[10px] text-slate-400">
                    {LAB_RANGES.pt.min}–{LAB_RANGES.pt.max} s
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step={0.1}
                    value={'pt' in editingValues ? editingValues.pt : values.pt}
                    onChange={(e) => handlePTChange(e.target.value)}
                    onBlur={() => handleInputBlur('pt')}
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                      ${getInputStatus(values.pt, 'pt') === 'normal'
                        ? 'border-slate-200 focus:border-blue-400 bg-white'
                        : getInputStatus(values.pt, 'pt') === 'abnormal'
                          ? 'border-orange-300 bg-orange-50 focus:border-orange-400'
                          : 'border-red-400 bg-red-50 focus:border-red-500'
                      }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">s</span>
                </div>
              </div>
              {/* INR */}
              <div
                className="space-y-1"
                onMouseEnter={() => onLabHover?.('inr')}
                onMouseLeave={() => onLabHover?.(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">INR</label>
                  <span className="text-[10px] text-slate-400">
                    {LAB_RANGES.inr.min}–{LAB_RANGES.inr.max}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step={0.01}
                    value={'inr' in editingValues ? editingValues.inr : values.inr}
                    onChange={(e) => handleINRChange(e.target.value)}
                    onBlur={() => handleInputBlur('inr')}
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                      ${getInputStatus(values.inr, 'inr') === 'normal'
                        ? 'border-slate-200 focus:border-blue-400 bg-white'
                        : getInputStatus(values.inr, 'inr') === 'abnormal'
                          ? 'border-orange-300 bg-orange-50 focus:border-orange-400'
                          : 'border-red-400 bg-red-50 focus:border-red-500'
                      }`}
                  />
                </div>
              </div>
            </div>

            {LAB_FIELDS.map(({ key, label, step }) => {
              const range = LAB_RANGES[key];
              const status = getInputStatus(values[key], key);

              return (
                <div
                  key={key}
                  className="space-y-1"
                  onMouseEnter={() => onLabHover?.(key)}
                  onMouseLeave={() => onLabHover?.(null)}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">
                      {label}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {range.min}–{range.max} {range.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step={step}
                      value={getInputValue(key)}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      onBlur={() => handleInputBlur(key)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                        ${status === 'normal'
                          ? 'border-slate-200 focus:border-blue-400 bg-white'
                          : status === 'abnormal'
                            ? 'border-orange-300 bg-orange-50 focus:border-orange-400'
                            : 'border-red-400 bg-red-50 focus:border-red-500'
                        }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {range.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Medications - compact inline chips */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-medium text-slate-500">Medicație:</span>
              <div className="flex flex-wrap gap-1">
                {MEDICATION_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleMedChange(key)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors ${
                      medications[key]
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-slate-500 border-slate-300 hover:border-blue-300'
                    }`}
                  >
                    {label.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mixing Test - compact inline when aPTT elevated */}
          {values.aptt > 40 && (
            <div className="mt-2 flex items-center gap-2 text-[10px]">
              <span className="text-slate-500">Mixaj:</span>
              <select
                value={values.mixingTest}
                onChange={(e) => {
                  onChange({ ...values, mixingTest: e.target.value as LabInput['mixingTest'] });
                  onScenarioChange(null);
                }}
                className={`px-2 py-0.5 text-[10px] border rounded ${
                  values.mixingTest === 'corrects' ? 'border-green-300 bg-green-50 text-green-700' :
                  values.mixingTest === 'does_not_correct' ? 'border-red-300 bg-red-50 text-red-700' :
                  'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <option value="not_performed">Neefectuat</option>
                <option value="corrects">Corectează (deficit)</option>
                <option value="does_not_correct">NU corectează (inhibitor)</option>
              </select>
            </div>
          )}

        </>
      )}
    </div>
  );
}
