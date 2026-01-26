// hooks/useTwoFrameState.ts
// DEPRECATED: This file is maintained for backward compatibility.
// Please use useCascadeState.ts for new code.

// Re-export everything from the new educational hook
export * from './useCascadeState';

// Explicit re-exports for commonly used items
export {
  useCascadeState as useTwoFrameState,
  type CascadeState as TwoFrameState,
  type CascadeStateHook as TwoFrameStateHook,
  type InitiationState as SparkState,
  type PlateletSurfaceState as ExplosionState,
  type PlateletPhase as ExplosionPhase,
} from './useCascadeState';
