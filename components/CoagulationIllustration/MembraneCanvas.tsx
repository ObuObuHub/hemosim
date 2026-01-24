// components/CoagulationIllustration/MembraneCanvas.tsx
'use client';

import type { ReactElement } from 'react';
import { EnzymeShape } from '@/components/game/shapes/EnzymeShape';
import { CofactorShape } from '@/components/game/shapes/CofactorShape';
import type { ComplexConfig, SlotConfig } from './types';
import { lightenColor, darkenColor } from './types';

interface MembraneCanvasProps {
  complex: ComplexConfig;
  dockedFactors: Set<string>;
  activatingFactors: Set<string>;
  showProduct: boolean;
  highlightedSlot: string | null;
  language: 'en' | 'ro';
  showComplexAssembly?: boolean;
}

export function MembraneCanvas({
  complex,
  dockedFactors,
  activatingFactors,
  showProduct,
  highlightedSlot,
  language,
  showComplexAssembly = false,
}: MembraneCanvasProps): ReactElement {
  const allSlotsFilled = complex.slots.every(slot => dockedFactors.has(slot.id));

  // Check if enzyme + cofactor are both docked (complex is assembled)
  const enzymeSlot = complex.slots.find(s => s.role === 'enzyme');
  const cofactorSlot = complex.slots.find(s => s.role === 'cofactor');
  const isComplexAssembled = enzymeSlot && cofactorSlot &&
    dockedFactors.has(enzymeSlot.id) && dockedFactors.has(cofactorSlot.id);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl overflow-hidden shadow-inner">
      <svg
        viewBox="0 0 400 300"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Background gradient */}
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Membrane gradient */}
          <linearGradient id="membrane-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={complex.membrane === 'platelet' ? '#FDF2F8' : '#DCFCE7'} />
            <stop offset="30%" stopColor={complex.membrane === 'platelet' ? '#FBCFE8' : '#BBF7D0'} />
            <stop offset="70%" stopColor={complex.membrane === 'platelet' ? '#F9A8D4' : '#86EFAC'} />
            <stop offset="100%" stopColor={complex.membrane === 'platelet' ? '#EC4899' : '#22C55E'} />
          </linearGradient>

          {/* Factor gradients */}
          {complex.slots.map(slot => (
            <radialGradient
              key={`grad-${slot.id}`}
              id={`factor-grad-${slot.id}`}
              cx="30%"
              cy="25%"
              r="65%"
              fx="25%"
              fy="20%"
            >
              <stop offset="0%" stopColor={lightenColor(slot.color, 50)} />
              <stop offset="30%" stopColor={lightenColor(slot.color, 20)} />
              <stop offset="60%" stopColor={slot.color} />
              <stop offset="100%" stopColor={darkenColor(slot.color, 40)} />
            </radialGradient>
          ))}

          {/* Product gradient */}
          <radialGradient id="product-grad" cx="30%" cy="25%" r="65%" fx="25%" fy="20%">
            <stop offset="0%" stopColor={lightenColor(complex.product.color, 50)} />
            <stop offset="30%" stopColor={lightenColor(complex.product.color, 20)} />
            <stop offset="60%" stopColor={complex.product.color} />
            <stop offset="100%" stopColor={darkenColor(complex.product.color, 40)} />
          </radialGradient>

          {/* Ca2+ gradient */}
          <radialGradient id="calcium-grad" cx="30%" cy="25%" r="65%">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="50%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Shadow filter */}
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#1E293B" floodOpacity="0.25" />
          </filter>

          {/* Pulse animation for ghost slots */}
          <style>
            {`
              @keyframes ghost-pulse {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(1.1); }
              }
              .ghost-pulsing { animation: ghost-pulse 2s ease-in-out infinite; }
              .factor-float {
                animation: float 3s ease-in-out infinite;
              }
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
              }
            `}
          </style>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="400" height="300" fill="url(#bg-grad)" rx="8" />

        {/* Drop Zone Area - positioned above membrane */}
        <g>
          {complex.slots.map((slot, index) => {
            const isDocked = dockedFactors.has(slot.id);
            const isActivating = activatingFactors.has(slot.id);
            const isHighlighted = highlightedSlot === slot.id;

            // Calculate position
            const totalSlots = complex.slots.length;
            const spacing = 280 / (totalSlots + 1);
            const cx = 60 + spacing * (index + 1);
            const cy = 80;
            const r = 45;

            return (
              <g key={slot.id}>
                {/* Ghost slot outline (when empty) */}
                {!isDocked && !isActivating && (
                  <g className={isHighlighted ? 'ghost-pulsing' : ''}>
                    {/* Outer pulse ring */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r + 8}
                      fill="none"
                      stroke={slot.color}
                      strokeWidth={isHighlighted ? 3 : 2}
                      opacity={isHighlighted ? 0.8 : 0.3}
                    />
                    {/* Main ghost outline */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={isHighlighted ? `${slot.color}40` : slot.ghostColor}
                      stroke={slot.color}
                      strokeWidth={isHighlighted ? 4 : 3}
                      strokeDasharray={isHighlighted ? 'none' : '12 6'}
                    />
                    {/* Label */}
                    <text
                      x={cx}
                      y={cy + 6}
                      textAnchor="middle"
                      fontSize="20"
                      fontWeight="bold"
                      fill={slot.color}
                      opacity={isHighlighted ? 1 : 0.6}
                    >
                      {slot.label}
                    </text>
                    {/* Drop hint */}
                    <text
                      x={cx}
                      y={cy + 22}
                      textAnchor="middle"
                      fontSize="9"
                      fill={slot.color}
                      opacity={isHighlighted ? 0.9 : 0.4}
                    >
                      {isHighlighted
                        ? (language === 'ro' ? 'eliberează' : 'release')
                        : (language === 'ro' ? 'plasează' : 'drop here')
                      }
                    </text>
                  </g>
                )}

                {/* Activating animation - conformational change */}
                {isActivating && (
                  <g className="factor-sinking factor-activating">
                    {/* Ripple effect */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={slot.color}
                      strokeWidth="4"
                      opacity="0.6"
                      className="docking-ripple"
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                    />
                    {/* Ca2+ sparkles during activation */}
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <circle
                        key={`sparkle-${i}`}
                        cx={cx + Math.cos((i * Math.PI) / 3) * 20}
                        cy={cy + Math.sin((i * Math.PI) / 3) * 20}
                        r="3"
                        fill="#FBBF24"
                        className="calcium-sparkle"
                        style={{
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                    <DockedFactorShape slot={slot} cx={cx} cy={cy} r={r} isActivating={true} />
                  </g>
                )}

                {/* Docked factor */}
                {isDocked && !isActivating && (
                  <g className="factor-float">
                    <DockedFactorShape slot={slot} cx={cx} cy={cy} r={r} />

                    {/* Gla domain line to membrane */}
                    <line
                      x1={cx}
                      y1={cy + r + 5}
                      x2={cx}
                      y2={198}
                      stroke={slot.color}
                      strokeWidth="3"
                      opacity="0.5"
                    />
                    {/* Gla domain indicator */}
                    <ellipse
                      cx={cx}
                      cy={cy + r + 15}
                      rx="8"
                      ry="5"
                      fill={slot.color}
                      opacity="0.7"
                    />
                    <text x={cx} y={cy + r + 18} textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">
                      Gla
                    </text>
                  </g>
                )}

                {/* Ca2+ ion at membrane */}
                <g opacity={isDocked ? 1 : 0.25}>
                  <circle cx={cx} cy={205} r="12" fill="url(#calcium-grad)" filter={isDocked ? 'url(#shadow)' : 'none'} />
                  <text x={cx} y={209} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                    Ca²⁺
                  </text>
                </g>

                {/* Role label */}
                <rect
                  x={cx - 28}
                  y={cy + r + 28}
                  width="56"
                  height="16"
                  rx="8"
                  fill={isDocked ? slot.color : '#E2E8F0'}
                  opacity={isDocked ? 0.2 : 0.5}
                />
                <text
                  x={cx}
                  y={cy + r + 40}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isDocked ? darkenColor(slot.color, 20) : '#64748B'}
                  fontWeight="600"
                >
                  {slot.role === 'enzyme'
                    ? (language === 'ro' ? 'Enzimă' : 'Enzyme')
                    : slot.role === 'cofactor'
                      ? (language === 'ro' ? 'Cofactor' : 'Cofactor')
                      : (language === 'ro' ? 'Substrat' : 'Substrate')
                  }
                </text>
              </g>
            );
          })}
        </g>

        {/* Complex Assembly Indicator - connecting line between enzyme and cofactor */}
        {isComplexAssembled && enzymeSlot && cofactorSlot && (
          <g className="complex-celebrating">
            {(() => {
              const enzymeIndex = complex.slots.findIndex(s => s.id === enzymeSlot.id);
              const cofactorIndex = complex.slots.findIndex(s => s.id === cofactorSlot.id);
              const totalSlots = complex.slots.length;
              const spacing = 280 / (totalSlots + 1);
              const enzymeCx = 60 + spacing * (enzymeIndex + 1);
              const cofactorCx = 60 + spacing * (cofactorIndex + 1);
              const cy = 80;

              return (
                <>
                  {/* Connecting arc between enzyme and cofactor */}
                  <path
                    d={`M ${cofactorCx} ${cy + 20} Q ${(enzymeCx + cofactorCx) / 2} ${cy + 40} ${enzymeCx} ${cy + 20}`}
                    fill="none"
                    stroke="url(#complex-link-grad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  <defs>
                    <linearGradient id="complex-link-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={cofactorSlot.color} />
                      <stop offset="100%" stopColor={enzymeSlot.color} />
                    </linearGradient>
                  </defs>
                  {/* Assembly flash effect */}
                  <circle
                    cx={(enzymeCx + cofactorCx) / 2}
                    cy={cy + 30}
                    r="8"
                    fill="#10B981"
                    opacity="0.6"
                    className="complex-breathing"
                  />
                </>
              );
            })()}
          </g>
        )}

        {/* Phospholipid Bilayer Membrane */}
        <g>
          {/* Shadow under membrane */}
          <ellipse cx="200" cy="285" rx="170" ry="12" fill="#1E293B" opacity="0.1" />

          {/* Outer leaflet */}
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 30 + i * 16;
            return (
              <g key={`outer-${i}`}>
                <circle
                  cx={x}
                  cy={225}
                  r="7"
                  fill={complex.membrane === 'platelet' ? '#FDA4AF' : '#86EFAC'}
                />
                <line x1={x - 2} y1={232} x2={x - 2} y2={248} stroke={complex.membrane === 'platelet' ? '#F9A8D4' : '#BBF7D0'} strokeWidth="2" />
                <line x1={x + 2} y1={232} x2={x + 2} y2={248} stroke={complex.membrane === 'platelet' ? '#F9A8D4' : '#BBF7D0'} strokeWidth="2" />
              </g>
            );
          })}

          {/* Inner leaflet */}
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 30 + i * 16;
            return (
              <g key={`inner-${i}`}>
                <line x1={x - 2} y1={268} x2={x - 2} y2={252} stroke={complex.membrane === 'platelet' ? '#F9A8D4' : '#BBF7D0'} strokeWidth="2" />
                <line x1={x + 2} y1={268} x2={x + 2} y2={252} stroke={complex.membrane === 'platelet' ? '#F9A8D4' : '#BBF7D0'} strokeWidth="2" />
                <circle
                  cx={x}
                  cy={275}
                  r="7"
                  fill={complex.membrane === 'platelet' ? '#FBCFE8' : '#BBF7D0'}
                />
              </g>
            );
          })}

          {/* Hydrophobic core */}
          <rect x="20" y="240" width="360" height="20" fill={complex.membrane === 'platelet' ? '#FDF2F8' : '#F0FDF4'} opacity="0.3" />

          {/* PS markers for platelet */}
          {complex.membrane === 'platelet' && (
            <g>
              {[62, 126, 190, 254, 318].map((x, i) => (
                <g key={`ps-${i}`}>
                  <circle cx={x} cy={225} r="9" fill="#F43F5E" opacity="0.8" />
                  <text x={x} y={229} textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">−</text>
                </g>
              ))}
            </g>
          )}

          {/* Membrane label */}
          <rect x="100" y="285" width="200" height="22" rx="11" fill={complex.membrane === 'platelet' ? '#BE185D' : '#15803D'} />
          <text x="200" y="300" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">
            {complex.membrane === 'platelet'
              ? (language === 'ro' ? 'Plachetă Activată (PS expus)' : 'Activated Platelet (PS exposed)')
              : (language === 'ro' ? 'Celulă Purtătoare de TF' : 'TF-Bearing Cell')
            }
          </text>
        </g>

        {/* Product */}
        {showProduct && (
          <g className="assembly-snap">
            {/* Arrow */}
            <defs>
              <marker id="arrowhead" markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto">
                <polygon points="0 0, 12 4.5, 0 9" fill="#10B981" />
              </marker>
            </defs>
            <path
              d="M 320 50 L 360 25"
              stroke="#10B981"
              strokeWidth="4"
              fill="none"
              markerEnd="url(#arrowhead)"
            />

            {/* Product sphere */}
            <g filter="url(#glow)">
              <circle
                cx="378"
                cy="40"
                r="32"
                fill="url(#product-grad)"
                filter="url(#shadow)"
              />
              <ellipse
                cx="368"
                cy="30"
                rx="10"
                ry="6"
                fill="white"
                opacity="0.4"
              />
              <text
                x="378"
                y="47"
                textAnchor="middle"
                fontSize="20"
                fontWeight="bold"
                fill="white"
              >
                {complex.product.label}
              </text>
            </g>

            <text x="378" y="84" textAnchor="middle" fontSize="11" fill="#059669" fontWeight="bold">
              {language === 'ro' ? 'Produs' : 'Product'}
            </text>
          </g>
        )}

        {/* Assembly complete indicator */}
        {allSlotsFilled && showProduct && (
          <g>
            <rect x="100" y="168" width="180" height="28" rx="14" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
            <text x="190" y="187" textAnchor="middle" fontSize="12" fill="#059669" fontWeight="bold">
              {language === 'ro' ? '✓ Complex Asamblat!' : '✓ Complex Assembled!'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// Helper component for docked factor shape
function DockedFactorShape({
  slot,
  cx,
  cy,
  r,
  isActivating = false,
}: {
  slot: SlotConfig;
  cx: number;
  cy: number;
  r: number;
  isActivating?: boolean;
}): ReactElement {
  // Use foreignObject to embed React shape components
  const shapeWidth = slot.role === 'cofactor' ? 80 : 60;
  const shapeHeight = slot.role === 'cofactor' ? 35 : 50;

  return (
    <g filter="url(#shadow)">
      {/* Outer glow */}
      <circle
        cx={cx}
        cy={cy}
        r={r + 4}
        fill="none"
        stroke={slot.color}
        strokeWidth="2"
        opacity="0.4"
        className="factor-glow"
      />

      {/* Use foreignObject to embed the shape component */}
      <foreignObject
        x={cx - shapeWidth / 2}
        y={cy - shapeHeight / 2}
        width={shapeWidth}
        height={shapeHeight}
      >
        <div className={`flex items-center justify-center w-full h-full ${isActivating ? 'conformational-morphing' : ''}`}>
          {slot.role === 'enzyme' ? (
            <EnzymeShape
              color={slot.color}
              label={slot.label}
              isWobbling={!isActivating}
            />
          ) : slot.role === 'cofactor' ? (
            <CofactorShape
              color={slot.color}
              label={slot.label}
            />
          ) : (
            // Substrate uses enzyme shape (it's a zymogen being activated)
            <EnzymeShape
              color={slot.color}
              label={slot.label}
              isWobbling={!isActivating}
            />
          )}
        </div>
      </foreignObject>
    </g>
  );
}
