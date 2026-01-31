// components/game/ThreePanelGame.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { InitiationPanel } from './panels/InitiationPanel';
import { AmplificationPanel } from './panels/AmplificationPanel';
import { PropagationPanel } from './panels/PropagationPanel';
import { FlowArrowOverlay } from './overlays/FlowArrow';
import { useThreePanelState } from '@/hooks/useThreePanelState';

interface ThreePanelGameProps {
  className?: string;
}

/**
 * ThreePanelGame - 3-Panel Textbook Layout
 *
 * Displays all three phases of coagulation simultaneously:
 * - Initiation (top, spans full width)
 * - Propagation (bottom-left)
 * - Amplification (bottom-right)
 *
 * Based on the Hoffman & Monroe cell-based model of coagulation.
 */
export function ThreePanelGame({ className = '' }: ThreePanelGameProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const {
    state,
    dockTFVIIa,
    dockFIX,
    dockFX,
    dockFV,
    dockFII,
    produceThrombin,
    splitVWF,
    activateFV,
    activateFVIII,
    activateFXI,
    activatePlatelet,
    dockFVa,
    dockFVIIIa,
    fixaAtAmplification,
    parThrombinBind,
    parCleave,
    parActivate,
    fixaArrives,
    formTenase,
    formProthrombinase,
    thrombinBurst,
    addFlow,
    reset,
  } = useThreePanelState();

  // Measure container dimensions
  useEffect(() => {
    const measure = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Calculate panel dimensions based on container size
  const isMobile = dimensions.width < 600;
  const gap = 4;

  const panelDimensions = isMobile
    ? {
        // Mobile: vertical stack
        initiation: {
          width: dimensions.width - 16,
          height: (dimensions.height - 32 - gap * 2) / 3,
          x: 8,
          y: 8,
        },
        amplification: {
          width: dimensions.width - 16,
          height: (dimensions.height - 32 - gap * 2) / 3,
          x: 8,
          y: 8 + (dimensions.height - 32 - gap * 2) / 3 + gap,
        },
        propagation: {
          width: dimensions.width - 16,
          height: (dimensions.height - 32 - gap * 2) / 3,
          x: 8,
          y: 8 + ((dimensions.height - 32 - gap * 2) / 3 + gap) * 2,
        },
      }
    : {
        // Desktop: initiation on top, propagation/amplification side by side below
        initiation: {
          width: dimensions.width - 16,
          height: (dimensions.height - 24 - gap) * 0.4,
          x: 8,
          y: 8,
        },
        propagation: {
          width: (dimensions.width - 16 - gap) / 2,
          height: (dimensions.height - 24 - gap) * 0.6,
          x: 8,
          y: 8 + (dimensions.height - 24 - gap) * 0.4 + gap,
        },
        amplification: {
          width: (dimensions.width - 16 - gap) / 2,
          height: (dimensions.height - 24 - gap) * 0.6,
          x: 8 + (dimensions.width - 16 - gap) / 2 + gap,
          y: 8 + (dimensions.height - 24 - gap) * 0.4 + gap,
        },
      };

  // Handle factor docking in initiation phase
  const handleDockFactor = useCallback(
    (factorId: string): void => {
      switch (factorId) {
        case 'TF+FVII':
          dockTFVIIa();
          break;
        case 'FIX':
          dockFIX();
          // FIXa goes to Amplification first (docks at border), then user clicks to send to Propagation
          setTimeout(() => {
            fixaAtAmplification();
            // Add flow arrow from Initiation to Amplification
            addFlow({
              id: 'fixa-to-amp-flow',
              from: 'initiation',
              to: 'amplification',
              factor: 'FIXa',
              progress: 1,
              isActive: true,
              // FIXa particle: blue, travels to amplification first
              showTravelingParticle: true,
              particleSize: 8,
              travelDuration: '1.5s',
              particleKey: Date.now(),
            });
          }, 1000);
          break;
        case 'FX':
          dockFX();
          break;
        case 'FV':
          dockFV();
          break;
        case 'FII':
          dockFII();
          // Thrombin is produced and flows to amplification (per Hoffman-Monroe model)
          // Small amounts of thrombin diffuse from TF-bearing cell to platelet
          setTimeout(() => {
            produceThrombin();
            // Add flow arrow
            addFlow({
              id: 'thrombin-flow',
              from: 'initiation',
              to: 'amplification',
              factor: 'FIIa',
              progress: 1,
              isActive: true,
              // Thrombin particle: red, travels to activate platelet
              showTravelingParticle: true,
              particleSize: 8, // Larger for visibility
              travelDuration: '1.5s',
              particleKey: Date.now(),
            });
          }, 800);
          break;
      }
    },
    [dockTFVIIa, dockFIX, dockFX, dockFV, dockFII, produceThrombin, fixaAtAmplification, addFlow]
  );

  // Handle FIXa click in Amplification to send it to Propagation
  const handleFIXaToPropagate = useCallback((): void => {
    fixaArrives();
    // Add flow arrow from Amplification to Propagation
    addFlow({
      id: 'fixa-to-prop-flow',
      from: 'amplification',
      to: 'propagation',
      factor: 'FIXa',
      progress: 1,
      isActive: true,
      showTravelingParticle: true,
      particleSize: 8,
      travelDuration: '1.2s',
      particleKey: Date.now(),
    });
  }, [fixaArrives, addFlow]);

  // Handle factor activation in amplification phase
  const handleActivateFactor = useCallback(
    (factorId: string): void => {
      switch (factorId) {
        case 'vWF-VIII':
          splitVWF();
          activateFVIII();
          break;
        case 'FV':
          activateFV();
          break;
        case 'FXI':
          activateFXI();
          // FXI produces more FIXa for propagation (amplification feedback loop)
          setTimeout(() => {
            addFlow({
              id: 'fxi-fixa-flow',
              from: 'amplification',
              to: 'propagation',
              factor: 'FIXa',
              progress: 1,
              isActive: true,
              // Additional FIXa from amplification: blue particle
              showTravelingParticle: true,
              particleSize: 8, // Larger for visibility
              travelDuration: '1.2s',
              particleKey: Date.now(),
            });
          }, 500);
          break;
      }

      // Check if platelet should be activated
      setTimeout(() => {
        if (state.amplification.vwfSplit && state.amplification.fvActivated && state.amplification.fxiActivated) {
          activatePlatelet();
        }
      }, 500);
    },
    [splitVWF, activateFVIII, activateFV, activateFXI, activatePlatelet, addFlow, state.amplification]
  );

  // Handle cofactor docking to membrane in amplification phase
  const handleDockCofactor = useCallback(
    (cofactorId: 'FVa' | 'FVIIIa'): void => {
      switch (cofactorId) {
        case 'FVa':
          dockFVa();
          break;
        case 'FVIIIa':
          dockFVIIIa();
          break;
      }
    },
    [dockFVa, dockFVIIIa]
  );

  // Handle complex formation in propagation phase
  const handleFormComplex = useCallback(
    (complexType: 'tenase' | 'prothrombinase' | 'burst'): void => {
      switch (complexType) {
        case 'tenase':
          formTenase();
          break;
        case 'prothrombinase':
          formProthrombinase();
          break;
        case 'burst':
          thrombinBurst();
          break;
      }
    },
    [formTenase, formProthrombinase, thrombinBurst]
  );

  // Calculate flow arrow positions
  const flowArrows = state.activeFlows.map((flow) => {
    let fromX = 0, fromY = 0, toX = 0, toY = 0;

    // Calculate positions based on panel layout
    if (flow.from === 'initiation') {
      fromX = panelDimensions.initiation.x + panelDimensions.initiation.width / 2;
      fromY = panelDimensions.initiation.y + panelDimensions.initiation.height;
    }

    if (flow.to === 'amplification') {
      toX = panelDimensions.amplification.x + panelDimensions.amplification.width / 2;
      toY = panelDimensions.amplification.y;
    } else if (flow.to === 'propagation') {
      toX = panelDimensions.propagation.x + panelDimensions.propagation.width / 2;
      toY = panelDimensions.propagation.y;
    }

    if (flow.from === 'amplification') {
      fromX = panelDimensions.amplification.x + panelDimensions.amplification.width / 2;
      fromY = panelDimensions.amplification.y + panelDimensions.amplification.height / 2;
      toX = panelDimensions.propagation.x + panelDimensions.propagation.width / 2;
      toY = panelDimensions.propagation.y + panelDimensions.propagation.height / 2;
    }

    return {
      id: flow.id,
      fromX,
      fromY,
      toX,
      toY,
      color: flow.factor === 'FIIa' ? '#EF4444' : '#3B82F6',
      label: flow.factor,
      progress: flow.progress,
      isActive: flow.isActive,
      // Particle animation props
      showTravelingParticle: flow.showTravelingParticle ?? true,
      particleSize: flow.particleSize ?? 5,
      travelDuration: flow.travelDuration ?? '1.2s',
      particleKey: flow.particleKey,
    };
  });

  // Check if amplification can receive thrombin
  const thrombinAvailable = state.initiation.thrombinProduced;
  const amplificationComplete =
    state.amplification.vwfSplit &&
    state.amplification.fvActivated &&
    state.amplification.fxiActivated &&
    state.amplification.plateletActivated;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0F172A',
        overflow: 'hidden',
      }}
    >
      {/* Header with reset button */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0 8px',
          zIndex: 200,
        }}
      >
        <button
          type="button"
          onClick={reset}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '4px 8px',
            background: 'rgba(100, 116, 139, 0.3)',
            border: '1px solid #475569',
            borderRadius: 4,
            color: '#94A3B8',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            zIndex: 200,
          }}
        >
          Reset
        </button>
      </div>

      {/* Initiation Panel */}
      {dimensions.width > 0 && (
        <div
          style={{
            position: 'absolute',
            left: panelDimensions.initiation.x,
            top: panelDimensions.initiation.y,
          }}
        >
          <InitiationPanel
            width={panelDimensions.initiation.width}
            height={panelDimensions.initiation.height}
            state={state.initiation}
            onDockFactor={handleDockFactor}
          />
        </div>
      )}

      {/* Propagation Panel (bottom-left on desktop) */}
      {dimensions.width > 0 && (
        <div
          style={{
            position: 'absolute',
            left: panelDimensions.propagation.x,
            top: panelDimensions.propagation.y,
          }}
        >
          <PropagationPanel
            width={panelDimensions.propagation.width}
            height={panelDimensions.propagation.height}
            state={state.propagation}
            amplificationState={state.amplification}
            amplificationComplete={amplificationComplete}
            onFormComplex={handleFormComplex}
          />
        </div>
      )}

      {/* Amplification Panel (bottom-right on desktop) */}
      {dimensions.width > 0 && (
        <div
          style={{
            position: 'absolute',
            left: panelDimensions.amplification.x,
            top: panelDimensions.amplification.y,
          }}
        >
          <AmplificationPanel
            width={panelDimensions.amplification.width}
            height={panelDimensions.amplification.height}
            state={state.amplification}
            thrombinAvailable={thrombinAvailable}
            fixaInPropagation={state.propagation.fixaArrived}
            onActivateFactor={handleActivateFactor}
            onDockCofactor={handleDockCofactor}
            onPARThrombinBind={parThrombinBind}
            onPARCleave={parCleave}
            onPARActivate={parActivate}
            onFIXaClick={handleFIXaToPropagate}
          />
        </div>
      )}

      {/* Flow Arrow Overlay */}
      {dimensions.width > 0 && (
        <FlowArrowOverlay
          width={dimensions.width}
          height={dimensions.height}
          arrows={flowArrows}
        />
      )}

      {/* Victory screen */}
      {state.propagation.thrombinBurst && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
            borderRadius: 12,
            border: '2px solid #34D399',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            zIndex: 150,
            animation: 'slideUp 0.5s ease-out',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#FFF',
              textAlign: 'center',
            }}
          >
            Cascada completă!
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#D1FAE5',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Cheagul de fibrină s-a format cu succes
          </div>
        </div>
      )}

      {/* CSS */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
