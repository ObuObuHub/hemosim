// components/game/MembraneBackground.tsx
'use client';

import { useEffect, useState } from 'react';

type SurfaceType = 'tf-cell' | 'platelet' | 'activated-platelet' | 'clot-zone';

interface MembraneBackgroundProps {
  surfaceType: SurfaceType;
  /** Trigger scramblase animation when transitioning to activated state */
  isActivating?: boolean;
  /** Panel dimensions for proper sizing */
  width: number;
  height: number;
}

/**
 * Renders a biological membrane texture background for each surface type.
 * Teaches that coagulation happens on cell surfaces, not randomly in blood.
 */
export function MembraneBackground({
  surfaceType,
  isActivating = false,
  width,
  height,
}: MembraneBackgroundProps): React.ReactElement {
  const [showActivated, setShowActivated] = useState(false);

  // Handle scramblase animation when activating
  useEffect(() => {
    if (isActivating && !showActivated) {
      // Delay to show the flip animation
      const timer = setTimeout(() => {
        setShowActivated(true);
      }, 1500); // Duration of scramblase animation
      return () => clearTimeout(timer);
    }
  }, [isActivating, showActivated]);

  return (
    <div
      className={getAnimationClass(surfaceType, isActivating)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        overflow: 'hidden',
        borderRadius: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {surfaceType === 'tf-cell' && <TFCellMembrane width={width} height={height} />}
      {surfaceType === 'platelet' && <RestingPlateletMembrane width={width} height={height} />}
      {surfaceType === 'activated-platelet' && (
        <ActivatedPlateletMembrane
          width={width}
          height={height}
          isActivating={isActivating}
          showActivated={showActivated || isActivating}
        />
      )}
      {surfaceType === 'clot-zone' && <ClotZoneMembrane width={width} height={height} />}
    </div>
  );
}

function getAnimationClass(surfaceType: SurfaceType, isActivating: boolean): string {
  switch (surfaceType) {
    case 'tf-cell':
      return 'membrane-tf-cell';
    case 'platelet':
      return 'membrane-platelet';
    case 'activated-platelet':
      return isActivating ? 'membrane-scramblase' : 'membrane-activated-platelet';
    case 'clot-zone':
      return 'membrane-clot-zone';
    default:
      return '';
  }
}

// =============================================================================
// TF-CELL (Sub-endothelium): Jagged/ruptured endothelium
// =============================================================================

interface MembraneDimensionProps {
  width: number;
  height: number;
}

function TFCellMembrane({ width, height }: MembraneDimensionProps): React.ReactElement {
  // Generate jagged tear lines to represent damaged vessel wall
  const jaggedPath = generateJaggedPath(width, height);

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        {/* Dark red-brown gradient for damaged tissue */}
        <linearGradient id="tf-cell-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7F1D1D" />
          <stop offset="50%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>

        {/* Texture pattern for rough tissue */}
        <pattern id="tf-texture" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="1.5" fill="rgba(0,0,0,0.2)" />
          <circle cx="2" cy="5" r="1" fill="rgba(0,0,0,0.15)" />
          <circle cx="15" cy="18" r="1" fill="rgba(0,0,0,0.15)" />
        </pattern>

        {/* Glow filter for pulsing effect */}
        <filter id="tf-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base gradient fill */}
      <rect width={width} height={height} fill="url(#tf-cell-gradient)" />

      {/* Texture overlay */}
      <rect width={width} height={height} fill="url(#tf-texture)" opacity={0.5} />

      {/* Jagged tear lines representing damaged endothelium */}
      <path
        d={jaggedPath}
        fill="none"
        stroke="#450A0A"
        strokeWidth={3}
        opacity={0.6}
        filter="url(#tf-glow)"
      />

      {/* Additional tear marks */}
      <path
        d={`M ${width * 0.2} ${height * 0.3} L ${width * 0.35} ${height * 0.35} L ${width * 0.3} ${height * 0.4}`}
        fill="none"
        stroke="#450A0A"
        strokeWidth={2}
        opacity={0.4}
      />
      <path
        d={`M ${width * 0.6} ${height * 0.7} L ${width * 0.75} ${height * 0.65} L ${width * 0.7} ${height * 0.8}`}
        fill="none"
        stroke="#450A0A"
        strokeWidth={2}
        opacity={0.4}
      />

      {/* TF anchor point highlight */}
      <circle
        cx={width * 0.5}
        cy={height * 0.25}
        r={15}
        fill="rgba(245,158,11,0.3)"
        filter="url(#tf-glow)"
        className="tf-anchor-pulse"
      />
    </svg>
  );
}

