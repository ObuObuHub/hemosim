// components/game/educational/EducationalTooltip.tsx
'use client';

import { useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import { getFactorInfo, getComplexInfo, type FactorInfoData, type ComplexInfoData } from './FactorInfo';

interface TooltipPosition {
  x: number;
  y: number;
}

interface EducationalTooltipProps {
  children: ReactNode;
  factorId?: string;
  complexId?: string;
  customContent?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  disabled?: boolean;
}

/**
 * EducationalTooltip - Displays medical information on hover
 *
 * Usage:
 * <EducationalTooltip factorId="FXa">
 *   <FactorToken ... />
 * </EducationalTooltip>
 */
export function EducationalTooltip({
  children,
  factorId,
  complexId,
  customContent,
  position = 'auto',
  disabled = false,
}: EducationalTooltipProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ x: 0, y: 0 });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent): void => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setIsVisible(true);
    },
    [disabled]
  );

  const handleMouseLeave = useCallback((): void => {
    setIsVisible(false);
  }, []);

  // Get content based on factorId or complexId
  const factorInfo = factorId ? getFactorInfo(factorId) : undefined;
  const complexInfo = complexId ? getComplexInfo(complexId) : undefined;

  const hasContent = factorInfo || complexInfo || customContent;

  if (!hasContent || disabled) {
    return <>{children}</>;
  }

  return (
    <div
      style={{ display: 'inline-block', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <TooltipPortal x={tooltipPos.x} y={tooltipPos.y} position={position}>
          {customContent || (factorInfo ? (
            <FactorTooltipContent info={factorInfo} />
          ) : complexInfo ? (
            <ComplexTooltipContent info={complexInfo} />
          ) : null)}
        </TooltipPortal>
      )}
    </div>
  );
}

// Tooltip portal component
interface TooltipPortalProps {
  children: ReactNode;
  x: number;
  y: number;
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

function TooltipPortal({ children, x, y, position }: TooltipPortalProps): React.ReactElement {
  // Calculate position based on viewport
  const style: CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none',
    animation: 'tooltipFadeIn 0.15s ease-out',
  };

  // Position above by default, adjust if near edge
  if (position === 'auto' || position === 'top') {
    style.left = x;
    style.top = y - 8;
    style.transform = 'translate(-50%, -100%)';
  } else if (position === 'bottom') {
    style.left = x;
    style.top = y + 40;
    style.transform = 'translateX(-50%)';
  }

