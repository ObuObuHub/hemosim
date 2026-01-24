// components/CoagulationIllustration/index.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import type { ReactElement } from 'react';
import { FactorPool } from './FactorPool';
import { MembraneCanvas } from './MembraneCanvas';
import { DraggableFactor } from './DraggableFactor';
import { useIllustrationDrag } from './useIllustrationDrag';
import {
  COMPLEXES,
  type CoagulationIllustrationProps,
  type DragState,
  type Position,
} from './types';

export function CoagulationIllustration({
  className = '',
  language = 'ro',
}: CoagulationIllustrationProps): ReactElement {
  const [currentComplexIndex, setCurrentComplexIndex] = useState<number>(2); // Start with Prothrombinase
  const [dockedFactors, setDockedFactors] = useState<Set<string>>(new Set());
  const [showProduct, setShowProduct] = useState<boolean>(false);
  const [activatingFactors, setActivatingFactors] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<DragState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const membraneRef = useRef<HTMLDivElement>(null);

  const currentComplex = COMPLEXES[currentComplexIndex];
  const allSlotsFilled = currentComplex.slots.every(slot => dockedFactors.has(slot.id));

  // Check if enzyme + cofactor are assembled (triggers complex assembly animation)
  const enzymeSlot = currentComplex.slots.find(s => s.role === 'enzyme');
  const cofactorSlot = currentComplex.slots.find(s => s.role === 'cofactor');
  const isComplexAssembled = Boolean(
    enzymeSlot && cofactorSlot &&
    dockedFactors.has(enzymeSlot.id) && dockedFactors.has(cofactorSlot.id)
  );

  // Find nearest slot for highlighting during drag
  const findNearestSlot = useCallback((position: Position): string | null => {
    if (!membraneRef.current) return null;

    const rect = membraneRef.current.getBoundingClientRect();
    const relativeX = ((position.x - rect.left) / rect.width) * 100;
    const relativeY = ((position.y - rect.top) / rect.height) * 100;

    let nearestSlot: string | null = null;
    let minDistance = Infinity;

    for (const slot of currentComplex.slots) {
      if (dockedFactors.has(slot.id)) continue;

      // Slot positions are percentages on the membrane canvas
      const slotX = slot.position.x;
      const slotY = slot.position.y + 30; // Offset for drop zone area

      const distance = Math.sqrt(
        Math.pow(relativeX - slotX, 2) + Math.pow(relativeY - slotY, 2)
      );

      if (distance < 20 && distance < minDistance) {
        minDistance = distance;
        nearestSlot = slot.id;
      }
    }

    return nearestSlot;
  }, [currentComplex.slots, dockedFactors]);

  // Drag handlers
  const handleDragStart = useCallback((factorId: string, position: Position): void => {
    if (dockedFactors.has(factorId)) return;

    setDragState({
      factorId,
      startPosition: position,
      currentPosition: position,
      nearestSlot: null,
    });
  }, [dockedFactors]);

  const handleDragMove = useCallback((position: Position): void => {
    setDragState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentPosition: position,
        nearestSlot: findNearestSlot(position),
      };
    });
  }, [findNearestSlot]);

  const handleDragEnd = useCallback((): void => {
    if (!dragState) return;

    const { factorId, nearestSlot } = dragState;

    if (nearestSlot) {
      // Dock the factor
      setActivatingFactors(prev => new Set([...prev, factorId]));

      // After animation, mark as docked
      setTimeout(() => {
        setDockedFactors(prev => new Set([...prev, factorId]));
        setActivatingFactors(prev => {
          const newSet = new Set(prev);
          newSet.delete(factorId);
          return newSet;
        });

        // Check if all slots filled
        const willBeAllFilled = currentComplex.slots.every(
          slot => slot.id === factorId || dockedFactors.has(slot.id)
        );
        if (willBeAllFilled) {
          setTimeout(() => setShowProduct(true), 300);
        }
      }, 400);
    }

    setDragState(null);
  }, [dragState, currentComplex.slots, dockedFactors]);

  // Use drag hook
  useIllustrationDrag({
    containerRef,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    isDragging: dragState !== null,
  });

  const handleComplexChange = useCallback((index: number): void => {
    setCurrentComplexIndex(index);
    setDockedFactors(new Set());
    setShowProduct(false);
    setActivatingFactors(new Set());
    setDragState(null);
  }, []);

  const handleReset = useCallback((): void => {
    setDockedFactors(new Set());
    setShowProduct(false);
    setActivatingFactors(new Set());
    setDragState(null);
  }, []);

  const handleFillAll = useCallback((): void => {
    currentComplex.slots.forEach(slot => {
      setDockedFactors(prev => new Set([...prev, slot.id]));
    });
    setTimeout(() => setShowProduct(true), 500);
  }, [currentComplex.slots]);

  const title = language === 'ro' ? currentComplex.titleRo : currentComplex.title;
  const subtitle = language === 'ro' ? currentComplex.subtitleRo : currentComplex.subtitle;
  const description = language === 'ro' ? currentComplex.descriptionRo : currentComplex.description;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden ${className}`}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 py-3 shadow-xl flex-shrink-0">
        <h1 className="text-lg sm:text-xl font-bold text-center">
          {language === 'ro' ? 'MODELUL CELULAR AL COAGULĂRII' : 'CELL-BASED MODEL OF COAGULATION'}
        </h1>
        <p className="text-xs text-blue-200 text-center mt-1">
          {language === 'ro' ? 'Trage factorii din bazin pe membrană' : 'Drag factors from pool to membrane'}
        </p>
      </header>

      {/* Complex Selector */}
      <nav className="flex justify-center gap-2 p-3 bg-white border-b flex-shrink-0">
        {COMPLEXES.map((complex, idx) => (
          <button
            key={complex.id}
            onClick={() => handleComplexChange(idx)}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all
              ${idx === currentComplexIndex
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {language === 'ro' ? complex.titleRo : complex.title}
          </button>
        ))}
      </nav>

      {/* Main Content - Responsive Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4">
        {/* Factor Pool */}
        <aside className="flex-shrink-0 lg:w-48">
          <FactorPool
            slots={currentComplex.slots}
            dockedFactors={dockedFactors}
            activatingFactors={activatingFactors}
            dragState={dragState}
            language={language}
            onDragStart={handleDragStart}
          />
        </aside>

        {/* Membrane Canvas */}
        <section ref={membraneRef} className="flex-1 min-h-0">
          <MembraneCanvas
            complex={currentComplex}
            dockedFactors={dockedFactors}
            activatingFactors={activatingFactors}
            showProduct={showProduct}
            highlightedSlot={dragState?.nearestSlot ?? null}
            language={language}
            showComplexAssembly={isComplexAssembled}
          />
        </section>
      </main>

      {/* Dragging Factor Overlay */}
      {dragState && (
        <DraggableFactor
          slot={currentComplex.slots.find(s => s.id === dragState.factorId)!}
          position={dragState.currentPosition}
          isNearSlot={dragState.nearestSlot !== null}
        />
      )}

      {/* Footer with Description and Controls */}
      <footer className="bg-white border-t-2 border-blue-200 px-4 py-3 flex-shrink-0">
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-center max-w-lg mx-auto mb-3">
          {description}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold
                     hover:bg-gray-300 transition-all"
          >
            {language === 'ro' ? 'Resetează' : 'Reset'}
          </button>
          {!allSlotsFilled && (
            <button
              onClick={handleFillAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold
                       hover:bg-blue-700 transition-all"
            >
              {language === 'ro' ? 'Arată Complet' : 'Show Complete'}
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">{language === 'ro' ? 'Enzimă' : 'Enzyme'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">{language === 'ro' ? 'Cofactor' : 'Cofactor'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-green-300" />
            <span className="text-xs text-gray-600">{language === 'ro' ? 'Substrat' : 'Substrate'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { CoagulationIllustration as default };
