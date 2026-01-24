// components/CoagulationIllustration/types.ts

export type ComplexType = 'extrinsic-tenase' | 'intrinsic-tenase' | 'prothrombinase';

export interface Position {
  x: number;
  y: number;
}

export interface SlotConfig {
  id: string;
  label: string;
  role: 'enzyme' | 'cofactor' | 'substrate';
  color: string;
  ghostColor: string;
  position: Position;
  size: number;
}

export interface ProductConfig {
  label: string;
  color: string;
  size: number;
}

export interface ComplexConfig {
  id: ComplexType;
  title: string;
  titleRo: string;
  subtitle: string;
  subtitleRo: string;
  description: string;
  descriptionRo: string;
  membrane: 'tf-cell' | 'platelet';
  slots: SlotConfig[];
  product: ProductConfig;
}

export interface DragState {
  factorId: string;
  startPosition: Position;
  currentPosition: Position;
  nearestSlot: string | null;
}

export type FactorPosition = 'pool' | 'dragging' | 'docked';

export interface FactorState {
  id: string;
  slotConfig: SlotConfig;
  position: FactorPosition;
  slotId?: string;
  isActivating?: boolean;
}

export interface CoagulationIllustrationProps {
  className?: string;
  language?: 'en' | 'ro';
}

// Complex configurations
export const COMPLEXES: ComplexConfig[] = [
  {
    id: 'extrinsic-tenase',
    title: 'Extrinsic Tenase',
    titleRo: 'Tenaza Extrinsecă',
    subtitle: 'TF-VIIa Complex',
    subtitleRo: 'Complexul TF-VIIa',
    description: 'Tissue Factor binds Factor VIIa on the TF-bearing cell surface. This complex activates Factor X to Xa.',
    descriptionRo: 'Factorul Tisular (TF) leagă Factorul VIIa pe suprafața celulei purtătoare de TF. Acest complex activează Factorul X în Xa.',
    membrane: 'tf-cell',
    slots: [
      { id: 'TF', label: 'TF', role: 'cofactor', color: '#22C55E', ghostColor: '#22C55E40', position: { x: 25, y: 35 }, size: 70 },
      { id: 'VIIa', label: 'VIIa', role: 'enzyme', color: '#F97316', ghostColor: '#F9731640', position: { x: 50, y: 30 }, size: 65 },
      { id: 'X', label: 'X', role: 'substrate', color: '#86EFAC', ghostColor: '#86EFAC40', position: { x: 75, y: 35 }, size: 60 },
    ],
    product: { label: 'Xa', color: '#F97316', size: 55 },
  },
  {
    id: 'intrinsic-tenase',
    title: 'Intrinsic Tenase',
    titleRo: 'Tenaza Intrinsecă',
    subtitle: 'IXa-VIIIa Complex',
    subtitleRo: 'Complexul IXa-VIIIa',
    description: 'Factor IXa binds cofactor VIIIa on the activated platelet surface. This complex is 50x more efficient at activating Factor X than TF-VIIa.',
    descriptionRo: 'Factorul IXa leagă cofactorul VIIIa pe suprafața plachetei activate. Acest complex este de 50x mai eficient în activarea Factorului X decât TF-VIIa.',
    membrane: 'platelet',
    slots: [
      { id: 'VIIIa', label: 'VIIIa', role: 'cofactor', color: '#7C3AED', ghostColor: '#7C3AED40', position: { x: 25, y: 30 }, size: 70 },
      { id: 'IXa', label: 'IXa', role: 'enzyme', color: '#DC2626', ghostColor: '#DC262640', position: { x: 50, y: 35 }, size: 65 },
      { id: 'X', label: 'X', role: 'substrate', color: '#86EFAC', ghostColor: '#86EFAC40', position: { x: 75, y: 30 }, size: 60 },
    ],
    product: { label: 'Xa', color: '#F97316', size: 55 },
  },
  {
    id: 'prothrombinase',
    title: 'Prothrombinase',
    titleRo: 'Protrombinaza',
    subtitle: 'Xa-Va Complex',
    subtitleRo: 'Complexul Xa-Va',
    description: 'Factor Xa binds cofactor Va on the activated platelet surface. This complex cleaves Prothrombin (II) into Thrombin (IIa) - the key enzyme of coagulation.',
    descriptionRo: 'Factorul Xa leagă cofactorul Va pe suprafața plachetei activate. Acest complex clivează Protrombina (II) în Trombină (IIa) - enzima cheie a coagulării.',
    membrane: 'platelet',
    slots: [
      { id: 'Va', label: 'Va', role: 'cofactor', color: '#3B82F6', ghostColor: '#3B82F640', position: { x: 22, y: 30 }, size: 70 },
      { id: 'Xa', label: 'Xa', role: 'enzyme', color: '#F97316', ghostColor: '#F9731640', position: { x: 48, y: 35 }, size: 65 },
      { id: 'II', label: 'II', role: 'substrate', color: '#FCD34D', ghostColor: '#FCD34D40', position: { x: 75, y: 28 }, size: 70 },
    ],
    product: { label: 'IIa', color: '#DC2626', size: 60 },
  },
];

// Color utility functions
export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
}

export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xFF) - Math.round(255 * percent / 100));
  const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * percent / 100));
  const b = Math.max(0, (num & 0xFF) - Math.round(255 * percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
}
