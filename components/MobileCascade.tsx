'use client';

import React from 'react';
import { Factor } from '@/types';

/**
 * Mobile-only coagulation cascade (portrait, fits one screen).
 *
 * One node per factor (zymogen+active merged). Edge semantics are biochemically
 * explicit:
 *   • SOLID arrow  = enzymatic activation/cleavage (the active enzyme acts on the
 *     substrate). e.g. Xa cleaves prothrombin (II) → thrombin; thrombin cleaves
 *     fibrinogen → fibrin. The product is the target node in its active state.
 *   • DASHED link  = cofactor / carrier association (NOT an enzyme). VIIIa, Va and
 *     TF are cofactors that accelerate their enzyme but do not cleave the substrate;
 *     vWF carries FVIII.
 * Node colour follows the pathway; a factor that is deficient in the current
 * coagulogram (activity < 0.6) gets a red ring.
 */

interface MobileCascadeProps {
  factors: Record<string, Factor>;
  className?: string;
}

type Node = { id: string; label: string; pathway: Factor['pathway']; x: number; y: number; r?: number; sub?: string };

const PATHWAY_COLOR: Record<Factor['pathway'], string> = {
  intrinsic: '#2563eb',     // blue
  extrinsic: '#16a34a',     // green
  common: '#0d9488',        // teal
  clot: '#1e293b',          // dark slate
  anticoagulant: '#d97706', // amber
  fibrinolysis: '#0891b2',  // cyan
  platelet: '#7c3aed',      // violet (vWF)
};

// viewBox 340 x 620 (portrait).
const NODES: Node[] = [
  // Contact / intrinsic (left, top→down)
  { id: 'F12', label: 'XII', pathway: 'intrinsic', x: 48, y: 46 },
  { id: 'F11', label: 'XI', pathway: 'intrinsic', x: 48, y: 106 },
  { id: 'F9', label: 'IX', pathway: 'intrinsic', x: 122, y: 152 },     // tenase enzyme (IXa)
  { id: 'F8', label: 'VIII', pathway: 'intrinsic', x: 122, y: 210 },   // tenase COFACTOR (VIIIa)
  { id: 'vWF', label: 'vWF', pathway: 'platelet', x: 56, y: 210, r: 16 },
  // Extrinsic (right)
  { id: 'TF', label: 'TF', pathway: 'extrinsic', x: 252, y: 50 },      // COFACTOR
  { id: 'F7', label: 'VII', pathway: 'extrinsic', x: 298, y: 100 },    // enzyme (VIIa)
  // Common
  { id: 'F10', label: 'X', pathway: 'common', x: 168, y: 268 },        // prothrombinase enzyme (Xa)
  { id: 'F5', label: 'V', pathway: 'common', x: 248, y: 268 },         // prothrombinase COFACTOR (Va)
  { id: 'F2', label: 'II', sub: 'Trombină', pathway: 'common', x: 168, y: 348, r: 30 }, // prothrombin → thrombin
  { id: 'FBG', label: 'Fbg', pathway: 'common', x: 88, y: 430 },
  { id: 'FBN', label: 'Fibrină', pathway: 'common', x: 230, y: 430 },
  { id: 'F13', label: 'XIII', pathway: 'common', x: 300, y: 470 },     // activated by thrombin
  { id: 'FIBRIN_NET', label: 'Cheag', pathway: 'clot', x: 168, y: 512, r: 30 },
];

// SOLID arrows — enzymatic activation / cleavage.
const ACTIVATION: [string, string][] = [
  ['F12', 'F11'],   // XIIa → XI
  ['F11', 'F9'],    // XIa → IX
  ['F9', 'F10'],    // tenase (IXa) → X
  ['F7', 'F10'],    // TF:VIIa → X
  ['F10', 'F2'],    // prothrombinase (Xa) cleaves prothrombin (II) → thrombin
  ['F2', 'FBG'],    // thrombin cleaves fibrinogen
  ['FBG', 'FBN'],   // fibrinogen → fibrin
  ['F2', 'F13'],    // thrombin activates FXIII
  ['F13', 'FIBRIN_NET'], // XIIIa crosslinks fibrin → stable clot
  ['FBN', 'FIBRIN_NET'], // fibrin → clot
];

// DASHED links — cofactor / carrier association (no arrowhead).
const COFACTOR: [string, string][] = [
  ['F8', 'F9'],     // VIIIa cofactor of tenase
  ['F5', 'F10'],    // Va cofactor of prothrombinase
  ['TF', 'F7'],     // TF cofactor of the extrinsic complex
  ['vWF', 'F8'],    // vWF carries FVIII
];

type Pill = { id: string; label: string; pathway: Factor['pathway'] };
const ANTICOAGULANTS: Pill[] = [
  { id: 'TFPI', label: 'TFPI', pathway: 'anticoagulant' },
  { id: 'AT', label: 'AT', pathway: 'anticoagulant' },
  { id: 'PC', label: 'PC', pathway: 'anticoagulant' },
  { id: 'PS', label: 'PS', pathway: 'anticoagulant' },
];
const FIBRINOLYTIC: Pill = { id: 'PLASMIN', label: 'Plasmină', pathway: 'fibrinolysis' };

