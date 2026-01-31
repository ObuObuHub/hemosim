// components/game/Toast.tsx
'use client';

// =============================================================================
// TYPES
// =============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'phase';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  opacity?: number;
}

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  opacity?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#22C55E', // Green
  error: '#EF4444', // Red
  info: '#3B82F6', // Blue
  phase: '#8B5CF6', // Purple
};

const TOAST_FONT_SIZE_DEFAULT = 16;
const TOAST_FONT_SIZE_PHASE = 24;
const TOAST_PADDING_DEFAULT = '8px 16px';
const TOAST_PADDING_PHASE = '12px 24px';
const TOAST_BORDER_RADIUS = 8;
const TOAST_BACKGROUND = 'rgba(0, 0, 0, 0.9)';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Toast notification for phase transitions and game messages.
 * Centered on screen with type-based styling.
 * Phase toasts are larger and more prominent.
 */
export function Toast({
  message,
  type,
  opacity = 1,
}: ToastProps): React.ReactElement {
  const color = TOAST_COLORS[type];
  const isPhase = type === 'phase';

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: isPhase ? TOAST_FONT_SIZE_PHASE : TOAST_FONT_SIZE_DEFAULT,
        fontWeight: 700,
        fontFamily: 'system-ui, sans-serif',
        color,
        backgroundColor: TOAST_BACKGROUND,
        padding: isPhase ? TOAST_PADDING_PHASE : TOAST_PADDING_DEFAULT,
        borderRadius: TOAST_BORDER_RADIUS,
        textShadow: `0 0 20px ${color}50`,
        opacity,
        pointerEvents: 'none',
        zIndex: 100,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
}
