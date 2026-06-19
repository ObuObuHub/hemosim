'use client';

import React, { useState } from 'react';
import { Factor } from '@/types';

/**
 * Mobile-only coagulation visualisations (portrait, one screen each).
 *
 * Three views: the coagulation cascade plus two dedicated system diagrams reached by
 * buttons — the natural anticoagulant system and the fibrinolytic system.
 *
 * Edge semantics (shared, with an on-screen legend):
 *   → SOLID  = enzymatic activation / cleavage (enzyme acts on substrate)
 *   ⊣ BLUNT  = inhibition / inactivation
 *   ⋯ DASHED = cofactor / carrier association (accelerates an enzyme, does not cleave)
 * A node whose factor is deficient in the current coagulogram (activity < 0.6) gets a red ring.
 */

interface MobileCascadeProps {
  factors: Record<string, Factor>;
  className?: string;
}

type N = { id: string; label: string; color: string; x: number; y: number; r?: number; sub?: string };
type E = { from: string; to: string; kind: 'act' | 'cof' | 'inh' };
type Diagram = { nodes: N[]; edges: E[] };

const C = {
  intrinsic: '#2563eb',
  extrinsic: '#16a34a',
  common: '#0d9488',
  clot: '#1e293b',
  anticoag: '#d97706',
  fibrino: '#0891b2',
  platelet: '#7c3aed',
  inhibit: '#dc2626',
};

// ---- 1. Coagulation cascade -------------------------------------------------
const COAG: Diagram = {
  nodes: [
    { id: 'F12', label: 'XII', color: C.intrinsic, x: 48, y: 46 },
    { id: 'F11', label: 'XI', color: C.intrinsic, x: 48, y: 106 },
    { id: 'F9', label: 'IX', color: C.intrinsic, x: 122, y: 152 },
    { id: 'F8', label: 'VIII', color: C.intrinsic, x: 122, y: 210 },
    { id: 'vWF', label: 'vWF', color: C.platelet, x: 56, y: 210, r: 16 },
    { id: 'TF', label: 'TF', color: C.extrinsic, x: 252, y: 50 },
    { id: 'F7', label: 'VII', color: C.extrinsic, x: 298, y: 100 },
    { id: 'F10', label: 'X', color: C.common, x: 168, y: 268 },
    { id: 'F5', label: 'V', color: C.common, x: 248, y: 268 },
    { id: 'F2', label: 'II', sub: 'Trombină', color: C.common, x: 168, y: 348, r: 30 },
    { id: 'FBG', label: 'Fbg', color: C.common, x: 88, y: 430 },
    { id: 'FBN', label: 'Fibrină', color: C.common, x: 230, y: 430 },
    { id: 'F13', label: 'XIII', color: C.common, x: 300, y: 470 },
    { id: 'FIBRIN_NET', label: 'Cheag', color: C.clot, x: 168, y: 512, r: 30 },
  ],
  edges: [
    { from: 'F12', to: 'F11', kind: 'act' }, { from: 'F11', to: 'F9', kind: 'act' },
    { from: 'F9', to: 'F10', kind: 'act' }, { from: 'F7', to: 'F10', kind: 'act' },
    { from: 'F10', to: 'F2', kind: 'act' },
    { from: 'F2', to: 'FBG', kind: 'act' }, { from: 'FBG', to: 'FBN', kind: 'act' },
    { from: 'F2', to: 'F13', kind: 'act' },
    { from: 'F13', to: 'FIBRIN_NET', kind: 'act' }, { from: 'FBN', to: 'FIBRIN_NET', kind: 'act' },
    { from: 'F8', to: 'F9', kind: 'cof' }, { from: 'F5', to: 'F10', kind: 'cof' },
    { from: 'TF', to: 'F7', kind: 'cof' }, { from: 'vWF', to: 'F8', kind: 'cof' },
  ],
};

