'use client';

import { useState } from 'react';
import { LabInput, MedicationContext } from '@/types';
import { LAB_RANGES, calculateINRFromPT, calculatePTFromINR, interpretRosnerIndex } from '@/engine/coagulation';

interface Preset {
  id: string;
  name: string;
  lab: Partial<LabInput>;
  meds?: Partial<MedicationContext>;
}

// Category definitions for organized scenario picker
interface PresetCategory {
  id: string;
  name: string;
  presets: Preset[];
}

// IMPORTANT: Numele presetelor TREBUIE să se potrivească cu SCENARIO_AFFECTED_FACTORS din interpreter.ts
const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: 'anticoagulant',
    name: 'Tratament Anticoagulant',
    presets: [
      { id: 'normal', name: 'Normal', lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 } },
      { id: 'warfarin', name: 'AVK/Warfarină', lab: { pt: 28, inr: 2.3, aptt: 38, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 250 }, meds: { warfarin: true } },
      { id: 'heparin', name: 'Heparină UFH', lab: { pt: 14, inr: 1.2, aptt: 85, tt: 35, fibrinogen: 300, platelets: 220, dDimers: 300 }, meds: { heparin: true } },
      { id: 'lmwh', name: 'LMWH', lab: { pt: 12, inr: 1.0, aptt: 38, tt: 18, fibrinogen: 300, platelets: 240, dDimers: 280, bleedingTime: 5 }, meds: { lmwh: true } },
      { id: 'doac_xa', name: 'DOAC anti-Xa', lab: { pt: 12, inr: 1.0, aptt: 33, tt: 17, fibrinogen: 300, platelets: 250, dDimers: 250, bleedingTime: 5 }, meds: { doacXa: true } },
      { id: 'doac_iia', name: 'DOAC anti-IIa', lab: { pt: 13, inr: 1.1, aptt: 38, tt: 35, fibrinogen: 300, platelets: 250, dDimers: 250, bleedingTime: 5 }, meds: { doacIIa: true } },
      { id: 'antiplatelet', name: 'Antiagregant', lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 9 }, meds: { antiplatelet: true } },
    ],
  },
  {
    id: 'intrinsic',
    name: 'Cale Intrinsecă',
    presets: [
      { id: 'hemophilia_a', name: 'Hemofilie A', lab: { pt: 12, inr: 1.0, aptt: 65, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, mixingTest: 'corrects' } },
      { id: 'hemophilia_b', name: 'Hemofilie B', lab: { pt: 12, inr: 1.0, aptt: 55, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, mixingTest: 'corrects' } },
      { id: 'hemophilia_c', name: 'Hemofilie C', lab: { pt: 12, inr: 1.0, aptt: 52, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5, mixingTest: 'corrects' } },
      { id: 'f12_deficiency', name: 'Deficit factor XII', lab: { pt: 12, inr: 1.0, aptt: 85, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5, mixingTest: 'corrects' } },
      { id: 'vwd', name: 'Boala von Willebrand', lab: { pt: 12, inr: 1.0, aptt: 45, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 12, mixingTest: 'corrects' } },
    ],
  },
  {
    id: 'common',
    name: 'Cale Comună',
    presets: [
      { id: 'f2_deficiency', name: 'Deficit factor II', lab: { pt: 22, inr: 1.9, aptt: 48, tt: 18, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 } },
      { id: 'f5_deficiency', name: 'Deficit factor V', lab: { pt: 20, inr: 1.7, aptt: 45, tt: 17, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 } },
      { id: 'f10_deficiency', name: 'Deficit factor X', lab: { pt: 24, inr: 2.0, aptt: 52, tt: 17, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 6 } },
    ],
  },
  {
    id: 'fibrinogen',
    name: 'Fibrinogen',
    presets: [
      { id: 'afibrinogenemia', name: 'Afibrinogenemie', lab: { pt: 60, inr: 5.5, aptt: 120, tt: 120, fibrinogen: 20, platelets: 250, dDimers: 100, bleedingTime: 15 } },
      { id: 'dysfibrinogenemia', name: 'Disfibrinogenemie', lab: { pt: 16, inr: 1.3, aptt: 35, tt: 45, fibrinogen: 150, platelets: 250, dDimers: 300, bleedingTime: 7 } },
      { id: 'f13_deficiency', name: 'Deficit factor XIII', lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 200, bleedingTime: 5 } },
    ],
  },
  {
    id: 'platelets',
    name: 'Trombocite',
    presets: [
      { id: 'itp', name: 'Purpură trombocitopenică', lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 300, platelets: 25, dDimers: 300, bleedingTime: 12 } },
    ],
  },
  {
    id: 'dic',
    name: 'CID Progresie',
    presets: [
      { id: 'dic_activation', name: 'CID - faza activare', lab: { pt: 18, inr: 1.5, aptt: 33, tt: 18, fibrinogen: 280, platelets: 120, dDimers: 1500, bleedingTime: 6 } },
      { id: 'dic_consumption', name: 'CID - faza consum', lab: { pt: 22, inr: 1.8, aptt: 45, tt: 24, fibrinogen: 150, platelets: 70, dDimers: 3000, bleedingTime: 8 } },
      { id: 'dic_bleeding', name: 'CID - faza hemoragică', lab: { pt: 32, inr: 2.7, aptt: 65, tt: 35, fibrinogen: 60, platelets: 25, dDimers: 6000, bleedingTime: 15 } },
    ],
  },
  {
    id: 'acquired',
    name: 'Deficite Dobândite',
    presets: [
      { id: 'liver', name: 'Insuficiență hepatică', lab: { pt: 20, inr: 1.7, aptt: 48, tt: 22, fibrinogen: 120, platelets: 90, dDimers: 800 } },
      { id: 'vitk_def', name: 'Deficit vitamina K', lab: { pt: 24, inr: 2.0, aptt: 50, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 300, bleedingTime: 5 } },
    ],
  },
  {
    id: 'thrombophilia',
    name: 'Trombofilii',
    presets: [
      { id: 'aps', name: 'Sindrom antifosfolipidic', lab: { pt: 12, inr: 1.0, aptt: 55, tt: 16, fibrinogen: 300, platelets: 250, dDimers: 400, mixingTest: 'does_not_correct' } },
      { id: 'thrombophilia', name: 'Trombofilie', lab: { pt: 12, inr: 1.0, aptt: 30, tt: 16, fibrinogen: 350, platelets: 280, dDimers: 1200, bleedingTime: 5 } },
    ],
  },
];

