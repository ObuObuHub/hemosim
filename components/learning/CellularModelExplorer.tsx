// components/learning/CellularModelExplorer.tsx
// Interactive Learning Tool - Hoffman-Monroe Cellular Model of Coagulation
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SparkFrame } from '../game/frames/SparkFrame';
import { ExplosionFrame } from '../game/frames/ExplosionFrame';
import { FactorTokenNew } from '../game/tokens/FactorTokenNew';
import { useCascadeState } from '@/hooks/useCascadeState';
import { usePanelStepState } from '@/hooks/usePanelStepState';
import { ModeToggle } from '../game/ModeToggle';
import { useAutoPlayController } from '@/hooks/useAutoPlayController';

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
    formTenase,
    // Platelet FX activation (Tenase)
    startPlateletFXActivation,
    advancePlateletFXPhase,
    completePlateletFXActivation,
    formProthrombinase,
    // Platelet FII activation (Prothrombinase)
    startPlateletFIIActivation,
    advancePlateletFIIPhase,
    completePlateletFIIActivation,
    thrombinBurst,
    // Burst phase progression
    advanceBurstPhase,
    // Fibrin formation
    cleaveFibrinogen,
    polymerizeFibrin,
    activateFXIII,
    crosslinkFibrin,
    restartLearning,
    // FXIa amplification
    startFxiaFixActivation,
    completeFxiaFixActivation,
    // FIXa deterministic migration
    holdFixaForMigration,
    startFixaGlide,
    completeFixaMigration,
    // IIa cross-frame migration
    holdFiiaForMigration,
    startFiiaGlide,
    completeFiiaMigration,
    // Enzymatic activation (E + S → ES → E + P)
    startActivation,
    advanceActivationPhase,
    completeActivation,
    // Learning mode control
    setMode,
    advanceStep,
  } = useCascadeState();

  /**
   * ENZYMATIC ACTIVATION TIMING CONFIG
   * Based on biochemical E + S → ES → E + P mechanism
   */
  const ACTIVATION_TIMING = {
    approaching: 800,   // Substrate glides to enzyme (ms)
    es_complex: 400,    // Brief pause showing complex
    cleaving: 500,      // Cleavage effect
    releasing: 1200,    // Product emerges and moves smoothly
  };

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
      produceFXa: startPlateletFXActivation,
      formProthrombinase: () => handleFormComplexRef.current('prothrombinase'),
      triggerBurst: startPlateletFIIActivation,
      // Fibrin formation callbacks
      cleaveFibrinogen,
      polymerizeFibrin,
      activateFXIII,
      crosslinkFibrin,
      advanceStep,
    }),
    [parCleave, startPlateletFXActivation, startPlateletFIIActivation, cleaveFibrinogen, polymerizeFibrin, activateFXIII, crosslinkFibrin, advanceStep]
  );

  // Auto-play controller for demonstration mode
  useAutoPlayController({
    isActive: state.mode === 'auto',
    currentStepIndex: state.currentStepIndex,
    callbacks: autoPlayCallbacks,
  });

  // Unified view: No phase transition needed
  // Both amplification and propagation activities are visible simultaneously
  // Each activity is gated by its own prerequisites, not by phase
  const { platelet, initiation } = state;

  // Panel-specific step state for instruction banners
  const sparkPanelState = usePanelStepState('spark', state);
  const plateletPanelState = usePanelStepState('platelet', state);

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
  // Timeout matches fixaFloatToTenase animation duration (1600ms) in UnifiedPlateletView
  useEffect(() => {
    if (initiation.fixaMigrationState === 'migrating' && !platelet.fixaArrived) {
      const timer = setTimeout(() => {
        completeFixaMigration();
      }, 1600);

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

  /**
   * PLATELET FX ACTIVATION PHASE ORCHESTRATION (Tenase: E + S → ES → E + P)
   * Auto-advances through: approaching → es_complex → cleaving → releasing → complete
   */
  useEffect(() => {
    const phase = platelet.plateletFxActivationPhase;
    if (phase === 'inactive' || phase === 'complete') return;

    const timing = ACTIVATION_TIMING[phase as keyof typeof ACTIVATION_TIMING];
    if (!timing) return;

    const timer = setTimeout(() => {
      if (phase === 'releasing') {
        completePlateletFXActivation();
      } else {
        advancePlateletFXPhase();
      }
    }, timing);

    return () => clearTimeout(timer);
  }, [platelet.plateletFxActivationPhase, advancePlateletFXPhase, completePlateletFXActivation]);

  /**
   * PLATELET FII ACTIVATION PHASE ORCHESTRATION (Prothrombinase: E + S → ES → E + P)
   * Auto-advances through: approaching → es_complex → cleaving → releasing → complete
   */
  useEffect(() => {
    const phase = platelet.plateletFiiActivationPhase;
    if (phase === 'inactive' || phase === 'complete') return;

    const timing = ACTIVATION_TIMING[phase as keyof typeof ACTIVATION_TIMING];
    if (!timing) return;

    const timer = setTimeout(() => {
      if (phase === 'releasing') {
        completePlateletFIIActivation();
      } else {
        advancePlateletFIIPhase();
      }
    }, timing);

    return () => clearTimeout(timer);
  }, [platelet.plateletFiiActivationPhase, advancePlateletFIIPhase, completePlateletFIIActivation]);

  /**
   * THROMBIN BURST PHASE ORCHESTRATION
   * Dramatic visualization: converging → explosion → cleaving → polymerizing
   *
   * Timing:
   * - converging: 1.5s - FIIa particles stream toward center
   * - explosion: 1.0s - Central amplification effect (~350 nM)
   * - cleaving: 3.0s - FIIa cleaving fibrinogen visualization
   * - polymerizing: triggers fibrinogenCleaved and transition to FibrinMesh
   */
  const BURST_PHASE_TIMING = {
    converging: 2000,   // 2s for particles to reach center
    explosion: 1500,    // 1.5s for explosion effect
    cleaving: 10000,    // 10s for cleavage visualization (very slow, cinematic)
  };

  useEffect(() => {
    const phase = platelet.burstPhase;
    if (phase === 'inactive' || phase === 'polymerizing') return;

    const timing = BURST_PHASE_TIMING[phase as keyof typeof BURST_PHASE_TIMING];
    if (!timing) return;

    const timer = setTimeout(() => {
      advanceBurstPhase();
    }, timing);

    return () => clearTimeout(timer);
  }, [platelet.burstPhase, advanceBurstPhase]);

  /**
   * FXIa AMPLIFICATION ORCHESTRATION
   *
   * Educational note: FXIa activates FIX → FIXa as part of the positive feedback loop.
   * This is distinct from the TF:VIIa pathway (initiation phase).
   * Shows only AFTER Tenase forms to avoid confusion with initiation.
   *
   * Timing:
   * - 1.5s delay after Tenase forms → START_FXIA_FIX_ACTIVATION
   * - 2s animation → COMPLETE_FXIA_FIX_ACTIVATION
   */
  useEffect(() => {
    // Start FXIa amplification after Tenase forms (requires FXIa to be activated)
    if (
      platelet.fxiActivated &&
      platelet.tenaseFormed &&
      !platelet.fxiaActivatingFix &&
      !platelet.fxiaFixaProduced
    ) {
      const timer = setTimeout(() => {
        startFxiaFixActivation();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [platelet.fxiActivated, platelet.tenaseFormed, platelet.fxiaActivatingFix, platelet.fxiaFixaProduced, startFxiaFixActivation]);

  // Complete FXIa activation after animation
  useEffect(() => {
    if (platelet.fxiaActivatingFix) {
      const timer = setTimeout(() => {
        completeFxiaFixActivation();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [platelet.fxiaActivatingFix, completeFxiaFixActivation]);

  /**
   * ENZYMATIC ACTIVATION PHASE ORCHESTRATION
   *
   * Auto-advances through activation phases (approaching → es_complex → cleaving → releasing → complete)
   * Each phase has a specific timing to show the E + S → ES → E + P biochemical mechanism.
   */

  // FIX activation phase orchestration
  useEffect(() => {
    const phase = initiation.fixActivationPhase;
    if (phase === 'inactive' || phase === 'complete') return;

    const timing = ACTIVATION_TIMING[phase as keyof typeof ACTIVATION_TIMING];
    if (!timing) return;

    const timer = setTimeout(() => {
      if (phase === 'releasing') {
        // Complete activation - set fixDocked and trigger migration hold
        completeActivation('FIX');
        holdFixaForMigration();
      } else {
        advanceActivationPhase('FIX');
      }
    }, timing);

    return () => clearTimeout(timer);
  }, [initiation.fixActivationPhase, advanceActivationPhase, completeActivation, holdFixaForMigration]);

  // FX activation phase orchestration
  useEffect(() => {
    const phase = initiation.fxActivationPhase;
    if (phase === 'inactive' || phase === 'complete') return;

    const timing = ACTIVATION_TIMING[phase as keyof typeof ACTIVATION_TIMING];
    if (!timing) return;

    const timer = setTimeout(() => {
      if (phase === 'releasing') {
        // Complete activation - set fxDocked
        completeActivation('FX');
      } else {
        advanceActivationPhase('FX');
      }
    }, timing);

    return () => clearTimeout(timer);
  }, [initiation.fxActivationPhase, advanceActivationPhase, completeActivation]);

  // FII activation phase orchestration
  useEffect(() => {
    const phase = initiation.fiiActivationPhase;
    if (phase === 'inactive' || phase === 'complete') return;

    const timing = ACTIVATION_TIMING[phase as keyof typeof ACTIVATION_TIMING];
    if (!timing) return;

    const timer = setTimeout(() => {
      if (phase === 'releasing') {
        // Complete activation - set fiiDocked and trigger thrombin production
        completeActivation('FII');
        setTimeout(() => {
          produceThrombin();
        }, 100);
      } else {
        advanceActivationPhase('FII');
      }
    }, timing);

    return () => clearTimeout(timer);
  }, [initiation.fiiActivationPhase, advanceActivationPhase, completeActivation, produceThrombin]);

  // Responsive layout calculation
  const isMobile = dimensions.width < 600;
  const gap = 4;

  const frameDimensions = isMobile
    ? {
        // Mobile: vertical stack (initiation on top, platelet below)
        initiation: {
          width: dimensions.width - 16,
          height: (dimensions.height - 24 - gap) * 0.35,
          x: 8,
          y: 8,
        },
        platelet: {
          width: dimensions.width - 16,
          height: (dimensions.height - 24 - gap) * 0.65,
          x: 8,
          y: 8 + (dimensions.height - 24 - gap) * 0.35 + gap,
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
   * Handle enzymatic activation start (E + S → ES → E + P)
   * Educational note: Shows biochemically accurate substrate-enzyme binding and catalysis
   */
  const handleStartActivation = useCallback(
    (factor: 'FIX' | 'FX' | 'FII'): void => {
      startActivation(factor);
    },
    [startActivation]
  );

  /**
   * Handle factor docking in initiation phase (legacy path)
   * Educational note: TF-VIIa complex forms first, then activates downstream factors
   * NOTE: FIX, FX, FII now use handleStartActivation for enzymatic visualization
   */
  const handleDockFactor = useCallback(
    (factorId: string): void => {
      switch (factorId) {
        case 'TF+FVII':
          dockTFVIIa();
          break;
        case 'FIX':
          // Legacy path (for auto mode or fallback)
          dockFIX();
          // FIXa activated - moves to hold position waiting for platelet activation
          holdFixaForMigration();
          break;
        case 'FX':
          // Legacy path (for auto mode or fallback)
          dockFX();
          break;
        case 'FV':
          dockFV();
          break;
        case 'FII':
          // Legacy path (for auto mode or fallback)
          dockFII();
          // Trace thrombin produced (~0.35 nM)
          setTimeout(() => {
            produceThrombin();
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

  // Update refs for auto-play callbacks (must be in useEffect to avoid accessing refs during render)
  useEffect(() => {
    handleDockFactorRef.current = handleDockFactor;
    handleActivateFactorRef.current = handleActivateFactor;
    handleFormComplexRef.current = handleFormComplex;
  }, [handleDockFactor, handleActivateFactor, handleFormComplex]);

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
          fontFamily: 'system-ui, sans-serif',
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

      {/* Restart Button (bottom-left) */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 200,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={restartLearning}
          aria-label="Repornește explorarea"
          style={{
            padding: '6px 14px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            border: 'none',
            borderRadius: 16,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: 0.3,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          Repornește
        </button>
      </div>

      {/* Learning Mode Toggle (bottom-right) */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 200,
          pointerEvents: 'auto',
        }}
      >
        <ModeToggle
          mode={state.mode}
          onModeChange={setMode}
          disabled={state.cascadeCompleted}
        />
      </div>

      {/* Model Title (bottom-center, between panels) */}
      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 150,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              color: '#64748B',
              letterSpacing: 0.5,
            }}
          >
            Modelul Celular
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              color: '#64748B',
              letterSpacing: 0.5,
              marginLeft: 12,
            }}
          >
            Hoffman-Monroe
          </span>
        </div>
      )}

      {/* Main content landmark */}
      <main id="cascade-content">
        {/* Initiation Phase Frame (Left/Top) */}
        {dimensions.width > 0 && (
          <div
            key={`initiation-${state.resetKey}`}
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
              onStartActivation={handleStartActivation}
              showFiiaMigration={state.initiation.fiiaMigrating}
              mode={state.mode}
              iiaMigrationState={state.initiation.iiaMigrationState}
              panelStep={sparkPanelState}
            />
          </div>
        )}

        {/* Platelet Surface Frame (Right/Bottom) */}
        {dimensions.width > 0 && (
          <div
            key={`platelet-${state.resetKey}`}
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
              onFXClick={startPlateletFXActivation}
              onFIIClick={startPlateletFIIActivation}
              onPARThrombinBind={parThrombinBind}
              onPARCleave={parCleave}
              onPARActivate={parActivate}
              onActivatePlatelet={activatePlatelet}
              onCleaveFibrinogen={cleaveFibrinogen}
              onPolymerizeFibrin={polymerizeFibrin}
              onActivateFXIII={activateFXIII}
              onCrosslinkFibrin={crosslinkFibrin}
              fixaMigrating={state.initiation.fixaMigrationState === 'migrating'}
              fixaWaiting={state.initiation.fixaMigrationState === 'held_for_migration'}
              mode={state.mode}
              panelStep={plateletPanelState}
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
            key={`fiia-migration-${state.resetKey}`}
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
              {/* FIIa - uses FactorTokenNew for consistent design */}
              <FactorTokenNew
                factorId="FIIa"
                isActive={true}
                enableHover={false}
                hideGlaDomain={true}
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(220, 38, 38, 0.5))',
                }}
              />
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
