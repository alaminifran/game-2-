// Achievements System for Level Devil 2: Mummy's Curse
// Tracks player milestones, boss victories, death milestones, speedruns, and special feats.

import { Platform, TrapType } from '../types/game';

export type AchievementCategory = 'milestone' | 'boss' | 'deaths' | 'speed' | 'skills';

export interface Achievement {
  id: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  icon: string;
  category: AchievementCategory;
  points: number;
}

export interface UnlockedAchievementRecord {
  unlockedAt: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    titleEn: 'First Steps',
    titleBn: 'প্রথম পদক্ষেপ',
    descEn: 'Escape Level 1 and taste freedom.',
    descBn: 'লেভেল ১ সফলভাবে পার করে স্বাধীনতার স্বাদ গ্রহণ করুন।',
    icon: '👣',
    category: 'milestone',
    points: 10
  },
  {
    id: 'speedrun_lvl1',
    titleEn: 'Speedrun Level 1',
    titleBn: 'স্পিডরান লেভেল ১',
    descEn: 'Beat Level 1 in under 6.0 seconds!',
    descBn: '৬.০ সেকেন্ডের কম সময়ে লেভেল ১ সম্পূর্ণ করুন!',
    icon: '⚡',
    category: 'speed',
    points: 25
  },
  {
    id: 'first_boss',
    titleEn: 'First Boss Defeated',
    titleBn: 'প্রথম বস বিজয়ী',
    descEn: "Defeat Pharaoh Khufu's Ghost at Level 10.",
    descBn: 'লেভেল ১০-এ ফারাও খুফুর প্রেতাত্মাকে পরাস্ত করুন।',
    icon: '👑',
    category: 'boss',
    points: 30
  },
  {
    id: 'deaths_10',
    titleEn: 'Pain is Wisdom',
    titleBn: 'ব্যথাই শিক্ষা',
    descEn: 'Perish 10 times in the tomb. Every death teaches a lesson.',
    descBn: '১০ বার মৃত্যুবরণ করুন। প্রতিটি ট্র্যাপ নতুন শিক্ষা দেয়।',
    icon: '💀',
    category: 'deaths',
    points: 10
  },
  {
    id: 'deaths_100',
    titleEn: 'Stubborn Mummy (100 Deaths)',
    titleBn: 'নাছোড়বান্দা মামি (১০০ মৃত্যু)',
    descEn: 'Perish 100 times and stubbornly keep rising!',
    descBn: '১০০ বার মৃত্যুবরণ করার পরও হার না মেনে খেলা চালিয়ে যান!',
    icon: '🔥',
    category: 'deaths',
    points: 40
  },
  {
    id: 'deaths_500',
    titleEn: 'Unyielding Spirit (500 Deaths)',
    titleBn: 'অদম্য আত্মা (৫০০ মৃত্যু)',
    descEn: 'Accumulate 500 total deaths in the cursed catacombs.',
    descBn: 'অভিশপ্ত সমাধিতে ৫০০ বার মৃত্যুর অভিজ্ঞতা অর্জন করুন।',
    icon: '🩸',
    category: 'deaths',
    points: 75
  },
  {
    id: 'flawless_boss',
    titleEn: 'Untouchable Champion',
    titleBn: 'স্পর্শহীন বীর',
    descEn: 'Defeat any Boss without dying a single time on that level!',
    descBn: 'কোনো মৃত্যু ছাড়াই যেকোনো বস লড়াইয়ে বিজয় অর্জন করুন!',
    icon: '🛡️',
    category: 'boss',
    points: 50
  },
  {
    id: 'speedrun_boss',
    titleEn: 'Lightning Exorcist',
    titleBn: 'বিদ্যুৎগতির সমাধি মুক্তি',
    descEn: 'Vanquish any Boss encounter in under 20.0 seconds!',
    descBn: '২০.০ সেকেন্ডের মধ্যে যেকোনো বসকে পরাস্ত করুন!',
    icon: '⏱️',
    category: 'speed',
    points: 40
  },
  {
    id: 'trampoline_master',
    titleEn: 'Acrobatic Mummy',
    titleBn: 'লাফবাজ মামি',
    descEn: 'Bounce on a emerald spring pad and reach the exit!',
    descBn: 'সবুজ স্প্রিং প্যাডে লাফ দিয়ে লেভেলটি জয় করুন!',
    icon: '🌀',
    category: 'skills',
    points: 15
  },
  {
    id: 'ice_master',
    titleEn: 'Slip & Slide',
    titleBn: 'বরফে পিছলে চলা',
    descEn: 'Conquer a slippery ice sand level without falling into the pit.',
    descBn: 'পিচ্ছিল বরফ-বালির লেভেল নিরাপদে অতিক্রম করুন।',
    icon: '🧊',
    category: 'skills',
    points: 20
  },
  {
    id: 'patient_soul',
    titleEn: 'Never Give Up',
    titleBn: 'কখনো হার না মানা',
    descEn: 'Die 15 or more times on a single level and finally triumph!',
    descBn: 'একটি লেভেলে ১৫+ বার মৃত্যুর পরও অধ্যবসায় দিয়ে সেটি পার করুন!',
    icon: '❤️‍🔥',
    category: 'deaths',
    points: 35
  },
  {
    id: 'ten_bosses',
    titleEn: 'Decade of Bosses',
    titleBn: 'দশ বসের পরাভব',
    descEn: 'Defeat 10 different bosses (cross Level 100+)!',
    descBn: '১০টি ভিন্ন ভিন্ন বসকে পরাস্ত করে লেভেল ১০০ অতিক্রম করুন!',
    icon: '⚔️',
    category: 'boss',
    points: 60
  },
  {
    id: 'tier_normal_master',
    titleEn: 'Normal Tier Conqueror',
    titleBn: 'নরমাল টায়ার বিজয়ী',
    descEn: 'Complete Level 250 and master the entire Normal Tier.',
    descBn: 'লেভেল ২৫০ সমাপ্ত করে সম্পূর্ণ নরমাল টায়ার জয় করুন।',
    icon: '🥉',
    category: 'milestone',
    points: 50
  },
  {
    id: 'tier_medium_master',
    titleEn: 'Medium Tier Conqueror',
    titleBn: 'মিডিয়াম টায়ার বিজয়ী',
    descEn: 'Complete Level 500 and conquer the Medium Tier.',
    descBn: 'লেভেল ৫০০ সমাপ্ত করে সম্পূর্ণ মিডিয়াম টায়ার জয় করুন।',
    icon: '🥈',
    category: 'milestone',
    points: 75
  },
  {
    id: 'tier_hard_master',
    titleEn: 'Hard Tier Conqueror',
    titleBn: 'হার্ড টায়ার বিজয়ী',
    descEn: 'Complete Level 750 and breach the gates of Super Hard.',
    descBn: 'লেভেল ৭৫০ সমাপ্ত করে হার্ড টায়ার জয় করুন।',
    icon: '🥇',
    category: 'milestone',
    points: 100
  },
  {
    id: 'god_slayer',
    titleEn: 'Devil King Slayer',
    titleBn: 'প্রাচীন শয়তান সংহারক',
    descEn: 'Defeat the Ancient Devil King at Level 1,000 and destroy the curse forever!',
    descBn: '১,০০০তম লেভেলে প্রাচীন শয়তান রাজাকে ধ্বংস করে অভিশাপ চিরতরে মুক্ত করুন!',
    icon: '👑',
    category: 'milestone',
    points: 250
  }
];

