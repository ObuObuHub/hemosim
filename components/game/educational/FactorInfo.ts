// components/game/educational/FactorInfo.ts
/**
 * Medical information about coagulation factors
 * Based on Hoffman-Monroe cell-based model of hemostasis
 *
 * References:
 * - Hoffman M, Monroe DM. A cell-based model of hemostasis. Thromb Haemost. 2001
 * - Smith SA. The cell-based model of coagulation. J Vet Emerg Crit Care. 2009
 */

export interface FactorInfoData {
  id: string;
  name: string;
  romanNumeral: string;
  fullName: string;
  type: 'zymogen' | 'enzyme' | 'cofactor' | 'substrate' | 'receptor';
  role: string;
  activatedBy: string[];
  activates: string[];
  location: string;
  clinicalNote?: string;
  amplification?: string;
}

export const FACTOR_INFO: Record<string, FactorInfoData> = {
  // Tissue Factor pathway
  TF: {
    id: 'TF',
    name: 'Factor Tisular',
    romanNumeral: 'TF',
    fullName: 'Tissue Factor (Tromboplastina)',
    type: 'cofactor',
    role: 'Inițiator al cascadei - expus la leziune vasculară',
    activatedBy: ['Leziune vasculară'],
    activates: ['FVII → FVIIa'],
    location: 'Celula TF-bearing (fibroblast, monocit)',
    clinicalNote: 'Expresia TF anormală → tromboză sau sângerare',
  },

  FVII: {
    id: 'FVII',
    name: 'Factor VII',
    romanNumeral: 'VII',
    fullName: 'Proconvertina',
    type: 'zymogen',
    role: 'Zimogen care se leagă de TF pentru a forma complexul inițiator',
    activatedBy: ['TF (autoactivare)', 'FXa', 'FIXa', 'Trombina'],
    activates: ['FIX → FIXa', 'FX → FXa'],
    location: 'Circulant în plasmă',
    clinicalNote: 'Deficiența FVII → sângerare moderată',
  },

  FVIIa: {
    id: 'FVIIa',
    name: 'Factor VIIa',
    romanNumeral: 'VIIa',
    fullName: 'Factor VII Activat',
    type: 'enzyme',
    role: 'Serin-protează care formează complexul TF-VIIa',
    activatedBy: ['TF'],
    activates: ['FIX → FIXa', 'FX → FXa'],
    location: 'Legat de TF pe membrană',
  },

  // Intrinsic pathway factors
  FIX: {
    id: 'FIX',
    name: 'Factor IX',
    romanNumeral: 'IX',
    fullName: 'Factor Christmas',
    type: 'zymogen',
    role: 'Zimogen esențial pentru faza de propagare',
    activatedBy: ['TF-VIIa', 'FXIa'],
    activates: ['FX → FXa (în complex Tenase)'],
    location: 'Circulant, apoi pe suprafața trombocitului',
    clinicalNote: 'Deficiența FIX = Hemofilia B',
  },

  FIXa: {
    id: 'FIXa',
    name: 'Factor IXa',
    romanNumeral: 'IXa',
    fullName: 'Factor IX Activat',
    type: 'enzyme',
    role: 'Enzima din complexul Tenase - activează FX',
    activatedBy: ['TF-VIIa', 'FXIa'],
    activates: ['FX → FXa'],
    location: 'Suprafața trombocitului activat',
    amplification: '×200.000 mai eficient în complex cu FVIIIa',
  },

  FX: {
    id: 'FX',
    name: 'Factor X',
    romanNumeral: 'X',
    fullName: 'Factor Stuart-Prower',
    type: 'zymogen',
    role: 'Zimogen central - punct de convergență al căilor',
    activatedBy: ['TF-VIIa', 'Tenase (FIXa-FVIIIa)'],
    activates: ['FII → FIIa (în complex Protrombinase)'],
    location: 'Circulant, apoi pe suprafața trombocitului',
    clinicalNote: 'Deficiența FX → sângerare severă',
  },

  FXa: {
    id: 'FXa',
    name: 'Factor Xa',
    romanNumeral: 'Xa',
    fullName: 'Factor X Activat',
    type: 'enzyme',
    role: 'Enzima din complexul Protrombinase - generează trombină',
    activatedBy: ['TF-VIIa', 'Tenase'],
    activates: ['FII → FIIa'],
    location: 'Suprafața trombocitului activat',
    amplification: '×300.000 mai eficient în complex cu FVa',
  },

  // Prothrombin/Thrombin
  FII: {
    id: 'FII',
    name: 'Factor II',
    romanNumeral: 'II',
    fullName: 'Protrombina',
    type: 'zymogen',
    role: 'Substratul final - convertit în trombină',
    activatedBy: ['Protrombinase (FXa-FVa)'],
    activates: [],
    location: 'Circulant în plasmă',
    clinicalNote: 'Concentrație plasmatică: ~100 µg/mL',
  },

  FIIa: {
    id: 'FIIa',
    name: 'Trombina',
    romanNumeral: 'IIa',
    fullName: 'Trombina (Factor IIa)',
    type: 'enzyme',
    role: 'Enzima centrală - activează trombocite, cofactori, fibrinogen',
    activatedBy: ['Protrombinase'],
    activates: ['Fibrinogen → Fibrină', 'FV → FVa', 'FVIII → FVIIIa', 'FXI → FXIa', 'FXIII → FXIIIa', 'PAR1/PAR4'],
    location: 'Generată pe suprafața trombocitului',
    clinicalNote: 'Burst de trombină: ~350 nM',
  },

  // Cofactors
  FV: {
    id: 'FV',
    name: 'Factor V',
    romanNumeral: 'V',
    fullName: 'Proacelerina',
    type: 'zymogen',
    role: 'Procofactor - necesită activare de trombină',
    activatedBy: ['Trombina (FIIa)'],
    activates: [],
    location: 'Circulant și în granulele α ale trombocitelor',
    clinicalNote: 'Mutația Factor V Leiden → rezistență la APC → trombofilie',
  },

  FVa: {
    id: 'FVa',
    name: 'Factor Va',
    romanNumeral: 'Va',
    fullName: 'Factor V Activat',
    type: 'cofactor',
    role: 'Cofactor în Protrombinase - amplifică FXa de 300.000×',
    activatedBy: ['Trombina'],
    activates: [],
    location: 'Legat de membrana trombocitului (via Ca²⁺)',
    amplification: 'Crește eficiența FXa de ×300.000',
  },

  FVIII: {
    id: 'FVIII',
    name: 'Factor VIII',
    romanNumeral: 'VIII',
    fullName: 'Factor Antihemofilic A',
    type: 'zymogen',
    role: 'Procofactor circulant legat de vWF',
    activatedBy: ['Trombina (FIIa)'],
    activates: [],
    location: 'Circulant în complex cu vWF',
    clinicalNote: 'Deficiența FVIII = Hemofilia A',
  },

  FVIIIa: {
    id: 'FVIIIa',
    name: 'Factor VIIIa',
    romanNumeral: 'VIIIa',
    fullName: 'Factor VIII Activat',
    type: 'cofactor',
    role: 'Cofactor în Tenase - amplifică FIXa de 200.000×',
    activatedBy: ['Trombina'],
    activates: [],
    location: 'Legat de membrana trombocitului (via Ca²⁺)',
    amplification: 'Crește eficiența FIXa de ×200.000',
  },

  // Amplification factor
  FXI: {
    id: 'FXI',
    name: 'Factor XI',
    romanNumeral: 'XI',
    fullName: 'Antecedent Tromboplastinic Plasmatic',
    type: 'zymogen',
    role: 'Amplificator - crește producția de FIXa în bucla de feedback',
    activatedBy: ['Trombina (FIIa)'],
    activates: ['FIX → FIXa'],
    location: 'Circulant și pe suprafața trombocitului',
    clinicalNote: 'Deficiența FXI → sângerare variabilă (Hemofilia C)',
  },

  FXIa: {
    id: 'FXIa',
    name: 'Factor XIa',
    romanNumeral: 'XIa',
    fullName: 'Factor XI Activat',
    type: 'enzyme',
    role: 'Feedback pozitiv - produce mai mult FIXa',
    activatedBy: ['Trombina'],
    activates: ['FIX → FIXa'],
    location: 'Suprafața trombocitului',
  },

  // Substrate
  Fibrinogen: {
    id: 'Fibrinogen',
    name: 'Fibrinogen',
    romanNumeral: 'I',
    fullName: 'Factor I (Fibrinogen)',
    type: 'substrate',
    role: 'Substrat pentru formarea cheagului de fibrină',
    activatedBy: ['Trombina (FIIa)'],
    activates: [],
    location: 'Circulant în plasmă',
    clinicalNote: 'Concentrație: 2-4 g/L',
  },

  // PAR Receptor
  PAR1: {
    id: 'PAR1',
    name: 'PAR1',
    romanNumeral: '-',
    fullName: 'Protease-Activated Receptor 1',
    type: 'receptor',
    role: 'Receptor GPCR cu 7 domenii transmembranare - activează trombocitul',
    activatedBy: ['Trombina (clivare la Arg41-Ser42)'],
    activates: ['Semnalizare Gαq → mobilizare Ca²⁺ → activare trombocit'],
    location: 'Membrana trombocitului',
    clinicalNote: 'Secvența ligandului legat: SFLLRN',
  },
};