// ---- 2. Natural anticoagulant system ---------------------------------------
const ANTICOAG: Diagram = {
  nodes: [
    { id: 'tfviia', label: 'TF·VIIa', color: C.extrinsic, x: 58, y: 60, r: 20 },
    { id: 'F10a', label: 'Xa', color: C.common, x: 170, y: 60 },
    { id: 'IIa', label: 'IIa', sub: 'trombină', color: C.common, x: 282, y: 64 },
    { id: 'TFPI', label: 'TFPI', color: C.anticoag, x: 100, y: 160, r: 20 },
    { id: 'AT', label: 'AT', color: C.anticoag, x: 200, y: 168, r: 22 },
    { id: 'HEP', label: 'Heparină', color: C.anticoag, x: 200, y: 250, r: 18 },
    { id: 'TM', label: 'TM', color: C.anticoag, x: 296, y: 150, r: 16 },
    { id: 'PC', label: 'PC', color: C.anticoag, x: 296, y: 230, r: 18 },
    { id: 'APC', label: 'APC', color: C.anticoag, x: 210, y: 330, r: 22 },
    { id: 'PS', label: 'PS', color: C.anticoag, x: 300, y: 330, r: 16 },
    { id: 'F5a', label: 'Va', color: C.common, x: 120, y: 430, r: 20 },
    { id: 'F8a', label: 'VIIIa', color: C.common, x: 250, y: 430, r: 20 },
  ],
  edges: [
    { from: 'TFPI', to: 'tfviia', kind: 'inh' }, { from: 'TFPI', to: 'F10a', kind: 'inh' },
    { from: 'AT', to: 'F10a', kind: 'inh' }, { from: 'AT', to: 'IIa', kind: 'inh' },
    { from: 'HEP', to: 'AT', kind: 'cof' },
    { from: 'IIa', to: 'PC', kind: 'act' }, { from: 'TM', to: 'PC', kind: 'cof' },
    { from: 'PC', to: 'APC', kind: 'act' }, { from: 'PS', to: 'APC', kind: 'cof' },
    { from: 'APC', to: 'F5a', kind: 'inh' }, { from: 'APC', to: 'F8a', kind: 'inh' },
  ],
};

// ---- 3. Fibrinolytic system -------------------------------------------------
const FIBRINO: Diagram = {
  nodes: [
    { id: 'tPA', label: 'tPA', color: C.fibrino, x: 80, y: 70, r: 20 },
    { id: 'PAI1', label: 'PAI-1', color: C.fibrino, x: 80, y: 170, r: 20 },
    { id: 'PLG', label: 'Plasminogen', color: C.fibrino, x: 220, y: 90, r: 26 },
    { id: 'PLASMIN', label: 'Plasmină', color: C.fibrino, x: 200, y: 210, r: 28 },
    { id: 'A2AP', label: 'α₂-AP', color: C.fibrino, x: 308, y: 210, r: 18 },
    { id: 'FBN', label: 'Fibrină', color: C.common, x: 120, y: 320, r: 24 },
    { id: 'DDIMER', label: 'D-dimeri', sub: '(PDF)', color: C.common, x: 250, y: 380, r: 26 },
  ],
  edges: [
    { from: 'tPA', to: 'PLG', kind: 'act' }, { from: 'PLG', to: 'PLASMIN', kind: 'act' },
    { from: 'PAI1', to: 'tPA', kind: 'inh' }, { from: 'A2AP', to: 'PLASMIN', kind: 'inh' },
    // plasmin cleaves fibrin → degradation products (enzymatic, like any protease)
    { from: 'PLASMIN', to: 'FBN', kind: 'act' }, { from: 'FBN', to: 'DDIMER', kind: 'act' },
  ],
};

type View = 'coag' | 'anticoag' | 'fibrino';

