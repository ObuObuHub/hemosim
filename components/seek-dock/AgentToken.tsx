/**
 * AgentToken - Renders a draggable/animated agent
 *
 * Visual representation of coagulation factors/enzymes.
 * Shows kind, active state, and animation state.
 */
'use client';

import { Agent, AgentKind, AgentState } from '@/types/seek-dock';

interface AgentTokenProps {
  agent: Agent;
  isDragging?: boolean;
  isSelected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  scale?: number;
}

/**
 * Get agent color based on kind and active state
 */
function getAgentColor(kind: AgentKind, isActive: boolean): string {
  // Zymogens vs Active forms
  if (isActive) {
    switch (kind) {
      case 'IXa':
        return '#22C55E'; // Green - active enzyme
      case 'Xa':
        return '#EF4444'; // Red - active enzyme (key cascade driver)
      case 'IIa':
        return '#F59E0B'; // Amber - thrombin
      case 'VIIa':
        return '#3B82F6'; // Blue
      case 'XIa':
        return '#8B5CF6'; // Purple
      case 'Va':
        return '#EC4899'; // Pink - cofactor
      case 'VIIIa':
        return '#06B6D4'; // Cyan - cofactor
      case 'XIIIa':
        return '#84CC16'; // Lime
      case 'Fibrin':
        return '#FCD34D'; // Yellow - final product
      default:
        return '#22C55E';
    }
  }

  // Zymogens (inactive)
  switch (kind) {
    case 'IX':
      return '#86EFAC'; // Light green
    case 'X':
      return '#FCA5A5'; // Light red
    case 'II':
      return '#FCD34D'; // Light amber
    case 'VII':
      return '#93C5FD'; // Light blue
    case 'V':
      return '#F9A8D4'; // Light pink
    case 'VIII':
      return '#67E8F9'; // Light cyan
    case 'XI':
      return '#C4B5FD'; // Light purple
    case 'XIII':
      return '#BEF264'; // Light lime
    case 'TF':
      return '#6366F1'; // Indigo - tissue factor
    case 'Fibrinogen':
      return '#FEF08A'; // Pale yellow
    case 'vWF':
      return '#A78BFA'; // Light purple
    default:
      return '#CBD5E1';
  }
}

/**
 * Get agent label text
 */
function getAgentLabel(kind: AgentKind): string {
  switch (kind) {
    case 'TF':
      return 'TF';
    case 'vWF':
      return 'vWF';
    case 'Fibrinogen':
      return 'Fbg';
    case 'Fibrin':
      return 'Fbn';
    default:
      return kind;
  }
}

/**
 * Get agent shape based on type
 * - Enzymes: pac-man shape (active site)
 * - Cofactors: socket shape
 * - Substrates: oval
 */
function getAgentShape(kind: AgentKind): 'enzyme' | 'cofactor' | 'substrate' {
  // Active enzymes
  if (['VIIa', 'IXa', 'Xa', 'IIa', 'XIa', 'XIIIa'].includes(kind)) {
    return 'enzyme';
  }

  // Cofactors
  if (['Va', 'VIIIa', 'TF'].includes(kind)) {
    return 'cofactor';
  }

  // Substrates/Zymogens
  return 'substrate';
}

/**
 * Get state-based opacity
 */
function getStateOpacity(state: AgentState): number {
  switch (state) {
    case 'SPAWNED':
      return 1;
    case 'SEEKING':
    case 'MIGRATING':
      return 0.9;
    case 'HOLDING':
      return 0.7;
    case 'DOCKED':
      return 1;
    case 'CONSUMED':
      return 0.3;
    default:
      return 1;
  }
}

