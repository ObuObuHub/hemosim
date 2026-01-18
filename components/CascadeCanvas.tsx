'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Factor } from '@/types';
import { BASIC_MODE_FACTORS, CLINICAL_MODE_FACTORS, SIMPLIFIED_POSITIONS, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/engine/factors';
import { PrimaryHemostasisModal } from './PrimaryHemostasisModal';

// Helper: Parsează clinicalNote și evidențiază text între !! cu roșu
function renderClinicalNote(note: string): React.ReactNode {
  const parts = note.split(/(!![^!]+!!)/g);
  return parts.map((part, index) => {
    if (part.startsWith('!!') && part.endsWith('!!')) {
      const text = part.slice(2, -2);
      return <span key={index} style={{ color: '#dc2626', fontWeight: 600 }}>{text}</span>;
    }
    return part;
  });
}

interface CascadeCanvasProps {
  factors: Record<string, Factor>;
  mode: 'basic' | 'clinical';
  hoveredFactor: string | null;
  hoveredLabValue: string | null;
  dDimers?: number;
  dicPhase: 'normal' | 'activation' | 'consumption' | 'bleeding' | null;
  onFactorHover: (factorId: string | null) => void;
  // Click to block props
  blockedFactors?: Set<string>;
  onFactorClick?: (factorId: string) => void;
  // Toggle-uri pentru vizualizare relații
  showFeedback?: boolean;
  showInhibition?: boolean;
  // Educational scenario
  currentScenario?: string | null;
}

// Culori conform convențiilor medicale (similar cu Frontiers/Harrison's)
const PATHWAY_COLORS: Record<string, string> = {
  intrinsic: '#2563eb',   // Albastru - Calea Intrinsecă (contact)
  extrinsic: '#16a34a',   // Verde - Calea Extrinsecă (tissue factor)
  common: '#0d9488',      // Turcoaz - Calea Comună (convergență albastru+verde)
  platelet: '#dc2626',    // Roșu aprins - Trombocite și complexe (pe membrană)
  fibrinolysis: '#92400e', // Maro - Fibrinoliză
  anticoagulant: '#6b8e23', // Olive - Anticoagulanți naturali
  clot: '#1e293b',        // Negru închis - Cheagul final stabilizat
};

// Nume căi pentru legendă
const PATHWAY_NAMES: Record<string, string> = {
  intrinsic: 'Calea Intrinsecă',
  extrinsic: 'Calea Extrinsecă',
  common: 'Calea Comună',
  platelet: 'Hemostază Primară',
  fibrinolysis: 'Fibrinoliză',
  anticoagulant: 'Anticoagulanți',
};

// Culori pentru tipuri speciale de săgeți
const FEEDBACK_COLOR = '#f59e0b'; // Amber/Gold pentru feedback pozitiv
const INHIBITION_COLOR = '#64748b'; // Gri pentru inhibiție (nu roșu - evită confuzia)

// Culori pentru suprafețele membranare (model celular)
const MEMBRANE_COLORS = {
  tfCell: '#a67c52',      // Celulă TF (tan/brun) - Inițiere
  platelet: '#dc2626',    // Trombocit activat (roșu) - Propagare
  transfer: '#0891b2',    // Xa handoff (cyan)
};

const FACTOR_LABELS: Record<string, string> = {
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
const LAB_TO_FACTORS: Record<string, string[]> = {
  pt: ['TF', 'F7', 'F7a', 'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN'],  // PT → Extrinsic + Common
  inr: ['TF', 'F7', 'F7a', 'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN'], // INR → same as PT
  aptt: ['F12', 'F12a', 'F11', 'F11a', 'F9', 'F9a', 'F8', 'F8a', 'F10', 'F10a', 'F5', 'F5a', 'F2', 'IIa', 'FBG', 'FBN'], // aPTT → Intrinsic + Common
  tt: ['IIa', 'FBG', 'FBN'],                        // TT → Thrombin time
  fibrinogen: ['FBG', 'FBN', 'FIBRIN_NET'],         // Fibrinogen → Clot formation
  platelets: ['PLT'],                               // Platelets
  dDimers: ['PLASMIN', 'FBN', 'FIBRIN_NET'],        // D-Dimers → Fibrinolysis
  bleedingTime: ['PLT', 'vWF'],                     // Bleeding time → Primary hemostasis
};

// Draw a wavy circle (membrane-like border for platelets)
function drawWavyCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  amplitude: number = 2,
  waves: number = 12
): void {
  ctx.beginPath();
  const steps = waves * 8;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wave = Math.sin(angle * waves) * amplitude;
    const r = radius + wave;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

// Draw a membrane surface with classical phospholipid BILAYER on the BOTTOM
// Two rows of circles (heads) with tails between them
function drawMembraneSurface(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  label?: string
): void {
  const circleRadius = 3; // Phospholipid "heads"
  const spacing = circleRadius * 2.4; // Space between circle centers
  const bilayerGap = circleRadius * 4; // Gap between the two layers (room for tails)
  const tailLength = bilayerGap / 2 - 1; // Tails meet in the middle
  const padding = circleRadius + 2;

  // No background fill - just the bilayer itself

  ctx.fillStyle = color + '50';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  const startX = x + padding;
  const endX = x + width - padding;
  const count = Math.floor((endX - startX) / spacing);
  const offset = ((endX - startX) - (count - 1) * spacing) / 2;

  // Outer leaflet (top row - facing the complex)
  const outerY = y + height - padding - bilayerGap;
  for (let i = 0; i < count; i++) {
    const cx = startX + offset + i * spacing;
    // Head
    ctx.beginPath();
    ctx.arc(cx, outerY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (two lines going down)
    ctx.beginPath();
    ctx.moveTo(cx - 1, outerY + circleRadius);
    ctx.lineTo(cx - 1, outerY + circleRadius + tailLength);
    ctx.moveTo(cx + 1, outerY + circleRadius);
    ctx.lineTo(cx + 1, outerY + circleRadius + tailLength);
    ctx.stroke();
  }

  // Inner leaflet (bottom row - facing cytoplasm)
  const innerY = y + height - padding;
  for (let i = 0; i < count; i++) {
    const cx = startX + offset + i * spacing;
    // Head
    ctx.beginPath();
    ctx.arc(cx, innerY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (two lines going up)
    ctx.beginPath();
    ctx.moveTo(cx - 1, innerY - circleRadius);
    ctx.lineTo(cx - 1, innerY - circleRadius - tailLength);
    ctx.moveTo(cx + 1, innerY - circleRadius);
    ctx.lineTo(cx + 1, innerY - circleRadius - tailLength);
    ctx.stroke();
  }

  // Optional label above the complex
  if (label) {
    ctx.font = '600 9px Inter, system-ui, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y - 8);
  }
}

// Draw a circular membrane bilayer (two concentric rings with tails) - same style as rectangular
function drawCircularMembraneSurface(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number, // Where the inner content sits
  color: string
): void {
  const circleRadius = 3; // Same as rectangular version
  const bilayerGap = circleRadius * 4;
  const tailLength = bilayerGap / 2 - 1;

  // No background fill - just the bilayer
  ctx.fillStyle = color + '50';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Inner leaflet (inner ring - facing the cell interior)
  const innerRingRadius = innerRadius + 4;
  const innerCircumference = 2 * Math.PI * innerRingRadius;
  const innerCount = Math.floor(innerCircumference / (circleRadius * 2.4));

  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2;
    const px = cx + Math.cos(angle) * innerRingRadius;
    const py = cy + Math.sin(angle) * innerRingRadius;
    // Head
    ctx.beginPath();
    ctx.arc(px, py, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (pointing outward)
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(angle) * circleRadius, py + Math.sin(angle) * circleRadius);
    ctx.lineTo(px + Math.cos(angle) * (circleRadius + tailLength), py + Math.sin(angle) * (circleRadius + tailLength));
    ctx.stroke();
  }

  // Outer leaflet (outer ring - facing extracellular)
  const outerRingRadius = innerRingRadius + bilayerGap;
  const outerCircumference = 2 * Math.PI * outerRingRadius;
  const outerCount = Math.floor(outerCircumference / (circleRadius * 2.4));

  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2;
    const px = cx + Math.cos(angle) * outerRingRadius;
    const py = cy + Math.sin(angle) * outerRingRadius;
    // Head
    ctx.beginPath();
    ctx.arc(px, py, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tails (pointing inward)
    ctx.beginPath();
    ctx.moveTo(px - Math.cos(angle) * circleRadius, py - Math.sin(angle) * circleRadius);
    ctx.lineTo(px - Math.cos(angle) * (circleRadius + tailLength), py - Math.sin(angle) * (circleRadius + tailLength));
    ctx.stroke();
  }
}

// Particle system for flow animation
interface Particle {
  fromId: string;
  toId: string;
  progress: number; // 0 to 1
  speed: number;
}

export function CascadeCanvas({
  factors,
  mode,
  hoveredFactor,
  hoveredLabValue,
  dDimers = 200,
  dicPhase,
  onFactorHover,
  blockedFactors = new Set(),
  onFactorClick,
  showFeedback = false,
  showInhibition = false,
  currentScenario,
}: CascadeCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [showPrimaryHemostasis, setShowPrimaryHemostasis] = useState(false);

  // Pinch-to-zoom state for mobile
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);

  // Factor activ = selectat (click) sau hover
  const activeFactor = selectedFactor || hoveredFactor;

  const baseVisibleFactors = mode === 'clinical' ? CLINICAL_MODE_FACTORS : BASIC_MODE_FACTORS;

  // ISOLATION MODE: When an inhibitor or potentiator is selected, show only related factors
  const isolationFactors = useMemo<Set<string> | null>(() => {
    if (!selectedFactor) return null;

    const factor = factors[selectedFactor];
    if (!factor) return null;

    // Check if this is an inhibitor (has inhibits array) or potentiator (has feedbackTargets)
    const isInhibitor = factor.inhibits && factor.inhibits.length > 0;
    const isPotentiator = factor.feedbackTargets && factor.feedbackTargets.length > 0;

    if (!isInhibitor && !isPotentiator) return null; // Not a regulator, no isolation

    const visible = new Set<string>([selectedFactor]);

    // Add targets
    if (factor.inhibits) {
      factor.inhibits.forEach(id => visible.add(id));
    }
    if (factor.feedbackTargets) {
      factor.feedbackTargets.forEach(id => visible.add(id));
    }

    return visible;
  }, [selectedFactor, factors]);

  // Final visible factors: either isolated set or full set
  const visibleFactors = useMemo<string[]>(() => {
    if (isolationFactors) {
      return baseVisibleFactors.filter(id => isolationFactors.has(id));
    }
    return baseVisibleFactors;
  }, [baseVisibleFactors, isolationFactors]);

  // Highlight factors based on hovered lab value
  const highlightedFactors = useMemo<string[]>(
    () => {
      if (!hoveredLabValue) return [];
      return LAB_TO_FACTORS[hoveredLabValue] || [];
    },
    [hoveredLabValue]
  );

  const stateRef = useRef({
    factors,
    visibleFactors,
    activeFactor,
    highlightedFactors,
    dDimers,
    dicPhase,
    mode,
    blockedFactors,
    showFeedback,
    showInhibition,
    isolationFactors,
    selectedFactor,
    currentScenario,
  });

  useEffect(() => {
    stateRef.current = {
      factors,
      visibleFactors,
      activeFactor,
      highlightedFactors,
      dDimers,
      dicPhase,
      mode,
      blockedFactors,
      showFeedback,
      showInhibition,
      isolationFactors,
      selectedFactor,
      currentScenario,
    };
  }, [factors, visibleFactors, activeFactor, highlightedFactors, dDimers, dicPhase, mode, blockedFactors, showFeedback, showInhibition, isolationFactors, selectedFactor, currentScenario]);

  useEffect(() => {
    const updateSize = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize particles for active connections
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (const factor of Object.values(factors)) {
      if (!visibleFactors.includes(factor.id)) continue;
      if (factor.activity < 0.15) continue; // Don't create particles for severely slowed factors

      for (const childId of factor.children) {
        const child = factors[childId];
        if (!child || !visibleFactors.includes(childId)) continue;
        if (child.activity < 0.15) continue;

        // Create 1-2 particles per connection based on activity
        const particleCount = factor.activity > 0.7 && child.activity > 0.7 ? 3 : 2;
        for (let i = 0; i < particleCount; i++) {
          newParticles.push({
            fromId: factor.id,
            toId: childId,
            progress: Math.random(), // Start at random position
            speed: 0.15 + Math.min(factor.activity, child.activity) * 0.2, // 0.15-0.35 speed (slower)
          });
        }
      }
    }
    particlesRef.current = newParticles;
  }, [factors, visibleFactors]);

  useEffect(() => {
    const draw = (timestamp: number): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate delta time for smooth animation
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = timestamp;

      const state = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const scaleX = rect.width / CANVAS_WIDTH;
      const scaleY = rect.height / CANVAS_HEIGHT;

      // Helper pentru a obține poziția bazată pe mod
      const getPos = (factor: Factor): { x: number; y: number } => {
        if (state.mode === 'basic' && SIMPLIFIED_POSITIONS[factor.id]) {
          return SIMPLIFIED_POSITIONS[factor.id];
        }
        return factor.position;
      };

      // Clear with light background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw colored zone backgrounds for schematic mode (NOT in isolation mode)
      if (state.mode === 'basic' && !state.isolationFactors) {
        const cornerRadius = 16;

        // Helper function to draw rounded rectangles
        const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number): void => {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
        };

        // Extrinsic zone (pink/magenta) - top-left
        ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 2;
        drawRoundedRect(30 * scaleX, 50 * scaleY, 250 * scaleX, 170 * scaleY, cornerRadius);
        ctx.fill();
        ctx.stroke();

        // Intrinsic zone (blue/purple) - top-right
        ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        drawRoundedRect(510 * scaleX, 30 * scaleY, 280 * scaleX, 310 * scaleY, cornerRadius);
        ctx.fill();
        ctx.stroke();

        // Common zone (orange/yellow) - center-bottom
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        drawRoundedRect(230 * scaleX, 370 * scaleY, 290 * scaleX, 230 * scaleY, cornerRadius);
        ctx.fill();
        ctx.stroke();

        // Zone labels
        ctx.font = '600 11px Inter, system-ui, sans-serif';

        ctx.fillStyle = '#db2777';
        ctx.textAlign = 'left';
        ctx.fillText('Calea extrinsecă', 45 * scaleX, 70 * scaleY);

        ctx.fillStyle = '#7c3aed';
        ctx.textAlign = 'right';
        ctx.fillText('Calea intrinsecă', 775 * scaleX, 55 * scaleY);

        ctx.fillStyle = '#d97706';
        ctx.textAlign = 'left';
        ctx.fillText('Calea comună', 245 * scaleX, 390 * scaleY);
      }

      // Draw pathway labels with colors (only in clinical/extended mode, NOT in isolation mode)
      if (state.mode === 'clinical' && !state.isolationFactors) {
        ctx.font = '600 10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = PATHWAY_COLORS.intrinsic;
        ctx.fillText('CALEA INTRINSECĂ', 50 * scaleX, 30 * scaleY);
        ctx.textAlign = 'right';
        ctx.fillStyle = PATHWAY_COLORS.extrinsic;
        ctx.fillText('CALEA EXTRINSECĂ', 850 * scaleX, 30 * scaleY);
        ctx.textAlign = 'center';
        ctx.fillStyle = PATHWAY_COLORS.common;
        ctx.fillText('CALEA COMUNĂ', 420 * scaleX, 380 * scaleY);

        // Fibrinolysis and Anticoagulant labels
        ctx.fillStyle = PATHWAY_COLORS.fibrinolysis;
        ctx.textAlign = 'left';
        ctx.fillText('FIBRINOLIZĂ', 80 * scaleX, 695 * scaleY);
        // Anticoagulant label (above APC)
        ctx.fillStyle = PATHWAY_COLORS.anticoagulant;
        ctx.textAlign = 'center';
        ctx.fillText('ANTICOAGULANȚI', 870 * scaleX, 520 * scaleY);

        // Phase labels are now drawn inside the complex rendering loop (under Ca²⁺ + PL)
      }

      // Draw connections first (behind nodes)
      // SKIP activation edges in isolation mode - only show regulator edges
      if (!state.isolationFactors) {
      for (const factor of Object.values(state.factors)) {
        if (!state.visibleFactors.includes(factor.id)) continue;

        for (const childId of factor.children) {
          const child = state.factors[childId];
          if (!child || !state.visibleFactors.includes(childId)) continue;

          // Skip vWF→F8 arrow (they're visually attached as "backpack")
          if (factor.id === 'vWF' && childId === 'F8') continue;

          const fromPos = getPos(factor);
          const toPos = getPos(child);
          const fromX = fromPos.x * scaleX;
          const fromY = fromPos.y * scaleY;
          const toX = toPos.x * scaleX;
          const toY = toPos.y * scaleY;

          const activity = Math.min(factor.activity, child.activity);

          // Calculate arrow position (slightly before the target node)
          const angle = Math.atan2(toY - fromY, toX - fromX);
          const nodeRadius = 17;
          const arrowEndX = toX - Math.cos(angle) * (nodeRadius + 5);
          const arrowEndY = toY - Math.sin(angle) * (nodeRadius + 5);
          const arrowStartX = fromX + Math.cos(angle) * (nodeRadius + 5);
          const arrowStartY = fromY + Math.sin(angle) * (nodeRadius + 5);

          ctx.beginPath();
          ctx.moveTo(arrowStartX, arrowStartY);
          ctx.lineTo(arrowEndX, arrowEndY);

          if (activity < 0.05) {
            // BLOCKED: extremely faint
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 0.5;
          } else if (activity < 0.15) {
            // SEVERELY SLOWED
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 0.75;
          } else if (activity < 0.30) {
            // SIGNIFICANTLY SLOWED
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.setLineDash([4, 3]);
            ctx.lineWidth = 1;
          } else if (activity < 0.50) {
            // MILDLY SLOWED
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
            ctx.setLineDash([]);
            ctx.lineWidth = 1.25;
          } else {
            // NORMAL
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
            ctx.setLineDash([]);
            ctx.lineWidth = 1.5;
          }

          ctx.stroke();
          ctx.setLineDash([]);

          // Draw arrow head (show for activity >= 5%)
          if (activity >= 0.05) {
            const arrowSize = 4;
            ctx.beginPath();
            ctx.moveTo(arrowEndX, arrowEndY);
            ctx.lineTo(
              arrowEndX - arrowSize * Math.cos(angle - Math.PI / 6),
              arrowEndY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              arrowEndX - arrowSize * Math.cos(angle + Math.PI / 6),
              arrowEndY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            // Match arrow head opacity to line opacity
            const headOpacity = activity < 0.15 ? 0.25 : activity < 0.30 ? 0.35 : activity < 0.50 ? 0.45 : 0.55;
            ctx.fillStyle = `rgba(148, 163, 184, ${headOpacity})`;
            ctx.fill();
          }
        }
      }
      } // End of !isolationFactors block for activation edges

      // Draw FEEDBACK arrows (thrombin positive feedback)
      // Vizibile când showFeedback=true SAU când hover pe source/target SAU în isolation mode
      // F2 (thrombin) activates F5, F8, F11 for amplification
      if (state.showFeedback || state.activeFactor || state.isolationFactors) {
        for (const factor of Object.values(state.factors)) {
          if (!state.visibleFactors.includes(factor.id)) continue;
          if (!factor.feedbackTargets) continue;

          for (const targetId of factor.feedbackTargets) {
            const target = state.factors[targetId];
            if (!target || !state.visibleFactors.includes(targetId)) continue;

            // Vizibil dacă toggle ON, hover pe source/target, sau isolation mode activ
            const isRelevantHover = state.activeFactor === factor.id || state.activeFactor === targetId;
            const isIsolationEdge = state.isolationFactors && state.selectedFactor === factor.id;
            if (!state.showFeedback && !isRelevantHover && !isIsolationEdge) continue;

          const fromPos = getPos(factor);
          const toPos = getPos(target);
          const fromX = fromPos.x * scaleX;
          const fromY = fromPos.y * scaleY;
          const toX = toPos.x * scaleX;
          const toY = toPos.y * scaleY;

          // Calculate curved path (quadratic bezier)
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          // Curve outward based on direction
          const dx = toX - fromX;
          const dy = toY - fromY;
          const perpX = -dy * 0.3; // Perpendicular offset
          const perpY = dx * 0.3;
          const ctrlX = midX + perpX;
          const ctrlY = midY + perpY;

          // Calculate end point before node
          const angle = Math.atan2(toY - ctrlY, toX - ctrlX);
          const nodeRadius = 19;
          const endX = toX - Math.cos(angle) * nodeRadius;
          const endY = toY - Math.sin(angle) * nodeRadius;

          // Draw curved dashed line
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.strokeStyle = FEEDBACK_COLOR;
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw arrow head
          const arrowSize = 6;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = FEEDBACK_COLOR;
          ctx.fill();
          }
        }
      }

      // Draw INHIBITION arrows (anticoagulants)
      // Vizibile când showInhibition=true SAU când hover pe source/target SAU în isolation mode
      // AT inhibits F2, F10; PC/PS inhibit F5, F8
      if (state.mode === 'clinical' && (state.showInhibition || state.activeFactor || state.isolationFactors)) {
        for (const factor of Object.values(state.factors)) {
          if (!state.visibleFactors.includes(factor.id)) continue;
          if (!factor.inhibits) continue;

          for (const targetId of factor.inhibits) {
            const target = state.factors[targetId];
            if (!target || !state.visibleFactors.includes(targetId)) continue;

            // Vizibil dacă toggle ON, hover pe source/target, sau isolation mode activ
            const isRelevantHover = state.activeFactor === factor.id || state.activeFactor === targetId;
            const isIsolationEdge = state.isolationFactors && state.selectedFactor === factor.id;
            if (!state.showInhibition && !isRelevantHover && !isIsolationEdge) continue;

            const fromPos = getPos(factor);
            const toPos = getPos(target);
            const fromX = fromPos.x * scaleX;
            const fromY = fromPos.y * scaleY;
            const toX = toPos.x * scaleX;
            const toY = toPos.y * scaleY;

            const angle = Math.atan2(toY - fromY, toX - fromX);
            const nodeRadius = 21;
            const endX = toX - Math.cos(angle) * nodeRadius;
            const endY = toY - Math.sin(angle) * nodeRadius;
            const startX = fromX + Math.cos(angle) * (nodeRadius - 4);
            const startY = fromY + Math.sin(angle) * (nodeRadius - 4);

            // Draw line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = INHIBITION_COLOR;
            ctx.setLineDash([3, 2]);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw T-bar (inhibition symbol) instead of arrow
            const barLength = 8;
            ctx.beginPath();
            ctx.moveTo(
              endX - barLength * Math.cos(angle + Math.PI / 2),
              endY - barLength * Math.sin(angle + Math.PI / 2)
            );
            ctx.lineTo(
              endX + barLength * Math.cos(angle + Math.PI / 2),
              endY + barLength * Math.sin(angle + Math.PI / 2)
            );
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        }

      }

      // Update and draw particles (skip in isolation mode)
      if (!state.isolationFactors) {
      for (const particle of particlesRef.current) {
        const fromFactor = state.factors[particle.fromId];
        const toFactor = state.factors[particle.toId];
        if (!fromFactor || !toFactor) continue;
        if (!state.visibleFactors.includes(particle.fromId) || !state.visibleFactors.includes(particle.toId)) continue;

        // Update particle position
        particle.progress += particle.speed * deltaTime;
        if (particle.progress >= 1) {
          particle.progress = 0; // Reset to start
        }

        // Calculate particle position along the connection
        const fromPos = getPos(fromFactor);
        const toPos = getPos(toFactor);
        const fromX = fromPos.x * scaleX;
        const fromY = fromPos.y * scaleY;
        const toX = toPos.x * scaleX;
        const toY = toPos.y * scaleY;

        // Offset from node centers
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const nodeRadius = 19;
        const startX = fromX + Math.cos(angle) * nodeRadius;
        const startY = fromY + Math.sin(angle) * nodeRadius;
        const endX = toX - Math.cos(angle) * nodeRadius;
        const endY = toY - Math.sin(angle) * nodeRadius;

        // Interpolate position
        const px = startX + (endX - startX) * particle.progress;
        const py = startY + (endY - startY) * particle.progress;

        // Draw particle
        const activity = Math.min(fromFactor.activity, toFactor.activity);
        const particleRadius = 1.2;
        const alpha = 0.4 + activity * 0.5; // 0.4-0.9 opacity based on activity

        ctx.beginPath();
        ctx.arc(px, py, particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`; // Blue color
        ctx.fill();
      }
      } // End of !isolationFactors block for particles

      // Draw enzyme-cofactor complex brackets BEFORE nodes (so nodes render on top)
      if (state.mode === 'clinical') {
        const drawnComplexes = new Set<string>();

        for (const factor of Object.values(state.factors)) {
          if (!state.visibleFactors.includes(factor.id)) continue;
          if (!factor.isEnzyme || !factor.complexPartner || !factor.complexName) continue;
          if (drawnComplexes.has(factor.complexName)) continue;

          const partner = state.factors[factor.complexPartner];
          if (!partner || !state.visibleFactors.includes(partner.id)) continue;

          drawnComplexes.add(factor.complexName);

          const enzymePos = getPos(factor);
          const cofactorPos = getPos(partner);
          const enzymeX = enzymePos.x * scaleX;
          const enzymeY = enzymePos.y * scaleY;
          const cofactorX = cofactorPos.x * scaleX;
          const cofactorY = cofactorPos.y * scaleY;

          // Calculate bracket bounds - factors sit ON TOP of the membrane
          const minX = Math.min(enzymeX, cofactorX) - 26;
          const maxX = Math.max(enzymeX, cofactorX) + 26;
          const minY = Math.min(enzymeY, cofactorY) - 22; // Tight above factors
          const bilayerHeight = 20; // Space for the bilayer below factors
          const maxY = Math.max(enzymeY, cofactorY) + 18 + bilayerHeight; // Extend down for membrane
          const centerX = (enzymeX + cofactorX) / 2;

          // Determine membrane color based on cell type
          const membraneType = factor.complexMembrane || 'platelet';
          const membraneColor = MEMBRANE_COLORS[membraneType];

          // Draw membrane surface - factors sit on top of the bilayer
          drawMembraneSurface(
            ctx,
            minX,
            minY,
            maxX - minX,
            maxY - minY,
            membraneColor,
            factor.complexName
          );

          // Draw Ca²⁺ + PL indicator below bracket
          ctx.font = '500 8px Inter, system-ui, sans-serif';
          ctx.fillStyle = membraneColor;
          ctx.textAlign = 'center';
          ctx.fillText('Ca²⁺ + PL', centerX, maxY + 12);

          // Draw phase label below Ca²⁺ + PL
          ctx.font = '600 9px Inter, system-ui, sans-serif';
          if (factor.complexName === 'TF-VIIa') {
            ctx.fillStyle = MEMBRANE_COLORS.tfCell;
            ctx.fillText('INIȚIERE', centerX, maxY + 26);
          } else if (factor.complexName === 'TENAZĂ') {
            ctx.fillStyle = MEMBRANE_COLORS.platelet;
            ctx.fillText('AMPLIFICARE', centerX, maxY + 26);
          } else if (factor.complexName === 'PROTROMBINAZĂ') {
            ctx.fillStyle = MEMBRANE_COLORS.platelet;
            ctx.fillText('PROPAGARE', centerX, maxY + 26);
          }

          // Draw "+" between enzyme and cofactor
          const plusX = (enzymeX + cofactorX) / 2;
          const plusY = (enzymeY + cofactorY) / 2;
          ctx.font = '700 12px Inter, system-ui, sans-serif';
          ctx.fillStyle = membraneColor;
          ctx.fillText('+', plusX, plusY);
        }
      }

      // Draw nodes (on top of brackets)
      // NOUA LOGICĂ: Dimensiune variabilă bazată pe activitate
      const BASE_RADIUS = 17;  // Radius la 100% activitate
      const MIN_RADIUS = 8;    // Radius minim (aproape de 0%)

      for (const factor of Object.values(state.factors)) {
        if (!state.visibleFactors.includes(factor.id)) continue;

        const pos = getPos(factor);
        const x = pos.x * scaleX;
        const y = pos.y * scaleY;

        // Radius variabil bazat pe activitate cu pulsație pentru factori afectați
        let radius: number;
        if (factor.activity >= 0.99) {
          // Normal - fără pulsație
          radius = BASE_RADIUS;
        } else if (factor.activity < 0.05) {
          // Blocat - mic, fără pulsație
          radius = MIN_RADIUS;
        } else {
          // Afectat (5-99%) - pulsează între normal și redus
          const reducedRadius = MIN_RADIUS + (BASE_RADIUS - MIN_RADIUS) * factor.activity;
          const pulse = (Math.sin(timestamp / 400) + 1) / 2; // 0 la 1, ciclu ~2.5s
          radius = reducedRadius + (BASE_RADIUS - reducedRadius) * pulse;
        }

        const isHovered = state.activeFactor === factor.id;
        const isHighlighted = state.highlightedFactors.includes(factor.id);
        const color = PATHWAY_COLORS[factor.pathway] || '#6b7280';
        const isActivated = factor.isActivatedForm === true;
        const isFibrinPulsing = factor.id === 'FIBRIN_NET' && state.dDimers > 2000;

        // Check if factor is manually blocked (click to block feature)
        const isBlocked = state.blockedFactors?.has(factor.id) ?? false;

        // Factor este considerat blocat/consumat dacă activitate < 5% sau blocat manual
        const isBlocked_or_consumed = factor.activity < 0.05 || isBlocked;

        // Node circle (membrane surface for PLT, wavy for vWF)
        const isPlatelet = factor.pathway === 'platelet';
        const isPLTNode = factor.id === 'PLT';

        // PULSATION EFFECT: Fibrin clot pulses red when D-Dimers elevated (active fibrinolysis)
        if (isFibrinPulsing) {
          const pulse = Math.sin(Date.now() / 200) * 0.4 + 0.6; // 0.2 to 1.0
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.3})`; // Red glow
          ctx.fill();
          ctx.restore();
        }

        // PULSATION EFFECT: Factor XIII deficiency - unstable clot visualization
        // F13 și FIBRIN_NET pulsează portocaliu pentru a arăta instabilitatea cheagului
        const isF13Deficiency = state.currentScenario === 'Deficit factor XIII';
        const isF13Related = factor.id === 'F13' || factor.id === 'F13a' || factor.id === 'FIBRIN_NET';
        if (isF13Deficiency && isF13Related) {
          // Pulsație rapidă + efect de "dezintegrare" (raze care radiază)
          const pulseBase = Math.sin(Date.now() / 150) * 0.5 + 0.5; // 0-1, rapid
          const pulseGlow = Math.sin(Date.now() / 300) * 0.3 + 0.7; // 0.4-1, mai lent

          ctx.save();

          // Glow principal portocaliu pulsatil
          ctx.beginPath();
          ctx.arc(x, y, radius + 10 * pulseGlow, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(249, 115, 22, ${pulseBase * 0.4})`; // Orange-500
          ctx.fill();

          // Raze radiale pentru efect de "cheag instabil care se dezintegrează"
          if (factor.id === 'FIBRIN_NET') {
            const rayCount = 8;
            const rayLength = 15 + 10 * pulseBase;
            for (let i = 0; i < rayCount; i++) {
              const angle = (i / rayCount) * Math.PI * 2 + Date.now() / 2000;
              const startR = radius + 5;
              const endR = radius + rayLength;
              ctx.beginPath();
              ctx.moveTo(x + Math.cos(angle) * startR, y + Math.sin(angle) * startR);
              ctx.lineTo(x + Math.cos(angle) * endR, y + Math.sin(angle) * endR);
              ctx.strokeStyle = `rgba(249, 115, 22, ${pulseBase * 0.6})`;
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }

          ctx.restore();
        }

        // PULSATION EFFECT: Lab value hover highlighting (pulsing glow instead of fill)
        if (isHighlighted && !isHovered) {
          const pulse = Math.sin(Date.now() / 250) * 0.4 + 0.6; // Slightly slower pulse
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
          // Use pathway color for the glow
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulse * 0.4})`;
          ctx.fill();
          ctx.restore();
        }

        if (isPLTNode) {
          // PLT: Circular membrane bilayer around the platelet
          drawCircularMembraneSurface(ctx, x, y, radius, MEMBRANE_COLORS.platelet);
          // Draw the platelet circle inside
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        } else if (isPlatelet) {
          // vWF: wavy membrane-like border
          drawWavyCircle(ctx, x, y, radius, 2.5, 10);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        }

        // NOUA LOGICĂ: Fără dashed borders - dimensiunea indică activitatea
        if (isPLTNode) {
          // PLT node: white fill inside membrane surface
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = MEMBRANE_COLORS.platelet;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isPlatelet) {
          // vWF: light fill with wavy red border
          ctx.fillStyle = '#fef2f2';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isHovered) {
          // Hovered: filled with thicker border
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.fill();
          ctx.stroke();
        } else if (isActivated) {
          // Activated form: filled circle (even when highlighted - glow handles that)
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = isHighlighted ? 3 : 2; // Thicker border when highlighted
          ctx.fill();
          ctx.stroke();
        } else if (isHighlighted) {
          // Highlighted zymogen: just thicker border, no fill (pulsing glow drawn separately)
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.fill();
          ctx.stroke();
        } else {
          // Zymogen: white fill with colored border
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
        }

        // Factor short name inside
        // Font size proportional to radius
        const fontSize = Math.max(7, Math.round(radius * 0.6));
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // White text on filled circles (hovered or activated)
        if (isHovered || isActivated) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = color; // Colored text on white background
        }
        ctx.fillText(factor.shortName, x, y);

        // X ROȘU MARE: Pentru factori blocați sau cu activitate < 15%
        if (isBlocked_or_consumed) {
          ctx.save();
          ctx.strokeStyle = '#dc2626';  // Roșu puternic
          ctx.lineWidth = 4;  // Mai gros
          ctx.lineCap = 'round';
          // X mai mare decât nodul
          const xSize = radius * 1.3;
          ctx.beginPath();
          ctx.moveTo(x - xSize, y - xSize);
          ctx.lineTo(x + xSize, y + xSize);
          ctx.moveTo(x + xSize, y - xSize);
          ctx.lineTo(x - xSize, y + xSize);
          ctx.stroke();
          ctx.restore();
        }

        // ELIMINAT: Activity indicator arrows (săgețile în jos)
        // Acum activitatea e indicată de DIMENSIUNEA cercului

        // Vitamin K indicator - green badge
        if (factor.vitKDependent && state.mode === 'clinical') {
          const badgeX = x + radius - 2;
          const badgeY = y - radius + 2;
          const badgeRadius = 8;

          // Badge background
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#16a34a';
          ctx.fill();

          // Badge border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // K letter
          ctx.font = '700 9px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('K', badgeX, badgeY);
        }

        // Clickable nodes (PLT) - no visual indicator, kept as "easter egg"
        // Click handler still works to open primary hemostasis modal
      }

      // DIC phase indicator
      if (state.dicPhase && state.dicPhase !== 'normal') {
        ctx.font = '600 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        const phaseText = state.dicPhase === 'activation'
          ? 'ACTIVARE MASIVĂ'
          : state.dicPhase === 'consumption'
            ? 'CONSUM FACTORI'
            : 'COAGULOPATIE';
        ctx.fillText(phaseText, rect.width / 2, 25);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame((timestamp) => draw(timestamp));
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const findFactorAtPosition = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const scaleX = rect.width / CANVAS_WIDTH;
    const scaleY = rect.height / CANVAS_HEIGHT;

    // Larger touch target on mobile (35px vs 25px)
    const touchRadius = 'ontouchstart' in window ? 35 : 25;

    for (const factor of Object.values(factors)) {
      if (!visibleFactors.includes(factor.id)) continue;

      const factorPos = mode === 'basic' && SIMPLIFIED_POSITIONS[factor.id]
        ? SIMPLIFIED_POSITIONS[factor.id]
        : factor.position;
      const fx = factorPos.x * scaleX;
      const fy = factorPos.y * scaleY;
      const dist = Math.sqrt((x - fx) ** 2 + (y - fy) ** 2);

      if (dist < touchRadius) {
        return factor.id;
      }
    }

    return null;
  }, [factors, visibleFactors]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Doar hover dacă nu avem factor selectat
    if (!selectedFactor) {
      const found = findFactorAtPosition(e.clientX, e.clientY);
      onFactorHover(found);
    }
  }, [findFactorAtPosition, onFactorHover, selectedFactor]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const found = findFactorAtPosition(e.clientX, e.clientY);
    if (found) {
      // Check if clicked on PLT - open primary hemostasis modal
      if (found === 'PLT') {
        setShowPrimaryHemostasis(true);
        return;
      }
      // Toggle selection: click pe același factor îl deselectează
      setSelectedFactor(prev => prev === found ? null : found);
    } else {
      // Click în afara factorilor deselectează
      setSelectedFactor(null);
    }
  }, [findFactorAtPosition]);

  const handleMouseLeave = useCallback(() => {
    if (!selectedFactor) {
      onFactorHover(null);
    }
  }, [onFactorHover, selectedFactor]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch start - calculate initial distance
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
      // Calculate midpoint for pan
      lastTouchRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      // If zoomed in, start panning
      if (scale > 1) {
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      } else {
        // Normal behavior - select factor
        const found = findFactorAtPosition(touch.clientX, touch.clientY);
        if (found) {
          setSelectedFactor(prev => prev === found ? null : found);
        } else {
          setSelectedFactor(null);
        }
      }
    }
  }, [findFactorAtPosition, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scaleChange = newDist / lastPinchDistRef.current;

      setScale(prev => Math.min(Math.max(prev * scaleChange, 0.5), 3));
      lastPinchDistRef.current = newDist;

      // Pan while zooming - capture ref value before setState
      const lastTouch = lastTouchRef.current;
      if (lastTouch) {
        const newMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const newMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        setPanOffset(prev => ({
          x: prev.x + (newMidX - lastTouch.x),
          y: prev.y + (newMidY - lastTouch.y),
        }));
        lastTouchRef.current = { x: newMidX, y: newMidY };
      }
    } else if (e.touches.length === 1 && scale > 1) {
      // Single finger pan when zoomed - capture ref value before setState
      const lastTouch = lastTouchRef.current;
      if (lastTouch) {
        const touch = e.touches[0];
        setPanOffset(prev => ({
          x: prev.x + (touch.clientX - lastTouch.x),
          y: prev.y + (touch.clientY - lastTouch.y),
        }));
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = null;
    lastTouchRef.current = null;
  }, []);

  // Double-tap to reset zoom
  const lastTapTimeRef = useRef<number>(0);
  const handleDoubleTap = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      // Double tap - reset zoom or zoom to 2x
      if (scale > 1.1) {
        setScale(1);
        setPanOffset({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
      e.preventDefault();
    }
    lastTapTimeRef.current = now;
  }, [scale]);

  // Detectează desktop (width > 768px)
  const isDesktop = canvasSize.width > 500;

  // Generează conținutul info panel
  const renderFactorInfo = (): React.ReactNode => {
    if (!activeFactor || !factors[activeFactor]) return null;

    const factor = factors[activeFactor];
    const activity = factor.activity;
    let activityText = 'Normal';
    let activityClass = 'status-normal';
    if (activity < 0.2) {
      activityText = '↓↓ Sever scăzut';
      activityClass = 'status-critical';
    } else if (activity < 0.5) {
      activityText = '↓ Scăzut';
      activityClass = 'status-warning';
    } else if (activity < 0.95) {
      activityText = '↓ Ușor scăzut';
      activityClass = 'status-mild';
    }

    const pathwayName = PATHWAY_NAMES[factor.pathway] || factor.pathway;
    const pathwayColor = PATHWAY_COLORS[factor.pathway] || '#6b7280';

    return (
      <>
        <div className="factor-info-header" style={{ borderLeftColor: pathwayColor }}>
          <h4>{FACTOR_LABELS[activeFactor] || factor.name}</h4>
          <span className="pathway-badge" style={{ backgroundColor: pathwayColor }}>
            {pathwayName}
          </span>
        </div>
        <div className="factor-info-body">
          <p className={activityClass}>
            <strong>Activitate:</strong> {activityText}
          </p>
          {factor.vitKDependent && (
            <p className="vit-k-badge">Vitamină K dependent</p>
          )}
          {factor.clinicalNote && (
            <p className="clinical-note">{renderClinicalNote(factor.clinicalNote)}</p>
          )}
          {factor.children && factor.children.length > 0 && (
            <p className="relations">
              <strong>Activează:</strong> {factor.children.join(', ')}
            </p>
          )}
          {factor.inhibits && factor.inhibits.length > 0 && (
            <p className="relations inhibits">
              <strong>Inhibă:</strong> {factor.inhibits.join(', ')}
            </p>
          )}
          {factor.feedbackTargets && factor.feedbackTargets.length > 0 && (
            <p className="relations feedback">
              <strong>Feedback (+):</strong> {factor.feedbackTargets.join(', ')}
            </p>
          )}
        </div>
        {selectedFactor && (
          <button
            className="close-info-btn"
            onClick={() => setSelectedFactor(null)}
          >
            ✕ Închide
          </button>
        )}
      </>
    );
  };

  return (
    <div ref={containerRef} className="cascade-container" style={{ overflow: 'hidden' }}>
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          touchAction: scale > 1 ? 'none' : 'auto',
        }}
      >
        <canvas
          ref={canvasRef}
          className="cascade-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onTouchStart={(e) => { handleTouchStart(e); handleDoubleTap(e); }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
      {/* Zoom indicator for mobile */}
      {scale !== 1 && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      )}
      {/* Info Panel - pe desktop în dreapta, pe mobile floating */}
      {activeFactor && factors[activeFactor] && (
        isDesktop ? (
          <div className="factor-info-panel-desktop">
            {renderFactorInfo()}
          </div>
        ) : (
          <div className="factor-info-panel-mobile">
            {renderFactorInfo()}
          </div>
        )
      )}
      {/* Primary Hemostasis Modal - opens when clicking PLT */}
      <PrimaryHemostasisModal
        isOpen={showPrimaryHemostasis}
        onClose={() => setShowPrimaryHemostasis(false)}
      />
    </div>
  );
}
