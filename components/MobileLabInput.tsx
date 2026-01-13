'use client';

import { useState } from 'react';
import { LabInput, MedicationContext } from '@/types';
import { LAB_RANGES } from '@/engine/coagulation';

interface Preset {
  id: string;
  name: string;
  lab: Partial<LabInput>;
  meds?: Partial<MedicationContext>;
}

const PRESETS: Preset[] = [
  { id: 'normal', name: 'Normal', lab: { pt: 12, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 } },
  { id: 'warfarin', name: 'Warfarină', lab: { pt: 28, aptt: 38, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 250 }, meds: { warfarin: true } },
  { id: 'heparin', name: 'Heparină', lab: { pt: 14, aptt: 85, tt: 35, fibrinogen: 300, platelets: 220, dDimers: 300 }, meds: { heparin: true } },
  { id: 'hemophilia_a', name: 'Hemofilie A', lab: { pt: 12, aptt: 65, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200 } },
  { id: 'vwd', name: 'vWD', lab: { pt: 12, aptt: 45, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 12 } },
  { id: 'dic_bleeding', name: 'CID Hemoragic', lab: { pt: 28, aptt: 65, tt: 35, fibrinogen: 60, platelets: 25, dDimers: 6000, bleedingTime: 15 } },
  { id: 'liver', name: 'Insuf. Hepatică', lab: { pt: 20, aptt: 48, tt: 22, fibrinogen: 120, platelets: 90, dDimers: 800 } },
  { id: 'itp', name: 'ITP', lab: { pt: 12, aptt: 30, tt: 16, fibrinogen: 300, platelets: 25, dDimers: 300, bleedingTime: 12 } },
];

interface MobileLabInputProps {
  values: LabInput;
  medications: MedicationContext;
  onChange: (values: LabInput) => void;
  onMedicationChange: (meds: MedicationContext) => void;
  onReset: () => void;
  showScenarios: boolean;
  onToggleScenarios: () => void;
}

type NumericLabKey = 'pt' | 'aptt' | 'tt' | 'fibrinogen' | 'platelets' | 'dDimers' | 'bleedingTime';

const LAB_FIELDS: { key: NumericLabKey; label: string; short: string; step: number }[] = [
  { key: 'pt', label: 'PT', short: 'PT', step: 0.5 },
  { key: 'aptt', label: 'aPTT', short: 'aPTT', step: 1 },
  { key: 'tt', label: 'TT', short: 'TT', step: 0.5 },
  { key: 'fibrinogen', label: 'Fibrinogen', short: 'Fib', step: 10 },
  { key: 'platelets', label: 'Trombocite', short: 'PLT', step: 5 },
  { key: 'dDimers', label: 'D-Dimeri', short: 'D-dim', step: 50 },
  { key: 'bleedingTime', label: 'Timp sângerare', short: 'BT', step: 0.5 },
];

const MED_OPTIONS: { key: keyof MedicationContext; label: string; short: string }[] = [
  { key: 'warfarin', label: 'Warfarină', short: 'AVK' },
  { key: 'heparin', label: 'Heparină', short: 'HEP' },
  { key: 'lmwh', label: 'LMWH', short: 'LMWH' },
  { key: 'doac', label: 'DOAC', short: 'DOAC' },
  { key: 'antiplatelet', label: 'Antiagregant', short: 'ASA' },
];

function getStatus(value: number, key: NumericLabKey): 'normal' | 'abnormal' | 'critical' {
  const range = LAB_RANGES[key];
  if (!range) return 'normal';
  if (range.criticalLow !== undefined && value < range.criticalLow) return 'critical';
  if (range.criticalHigh !== undefined && value > range.criticalHigh) return 'critical';
  if (value < range.min || value > range.max) return 'abnormal';
  return 'normal';
}

