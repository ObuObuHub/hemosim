// types/game.ts
// Type definitions for the coagulation factor assembly game

// ============================================
// Core Game Types
// ============================================

export type GamePhase = 'catch' | 'dock' | 'assemble' | 'complete' | 'failed';

export type ShapeType = 'L' | 'T' | 'square' | 'line' | 'zigzag';

// ============================================
// Game Entities
// ============================================

export interface GameFactor {
  id: string;
  factorId: string;           // F9a, F8a, F10a, F5a
  shortName: string;          // IXa, VIIIa, Xa, Va
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  state: 'floating' | 'caught' | 'docked' | 'stolen';
}

export interface DockingSlot {
  id: string;
  complexType: 'tenase' | 'prothrombinase';
  role: 'enzyme' | 'cofactor';
  acceptsFactors: string[];   // ['F9a'] or ['F8a']
  isLocked: boolean;          // Sequential gating
}

export interface ComplexState {
  type: 'tenase' | 'prothrombinase';
  enzyme: GameFactor | null;
  cofactor: GameFactor | null;
  isActive: boolean;
}

export interface Antagonist {
  position: { x: number; y: number };
  targetFactorId: string | null;
  state: 'hunting' | 'stealing' | 'retreating';
}

// ============================================
// Main Game State
// ============================================

export interface GameState {
  phase: GamePhase;
  score: number;
  lives: number;
  timer: number;
  factors: GameFactor[];
  dockingSlots: DockingSlot[];
  complexes: ComplexState[];
  antagonist: Antagonist | null;  // Optional for MVP
  currentLevel: number;
}
