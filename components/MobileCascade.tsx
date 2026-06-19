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

// ---- Node info (curated, medically accurate; one line each) -----------------
type Info = { name: string; role: string };
const INFO: Record<string, Info> = {
  // cascade
  F12: { name: 'Factor XII (Hageman)', role: 'Inițiază calea intrinsecă in vitro (faza de contact). Deficitul NU dă sângerare.' },
  F11: { name: 'Factor XI', role: 'Activat de XIIa și de trombină. Deficitul = hemofilia C (sângerare ușoară, variabilă).' },
  F9: { name: 'Factor IX (Christmas)', role: 'Vitamina K-dependent. Cu VIIIa formează tenaza. Deficitul = hemofilia B.' },
  F8: { name: 'Factor VIII', role: 'Cofactor al IXa (tenaza). Circulă legat de vWF. Deficitul = hemofilia A.' },
  vWF: { name: 'Factor von Willebrand', role: 'Transportă și stabilizează FVIII; mediază aderarea trombocitelor. Deficit = boala von Willebrand.' },
  TF: { name: 'Factor tisular (III)', role: 'Receptor expus la leziune; cofactor al VIIa. Declanșează inițierea in vivo (calea extrinsecă).' },
  F7: { name: 'Factor VII (proconvertină)', role: 'Vitamina K-dependent. Cu TF activează X și IX. Timp de înjumătățire scurt → PT sensibil.' },
  F10: { name: 'Factor X (Stuart-Prower)', role: 'Vitamina K-dependent. Punctul de convergență; cu Va formează protrombinaza.' },
  F5: { name: 'Factor V (proaccelerină)', role: 'Cofactor al Xa (protrombinaza). Inactivat de APC (Leiden = rezistență la APC).' },
  F2: { name: 'Protrombină → Trombină', role: 'Vitamina K-dependent. Trombina clivează fibrinogenul și activează V, VIII, XI, XIII și trombocitele.' },
  FBG: { name: 'Fibrinogen (factor I)', role: 'Substratul final. Trombina îl clivează în monomeri de fibrină. Reactant de fază acută.' },
  FBN: { name: 'Fibrină', role: 'Polimerizează într-o rețea instabilă, stabilizată prin legături încrucișate de FXIIIa.' },
  F13: { name: 'Factor XIII (stabilizator)', role: 'Activat de trombină. Leagă încrucișat fibrina → cheag stabil. Deficit: sângerare tardivă, PT/aPTT normale.' },
  FIBRIN_NET: { name: 'Cheag de fibrină stabilizat', role: 'Rețea reticulată insolubilă care prinde trombocite și eritrocite.' },
  // anticoagulant
  tfviia: { name: 'Complex factor tisular–VIIa', role: 'Inițiatorul extrinsec; ținta primară a TFPI.' },
  F10a: { name: 'Factor Xa', role: 'Enzima protrombinazei; inhibat de TFPI și de antitrombină (potențată de heparină).' },
  IIa: { name: 'Trombină', role: 'Procoagulantă liberă, dar legată de trombomodulină devine anticoagulantă (activează proteina C).' },
  TFPI: { name: 'Inhibitorul căii factorului tisular', role: 'Blochează Xa, apoi complexul Xa–TFPI inhibă TF·VIIa.' },
  AT: { name: 'Antitrombină', role: 'Inhibă trombina și Xa (și IXa, XIa). Accelerată de mii de ori de heparină.' },
  HEP: { name: 'Heparină', role: 'Cofactor: accelerează antitrombina. Nu inhibă singură.' },
  TM: { name: 'Trombomodulină', role: 'Pe endoteliu; leagă trombina și comută activarea spre proteina C.' },
  PC: { name: 'Proteina C', role: 'Vitamina K-dependentă; activată de complexul trombină–trombomodulină.' },
  APC: { name: 'Proteina C activată', role: 'Cu proteina S inactivează Va și VIIIa (oprește amplificarea).' },
  PS: { name: 'Proteina S', role: 'Vitamina K-dependentă; cofactor al APC.' },
  F5a: { name: 'Factor Va', role: 'Cofactor procoagulant; ținta APC (Leiden = rezistent la clivare).' },
  F8a: { name: 'Factor VIIIa', role: 'Cofactor procoagulant (tenaza); inactivat de APC.' },
  // fibrinolytic
  tPA: { name: 'Activator tisular al plasminogenului', role: 'Eliberat de endoteliu; convertește plasminogenul în plasmină pe fibrină.' },
  PAI1: { name: 'Inhibitorul activatorului plasminogenului-1', role: 'Principalul inhibitor al tPA; limitează fibrinoliza.' },
  PLG: { name: 'Plasminogen', role: 'Zimogen; legat de fibrină, este activat de tPA.' },
  PLASMIN: { name: 'Plasmină', role: 'Protează care degradează fibrina și fibrinogenul. Inhibată de α₂-antiplasmină.' },
  A2AP: { name: 'α₂-antiplasmină', role: 'Inhibitorul rapid al plasminei libere.' },
  DDIMER: { name: 'D-dimeri', role: 'Produși de degradare ai fibrinei reticulate; markeri de fibrinoliză / tromboză.' },
};

type View = 'coag' | 'anticoag' | 'fibrino';

