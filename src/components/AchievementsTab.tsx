import React, { useState, useMemo } from 'react';
import {
  ACHIEVEMENTS,
  Achievement,
  AchievementCategory,
  UnlockedAchievementRecord
} from '../game/achievements';
import { translations } from '../utils/translations';
import { Trophy, CheckCircle2, Lock, Award, Zap, Skull, Crown, Star, Play } from 'lucide-react';

interface AchievementsTabProps {
  unlockedAchievements: Record<string, UnlockedAchievementRecord>;
  lang: 'en' | 'bn';
  onPlayLevel: (levelNum: number) => void;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  unlockedAchievements,
  lang,
  onPlayLevel
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const t = translations[lang];

  // Calculate statistics
  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = Object.keys(unlockedAchievements).length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const totalPoints = useMemo(() => {
    return ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);
  }, []);

  const earnedPoints = useMemo(() => {
    return ACHIEVEMENTS.reduce((sum, a) => {
      return unlockedAchievements[a.id] ? sum + a.points : sum;
    }, 0);
  }, [unlockedAchievements]);

  // Categories configuration
  const categories: { id: string; labelEn: string; labelBn: string; icon: React.ReactNode }[] = [
    { id: 'all', labelEn: 'All', labelBn: 'সকল', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'milestone', labelEn: 'Milestones', labelBn: 'মাইলফলক', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'boss', labelEn: 'Boss Fights', labelBn: 'বস লড়াই', icon: <Crown className="w-3.5 h-3.5" /> },
    { id: 'deaths', labelEn: 'Death Milestones', labelBn: 'মৃত্যু রেকর্ড', icon: <Skull className="w-3.5 h-3.5" /> },
    { id: 'speed', labelEn: 'Speedruns', labelBn: 'স্পিডরান', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'skills', labelEn: 'Platforming Skills', labelBn: 'দক্ষতা', icon: <Award className="w-3.5 h-3.5" /> }
  ];

  // Filtered achievements
  const filteredList = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => {
      // Category filter
      if (selectedCategory !== 'all' && ach.category !== selectedCategory) {
        return false;
      }
      // Status filter
      const isUnlocked = !!unlockedAchievements[ach.id];
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;
      return true;
    });
  }, [selectedCategory, statusFilter, unlockedAchievements]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Card */}
      <div className="bg-[#181824] border border-[#2b2b3a] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-400 font-pixel tracking-wide flex items-center gap-2">
                <span>{lang === 'bn' ? 'অর্জন অগ্রগতি' : 'Trophy Showcase'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-normal border border-amber-500/30">
                  {unlockedCount} / {totalCount}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {lang === 'bn'
                  ? 'বিভিন্ন চ্যালেঞ্জ ও রেকর্ড পূরণ করে বিশেষ ট্রফি আনলক করুন'
                  : 'Overcome deadly trials, defeat ancient bosses, and master speedruns!'}
              </p>
            </div>
          </div>

          {/* Points Metric */}
          <div className="flex items-center gap-4 bg-neutral-900/60 px-4 py-2 rounded-xl border border-neutral-800">
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
                {t.totalPoints}
              </div>
              <div className="text-base md:text-lg font-black text-amber-400 tabular-nums">
                {earnedPoints} <span className="text-xs text-neutral-500 font-normal">/ {totalPoints} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-neutral-400">
            <span>{lang === 'bn' ? 'মোট আনলক শতকরা' : 'Completion Rate'}</span>
            <span className="font-bold text-amber-400 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 w-full sm:w-auto max-w-full flex-nowrap shrink-0"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60'
              }`}
            >
              {cat.icon}
              <span>{lang === 'bn' ? cat.labelBn : cat.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-neutral-700 text-neutral-100 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filterAll} ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('unlocked')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              statusFilter === 'unlocked'
                ? 'bg-emerald-600/40 text-emerald-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filterUnlocked} ({unlockedCount})
          </button>
          <button
            onClick={() => setStatusFilter('locked')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              statusFilter === 'locked'
                ? 'bg-rose-600/30 text-rose-300 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filterLocked} ({totalCount - unlockedCount})
          </button>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredList.map((ach) => {
          const isUnlocked = !!unlockedAchievements[ach.id];
          const record = unlockedAchievements[ach.id];

          // Target level jump hint if applicable
          const targetLevel =
            ach.id === 'first_steps' || ach.id === 'speedrun_lvl1'
              ? 1
              : ach.id === 'first_boss'
              ? 10
              : ach.id === 'tier_normal_master'
              ? 250
              : ach.id === 'tier_medium_master'
              ? 500
              : ach.id === 'tier_hard_master'
              ? 750
              : ach.id === 'god_slayer'
              ? 1000
              : null;

          return (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border transition-all relative overflow-hidden flex items-start gap-4 select-none ${
                isUnlocked
                  ? 'bg-[#1e1e2d] border-amber-400/50 shadow-md ring-1 ring-amber-400/20'
                  : 'bg-[#15151f] border-[#252533] opacity-80'
              }`}
            >
              {/* Badge Icon */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 border relative ${
                  isUnlocked
                    ? 'bg-amber-500/20 border-amber-400/60 shadow-lg'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-600 grayscale'
                }`}
              >
                <span>{ach.icon}</span>
                {isUnlocked ? (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center text-[10px] font-black border border-neutral-900 shadow">
                    ✓
                  </span>
                ) : (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px] border border-neutral-700 shadow">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4
                    className={`text-sm font-bold truncate ${
                      isUnlocked ? 'text-amber-300' : 'text-neutral-300'
                    }`}
                  >
                    {lang === 'bn' ? ach.titleBn : ach.titleEn}
                  </h4>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isUnlocked
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    +{ach.points} pts
                  </span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  {lang === 'bn' ? ach.descBn : ach.descEn}
                </p>

                {/* Footer status / date */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/80 text-[11px]">
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'অর্জিত' : 'Unlocked'}</span>
                      {record?.unlockedAt && (
                        <span className="text-neutral-500 font-mono text-[10px]">
                          · {formatDate(record.unlockedAt)}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Lock className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'এখনো লক করা' : 'Locked'}</span>
                    </span>
                  )}

                  {/* Play level button if target available */}
                  {targetLevel && (
                    <button
                      onClick={() => onPlayLevel(targetLevel)}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{lang === 'bn' ? `লেভেল #${targetLevel}` : `Level #${targetLevel}`}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="p-12 text-center bg-[#181824] border border-[#2b2b3a] rounded-2xl text-neutral-400">
          <p className="text-sm font-semibold">{lang === 'bn' ? 'কোনো অর্জন পাওয়া যায়নি' : 'No achievements found'}</p>
        </div>
      )}
    </div>
  );
};
