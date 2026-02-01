'use client';

import { useEffect, useCallback } from 'react';
import { COLORS } from '@/engine/game/game-config';
import { InhibitorToken } from '../tokens/InhibitorToken';

// =============================================================================
// TYPES
// =============================================================================

interface AnticoagulantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InhibitorData {
  name: string;
  fullName: string;
  color: string;
  targets: string[];
  mechanism: string;
}

// =============================================================================
// DATA
// =============================================================================

const INHIBITORS: InhibitorData[] = [
  {
    name: 'TFPI',
    fullName: 'Tissue Factor Pathway Inhibitor',
    color: '#8B5CF6', // Violet
    targets: ['TF-FVIIa', 'FXa'],
    mechanism: 'Blochează inițierea coagulării',
  },
  {
    name: 'AT',
    fullName: 'Antitrombina + Heparină',
    color: '#06B6D4', // Cyan
    targets: ['FIIa (Trombină)', 'FXa', 'FIXa', 'FXIa'],
    mechanism: 'Inhibă enzimele serine-proteaze',
  },
  {
    name: 'aPC',
    fullName: 'Proteina C Activată + Proteina S',
    color: '#EC4899', // Pink
    targets: ['FVa', 'FVIIIa'],
    mechanism: 'Inactivează cofactorii prin proteoliză',
  },
  {
    name: 'Plasmin',
    fullName: 'Plasmina (Fibrinoliză)',
    color: '#F97316', // Orange
    targets: ['Fibrină → FDP'],
    mechanism: 'Dizolvă cheagul format',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Educational overlay showing the anticoagulant system.
 * Displays inhibitors and their targets in a clear, visual format.
 */
export function AnticoagulantOverlay({
  isOpen,
  onClose,
}: AnticoagulantOverlayProps): React.ReactElement | null {
  // Handle keyboard dismissal
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="anticoagulant-overlay"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        cursor: 'pointer',
      }}
    >
      <div
        className="anticoagulant-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 24,
          maxWidth: 560,
          width: '90%',
          border: `2px solid ${COLORS.panelBorder}`,
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)',
          cursor: 'default',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#F1F5F9',
              marginBottom: 4,
              letterSpacing: '0.5px',
            }}
          >
            Sistemul Anticoagulant
          </h2>
          <p
            style={{
              fontSize: 13,
              color: '#94A3B8',
            }}
          >
            Mecanisme naturale de limitare a coagulării
          </p>
        </div>

        {/* Inhibitors list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {INHIBITORS.map((inhibitor) => (
            <InhibitorCard key={inhibitor.name} inhibitor={inhibitor} />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 600,
            backgroundColor: '#334155',
            color: '#FFFFFF',
            border: `1px solid ${COLORS.panelBorder}`,
            borderRadius: 8,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Închide (ESC)
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// INHIBITOR CARD COMPONENT
// =============================================================================

interface InhibitorCardProps {
  inhibitor: InhibitorData;
}

function InhibitorCard({ inhibitor }: InhibitorCardProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 8,
        border: `1px solid ${inhibitor.color}40`,
      }}
    >
      {/* Token */}
      <div style={{ flexShrink: 0 }}>
        <InhibitorToken
          color={inhibitor.color}
          label={inhibitor.name}
          width={50}
          height={45}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: inhibitor.color,
            marginBottom: 2,
          }}
        >
          {inhibitor.fullName}
        </div>

        {/* Mechanism */}
        <div
          style={{
            fontSize: 11,
            color: '#94A3B8',
            marginBottom: 6,
          }}
        >
          {inhibitor.mechanism}
        </div>

        {/* Targets */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {inhibitor.targets.map((target) => (
            <span
              key={target}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span style={{ color: '#EF4444' }}>⊣</span>
              {target}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
