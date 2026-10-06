// Death History tracking system for Level Devil 2: Mummy's Curse
// Persists detailed death logs (level, date, timestamp, hazard cause, and troll reason) in localStorage

import { TierType } from '../types/game';

export interface DeathLogEntry {
  id: string;
  levelNumber: number;
  timestamp: number;
  reason: string; // 'spike' | 'saw' | 'smasher' | 'boss' | 'void' | etc.
  message?: string;
  tier: TierType;
  isBoss: boolean;
}

const STORAGE_KEY = 'leveldevil_death_history';
const MAX_LOG_ENTRIES = 300; // Keep up to 300 recent deaths for high performance

export function getDeathHistory(): DeathLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeathHistory(entries: DeathLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES)));
  } catch {}
}

export function recordDeath(
  levelNumber: number,
  tier: TierType,
  reason: string,
  message?: string
): DeathLogEntry[] {
  const current = getDeathHistory();
  const newEntry: DeathLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    levelNumber,
    timestamp: Date.now(),
    reason: reason || 'hazard',
    message,
    tier,
    isBoss: levelNumber % 10 === 0
  };

  // Prepend newest entry to the top
  const updated = [newEntry, ...current].slice(0, MAX_LOG_ENTRIES);
  saveDeathHistory(updated);
  return updated;
}

export function clearDeathHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export interface HazardMeta {
  labelEn: string;
  labelBn: string;
  icon: string;
  color: string;
}

export const HAZARD_INFO: Record<string, HazardMeta> = {
  spike: {
    labelEn: 'Spike Trap',
    labelBn: 'কাঁটার ফাঁদ',
    icon: '📌',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  },
  saw: {
    labelEn: 'Spinning Sawblade',
    labelBn: 'ঘূর্ণায়মান করাত',
    icon: '🪚',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  smasher: {
    labelEn: 'Crushing Rock',
    labelBn: 'পাথরের পতন',
    icon: '🗿',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  },
  boss: {
    labelEn: 'Boss Attack',
    labelBn: 'বসের আক্রমণ',
    icon: '👑',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  void: {
    labelEn: 'Abyssal Void',
    labelBn: 'অতলে পতন',
    icon: '🕳️',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
  },
  hazard: {
    labelEn: 'Lethal Hazard',
    labelBn: 'প্রাণঘাতী ফাঁদ',
    icon: '💀',
    color: 'text-red-400 bg-red-500/10 border-red-500/30'
  }
};

export function getHazardMeta(reason: string): HazardMeta {
  return HAZARD_INFO[reason] || HAZARD_INFO.hazard;
}

export function formatDeathDateTime(timestamp: number, lang: 'en' | 'bn') {
  const d = new Date(timestamp);
  const dateStr = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return { dateStr, timeStr };
}
