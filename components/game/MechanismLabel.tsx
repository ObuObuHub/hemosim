// components/game/MechanismLabel.tsx
'use client';

// =============================================================================
// TYPES
// =============================================================================

export interface MechanismLabelData {
  id: string;
  text: string;
  x: number;
  y: number;
  opacity?: number;
}

interface MechanismLabelProps {
  id: string;
  text: string;
  x: number;
  y: number;
  opacity?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LABEL_FONT_SIZE = 10;
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 2;
const LABEL_BORDER_RADIUS = 4;
const LABEL_COLOR = '#F59E0B'; // Amber
const LABEL_BACKGROUND = 'rgba(0, 0, 0, 0.8)';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Floating text label that appears during factor conversions.
 * Positioned above the conversion site to explain the mechanism.
 */
export function MechanismLabel({
  text,
  x,
  y,
  opacity = 1,
}: MechanismLabelProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        fontSize: LABEL_FONT_SIZE,
        fontWeight: 600,
        color: LABEL_COLOR,
        backgroundColor: LABEL_BACKGROUND,
        padding: `${LABEL_PADDING_Y}px ${LABEL_PADDING_X}px`,
        borderRadius: LABEL_BORDER_RADIUS,
        whiteSpace: 'nowrap',
        opacity,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {text}
    </div>
  );
}
