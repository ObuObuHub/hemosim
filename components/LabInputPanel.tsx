'use client';

import { useState } from 'react';
import { LabInput, MedicationContext, Hit4TCriteria } from '@/types';
import { LAB_RANGES } from '@/engine/coagulation';

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
    lab: { pt: 12, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'warfarin',
    name: 'Warfarină/AVK',
    lab: { pt: 28, aptt: 38, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 250, bleedingTime: 5 },
    meds: { warfarin: true },
  },
  {
    id: 'heparin',
    name: 'Heparină UFH',
    lab: { pt: 14, aptt: 85, tt: 35, fibrinogen: 300, platelets: 220, dDimers: 300, bleedingTime: 6 },
    meds: { heparin: true },
  },
  {
    id: 'lmwh',
    name: 'LMWH',
    lab: { pt: 12, aptt: 38, tt: 18, fibrinogen: 300, platelets: 240, dDimers: 280, bleedingTime: 5 },
    meds: { lmwh: true },
  },
  {
    id: 'doac',
    name: 'DOAC',
    lab: { pt: 14, aptt: 35, tt: 20, fibrinogen: 300, platelets: 250, dDimers: 250, bleedingTime: 5 },
    meds: { doac: true },
  },
];

const PATHOLOGY_PRESETS: Preset[] = [
  {
    id: 'hemophilia_a',
    name: 'Hemofilie A',
    lab: { pt: 12, aptt: 65, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'hemophilia_b',
    name: 'Hemofilie B',
    lab: { pt: 12, aptt: 58, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 },
  },
  {
    id: 'vwd',
    name: 'Boala von Willebrand',
    lab: { pt: 12, aptt: 45, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 12 },
  },
  {
    id: 'itp',
    name: 'Purpura Trombocitopenică',
    lab: { pt: 12, aptt: 30, tt: 16, fibrinogen: 300, platelets: 25, dDimers: 300, bleedingTime: 12 },
  },
  {
    id: 'dic_activation',
    name: 'CID - Faza Activare',
    lab: { pt: 14, aptt: 33, tt: 18, fibrinogen: 280, platelets: 120, dDimers: 1500, bleedingTime: 6 },
  },
  {
    id: 'dic_consumption',
    name: 'CID - Faza Consum',
    lab: { pt: 18, aptt: 45, tt: 24, fibrinogen: 150, platelets: 70, dDimers: 3000, bleedingTime: 8 },
  },
  {
    id: 'dic_bleeding',
    name: 'CID - Faza Hemoragică',
    lab: { pt: 28, aptt: 65, tt: 35, fibrinogen: 60, platelets: 25, dDimers: 6000, bleedingTime: 15 },
  },
  {
    id: 'liver_failure',
    name: 'Insuficiență Hepatică',
    lab: { pt: 20, aptt: 48, tt: 22, fibrinogen: 120, platelets: 90, dDimers: 800, bleedingTime: 8 },
  },
  {
    id: 'vitk_def',
    name: 'Deficit Vitamina K',
    lab: { pt: 24, aptt: 50, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 300, bleedingTime: 5 },
  },
  {
    id: 'aps',
    name: 'Sindrom Antifosfolipidic',
    lab: { pt: 13, aptt: 52, tt: 16, fibrinogen: 320, platelets: 180, dDimers: 900, bleedingTime: 5 },
  },
  {
    id: 'thrombophilia',
    name: 'Trombofilie',
    lab: { pt: 12, aptt: 30, tt: 16, fibrinogen: 350, platelets: 280, dDimers: 1200, bleedingTime: 5 },
  },
];

interface LabInputPanelProps {
  values: LabInput;
  medications: MedicationContext;
  hit4TCriteria: Hit4TCriteria;
  onChange: (values: LabInput) => void;
  onMedicationChange: (meds: MedicationContext) => void;
  onHit4TCriteriaChange: (criteria: Hit4TCriteria) => void;
  onReset: () => void;
}

type NumericLabKey = 'pt' | 'aptt' | 'tt' | 'fibrinogen' | 'platelets' | 'dDimers' | 'bleedingTime';

const LAB_FIELDS: { key: NumericLabKey; label: string; step: number }[] = [
  { key: 'pt', label: 'PT', step: 0.1 },
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
  { key: 'doac', label: 'DOAC' },
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
  hit4TCriteria,
  onChange,
  onMedicationChange,
  onHit4TCriteriaChange,
  onReset,
}: LabInputPanelProps): React.ReactElement {
  const [editingValues, setEditingValues] = useState<Partial<Record<NumericLabKey, string>>>({});
  const [activeTab, setActiveTab] = useState<'lab' | 'scenarios'>('lab');

  const handleInputChange = (key: NumericLabKey, value: string): void => {
    setEditingValues(prev => ({ ...prev, [key]: value }));
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange({ ...values, [key]: numValue });
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

  const applyPreset = (preset: Preset): void => {
    const newLab: LabInput = {
      pt: preset.lab.pt ?? 12,
      aptt: preset.lab.aptt ?? 30,
      tt: preset.lab.tt ?? 16,
      fibrinogen: preset.lab.fibrinogen ?? 300,
      platelets: preset.lab.platelets ?? 250,
      dDimers: preset.lab.dDimers ?? 200,
      bleedingTime: preset.lab.bleedingTime ?? 5,
      mixingTest: preset.lab.mixingTest ?? 'not_performed',
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
            {LAB_FIELDS.map(({ key, label, step }) => {
              const range = LAB_RANGES[key];
              const status = getInputStatus(values[key], key);

              return (
                <div key={key} className="space-y-1">
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

          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-600 mb-3">
              Medicație Curentă
            </h3>
            <div className="space-y-2">
              {MEDICATION_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={medications[key]}
                    onChange={() => handleMedChange(key)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                  />
                  <span className="text-xs text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mixing Test - only show when aPTT is elevated */}
          {values.aptt > 40 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-600 mb-2">
                Mixing Test
              </h3>
              <p className="text-[10px] text-slate-400 mb-3">
                aPTT prelungit detectat. Efectuează mixing test pentru diferențiere.
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mixingTest"
                    checked={values.mixingTest === 'not_performed'}
                    onChange={() => onChange({ ...values, mixingTest: 'not_performed' })}
                    className="w-4 h-4 border-slate-300 text-blue-500 focus:ring-blue-400"
                  />
                  <span className="text-xs text-slate-600">Neefectuat</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mixingTest"
                    checked={values.mixingTest === 'corrects'}
                    onChange={() => onChange({ ...values, mixingTest: 'corrects' })}
                    className="w-4 h-4 border-slate-300 text-green-500 focus:ring-green-400"
                  />
                  <span className="text-xs text-green-700 font-medium">Corectează → Deficit factor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mixingTest"
                    checked={values.mixingTest === 'does_not_correct'}
                    onChange={() => onChange({ ...values, mixingTest: 'does_not_correct' })}
                    className="w-4 h-4 border-slate-300 text-red-500 focus:ring-red-400"
                  />
                  <span className="text-xs text-red-700 font-medium">NU corectează → Inhibitor</span>
                </label>
              </div>
            </div>
          )}

          {/* 4T Score for HIT - show when heparin/LMWH and platelets low */}
          {(medications.heparin || medications.lmwh) && values.platelets < 150 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-600 mb-2">
                Scor 4T pentru HIT
              </h3>
              <p className="text-[10px] text-slate-400 mb-3">
                Trombocitopenie sub heparină - evaluează riscul HIT
              </p>

              {/* Thrombocytopenia */}
              <div className="mb-3">
                <label className="text-[10px] font-medium text-slate-500 block mb-1">
                  1. Trombocitopenie
                </label>
                <select
                  value={hit4TCriteria.thrombocytopenia}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombocytopenia: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  <option value={2}>Scădere &gt;50% și nadir ≥20 (2 pct)</option>
                  <option value={1}>Scădere 30-50% sau nadir 10-19 (1 pct)</option>
                  <option value={0}>Scădere &lt;30% sau nadir &lt;10 (0 pct)</option>
                </select>
              </div>

              {/* Timing */}
              <div className="mb-3">
                <label className="text-[10px] font-medium text-slate-500 block mb-1">
                  2. Timing scădere trombocite
                </label>
                <select
                  value={hit4TCriteria.timing}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, timing: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  <option value={2}>Ziua 5-10 sau ≤1 zi (expunere recentă) (2 pct)</option>
                  <option value={1}>Ziua &gt;10 sau timing neclar (1 pct)</option>
                  <option value={0}>Ziua ≤4 fără expunere recentă (0 pct)</option>
                </select>
              </div>

              {/* Thrombosis */}
              <div className="mb-3">
                <label className="text-[10px] font-medium text-slate-500 block mb-1">
                  3. Tromboză sau alte sechele
                </label>
                <select
                  value={hit4TCriteria.thrombosis}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, thrombosis: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  <option value={2}>Tromboză nouă/necroză cutanată/reacție sistemică (2 pct)</option>
                  <option value={1}>Tromboză progresivă/recurentă sau suspectată (1 pct)</option>
                  <option value={0}>Fără tromboză (0 pct)</option>
                </select>
              </div>

              {/* Other causes */}
              <div className="mb-3">
                <label className="text-[10px] font-medium text-slate-500 block mb-1">
                  4. Alte cauze de trombocitopenie
                </label>
                <select
                  value={hit4TCriteria.otherCauses}
                  onChange={(e) => onHit4TCriteriaChange({ ...hit4TCriteria, otherCauses: Number(e.target.value) as 0 | 1 | 2 })}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                >
                  <option value={2}>Nicio altă cauză evidentă (2 pct)</option>
                  <option value={1}>Posibilă altă cauză (1 pct)</option>
                  <option value={0}>Cauză alternativă certă (0 pct)</option>
                </select>
              </div>

              {/* Score preview */}
              <div className={`p-2 rounded-md text-center ${
                (hit4TCriteria.thrombocytopenia + hit4TCriteria.timing + hit4TCriteria.thrombosis + hit4TCriteria.otherCauses) >= 6
                  ? 'bg-red-100 border border-red-300'
                  : (hit4TCriteria.thrombocytopenia + hit4TCriteria.timing + hit4TCriteria.thrombosis + hit4TCriteria.otherCauses) >= 4
                    ? 'bg-yellow-100 border border-yellow-300'
                    : 'bg-green-100 border border-green-300'
              }`}>
                <span className="text-xs font-semibold">
                  Scor: {hit4TCriteria.thrombocytopenia + hit4TCriteria.timing + hit4TCriteria.thrombosis + hit4TCriteria.otherCauses}/8
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
