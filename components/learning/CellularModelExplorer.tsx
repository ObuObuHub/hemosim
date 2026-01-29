// components/learning/CellularModelExplorer.tsx
// Interactive Learning Tool - Hoffman-Monroe Cellular Model of Coagulation
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SparkFrame } from '../game/frames/SparkFrame';
import { ExplosionFrame } from '../game/frames/ExplosionFrame';
import { FactorTokenNew } from '../game/tokens/FactorTokenNew';
import { useCascadeState } from '@/hooks/useCascadeState';
import { ModeToggle } from '../game/ModeToggle';
import { InstructionBanner } from '../game/InstructionBanner';
import { useAutoPlayController } from '@/hooks/useAutoPlayController';
import { cascadeSteps, getNextStep, getCurrentStepIndex } from '@/data/cascadeSteps';

interface CellularModelExplorerProps {
  className?: string;
}

/**
 * CellularModelExplorer - Interactive Learning Tool
 *
 * Educational visualization of the Hoffman-Monroe cellular model of coagulation.
 * Designed for medical students and healthcare professionals to build intuitive
 * understanding of hemostasis through guided exploration.
 *
 * Learning Phases:
 * - Phase 1 "Initiation": TF-bearing cell surface (subendothelium)
 * - Phase 2 "Amplification": Platelet surface activation by trace thrombin
 * - Phase 3 "Propagation": Enzyme complex formation and thrombin burst
 * - Phase 4 "Clotting": Fibrin mesh formation and stabilization
 *
 * Learning Modes:
 * - Guided (Manual): Learner controls each step with instructional prompts
 * - Demonstration (Auto): System executes cascade for observation
 */
