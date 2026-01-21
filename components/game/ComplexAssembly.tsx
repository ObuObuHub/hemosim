// components/game/ComplexAssembly.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import type { FactorDefinition } from '@/types/game';
import { MergedComplex } from './shapes';
import { FactorToken } from './FactorToken';

interface ComplexAssemblyProps {
  complexType: 'tenase' | 'prothrombinase';
  enzymeFactor: FactorDefinition | null;
  cofactorFactor: FactorDefinition | null;
  onEnzymeSlotClick?: () => void;
  onCofactorSlotClick?: () => void;
  isLocked?: boolean;
}

/**
 * ComplexAssembly: Renders either individual slots OR merged complex
 * When both enzyme and cofactor are placed, shows unified MergedComplex shape
 */
export function ComplexAssembly({
  complexType,
  enzymeFactor,
  cofactorFactor,
  onEnzymeSlotClick,
  onCofactorSlotClick,
  isLocked = false,
}: ComplexAssemblyProps): React.ReactElement {
  const isComplete = enzymeFactor !== null && cofactorFactor !== null;
  const [showMerged, setShowMerged] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);

  // Handle assembly animation - use refs to track previous state
  const prevCompleteRef = useRef(isComplete);

  useEffect(() => {
    // Trigger assembly when transitioning from incomplete to complete
    if (isComplete && !prevCompleteRef.current) {
      setIsAssembling(true);
      const timer = setTimeout(() => {
        setShowMerged(true);
        setIsAssembling(false);
      }, 300);
      prevCompleteRef.current = isComplete;
      return () => clearTimeout(timer);
    }

    // Reset when becoming incomplete
    if (!isComplete && prevCompleteRef.current) {
      setShowMerged(false);
      prevCompleteRef.current = isComplete;
    }
  }, [isComplete]);

  // Get expected factors for ghost outlines
  const expectedEnzyme = complexType === 'tenase' ? 'FIXa' : 'FXa';
  const expectedCofactor = complexType === 'tenase' ? 'FVIIIa' : 'FVa';

  // Render merged complex when complete
  if (showMerged && enzymeFactor && cofactorFactor) {
    return (
      <div
        className={isAssembling ? 'assembly-snap assembly-flash' : ''}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <MergedComplex
          complexType={complexType}
          enzymeColor={enzymeFactor.color}
          cofactorColor={cofactorFactor.color}
        />
        <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
          {complexType === 'tenase' ? 'Tenase Active' : 'Prothrombinase Active'}
        </span>
      </div>
    );
  }

  // Render individual slots
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Enzyme slot (top) */}
      <div
        onClick={onEnzymeSlotClick}
        style={{
          width: 70,
          height: 58,
          border: `2px dashed ${isLocked ? '#4B5563' : enzymeFactor ? 'transparent' : '#6B7280'}`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.5 : 1,
          backgroundColor: enzymeFactor ? 'transparent' : 'rgba(107,114,128,0.1)',
          overflow: 'visible',
        }}
      >
        {enzymeFactor ? (
          <FactorToken factor={enzymeFactor} isActive={true} isInComplex={true} />
        ) : (
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            {expectedEnzyme}
          </span>
        )}
      </div>

      {/* Cofactor slot (bottom) */}
      <div
        onClick={onCofactorSlotClick}
        style={{
          width: 90,
          height: 45,
          border: `2px dashed ${isLocked ? '#4B5563' : cofactorFactor ? 'transparent' : '#6B7280'}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.5 : 1,
          backgroundColor: cofactorFactor ? 'transparent' : 'rgba(107,114,128,0.1)',
          overflow: 'visible',
        }}
      >
        {cofactorFactor ? (
          <FactorToken factor={cofactorFactor} isActive={true} isInComplex={true} />
        ) : (
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            {expectedCofactor}
          </span>
        )}
      </div>

      {/* Complex label */}
      <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
        {complexType === 'tenase' ? 'Tenase' : 'Prothrombinase'}
      </span>
    </div>
  );
}
