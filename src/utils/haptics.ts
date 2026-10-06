/**
 * Mobile Haptic Vibration System for Level Devil 2
 * Provides responsive tactile feedback on mobile devices via the HTML5 Vibration API.
 */

const VIBRATION_STORAGE_KEY = 'leveldevil_vibration_enabled';

export function isVibrationSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function getStoredVibrationSetting(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(VIBRATION_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

export function saveVibrationSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VIBRATION_STORAGE_KEY, String(enabled));
}

export const haptics = {
  /**
   * Powerful death vibration pattern: initial heavy impact (140ms), brief shock pause (50ms),
   * followed by an intense sustained death rumble (240ms).
   */
  death: (enabled = true) => {
    if (!enabled || !isVibrationSupported()) return;
    try {
      navigator.vibrate([140, 50, 240]);
    } catch {
      // Ignore if device restricts vibration or permission not granted
    }
  },

  /**
   * Light tactile tap (25ms) for button presses or UI interactions
   */
  light: (enabled = true) => {
    if (!enabled || !isVibrationSupported()) return;
    try {
      navigator.vibrate(25);
    } catch {
      // Ignore
    }
  },

  /**
   * Trap trigger alert vibration (e.g. runaway door or falling rock warning)
   */
  trapWarning: (enabled = true) => {
    if (!enabled || !isVibrationSupported()) return;
    try {
      navigator.vibrate([60, 40, 80]);
    } catch {
      // Ignore
    }
  }
};