export function CellularModelExplorer({ className = '' }: CellularModelExplorerProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Use the cascade state hook for learning state management
  const {
    state,
    dockTFVIIa,
    dockFIX,
    dockFX,
    dockFV,
    dockFII,
    produceThrombin,
    thrombinArrives,
    setPlateletPhase,
    splitVWF,
    activateFV,
    activateFVIII,
    activateFXI,
    activatePlatelet,
    dockFVa,
    dockFVIIIa,
    parThrombinBind,
    parCleave,
    parActivate,
    fixaArrives,
    formTenase,
    produceFXa,
    formProthrombinase,
    thrombinBurst,
    // Fibrin formation
    cleaveFibrinogen,
    polymerizeFibrin,
    activateFXIII,
    crosslinkFibrin,
    restartLearning,
    // FIXa deterministic migration
    holdFixaForMigration,
    startFixaGlide,
    completeFixaMigration,
    // IIa cross-frame migration
    holdFiiaForMigration,
    startFiiaGlide,
    completeFiiaMigration,
    // Legacy migration visualization (kept for backward compat, may remove later)
    startFixaMigration,
    stopFixaMigration,
    // Note: startFiiaMigration/stopFiiaMigration no longer used - replaced by iiaMigrationState
    // Learning mode control
    setMode,
    advanceStep,
  } = useCascadeState();

  // Measure container dimensions for responsive layout
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

  // Refs for callback functions (to avoid circular dependencies with useMemo)
  const handleDockFactorRef = useRef<(factorId: string) => void>(() => {});
  const handleActivateFactorRef = useRef<(factorId: string) => void>(() => {});
  const handleFormComplexRef = useRef<(complexType: 'tenase' | 'prothrombinase' | 'burst') => void>(() => {});

  // Auto-play controller callbacks for demonstration mode
  const autoPlayCallbacks = useMemo(
    () => ({
      dockTFVIIa: () => handleDockFactorRef.current('TF+FVII'),
      dockFIX: () => handleDockFactorRef.current('FIX'),
      dockFX: () => handleDockFactorRef.current('FX'),
      dockFV: () => handleDockFactorRef.current('FV'),
      dockFII: () => handleDockFactorRef.current('FII'),
      activateVWFVIII: () => handleActivateFactorRef.current('vWF-VIII'),
      activateFV: () => handleActivateFactorRef.current('FV'),
      activateFXI: () => handleActivateFactorRef.current('FXI'),
      parCleave,
      formTenase: () => handleFormComplexRef.current('tenase'),
      produceFXa,
      formProthrombinase: () => handleFormComplexRef.current('prothrombinase'),
      triggerBurst: () => handleFormComplexRef.current('burst'),
      // Fibrin formation callbacks
      cleaveFibrinogen,
      polymerizeFibrin,
      activateFXIII,
      crosslinkFibrin,
      advanceStep,
    }),
    [parCleave, produceFXa, cleaveFibrinogen, polymerizeFibrin, activateFXIII, crosslinkFibrin, advanceStep]
  );

  // Calculate actual step index based on cascade state (for manual mode accuracy)
  const calculatedStepIndex = useMemo(
    () =>
      getCurrentStepIndex({
        spark: {
          tfVIIaDocked: state.initiation.tfVIIaDocked,
          fixDocked: state.initiation.fixDocked,
          fxDocked: state.initiation.fxDocked,
          fvDocked: state.initiation.fvDocked,
          fiiDocked: state.initiation.fiiDocked,
          thrombinProduced: state.initiation.thrombinProduced,
        },
        explosion: {
          thrombinArrived: state.platelet.thrombinArrived,
          parCleavageState: state.platelet.parCleavageState,
          vwfSplit: state.platelet.vwfSplit,
          fvActivated: state.platelet.fvActivated,
          fxiActivated: state.platelet.fxiActivated,
          plateletActivated: state.platelet.plateletActivated,
          fvaDocked: state.platelet.fvaDocked,
          fviiaDocked: state.platelet.fviiaDocked,
          fixaArrived: state.platelet.fixaArrived,
          tenaseFormed: state.platelet.tenaseFormed,
          fxaProduced: state.platelet.fxaProduced,
          prothrombinaseFormed: state.platelet.prothrombinaseFormed,
          thrombinBurst: state.platelet.thrombinBurst,
          fibrinogenCleaved: state.platelet.fibrinogenCleaved,
          fibrinPolymerized: state.platelet.fibrinPolymerized,
          fxiiiActivated: state.platelet.fxiiiActivated,
          fibrinCrosslinked: state.platelet.fibrinCrosslinked,
        },
      }),
    [state.initiation, state.platelet]
  );

  // Use calculated index for manual mode, stored index for auto mode
  const effectiveStepIndex = state.mode === 'auto' ? state.currentStepIndex : calculatedStepIndex;

  // Auto-play controller for demonstration mode
  useAutoPlayController({
    isActive: state.mode === 'auto',
    currentStepIndex: state.currentStepIndex,
    callbacks: autoPlayCallbacks,
  });

  // Get current step for instructional banner
  const currentStep = getNextStep(effectiveStepIndex);

  // Unified view: No phase transition needed
  // Both amplification and propagation activities are visible simultaneously
  // Each activity is gated by its own prerequisites, not by phase
  const { platelet, initiation } = state;

  /**
   * FIXa DETERMINISTIC MIGRATION TRIGGER
   *
   * Educational note: FIXa produced on TF-bearing cell migrates to platelet
   * surface when the platelet is activated (PAR cleavage exposes PS).
   * The migration is deterministic - FIXa travels directly to Tenase complex.
   *
   * Trigger conditions:
   * 1. FIXa is in hold position (held_for_migration)
   * 2. Platelet is activated (plateletActivated = true)
   * 3. FVIIIa is docked (Tenase port is ready to receive)
   */
  useEffect(() => {
    // Start migration when conditions are met
    if (
      initiation.fixaMigrationState === 'held_for_migration' &&
      platelet.plateletActivated &&
      platelet.fviiaDocked &&
      !platelet.fixaArrived
    ) {
      startFixaGlide();
    }
  }, [
    initiation.fixaMigrationState,
    platelet.plateletActivated,
    platelet.fviiaDocked,
    platelet.fixaArrived,
    startFixaGlide,
  ]);

  // Separate effect to complete migration after animation
  useEffect(() => {
    if (initiation.fixaMigrationState === 'migrating' && !platelet.fixaArrived) {
      const timer = setTimeout(() => {
        completeFixaMigration();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [initiation.fixaMigrationState, platelet.fixaArrived, completeFixaMigration]);

  /**
   * IIa (THROMBIN) CROSS-FRAME MIGRATION ORCHESTRATION
   *
   * Educational note: Trace thrombin (~0.35 nM) produced on TF-bearing cell
   * diffuses rapidly to nearby platelet, triggering amplification phase.
   * The visual migration shows this cross-cellular communication.
   *
   * State machine:
   * 1. thrombinProduced → holdFiiaForMigration() (FIIa at hold position)
   * 2. held_for_migration (200ms delay) → startFiiaGlide() (begin animation)
   * 3. migrating (800ms animation) → completeFiiaMigration() (thrombinArrived)
   */

  // Effect 1: Hold FIIa for migration when thrombin is produced
  useEffect(() => {
    if (
      initiation.thrombinProduced &&
      initiation.iiaMigrationState === 'inactive'
    ) {
      // Brief delay for visual clarity - see FIIa form at original position
      const timer = setTimeout(() => {
        holdFiiaForMigration();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [initiation.thrombinProduced, initiation.iiaMigrationState, holdFiiaForMigration]);

  // Effect 2: Start FIIa glide after brief hold
  useEffect(() => {
    if (initiation.iiaMigrationState === 'held_for_migration') {
      // Small delay to show FIIa at hold position before migration
      const timer = setTimeout(() => {
        startFiiaGlide();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [initiation.iiaMigrationState, startFiiaGlide]);

  // Effect 3: Complete migration after animation (2.2s)
  useEffect(() => {
    if (initiation.iiaMigrationState === 'migrating') {
      const timer = setTimeout(() => {
        completeFiiaMigration();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [initiation.iiaMigrationState, completeFiiaMigration]);

  // Responsive layout calculation
  const isMobile = dimensions.width < 600;
  const gap = 4;

  const frameDimensions = isMobile
    ? {
        // Mobile: vertical stack (initiation on top, platelet below)
        initiation: {
          width: dimensions.width - 16,
          height: (dimensions.height - 32 - gap) * 0.35,
          x: 8,
          y: 8,
        },
        platelet: {
          width: dimensions.width - 16,
          height: (dimensions.height - 32 - gap) * 0.65,
          x: 8,
          y: 8 + (dimensions.height - 32 - gap) * 0.35 + gap,
        },
      }
    : {
        // Desktop: side by side (initiation left, platelet right)
        initiation: {
          width: (dimensions.width - 16 - gap) * 0.5,
          height: dimensions.height - 16,
          x: 8,
          y: 8,
        },
        platelet: {
          width: (dimensions.width - 16 - gap) * 0.5,
          height: dimensions.height - 16,
          x: 8 + (dimensions.width - 16 - gap) * 0.5 + gap,
          y: 8,
        },
      };

  /**
   * Handle factor docking in initiation phase
   * Educational note: TF-VIIa complex forms first, then activates downstream factors
   */
  const handleDockFactor = useCallback(
    (factorId: string): void => {
      switch (factorId) {
        case 'TF+FVII':
          dockTFVIIa();
          break;
        case 'FIX':
          dockFIX();
          // FIXa activated - moves to hold position waiting for platelet activation
          // DETERMINISTIC: FIXa stays in hold slot until plateletActivated triggers migration
          holdFixaForMigration();
          break;
        case 'FX':
          dockFX();
          break;
        case 'FV':
          dockFV();
          break;
        case 'FII':
          dockFII();
          // Trace thrombin produced (~0.35 nM)
          // Educational: Small amounts insufficient for fibrin clot,
          // but enough to activate platelet surface
          // NOTE: The cross-frame migration is now orchestrated by useEffects above
          // that watch iiaMigrationState and trigger the animation sequence
          setTimeout(() => {
            produceThrombin();
            // Migration orchestration is handled by the iiaMigrationState effects:
            // 1. thrombinProduced triggers holdFiiaForMigration (400ms delay)
            // 2. held_for_migration triggers startFiiaGlide (400ms delay)
            // 3. migrating triggers completeFiiaMigration (800ms animation)
          }, 300);
          break;
      }
    },
    [
      dockTFVIIa,
      dockFIX,
      dockFX,
      dockFV,
      dockFII,
      produceThrombin,
      holdFixaForMigration,
    ]
  );

  /**
   * Handle factor activation in amplification phase
   * Educational note: Thrombin activates cofactors on platelet surface
   */
  const handleActivateFactor = useCallback(
    (factorId: string): void => {
      switch (factorId) {
        case 'vWF-VIII':
          // Thrombin cleaves vWF, releasing FVIII
          splitVWF();
          activateFVIII();
          break;
        case 'FV':
          // Thrombin activates FV to FVa
          activateFV();
          break;
        case 'FXI':
          // Thrombin activates FXI - positive feedback loop
          activateFXI();
          break;
      }

      // Check if platelet should expose phosphatidylserine
      setTimeout(() => {
        if (state.platelet.vwfSplit && state.platelet.fvActivated && state.platelet.fxiActivated) {
          activatePlatelet();
        }
      }, 500);
    },
    [splitVWF, activateFVIII, activateFV, activateFXI, activatePlatelet, state.platelet]
  );

  /**
   * Handle cofactor docking to platelet membrane
   * Educational note: Gla-domain + Ca²⁺ anchors cofactors to phosphatidylserine
   */
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
      // No phase transition needed - unified view shows both zones
    },
    [dockFVa, dockFVIIIa]
  );

  /**
   * Handle enzyme complex formation in propagation phase
   * Educational note: Complexes provide massive amplification
   * - Tenase: ×200,000 acceleration
   * - Prothrombinase: ×300,000 acceleration
   */
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

  // Update refs for auto-play callbacks
  handleDockFactorRef.current = handleDockFactor;
  handleActivateFactorRef.current = handleActivateFactor;
  handleFormComplexRef.current = handleFormComplex;

  // Calculate learning progress for each phase
  const learningProgress = useMemo(() => {
    // Initiation progress
    const initiationSteps = [
      state.initiation.tfVIIaDocked,
      state.initiation.fixDocked,
      state.initiation.fxDocked,
      state.initiation.fvDocked,
      state.initiation.fiiDocked,
      state.initiation.thrombinProduced,
    ];
    const initiationProgress = (initiationSteps.filter(Boolean).length / initiationSteps.length) * 100;

    // Amplification progress
    const amplificationSteps = [
      state.platelet.thrombinArrived,
      state.platelet.vwfSplit,
      state.platelet.fvActivated,
      state.platelet.fxiActivated,
      state.platelet.plateletActivated,
      state.platelet.fvaDocked,
      state.platelet.fviiaDocked,
    ];
    const amplificationProgress = (amplificationSteps.filter(Boolean).length / amplificationSteps.length) * 100;

    // Propagation progress
    const propagationSteps = [
      state.platelet.fixaArrived,
      state.platelet.tenaseFormed,
      state.platelet.prothrombinaseFormed,
    ];
    const propagationProgress = (propagationSteps.filter(Boolean).length / propagationSteps.length) * 100;

    // Determine current learning phase
    let currentPhase: 'initiation' | 'amplification' | 'propagation' | 'burst' | 'clotting' | 'complete' = 'initiation';
    if (state.cascadeCompleted) {
      currentPhase = 'complete';
    } else if (state.platelet.phase === 'clotting' || state.platelet.phase === 'stable') {
      currentPhase = 'clotting';
    } else if (state.platelet.thrombinBurst) {
      currentPhase = 'burst';
    } else if (state.platelet.phase === 'propagating') {
      currentPhase = 'propagation';
    } else if (state.platelet.phase === 'amplifying') {
      currentPhase = 'amplification';
    } else if (state.initiation.thrombinProduced) {
      currentPhase = 'amplification';
    }

    return {
      currentPhase,
      initiationProgress,
      amplificationProgress,
      propagationProgress,
    };
  }, [state]);

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
      role="application"
      aria-label="Instrument interactiv de învățare - Modelul celular Hoffman-Monroe al coagulării"
    >
      {/* Skip to content link for accessibility */}
      <a
        href="#cascade-content"
        style={{
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: 9999,
          background: '#1E293B',
          color: '#FFFFFF',
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 600,
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '8px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
        }}
      >
        Salt la conținut interactiv
      </a>

      {/* Header with learning mode toggle and restart button */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '12px',
          zIndex: 200,
          pointerEvents: 'none',
        }}
      >
        {/* Learning Mode Toggle (left side) */}
        <div style={{ pointerEvents: 'auto' }}>
          <ModeToggle
            mode={state.mode}
            onModeChange={setMode}
            disabled={state.cascadeCompleted}
          />
        </div>

        {/* Instructional Banner (center) - guided mode only */}
        {state.mode === 'manual' && !state.cascadeCompleted && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              padding: '0 16px',
              pointerEvents: 'auto',
            }}
          >
            <InstructionBanner
              currentStep={currentStep}
              currentStepIndex={effectiveStepIndex}
              totalSteps={cascadeSteps.length}
              isComplete={state.cascadeCompleted}
            />
          </div>
        )}

        {/* Demonstration mode progress indicator */}
        {state.mode === 'auto' && !state.cascadeCompleted && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              padding: '0 16px',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px',
                background: 'rgba(34, 197, 94, 0.95)',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#FFFFFF',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div>
                <div style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700 }}>
                  MOD DEMONSTRAȚIE
                </div>
                <div style={{ color: '#D1FAE5', fontSize: 9 }}>
                  Pas {effectiveStepIndex + 1} / {cascadeSteps.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restart Learning Button (right side) */}
        <div style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={restartLearning}
            aria-label="Repornește explorarea"
            style={{
              padding: '6px 12px',
              background: 'rgba(100, 116, 139, 0.4)',
              border: '2px solid #64748B',
              borderRadius: 6,
              color: '#E2E8F0',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(100, 116, 139, 0.6)';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(100, 116, 139, 0.4)';
              e.currentTarget.style.borderColor = '#64748B';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #3B82F6';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            Repornește
          </button>
        </div>
      </div>

      {/* Main content landmark */}
      <main id="cascade-content">
        {/* Initiation Phase Frame (Left/Top) */}
        {dimensions.width > 0 && (
          <div
            style={{
              position: 'absolute',
              left: frameDimensions.initiation.x,
              top: frameDimensions.initiation.y,
            }}
          >
            <SparkFrame
              width={frameDimensions.initiation.width}
              height={frameDimensions.initiation.height}
              state={state.initiation}
              onDockFactor={handleDockFactor}
              showFiiaMigration={state.initiation.fiiaMigrating}
              mode={state.mode}
              iiaMigrationState={state.initiation.iiaMigrationState}
            />
          </div>
        )}

        {/* Platelet Surface Frame (Right/Bottom) */}
        {dimensions.width > 0 && (
          <div
            style={{
              position: 'absolute',
              left: frameDimensions.platelet.x,
              top: frameDimensions.platelet.y,
            }}
          >
            <ExplosionFrame
              width={frameDimensions.platelet.width}
              height={frameDimensions.platelet.height}
              state={state.platelet}
              onActivateFactor={handleActivateFactor}
              onDockCofactor={handleDockCofactor}
              onFormComplex={handleFormComplex}
              onProduceFXa={produceFXa}
              onPARThrombinBind={parThrombinBind}
              onPARCleave={parCleave}
              onPARActivate={parActivate}
              onActivatePlatelet={activatePlatelet}
              onCleaveFibrinogen={cleaveFibrinogen}
              onPolymerizeFibrin={polymerizeFibrin}
              onActivateFXIII={activateFXIII}
              onCrosslinkFibrin={crosslinkFibrin}
              fixaMigrating={state.initiation.fixaMigrationState === 'migrating'}
              mode={state.mode}
            />
          </div>
        )}

        {/* Educational Components removed - progress indicators integrated into frames */}

        {/* ============================================================ */}
        {/* CROSS-FRAME FIIa MIGRATION OVERLAY                          */}
        {/* ============================================================ */}
        {/* Renders migrating thrombin token at container level, above both frames */}
        {/* Animated from SparkFrame fiiaHold position to ExplosionFrame IIa slot */}
        {state.initiation.iiaMigrationState === 'migrating' && !isMobile && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                position: 'absolute',
                // Start position: SparkFrame fiiaHold (right side of SparkFrame, middle height)
                // fiiaHold = { x: width * 0.90, y: bloodstreamHeight * 0.45 }
                left: frameDimensions.initiation.x + frameDimensions.initiation.width * 0.90 - 22,
                top: frameDimensions.initiation.y + (frameDimensions.initiation.height * 0.72) * 0.45 - 18,
                animation: 'fiiaCrossFrameMigrate 1.5s ease-in-out forwards',
                // CSS variables for end position (used in keyframes)
                ['--end-x' as string]: `${frameDimensions.platelet.x + frameDimensions.platelet.width * 0.45 - 22}px`,
                ['--end-y' as string]: `${frameDimensions.platelet.y + (frameDimensions.platelet.height * 0.78) * 0.32 - 18}px`,
                ['--start-x' as string]: `${frameDimensions.initiation.x + frameDimensions.initiation.width * 0.90 - 22}px`,
                ['--start-y' as string]: `${frameDimensions.initiation.y + (frameDimensions.initiation.height * 0.72) * 0.45 - 18}px`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  filter: 'drop-shadow(0 4px 16px rgba(220, 38, 38, 0.6))',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    border: '3px solid #FEE2E2',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.5)',
                  }}
                >
                  IIa
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                    borderRadius: 5,
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Trombină → Plt
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CSS Animations - Simple, GPU-optimized */}
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(15px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fiiaCrossFrameMigrate {
            0% { left: var(--start-x); top: var(--start-y); opacity: 1; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-30px); }
            100% { left: var(--end-x); top: var(--end-y); opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

// Backward compatibility export
export { CellularModelExplorer as TwoFrameGame };