const STORAGE_KEY = 'leveldevil_achievements';

export function getStoredAchievements(): Record<string, UnlockedAchievementRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredAchievements(records: Record<string, UnlockedAchievementRecord>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export interface AchievementEvaluationContext {
  totalDeaths: number;
  currentLevelNum: number;
  currentLevelDeaths: number;
  levelCleared?: boolean;
  levelDurationSeconds?: number;
  isBoss?: boolean;
  unlockedLevel?: number;
  platforms?: Platform[];
  traps?: TrapType[];
}

/**
 * Checks all conditions against current game context and unlocks any eligible achievements.
 * Returns an array of newly unlocked achievements.
 */
export function evaluateAchievements(
  context: AchievementEvaluationContext,
  currentUnlocked: Record<string, UnlockedAchievementRecord>
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  const updated = { ...currentUnlocked };

  const unlock = (achId: string) => {
    if (!updated[achId]) {
      updated[achId] = { unlockedAt: Date.now() };
      const item = ACHIEVEMENTS.find((a) => a.id === achId);
      if (item) {
        newlyUnlocked.push(item);
      }
    }
  };

  // 1. Total Deaths checks
  if (context.totalDeaths >= 10) unlock('deaths_10');
  if (context.totalDeaths >= 100) unlock('deaths_100');
  if (context.totalDeaths >= 500) unlock('deaths_500');

  // 2. Level Clear Checks
  if (context.levelCleared) {
    // Level 1 clear
    if (context.currentLevelNum === 1) {
      unlock('first_steps');
      if (context.levelDurationSeconds !== undefined && context.levelDurationSeconds <= 6.0) {
        unlock('speedrun_lvl1');
      }
    }

    // Boss clear checks
    if (context.isBoss) {
      if (context.currentLevelNum === 10) {
        unlock('first_boss');
      }
      if (context.currentLevelDeaths === 0) {
        unlock('flawless_boss');
      }
      if (context.levelDurationSeconds !== undefined && context.levelDurationSeconds <= 20.0) {
        unlock('speedrun_boss');
      }
    }

    // Patient soul (15+ deaths on this level then won!)
    if (context.currentLevelDeaths >= 15) {
      unlock('patient_soul');
    }

    // Traps and platform feature checks
    if (context.platforms?.some((p) => p.type === 'bouncy')) {
      unlock('trampoline_master');
    }
    if (
      context.platforms?.some((p) => p.type === 'slippery') ||
      context.traps?.includes('slipperySand')
    ) {
      unlock('ice_master');
    }

    // Progression Milestones
    if (context.currentLevelNum >= 100) unlock('ten_bosses');
    if (context.currentLevelNum >= 250) unlock('tier_normal_master');
    if (context.currentLevelNum >= 500) unlock('tier_medium_master');
    if (context.currentLevelNum >= 750) unlock('tier_hard_master');
    if (context.currentLevelNum >= 1000) unlock('god_slayer');
  }

  // Also check unlockedLevel progression if player loaded an advanced save
  if (context.unlockedLevel) {
    if (context.unlockedLevel > 1) unlock('first_steps');
    if (context.unlockedLevel > 10) unlock('first_boss');
    if (context.unlockedLevel > 100) unlock('ten_bosses');
    if (context.unlockedLevel > 250) unlock('tier_normal_master');
    if (context.unlockedLevel > 500) unlock('tier_medium_master');
    if (context.unlockedLevel > 750) unlock('tier_hard_master');
    if (context.unlockedLevel >= 1000) unlock('god_slayer');
  }

  if (newlyUnlocked.length > 0) {
    saveStoredAchievements(updated);
  }

  return newlyUnlocked;
}
