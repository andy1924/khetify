import { AccessibilityInfo, Easing } from 'react-native';
import { useSyncExternalStore } from 'react';

/**
 * Shared motion budget for the Khetify UI.
 *
 * Everything here runs on the native animation thread (`useNativeDriver`) and
 * stays short: press feedback is felt immediately, panel transitions finish
 * before the eye starts waiting. Durations are deliberately in the 90–220ms
 * band so navigation reads as responsive rather than animated.
 */
export const motion = {
  /** Press-down scale/opacity settle. */
  press: 90,
  /** Release back to rest. */
  release: 140,
  /** Bottom sheet slide in. */
  sheetIn: 220,
  /** Bottom sheet slide out (slightly quicker than in). */
  sheetOut: 170,
  /** Pressed scale for full-width actions and icon squares. */
  pressScale: 0.97,
  /** Pressed opacity for controls where scale would shift layout. */
  pressOpacity: 0.86,
  toggleSpring: { damping: 18, stiffness: 220, mass: 0.7 } as const,
  easing: {
    out: Easing.out(Easing.cubic),
    in: Easing.in(Easing.cubic),
  },
} as const;

/* ------------------------------------------------------------------ */
/* Reduced motion                                                      */
/* ------------------------------------------------------------------ */

/**
 * One app-wide reduced-motion store.
 *
 * Reanimated's `useReducedMotion` only reads the value at startup. A single
 * module-level subscription (shared by every Button, Toggle and tab) keeps the
 * value live without each instance registering its own native listener, and
 * `useSyncExternalStore` gives components a cheap, allocation-free read.
 */
let reduceMotion = false;
let nativeSubscription: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

function publish(next: boolean) {
  if (next === reduceMotion) return;
  reduceMotion = next;
  listeners.forEach(listener => listener());
}

function startNativeSubscription() {
  if (nativeSubscription) return;
  AccessibilityInfo.isReduceMotionEnabled()
    .then(publish)
    .catch(() => {
      // Keep the current value if the platform refuses the read (web/older hosts).
    });
  nativeSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', publish);
}

function stopNativeSubscription() {
  nativeSubscription?.remove();
  nativeSubscription = null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startNativeSubscription();
  return () => {
    listeners.delete(listener);
    // Drop the native listener once the last consumer goes away.
    if (listeners.size === 0) stopNativeSubscription();
  };
}

const getSnapshot = () => reduceMotion;

/** Live system "reduce motion" preference, shared app-wide. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