function generateJaggedPath(width: number, height: number): string {
  const points: string[] = [];
  const segments = 8;

  for (let i = 0; i <= segments; i++) {
    const x = (width / segments) * i;
    const y = height * 0.5 + (Math.sin(i * 1.5) * 20) + (i % 2 === 0 ? 10 : -10);
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return points.join(' ');
}

// =============================================================================
// RESTING PLATELET: Smooth curved bilayer
// =============================================================================

function RestingPlateletMembrane({ width, height }: MembraneDimensionProps): React.ReactElement {
  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      className="membrane-wobble"
    >
      <defs>
        {/* Pale pink gradient for resting platelet */}
        <linearGradient id="platelet-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="50%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#FCE7F3" />
        </linearGradient>

        {/* Bilayer pattern - subtle lipid texture */}
        <pattern id="bilayer-pattern" patternUnits="userSpaceOnUse" width="30" height="20">
          {/* Phospholipid head groups (top layer) */}
          <circle cx="5" cy="5" r="3" fill="rgba(244,114,182,0.3)" />
          <circle cx="15" cy="5" r="3" fill="rgba(244,114,182,0.3)" />
          <circle cx="25" cy="5" r="3" fill="rgba(244,114,182,0.3)" />
          {/* Phospholipid head groups (bottom layer) */}
          <circle cx="10" cy="15" r="3" fill="rgba(244,114,182,0.3)" />
          <circle cx="20" cy="15" r="3" fill="rgba(244,114,182,0.3)" />
          {/* Lipid tails (between layers) */}
          <line x1="5" y1="8" x2="5" y2="12" stroke="rgba(244,114,182,0.2)" strokeWidth="1" />
          <line x1="15" y1="8" x2="15" y2="12" stroke="rgba(244,114,182,0.2)" strokeWidth="1" />
          <line x1="25" y1="8" x2="25" y2="12" stroke="rgba(244,114,182,0.2)" strokeWidth="1" />
        </pattern>

        {/* Smooth curve filter */}
        <filter id="soft-blur">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>

      {/* Base gradient fill */}
      <rect width={width} height={height} fill="url(#platelet-gradient)" />

      {/* Bilayer texture */}
      <rect width={width} height={height} fill="url(#bilayer-pattern)" opacity={0.6} />

      {/* Smooth curved edges to suggest rounded membrane */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width * 0.45}
        ry={height * 0.4}
        fill="none"
        stroke="rgba(236,72,153,0.2)"
        strokeWidth={8}
        filter="url(#soft-blur)"
      />

      {/* Inner membrane highlight */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width * 0.35}
        ry={height * 0.3}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={4}
      />
    </svg>
  );
}

// =============================================================================
// ACTIVATED PLATELET: Spiky, charged (PS exposed)
// =============================================================================

interface ActivatedPlateletProps extends MembraneDimensionProps {
  isActivating: boolean;
  showActivated: boolean;
}

function ActivatedPlateletMembrane({
  width,
  height,
  isActivating,
  showActivated
}: ActivatedPlateletProps): React.ReactElement {
  // If not activated yet, show resting state
  if (!showActivated && !isActivating) {
    return <RestingPlateletMembrane width={width} height={height} />;
  }

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      className={isActivating ? 'membrane-scramblase-flip' : ''}
    >
      <defs>
        {/* Purple/electric gradient for activated state */}
        <linearGradient id="activated-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="30%" stopColor="#7C3AED" />
          <stop offset="70%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>

        {/* Electric glow effect */}
        <filter id="electric-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Spiky pattern for PS exposure */}
        <pattern id="ps-spikes" patternUnits="userSpaceOnUse" width="40" height="40">
          {/* Upward spikes */}
          <polygon points="5,20 10,5 15,20" fill="rgba(34,197,94,0.4)" />
          <polygon points="25,20 30,8 35,20" fill="rgba(34,197,94,0.4)" />
          {/* Downward spikes */}
          <polygon points="15,20 20,35 25,20" fill="rgba(34,197,94,0.3)" />
          {/* Charge symbols */}
          <text x="8" y="32" fontSize="8" fill="rgba(34,197,94,0.5)" fontWeight="bold">-</text>
          <text x="28" y="32" fontSize="8" fill="rgba(34,197,94,0.5)" fontWeight="bold">-</text>
        </pattern>
      </defs>

      {/* Base purple gradient */}
      <rect width={width} height={height} fill="url(#activated-gradient)" />

      {/* PS exposure spiky pattern */}
      <rect width={width} height={height} fill="url(#ps-spikes)" opacity={0.7} />

      {/* Spiky protrusions around edges */}
      {generateSpikyEdges(width, height).map((spike, i) => (
        <polygon
          key={i}
          points={spike}
          fill="#22C55E"
          opacity={0.6}
          filter="url(#electric-glow)"
        />
      ))}

      {/* Electric charge arcs */}
      <path
        d={`M ${width * 0.2} ${height * 0.3} Q ${width * 0.3} ${height * 0.2}, ${width * 0.4} ${height * 0.35}`}
        fill="none"
        stroke="#22C55E"
        strokeWidth={2}
        opacity={0.5}
        className="charge-arc"
      />
      <path
        d={`M ${width * 0.6} ${height * 0.7} Q ${width * 0.7} ${height * 0.6}, ${width * 0.8} ${height * 0.75}`}
        fill="none"
        stroke="#22C55E"
        strokeWidth={2}
        opacity={0.5}
        className="charge-arc"
      />

      {/* PS label indicator */}
      <rect
        x={width * 0.1}
        y={height * 0.85}
        width={60}
        height={20}
        rx={4}
        fill="rgba(34,197,94,0.2)"
        stroke="#22C55E"
        strokeWidth={1}
      />
      <text
        x={width * 0.1 + 30}
        y={height * 0.85 + 14}
        fontSize={10}
        fill="#22C55E"
        textAnchor="middle"
        fontWeight={600}
      >
        PS Exposed
      </text>
    </svg>
  );
}

