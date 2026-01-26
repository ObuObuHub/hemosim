// components/game/visuals/FibrinMesh.tsx
// Professional medical visualization of fibrin clot formation
'use client';

import { useMemo } from 'react';

interface FibrinMeshProps {
  width: number;
  height: number;
  fibrinogenCleaved: boolean;
  fibrinPolymerized: boolean;
  fxiiiActivated: boolean;
  fibrinCrosslinked: boolean;
}

/**
 * FibrinMesh - Clean, schematic visualization of fibrin formation
 * Designed for medical professionals - minimal, clear, informative
 */
export function FibrinMesh({
  width,
  height,
  fibrinogenCleaved,
  fibrinPolymerized,
  fxiiiActivated,
  fibrinCrosslinked,
}: FibrinMeshProps): React.ReactElement {
  // Simple progress calculation
  const stage = fibrinCrosslinked ? 4 : fxiiiActivated ? 3 : fibrinPolymerized ? 2 : fibrinogenCleaved ? 1 : 0;

  // Generate clean mesh lines
  const meshLines = useMemo(() => {
    const lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; type: 'h' | 'v' }> = [];
    const meshWidth = width * 0.5;
    const meshHeight = height * 0.4;
    const startX = (width - meshWidth) / 2;
    const startY = (height - meshHeight) / 2;
    const cols = 6;
    const rows = 4;
    const cellWidth = meshWidth / (cols - 1);
    const cellHeight = meshHeight / (rows - 1);

    // Horizontal lines
    for (let row = 0; row < rows; row++) {
      const y = startY + row * cellHeight;
      lines.push({
        id: `h-${row}`,
        x1: startX,
        y1: y,
        x2: startX + meshWidth,
        y2: y,
        type: 'h',
      });
    }

    // Vertical lines
    for (let col = 0; col < cols; col++) {
      const x = startX + col * cellWidth;
      lines.push({
        id: `v-${col}`,
        x1: x,
        y1: startY,
        x2: x,
        y2: startY + meshHeight,
        type: 'v',
      });
    }

    return lines;
  }, [width, height]);

  // Stage descriptions for medical professionals
  const stageInfo = [
    { label: 'În așteptare', detail: '' },
    { label: 'Fibrinogen → Fibrină', detail: 'Trombina clivează fibrinopeptidele A și B' },
    { label: 'Polimerizare', detail: 'Monomerii se autoasamblează în protofibrile' },
    { label: 'FXIII activat', detail: 'Transglutaminaza pregătită pentru cross-linking' },
    { label: 'Cheag stabil', detail: 'Legături covalente γ-γ formate' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Clean SVG mesh diagram */}
      <svg
        width={width * 0.6}
        height={height * 0.5}
        style={{ overflow: 'visible' }}
      >
        {/* Mesh lines - appear progressively */}
        {stage >= 2 && meshLines.map((line, index) => (
          <line
            key={line.id}
            x1={line.x1 - (width - width * 0.6) / 2}
            y1={line.y1 - (height - height * 0.5) / 2}
            x2={line.x2 - (width - width * 0.6) / 2}
            y2={line.y2 - (height - height * 0.5) / 2}
            stroke={fibrinCrosslinked ? '#059669' : '#F59E0B'}
            strokeWidth={fibrinCrosslinked ? 2 : 1.5}
            strokeLinecap="round"
            opacity={0.8}
            style={{
              transition: 'all 0.5s ease',
              transitionDelay: `${index * 30}ms`,
            }}
          />
        ))}

        {/* Cross-link indicators at intersections */}
        {stage >= 4 && meshLines.filter(l => l.type === 'h').slice(0, 4).map((hLine, hIndex) => (
          meshLines.filter(l => l.type === 'v').slice(0, 6).map((vLine, vIndex) => (
            <circle
              key={`cross-${hIndex}-${vIndex}`}
              cx={vLine.x1 - (width - width * 0.6) / 2}
              cy={hLine.y1 - (height - height * 0.5) / 2}
              r={3}
              fill="#059669"
              style={{
                transition: 'all 0.3s ease',
                transitionDelay: `${(hIndex * 6 + vIndex) * 20}ms`,
              }}
            />
          ))
        ))}
      </svg>

      {/* Stage indicator - clean, professional */}
      <div
        style={{
          marginTop: 16,
          padding: '8px 16px',
          background: fibrinCrosslinked ? '#ECFDF5' : '#FFFBEB',
          border: `1px solid ${fibrinCrosslinked ? '#A7F3D0' : '#FDE68A'}`,
          borderRadius: 6,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: fibrinCrosslinked ? '#059669' : '#D97706',
            marginBottom: 2,
          }}
        >
          {stageInfo[stage].label}
        </div>
        {stageInfo[stage].detail && (
          <div style={{ fontSize: 10, color: '#6B7280' }}>
            {stageInfo[stage].detail}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: stage >= s ? (fibrinCrosslinked ? '#059669' : '#F59E0B') : '#E5E7EB',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
