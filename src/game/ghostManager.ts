/**
 * Speedrunner Ghost System for Level Devil 2
 * Records player's best run trajectory per level and manages ghost replay data.
 */

export interface GhostFrame {
  x: number;
  y: number;
  facing: 'left' | 'right';
  walkFrame: number;
  grounded: boolean;
  isJumping: boolean;
}

export interface GhostRun {
  levelNumber: number;
  timeSeconds: number;
  timestamp: number;
  frames: GhostFrame[];
}

const GHOST_STORAGE_PREFIX = 'leveldevil_ghost_best_lvl_';
const GHOST_SETTINGS_KEY = 'leveldevil_ghost_mode_enabled';

/**
 * Checks if Ghost Mode is enabled in player settings (default true)
 */
export function getStoredGhostEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(GHOST_SETTINGS_KEY);
  return stored === null ? true : stored === 'true';
}

export function saveStoredGhostEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GHOST_SETTINGS_KEY, String(enabled));
}

/**
 * Retrieves the recorded personal best Ghost run for a given level
 */
export function getGhostRun(levelNumber: number): GhostRun | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${GHOST_STORAGE_PREFIX}${levelNumber}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.frames) || typeof parsed.timeSeconds !== 'number') {
      return null;
    }
    return parsed as GhostRun;
  } catch {
    return null;
  }
}

/**
 * Saves a new run if it is faster than the existing recorded ghost run (or if no ghost exists)
 * Returns true if a new Personal Best was set!
 */
export function saveGhostRunIfBest(
  levelNumber: number,
  timeSeconds: number,
  frames: GhostFrame[]
): boolean {
  if (typeof window === 'undefined' || frames.length === 0) return false;

  const existing = getGhostRun(levelNumber);
  const isNewBest = !existing || timeSeconds < existing.timeSeconds;

  if (isNewBest) {
    try {
      // Downsample to max 600 frames if run is very long, maintaining smooth 30-60 fps representation
      const sampleStride = frames.length > 800 ? Math.ceil(frames.length / 600) : 1;
      const optimizedFrames: GhostFrame[] = [];

      for (let i = 0; i < frames.length; i += sampleStride) {
        const f = frames[i];
        optimizedFrames.push({
          x: Math.round(f.x * 10) / 10,
          y: Math.round(f.y * 10) / 10,
          facing: f.facing,
          walkFrame: Math.round(f.walkFrame * 10) / 10,
          grounded: f.grounded,
          isJumping: f.isJumping
        });
      }

      // Always include final frame at door
      if (optimizedFrames[optimizedFrames.length - 1] !== frames[frames.length - 1]) {
        const last = frames[frames.length - 1];
        optimizedFrames.push({
          x: Math.round(last.x * 10) / 10,
          y: Math.round(last.y * 10) / 10,
          facing: last.facing,
          walkFrame: Math.round(last.walkFrame * 10) / 10,
          grounded: last.grounded,
          isJumping: last.isJumping
        });
      }

      const ghostData: GhostRun = {
        levelNumber,
        timeSeconds: Math.round(timeSeconds * 100) / 100,
        timestamp: Date.now(),
        frames: optimizedFrames
      };

      localStorage.setItem(`${GHOST_STORAGE_PREFIX}${levelNumber}`, JSON.stringify(ghostData));
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Removes the recorded ghost run for a level
 */
export function clearGhostRun(levelNumber: number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${GHOST_STORAGE_PREFIX}${levelNumber}`);
}
