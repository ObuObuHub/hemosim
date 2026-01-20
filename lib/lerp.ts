// lib/lerp.ts
'use strict';

/**
 * Linear interpolation between two values.
 * @param current - The current value
 * @param target - The target value to interpolate toward
 * @param factor - Interpolation factor (0-1), higher = faster approach
 * @returns The interpolated value
 */
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

/**
 * Clamps a value between min and max bounds.
 * @param value - The value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Checks if current value is close enough to target (for stopping animations).
 * @param current - The current value
 * @param target - The target value
 * @param epsilon - Threshold for "close enough" (default 0.01)
 * @returns true if current is within epsilon of target
 */
export function isApproximatelyEqual(
  current: number,
  target: number,
  epsilon: number = 0.01
): boolean {
  return Math.abs(current - target) < epsilon;
}
