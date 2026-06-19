'use client';

import React from 'react';
import { Factor } from '@/types';

/**
 * Mobile-only coagulation cascade.
 *
 * The desktop diagram is a wide, landscape graph with every factor split into a
 * zymogen + active node (~34 nodes) — it can't be shown readable and uncrowded on a
 * phone. This is a purpose-built PORTRAIT view: one node per factor, laid out in a
 * compact top→bottom flow that fits a single screen. Node colour reflects the factor's
 * activity (deficient vs normal) from the current coagulogram.
 */

interface MobileCascadeProps {
  factors: Record<string, Factor>;
  className?: string;
}

type Node = {
  id: string;        // factor id used to read activity
  label: string;
  pathway: Factor['pathway'];
  x: number;
  y: number;
  r?: number;
};

const PATHWAY_COLOR: Record<Factor['pathway'], string> = {
  intrinsic: '#2563eb',   // blue
  extrinsic: '#16a34a',   // green
  common: '#0d9488',      // teal
  clot: '#1e293b',        // dark slate
  anticoagulant: '#d97706', // amber (natural anticoagulants)
  fibrinolysis: '#0891b2',  // cyan (fibrinolysis) — distinct from anticoagulants
  platelet: '#7c3aed',    // violet (vWF) — not an alarming red
};

// viewBox is 340 x 600 (portrait). Positions are hand-placed to follow the cascade.
const NODES: Node[] = [
  // Intrinsic (contact → tenase), left
  { id: 'F12', label: 'XII', pathway: 'intrinsic', x: 48, y: 48 },
  { id: 'F11', label: 'XI', pathway: 'intrinsic', x: 48, y: 110 },
  { id: 'F9', label: 'IX', pathway: 'intrinsic', x: 120, y: 158 },
  { id: 'F8', label: 'VIII', pathway: 'intrinsic', x: 120, y: 214 },
  { id: 'vWF', label: 'vWF', pathway: 'platelet', x: 58, y: 214, r: 16 },
  // Extrinsic (TF:VIIa), right
  { id: 'TF', label: 'TF', pathway: 'extrinsic', x: 256, y: 56 },
  { id: 'F7', label: 'VII', pathway: 'extrinsic', x: 300, y: 110 },
  // Common
  { id: 'F10', label: 'X', pathway: 'common', x: 170, y: 278 },
  { id: 'F5', label: 'V', pathway: 'common', x: 250, y: 278 },
  { id: 'F2', label: 'IIa', pathway: 'common', x: 170, y: 356, r: 30 }, // Thrombin (burst)
  { id: 'FBG', label: 'Fbg', pathway: 'common', x: 92, y: 438 },
  { id: 'FBN', label: 'Fibrină', pathway: 'common', x: 232, y: 438 },
  { id: 'F13', label: 'XIII', pathway: 'common', x: 300, y: 494 },
  { id: 'FIBRIN_NET', label: 'Cheag', pathway: 'clot', x: 170, y: 520, r: 30 },
];

// Small natural-anticoagulant / fibrinolysis strip at the bottom.
const REGULATORS: Node[] = [
  { id: 'TFPI', label: 'TFPI', pathway: 'anticoagulant', x: 40, y: 578, r: 15 },
  { id: 'AT', label: 'AT', pathway: 'anticoagulant', x: 96, y: 578, r: 15 },
  { id: 'PC', label: 'PC', pathway: 'anticoagulant', x: 150, y: 578, r: 15 },
  { id: 'PS', label: 'PS', pathway: 'anticoagulant', x: 198, y: 578, r: 15 },
  { id: 'tPA', label: 'tPA', pathway: 'fibrinolysis', x: 256, y: 578, r: 15 },
  { id: 'PLASMIN', label: 'Plasm', pathway: 'fibrinolysis', x: 308, y: 578, r: 15 },
];

// Directed flow edges (by node id).
const EDGES: [string, string][] = [
  ['F12', 'F11'], ['F11', 'F9'],
  ['vWF', 'F8'],                    // vWF carries FVIII
  ['F9', 'F10'], ['F8', 'F10'],     // tenase → X
  ['TF', 'F7'], ['F7', 'F10'],      // extrinsic → X
  ['F10', 'F2'], ['F5', 'F2'],      // prothrombinase → thrombin
  ['F2', 'FBG'], ['FBG', 'FBN'],    // thrombin → fibrinogen → fibrin
  ['F2', 'F13'],                    // thrombin activates FXIII
  ['F13', 'FIBRIN_NET'], ['FBN', 'FIBRIN_NET'], // XIIIa crosslinks fibrin → stable clot
];

const POS = new Map([...NODES, ...REGULATORS].map((n) => [n.id, n]));

export function MobileCascade({ factors, className = '' }: MobileCascadeProps): React.ReactElement {
  const activityOf = (id: string): number => {
    const f = factors[id];
    return f ? f.activity : 1;
  };

  const renderNode = (n: Node): React.ReactElement => {
    const color = PATHWAY_COLOR[n.pathway];
    const act = activityOf(n.id);
    const deficient = act < 0.6;
    const r = n.r ?? 22;
    const fill = deficient ? '#fef2f2' : '#ffffff';
    const stroke = deficient ? '#dc2626' : color;
    const isThrombin = n.id === 'F2';
    const isClot = n.id === 'FIBRIN_NET';
    return (
      <g key={n.id}>
        <circle
          cx={n.x}
          cy={n.y}
          r={r}
          fill={isClot ? '#1e293b' : isThrombin && !deficient ? color : fill}
          stroke={stroke}
          strokeWidth={deficient ? 3 : 2}
        />
        <text
          x={n.x}
          y={n.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={r >= 26 ? 13 : r <= 16 ? 8.5 : 11}
          fontWeight={700}
          fill={isClot || (isThrombin && !deficient) ? '#ffffff' : deficient ? '#dc2626' : color}
        >
          {n.label}
        </text>
      </g>
    );
  };

  return (
    <div className={`w-full h-full overflow-hidden bg-slate-50 ${className}`}>
      <svg viewBox="0 0 340 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* zone hints */}
        <text x={48} y={20} fontSize={9} fontWeight={700} fill={PATHWAY_COLOR.intrinsic} opacity={0.5}>CALEA INTRINSECĂ</text>
        <text x={300} y={20} fontSize={9} fontWeight={700} fill={PATHWAY_COLOR.extrinsic} opacity={0.5} textAnchor="end">EXTRINSECĂ</text>
        <text x={258} y={252} fontSize={9} fontWeight={700} fill={PATHWAY_COLOR.common} opacity={0.5} textAnchor="end">CALEA COMUNĂ</text>

        {/* edges */}
        {EDGES.map(([a, b], i) => {
          const na = POS.get(a); const nb = POS.get(b);
          if (!na || !nb) return null;
          return (
            <line
              key={i}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="#94a3b8" strokeWidth={1.5} opacity={0.5}
              markerEnd="url(#arrow)"
            />
          );
        })}

        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>

        {NODES.map(renderNode)}

        {/* regulators: split by category with distinct colours */}
        <line x1={16} y1={552} x2={324} y2={552} stroke="#e2e8f0" strokeWidth={1} />
        <text x={16} y={546} fontSize={8} fontWeight={700} fill={PATHWAY_COLOR.anticoagulant} opacity={0.85}>ANTICOAGULANȚI</text>
        <text x={324} y={546} fontSize={8} fontWeight={700} fill={PATHWAY_COLOR.fibrinolysis} opacity={0.85} textAnchor="end">FIBRINOLIZĂ</text>
        {REGULATORS.map(renderNode)}
      </svg>
    </div>
  );
}
