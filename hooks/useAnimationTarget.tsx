// hooks/useAnimationTarget.ts
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type RefObject,
  type ReactNode,
} from 'react';

// =============================================================================
// ANIMATION TARGET REGISTRY
// =============================================================================

/**
 * Registry for animation target elements.
 * Components register their refs here so the animation controller
 * can find DOM elements by ID when executing animations.
 */
interface AnimationTargetRegistry {
  /** Register a ref for a target ID */
  register: (targetId: string, ref: RefObject<HTMLElement | null>) => void;
  /** Unregister a target ID */
  unregister: (targetId: string) => void;
  /** Get the ref for a target ID */
  getRef: (targetId: string) => RefObject<HTMLElement | null> | undefined;
  /** Get all registered target IDs */
  getTargetIds: () => string[];
}

// =============================================================================
// CONTEXT
// =============================================================================

const AnimationTargetContext = createContext<AnimationTargetRegistry | null>(null);

// =============================================================================
// PROVIDER HOOK (used internally to create registry)
// =============================================================================

/**
 * Creates an animation target registry.
 * Used by AnimationTargetProvider to create the context value.
 */
export function useAnimationTargetRegistry(): AnimationTargetRegistry {
  const registryRef = useRef<Map<string, RefObject<HTMLElement | null>>>(new Map());

  const register = useCallback(
    (targetId: string, ref: RefObject<HTMLElement | null>): void => {
      registryRef.current.set(targetId, ref);
    },
    []
  );

  const unregister = useCallback((targetId: string): void => {
    registryRef.current.delete(targetId);
  }, []);

  const getRef = useCallback(
    (targetId: string): RefObject<HTMLElement | null> | undefined => {
      return registryRef.current.get(targetId);
    },
    []
  );

  const getTargetIds = useCallback((): string[] => {
    return Array.from(registryRef.current.keys());
  }, []);

  // Return stable object reference using useMemo
  const registry = useMemo<AnimationTargetRegistry>(
    () => ({
      register,
      unregister,
      getRef,
      getTargetIds,
    }),
    [register, unregister, getRef, getTargetIds]
  );

  return registry;
}

// =============================================================================
// PROVIDER COMPONENT (for wrapping game canvas)
// =============================================================================

interface AnimationTargetProviderProps {
  children: ReactNode;
  registry: AnimationTargetRegistry;
}

/**
 * Provider component that makes the animation target registry available
 * to all child components via useAnimationTarget.
 */
export function AnimationTargetProvider({
  children,
  registry,
}: AnimationTargetProviderProps): ReactNode {
  return (
    <AnimationTargetContext.Provider value={registry}>
      {children}
    </AnimationTargetContext.Provider>
  );
}

// =============================================================================
// CONSUMER HOOK (used by components to register as targets)
// =============================================================================

/**
 * Hook for components to register themselves as animation targets.
 * The animation controller can then find DOM elements by target ID
 * when executing animations.
 *
 * @param targetId - Unique identifier for this animation target
 * @param ref - React ref pointing to the DOM element
 *
 * @example
 * function SlotComponent({ slotId }: { slotId: string }) {
 *   const slotRef = useRef<HTMLDivElement>(null);
 *   useAnimationTarget(`slot-${slotId}`, slotRef);
 *   return <div ref={slotRef}>...</div>;
 * }
 */
export function useAnimationTarget(
  targetId: string,
  ref: RefObject<HTMLElement | null>
): void {
  const registry = useContext(AnimationTargetContext);

  useEffect(() => {
    if (!registry) {
      // Silent fail if no provider - allows gradual adoption
      return;
    }

    registry.register(targetId, ref);

    return () => {
      registry.unregister(targetId);
    };
  }, [registry, targetId, ref]);
}

// =============================================================================
// UTILITY HOOK (for animation controller to access registry)
// =============================================================================

/**
 * Hook for the animation controller to access the target registry.
 * Returns null if no provider is found (allows gradual adoption).
 */
export function useAnimationTargetRegistryContext(): AnimationTargetRegistry | null {
  return useContext(AnimationTargetContext);
}

// =============================================================================
// TYPES EXPORT
// =============================================================================

export type { AnimationTargetRegistry };