export function MobileCascade({ factors, className = '' }: MobileCascadeProps): React.ReactElement {
  const [view, setView] = useState<View>('coag');
  const diagram = view === 'coag' ? COAG : view === 'anticoag' ? ANTICOAG : FIBRINO;
  const vbH = view === 'coag' ? 570 : view === 'anticoag' ? 500 : 440;

  const deficient = (id: string): boolean => {
    const f = factors[id];
    return !!f && f.activity < 0.6;
  };

  const pos = new Map(diagram.nodes.map((n) => [n.id, n]));

  const renderNode = (n: N): React.ReactElement => {
    const def = deficient(n.id);
    const r = n.r ?? 22;
    const isDark = n.id === 'FIBRIN_NET';
    const stroke = def ? C.inhibit : n.color;
    return (
      <g key={n.id}>
        <circle cx={n.x} cy={n.y} r={r} fill={isDark ? C.clot : def ? '#fef2f2' : '#ffffff'} stroke={stroke} strokeWidth={def ? 3 : 2} />
        <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
          fontSize={n.label.length > 8 ? 8.5 : r >= 26 ? 13 : r <= 16 ? 8.5 : 11} fontWeight={700}
          fill={isDark ? '#ffffff' : def ? C.inhibit : n.color}>{n.label}</text>
        {n.sub && <text x={n.x} y={n.y + r + 11} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={def ? C.inhibit : n.color}>{n.sub}</text>}
      </g>
    );
  };

  const renderEdge = (e: E, i: number): React.ReactElement | null => {
    const a = pos.get(e.from); const b = pos.get(e.to); if (!a || !b) return null;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ra = (a.r ?? 22), rb = (b.r ?? 22) + (e.kind === 'inh' ? 5 : 3);
    const x1 = a.x + (dx / len) * ra, y1 = a.y + (dy / len) * ra;
    const x2 = b.x - (dx / len) * rb, y2 = b.y - (dy / len) * rb;
    if (e.kind === 'cof') return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" />;
    if (e.kind === 'inh') return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.inhibit} strokeWidth={1.5} opacity={0.65} markerEnd="url(#mc-inhib)" />;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={1.6} opacity={0.7} markerEnd="url(#mc-arrow)" />;
  };

  const title = view === 'anticoag' ? 'Sistemul anticoagulant' : view === 'fibrino' ? 'Sistemul fibrinolitic' : '';

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      {view !== 'coag' && (
        <div className="flex flex-shrink-0 items-center gap-2 px-1 pb-1">
          <button type="button" onClick={() => setView('coag')}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 active:bg-slate-200">‹ Cascadă</button>
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <svg viewBox={`0 0 340 ${vbH}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mc-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
            <marker id="mc-inhib" viewBox="0 0 10 10" refX={2} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M 2 0 L 2 10" stroke={C.inhibit} strokeWidth={2.2} />
            </marker>
          </defs>

          {view === 'coag' && (
            <>
              <text x={46} y={18} fontSize={9} fontWeight={700} fill={C.intrinsic} opacity={0.5}>CALEA INTRINSECĂ</text>
              <text x={300} y={18} fontSize={9} fontWeight={700} fill={C.extrinsic} opacity={0.5} textAnchor="end">EXTRINSECĂ</text>
              <text x={252} y={244} fontSize={9} fontWeight={700} fill={C.common} opacity={0.5} textAnchor="end">CALEA COMUNĂ</text>
            </>
          )}

          {diagram.edges.filter((e) => e.kind === 'cof').map(renderEdge)}
          {diagram.edges.filter((e) => e.kind !== 'cof').map((e, i) => renderEdge(e, i + 100))}
          {diagram.nodes.map(renderNode)}

          {/* legend */}
          <g transform={`translate(0 ${vbH - 16})`}>
            <line x1={14} y1={0} x2={30} y2={0} stroke="#94a3b8" strokeWidth={1.6} markerEnd="url(#mc-arrow)" />
            <text x={34} y={3} fontSize={8} fill="#64748b">activează</text>
            <line x1={92} y1={0} x2={108} y2={0} stroke={C.inhibit} strokeWidth={1.6} markerEnd="url(#mc-inhib)" />
            <text x={114} y={3} fontSize={8} fill="#64748b">inhibă</text>
            <line x1={156} y1={0} x2={172} y2={0} stroke="#cbd5e1" strokeWidth={1.6} strokeDasharray="3 3" />
            <text x={178} y={3} fontSize={8} fill="#64748b">cofactor</text>
          </g>
        </svg>
      </div>

      {view === 'coag' && (
        <div className="flex flex-shrink-0 gap-2 px-1 pt-1">
          <button type="button" onClick={() => setView('anticoag')}
            className="flex-1 rounded-lg border-2 px-2 py-2 text-xs font-bold active:scale-[0.98]"
            style={{ color: C.anticoag, borderColor: C.anticoag }}>Sistemul anticoagulant ›</button>
          <button type="button" onClick={() => setView('fibrino')}
            className="flex-1 rounded-lg border-2 px-2 py-2 text-xs font-bold active:scale-[0.98]"
            style={{ color: C.fibrino, borderColor: C.fibrino }}>Sistemul fibrinolitic ›</button>
        </div>
      )}
    </div>
  );
}