function generateSpikyEdges(width: number, height: number): string[] {
  const spikes: string[] = [];
  const spikeCount = 12;

  // Top edge spikes
  for (let i = 0; i < spikeCount / 3; i++) {
    const x = (width / (spikeCount / 3 + 1)) * (i + 1);
    const baseY = 60;
    const tipY = 40;
    spikes.push(`${x - 8},${baseY} ${x},${tipY} ${x + 8},${baseY}`);
  }

  // Left edge spikes
  for (let i = 0; i < spikeCount / 3; i++) {
    const y = (height / (spikeCount / 3 + 1)) * (i + 1);
    const baseX = 8;
    const tipX = -5;
    spikes.push(`${baseX},${y - 8} ${tipX},${y} ${baseX},${y + 8}`);
  }

  // Right edge spikes
  for (let i = 0; i < spikeCount / 3; i++) {
    const y = (height / (spikeCount / 3 + 1)) * (i + 1);
    const baseX = width - 8;
    const tipX = width + 5;
    spikes.push(`${baseX},${y - 8} ${tipX},${y} ${baseX},${y + 8}`);
  }

  return spikes;
}

// =============================================================================
// CLOT ZONE: Fibrin mesh background
// =============================================================================

function ClotZoneMembrane({ width, height }: MembraneDimensionProps): React.ReactElement {
  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        {/* Dark background with subtle texture */}
        <linearGradient id="clot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1F2937" />
          <stop offset="50%" stopColor="#111827" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>

        {/* Orange glow for fibrin strands */}
        <filter id="fibrin-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#F97316" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Background mesh pattern (placeholder until fibrin placed) */}
        <pattern id="mesh-placeholder" patternUnits="userSpaceOnUse" width="50" height="50">
          <line x1="0" y1="25" x2="50" y2="25" stroke="rgba(249,115,22,0.1)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="25" y1="0" x2="25" y2="50" stroke="rgba(249,115,22,0.1)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="0" x2="50" y2="50" stroke="rgba(249,115,22,0.08)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50" y1="0" x2="0" y2="50" stroke="rgba(249,115,22,0.08)" strokeWidth="1" strokeDasharray="4 4" />
        </pattern>
      </defs>

      {/* Base dark gradient */}
      <rect width={width} height={height} fill="url(#clot-gradient)" />

      {/* Placeholder mesh pattern */}
      <rect width={width} height={height} fill="url(#mesh-placeholder)" />

      {/* Subtle vignette effect */}
      <rect
        width={width}
        height={height}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={40}
        style={{ transform: `translate(0, 0)` }}
      />

      {/* Corner glow hints */}
      <circle
        cx={width * 0.15}
        cy={height * 0.2}
        r={30}
        fill="rgba(249,115,22,0.1)"
        filter="url(#fibrin-glow)"
      />
      <circle
        cx={width * 0.85}
        cy={height * 0.2}
        r={30}
        fill="rgba(249,115,22,0.1)"
        filter="url(#fibrin-glow)"
      />
      <circle
        cx={width * 0.5}
        cy={height * 0.45}
        r={40}
        fill="rgba(249,115,22,0.1)"
        filter="url(#fibrin-glow)"
      />
    </svg>
  );
}
