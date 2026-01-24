// components/CoagulationIllustration/FactorPool.tsx
'use client';

import type { ReactElement } from 'react';
import { ZymogenShape } from '@/components/game/shapes/ZymogenShape';
import type { SlotConfig, DragState, Position } from './types';

interface FactorPoolProps {
  slots: SlotConfig[];
  dockedFactors: Set<string>;
  activatingFactors: Set<string>;
  dragState: DragState | null;
  language: 'en' | 'ro';
  onDragStart: (factorId: string, position: Position) => void;
}

export function FactorPool({
  slots,
  dockedFactors,
  activatingFactors,
  dragState,
  language,
  onDragStart,
}: FactorPoolProps): ReactElement {
  const handlePointerDown = (
    factorId: string,
    event: React.PointerEvent<HTMLDivElement>
  ): void => {
    if (dockedFactors.has(factorId)) return;

    event.preventDefault();
    event.stopPropagation();

    onDragStart(factorId, {
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">
        {language === 'ro' ? 'Bazin Factori' : 'Factor Pool'}
      </h3>

      {/* Grid layout - horizontal on mobile, vertical on desktop */}
      <div className="flex lg:flex-col gap-2 justify-center items-center flex-wrap">
        {slots.map(slot => {
          const isDocked = dockedFactors.has(slot.id);
          const isActivating = activatingFactors.has(slot.id);
          const isDragging = dragState?.factorId === slot.id;
          const isAvailable = !isDocked && !isActivating && !isDragging;

          return (
            <div
              key={slot.id}
              onPointerDown={(e) => handlePointerDown(slot.id, e)}
              className={`
                relative flex flex-col items-center justify-center
                w-20 h-20 rounded-xl border-2 transition-all duration-200
                ${isAvailable
                  ? 'border-dashed border-gray-300 bg-gray-50 cursor-grab hover:border-gray-400 hover:bg-gray-100 active:cursor-grabbing'
                  : 'border-solid border-gray-200 bg-gray-100 cursor-default'
                }
                ${isDocked ? 'opacity-40' : 'opacity-100'}
                ${isDragging ? 'opacity-0' : ''}
              `}
              style={{
                touchAction: 'none',
              }}
            >
              {/* Zymogen Shape (inactive form) */}
              <div
                className={`
                  transition-transform duration-150
                  ${isAvailable ? 'hover:scale-110' : ''}
                `}
              >
                <ZymogenShape
                  color={slot.color}
                  label={slot.label}
                  style={{
                    opacity: isDocked ? 0.4 : 1,
                    filter: isDocked ? 'grayscale(0.5)' : 'none',
                  }}
                />
              </div>

              {/* Role Label */}
              <span
                className={`
                  text-xs mt-1 font-medium
                  ${isDocked ? 'text-gray-400' : 'text-gray-600'}
                `}
              >
                {slot.role === 'enzyme'
                  ? (language === 'ro' ? 'Enzimă' : 'Enzyme')
                  : slot.role === 'cofactor'
                    ? (language === 'ro' ? 'Cofactor' : 'Cofactor')
                    : (language === 'ro' ? 'Substrat' : 'Substrate')
                }
              </span>

              {/* Docked indicator */}
              {isDocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Activating indicator */}
              {isActivating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-xl animate-ping bg-yellow-400/30" />
                </div>
              )}

              {/* Drag hint for available factors */}
              {isAvailable && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <span className="text-[10px] text-gray-400">
                    {language === 'ro' ? 'trage' : 'drag'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
