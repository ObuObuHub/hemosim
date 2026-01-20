// lib/event-priority.ts
'use strict';

/**
 * Event priority utilities - re-exports core functions from types/game-events.ts
 * and adds sorting helpers for the animation queue.
 */

import type { GameEvent } from '@/types/game-events';
import {
  type EventPriority,
  getEventPriority,
  isCriticalEvent,
  isStandardEvent,
  isLowPriorityEvent,
} from '@/types/game-events';

// Re-export core priority functions
export {
  type EventPriority,
  getEventPriority,
  isCriticalEvent,
  isStandardEvent,
  isLowPriorityEvent,
};

/**
 * Priority weights for sorting (lower number = higher priority, processed first)
 */
const PRIORITY_WEIGHT: Record<EventPriority, number> = {
  critical: 0,
  standard: 1,
  low: 2,
};

/**
 * Sorts events by priority (critical first, then standard, then low).
 * Maintains relative order within same priority level (stable sort).
 * @param events - Array of game events to sort
 * @returns New array sorted by priority
 */
export function sortByPriority(events: GameEvent[]): GameEvent[] {
  // Use spread to avoid mutating original array
  return [...events].sort((a, b) => {
    const aPriority = PRIORITY_WEIGHT[getEventPriority(a)];
    const bPriority = PRIORITY_WEIGHT[getEventPriority(b)];
    return aPriority - bPriority;
  });
}

/**
 * Checks if any event in the array is critical priority.
 * Used to determine if fast-forward mode should be enabled.
 * @param events - Array of game events
 * @returns true if any event is critical
 */
export function hasCriticalEvent(events: GameEvent[]): boolean {
  return events.some((event) => isCriticalEvent(event));
}

/**
 * Partitions events by priority level.
 * Useful for batch processing different priority levels differently.
 * @param events - Array of game events
 * @returns Object with critical, standard, and low arrays
 */
export function partitionByPriority(events: GameEvent[]): {
  critical: GameEvent[];
  standard: GameEvent[];
  low: GameEvent[];
} {
  const result: {
    critical: GameEvent[];
    standard: GameEvent[];
    low: GameEvent[];
  } = {
    critical: [],
    standard: [],
    low: [],
  };

  for (const event of events) {
    const priority = getEventPriority(event);
    result[priority].push(event);
  }

  return result;
}