// Complex information
export interface ComplexInfoData {
  id: string;
  name: string;
  enzyme: string;
  cofactor: string;
  substrate: string;
  product: string;
  amplification: string;
  location: string;
  description: string;
  medicalNote: string;
}

export const COMPLEX_INFO: Record<string, ComplexInfoData> = {
  'TF-VIIa': {
    id: 'TF-VIIa',
    name: 'Complex TF-VIIa',
    enzyme: 'FVIIa',
    cofactor: 'TF',
    substrate: 'FIX, FX',
    product: 'FIXa, FXa',
    amplification: 'Inițiator',
    location: 'Celula TF-bearing',
    description: 'Complexul inițiator al coagulării',
    medicalNote: 'Inhibat de TFPI (Tissue Factor Pathway Inhibitor)',
  },
  Tenase: {
    id: 'Tenase',
    name: 'Complex Tenase Intrinsec',
    enzyme: 'FIXa',
    cofactor: 'FVIIIa',
    substrate: 'FX',
    product: 'FXa',
    amplification: '×200.000',
    location: 'Suprafața trombocitului activat',
    description: 'FIXa + FVIIIa pe membrană cu Ca²⁺',
    medicalNote: 'Deficiența componentelor → Hemofilia A (FVIII) sau B (FIX)',
  },
  Prothrombinase: {
    id: 'Prothrombinase',
    name: 'Complex Protrombinase',
    enzyme: 'FXa',
    cofactor: 'FVa',
    substrate: 'FII (Protrombină)',
    product: 'FIIa (Trombină)',
    amplification: '×300.000',
    location: 'Suprafața trombocitului activat',
    description: 'FXa + FVa pe membrană cu Ca²⁺',
    medicalNote: 'Generează burst-ul de trombină (~350 nM)',
  },
};

