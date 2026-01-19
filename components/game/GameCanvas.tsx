'use client';

import { useRef, useEffect } from 'react';
import type { GameFactor, DockingSlot, ComplexState, ShapeType } from '@/types/game';
import { GAME_CANVAS, DOCK_ZONES, FACTOR_VISUALS } from '@/engine/game/game-config';
import { SHAPE_PATHS, FACTOR_CONFIG } from '@/engine/game/factor-shapes';

// =============================================================================
// TYPES
// =============================================================================

interface GameCanvasProps {
  factors: GameFactor[];
  dockingSlots: DockingSlot[];
  complexes: ComplexState[];
  caughtFactor: GameFactor | null;
}

interface DockedFactorMap {
  [slotId: string]: GameFactor | undefined;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CELL_SIZE = 16; // Size of each cell in tetris-like shapes (pixels)

const COLORS = {
  background: {
    top: '#1a0a0a',    // Dark red-black at top
    bottom: '#2d0a0a', // Slightly lighter at bottom
  },
  bloodCells: 'rgba(139, 0, 0, 0.3)', // Dark red for flowing blood cells
  workstation: {
    fill: 'rgba(50, 50, 70, 0.9)',
    stroke: '#4a5568',
    highlight: '#718096',
  },
  slot: {
    empty: 'rgba(30, 30, 50, 0.8)',
    stroke: '#4a5568',
    enzymeHighlight: '#3b82f6',    // Blue for enzyme slots
    cofactorHighlight: '#10b981',  // Green for cofactor slots
    locked: 'rgba(100, 100, 100, 0.5)',
  },
  complex: {
    activeGlow: '#fbbf24', // Amber glow when complex is assembled
    inactiveStroke: '#6b7280',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0',
    label: '#e2e8f0',
  },
} as const;

// =============================================================================
// DRAWING FUNCTIONS
// =============================================================================

/**
 * Draws the bloodstream background with a dark gradient and flowing red cell effects.
 */
function drawBackground(ctx: CanvasRenderingContext2D): void {
  const { width, height } = GAME_CANVAS;

  // Create vertical gradient for bloodstream effect
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.background.top);
  gradient.addColorStop(1, COLORS.background.bottom);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw subtle flowing blood cell shapes (static for MVP)
  ctx.fillStyle = COLORS.bloodCells;
  drawBloodCells(ctx);
}

/**
 * Draws decorative blood cells floating in the background.
 */
function drawBloodCells(ctx: CanvasRenderingContext2D): void {
  const { width, height } = GAME_CANVAS;
  const cellPositions = [
    { x: 80, y: 120, size: 25, rotation: 0.2 },
    { x: 200, y: 80, size: 20, rotation: -0.3 },
    { x: 350, y: 200, size: 30, rotation: 0.5 },
    { x: 500, y: 150, size: 22, rotation: -0.1 },
    { x: 650, y: 100, size: 28, rotation: 0.4 },
    { x: 800, y: 180, size: 24, rotation: -0.2 },
    { x: 900, y: 250, size: 26, rotation: 0.3 },
    { x: 120, y: 300, size: 18, rotation: -0.4 },
    { x: 400, y: 350, size: 32, rotation: 0.1 },
    { x: 700, y: 320, size: 21, rotation: -0.5 },
    { x: 850, y: 400, size: 27, rotation: 0.6 },
    { x: 150, y: 450, size: 23, rotation: -0.3 },
  ];

  for (const cell of cellPositions) {
    if (cell.x < width && cell.y < height - 150) {
      drawRedBloodCell(ctx, cell.x, cell.y, cell.size, cell.rotation);
    }
  }
}

/**
 * Draws a single red blood cell (biconcave disc shape).
 */
function drawRedBloodCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Draw elongated ellipse for the RBC
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner concave effect
  ctx.fillStyle = 'rgba(50, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.5, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the platelet workstation at the bottom of the canvas.
 */
function drawPlateletWorkstation(
  ctx: CanvasRenderingContext2D,
  slots: DockingSlot[],
  complexes: ComplexState[],
  dockedFactors: DockedFactorMap
): void {
  const { width, height } = GAME_CANVAS;
  const workstationY = height - 170;
  const workstationHeight = 160;

  // Draw workstation background
  ctx.fillStyle = COLORS.workstation.fill;
  ctx.strokeStyle = COLORS.workstation.stroke;
  ctx.lineWidth = 2;

  // Rounded rectangle for workstation
  const cornerRadius = 12;
  const workstationX = 50;
  const workstationWidth = width - 100;

  ctx.beginPath();
  ctx.roundRect(workstationX, workstationY, workstationWidth, workstationHeight, cornerRadius);
  ctx.fill();
  ctx.stroke();

  // Draw workstation title
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.fillStyle = COLORS.text.primary;
  ctx.textAlign = 'center';
  ctx.fillText('PLATELET WORKSTATION', width / 2, workstationY + 25);

  // Draw dock zones for each complex
  drawDockZone(ctx, 'tenase', DOCK_ZONES.tenase, slots, complexes, dockedFactors);
  drawDockZone(ctx, 'prothrombinase', DOCK_ZONES.prothrombinase, slots, complexes, dockedFactors);
}

