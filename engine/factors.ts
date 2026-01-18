import { Factor } from '@/types';

export const CANVAS_WIDTH = 1150;
export const CANVAS_HEIGHT = 850;

/**
 * Cascada completă de coagulare cu forme activate:
 * Layout optimizat pentru claritate vizuală și minimizarea suprapunerilor.
 */
export function createInitialFactors(): Record<string, Factor> {
  return {
    // ═══════════════════════════════════════════════════════════════
    // CALEA INTRINSECĂ - Zimogeni și forme activate (x: 80-190)
    // ═══════════════════════════════════════════════════════════════

    F12: {
      id: 'F12',
      name: 'Factor XII (Hageman)',
      shortName: 'XII',
      position: { x: 80, y: 70 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: ['F12a'],
      pathway: 'intrinsic',
      clinicalNote: 'Zimogen. Activat de suprafețe încărcate negativ (sticlă, caolin, polifosfați). Rol in vivo controversat.',
    },

    F12a: {
      id: 'F12a',
      name: 'Factor XIIa',
      shortName: 'XIIa',
      position: { x: 190, y: 70 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['F12'],
      children: ['F11a'],  // XIIa produce XIa (nu XI!)
      pathway: 'intrinsic',
      isActivatedForm: true,
      zymogenId: 'F12',
      clinicalNote: 'Formă activată. Deficitul NU cauzează sângerare! Activează F11.',
    },

    F11: {
      id: 'F11',
      name: 'Factor XI (PTA)',
      shortName: 'XI',
      position: { x: 80, y: 160 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['F12a'],  // Activat de XIIa
      children: ['F11a'],
      pathway: 'intrinsic',
      clinicalNote: 'Zimogen. Hemofilia C (Rosenthal) - frecvent la evrei Ashkenazi.',
    },

    F11a: {
      id: 'F11a',
      name: 'Factor XIa',
      shortName: 'XIa',
      position: { x: 190, y: 160 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['F11', 'F12a'],  // Substrat (F11) + enzimă (XIIa)
      children: ['F9a'],  // XIa produce IXa (nu IX!)
      pathway: 'intrinsic',
      isActivatedForm: true,
      zymogenId: 'F11',
      clinicalNote: 'Formă activată. Activat de XIIa sau Trombină (feedback). Activează IX.',
    },

    F9: {
      id: 'F9',
      name: 'Factor IX (Christmas)',
      shortName: 'IX',
      position: { x: 80, y: 230 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: true,
      parents: ['F11a', 'F7a'],  // Activat de XIa (intrinsec) și VIIa (Josso loop)
      children: ['F9a'],
      pathway: 'intrinsic',
      clinicalNote: 'Zimogen vitamină K dependent. Hemofilia B. Activat de XIa și VIIa (Josso).',
    },

    F9a: {
      id: 'F9a',
      name: 'Factor IXa',
      shortName: 'IXa',
      position: { x: 320, y: 300 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,  // Vitamina K doar pe zimogen (IX)
      parents: ['F9', 'F11a', 'F7a'],  // Substrat (F9) + enzime (XIa, TF-VIIa)
      children: ['F10a'],  // Tenaza produce Xa (nu X!)
      pathway: 'intrinsic',
      isActivatedForm: true,
      zymogenId: 'F9',
      isEnzyme: true,
      complexPartner: 'F8a',
      complexName: 'TENAZĂ',
      complexMembrane: 'platelet',
      clinicalNote: 'Enzimă în complexul Tenază. Derivă din IX (activat de XIa și VIIa).',
    },

    F8: {
      id: 'F8',
      name: 'Factor VIII (Antihemophilic)',
      shortName: 'VIII',
      position: { x: 80, y: 310 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['vWF'],  // Transportat și stabilizat de vWF (IIa activează via feedbackTargets)
      children: ['F8a'],
      pathway: 'intrinsic',
      clinicalNote: 'Procofactor. Transportat de vWF. Activat de IIa (feedback). Hemofilia A.',
    },

    F8a: {
      id: 'F8a',
      name: 'Factor VIIIa',
      shortName: 'VIIIa',
      position: { x: 240, y: 300 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['F8'],  // Doar din zimogenul VIII
      children: [],
      pathway: 'intrinsic',
      isActivatedForm: true,
      zymogenId: 'F8',
      isCofactor: true,
      complexPartner: 'F9a',
      complexName: 'TENAZĂ',
      complexMembrane: 'platelet',
      clinicalNote: 'Cofactor în Tenază. Derivă din VIII (activat de IIa). Amplifică IXa de ~200.000x.',
    },

    // ═══════════════════════════════════════════════════════════════
    // CALEA EXTRINSECĂ - Tissue Factor Pathway (x: 850-1000)
    // ═══════════════════════════════════════════════════════════════

    TF: {
      id: 'TF',
      name: 'Factor Tisular (III)',
      shortName: 'TF',
      position: { x: 720, y: 130 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: [],
      pathway: 'extrinsic',
      isCofactor: true,
      complexPartner: 'F7a',
      complexName: 'TF-VIIa',
      complexMembrane: 'tfCell',
      clinicalNote: 'Cofactor/receptor pentru VIIa. Expus la leziuni vasculare. Complex inițiator.',
    },

    F7: {
      id: 'F7',
      name: 'Factor VII (Stable Factor)',
      shortName: 'VII',
      position: { x: 780, y: 70 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: true,
      parents: [],
      children: ['F7a'],
      pathway: 'extrinsic',
      clinicalNote: 'Zimogen vitamină K dependent. T1/2 cel mai scurt (6h) - primul afectat în boala hepatică.',
    },

    F7a: {
      id: 'F7a',
      name: 'Factor VIIa',
      shortName: 'VIIa',
      position: { x: 650, y: 130 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,  // Vitamina K doar pe zimogen (VII)
      parents: ['F7', 'TF'],
      children: ['F10a', 'F9a'],  // Produce Xa și IXa (nu zimogenii!)
      pathway: 'extrinsic',
      isActivatedForm: true,
      zymogenId: 'F7',
      isEnzyme: true,
      complexPartner: 'TF',
      complexName: 'TF-VIIa',
      complexMembrane: 'tfCell',
      clinicalNote: 'Enzimă în complexul TF-VIIa. Activează X și IX (Josso loop - extrinsec → intrinsec).',
    },

    // ═══════════════════════════════════════════════════════════════
    // CALEA COMUNĂ - Convergență (x: 420-570)
    // ═══════════════════════════════════════════════════════════════

    F10: {
      id: 'F10',
      name: 'Factor X (Stuart-Prower)',
      shortName: 'X',
      position: { x: 320, y: 400 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: true,
      parents: ['F9a', 'F7a'],  // Activat de Tenază și TF-VIIa
      children: ['F10a'],
      pathway: 'common',
      clinicalNote: 'Zimogen vitamină K dependent. Activat de Tenază [IXa+VIIIa] și TF-VIIa. Punct de convergență.',
    },

    F10a: {
      id: 'F10a',
      name: 'Factor Xa',
      shortName: 'Xa',
      position: { x: 600, y: 470 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,  // Vitamina K doar pe zimogen (X)
      parents: ['F10', 'F9a', 'F7a'],  // Substrat (F10) + enzime (Tenaza, TF-VIIa)
      children: ['IIa'],  // Protrombinaza produce IIa (trombina), nu F2!
      pathway: 'common',
      isActivatedForm: true,
      zymogenId: 'F10',
      isEnzyme: true,
      complexPartner: 'F5a',
      complexName: 'PROTROMBINAZĂ',
      complexMembrane: 'platelet',
      clinicalNote: 'Enzimă în Protrombinază. Derivă din X. Inhibat de DOAC anti-Xa (relevanță: interpretare PT/anti-Xa).',
    },

    F5: {
      id: 'F5',
      name: 'Factor V (Proaccelerin)',
      shortName: 'V',
      position: { x: 320, y: 490 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: ['F5a'],
      pathway: 'common',
      clinicalNote: 'Procofactor. Factor V Leiden - rezistență la PC activată.',
    },

    F5a: {
      id: 'F5a',
      name: 'Factor Va',
      shortName: 'Va',
      position: { x: 520, y: 470 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['F5'],  // Doar din zimogen
      children: [],
      pathway: 'common',
      isActivatedForm: true,
      zymogenId: 'F5',
      isCofactor: true,
      complexPartner: 'F10a',
      complexName: 'PROTROMBINAZĂ',
      complexMembrane: 'platelet',
      clinicalNote: 'Cofactor în Protrombinază. Derivă din V (activat de IIa). Amplifică Xa ~10.000x.',
    },

    F2: {
      id: 'F2',
      name: 'Protrombină (Factor II)',
      shortName: 'II',
      position: { x: 380, y: 570 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: true,
      parents: ['F10a'],  // Activat de Protrombinază
      children: ['IIa'],
      pathway: 'common',
      clinicalNote: 'Zimogen vitamină K dependent. Mutația G20210A = trombofilie.',
    },

    IIa: {
      id: 'IIa',
      name: 'Trombină (Factor IIa)',
      shortName: 'IIa',
      position: { x: 500, y: 570 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,  // Vitamina K doar pe zimogen (II)
      parents: ['F2', 'F10a'],  // Substrat (F2) + enzimă (Protrombinaza)
      children: ['FBG', 'F13', 'TM'],  // Activează zimogenii
      feedbackTargets: ['F5', 'F8', 'F11'],  // Feedback pozitiv pe ZIMOGENI
      pathway: 'common',
      isActivatedForm: true,
      zymogenId: 'F2',
      clinicalNote: 'Formă activată. Inhibată de dabigatran (relevanță: TT prelungit). Rol dual: procoagulant + activează PC.',
    },

    FBG: {
      id: 'FBG',
      name: 'Fibrinogen (Factor I)',
      shortName: 'Fbg',
      position: { x: 380, y: 650 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['IIa'],  // Convertit de trombină
      children: ['FBN'],
      pathway: 'common',
      clinicalNote: 'Precursor proteic. Reactant de fază acută. Produs de ficat.',
    },

    FBN: {
      id: 'FBN',
      name: 'Fibrină (Factor Ia)',
      shortName: 'Fibrină',
      position: { x: 500, y: 650 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['FBG'],  // Doar din fibrinogen
      children: ['FIBRIN_NET'],
      pathway: 'common',
      isActivatedForm: true,
      zymogenId: 'FBG',
      clinicalNote: 'Formă activată. Monomeri care polimerizează. Degradarea = D-dimeri.',
    },

    F13: {
      id: 'F13',
      name: 'Factor XIII',
      shortName: 'XIII',
      position: { x: 600, y: 620 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['IIa'],  // Activat de trombină
      children: ['F13a'],
      pathway: 'common',
      clinicalNote: 'Zimogen (transglutaminază). Stabilizează cheagul prin cross-link fibrină.',
    },

    F13a: {
      id: 'F13a',
      name: 'Factor XIIIa',
      shortName: 'XIIIa',
      position: { x: 600, y: 690 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['F13'],  // Doar din zimogen
      children: ['FIBRIN_NET'],
      pathway: 'common',
      isActivatedForm: true,
      zymogenId: 'F13',
      clinicalNote: 'Formă activată. Cross-linkează fibrina → cheag stabil, rezistent la fibrinoliză.',
    },

    FIBRIN_NET: {
      id: 'FIBRIN_NET',
      name: 'Cheagul stabilizat',
      shortName: 'Cheag',
      position: { x: 550, y: 750 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['FBN', 'F13a'],  // Ambele contribuie
      children: [],
      pathway: 'clot',  // Special pathway for dark color
      isActivatedForm: true,
      clinicalNote: 'Cheag stabil. Cross-linkuri covalente (XIIIa). Rezistent la fibrinoliză.',
    },

    // ═══════════════════════════════════════════════════════════════
    // HEMOSTAZA PRIMARĂ - Trombocite și vWF (x: 50)
    // ═══════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════
    // HEMOSTAZĂ PRIMARĂ
    // ═══════════════════════════════════════════════════════════════

    vWF: {
      id: 'vWF',
      name: 'Factorul von Willebrand',
      shortName: 'vWF',
      position: { x: 80, y: 345 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: ['F8'],
      pathway: 'platelet',
      clinicalNote: 'Carrier pentru FVIII. Clivat de ADAMTS13 - deficit ADAMTS13 → !!PURPURĂ TROMBOTICĂ TROMBOCITOPENICĂ!! (multimeri ultra-largi).',
    },

    PLT: {
      id: 'PLT',
      name: 'Trombocite',
      shortName: 'PLT',
      position: { x: 80, y: 420 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: [],
      pathway: 'platelet',
      isClickable: true,
      clinicalNote: 'Click pentru detalii HEMOSTAZA PRIMARĂ: Adeziune, Activare, Agregare. Notă: BT (timp sângerare) = test depășit; ISTH/BSH recomandă PFA-100.',
    },

    // ═══════════════════════════════════════════════════════════════
    // ANTICOAGULANȚI NATURALI (x: 720-1050)
    // ═══════════════════════════════════════════════════════════════

    TFPI: {
      id: 'TFPI',
      name: 'Tissue Factor Pathway Inhibitor',
      shortName: 'TFPI',
      position: { x: 850, y: 210 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: [],
      inhibits: ['F7a', 'F10a'],
      pathway: 'anticoagulant',
      clinicalNote: 'Leagă Xa, apoi complexul TFPI-Xa inhibă TF-VIIa. Reglator precoce.',
    },

    AT: {
      id: 'AT',
      name: 'Antitrombina III',
      shortName: 'AT',
      position: { x: 720, y: 480 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: [],
      inhibits: ['IIa', 'F10a', 'F9a', 'F11a'],
      pathway: 'anticoagulant',
      clinicalNote: 'Potențată de heparină (relevanță: interpretare aPTT sub heparină). Deficitul = trombofilie.',
    },

    TM: {
      id: 'TM',
      name: 'Trombomodulină',
      shortName: 'TM',
      position: { x: 650, y: 570 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],  // Receptor endotelial, nu are precursori în cascadă
      children: ['PC'],  // TM (cu IIa legat) activează PC
      pathway: 'anticoagulant',
      clinicalNote: 'Receptor endotelial. Complexul IIa-TM activează PC → efect anticoagulant.',
    },

    PC: {
      id: 'PC',
      name: 'Proteina C',
      shortName: 'PC',
      position: { x: 760, y: 570 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: true,
      parents: ['TM'],  // Activată de complexul IIa-TM
      children: ['APC'],
      pathway: 'anticoagulant',
      clinicalNote: 'Zimogen vitamină K dependent. Activată de complexul IIa-TM.',
    },

    APC: {
      id: 'APC',
      name: 'Proteina C Activată',
      shortName: 'APC',
      position: { x: 870, y: 570 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,  // Vitamina K doar pe zimogen (PC)
      parents: ['PC'],  // Doar din zimogenul PC
      children: [],
      inhibits: ['F5a', 'F8a'],
      pathway: 'anticoagulant',
      isActivatedForm: true,
      zymogenId: 'PC',
      clinicalNote: 'Formă activată. Inactivează Va și VIIIa. Necesită PS ca cofactor.',
    },

    PS: {
      id: 'PS',
      name: 'Proteina S',
      shortName: 'PS',
      position: { x: 870, y: 605 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: true,
      parents: [],
      children: [],  // Cofactor, nu activator
      pathway: 'anticoagulant',
      isCofactor: true,
      complexPartner: 'APC',  // Acționează ca și cofactor pentru APC
      clinicalNote: 'Cofactor pentru APC. NU este enzimă - amplifică activitatea APC.',
    },

    // ═══════════════════════════════════════════════════════════════
    // FIBRINOLIZĂ (x: 200-570)
    // ═══════════════════════════════════════════════════════════════

    tPA: {
      id: 'tPA',
      name: 't-PA (Activator Plasminogen)',
      shortName: 'tPA',
      position: { x: 80, y: 750 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: ['PLG'],
      pathway: 'fibrinolysis',
      clinicalNote: 'Eliberat de endoteliu. Activează plasminogenul legat de fibrină.',
    },

    PLG: {
      id: 'PLG',
      name: 'Plasminogen',
      shortName: 'PLG',
      position: { x: 180, y: 750 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['tPA'],
      children: ['PLASMIN'],
      pathway: 'fibrinolysis',
      clinicalNote: 'Zimogen produs de ficat. Se leagă de fibrină și este activat de tPA.',
    },

    PLASMIN: {
      id: 'PLASMIN',
      name: 'Plasmină',
      shortName: 'Plasm',
      position: { x: 300, y: 750 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: ['PLG'],
      children: [],
      inhibits: ['FBN'],
      pathway: 'fibrinolysis',
      isActivatedForm: true,
      zymogenId: 'PLG',
      clinicalNote: 'Formă activată. Degradează fibrina → D-dimeri (marker fibrinoliză).',
    },

    PAI1: {
      id: 'PAI1',
      name: 'PAI-1',
      shortName: 'PAI-1',
      position: { x: 80, y: 810 },
      activity: 1.0,
      baseActivity: 1.0,
      vitKDependent: false,
      parents: [],
      children: [],
      inhibits: ['tPA'],
      pathway: 'fibrinolysis',
      clinicalNote: 'Inhibitor al tPA. ↑ în obezitate, DZ2, sepsis → risc trombotic.',
    },
  };
}

// Mod Schematic: cascada cu zone colorate (conform imaginii de referință)
export const BASIC_MODE_FACTORS = [
  // Intrinsic (zona albastră)
  'F12', 'F12a', 'F11', 'F11a', 'F9', 'F9a', 'F8', 'F8a',
  // Extrinsic (zona portocalie)
  'TF', 'F7', 'F7a',
  // Common (zona verde)
  'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN', 'F13', 'F13a'
];

// Mod Clinical: cascada completă cu forme activate
export const CLINICAL_MODE_FACTORS = [
  // Intrinsic - zimogeni și forme activate
  'F12', 'F12a', 'F11', 'F11a', 'F9', 'F9a', 'F8', 'F8a',
  // Extrinsic
  'TF', 'F7', 'F7a',
  // Common
  'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN', 'F13', 'F13a', 'FIBRIN_NET',
  // Hemostază primară
  'vWF', 'PLT',
  // Anticoagulanți
  'TFPI', 'AT', 'TM', 'PC', 'APC', 'PS',
  // Fibrinoliză
  'tPA', 'PLG', 'PLASMIN', 'PAI1'
];

// Poziții pentru modul schematic (conform schemei clasice cu 3 căi)
export const SIMPLIFIED_POSITIONS: Record<string, { x: number; y: number }> = {
  // === ZONA EXTRINSECĂ (roz, stânga-sus) ===
  F7: { x: 80, y: 100 },
  F7a: { x: 200, y: 100 },
  TF: { x: 140, y: 170 },

  // === ZONA INTRINSECĂ (albastru, dreapta-sus) ===
  // Formele inactive pe dreapta, activate pe stânga (săgeți ←)
  F12: { x: 700, y: 70 },
  F12a: { x: 570, y: 70 },
  F11: { x: 700, y: 140 },
  F11a: { x: 570, y: 140 },
  F9: { x: 700, y: 220 },
  F9a: { x: 570, y: 220 },
  F8: { x: 700, y: 290 },
  F8a: { x: 570, y: 290 },

  // === ZONA COMUNĂ (portocaliu/galben, centru-jos) ===
  F10: { x: 300, y: 410 },
  F10a: { x: 440, y: 410 },
  F5: { x: 300, y: 480 },
  F5a: { x: 440, y: 480 },
  F2: { x: 300, y: 550 },
  IIa: { x: 440, y: 550 },

  // === FINAL (jos) - Trombocit + Fibrină → Cheag ===
  PLT: { x: 200, y: 680 },
  FBG: { x: 400, y: 630 },
  FBN: { x: 400, y: 700 },
  F13: { x: 520, y: 700 },
  F13a: { x: 520, y: 770 },
};
