'use client';

import { useRef, useEffect } from 'react';

interface PrimaryHemostasisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 680;

const COLORS = {
  primary: '#dc2626',
  primaryDark: '#991b1b',
  dark: '#1e293b',
  text: '#334155',
  textMuted: '#64748b',
  arrow: '#94a3b8',
  arrowDark: '#475569',
  link: '#0d9488',
  inhibit: '#ef4444',
  feedback: '#f59e0b',
  white: '#ffffff',
  bg: '#f8fafc',
};

// Grid constants for strict alignment
const GRID = {
  centerX: 400,
  col1: 150,    // Left column (vWF/GPIb pathway)
  col2: 400,    // Center column (PLT pathway)
  col3: 650,    // Right column (GPVI pathway)
  boxY: 440,    // Phase boxes row - moved UP
};

export function PrimaryHemostasisModal({ isOpen, onClose }: PrimaryHemostasisModalProps): React.ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const scaleX = rect.width / CANVAS_WIDTH;
    const scaleY = rect.height / CANVAS_HEIGHT;

    // Clear background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // === HELPER FUNCTIONS ===

    const drawNode = (x: number, y: number, label: string, filled: boolean = false): void => {
      const nx = x * scaleX;
      const ny = y * scaleY;
      const radius = 22;
      ctx.beginPath();
      ctx.arc(nx, ny, radius, 0, Math.PI * 2);
      ctx.fillStyle = filled ? COLORS.primary : COLORS.white;
      ctx.fill();
      ctx.strokeStyle = COLORS.primary;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = filled ? COLORS.white : COLORS.primary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, nx, ny);
    };

    const drawDiscoidPlatelet = (x: number, y: number, label: string): void => {
      const nx = x * scaleX;
      const ny = y * scaleY;
      ctx.beginPath();
      ctx.ellipse(nx, ny, 28, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.white;
      ctx.fill();
      ctx.strokeStyle = COLORS.primary;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '700 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = COLORS.primary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, nx, ny);
    };

    const drawActivatedPlatelet = (x: number, y: number, label: string, scale: number = 1): void => {
      const nx = x * scaleX;
      const ny = y * scaleY;
      const radius = 20 * scale;
      const spikes = 8;
      const spikeLen = 8 * scale;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? radius + spikeLen : radius;
        const px = nx + Math.cos(angle) * r;
        const py = ny + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = COLORS.primary;
      ctx.fill();
      ctx.strokeStyle = COLORS.primaryDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (label) {
        ctx.font = `700 ${10 * scale}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, nx, ny);
      }
    };

    const drawPhaseBox = (x: number, y: number, num: string, label: string, sub: string): void => {
      const px = x * scaleX;
      const py = y * scaleY;
      const w = 130;
      const h = 42;

      ctx.beginPath();
      ctx.roundRect(px - w/2, py - h/2, w, h, 6);
      ctx.fillStyle = COLORS.dark;
      ctx.fill();

      // Number badge
      ctx.beginPath();
      ctx.arc(px - w/2 + 18, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.primary;
      ctx.fill();
      ctx.font = '700 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = COLORS.white;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num, px - w/2 + 18, py);

      // Labels
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = COLORS.white;
      ctx.textAlign = 'left';
      ctx.fillText(label, px - w/2 + 36, py - 6);
      ctx.font = '400 8px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(sub, px - w/2 + 36, py + 9);
    };

    const drawStraightArrow = (x1: number, y1: number, x2: number, y2: number, color: string = COLORS.arrow, lineWidth: number = 1.5): void => {
      const ax1 = x1 * scaleX;
      const ay1 = y1 * scaleY;
      const ax2 = x2 * scaleX;
      const ay2 = y2 * scaleY;

      ctx.beginPath();
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(ax2, ay2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
      const size = 6;
      ctx.beginPath();
      ctx.moveTo(ax2, ay2);
      ctx.lineTo(ax2 - size * Math.cos(angle - Math.PI/6), ay2 - size * Math.sin(angle - Math.PI/6));
      ctx.lineTo(ax2 - size * Math.cos(angle + Math.PI/6), ay2 - size * Math.sin(angle + Math.PI/6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Elbow connector: down then left (orthogonal)
    const drawElbowDownLeft = (x1: number, y1: number, x2: number, y2: number, color: string = COLORS.arrowDark): void => {
      const ax1 = x1 * scaleX;
      const ay1 = y1 * scaleY;
      const ax2 = x2 * scaleX;
      const ay2 = y2 * scaleY;

      ctx.beginPath();
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(ax1, ay2); // down
      ctx.lineTo(ax2, ay2); // left
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead pointing left
      const size = 6;
      ctx.beginPath();
      ctx.moveTo(ax2, ay2);
      ctx.lineTo(ax2 + size, ay2 - size * 0.5);
      ctx.lineTo(ax2 + size, ay2 + size * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Small loop arrow (like a refresh icon) - for autocatalysis
    const drawLoopArrow = (x: number, y: number, radius: number = 25): void => {
      const nx = x * scaleX;
      const ny = y * scaleY;
      const r = radius;

      ctx.beginPath();
      ctx.arc(nx + r, ny, r, Math.PI * 0.65, Math.PI * 1.85);
      ctx.strokeStyle = COLORS.feedback;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Arrowhead at the end
      const angle = Math.PI * 1.85;
      const endX = nx + r + Math.cos(angle) * r;
      const endY = ny + Math.sin(angle) * r;
      const arrowAngle = angle + Math.PI / 2;
      const size = 6;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - size * Math.cos(arrowAngle - Math.PI/5), endY - size * Math.sin(arrowAngle - Math.PI/5));
      ctx.lineTo(endX - size * Math.cos(arrowAngle + Math.PI/5), endY - size * Math.sin(arrowAngle + Math.PI/5));
      ctx.closePath();
      ctx.fillStyle = COLORS.feedback;
      ctx.fill();
    };

    const drawInhibitorBadge = (x: number, y: number, molecule: string, drug: string, mechanism: string): void => {
      const nx = x * scaleX;
      const ny = y * scaleY;

      // Red X circle
      ctx.beginPath();
      ctx.arc(nx, ny, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#fef2f2';
      ctx.fill();
      ctx.strokeStyle = COLORS.inhibit;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(nx - 6, ny - 6);
      ctx.lineTo(nx + 6, ny + 6);
      ctx.stroke();

      // Molecule label above
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.fillText(molecule, nx, ny - 22);

      // Drug name below
      ctx.font = '600 9px Inter, system-ui, sans-serif';
      ctx.fillStyle = COLORS.inhibit;
      ctx.fillText(drug, nx, ny + 24);
      ctx.font = '400 8px Inter, system-ui, sans-serif';
      ctx.fillStyle = COLORS.textMuted;
      ctx.fillText(mechanism, nx, ny + 38);
    };

    const drawLabel = (x: number, y: number, text: string, color: string = COLORS.textMuted): void => {
      ctx.font = '400 9px Inter, system-ui, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(text, x * scaleX, y * scaleY);
    };

    // Label positioned to bottom-right of node (avoids arrow crossings)
    const drawLabelBottomRight = (x: number, y: number, text: string): void => {
      ctx.font = '400 9px Inter, system-ui, sans-serif';
      ctx.fillStyle = COLORS.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(text, (x + 28) * scaleX, (y + 8) * scaleY);
    };

    // === HEADER ===
    ctx.font = '600 15px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.fillText('HEMOSTAZA PRIMARĂ', GRID.centerX * scaleX, 22 * scaleY);
    ctx.font = '400 10px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText('Formarea dopului trombocitar', GRID.centerX * scaleX, 42 * scaleY);

    // === ROW 1: TRIGGER ===
    ctx.font = '500 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.primary;
    ctx.fillText('LEZIUNE VASCULARĂ', GRID.centerX * scaleX, 70 * scaleY);
    drawStraightArrow(GRID.centerX, 80, GRID.centerX, 98);

    // === ROW 2: COLLAGEN (center) - label to bottom-right
    drawNode(GRID.centerX, 120, 'Colagen', true);
    ctx.font = '400 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText('subendoteliu expus', (GRID.centerX + 28) * scaleX, (120 + 8) * scaleY);

    // === ROW 3: Split to vWF (left) and GPVI (right) - ORTHOGONAL ===
    drawStraightArrow(GRID.centerX, 145, GRID.centerX, 168, COLORS.arrowDark, 2);

    // Left branch: horizontal then down to vWF
    ctx.beginPath();
    ctx.moveTo(GRID.centerX * scaleX, 168 * scaleY);
    ctx.lineTo(GRID.col1 * scaleX, 168 * scaleY);
    ctx.lineTo(GRID.col1 * scaleX, 188 * scaleY);
    ctx.strokeStyle = COLORS.arrowDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GRID.col1 * scaleX, 188 * scaleY);
    ctx.lineTo((GRID.col1 - 5) * scaleX, 182 * scaleY);
    ctx.lineTo((GRID.col1 + 5) * scaleX, 182 * scaleY);
    ctx.closePath();
    ctx.fillStyle = COLORS.arrowDark;
    ctx.fill();

    // Right branch: horizontal then down to GPVI
    ctx.beginPath();
    ctx.moveTo(GRID.centerX * scaleX, 168 * scaleY);
    ctx.lineTo(GRID.col3 * scaleX, 168 * scaleY);
    ctx.lineTo(GRID.col3 * scaleX, 188 * scaleY);
    ctx.strokeStyle = COLORS.arrowDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GRID.col3 * scaleX, 188 * scaleY);
    ctx.lineTo((GRID.col3 - 5) * scaleX, 182 * scaleY);
    ctx.lineTo((GRID.col3 + 5) * scaleX, 182 * scaleY);
    ctx.closePath();
    ctx.fillStyle = COLORS.arrowDark;
    ctx.fill();

    // vWF node (left column) - label bottom-right to avoid arrow crossing
    drawNode(GRID.col1, 212, 'vWF');
    drawLabelBottomRight(GRID.col1, 212, 'din plasmă');

    // GPVI node (right column) - label bottom-right to avoid arrow crossing
    drawNode(GRID.col3, 212, 'GPVI');
    ctx.font = '400 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('receptor colagen', (GRID.col3 - 28) * scaleX, (212 + 8) * scaleY);

    // === ROW 4: GPIb (left), PLT (center) ===
    drawStraightArrow(GRID.col1, 237, GRID.col1, 262, COLORS.arrow);
    drawNode(GRID.col1, 285, 'GPIb');
    drawLabelBottomRight(GRID.col1, 285, 'receptor vWF');

    // Discoid PLT in center - label to bottom-right, aligned with "receptor vWF"
    drawDiscoidPlatelet(GRID.centerX, 285, 'PLT');
    ctx.font = '400 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText('repaus (discoid)', (GRID.centerX + 35) * scaleX, (285 + 18) * scaleY);

    // Arrow from GPIb to PLT (horizontal)
    drawStraightArrow(GRID.col1 + 30, 285, GRID.centerX - 35, 285, COLORS.arrowDark, 2);

    // Arrow from GPVI to PLT - ORTHOGONAL (down then left)
    drawElbowDownLeft(GRID.col3, 237, GRID.centerX + 35, 285, COLORS.arrowDark);

    // === ROW 5: Activated PLT (center) - "activare" label to left
    ctx.font = '500 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.feedback;
    ctx.textAlign = 'right';
    ctx.fillText('activare ↓', (GRID.centerX - 15) * scaleX, 335 * scaleY);
    drawStraightArrow(GRID.centerX, 315, GRID.centerX, 355, COLORS.arrow);

    drawActivatedPlatelet(GRID.centerX, 385, 'PLT*', 1.3);
    drawLabel(GRID.centerX, 418, 'activat (pseudopode)');

    // Autocatalysis loop (larger, more visible)
    drawLoopArrow(GRID.centerX + 40, 385, 28);
    ctx.font = '600 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.feedback;
    ctx.textAlign = 'left';
    ctx.fillText('recrutare', (GRID.centerX + 78) * scaleX, 378 * scaleY);

    // === PHASE BOXES ROW (moved up) ===
    const boxY = GRID.boxY;

    // Phase 1: ADEZIUNE
    drawPhaseBox(GRID.col1, boxY, '1', 'ADEZIUNE', 'GPIb–vWF–Col');
    drawStraightArrow(GRID.col1, 310, GRID.col1, boxY - 26, COLORS.arrowDark, 2);

    // Arrow from Box 1 to Box 2
    drawStraightArrow(GRID.col1 + 70, boxY, GRID.centerX - 70, boxY, COLORS.arrowDark, 2);

    // Phase 2: ACTIVARE
    drawPhaseBox(GRID.centerX, boxY, '2', 'ACTIVARE', 'granule eliberate');
    drawStraightArrow(GRID.centerX, 418, GRID.centerX, boxY - 26, COLORS.arrowDark, 2);

    // Arrow from Box 2 to Box 3
    drawStraightArrow(GRID.centerX + 70, boxY, GRID.col3 - 70, boxY, COLORS.arrowDark, 2);

    // Phase 3: AGREGARE
    drawPhaseBox(GRID.col3, boxY, '3', 'AGREGARE', 'dop trombocitar');

    // === PHARMACOLOGY: TxA₂ and ADP - more spread out ===
    const pharmY = boxY + 80;

    // TxA₂ branch (left of center, more spread)
    const txaX = GRID.centerX - 70;
    drawStraightArrow(txaX, boxY + 21, txaX, boxY + 48, COLORS.arrow);
    drawInhibitorBadge(txaX, pharmY, 'TxA₂', 'Aspirină', '(COX-1)');

    // ADP branch (right of center, more spread)
    const adpX = GRID.centerX + 70;
    drawStraightArrow(adpX, boxY + 21, adpX, boxY + 48, COLORS.arrow);
    drawInhibitorBadge(adpX, pharmY, 'ADP', 'Clopidogrel', '(P2Y12)');

    // === FIBRINOGEN BRIDGE (below AGREGARE, moved lower for better framing) ===
    const bridgeY = boxY + 105;
    drawStraightArrow(GRID.col3, boxY + 21, GRID.col3, boxY + 70, COLORS.link, 2);

    // Two mini spiky platelets with bridge
    drawActivatedPlatelet(GRID.col3 - 35, bridgeY, '', 0.7);
    drawActivatedPlatelet(GRID.col3 + 35, bridgeY, '', 0.7);

    // Bridge line
    ctx.beginPath();
    ctx.moveTo((GRID.col3 - 16) * scaleX, bridgeY * scaleY);
    ctx.lineTo((GRID.col3 + 16) * scaleX, bridgeY * scaleY);
    ctx.strokeStyle = COLORS.link;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fibrinogen label above bridge
    ctx.font = '600 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.link;
    ctx.textAlign = 'center';
    ctx.fillText('Fibrinogen', GRID.col3 * scaleX, (bridgeY - 22) * scaleY);

    // "punte IIb/IIIa" label below bridge
    drawLabel(GRID.col3, bridgeY + 28, 'punte IIb/IIIa');

    // === FOOTER (at very bottom with proper margin) ===
    ctx.font = '500 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = COLORS.link;
    ctx.textAlign = 'center';
    ctx.fillText('↓ Suprafață fosfolipidică → Cascada coagulării (hemostaza secundară)', GRID.centerX * scaleX, 655 * scaleY);

  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 cursor-pointer backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-50 rounded-xl shadow-2xl border border-slate-200 overflow-hidden cursor-default"
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '780px',
            height: '620px',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