// Phase descriptions
export interface PhaseInfoData {
  id: string;
  name: string;
  romanPhase: string;
  location: string;
  duration: string;
  keyEvents: string[];
  outcome: string;
}

export const PHASE_INFO: Record<string, PhaseInfoData> = {
  initiation: {
    id: 'initiation',
    name: 'Inițiere',
    romanPhase: 'Faza 1',
    location: 'Celula TF-bearing (fibroblast, monocit)',
    duration: 'Milisecunde - secunde',
    keyEvents: [
      'TF se leagă de FVIIa',
      'TF-VIIa activează FIX → FIXa',
      'TF-VIIa activează FX → FXa',
      'FXa + FVa formează Protrombinase inițială',
      'Se generează cantități mici de trombină',
    ],
    outcome: 'Trombină "scânteie" - suficientă pentru activarea trombocitelor',
  },
  amplification: {
    id: 'amplification',
    name: 'Amplificare',
    romanPhase: 'Faza 2',
    location: 'Suprafața trombocitului',
    duration: 'Secunde',
    keyEvents: [
      'Trombina clivează PAR1 → activare trombocit',
      'Trombocitul expune fosfatidilserină (PS)',
      'Trombina activează FV → FVa',
      'Trombina eliberează FVIII din vWF → FVIIIa',
      'Trombina activează FXI → FXIa',
    ],
    outcome: 'Trombocit "decorat" cu cofactori pe suprafață',
  },
  propagation: {
    id: 'propagation',
    name: 'Propagare',
    romanPhase: 'Faza 3',
    location: 'Suprafața trombocitului activat',
    duration: 'Secunde',
    keyEvents: [
      'FIXa + FVIIIa formează Tenase (×200.000)',
      'Tenase generează FXa în cantități mari',
      'FXa + FVa formează Protrombinase (×300.000)',
      'Protrombinase generează burst de trombină',
    ],
    outcome: 'Burst de trombină (~350 nM) → conversie fibrinogen → fibrină',
  },
};

// Helper function to get factor info
export function getFactorInfo(factorId: string): FactorInfoData | undefined {
  // Normalize factor ID (remove leading 'F' if present for lookup)
  const normalizedId = factorId.startsWith('F') ? factorId : `F${factorId}`;
  return FACTOR_INFO[factorId] || FACTOR_INFO[normalizedId];
}

// Helper function to get complex info
export function getComplexInfo(complexId: string): ComplexInfoData | undefined {
  return COMPLEX_INFO[complexId];
}

// Helper function to get phase info
export function getPhaseInfo(phaseId: string): PhaseInfoData | undefined {
  return PHASE_INFO[phaseId];
}