/**
 * Draws a dock zone for a specific complex type.
 */
function drawDockZone(
  ctx: CanvasRenderingContext2D,
  complexType: 'tenase' | 'prothrombinase',
  zone: { x: number; y: number; width: number; height: number },
  slots: DockingSlot[],
  complexes: ComplexState[],
  dockedFactors: DockedFactorMap
): void {
  const complex = complexes.find((c) => c.type === complexType);
  const isActive = complex?.isActive ?? false;

  // Draw zone background with glow if active
  if (isActive) {
    // Glow effect
    ctx.shadowColor = COLORS.complex.activeGlow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
  } else {
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(40, 40, 60, 0.8)';
  }

  ctx.strokeStyle = isActive ? COLORS.complex.activeGlow : COLORS.complex.inactiveStroke;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(zone.x, zone.y, zone.width, zone.height, 8);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw complex label
  const label = complexType === 'tenase' ? 'TENASE' : 'PROTHROMBINASE';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.fillStyle = isActive ? COLORS.complex.activeGlow : COLORS.text.secondary;
  ctx.textAlign = 'center';
  ctx.fillText(label, zone.x + zone.width / 2, zone.y + 18);

  // Draw the two docking slots for this complex
  const complexSlots = slots.filter((s) => s.complexType === complexType);
  const enzymeSlot = complexSlots.find((s) => s.role === 'enzyme');
  const cofactorSlot = complexSlots.find((s) => s.role === 'cofactor');

  const slotWidth = 70;
  const slotHeight = 60;
  const slotY = zone.y + 28;
  const gap = 10;

  // Enzyme slot (left)
  if (enzymeSlot) {
    const slotX = zone.x + (zone.width / 2 - slotWidth - gap / 2);
    const dockedFactor = dockedFactors[enzymeSlot.id];
    drawDockingSlot(ctx, enzymeSlot, slotX, slotY, slotWidth, slotHeight, dockedFactor);
  }

  // Cofactor slot (right)
  if (cofactorSlot) {
    const slotX = zone.x + (zone.width / 2 + gap / 2);
    const dockedFactor = dockedFactors[cofactorSlot.id];
    drawDockingSlot(ctx, cofactorSlot, slotX, slotY, slotWidth, slotHeight, dockedFactor);
  }

  // Draw "+" between slots if both are filled
  if (complex?.enzyme && complex?.cofactor) {
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.complex.activeGlow;
    ctx.textAlign = 'center';
    ctx.fillText('+', zone.x + zone.width / 2, slotY + slotHeight / 2 + 6);
  }
}

/**
 * Draws an individual docking slot.
 */
function drawDockingSlot(
  ctx: CanvasRenderingContext2D,
  slot: DockingSlot,
  x: number,
  y: number,
  slotWidth: number,
  slotHeight: number,
  dockedFactor: GameFactor | undefined
): void {
  const isLocked = slot.isLocked;
  const hasFactor = dockedFactor !== undefined;

  // Slot background
  if (isLocked) {
    ctx.fillStyle = COLORS.slot.locked;
    ctx.strokeStyle = COLORS.slot.stroke;
  } else if (hasFactor) {
    ctx.fillStyle = dockedFactor.color + '40'; // Semi-transparent factor color
    ctx.strokeStyle = dockedFactor.color;
  } else {
    ctx.fillStyle = COLORS.slot.empty;
    ctx.strokeStyle = slot.role === 'enzyme' ? COLORS.slot.enzymeHighlight : COLORS.slot.cofactorHighlight;
  }

  ctx.lineWidth = hasFactor ? 3 : 2;
  ctx.setLineDash(hasFactor ? [] : [4, 4]);

  ctx.beginPath();
  ctx.roundRect(x, y, slotWidth, slotHeight, 6);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  if (hasFactor) {
    // Draw the docked factor shape
    const factorCenterX = x + slotWidth / 2;
    const factorCenterY = y + slotHeight / 2 - 5;
    drawFactorShape(ctx, dockedFactor.shape, factorCenterX, factorCenterY, dockedFactor.color, 0.8);

    // Draw factor name
    ctx.font = 'bold 10px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text.primary;
    ctx.textAlign = 'center';
    ctx.fillText(dockedFactor.shortName, x + slotWidth / 2, y + slotHeight - 6);
  } else if (isLocked) {
    // Draw lock icon (simple shape instead of emoji for cross-platform compatibility)
    const lockX = x + slotWidth / 2;
    const lockY = y + slotHeight / 2;
    ctx.fillStyle = COLORS.text.secondary;
    // Lock body
    ctx.fillRect(lockX - 8, lockY - 2, 16, 12);
    // Lock shackle
    ctx.strokeStyle = COLORS.text.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lockX, lockY - 4, 6, Math.PI, 0, false);
    ctx.stroke();
  } else {
    // Draw slot role label
    const roleLabel = slot.role === 'enzyme' ? 'ENZYME' : 'COFACTOR';
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text.secondary;
    ctx.textAlign = 'center';
    ctx.fillText(roleLabel, x + slotWidth / 2, y + slotHeight / 2);

    // Draw expected factor
    const expectedFactors = slot.acceptsFactors;
    if (expectedFactors.length > 0) {
      const config = FACTOR_CONFIG[expectedFactors[0]];
      if (config) {
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = slot.role === 'enzyme' ? COLORS.slot.enzymeHighlight : COLORS.slot.cofactorHighlight;
        ctx.fillText(config.shortName, x + slotWidth / 2, y + slotHeight / 2 + 14);
      }
    }
  }
}