  return (
    <>
      <div style={style}>{children}</div>
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translate(-50%, -100%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
      `}</style>
    </>
  );
}

// Factor tooltip content
interface FactorTooltipContentProps {
  info: FactorInfoData;
}

function FactorTooltipContent({ info }: FactorTooltipContentProps): React.ReactElement {
  const typeColors: Record<string, string> = {
    zymogen: '#94A3B8',
    enzyme: '#EF4444',
    cofactor: '#3B82F6',
    substrate: '#F59E0B',
    receptor: '#8B5CF6',
  };

  const typeLabels: Record<string, string> = {
    zymogen: 'Zimogen',
    enzyme: 'Enzimă',
    cofactor: 'Cofactor',
    substrate: 'Substrat',
    receptor: 'Receptor',
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.8)',
        borderRadius: 12,
        padding: '12px 16px',
        maxWidth: 320,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            background: typeColors[info.type] || '#64748B',
            color: '#FFF',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {typeLabels[info.type] || info.type}
        </span>
        <span style={{ color: '#F1F5F9', fontSize: 14, fontWeight: 700 }}>
          {info.name}
        </span>
      </div>

      {/* Full name */}
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 8, fontStyle: 'italic' }}>
        {info.fullName}
      </div>

      {/* Role */}
      <div style={{ color: '#CBD5E1', fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>
        {info.role}
      </div>

      {/* Activation info */}
      {info.activatedBy.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: '#64748B', fontSize: 9, fontWeight: 600 }}>ACTIVAT DE: </span>
          <span style={{ color: '#4ADE80', fontSize: 10 }}>{info.activatedBy.join(', ')}</span>
        </div>
      )}

      {info.activates.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: '#64748B', fontSize: 9, fontWeight: 600 }}>ACTIVEAZĂ: </span>
          <span style={{ color: '#F87171', fontSize: 10 }}>{info.activates.join(', ')}</span>
        </div>
      )}

      {/* Amplification */}
      {info.amplification && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: 6,
            border: '1px solid rgba(59, 130, 246, 0.4)',
          }}
        >
          <span style={{ color: '#60A5FA', fontSize: 11, fontWeight: 600 }}>
            {info.amplification}
          </span>
        </div>
      )}

      {/* Clinical note */}
      {info.clinicalNote && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            background: 'rgba(251, 191, 36, 0.15)',
            borderRadius: 6,
            borderLeft: '3px solid #F59E0B',
          }}
        >
          <span style={{ color: '#FCD34D', fontSize: 10 }}>{info.clinicalNote}</span>
        </div>
      )}

      {/* Location */}
      <div style={{ marginTop: 8, color: '#64748B', fontSize: 9 }}>
        Locație: {info.location}
      </div>
    </div>
  );
}

// Complex tooltip content
interface ComplexTooltipContentProps {
  info: ComplexInfoData;
}

function ComplexTooltipContent({ info }: ComplexTooltipContentProps): React.ReactElement {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.8)',
        borderRadius: 12,
        padding: '12px 16px',
        maxWidth: 320,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            background: '#8B5CF6',
            color: '#FFF',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Complex Enzimatic
        </span>
        <span style={{ color: '#F1F5F9', fontSize: 14, fontWeight: 700 }}>
          {info.name}
        </span>
      </div>

      {/* Description */}
      <div style={{ color: '#CBD5E1', fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>
        {info.description}
      </div>

      {/* Composition */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 10,
          padding: '8px',
          background: 'rgba(71, 85, 105, 0.3)',
          borderRadius: 8,
        }}
      >
        <div>
          <div style={{ color: '#64748B', fontSize: 8, fontWeight: 600, marginBottom: 2 }}>ENZIMĂ</div>
          <div style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>{info.enzyme}</div>
        </div>
        <div>
          <div style={{ color: '#64748B', fontSize: 8, fontWeight: 600, marginBottom: 2 }}>COFACTOR</div>
          <div style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>{info.cofactor}</div>
        </div>
      </div>

      {/* Reaction */}
      <div
        style={{
          padding: '8px 12px',
          background: 'rgba(34, 197, 94, 0.15)',
          borderRadius: 8,
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ color: '#94A3B8', fontSize: 11 }}>{info.substrate}</span>
        <span style={{ color: '#4ADE80', fontSize: 12, margin: '0 8px' }}>→</span>
        <span style={{ color: '#4ADE80', fontSize: 11, fontWeight: 600 }}>{info.product}</span>
      </div>

      {/* Amplification */}
      <div
        style={{
          padding: '8px 12px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
          borderRadius: 8,
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.4)',
        }}
      >
        <div style={{ color: '#64748B', fontSize: 8, fontWeight: 600, marginBottom: 2 }}>
          AMPLIFICARE CATALITICĂ
        </div>
        <div style={{ color: '#F87171', fontSize: 16, fontWeight: 800 }}>{info.amplification}</div>
        <div style={{ color: '#94A3B8', fontSize: 9 }}>
          față de enzima singură
        </div>
      </div>

      {/* Medical note */}
      {info.medicalNote && (
        <div
          style={{
            marginTop: 10,
            padding: '6px 10px',
            background: 'rgba(251, 191, 36, 0.15)',
            borderRadius: 6,
            borderLeft: '3px solid #F59E0B',
          }}
        >
          <span style={{ color: '#FCD34D', fontSize: 10 }}>{info.medicalNote}</span>
        </div>
      )}

      {/* Location */}
      <div style={{ marginTop: 8, color: '#64748B', fontSize: 9 }}>
        Locație: {info.location}
      </div>
    </div>
  );
}

// Export individual tooltip content components for custom use
export { FactorTooltipContent, ComplexTooltipContent };
