import React, { useState, useMemo } from 'react';
import { TierType } from '../types/game';
import { translations } from '../utils/translations';

interface LevelSelectModalProps {
  currentLevel: number;
  unlockedMaxLevel: number;
  lang: 'en' | 'bn';
  onSelectLevel: (lvl: number) => void;
  onClose: () => void;
  completedLevels: Record<number, { deaths: number }>;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevel,
  unlockedMaxLevel,
  lang,
  onSelectLevel,
  onClose,
  completedLevels
}) => {
  const [activeTier, setActiveTier] = useState<TierType>('normal');
  const [bossOnly, setBossOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[lang];

  // Tier boundaries
  const tiers: { id: TierType; name: string; range: [number, number]; desc: string }[] = [
    { id: 'normal', name: t.tierNormal, range: [1, 250], desc: t.tierNormalDesc },
    { id: 'medium', name: t.tierMedium, range: [251, 500], desc: t.tierMediumDesc },
    { id: 'hard', name: t.tierHard, range: [501, 750], desc: t.tierHardDesc },
    { id: 'superHard', name: t.tierSuperHard, range: [751, 1000], desc: t.tierSuperHardDesc }
  ];

  const currentTierObj = tiers.find((t) => t.id === activeTier)!;

  // Filter levels based on search, tier, and boss-only toggle
  const displayedLevels = useMemo(() => {
    const list: number[] = [];

    // If searching by number
    if (searchQuery.trim() !== '') {
      const parsed = parseInt(searchQuery, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000) {
        return [parsed];
      }
      // Or filter list that starts with search query
      for (let i = 1; i <= 1000; i++) {
        if (String(i).includes(searchQuery.trim())) {
          list.push(i);
          if (list.length >= 120) break; // Limit search results for performance
        }
      }
      return list;
    }

    // Otherwise show selected tier range
    const [start, end] = currentTierObj.range;
    for (let i = start; i <= end; i++) {
      if (bossOnly) {
        if (i % 10 === 0) list.push(i);
      } else {
        list.push(i);
      }
    }
    return list;
  }, [searchQuery, currentTierObj.range, bossOnly]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <span className="text-amber-500">❖</span> {t.selectLevel} (1 - 1,000)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">{currentTierObj.desc}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tier Selector Tabs & Search */}
        <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Tier Controls */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800 overflow-x-auto max-w-full">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => {
                  setActiveTier(tier.id);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTier === tier.id
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tier.name}
              </button>
            ))}
          </div>

          {/* Quick Search & Boss Filter */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBossOnly(!bossOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                bossOnly
                  ? 'bg-red-500/20 text-red-300 border-red-500/50'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              <span>👑</span> {t.bossesOnly}
            </button>

            <div className="relative">
              <input
                type="number"
                min={1}
                max={1000}
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 md:w-44 px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
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

        {/* Level Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
          {displayedLevels.map((lvl) => {
            const isBoss = lvl % 10 === 0;
            const isCurrent = lvl === currentLevel;
            const isCompleted = completedLevels[lvl] !== undefined;

            return (
              <button
                key={lvl}
                onClick={() => {
                  onSelectLevel(lvl);
                  onClose();
                }}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group ${
                  isCurrent
                    ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-md ring-2 ring-amber-400/50'
                    : isBoss
                    ? 'bg-red-950/40 border-red-800/80 text-red-200 hover:bg-red-900/50 hover:border-red-600'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200 hover:bg-emerald-900/40'
                    : 'bg-neutral-800/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Boss Badge Icon */}
                {isBoss && (
                  <span className="text-[10px] leading-none mb-0.5">
                    {lvl === 1000 ? '🔥' : '👑'}
                  </span>
                )}

                <span className="text-sm font-semibold tracking-tight tabular-nums">
                  {lvl}
                </span>

                {/* Sub status text */}
                <span className="text-[9px] mt-0.5 opacity-70">
                  {isCurrent
                    ? 'NOW'
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

        {/* Footer info */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-900 border border-red-700 inline-block" />
              {t.bossLevel}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900 border border-emerald-700 inline-block" />
              Completed
            </span>
          </div>
          <span>Total Levels: 1,000 · 100 Bosses</span>
        </div>
      </div>
    </div>
  );
};
