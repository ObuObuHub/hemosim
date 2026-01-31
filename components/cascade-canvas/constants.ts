/**
 * CascadeCanvas Constants
 *
 * Visual constants for coagulation cascade rendering following medical conventions.
 */

// Culori conform convențiilor medicale (similar cu Frontiers/Harrison's)
export const PATHWAY_COLORS: Record<string, string> = {
  intrinsic: '#2563eb',   // Albastru - Calea Intrinsecă (contact)
  extrinsic: '#16a34a',   // Verde - Calea Extrinsecă (tissue factor)
  common: '#0d9488',      // Turcoaz - Calea Comună (convergență albastru+verde)
  platelet: '#dc2626',    // Roșu aprins - Trombocite și complexe (pe membrană)
  fibrinolysis: '#92400e', // Maro - Fibrinoliză
  anticoagulant: '#6b8e23', // Olive - Anticoagulanți naturali
  clot: '#1e293b',        // Negru închis - Cheagul final stabilizat
};

// Nume căi pentru legendă
export const PATHWAY_NAMES: Record<string, string> = {
  intrinsic: 'Calea Intrinsecă',
  extrinsic: 'Calea Extrinsecă',
  common: 'Calea Comună',
  platelet: 'Hemostază Primară',
  fibrinolysis: 'Fibrinoliză',
  anticoagulant: 'Anticoagulanți',
};

// Culori pentru tipuri speciale de săgeți
export const FEEDBACK_COLOR = '#f59e0b'; // Amber/Gold pentru feedback pozitiv
export const INHIBITION_COLOR = '#64748b'; // Gri pentru inhibiție (nu roșu - evită confuzia)

// Culori pentru suprafețele membranare (model celular)
export const MEMBRANE_COLORS = {
  tfCell: '#a67c52',      // Celulă TF (tan/brun) - Inițiere
  platelet: '#dc2626',    // Trombocit activat (roșu) - Propagare
  transfer: '#0891b2',    // Xa handoff (cyan)
};

export const FACTOR_LABELS: Record<string, string> = {
  // Intrinsic - zimogeni
  F12: 'Factor XII',
  F11: 'Factor XI',
  F9: 'Factor IX',
  F8: 'Factor VIII',
  // Intrinsic - forme activate
  F12a: 'Factor XIIa',
  F11a: 'Factor XIa',
  F9a: 'Factor IXa',
  F8a: 'Factor VIIIa',
  // Extrinsic
  TF: 'Factor Tisular',
  F7: 'Factor VII',
  F7a: 'Factor VIIa',
  // Common - zimogeni
  F10: 'Factor X',
  F5: 'Factor V',
  F2: 'Protrombină',
  FBG: 'Fibrinogen',
  F13: 'Factor XIII',
  // Common - forme activate
  F10a: 'Factor Xa',
  F5a: 'Factor Va',
  IIa: 'Trombină',
  FBN: 'Fibrină',
  F13a: 'Factor XIIIa',
  // Hemostază primară
  vWF: 'von Willebrand',
  PLT: 'Trombocite',
  // Anticoagulanți
  TFPI: 'TFPI',
  TM: 'Trombomodulină',
  AT: 'Antitrombina',
  PC: 'Proteina C',
  APC: 'PC Activată',
  PS: 'Proteina S',
  // Fibrinoliză
  tPA: 't-PA',
  PLG: 'Plasminogen',
  PLASMIN: 'Plasm',
  PAI1: 'PAI-1',
};

// Mapping lab values to cascade factors for hover highlighting
export const LAB_TO_FACTORS: Record<string, string[]> = {
  pt: ['TF', 'F7', 'F7a', 'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN'],  // PT → Extrinsic + Common
  inr: ['TF', 'F7', 'F7a', 'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN'], // INR → same as PT
  aptt: ['F12', 'F12a', 'F11', 'F11a', 'F9', 'F9a', 'F8', 'F8a', 'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN'], // aPTT → Intrinsic + Common
  tt: ['IIa', 'FBG', 'FBN'],                        // TT → Thrombin time
  fibrinogen: ['FBG', 'FBN', 'FIBRIN_NET'],         // Fibrinogen → Clot formation
  platelets: ['PLT'],                               // Platelets
  dDimers: ['PLASMIN', 'FBN', 'FIBRIN_NET'],        // D-Dimers → Fibrinolysis
  bleedingTime: ['PLT', 'vWF'],                     // Bleeding time → Primary hemostasis
};

// Particle system interface for flow animation
export interface Particle {
  fromId: string;
  toId: string;
  progress: number; // 0 to 1
  speed: number;
}
