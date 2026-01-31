// components/game/tokens/FactorTokenNew.tsx
'use client';

import { useState } from 'react';
import { ZymogenToken } from './ZymogenToken';
import { EnzymeToken } from './EnzymeToken';
import { CofactorToken } from './CofactorToken';
import { FibrinogenToken } from './FibrinogenToken';
import { GlaDomain } from './GlaDomain';
import { getFactorVisual, isActivatedFactor } from '@/engine/game/factor-visuals';

interface FactorTokenNewProps {
  factorId: string;
  isActive?: boolean;
  isGlowing?: boolean;
  isTouched?: boolean;
  enableHover?: boolean;
  style?: React.CSSProperties;
  /** Hide Gla domain (useful when factor is docked to membrane) */
  hideGlaDomain?: boolean;
  /** Show factor as membrane-bound (activates Ca²⁺-PS bridging visualization) */
  isMembraneBound?: boolean;
  /** Show/hide Ca²⁺ ions on Gla domain */
  showGlaCalcium?: boolean;
}

/**
 * Unified factor token component
 * Automatically selects the correct shape based on factor type and activation state
 * TEXTBOOK FIRST: Shape represents biochemical role
 *
 * Medical accuracy:
 * - Zymogen (circle): Inactive proenzyme waiting for activation
 * - Enzyme (pacman): Active serine protease with catalytic site
 * - Cofactor (star): Non-enzymatic protein that enhances activity
 * - Gla domain: Vitamin K-dependent factors (II, VII, IX, X) have γ-carboxyglutamate
 *   residues that bind Ca²⁺ and anchor to phospholipid membranes
 */
export function FactorTokenNew({
  factorId,
  isActive,
  isGlowing = false,
  isTouched = false,
  enableHover = true,
  style,
  hideGlaDomain = false,
  isMembraneBound = false,
  showGlaCalcium = true,
}: FactorTokenNewProps): React.ReactElement | null {
  const [isHovered, setIsHovered] = useState(false);

  const visual = getFactorVisual(factorId);
  if (!visual) {
    console.warn(`No visual definition for factor: ${factorId}`);
    return null;
  }

  const activated = isActive ?? isActivatedFactor(factorId);
  const shape = activated ? visual.activeShape : visual.inactiveShape;
  const color = activated ? visual.activeColor : visual.inactiveColor;
  const label = activated && !factorId.endsWith('a') ? `${factorId}a` : factorId;
  const hasGlaDomain = visual.hasGlaDomain && !hideGlaDomain;

  const touchStyle: React.CSSProperties = isTouched
    ? {
        transform: 'scale(1.1)',
        filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.5))',
        transition: 'all 0.1s ease-out',
      }
    : {};

  const hoverStyle: React.CSSProperties = enableHover && isHovered
    ? {
        transform: 'scale(1.08) translateY(-2px)',
        filter: `brightness(1.15) drop-shadow(0 4px 12px ${color}80)`,
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    : {
        transition: 'all 0.2s ease-out',
      };

  const combinedStyle = { ...style, ...hoverStyle, ...touchStyle };

  const handleMouseEnter = (): void => {
    if (enableHover) setIsHovered(true);
  };

  const handleMouseLeave = (): void => {
    if (enableHover) setIsHovered(false);
  };

  const wrapperProps = enableHover
    ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
    : {};

  const tokenContent = (() => {
    switch (shape) {
      case 'zymogen':
        return <ZymogenToken color={color} label={label} width={visual.width} height={visual.height} style={combinedStyle} />;
      case 'enzyme':
        return <EnzymeToken color={color} label={label} width={visual.width} height={visual.height} isGlowing={isGlowing || isHovered} style={combinedStyle} />;
      case 'cofactor':
        return <CofactorToken color={color} label={label} width={visual.width} height={visual.height} style={combinedStyle} />;
      case 'fibrinogen':
        return <FibrinogenToken width={visual.width} height={visual.height} style={combinedStyle} />;
      default:
        return null;
    }
  })();

  // Calculate Gla domain size based on factor size
  // Enhanced size when membrane bound to show Ca²⁺-PS bridging
  const glaDomainWidth = isMembraneBound ? 20 : 16;
  const glaDomainHeight = isMembraneBound ? Math.round(visual.height * 0.7) : Math.round(visual.height * 0.5);

  if (!enableHover) {
    if (hasGlaDomain) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {tokenContent}
          <GlaDomain
            width={glaDomainWidth}
            height={glaDomainHeight}
            showCalcium={showGlaCalcium}
            isBound={isMembraneBound}
          />
        </div>
      );
    }
    return tokenContent;
  }

  return (
    <div
      {...wrapperProps}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
    >
      {tokenContent}
      {hasGlaDomain && (
        <GlaDomain
          width={glaDomainWidth}
          height={glaDomainHeight}
          showCalcium={showGlaCalcium}
          isBound={isMembraneBound}
        />
      )}
    </div>
  );
}
