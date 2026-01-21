// app/game-v2/page.tsx
'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useSceneState } from '@/hooks/useSceneState';
import { InitiationScene, AmplificationScene, PropagationScene } from '@/components/game/scenes';
import { FactorTokenNew } from '@/components/game/tokens/FactorTokenNew';
import type { FloatingFactor } from '@/types/game';


interface HeldFactor {
  id: string;
  factorId: string;
  originalFloatingFactor: FloatingFactor;
  position: { x: number; y: number };
}

/**
 * Scene-based coagulation cascade game
 * TEXTBOOK FIRST, GAMIFICATION SECOND
 */
export default function GamePageV2(): ReactElement {
  const {
    state,
    setScene,
    addFloatingFactor,
    removeFloatingFactor,
    updateFloatingFactors,
    removeActivationArrow,
    setObjectives,
    areAllObjectivesComplete,
  } = useSceneState();

  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen dimensions
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = (): void => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const GAME_WIDTH = dimensions.width;
  const GAME_HEIGHT = dimensions.height;

  // Held factor state for drag-and-drop
  const [heldFactor, setHeldFactor] = useState<HeldFactor | null>(null);

  // Initialize scene objectives
  useEffect(() => {
    if (state.currentScene === 'initiation') {
      setObjectives([
        { id: 'dock-fx', description: 'Dock FX with TF+VIIa', isComplete: false },
        { id: 'dock-fv', description: 'Dock FV to form Prothrombinase', isComplete: false },
        { id: 'deliver-thrombin', description: 'Deliver thrombin to platelet', isComplete: false },
      ]);
    }
  }, [state.currentScene, setObjectives]);

  // Log scene changes
  useEffect(() => {
    console.log('📍 CURRENT SCENE:', state.currentScene);
  }, [state.currentScene]);

  // Check for scene transition (objectives-based - currently not used)
  useEffect(() => {
    if (areAllObjectivesComplete()) {
      if (state.currentScene === 'initiation') {
        setTimeout(() => setScene('amplification'), 500);
      } else if (state.currentScene === 'amplification') {
        setTimeout(() => setScene('propagation'), 500);
      } else if (state.currentScene === 'propagation') {
        setTimeout(() => setScene('victory'), 500);
      }
    }
  }, [state.currentScene, areAllObjectivesComplete, setScene]);

  // Track which TF proteins have FVII docked (forms TF+VIIa)
  const [tfDockingState, setTfDockingState] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  });

  // Track which TF+VIIa complexes have FIX docked (activated to FIXa)
  const [fixDockingState, setFixDockingState] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  });

  // Track which TF+VIIa complexes have FX docked (activated to FXa)
  const [fxDockingState, setFxDockingState] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  });

  // Track which complexes have FV docked (forms Prothrombinase with FXa!)
  const [fvDockingState, setFvDockingState] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  });

  // Track FII docked to Prothrombinase (converts to Thrombin!)
  // TEXTBOOK: Prothrombinase (Xa+Va) + FII → FIIa (Thrombin)
  const [fiiDockedState, setFiiDockedState] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  });

  // Track dragged thrombin for delivering to platelet
  // TEXTBOOK: The small thrombin spark must reach the platelet to start AMPLIFICATION!
  const [draggedThrombin, setDraggedThrombin] = useState<{
    fromIndex: number;
    position: { x: number; y: number };
  } | null>(null);

  // Debug log for on-screen display
  const [debugLog, setDebugLog] = useState<string[]>(['Game started']);

  // ═══════════════════════════════════════════════════════════════════════
  // AMPLIFICATION PHASE STATE
  // ═══════════════════════════════════════════════════════════════════════
  const [ampVwfSplit, setAmpVwfSplit] = useState(false);
  const [ampFvActivated, setAmpFvActivated] = useState(false);
  const [ampFviiiActivated, setAmpFviiiActivated] = useState(false);
  const [ampFxiActivated, setAmpFxiActivated] = useState(false);

  // Amplification docking positions (must match AmplificationScene layout)
  // AmplificationScene: membrane at bottom 25%, slots extend UP from membrane
  const ampMembraneY = GAME_HEIGHT * 0.75; // Membrane starts at 75% down

  const ampDockingPositions = useMemo(() => ({
    // vWF-FVIII on the right (width * 0.7)
    vwf: { x: GAME_WIDTH * 0.7, y: ampMembraneY - 60 },
    fviii: { x: GAME_WIDTH * 0.7, y: ampMembraneY - 60 }, // Same position, after vWF splits
    // FV on the left (width * 0.3)
    fv: { x: GAME_WIDTH * 0.3, y: ampMembraneY - 50 },
    // FXI in the middle (width * 0.5)
    fxi: { x: GAME_WIDTH * 0.5, y: ampMembraneY - 70 },
  }), [GAME_WIDTH, ampMembraneY]);

  // Check for amplification phase completion
  useEffect(() => {
    if (state.currentScene === 'amplification' &&
        ampVwfSplit && ampFvActivated && ampFviiiActivated && ampFxiActivated) {
      setDebugLog(prev => [...prev.slice(-4), 'All activated! → Propagation']);
      setTimeout(() => setScene('propagation'), 1000);
    }
  }, [state.currentScene, ampVwfSplit, ampFvActivated, ampFviiiActivated, ampFxiActivated, setScene]);

  // ═══════════════════════════════════════════════════════════════════════
  // PROPAGATION PHASE STATE
  // ═══════════════════════════════════════════════════════════════════════
  const [propTenaseFormed, setPropTenaseFormed] = useState(false);
  const [propFxaProduced, setPropFxaProduced] = useState(false);
  const [propProthrombinaseFormed, setPropProthrombinaseFormed] = useState(false);
  const [propThrombinBurst, setPropThrombinBurst] = useState(false);

  // Propagation docking positions (must match PropagationScene layout)
  const propMembraneY = GAME_HEIGHT * 0.75;

  const propDockingPositions = useMemo(() => ({
    // Left side: FIX docking with FVIIIa to form Tenase
    fix: { x: GAME_WIDTH * 0.25 - 40, y: propMembraneY - 60 },
    // Right side: FII substrate for Prothrombinase
    fii: { x: GAME_WIDTH * 0.75, y: propMembraneY - 70 },
  }), [GAME_WIDTH, propMembraneY]);

  // Auto-produce FXa after Tenase forms (with delay for visual effect)
  useEffect(() => {
    if (propTenaseFormed && !propFxaProduced) {
      const timer = setTimeout(() => {
        setPropFxaProduced(true);
        setDebugLog(prev => [...prev.slice(-4), 'Tenase → FXa produced!']);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [propTenaseFormed, propFxaProduced]);

  // Auto-form Prothrombinase when FXa is produced (FVa is already on platelet)
  useEffect(() => {
    if (propFxaProduced && !propProthrombinaseFormed) {
      const timer = setTimeout(() => {
        setPropProthrombinaseFormed(true);
        setDebugLog(prev => [...prev.slice(-4), 'FXa + FVa → Prothrombinase!']);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [propFxaProduced, propProthrombinaseFormed]);

  // Check for propagation phase completion (thrombin burst)
  useEffect(() => {
    if (state.currentScene === 'propagation' && propThrombinBurst) {
      setDebugLog(prev => [...prev.slice(-4), 'THROMBIN BURST! → Victory']);
      setTimeout(() => setScene('victory'), 2000);
    }
  }, [state.currentScene, propThrombinBurst, setScene]);

  // Platelet position for collision detection - TOP MIDDLE of bloodstream
  // TEXTBOOK: Resting platelet floating in blood, waiting for thrombin
  const plateletPosition = useMemo(() => ({
    x: GAME_WIDTH / 2,
    y: 60,  // Near top
    width: 180,
    height: 70,
  }), [GAME_WIDTH]);

  // TF positions (must match InitiationScene) - memoized to avoid stale closures
  const tfPositions = useMemo(() => [
    { x: GAME_WIDTH * 0.2, index: 0 },
    { x: GAME_WIDTH * 0.5, index: 1 },
    { x: GAME_WIDTH * 0.8, index: 2 },
  ], [GAME_WIDTH]);

  // Spawn floating factors for initiation - BALANCED based on game state
  useEffect(() => {
    if (state.currentScene !== 'initiation') return;

    const spawnFactor = (): void => {
      // Build weighted pool based on what player needs
      const pool: string[] = [];

      const hasTFVIIa = Object.values(tfDockingState).some(v => v);
      const hasFXa = Object.values(fxDockingState).some(v => v);
      const hasProthrombinase = Object.values(fvDockingState).some(v => v);
      const needsMoreTFVIIa = Object.values(tfDockingState).filter(v => !v).length > 0;
      const needsMoreFXa = Object.values(fxDockingState).filter(v => !v).length > 0;
      const needsMoreProthrombinase = Object.values(fvDockingState).filter(v => !v).length > 0;
      const needsThrombin = Object.values(fiiDockedState).filter(v => !v).length > 0;

      // FVII - always needed until all TF sites have VIIa
      if (needsMoreTFVIIa) {
        pool.push('FVII', 'FVII', 'FVII'); // Higher weight early
      }

      // FIX and FX - only after TF+VIIa exists
      if (hasTFVIIa) {
        pool.push('FIX', 'FIX');
        if (needsMoreFXa) {
          pool.push('FX', 'FX', 'FX'); // Need FXa for Prothrombinase
        }
      }

      // FV - only after FXa exists (to form Prothrombinase)
      if (hasFXa && needsMoreProthrombinase) {
        pool.push('FV', 'FV', 'FV');
      }

      // FII - only after Prothrombinase exists (substrate for thrombin)
      if (hasProthrombinase && needsThrombin) {
        pool.push('FII', 'FII', 'FII', 'FII'); // High priority when ready
      }

      // Fallback: if pool empty, add FVII
      if (pool.length === 0) {
        pool.push('FVII');
      }

      const factorId = pool[Math.floor(Math.random() * pool.length)];

      // Spawn in bloodstream area (top 75% of screen, but avoid platelet zone)
      const bloodstreamHeight = GAME_HEIGHT * 0.75;
      const factor: FloatingFactor = {
        id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        factorId,
        position: { x: -50, y: 120 + Math.random() * (bloodstreamHeight - 180) },
        velocity: { x: 50 + Math.random() * 30, y: (Math.random() - 0.5) * 20 },
        isVulnerableTo: [],
      };
      addFloatingFactor(factor);
    };

    // Initial spawn
    spawnFactor();
    // Spawn every 2 seconds (faster pace)
    const interval = setInterval(spawnFactor, 2000);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor, GAME_HEIGHT, tfDockingState, fxDockingState, fvDockingState, fiiDockedState]);

  // Spawn floating thrombin for AMPLIFICATION phase
  useEffect(() => {
    if (state.currentScene !== 'amplification') return;

    const spawnThrombin = (): void => {
      // Only spawn if there are still targets to activate
      const needsMore = !ampVwfSplit || !ampFvActivated || !ampFviiiActivated || !ampFxiActivated;
      if (!needsMore) return;

      // Spawn in bloodstream area (top 75%, avoiding membrane)
      const bloodstreamHeight = GAME_HEIGHT * 0.75;
      const factor: FloatingFactor = {
        id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        factorId: 'FIIa', // Thrombin
        position: { x: -50, y: 100 + Math.random() * (bloodstreamHeight - 200) },
        velocity: { x: 40 + Math.random() * 20, y: (Math.random() - 0.5) * 15 },
        isVulnerableTo: [],
      };
      addFloatingFactor(factor);
    };

    // Initial spawn
    spawnThrombin();
    // Spawn every 2.5 seconds
    const interval = setInterval(spawnThrombin, 2500);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor, GAME_HEIGHT, ampVwfSplit, ampFvActivated, ampFviiiActivated, ampFxiActivated]);

  // Spawn floating factors for PROPAGATION phase
  useEffect(() => {
    if (state.currentScene !== 'propagation') return;

    const spawnFactor = (): void => {
      const bloodstreamHeight = GAME_HEIGHT * 0.75;

      // First: spawn FIX until Tenase forms
      if (!propTenaseFormed) {
        const factor: FloatingFactor = {
          id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          factorId: 'FIX',
          position: { x: -50, y: 100 + Math.random() * (bloodstreamHeight - 200) },
          velocity: { x: 35 + Math.random() * 20, y: (Math.random() - 0.5) * 15 },
          isVulnerableTo: [],
        };
        addFloatingFactor(factor);
        return;
      }

      // Then: spawn FII after Prothrombinase forms (for thrombin burst)
      if (propProthrombinaseFormed && !propThrombinBurst) {
        const factor: FloatingFactor = {
          id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          factorId: 'FII',
          position: { x: -50, y: 100 + Math.random() * (bloodstreamHeight - 200) },
          velocity: { x: 30 + Math.random() * 15, y: (Math.random() - 0.5) * 10 },
          isVulnerableTo: [],
        };
        addFloatingFactor(factor);
      }
    };

    // Initial spawn
    spawnFactor();
    // Spawn every 2 seconds
    const interval = setInterval(spawnFactor, 2000);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor, GAME_HEIGHT, propTenaseFormed, propProthrombinaseFormed, propThrombinBurst]);

  // Game loop for factor movement
  useEffect(() => {
    const gameLoop = (timestamp: number): void => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      const updatedFactors = state.floatingFactors
        .map((factor) => ({
          ...factor,
          position: {
            x: factor.position.x + factor.velocity.x * deltaTime,
            y: factor.position.y + factor.velocity.y * deltaTime,
          },
        }))
        .filter((factor) => factor.position.x < GAME_WIDTH + 100);

      if (updatedFactors.length !== state.floatingFactors.length ||
          updatedFactors.some((f, i) => f.position.x !== state.floatingFactors[i]?.position.x)) {
        updateFloatingFactors(updatedFactors);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [state.floatingFactors, updateFloatingFactors, GAME_WIDTH]);

  // Handlers
  const handleFactorCatch = useCallback((factorId: string, event: React.MouseEvent): void => {
    const floatingFactor = state.floatingFactors.find(f => f.id === factorId);
    if (!floatingFactor) return;

    // Get position relative to container
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Pick up the factor (remove from floating, add to held)
    setHeldFactor({
      id: floatingFactor.id,
      factorId: floatingFactor.factorId,
      originalFloatingFactor: floatingFactor,
      position: { x, y },
    });
    removeFloatingFactor(factorId);
  }, [state.floatingFactors, removeFloatingFactor]);

  // Mouse move handler for dragging (factors or thrombin)
  const handleMouseMove = useCallback((event: React.MouseEvent): void => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update held factor position
    if (heldFactor) {
      setHeldFactor(prev => prev ? { ...prev, position: { x, y } } : null);
    }

    // Update dragged thrombin position
    if (draggedThrombin) {
      setDraggedThrombin(prev => prev ? { ...prev, position: { x, y } } : null);
    }
  }, [heldFactor, draggedThrombin]);

  // Mouse up handler for dropping
  const handleMouseUp = useCallback((): void => {
    // Handle thrombin drop on platelet
    if (draggedThrombin) {
      const dropX = draggedThrombin.position.x;
      const dropY = draggedThrombin.position.y;

      // Check if dropped on platelet (collision detection)
      // Platelet is rendered at TOP of screen (top: 0), centered horizontally
      // Visual platelet: x from (center - 90) to (center + 90), y from 0 to ~120 (including ghost zone)
      const plateletCenterX = plateletPosition.x;
      const isOnPlatelet =
        dropX > plateletCenterX - 150 &&  // More forgiving horizontally
        dropX < plateletCenterX + 150 &&
        dropY < 180;  // Top 180px of screen (platelet + ghost docking zone)

      setDebugLog(prev => [...prev.slice(-4), `Drop: y=${Math.round(dropY)}, onPlt=${isOnPlatelet}`]);

      if (isOnPlatelet) {
        // TEXTBOOK: Thrombin reaches platelet → AMPLIFICATION begins!
        setDebugLog(prev => [...prev.slice(-4), `SUCCESS! Going to Amplification...`]);
        setTimeout(() => {
          setScene('amplification');
        }, 800);
      } else {
        setDebugLog(prev => [...prev.slice(-4), `Miss - drop on platelet (top area)`]);
      }

      setDraggedThrombin(null);
      return;
    }

    if (!heldFactor) return;

    // Membrane is at 75% from top (bottom 25% of screen)
    const membraneY = GAME_HEIGHT * 0.75;
    const dropX = heldFactor.position.x;
    const dropY = heldFactor.position.y;

    // Check if FVII dropped near a TF protein (docking zone)
    if (heldFactor.factorId === 'FVII') {
      for (const tf of tfPositions) {
        // TF docking zone: within 80px horizontally and near membrane
        if (
          Math.abs(dropX - tf.x) < 80 &&
          dropY > membraneY - 100 && dropY < membraneY + 50 &&
          !tfDockingState[tf.index]
        ) {
          // Dock FVII to this TF → forms TF+VIIa
          console.log('Docked FVII to TF at position', tf.index, '→ TF+VIIa formed!');
          setTfDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // Check if FIX dropped near a TF+VIIa complex (gets activated to FIXa)
    // TEXTBOOK: TF+VIIa activates FIX → FIXa
    if (heldFactor.factorId === 'FIX') {
      for (const tf of tfPositions) {
        // FIX docking zone: to the LEFT of TF+VIIa
        if (
          tfDockingState[tf.index] && // TF+VIIa must be formed
          !fixDockingState[tf.index] && // FIX not already docked
          Math.abs(dropX - (tf.x - 50)) < 60 && // Left side of TF+VIIa
          dropY > membraneY - 100 && dropY < membraneY + 50
        ) {
          console.log('Docked FIX to TF+VIIa at position', tf.index, '→ FIXa produced!');
          setFixDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // Check if FX dropped near a TF+VIIa complex (gets activated to FXa)
    // TEXTBOOK: TF+VIIa activates FX → FXa
    if (heldFactor.factorId === 'FX') {
      for (const tf of tfPositions) {
        // FX docking zone: to the RIGHT of TF+VIIa
        if (
          tfDockingState[tf.index] && // TF+VIIa must be formed
          !fxDockingState[tf.index] && // FX not already docked
          Math.abs(dropX - (tf.x + 60)) < 60 && // Right side of TF+VIIa
          dropY > membraneY - 100 && dropY < membraneY + 50
        ) {
          console.log('Docked FX to TF+VIIa at position', tf.index, '→ FXa produced!');
          setFxDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // Check if FV dropped near FXa (forms PROTHROMBINASE!)
    // TEXTBOOK: FXa + FVa → Prothrombinase (enzyme complex, needs substrate FII)
    if (heldFactor.factorId === 'FV') {
      for (const tf of tfPositions) {
        // FV docking zone: next to FXa (only if FXa is present)
        // Ghost visual is at left: pos.x + 95, top: -45 relative to membrane
        if (
          fxDockingState[tf.index] && // FXa must be present
          !fvDockingState[tf.index] && // FV not already docked
          Math.abs(dropX - (tf.x + 95)) < 70 && // Right of FXa (aligned with ghost)
          dropY > membraneY - 120 && dropY < membraneY + 50
        ) {
          console.log('🔥 PROTHROMBINASE FORMED at position', tf.index, '→ Now needs FII substrate!');
          setFvDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // Check if FII dropped on Prothrombinase (converts to THROMBIN!)
    // TEXTBOOK: Prothrombinase + FII → FIIa (Thrombin)
    if (heldFactor.factorId === 'FII') {
      for (const tf of tfPositions) {
        // FII docking zone: on Prothrombinase (only if Prothrombinase exists)
        // Ghost visual is at left: pos.x + 145, top: -70 relative to membrane
        if (
          fvDockingState[tf.index] && // Prothrombinase must be formed (FXa + FVa)
          !fiiDockedState[tf.index] && // FII not already converted
          Math.abs(dropX - (tf.x + 145)) < 80 && // Near Prothrombinase (aligned with ghost)
          dropY > membraneY - 150 && dropY < membraneY + 50
        ) {
          console.log('⚡ FII → FIIa CONVERSION! THROMBIN GENERATED at position', tf.index);
          setFiiDockedState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AMPLIFICATION PHASE DOCKING - Thrombin activates cofactors
    // ═══════════════════════════════════════════════════════════════════════
    if (state.currentScene === 'amplification' && heldFactor.factorId === 'FIIa') {
      // Check vWF-FVIII split
      if (!ampVwfSplit && Math.abs(dropX - ampDockingPositions.vwf.x) < 80 &&
          Math.abs(dropY - ampDockingPositions.vwf.y) < 60) {
        setAmpVwfSplit(true);
        setDebugLog(prev => [...prev.slice(-4), 'vWF-FVIII split!']);
        setHeldFactor(null);
        return;
      }
      // Check FVIII activation (only after vWF split)
      if (ampVwfSplit && !ampFviiiActivated &&
          Math.abs(dropX - ampDockingPositions.fviii.x) < 60 &&
          Math.abs(dropY - ampDockingPositions.fviii.y) < 60) {
        setAmpFviiiActivated(true);
        setDebugLog(prev => [...prev.slice(-4), 'FVIII → FVIIIa!']);
        setHeldFactor(null);
        return;
      }
      // Check FV activation
      if (!ampFvActivated && Math.abs(dropX - ampDockingPositions.fv.x) < 60 &&
          Math.abs(dropY - ampDockingPositions.fv.y) < 60) {
        setAmpFvActivated(true);
        setDebugLog(prev => [...prev.slice(-4), 'FV → FVa!']);
        setHeldFactor(null);
        return;
      }
      // Check FXI activation
      if (!ampFxiActivated && Math.abs(dropX - ampDockingPositions.fxi.x) < 60 &&
          Math.abs(dropY - ampDockingPositions.fxi.y) < 60) {
        setAmpFxiActivated(true);
        setDebugLog(prev => [...prev.slice(-4), 'FXI → FXIa!']);
        setHeldFactor(null);
        return;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PROPAGATION PHASE DOCKING - Enzyme complex assembly
    // ═══════════════════════════════════════════════════════════════════════
    if (state.currentScene === 'propagation') {
      // Check FIX docking with FVIIIa → forms Tenase
      if (heldFactor.factorId === 'FIX' && !propTenaseFormed &&
          Math.abs(dropX - propDockingPositions.fix.x) < 70 &&
          Math.abs(dropY - propDockingPositions.fix.y) < 60) {
        setPropTenaseFormed(true);
        setDebugLog(prev => [...prev.slice(-4), 'FIX + FVIIIa → TENASE!']);
        setHeldFactor(null);
        return;
      }

      // Check FII docking with Prothrombinase → THROMBIN BURST
      if (heldFactor.factorId === 'FII' && propProthrombinaseFormed && !propThrombinBurst &&
          Math.abs(dropX - propDockingPositions.fii.x) < 70 &&
          Math.abs(dropY - propDockingPositions.fii.y) < 60) {
        setPropThrombinBurst(true);
        setDebugLog(prev => [...prev.slice(-4), 'FII → THROMBIN BURST!']);
        setHeldFactor(null);
        return;
      }
    }

    // Return to floating in bloodstream
    addFloatingFactor({
      ...heldFactor.originalFloatingFactor,
      position: heldFactor.position,
      velocity: { x: 30, y: 0 },
    });

    setHeldFactor(null);
  }, [heldFactor, draggedThrombin, addFloatingFactor, tfPositions, tfDockingState, fixDockingState, fxDockingState, fvDockingState, fiiDockedState, plateletPosition, setScene, GAME_HEIGHT, state.currentScene, ampVwfSplit, ampFvActivated, ampFviiiActivated, ampFxiActivated, ampDockingPositions, propTenaseFormed, propProthrombinaseFormed, propThrombinBurst, propDockingPositions]);

  const handleFactorDock = useCallback((_factorId: string, _complexId: string): void => {
    // Placeholder for docking logic
  }, []);

  // Handle starting thrombin drag
  const handleThrombinDragStart = useCallback((fromIndex: number, event: React.MouseEvent): void => {
    setDebugLog(prev => [...prev.slice(-4), `Thrombin drag started`]);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      setDebugLog(prev => [...prev.slice(-4), `ERROR: No container`]);
      return;
    }

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setDraggedThrombin({
      fromIndex,
      position: { x, y },
    });
  }, []);

  // Handle thrombin drag (called from handleMouseMove when dragging thrombin)
  const handleThrombinDrag = useCallback((_thrombinId: string, _targetX: number, _targetY: number): void => {
    // Placeholder for compatibility - actual logic in handleMouseMove
  }, []);

  const handleArrowComplete = useCallback((arrowId: string): void => {
    removeActivationArrow(arrowId);
  }, [removeActivationArrow]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        position: 'relative',
        cursor: heldFactor || draggedThrombin ? 'grabbing' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragStart={(e) => e.preventDefault()}
    >
        {/* Render scenes directly without SceneContainer wrapper */}
        {state.currentScene === 'initiation' && (
          <InitiationScene
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            floatingFactors={state.floatingFactors}
            dockedComplexes={state.dockedComplexes}
            activationArrows={state.activationArrows}
            tfDockingState={tfDockingState}
            fixDockingState={fixDockingState}
            fxDockingState={fxDockingState}
            fvDockingState={fvDockingState}
            fiiDockedState={fiiDockedState}
            plateletPosition={plateletPosition}
            isDraggingThrombin={draggedThrombin !== null}
            onFactorCatch={handleFactorCatch}
            onFactorDock={handleFactorDock}
            onThrombinDrag={handleThrombinDrag}
            onThrombinDragStart={handleThrombinDragStart}
            onArrowComplete={handleArrowComplete}
          />
        )}

        {state.currentScene === 'amplification' && (
          <AmplificationScene
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            floatingFactors={state.floatingFactors}
            vwfSplit={ampVwfSplit}
            fvActivated={ampFvActivated}
            fviiiActivated={ampFviiiActivated}
            fxiActivated={ampFxiActivated}
            heldFactorId={heldFactor?.factorId ?? null}
            onFactorCatch={handleFactorCatch}
            onPhaseComplete={() => setScene('propagation')}
          />
        )}

        {state.currentScene === 'propagation' && (
          <PropagationScene
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            floatingFactors={state.floatingFactors}
            tenaseFormed={propTenaseFormed}
            fxaProduced={propFxaProduced}
            prothrombinaseFormed={propProthrombinaseFormed}
            thrombinBurst={propThrombinBurst}
            heldFactorId={heldFactor?.factorId ?? null}
            onFactorCatch={handleFactorCatch}
            onPhaseComplete={() => setScene('victory')}
          />
        )}

        {state.currentScene === 'victory' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#FFFFFF', background: 'linear-gradient(180deg, #7F1D1D 0%, #991B1B 100%)' }}>
            <h2 style={{ fontSize: 48, marginBottom: 20 }}>
              Clot Stabilized!
            </h2>
            <p style={{ fontSize: 18, opacity: 0.8 }}>
              You successfully built the coagulation cascade.
            </p>
          </div>
        )}

      {/* Held factor (being dragged) */}
      {heldFactor && (
        <div
          style={{
            position: 'absolute',
            left: heldFactor.position.x,
            top: heldFactor.position.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          }}
        >
          <FactorTokenNew factorId={heldFactor.factorId} />
        </div>
      )}

      {/* DEBUG: Force scene transition + log display */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 8 }}>
        <button
          onClick={() => {
            setDebugLog(prev => [...prev.slice(-4), 'Forced → Amplification']);
            setScene('amplification');
          }}
          style={{ padding: '8px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}
        >
          → Amplification
        </button>
        <button
          onClick={() => {
            setDebugLog(prev => [...prev.slice(-4), 'Forced → Propagation']);
            setScene('propagation');
          }}
          style={{ padding: '8px 16px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          → Propagation
        </button>
        <div style={{ color: '#4ADE80', fontSize: 12, marginTop: 8, fontWeight: 600 }}>
          Scene: {state.currentScene}
        </div>
        <div style={{ color: '#FCD34D', fontSize: 10, marginTop: 8, maxWidth: 200 }}>
          {debugLog.map((log, i) => (
            <div key={i}>• {log}</div>
          ))}
        </div>
      </div>

      {/* Dragged thrombin (being delivered to platelet) */}
      {draggedThrombin && (
        <div
          style={{
            position: 'absolute',
            left: draggedThrombin.position.x,
            top: draggedThrombin.position.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {/* Glowing trail effect */}
          <div
            style={{
              position: 'absolute',
              inset: -25,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'pulse 0.4s ease-in-out infinite',
            }}
          />
          <div
            style={{
              filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 1))',
            }}
          >
            <FactorTokenNew factorId="FIIa" isActive />
          </div>
        </div>
      )}
    </div>
  );
}
