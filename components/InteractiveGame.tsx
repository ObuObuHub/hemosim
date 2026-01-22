// components/InteractiveGame.tsx
'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useSceneState } from '@/hooks/useSceneState';
import { InitiationScene, AmplificationScene, PropagationScene, StabilizationScene } from '@/components/game/scenes';
import { FactorTokenNew } from '@/components/game/tokens/FactorTokenNew';
import type { FloatingFactor } from '@/types/game';

interface HeldFactor {
  id: string;
  factorId: string;
  originalFloatingFactor: FloatingFactor;
  position: { x: number; y: number };
}

interface InteractiveGameProps {
  className?: string;
}

/**
 * Interactive coagulation cascade game component
 * TEXTBOOK FIRST, GAMIFICATION SECOND
 * Can be embedded in any container (uses container dimensions, not viewport)
 */
export function InteractiveGame({ className }: InteractiveGameProps): ReactElement {
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

  // Refs for game loop to avoid dependency array issues
  const floatingFactorsRef = useRef(state.floatingFactors);
  const updateFloatingFactorsRef = useRef(updateFloatingFactors);

  // Container dimensions (responsive to parent size)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    // Also observe container size changes
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Keep refs in sync with state (for game loop)
  useEffect(() => {
    floatingFactorsRef.current = state.floatingFactors;
  }, [state.floatingFactors]);
  useEffect(() => {
    updateFloatingFactorsRef.current = updateFloatingFactors;
  }, [updateFloatingFactors]);

  const GAME_WIDTH = dimensions.width;
  const GAME_HEIGHT = dimensions.height;
  const gameWidthRef = useRef(GAME_WIDTH);
  useEffect(() => {
    gameWidthRef.current = GAME_WIDTH;
  }, [GAME_WIDTH]);

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

  // Check for scene transition (objectives-based)
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
    0: false, 1: false, 2: false,
  });

  // Track which TF+VIIa complexes have FIX docked (activated to FIXa)
  const [fixDockingState, setFixDockingState] = useState<Record<number, boolean>>({
    0: false, 1: false, 2: false,
  });

  // Track which TF+VIIa complexes have FX docked (activated to FXa)
  const [fxDockingState, setFxDockingState] = useState<Record<number, boolean>>({
    0: false, 1: false, 2: false,
  });

  // Track which complexes have FV docked (forms Prothrombinase with FXa!)
  const [fvDockingState, setFvDockingState] = useState<Record<number, boolean>>({
    0: false, 1: false, 2: false,
  });

  // Track FII docked to Prothrombinase (converts to Thrombin!)
  const [fiiDockedState, setFiiDockedState] = useState<Record<number, boolean>>({
    0: false, 1: false, 2: false,
  });

  // Track dragged thrombin for delivering to platelet
  const [draggedThrombin, setDraggedThrombin] = useState<{
    fromIndex: number;
    position: { x: number; y: number };
  } | null>(null);

  // Debug log for on-screen display
  const [debugLog, setDebugLog] = useState<string[]>(['Game started']);

  // AMPLIFICATION PHASE STATE
  const [ampVwfSplit, setAmpVwfSplit] = useState(false);
  const [ampFvActivated, setAmpFvActivated] = useState(false);
  const [ampFviiiActivated, setAmpFviiiActivated] = useState(false);
  const [ampFxiActivated, setAmpFxiActivated] = useState(false);

  const ampMembraneY = GAME_HEIGHT * 0.75;
  const ampDockingPositions = useMemo(() => ({
    vwf: { x: GAME_WIDTH * 0.7, y: ampMembraneY - 60 },
    fviii: { x: GAME_WIDTH * 0.7, y: ampMembraneY - 60 },
    fv: { x: GAME_WIDTH * 0.3, y: ampMembraneY - 50 },
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

  // PROPAGATION PHASE STATE
  const [propTenaseFormed, setPropTenaseFormed] = useState(false);
  const [propFxaProduced, setPropFxaProduced] = useState(false);
  const [propProthrombinaseFormed, setPropProthrombinaseFormed] = useState(false);
  const [propThrombinBurst, setPropThrombinBurst] = useState(false);

  const propMembraneY = GAME_HEIGHT * 0.75;
  // Aligned with PropagationScene ghost slot positions
  const propDockingPositions = useMemo(() => ({
    fixa: { x: GAME_WIDTH * 0.22 - 70, y: propMembraneY - 60 },
    fii: { x: GAME_WIDTH * 0.78 - 22, y: propMembraneY - 70 },
  }), [GAME_WIDTH, propMembraneY]);

  // Auto-produce FXa after Tenase forms
  useEffect(() => {
    if (propTenaseFormed && !propFxaProduced) {
      const timer = setTimeout(() => {
        setPropFxaProduced(true);
        setDebugLog(prev => [...prev.slice(-4), 'Tenase → FXa produced!']);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [propTenaseFormed, propFxaProduced]);

  // Auto-form Prothrombinase when FXa is produced
  useEffect(() => {
    if (propFxaProduced && !propProthrombinaseFormed) {
      const timer = setTimeout(() => {
        setPropProthrombinaseFormed(true);
        setDebugLog(prev => [...prev.slice(-4), 'FXa + FVa → Prothrombinase!']);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [propFxaProduced, propProthrombinaseFormed]);

  // Check for propagation phase completion
  useEffect(() => {
    if (state.currentScene === 'propagation' && propThrombinBurst) {
      setDebugLog(prev => [...prev.slice(-4), 'THROMBIN BURST! → Stabilization']);
      setTimeout(() => setScene('stabilization'), 2000);
    }
  }, [state.currentScene, propThrombinBurst, setScene]);

  // STABILIZATION PHASE STATE
  const [stabFibrinCount, setStabFibrinCount] = useState(0);
  const [stabFxiiiActivated, setStabFxiiiActivated] = useState(false);
  const [stabMeshCrosslinked, setStabMeshCrosslinked] = useState(false);

  const stabMembraneY = GAME_HEIGHT * 0.75;
  const stabDockingPositions = useMemo(() => ({
    fibrinogen: { x: GAME_WIDTH * 0.5, y: stabMembraneY - 80 },
    fxiii: { x: GAME_WIDTH * 0.7, y: stabMembraneY - 60 },
  }), [GAME_WIDTH, stabMembraneY]);

  // Auto-crosslink mesh when FXIIIa activates
  useEffect(() => {
    if (stabFxiiiActivated && !stabMeshCrosslinked) {
      const timer = setTimeout(() => {
        setStabMeshCrosslinked(true);
        setDebugLog(prev => [...prev.slice(-4), 'FXIIIa crosslinks fibrin!']);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [stabFxiiiActivated, stabMeshCrosslinked]);

  // Check for stabilization phase completion
  useEffect(() => {
    if (state.currentScene === 'stabilization' && stabMeshCrosslinked) {
      setDebugLog(prev => [...prev.slice(-4), 'STABLE CLOT! → Victory']);
      setTimeout(() => setScene('victory'), 2000);
    }
  }, [state.currentScene, stabMeshCrosslinked, setScene]);

  // Platelet position for collision detection
  const plateletPosition = useMemo(() => ({
    x: GAME_WIDTH / 2,
    y: 60,
    width: 180,
    height: 70,
  }), [GAME_WIDTH]);

  // TF positions
  const tfPositions = useMemo(() => [
    { x: GAME_WIDTH * 0.2, index: 0 },
    { x: GAME_WIDTH * 0.5, index: 1 },
    { x: GAME_WIDTH * 0.8, index: 2 },
  ], [GAME_WIDTH]);

  // Spawn floating factors for initiation
  useEffect(() => {
    if (state.currentScene !== 'initiation') return;

    const spawnFactor = (): void => {
      const pool: string[] = [];
      const hasTFVIIa = Object.values(tfDockingState).some(v => v);
      const hasFXa = Object.values(fxDockingState).some(v => v);
      const hasProthrombinase = Object.values(fvDockingState).some(v => v);
      const needsMoreTFVIIa = Object.values(tfDockingState).filter(v => !v).length > 0;
      const needsMoreFXa = Object.values(fxDockingState).filter(v => !v).length > 0;
      const needsMoreProthrombinase = Object.values(fvDockingState).filter(v => !v).length > 0;
      const needsThrombin = Object.values(fiiDockedState).filter(v => !v).length > 0;

      if (needsMoreTFVIIa) pool.push('FVII', 'FVII', 'FVII');
      if (hasTFVIIa) {
        pool.push('FIX', 'FIX');
        if (needsMoreFXa) pool.push('FX', 'FX', 'FX');
      }
      if (hasFXa && needsMoreProthrombinase) pool.push('FV', 'FV', 'FV');
      if (hasProthrombinase && needsThrombin) pool.push('FII', 'FII', 'FII', 'FII');
      if (pool.length === 0) pool.push('FVII');

      const factorId = pool[Math.floor(Math.random() * pool.length)];
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

    spawnFactor();
    const interval = setInterval(spawnFactor, 2000);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor, GAME_HEIGHT, tfDockingState, fxDockingState, fvDockingState, fiiDockedState]);

  // Spawn floating thrombin for AMPLIFICATION phase
  useEffect(() => {
    if (state.currentScene !== 'amplification') return;

    const spawnThrombin = (): void => {
      const needsMore = !ampVwfSplit || !ampFvActivated || !ampFviiiActivated || !ampFxiActivated;
      if (!needsMore) return;

      const bloodstreamHeight = GAME_HEIGHT * 0.75;
      const factor: FloatingFactor = {
        id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        factorId: 'FIIa',
        position: { x: -50, y: 100 + Math.random() * (bloodstreamHeight - 200) },
        velocity: { x: 40 + Math.random() * 20, y: (Math.random() - 0.5) * 15 },
        isVulnerableTo: [],
      };
      addFloatingFactor(factor);
    };

    spawnThrombin();
    const interval = setInterval(spawnThrombin, 2500);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor, GAME_HEIGHT, ampVwfSplit, ampFvActivated, ampFviiiActivated, ampFxiActivated]);

  // Spawn floating factors for PROPAGATION phase
  useEffect(() => {
    if (state.currentScene !== 'propagation') return;

    const spawnFactor = (): void => {
      const bloodstreamHeight = GAME_HEIGHT * 0.75;

      if (!propTenaseFormed) {
        const factor: FloatingFactor = {
          id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          factorId: 'FIXa',
          position: { x: -50, y: 100 + Math.random() * (bloodstreamHeight - 200) },
          velocity: { x: 35 + Math.random() * 20, y: (Math.random() - 0.5) * 15 },
          isVulnerableTo: [],
        };
        addFloatingFactor(factor);
        return;
      }

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

    spawnFactor();
    const interval = setInterval(spawnFactor, 2000);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor, GAME_HEIGHT, propTenaseFormed, propProthrombinaseFormed, propThrombinBurst]);

  // Spawn floating factors for STABILIZATION phase
  useEffect(() => {
    if (state.currentScene !== 'stabilization') return;

    const spawnFactor = (): void => {
      const bloodstreamHeight = GAME_HEIGHT * 0.75;

      if (stabFibrinCount < 3) {
        const factor: FloatingFactor = {
          id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          factorId: 'Fibrinogen',
          position: { x: -50, y: 100 + Math.random() * (bloodstreamHeight - 200) },
          velocity: { x: 25 + Math.random() * 15, y: (Math.random() - 0.5) * 10 },
          isVulnerableTo: [],
        };
        addFloatingFactor(factor);
        return;
      }

      if (!stabFxiiiActivated) {
        const factor: FloatingFactor = {
          id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          factorId: 'FXIII',
          position: { x: -50, y: 100 + Math.random() * (bloodstreamHeight - 200) },
          velocity: { x: 30 + Math.random() * 15, y: (Math.random() - 0.5) * 10 },
          isVulnerableTo: [],
        };
        addFloatingFactor(factor);
      }
    };

    spawnFactor();
    const interval = setInterval(spawnFactor, 2000);
    return () => clearInterval(interval);
  }, [state.currentScene, addFloatingFactor, GAME_HEIGHT, stabFibrinCount, stabFxiiiActivated]);

  // Game loop for factor movement - uses refs to avoid dependency array issues
  useEffect(() => {
    const gameLoop = (timestamp: number): void => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      // Use refs to get current values without causing effect re-runs
      const currentFactors = floatingFactorsRef.current;
      const currentGameWidth = gameWidthRef.current;

      const updatedFactors = currentFactors
        .map((factor) => ({
          ...factor,
          position: {
            x: factor.position.x + factor.velocity.x * deltaTime,
            y: factor.position.y + factor.velocity.y * deltaTime,
          },
        }))
        .filter((factor) => factor.position.x < currentGameWidth + 100);

      if (updatedFactors.length !== currentFactors.length ||
          updatedFactors.some((f, i) => f.position.x !== currentFactors[i]?.position.x)) {
        updateFloatingFactorsRef.current(updatedFactors);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []); // Empty dependency array - uses refs for all values

  // Unified position extraction from mouse or touch events
  const getEventPosition = useCallback((event: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    let clientX: number;
    let clientY: number;

    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('changedTouches' in event && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return null;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // Handlers
  const handleFactorCatch = useCallback((factorId: string, event: React.MouseEvent | React.TouchEvent): void => {
    event.preventDefault();
    const floatingFactor = state.floatingFactors.find(f => f.id === factorId);
    if (!floatingFactor) return;

    const position = getEventPosition(event);
    if (!position) return;

    setHeldFactor({
      id: floatingFactor.id,
      factorId: floatingFactor.factorId,
      originalFloatingFactor: floatingFactor,
      position,
    });
    removeFloatingFactor(factorId);
  }, [state.floatingFactors, removeFloatingFactor, getEventPosition]);

  const handleMove = useCallback((event: React.MouseEvent | React.TouchEvent): void => {
    if (!heldFactor && !draggedThrombin) return;

    const position = getEventPosition(event);
    if (!position) return;

    if (heldFactor) {
      setHeldFactor(prev => prev ? { ...prev, position } : null);
    }

    if (draggedThrombin) {
      setDraggedThrombin(prev => prev ? { ...prev, position } : null);
    }
  }, [heldFactor, draggedThrombin, getEventPosition]);

  const handleEnd = useCallback((): void => {
    // Handle thrombin drop on platelet
    if (draggedThrombin) {
      const dropX = draggedThrombin.position.x;
      const dropY = draggedThrombin.position.y;
      const plateletCenterX = plateletPosition.x;
      const isOnPlatelet = dropX > plateletCenterX - 150 && dropX < plateletCenterX + 150 && dropY < 180;

      setDebugLog(prev => [...prev.slice(-4), `Drop: y=${Math.round(dropY)}, onPlt=${isOnPlatelet}`]);

      if (isOnPlatelet) {
        setDebugLog(prev => [...prev.slice(-4), `SUCCESS! Going to Amplification...`]);
        setTimeout(() => setScene('amplification'), 800);
      } else {
        setDebugLog(prev => [...prev.slice(-4), `Miss - drop on platelet (top area)`]);
      }

      setDraggedThrombin(null);
      return;
    }

    if (!heldFactor) return;

    const membraneY = GAME_HEIGHT * 0.75;
    const dropX = heldFactor.position.x;
    const dropY = heldFactor.position.y;

    // FVII docking to TF
    if (heldFactor.factorId === 'FVII') {
      for (const tf of tfPositions) {
        if (Math.abs(dropX - tf.x) < 80 && dropY > membraneY - 100 && dropY < membraneY + 50 && !tfDockingState[tf.index]) {
          setTfDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // FIX docking to TF+VIIa
    if (heldFactor.factorId === 'FIX') {
      for (const tf of tfPositions) {
        if (tfDockingState[tf.index] && !fixDockingState[tf.index] &&
            Math.abs(dropX - (tf.x - 50)) < 60 && dropY > membraneY - 100 && dropY < membraneY + 50) {
          setFixDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // FX docking to TF+VIIa
    if (heldFactor.factorId === 'FX') {
      for (const tf of tfPositions) {
        if (tfDockingState[tf.index] && !fxDockingState[tf.index] &&
            Math.abs(dropX - (tf.x + 60)) < 60 && dropY > membraneY - 100 && dropY < membraneY + 50) {
          setFxDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // FV docking to form Prothrombinase
    if (heldFactor.factorId === 'FV') {
      for (const tf of tfPositions) {
        if (fxDockingState[tf.index] && !fvDockingState[tf.index] &&
            Math.abs(dropX - (tf.x + 95)) < 70 && dropY > membraneY - 120 && dropY < membraneY + 50) {
          setFvDockingState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // FII docking to Prothrombinase
    if (heldFactor.factorId === 'FII') {
      for (const tf of tfPositions) {
        if (fvDockingState[tf.index] && !fiiDockedState[tf.index] &&
            Math.abs(dropX - (tf.x + 145)) < 80 && dropY > membraneY - 150 && dropY < membraneY + 50) {
          setFiiDockedState(prev => ({ ...prev, [tf.index]: true }));
          setHeldFactor(null);
          return;
        }
      }
    }

    // AMPLIFICATION PHASE DOCKING
    if (state.currentScene === 'amplification' && heldFactor.factorId === 'FIIa') {
      if (!ampVwfSplit && Math.abs(dropX - ampDockingPositions.vwf.x) < 80 && Math.abs(dropY - ampDockingPositions.vwf.y) < 60) {
        setAmpVwfSplit(true);
        setDebugLog(prev => [...prev.slice(-4), 'vWF-FVIII split!']);
        setHeldFactor(null);
        return;
      }
      if (ampVwfSplit && !ampFviiiActivated && Math.abs(dropX - ampDockingPositions.fviii.x) < 60 && Math.abs(dropY - ampDockingPositions.fviii.y) < 60) {
        setAmpFviiiActivated(true);
        setDebugLog(prev => [...prev.slice(-4), 'FVIII → FVIIIa!']);
        setHeldFactor(null);
        return;
      }
      if (!ampFvActivated && Math.abs(dropX - ampDockingPositions.fv.x) < 60 && Math.abs(dropY - ampDockingPositions.fv.y) < 60) {
        setAmpFvActivated(true);
        setDebugLog(prev => [...prev.slice(-4), 'FV → FVa!']);
        setHeldFactor(null);
        return;
      }
      if (!ampFxiActivated && Math.abs(dropX - ampDockingPositions.fxi.x) < 60 && Math.abs(dropY - ampDockingPositions.fxi.y) < 60) {
        setAmpFxiActivated(true);
        setDebugLog(prev => [...prev.slice(-4), 'FXI → FXIa!']);
        setHeldFactor(null);
        return;
      }
    }

    // PROPAGATION PHASE DOCKING
    if (state.currentScene === 'propagation') {
      if (heldFactor.factorId === 'FIXa' && !propTenaseFormed &&
          Math.abs(dropX - propDockingPositions.fixa.x) < 70 && Math.abs(dropY - propDockingPositions.fixa.y) < 60) {
        setPropTenaseFormed(true);
        setDebugLog(prev => [...prev.slice(-4), 'FIXa + FVIIIa → TENASE!']);
        setHeldFactor(null);
        return;
      }
      if (heldFactor.factorId === 'FII' && propProthrombinaseFormed && !propThrombinBurst &&
          Math.abs(dropX - propDockingPositions.fii.x) < 70 && Math.abs(dropY - propDockingPositions.fii.y) < 60) {
        setPropThrombinBurst(true);
        setDebugLog(prev => [...prev.slice(-4), 'FII → THROMBIN BURST!']);
        setHeldFactor(null);
        return;
      }
    }

    // STABILIZATION PHASE DOCKING
    if (state.currentScene === 'stabilization') {
      if (heldFactor.factorId === 'Fibrinogen' && stabFibrinCount < 3 &&
          Math.abs(dropX - stabDockingPositions.fibrinogen.x) < 80 && Math.abs(dropY - stabDockingPositions.fibrinogen.y) < 70) {
        setStabFibrinCount(prev => prev + 1);
        setDebugLog(prev => [...prev.slice(-4), `Fibrinogen → Fibrin (${stabFibrinCount + 1}/3)`]);
        setHeldFactor(null);
        return;
      }
      if (heldFactor.factorId === 'FXIII' && stabFibrinCount >= 3 && !stabFxiiiActivated &&
          Math.abs(dropX - stabDockingPositions.fxiii.x) < 70 && Math.abs(dropY - stabDockingPositions.fxiii.y) < 60) {
        setStabFxiiiActivated(true);
        setDebugLog(prev => [...prev.slice(-4), 'FXIII → FXIIIa!']);
        setHeldFactor(null);
        return;
      }
    }

    // Return to floating
    addFloatingFactor({
      ...heldFactor.originalFloatingFactor,
      position: heldFactor.position,
      velocity: { x: 30, y: 0 },
    });
    setHeldFactor(null);
  }, [heldFactor, draggedThrombin, addFloatingFactor, tfPositions, tfDockingState, fixDockingState, fxDockingState, fvDockingState, fiiDockedState, plateletPosition, setScene, GAME_HEIGHT, state.currentScene, ampVwfSplit, ampFvActivated, ampFviiiActivated, ampFxiActivated, ampDockingPositions, propTenaseFormed, propProthrombinaseFormed, propThrombinBurst, propDockingPositions, stabFibrinCount, stabFxiiiActivated, stabDockingPositions]);

  const handleFactorDock = useCallback((_factorId: string, _complexId: string): void => {}, []);

  const handleThrombinDragStart = useCallback((fromIndex: number, event: React.MouseEvent | React.TouchEvent): void => {
    event.preventDefault();
    setDebugLog(prev => [...prev.slice(-4), `Thrombin drag started`]);
    const position = getEventPosition(event);
    if (!position) return;
    setDraggedThrombin({ fromIndex, position });
  }, [getEventPosition]);

  const handleThrombinDrag = useCallback((_thrombinId: string, _targetX: number, _targetY: number): void => {}, []);

  const handleArrowComplete = useCallback((arrowId: string): void => {
    removeActivationArrow(arrowId);
  }, [removeActivationArrow]);

  // Reset game function
  const resetGame = useCallback((): void => {
    setScene('initiation');
    setTfDockingState({ 0: false, 1: false, 2: false });
    setFixDockingState({ 0: false, 1: false, 2: false });
    setFxDockingState({ 0: false, 1: false, 2: false });
    setFvDockingState({ 0: false, 1: false, 2: false });
    setFiiDockedState({ 0: false, 1: false, 2: false });
    setAmpVwfSplit(false);
    setAmpFvActivated(false);
    setAmpFviiiActivated(false);
    setAmpFxiActivated(false);
    setPropTenaseFormed(false);
    setPropFxaProduced(false);
    setPropProthrombinaseFormed(false);
    setPropThrombinBurst(false);
    setStabFibrinCount(0);
    setStabFxiiiActivated(false);
    setStabMeshCrosslinked(false);
    updateFloatingFactors([]);
    setDebugLog(['Game reset']);
  }, [setScene, updateFloatingFactors]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        position: 'relative',
        cursor: heldFactor || draggedThrombin ? 'grabbing' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onDragStart={(e) => e.preventDefault()}
    >
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
          onPhaseComplete={() => setScene('stabilization')}
        />
      )}

      {state.currentScene === 'stabilization' && (
        <StabilizationScene
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          floatingFactors={state.floatingFactors}
          fibrinCount={stabFibrinCount}
          fxiiiActivated={stabFxiiiActivated}
          meshCrosslinked={stabMeshCrosslinked}
          heldFactorId={heldFactor?.factorId ?? null}
          onFactorCatch={handleFactorCatch}
          onPhaseComplete={() => setScene('victory')}
        />
      )}

      {state.currentScene === 'victory' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#FFFFFF', background: 'linear-gradient(180deg, #7F1D1D 0%, #991B1B 100%)' }}>
          <h2 style={{ fontSize: 48, marginBottom: 20 }}>Clot Stabilized!</h2>
          <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 30 }}>You successfully built the coagulation cascade.</p>
          <button
            onClick={resetGame}
            style={{ padding: '12px 24px', background: '#FFFFFF', color: '#991B1B', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Held factor */}
      {heldFactor && (
        <div style={{ position: 'absolute', left: heldFactor.position.x, top: heldFactor.position.y, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 100, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
          <FactorTokenNew factorId={heldFactor.factorId} />
        </div>
      )}

      {/* Debug panel - hidden on mobile */}
      <div className="hidden md:block" style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 8 }}>
        <button onClick={() => { setAmpVwfSplit(false); setAmpFvActivated(false); setAmpFviiiActivated(false); setAmpFxiActivated(false); updateFloatingFactors([]); setDebugLog(prev => [...prev.slice(-4), 'Forced → Amplification (reset)']); setScene('amplification'); }} style={{ padding: '6px 12px', background: '#EAB308', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4, fontSize: 11 }}>Amp</button>
        <button onClick={() => { setPropTenaseFormed(false); setPropFxaProduced(false); setPropProthrombinaseFormed(false); setPropThrombinBurst(false); updateFloatingFactors([]); setDebugLog(prev => [...prev.slice(-4), 'Forced → Propagation (reset)']); setScene('propagation'); }} style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4, fontSize: 11 }}>Prop</button>
        <button onClick={() => { setStabFibrinCount(0); setStabFxiiiActivated(false); setStabMeshCrosslinked(false); updateFloatingFactors([]); setDebugLog(prev => [...prev.slice(-4), 'Forced → Stabilization (reset)']); setScene('stabilization'); }} style={{ padding: '6px 12px', background: '#22C55E', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Stab</button>
        <div style={{ color: '#4ADE80', fontSize: 12, marginTop: 8, fontWeight: 600 }}>Scene: {state.currentScene}</div>
        <div style={{ color: '#FCD34D', fontSize: 10, marginTop: 8, maxWidth: 200 }}>{debugLog.map((log, i) => <div key={i}>• {log}</div>)}</div>
      </div>

      {/* Dragged thrombin */}
      {draggedThrombin && (
        <div style={{ position: 'absolute', left: draggedThrombin.position.x, top: draggedThrombin.position.y, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: -25, background: 'radial-gradient(circle, rgba(153, 27, 27, 0.9) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse 0.4s ease-in-out infinite' }} />
          <div style={{ filter: 'drop-shadow(0 0 20px rgba(153, 27, 27, 1))' }}>
            <FactorTokenNew factorId="FIIa" isActive />
          </div>
        </div>
      )}
    </div>
  );
}