const POS = new Map(NODES.map((n) => [n.id, n]));

export function MobileCascade({ factors, className = '' }: MobileCascadeProps): React.ReactElement {
  const deficient = (id: string): boolean => {
    const f = factors[id];
    return !!f && f.activity < 0.6;
  };

  const renderNode = (n: Node): React.ReactElement => {
    const color = PATHWAY_COLOR[n.pathway];
    const def = deficient(n.id);
    const r = n.r ?? 22;
    const isClot = n.id === 'FIBRIN_NET';
    const stroke = def ? '#dc2626' : color;
    return (
      <g key={n.id}>
        <circle cx={n.x} cy={n.y} r={r} fill={isClot ? '#1e293b' : def ? '#fef2f2' : '#ffffff'} stroke={stroke} strokeWidth={def ? 3 : 2} />
        <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
          fontSize={r >= 26 ? 14 : r <= 16 ? 8.5 : 11} fontWeight={700}
          fill={isClot ? '#ffffff' : def ? '#dc2626' : color}>{n.label}</text>
        {n.sub && (
          <text x={n.x} y={n.y + r + 11} textAnchor="middle" fontSize={9} fontWeight={600} fill={def ? '#dc2626' : color}>{n.sub}</text>
        )}
      </g>
    );
  };

  const renderPill = (p: Pill, x: number, y: number): React.ReactElement => {
    const color = PATHWAY_COLOR[p.pathway];
    const def = deficient(p.id);
    const w = p.label.length * 6.2 + 16;
    const stroke = def ? '#dc2626' : color;
    return (
      <g key={p.id}>
        <rect x={x} y={y} width={w} height={22} rx={11} fill="#ffffff" stroke={stroke} strokeWidth={1.5} />
        <text x={x + w / 2} y={y + 11} textAnchor="middle" dominantBaseline="central" fontSize={9.5} fontWeight={700} fill={def ? '#dc2626' : color}>{p.label}</text>
      </g>
    );
  };

  return (
    <div className={`w-full h-full overflow-hidden bg-slate-50 ${className}`}>
      <svg viewBox="0 0 340 620" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="mc-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* zone hints */}
        <text x={46} y={18} fontSize={9} fontWeight={700} fill={PATHWAY_COLOR.intrinsic} opacity={0.5}>CALEA INTRINSECĂ</text>
        <text x={300} y={18} fontSize={9} fontWeight={700} fill={PATHWAY_COLOR.extrinsic} opacity={0.5} textAnchor="end">EXTRINSECĂ</text>
        <text x={252} y={244} fontSize={9} fontWeight={700} fill={PATHWAY_COLOR.common} opacity={0.5} textAnchor="end">CALEA COMUNĂ</text>

        {/* cofactor / carrier links (dashed, no arrowhead) */}
        {COFACTOR.map(([a, b], i) => {
          const na = POS.get(a); const nb = POS.get(b); if (!na || !nb) return null;
          return <line key={`c${i}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" />;
        })}

        {/* activation arrows (solid) */}
        {ACTIVATION.map(([a, b], i) => {
          const na = POS.get(a); const nb = POS.get(b); if (!na || !nb) return null;
          // shorten so the arrowhead sits at the node edge
          const dx = nb.x - na.x, dy = nb.y - na.y, len = Math.hypot(dx, dy) || 1;
          const rb = (nb.r ?? 22) + 3, ra = (na.r ?? 22);
          const x1 = na.x + (dx / len) * ra, y1 = na.y + (dy / len) * ra;
          const x2 = nb.x - (dx / len) * rb, y2 = nb.y - (dy / len) * rb;
          return <line key={`a${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={1.6} opacity={0.7} markerEnd="url(#mc-arrow)" />;
        })}

        {NODES.map(renderNode)}

        {/* regulators: colour-coded by class */}
        <line x1={14} y1={556} x2={326} y2={556} stroke="#e2e8f0" strokeWidth={1} />
        <text x={14} y={550} fontSize={8} fontWeight={700} fill={PATHWAY_COLOR.anticoagulant}>ANTICOAGULANȚI</text>
        <text x={326} y={550} fontSize={8} fontWeight={700} fill={PATHWAY_COLOR.fibrinolysis} textAnchor="end">FIBRINOLIZĂ</text>
        {ANTICOAGULANTS.map((p, i) => {
          const x = 14 + ANTICOAGULANTS.slice(0, i).reduce((acc, q) => acc + (q.label.length * 6.2 + 16) + 6, 0);
          return renderPill(p, x, 566);
        })}
        {renderPill(FIBRINOLYTIC, 244, 566)}

        {/* legend */}
        <line x1={14} y1={602} x2={30} y2={602} stroke="#94a3b8" strokeWidth={1.6} markerEnd="url(#mc-arrow)" />
        <text x={34} y={605} fontSize={8} fill="#64748b">activează</text>
        <line x1={96} y1={602} x2={112} y2={602} stroke="#cbd5e1" strokeWidth={1.6} strokeDasharray="3 3" />
        <text x={116} y={605} fontSize={8} fill="#64748b">cofactor / transport</text>
      </svg>
    </div>
  );
}