export function AgentToken({
  agent,
  isDragging = false,
  isSelected = false,
  onMouseDown,
  onTouchStart,
  scale = 1,
}: AgentTokenProps): React.ReactElement {
  const { kind, isActiveForm, state, position } = agent;
  const color = getAgentColor(kind, isActiveForm);
  const shape = getAgentShape(kind);
  const opacity = getStateOpacity(state);
  const label = getAgentLabel(kind);

  const size = 28 * scale;
  const halfSize = size / 2;

  // Animation class based on state
  const isAnimating = state === 'SEEKING' || state === 'MIGRATING';

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      style={{
        opacity,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isAnimating ? 'none' : 'opacity 0.3s ease',
        filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))' : 'none',
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle
          r={halfSize + 6}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={3}
          style={{
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Agent shape */}
      {shape === 'enzyme' && (
        // Pac-man shape for enzymes
        <path
          d={`
            M ${-halfSize * 0.7} 0
            A ${halfSize} ${halfSize} 0 1 1 ${halfSize * 0.7} 0
            L 0 0
            Z
          `}
          fill={color}
          stroke={isActiveForm ? '#FFFFFF' : 'rgba(0, 0, 0, 0.2)'}
          strokeWidth={2}
          transform="rotate(-30)"
        />
      )}

      {shape === 'cofactor' && (
        // Socket/receptacle shape for cofactors
        <>
          <rect
            x={-halfSize}
            y={-halfSize * 0.7}
            width={size}
            height={size * 0.7}
            rx={4}
            fill={color}
            stroke={isActiveForm ? '#FFFFFF' : 'rgba(0, 0, 0, 0.2)'}
            strokeWidth={2}
          />
          {/* Binding site indent */}
          <rect
            x={-halfSize * 0.4}
            y={-halfSize * 0.7 - 4}
            width={halfSize * 0.8}
            height={8}
            fill={isActiveForm ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
          />
        </>
      )}

      {shape === 'substrate' && (
        // Oval for substrates/zymogens
        <ellipse
          rx={halfSize}
          ry={halfSize * 0.7}
          fill={color}
          stroke={isActiveForm ? '#FFFFFF' : 'rgba(0, 0, 0, 0.2)'}
          strokeWidth={2}
        />
      )}

      {/* Label */}
      <text
        textAnchor="middle"
        dy={4}
        fill={isActiveForm ? '#FFFFFF' : '#1E293B'}
        fontSize={10 * scale}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>

      {/* Migration indicator */}
      {state === 'MIGRATING' && (
        <g>
          <circle
            r={halfSize + 8}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="8 4"
            style={{
              animation: 'rotate 2s linear infinite',
            }}
          />
        </g>
      )}

      {/* Holding indicator */}
      {state === 'HOLDING' && (
        <g>
          <circle
            r={halfSize + 4}
            fill="none"
            stroke="rgba(148, 163, 184, 0.5)"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <text
            y={halfSize + 14}
            textAnchor="middle"
            fill="#94A3B8"
            fontSize={8 * scale}
            fontStyle="italic"
          >
            așteptare...
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Tray Token - simplified version for circulation tray
 */
export function TrayToken({
  kind,
  position,
  onMouseDown,
  onTouchStart,
  isAvailable = true,
}: {
  kind: AgentKind;
  position: { x: number; y: number };
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  isAvailable?: boolean;
}): React.ReactElement {
  const color = getAgentColor(kind, false);
  const label = getAgentLabel(kind);
  const size = 32;
  const halfSize = size / 2;

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      style={{
        opacity: isAvailable ? 1 : 0.3,
        cursor: isAvailable ? 'grab' : 'not-allowed',
      }}
      onMouseDown={isAvailable ? onMouseDown : undefined}
      onTouchStart={isAvailable ? onTouchStart : undefined}
    >
      {/* Token background */}
      <ellipse
        rx={halfSize}
        ry={halfSize * 0.7}
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={2}
      />

      {/* Label */}
      <text
        textAnchor="middle"
        dy={4}
        fill="#1E293B"
        fontSize={11}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>

      {/* Availability indicator */}
      {!isAvailable && (
        <line
          x1={-halfSize}
          y1={0}
          x2={halfSize}
          y2={0}
          stroke="rgba(239, 68, 68, 0.8)"
          strokeWidth={3}
          transform="rotate(-45)"
        />
      )}
    </g>
  );
}