export function MobileLabInput({
  values,
  medications,
  onChange,
  onMedicationChange,
  onReset,
  showScenarios,
  onToggleScenarios,
}: MobileLabInputProps): React.ReactElement {
  const [editingValues, setEditingValues] = useState<Partial<Record<NumericLabKey, string>>>({});

  const handleChange = (key: NumericLabKey, val: string): void => {
    setEditingValues(prev => ({ ...prev, [key]: val }));
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({ ...values, [key]: num });
    }
  };

  const handleBlur = (key: NumericLabKey): void => {
    setEditingValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getValue = (key: NumericLabKey): string | number => {
    return key in editingValues ? (editingValues[key] ?? '') : values[key];
  };

  const toggleMed = (key: keyof MedicationContext): void => {
    onMedicationChange({ ...medications, [key]: !medications[key] });
  };

  const applyPreset = (preset: Preset): void => {
    const newLab: LabInput = {
      pt: preset.lab.pt ?? 12,
      aptt: preset.lab.aptt ?? 30,
      tt: preset.lab.tt ?? 16,
      fibrinogen: preset.lab.fibrinogen ?? 300,
      platelets: preset.lab.platelets ?? 250,
      dDimers: preset.lab.dDimers ?? 200,
      bleedingTime: preset.lab.bleedingTime ?? 5,
      mixingTest: 'not_performed',
    };
    onChange(newLab);

    const newMeds: MedicationContext = {
      warfarin: preset.meds?.warfarin ?? false,
      heparin: preset.meds?.heparin ?? false,
      lmwh: preset.meds?.lmwh ?? false,
      doac: preset.meds?.doac ?? false,
      antiplatelet: preset.meds?.antiplatelet ?? false,
    };
    onMedicationChange(newMeds);
    onToggleScenarios();
  };

  return (
    <div className="space-y-3">
      {/* Header with reset */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Valori Laborator</span>
        <div className="flex gap-2">
          <button
            onClick={onToggleScenarios}
            className="text-[10px] text-blue-600 font-medium px-2 py-1 rounded bg-blue-50 active:bg-blue-100"
          >
            {showScenarios ? 'Închide' : 'Scenarii'}
          </button>
          <button
            onClick={onReset}
            className="text-[10px] text-slate-500 font-medium px-2 py-1 rounded bg-slate-100 active:bg-slate-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Scenarios dropdown */}
      {showScenarios && (
        <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-lg">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="px-2 py-2 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded active:bg-blue-50 active:border-blue-300"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Lab values - 2 column grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {LAB_FIELDS.map(({ key, short, step }) => {
          const range = LAB_RANGES[key];
          const status = getStatus(values[key], key);

          return (
            <div key={key} className="flex items-center gap-1.5">
              <label className="text-[11px] font-medium text-slate-500 w-10 flex-shrink-0">
                {short}
              </label>
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  step={step}
                  value={getValue(key)}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onBlur={() => handleBlur(key)}
                  className={`w-full pl-2 pr-7 py-1.5 text-sm border rounded text-right
                    ${status === 'normal'
                      ? 'border-slate-200 bg-white'
                      : status === 'abnormal'
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-red-400 bg-red-50'
                    }`}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
                  {range.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Medications - horizontal chips */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap gap-1.5">
          {MED_OPTIONS.map(({ key, short }) => (
            <button
              key={key}
              onClick={() => toggleMed(key)}
              className={`px-2.5 py-1.5 text-[10px] font-medium rounded-full border transition-colors
                ${medications[key]
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-slate-600 border-slate-300 active:bg-slate-100'
                }`}
            >
              {short}
            </button>
          ))}
        </div>
      </div>

      {/* Mixing Test - show when aPTT elevated */}
      {values.aptt > 40 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[10px] font-medium text-slate-500 mb-1.5">Mixing Test</div>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ ...values, mixingTest: 'not_performed' })}
              className={`flex-1 py-1.5 text-[10px] font-medium rounded border ${
                values.mixingTest === 'not_performed'
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Neefectuat
            </button>
            <button
              onClick={() => onChange({ ...values, mixingTest: 'corrects' })}
              className={`flex-1 py-1.5 text-[10px] font-medium rounded border ${
                values.mixingTest === 'corrects'
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Corectează
            </button>
            <button
              onClick={() => onChange({ ...values, mixingTest: 'does_not_correct' })}
              className={`flex-1 py-1.5 text-[10px] font-medium rounded border ${
                values.mixingTest === 'does_not_correct'
                  ? 'bg-red-100 border-red-400 text-red-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Nu corect.
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