// Flat list for backwards compatibility (currently unused but kept for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Kept for backwards compatibility
const _PRESETS: Preset[] = PRESET_CATEGORIES.flatMap(cat => cat.presets);

interface MobileLabInputProps {
  values: LabInput;
  medications: MedicationContext;
  onChange: (values: LabInput) => void;
  onMedicationChange: (meds: MedicationContext) => void;
  onReset: () => void;
  showScenarios: boolean;
  onToggleScenarios: () => void;
  onScenarioChange: (scenario: string | null) => void;
}

type NumericLabKey = 'pt' | 'inr' | 'aptt' | 'tt' | 'fibrinogen' | 'platelets' | 'dDimers' | 'bleedingTime';

// PT and INR are handled separately in a special row
const LAB_FIELDS: { key: NumericLabKey; label: string; short: string; step: number; note?: string }[] = [
  { key: 'aptt', label: 'aPTT', short: 'aPTT', step: 1 },
  { key: 'tt', label: 'TT', short: 'TT', step: 0.5 },
  { key: 'fibrinogen', label: 'Fibrinogen', short: 'Fib', step: 10 },
  { key: 'platelets', label: 'Trombocite', short: 'PLT', step: 5 },
  { key: 'dDimers', label: 'D-Dimeri', short: 'D-dim', step: 50 },
  { key: 'bleedingTime', label: 'Timp sângerare', short: 'TS', step: 0.5 },
];

