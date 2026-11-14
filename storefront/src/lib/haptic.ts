/**
 * Triggers hardware haptic vibration feedback on mobile devices.
 */
export function triggerHaptic(durationMs: number = 15) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore if device or permission blocks vibration
    }
  }
}
