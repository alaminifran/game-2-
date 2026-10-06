import React, { useState, useMemo, useRef } from 'react';
import { TierType } from '../types/game';
import { translations } from '../utils/translations';
import { Play, Skull, Crown, Search, ArrowRight, ShieldCheck, ArrowUp, CheckCircle2, Trophy, Layers } from 'lucide-react';
import { AchievementsTab } from './AchievementsTab';
import { DeathHistoryTab } from './DeathHistoryTab';
import { ACHIEVEMENTS, UnlockedAchievementRecord } from '../game/achievements';
import { DeathLogEntry } from '../game/deathHistory';

interface DashboardScreenProps {
  currentLevel: number;
  unlockedLevel: number;
  totalDeaths: number;
  completedLevels: Record<number, { deaths: number }>;
  unlockedAchievements: Record<string, UnlockedAchievementRecord>;
  deathHistory: DeathLogEntry[];
  lang: 'en' | 'bn';
  onSelectLevel: (lvl: number) => void;
  onResumeGame: () => void;
  onClearDeathHistory: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentLevel,
  unlockedLevel,
  totalDeaths,
  completedLevels,
  unlockedAchievements,
  deathHistory,
  lang,
  onSelectLevel,
  onResumeGame,
  onClearDeathHistory
}) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'achievements' | 'deaths'>('levels');
  const [selectedTier, setSelectedTier] = useState<TierType>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [bossesOnly, setBossesOnly] = useState(false);
  const levelsSectionRef = useRef<HTMLDivElement | null>(null);

  const t = translations[lang];
  const unlockedAchCount = Object.keys(unlockedAchievements).length;

  // The 4 distinct 250-level Tiers requested by the user
  const tiers: {
    id: TierType;
    title: string;
    range: [number, number];
    desc: string;
    accentColor: string;
    bgAccent: string;
    borderActive: string;
    badge: string;
  }[] = [
    {
      id: 'normal',
      title: t.tierNormal,
      range: [1, 250],
      desc: t.tierNormalDesc,
      accentColor: 'text-emerald-400',
      bgAccent: 'bg-emerald-500/10',
      borderActive: 'border-emerald-500',
      badge: lang === 'bn' ? '১ - ২৫০' : '1 - 250'
    },
    {
      id: 'medium',
      title: t.tierMedium,
      range: [251, 500],
      desc: t.tierMediumDesc,
      accentColor: 'text-sky-400',
      bgAccent: 'bg-sky-500/10',
      borderActive: 'border-sky-500',
      badge: lang === 'bn' ? '২৫১ - ৫০০' : '251 - 500'
    },
    {
      id: 'hard',
      title: t.tierHard,
      range: [501, 750],
      desc: t.tierHardDesc,
      accentColor: 'text-amber-400',
      bgAccent: 'bg-amber-500/10',
      borderActive: 'border-amber-500',
      badge: lang === 'bn' ? '৫০১ - ৭৫০' : '501 - 750'
    },
    {
      id: 'superHard',
      title: t.tierSuperHard,
      range: [751, 1000],
      desc: t.tierSuperHardDesc,
      accentColor: 'text-rose-400',
      bgAccent: 'bg-rose-500/10',
      borderActive: 'border-rose-500',
      badge: lang === 'bn' ? '৭৫১ - ১০০০' : '751 - 1000'
    }
  ];

  const activeTierObj = tiers.find((t) => t.id === selectedTier) || tiers[0];

  // Calculate stats per tier
  const tierStats = useMemo(() => {
    const stats: Record<TierType, { completed: number; deaths: number }> = {
      normal: { completed: 0, deaths: 0 },
      medium: { completed: 0, deaths: 0 },
      hard: { completed: 0, deaths: 0 },
      superHard: { completed: 0, deaths: 0 }
    };

    Object.entries(completedLevels).forEach(([lvlStr, data]) => {
      const lvl = parseInt(lvlStr, 10);
      let tierId: TierType = 'normal';
      if (lvl > 750) tierId = 'superHard';
      else if (lvl > 500) tierId = 'hard';
      else if (lvl > 250) tierId = 'medium';

      stats[tierId].completed++;
      stats[tierId].deaths += data.deaths || 0;
    });

    return stats;
  }, [completedLevels]);

  // Compute levels to display in grid
  const levelsInView = useMemo(() => {
    // If search active
    if (searchQuery.trim() !== '') {
      const parsed = parseInt(searchQuery, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000) {
        return [parsed];
      }
      const matching: number[] = [];
      for (let i = 1; i <= 1000; i++) {
        if (String(i).includes(searchQuery.trim())) {
          matching.push(i);
          if (matching.length >= 100) break;
        }
      }
      return matching;
    }

    // Default: selected tier's 250 levels
    const [start, end] = activeTierObj.range;
    const list: number[] = [];
    for (let i = start; i <= end; i++) {
      if (bossesOnly) {
        if (i % 10 === 0) list.push(i);
      } else {
        list.push(i);
      }
    }
    return list;
  }, [searchQuery, activeTierObj.range, bossesOnly]);

  const totalCompletedCount = Object.keys(completedLevels).length;

  const handleTierClick = (tierId: TierType) => {
    setSelectedTier(tierId);
    setSearchQuery('');
    // Smooth scroll down to the levels section so user immediately sees the 250 levels!
    setTimeout(() => {
      levelsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3 md:p-6 pb-28 text-neutral-100">
      {/* Top Hero Banner */}
      <div className="bg-[#181824] border border-[#2b2b3a] rounded-2xl p-4 md:p-6 mb-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-xl md:text-2xl font-black text-amber-400 font-pixel tracking-wide">
              {t.progressSummary}
            </h2>
            <span className="text-xs text-neutral-400 font-mono">· 1,000 Levels</span>
          </div>
          <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
            {lang === 'bn'
              ? '৪টি ধাপে বিভক্ত ১,০০০টি চরম ট্রল লেভেল (প্রতি ধাপে ২৫০টি লেভেল) এবং ১০০টি বস লড়াই!'
              : '1,000 devil platformer levels across 4 brutal tiers (250 levels each) & 100 Boss battles!'}
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.completed}:</span>
              <strong className="text-emerald-400 font-bold tabular-nums">
                {totalCompletedCount} / 1000
              </strong>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Skull className="w-4 h-4 text-rose-400" />
              <span>{t.totalDeaths}:</span>
              <strong className="text-rose-400 font-bold tabular-nums">
                {totalDeaths}
              </strong>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>{t.bossLevel}:</span>
              <strong className="text-amber-400 font-bold tabular-nums">
                100 Bosses
              </strong>
            </div>
          </div>
        </div>

        {/* Continue / Play button */}
        <button
          onClick={onResumeGame}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-xs md:text-sm shrink-0 font-pixel cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{lang === 'bn' ? `লেভেল #${currentLevel} খেলুন` : `Play Level #${currentLevel}`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Tab Switcher: Levels (1-1000) vs Achievements vs Death Log */}
      <div className="mb-6 border-b border-[#2b2b3a] pb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
          {/* Tab 1: Levels */}
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center justify-between sm:justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer shadow-sm ${
              activeTab === 'levels'
                ? 'bg-amber-500 text-neutral-950 font-pixel shadow-amber-500/20 shadow-md ring-2 ring-amber-400 scale-[1.01]'
                : 'bg-[#181824] hover:bg-[#202030] text-neutral-300 border border-[#2b2b3a] hover:border-neutral-600'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.levelsTab}</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                activeTab === 'levels'
                  ? 'bg-neutral-950/20 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              1,000
            </span>
          </button>

          {/* Tab 2: Achievements */}
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center justify-between sm:justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer shadow-sm ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-neutral-950 font-pixel shadow-amber-500/20 shadow-md ring-2 ring-amber-400 scale-[1.01]'
                : 'bg-[#181824] hover:bg-[#202030] text-neutral-300 border border-[#2b2b3a] hover:border-neutral-600'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">{t.achievementsTab}</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                activeTab === 'achievements'
                  ? 'bg-neutral-950/20 text-neutral-950'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {unlockedAchCount} / {ACHIEVEMENTS.length}
            </span>
          </button>

          {/* Tab 3: Death History */}
          <button
            onClick={() => setActiveTab('deaths')}
            className={`flex items-center justify-between sm:justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer shadow-sm ${
              activeTab === 'deaths'
                ? 'bg-amber-500 text-neutral-950 font-pixel shadow-amber-500/20 shadow-md ring-2 ring-amber-400 scale-[1.01]'
                : 'bg-[#181824] hover:bg-[#202030] text-neutral-300 border border-[#2b2b3a] hover:border-neutral-600'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Skull className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">{t.deathHistoryTab}</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                activeTab === 'deaths'
                  ? 'bg-neutral-950/20 text-neutral-950'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {deathHistory.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'achievements' ? (
        <AchievementsTab
          unlockedAchievements={unlockedAchievements}
          lang={lang}
          onPlayLevel={(lvl) => {
            onSelectLevel(lvl);
            onResumeGame();
          }}
        />
      ) : activeTab === 'deaths' ? (
        <DeathHistoryTab
          deathHistory={deathHistory}
          lang={lang}
          onPlayLevel={(lvl) => {
            onSelectLevel(lvl);
            onResumeGame();
          }}
          onClearHistory={onClearDeathHistory}
        />
      ) : (
        <>
          {/* The 4 Distinct Tiers Cards (250 Levels each) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            {lang === 'bn' ? 'ধাপ নির্বাচন করুন (Select Tier)' : 'Select Difficulty Tier'}
          </span>
          <span className="text-[11px] text-amber-400 font-mono">
            {lang === 'bn' ? 'যেকোনো ধাপে ক্লিক করুন' : 'Click to view 250 levels'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((tier) => {
            const stats = tierStats[tier.id];
            const isSelected = selectedTier === tier.id && searchQuery === '';

            return (
              <div
                key={tier.id}
                onClick={() => handleTierClick(tier.id)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer select-none group ${
                  isSelected
                    ? `bg-[#222234] ${tier.borderActive} shadow-lg ring-2 ring-amber-500/40 scale-[1.01]`
                    : 'bg-[#181824] border-[#2b2b3a] hover:border-neutral-600 hover:bg-[#1e1e2d]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${tier.accentColor}`}>
                      {tier.badge}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-neutral-100 mb-1 group-hover:text-amber-400 transition-colors">
                    {tier.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-snug">
                    {tier.desc}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <span>{stats.completed} / 250 cleared</span>
                    <span>💀 {stats.deaths}</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.completed / 250) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Levels Explorer Section Anchor */}
      <div ref={levelsSectionRef} className="scroll-mt-4">
        {/* Tier Switcher Segmented Tabs (Directly above levels for instant switching) */}
        <div className="bg-[#181824] border border-[#2b2b3a] rounded-xl p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
          {/* 4 Tier Tab Buttons */}
          <div
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin max-w-full pb-1 sm:pb-0"
          >
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => handleTierClick(tier.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTier === tier.id && searchQuery === ''
                    ? 'bg-amber-500 text-neutral-950 shadow-md ring-1 ring-amber-400'
                    : 'bg-[#12121a] text-neutral-400 hover:text-neutral-200 hover:bg-[#20202e]'
                }`}
              >
                {tier.title}
              </button>
            ))}
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2.5">
            {/* Bosses Only filter */}
            <button
              onClick={() => setBossesOnly(!bossesOnly)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                bossesOnly
                  ? 'bg-rose-950/60 text-rose-300 border-rose-600'
                  : 'bg-[#12121a] text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.bossesOnly}</span>
            </button>

            {/* Quick Level Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
              <input
                type="number"
                min={1}
                max={1000}
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 md:w-44 pl-7 pr-3 py-1 text-xs bg-[#12121a] border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-neutral-400 hover:text-neutral-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Levels Status Label */}
        <div className="flex items-center justify-between px-2 mb-2 text-xs text-neutral-400">
          <span>
            {searchQuery
              ? `Search Results (${levelsInView.length})`
              : `${activeTierObj.title}: Levels ${activeTierObj.range[0]} - ${activeTierObj.range[1]} (${levelsInView.length} levels)`}
          </span>
          <span className="text-[11px] text-neutral-500">
            Click any level to start playing
          </span>
        </div>

        {/* 250 Levels Grid (Unconstrained height so full page scrolls naturally up & down) */}
        <div className="bg-[#14141c] border border-[#2b2b3a] rounded-xl p-3 md:p-5 shadow-inner">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {levelsInView.map((lvl) => {
              const isBoss = lvl % 10 === 0;
              const isCurrent = lvl === currentLevel;
              const isCompleted = completedLevels[lvl] !== undefined;

              return (
                <button
                  key={lvl}
                  onClick={() => onSelectLevel(lvl)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                      : isBoss
                      ? 'bg-rose-950/40 border-rose-800 text-rose-200 hover:bg-rose-900/60 hover:border-rose-500'
                      : isCompleted
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200 hover:bg-emerald-900/50'
                      : 'bg-[#1a1a26] border-[#29293a] text-neutral-300 hover:bg-[#252538] hover:border-neutral-600'
                  }`}
                >
                  {/* Crown for boss levels */}
                  {isBoss && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 mb-0.5 fill-current" />
                  )}

                  <span className="text-xs font-semibold tabular-nums">
                    {lvl}
                  </span>

                  <span className="text-[9px] mt-0.5 opacity-80 font-mono">
                    {isCurrent
                      ? 'PLAYING'
                      : isBoss
                      ? 'BOSS'
                      : isCompleted
                      ? `💀${completedLevels[lvl].deaths}`
                      : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </>
      )}

      {/* Floating Scroll To Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-40 p-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-full shadow-2xl transition-transform active:scale-95 cursor-pointer"
        title="Scroll to Top"
      >
        <ArrowUp className="w-5 h-5 font-bold" />
      </button>
    </div>
  );
};