export function MobileCascade({ factors, className = '' }: MobileCascadeProps): React.ReactElement {
  const [view, setView] = useState<View>('coag');
  const [selected, setSelected] = useState<string | null>(null);
  const diagram = view === 'coag' ? COAG : view === 'anticoag' ? ANTICOAG : FIBRINO;
  const vbH = view === 'coag' ? 570 : view === 'anticoag' ? 500 : 440;

  const goto = (v: View): void => { setSelected(null); setView(v); };

  const deficient = (id: string): boolean => {
    const f = factors[id];
    return !!f && f.activity < 0.6;
  };

  const pos = new Map(diagram.nodes.map((n) => [n.id, n]));

  const renderNode = (n: N): React.ReactElement => {
    const def = deficient(n.id);
    const r = n.r ?? 22;
    const isDark = n.id === 'FIBRIN_NET';
    const sel = selected === n.id;
    const stroke = def ? C.inhibit : n.color;
    return (
      <g key={n.id} onClick={() => setSelected(n.id)} style={{ cursor: 'pointer' }}>
        {/* generous transparent touch target */}
        <circle cx={n.x} cy={n.y} r={Math.max(r + 10, 24)} fill="transparent" />
        {sel && <circle cx={n.x} cy={n.y} r={r + 5} fill="none" stroke={n.color} strokeWidth={1.5} opacity={0.45} />}
        <circle cx={n.x} cy={n.y} r={r} fill={isDark ? C.clot : def ? '#fef2f2' : '#ffffff'} stroke={stroke} strokeWidth={def || sel ? 3 : 2} pointerEvents="none" />
        <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
          fontSize={n.label.length > 8 ? 8.5 : r >= 26 ? 13 : r <= 16 ? 8.5 : 11} fontWeight={700}
          fill={isDark ? '#ffffff' : def ? C.inhibit : n.color} pointerEvents="none">{n.label}</text>
        {n.sub && <text x={n.x} y={n.y + r + 11} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={def ? C.inhibit : n.color} pointerEvents="none">{n.sub}</text>}
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

  const renderCard = (): React.ReactElement | null => {
    if (!selected) return null;
    const n = pos.get(selected);
    const info = INFO[selected];
    if (!n || !info) return null;
    const f = factors[selected];
    const def = deficient(selected);
    const pct = f ? Math.round(f.activity * 100) : null;
    return (
      <div className="absolute inset-x-1.5 bottom-1.5 rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur"
        style={{ borderColor: def ? C.inhibit : n.color }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: def ? C.inhibit : n.color }} />
            <span className="text-sm font-bold" style={{ color: def ? C.inhibit : n.color }}>{n.label}{n.sub ? ` · ${n.sub}` : ''}</span>
          </div>
          <button type="button" aria-label="Închide" onClick={() => setSelected(null)}
            className="-mr-1 -mt-1 rounded px-2 py-0.5 text-base leading-none text-slate-400 active:text-slate-700">×</button>
        </div>
        <p className="mt-1 text-[13px] font-semibold text-slate-800">{info.name}</p>
        <p className="mt-0.5 text-xs leading-snug text-slate-600">{info.role}</p>
        {pct !== null && (
          <p className="mt-1.5 text-xs font-semibold" style={{ color: def ? C.inhibit : C.extrinsic }}>
            Activitate în acest caz: {pct}%{def ? ' — deficitar' : ''}
          </p>
        )}
      </div>
    );
  };

  const title = view === 'anticoag' ? 'Sistemul anticoagulant' : view === 'fibrino' ? 'Sistemul fibrinolitic' : '';

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      {view !== 'coag' && (
        <div className="flex flex-shrink-0 items-center gap-2 px-1 pb-1">
          <button type="button" onClick={() => goto('coag')}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 active:bg-slate-200">‹ Cascadă</button>
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <svg viewBox={`0 0 340 ${vbH}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mc-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
            <marker id="mc-inhib" viewBox="0 0 10 10" refX={2} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M 2 0 L 2 10" stroke={C.inhibit} strokeWidth={2.2} />
            </marker>
          </defs>

          {/* tap empty space to dismiss the detail card */}
          <rect x={0} y={0} width={340} height={vbH} fill="transparent" onClick={() => setSelected(null)} />

          {view === 'coag' && (
            <>
              <text x={46} y={18} fontSize={9} fontWeight={700} fill={C.intrinsic} opacity={0.5}>CALEA INTRINSECĂ</text>
              <text x={300} y={18} fontSize={9} fontWeight={700} fill={C.extrinsic} opacity={0.5} textAnchor="end">EXTRINSECĂ</text>
              <text x={252} y={244} fontSize={9} fontWeight={700} fill={C.common} opacity={0.5} textAnchor="end">CALEA COMUNĂ</text>
            </>
          )}

          {!selected && (
            <text x={170} y={11} textAnchor="middle" fontSize={8} fill="#94a3b8">atinge un nod pentru detalii</text>
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
        {renderCard()}
      </div>

      {view === 'coag' && (
        <div className="flex flex-shrink-0 gap-2 px-1 pt-1">
          <button type="button" onClick={() => goto('anticoag')}
            className="flex-1 rounded-lg border-2 px-2 py-2 text-xs font-bold active:scale-[0.98]"
            style={{ color: C.anticoag, borderColor: C.anticoag }}>Sistemul anticoagulant ›</button>
          <button type="button" onClick={() => goto('fibrino')}
            className="flex-1 rounded-lg border-2 px-2 py-2 text-xs font-bold active:scale-[0.98]"
            style={{ color: C.fibrino, borderColor: C.fibrino }}>Sistemul fibrinolitic ›</button>
        </div>
      )}
    </div>
  );
}