/**
 * Draws a tetris-like factor shape at the specified position.
 */
function drawFactorShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  centerX: number,
  centerY: number,
  color: string,
  scale: number = 1
): void {
  const path = SHAPE_PATHS[shape];
  if (!path) return;

  const cellSize = CELL_SIZE * scale;

  // Calculate bounds to center the shape
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [px, py] of path) {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  }

  const shapeWidth = (maxX - minX + 1) * cellSize;
  const shapeHeight = (maxY - minY + 1) * cellSize;
  const offsetX = centerX - shapeWidth / 2;
  const offsetY = centerY - shapeHeight / 2;

  // Draw each cell of the shape
  ctx.fillStyle = color;
  ctx.strokeStyle = adjustColorBrightness(color, -30);
  ctx.lineWidth = 1;

  for (const [px, py] of path) {
    const cellX = offsetX + (px - minX) * cellSize;
    const cellY = offsetY + (py - minY) * cellSize;

    ctx.beginPath();
    ctx.roundRect(cellX, cellY, cellSize - 1, cellSize - 1, 2);
    ctx.fill();
    ctx.stroke();

    // Add highlight effect
    ctx.fillStyle = adjustColorBrightness(color, 30) + '40';
    ctx.fillRect(cellX + 2, cellY + 2, cellSize / 3, cellSize / 3);
    ctx.fillStyle = color;
  }
}

/**
 * Draws a floating factor on the canvas.
 */
function drawFactor(ctx: CanvasRenderingContext2D, factor: GameFactor): void {
  const { position, shape, color, shortName, state } = factor;

  // Don't draw docked factors here (they're drawn in the slots)
  if (state === 'docked') return;

  // Draw glow effect for caught factors
  if (state === 'caught') {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
  }

  // Draw the tetris shape
  drawFactorShape(ctx, shape, position.x, position.y, color);

  ctx.shadowBlur = 0;

  // Draw factor label below the shape
  ctx.font = `bold ${FACTOR_VISUALS.labelFontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = COLORS.text.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(shortName, position.x, position.y + FACTOR_VISUALS.baseRadius + 5);

  // Draw state indicator for stolen factors
  if (state === 'stolen') {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText('STOLEN!', position.x, position.y - FACTOR_VISUALS.baseRadius - 15);
  }
}

/**
 * Adjusts color brightness by the specified amount.
 */
function adjustColorBrightness(hex: string, amount: number): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB values
  const r = Math.max(0, Math.min(255, parseInt(color.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(color.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(color.slice(4, 6), 16) + amount));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Creates a map of slot IDs to their docked factors.
 */
function createDockedFactorMap(
  slots: DockingSlot[],
  complexes: ComplexState[]
): DockedFactorMap {
  const map: DockedFactorMap = {};

  for (const slot of slots) {
    const complex = complexes.find((c) => c.type === slot.complexType);
    if (!complex) continue;

    if (slot.role === 'enzyme' && complex.enzyme) {
      map[slot.id] = complex.enzyme;
    } else if (slot.role === 'cofactor' && complex.cofactor) {
      map[slot.id] = complex.cofactor;
    }
  }

  return map;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Main canvas component for the coagulation factor assembly game.
 * Renders the bloodstream background, platelet workstation, and floating factors.
 */
export function GameCanvas({
  factors,
  dockingSlots,
  complexes,
  caughtFactor,
}: GameCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CANVAS.width, GAME_CANVAS.height);

    // Create map of docked factors for slot rendering
    const dockedFactors = createDockedFactorMap(dockingSlots, complexes);

    // Draw all layers
    drawBackground(ctx);
    drawPlateletWorkstation(ctx, dockingSlots, complexes, dockedFactors);

    // Draw floating factors (exclude caught factor to avoid duplicate rendering)
    for (const factor of factors) {
      if (caughtFactor && factor.id === caughtFactor.id) continue;
      drawFactor(ctx, factor);
    }

    // Draw caught factor on top (if any) - drawn last to appear above other factors
    if (caughtFactor) {
      drawFactor(ctx, caughtFactor);
    }
  }, [factors, dockingSlots, complexes, caughtFactor]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CANVAS.width}
      height={GAME_CANVAS.height}
      className="game-canvas"
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        backgroundColor: COLORS.background.top,
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      }}
    />
  );
}

export default GameCanvas;
