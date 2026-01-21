// components/game/tokens/FactorTokenNew.tsx
'use client';

import { ZymogenToken } from './ZymogenToken';
import { EnzymeToken } from './EnzymeToken';
import { CofactorToken } from './CofactorToken';
import { FibrinogenToken } from './FibrinogenToken';
import { getFactorVisual, isActivatedFactor } from '@/engine/game/factor-visuals';

interface FactorTokenNewProps {
  factorId: string;
  isActive?: boolean;
  isGlowing?: boolean;
  style?: React.CSSProperties;
}

/**
 * Unified factor token component
 * Automatically selects the correct shape based on factor type and activation state
 * TEXTBOOK FIRST: Shape represents biochemical role
 */
export function FactorTokenNew({
  factorId,
  isActive,
  isGlowing = false,
  style,
}: FactorTokenNewProps): React.ReactElement | null {
  const visual = getFactorVisual(factorId);
  if (!visual) {
    console.warn(`No visual definition for factor: ${factorId}`);
    return null;
  }

  const activated = isActive ?? isActivatedFactor(factorId);
  const shape = activated ? visual.activeShape : visual.inactiveShape;
  const color = activated ? visual.activeColor : visual.inactiveColor;
  const label = activated && !factorId.endsWith('a') ? `${factorId}a` : factorId;

  switch (shape) {
    case 'zymogen':
      return <ZymogenToken color={color} label={label} width={visual.width} height={visual.height} style={style} />;
    case 'enzyme':
      return <EnzymeToken color={color} label={label} width={visual.width} height={visual.height} isGlowing={isGlowing} style={style} />;
    case 'cofactor':
      return <CofactorToken color={color} label={label} width={visual.width} height={visual.height} style={style} />;
    case 'fibrinogen':
      return <FibrinogenToken width={visual.width} height={visual.height} style={style} />;
    default:
      return null;
  }
}
