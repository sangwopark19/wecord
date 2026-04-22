import { useRef, useState, useCallback } from 'react';

/**
 * Pure shallow-compare check exported separately so tests can exercise the
 * dirty-detection contract without spinning up @testing-library/react-native
 * (which has a strict react-test-renderer peer pin).
 */
export function shallowDirty<T extends Record<string, unknown>>(initial: T, current: T): boolean {
  return (Object.keys(initial) as (keyof T)[]).some(
    (key) => !Object.is(current[key], initial[key])
  );
}

/**
 * Lightweight dirty-state tracker for forms.
 * Compares the current value bag against a snapshot of the initial value bag
 * via shallow Object.is. `reset()` re-baselines the snapshot to current.
 */
export function useDirtyState<T extends Record<string, unknown>>(initial: T) {
  const initialRef = useRef<T>(initial);
  const [current, setCurrent] = useState<T>(initial);

  const isDirty = shallowDirty(initialRef.current, current);

  const reset = useCallback(() => {
    initialRef.current = current;
  }, [current]);

  return { current, setCurrent, isDirty, reset };
}
