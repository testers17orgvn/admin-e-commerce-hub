/**
 * Haptic feedback utility for mobile devices.
 * Uses the Vibration API where available.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 30, 10],
  error: [50, 30, 50, 30, 50],
  selection: 5,
};

export function haptic(style: HapticStyle = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    const pattern = PATTERNS[style];
    navigator.vibrate(pattern);
  } catch {
    // Silently fail on unsupported devices
  }
}

/**
 * Creates a click handler that triggers haptic feedback + optional callback
 */
export function withHaptic<T extends (...args: unknown[]) => void>(
  fn?: T,
  style: HapticStyle = 'light'
) {
  return (...args: Parameters<T>) => {
    haptic(style);
    fn?.(...args);
  };
}
