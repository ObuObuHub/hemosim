// components/game/FactorToken.tsx
'use client';

import type { FactorDefinition } from '@/types/game';
import { ZymogenShape, EnzymeShape, CofactorShape, getShapeType } from './shapes';

interface FactorTokenProps {
  factor: FactorDefinition;
  isActive: boolean;
  isSelected?: boolean;
  isInPalette?: boolean;
  isInComplex?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function FactorToken({
  factor,
  isActive,
  isSelected = false,
  isInPalette = false,
  isInComplex = false,
  onClick,
  style,
}: FactorTokenProps): React.ReactElement {
  const label = isActive ? factor.activeLabel : factor.inactiveLabel;
  const shapeType = getShapeType(factor.id, isActive);

  // Selection glow effect
  const selectionStyle: React.CSSProperties = isSelected ? {
    filter: `drop-shadow(0 0 8px ${factor.color}) drop-shadow(0 0 16px ${factor.color})`,
    transform: 'scale(1.08)',
  } : {};

  // Combine styles
  const combinedStyle: React.CSSProperties = {
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
    ...selectionStyle,
    ...style,
  };

  // Render appropriate shape based on factor type and activation state
  const renderShape = (): React.ReactElement => {
    switch (shapeType) {
      case 'enzyme':
        return (
          <EnzymeShape
            color={factor.color}
            label={label}
            isWobbling={!isInComplex} // Don't wobble when part of complex
            style={combinedStyle}
          />
        );

      case 'cofactor':
        return (
          <CofactorShape
            color={factor.color}
            label={label}
            style={combinedStyle}
          />
        );

      case 'zymogen':
      case 'procofactor':
      default:
        return (
          <ZymogenShape
            color={factor.color}
            label={label}
            style={combinedStyle}
          />
        );
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick && !isSelected) {
          const target = e.currentTarget.querySelector('svg');
          if (target) {
            target.style.transform = 'scale(1.05)';
            target.style.filter = `drop-shadow(0 0 12px ${factor.color})`;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !isSelected) {
          const target = e.currentTarget.querySelector('svg');
          if (target) {
            target.style.transform = '';
            target.style.filter = '';
          }
        }
      }}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {renderShape()}

      {/* Category label for palette view */}
      {isInPalette && (
        <span
          style={{
            position: 'absolute',
            bottom: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          {factor.category}
        </span>
      )}
    </div>
  );
}