const MED_OPTIONS: { key: keyof MedicationContext; label: string; short: string }[] = [
  { key: 'warfarin', label: 'Warfarină', short: 'AVK' },
  { key: 'heparin', label: 'Heparină', short: 'HEP' },
  { key: 'lmwh', label: 'LMWH', short: 'LMWH' },
  { key: 'doacXa', label: 'Anti-Xa', short: 'Xa' },
  { key: 'doacIIa', label: 'Anti-IIa', short: 'IIa' },
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
  onScenarioChange,
}: MobileLabInputProps): React.ReactElement {
  const [editingValues, setEditingValues] = useState<Partial<Record<NumericLabKey, string>>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['anticoagulant']));

  const handleChange = (key: NumericLabKey, val: string): void => {
    setEditingValues(prev => ({ ...prev, [key]: val }));
    const num = parseFloat(val);
    // Validate: finite, non-negative, reasonable bounds
    if (!isNaN(num) && isFinite(num) && num >= 0 && num <= 100000) {
      onChange({ ...values, [key]: num });
      // Clear scenario when manually changing lab values
      onScenarioChange(null);
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

  // PT change → auto-update INR
  const handlePTChange = (value: string): void => {
    setEditingValues(prev => ({ ...prev, pt: value }));
    const numValue = parseFloat(value);
    // Validate: finite, non-negative, reasonable bounds
    if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0 && numValue <= 100000) {
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
    // Validate: finite, non-negative, reasonable bounds
    if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0 && numValue <= 100000) {
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
      apttMix: undefined, // Reset mixing test value
    };
    onChange(newLab);
    setEditingValues({}); // Clear any editing state

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
    onToggleScenarios();
  };

  return (
    <div className="space-y-4">
      {/* Header with reset */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-slate-700">Valori Laborator</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onToggleScenarios}
            className="text-sm text-blue-600 font-medium px-5 py-3 rounded-lg bg-blue-50 active:bg-blue-100 transition-colors min-h-[48px]"
          >
            {showScenarios ? 'Închide' : 'Scenarii'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-slate-600 font-medium px-5 py-3 rounded-lg bg-slate-100 active:bg-slate-200 transition-colors min-h-[48px]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Categorized Scenarios Picker */}
      {showScenarios && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-3 max-h-[50vh] overflow-y-auto">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              aria-label="Caută scenariu"
              placeholder="Caută scenariu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.slice(0, 100))}
              className="w-full pl-11 pr-12 py-3.5 text-base border-2 border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 min-h-[48px]"
            />
            <svg aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                aria-label="Șterge căutarea"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Categories */}
          {PRESET_CATEGORIES.map(category => {
            const filteredPresets = searchQuery
              ? category.presets.filter(p =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : category.presets;

            // Skip empty categories when searching
            if (searchQuery && filteredPresets.length === 0) return null;

            // Auto-expand categories with matches when searching
            const isExpanded = searchQuery
              ? filteredPresets.length > 0
              : expandedCategories.has(category.id);

            const toggleCategory = (): void => {
              if (searchQuery) return; // Don't toggle when searching
              setExpandedCategories(prev => {
                const next = new Set(prev);
                if (next.has(category.id)) {
                  next.delete(category.id);
                } else {
                  next.add(category.id);
                }
                return next;
              });
            };

            return (
              <div key={category.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Category Header */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`category-${category.id}`}
                  onClick={toggleCategory}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left bg-slate-50 active:bg-slate-100 transition-colors min-h-[48px]"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {category.name}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({filteredPresets.length})
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Category Presets */}
                {isExpanded && (
                  <div id={`category-${category.id}`} className="flex flex-col gap-2 p-3">
                    {filteredPresets.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="px-4 py-3.5 text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-lg active:bg-blue-50 active:border-blue-300 transition-colors text-left min-h-[48px]"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PT / INR Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* PT */}
        <div className="flex flex-col gap-2">
          <label htmlFor="input-pt" className="text-sm font-semibold text-slate-700 uppercase tracking-wide">PT</label>
          <div className="relative">
            <input
              id="input-pt"
              type="number"
              inputMode="decimal"
              step={0.5}
              value={'pt' in editingValues ? editingValues.pt : values.pt}
              onChange={(e) => handlePTChange(e.target.value)}
              onBlur={() => handleBlur('pt')}
              className={`w-full pl-4 pr-10 py-3.5 text-lg border-2 rounded-lg text-right transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50 min-h-[48px]
                ${getStatus(values.pt, 'pt') === 'normal'
                  ? 'border-slate-300 bg-white'
                  : getStatus(values.pt, 'pt') === 'abnormal'
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-red-500 bg-red-50'
                }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">s</span>
          </div>
        </div>
        {/* INR */}
        <div className="flex flex-col gap-2">
          <label htmlFor="input-inr" className="text-sm font-semibold text-slate-700 uppercase tracking-wide">INR</label>
          <div className="relative">
            <input
              id="input-inr"
              type="number"
              inputMode="decimal"
              step={0.01}
              value={'inr' in editingValues ? editingValues.inr : values.inr}
              onChange={(e) => handleINRChange(e.target.value)}
              onBlur={() => handleBlur('inr')}
              className={`w-full pl-4 pr-4 py-3.5 text-lg border-2 rounded-lg text-right transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50 min-h-[48px]
                ${getStatus(values.inr, 'inr') === 'normal'
                  ? 'border-slate-300 bg-white'
                  : getStatus(values.inr, 'inr') === 'abnormal'
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-red-500 bg-red-50'
                }`}
            />
          </div>
        </div>
      </div>

      {/* Lab values - 2 column grid */}
      <div className="grid grid-cols-2 gap-4">
        {LAB_FIELDS.map(({ key, short, step }) => {
          const range = LAB_RANGES[key];
          const status = getStatus(values[key], key);

          return (
            <div key={key} className="flex flex-col gap-2">
              <label htmlFor={`input-${key}`} className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                {short}
              </label>
              <div className="relative">
                <input
                  id={`input-${key}`}
                  type="number"
                  inputMode="decimal"
                  step={step}
                  value={getValue(key)}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onBlur={() => handleBlur(key)}
                  className={`w-full pl-4 pr-16 py-3.5 text-lg border-2 rounded-lg text-right transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50 min-h-[48px]
                    ${status === 'normal'
                      ? 'border-slate-300 bg-white'
                      : status === 'abnormal'
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
                  {range.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Medications - horizontal chips */}
      <div className="pt-4 border-t-2 border-slate-200">
        <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 block">
          Medicație
        </label>
        <div className="flex flex-wrap gap-3">
          {MED_OPTIONS.map(({ key, short }) => (
            <button
              key={key}
              type="button"
              aria-pressed={medications[key]}
              onClick={() => toggleMed(key)}
              className={`px-5 py-3 text-sm font-semibold rounded-full border-2 transition-all min-h-[48px] min-w-[80px]
                ${medications[key]
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 active:bg-slate-100 active:border-slate-400'
                }`}
            >
              {short}
            </button>
          ))}
        </div>
      </div>

      {/* Testul de Amestec - subtle inline when aPTT isolated (aPTT elevated + PT normal) */}
      {values.aptt > LAB_RANGES.aptt.max && values.pt <= LAB_RANGES.pt.max && (
        <div className="pt-4 border-t-2 border-slate-200">
          <label htmlFor="input-mixingTest" className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 block">
            Test de Amestec
          </label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700 font-medium whitespace-nowrap">aPTT mix:</span>
              <input
                id="input-mixingTest"
                type="number"
                inputMode="decimal"
                step={1}
                placeholder="Valoare"
                value={values.apttMix ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = parseFloat(val);
                  // Validate: finite, non-negative, reasonable bounds
                  if (val === '' || (!isNaN(num) && isFinite(num) && num >= 0 && num <= 100000)) {
                    onChange({
                      ...values,
                      apttMix: val ? num : undefined,
                    });
                    onScenarioChange(null);
                  }
                }}
                className="flex-1 px-4 py-3.5 text-lg border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-400/50 min-h-[48px]"
              />
            </div>
            {values.apttMix !== undefined && values.apttMix > 0 && (
              <div className={`px-4 py-3.5 rounded-lg font-semibold text-base ${
                (() => {
                  const result = interpretRosnerIndex(values.aptt, values.apttMix);
                  if (result.interpretation === 'deficiență') return 'bg-green-50 text-green-700 border-2 border-green-300';
                  if (result.interpretation === 'inhibitor') return 'bg-red-50 text-red-700 border-2 border-red-300';
                  return 'bg-yellow-50 text-yellow-700 border-2 border-yellow-300';
                })()
              }`}>
                Index Rosner: {interpretRosnerIndex(values.aptt, values.apttMix).index}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
