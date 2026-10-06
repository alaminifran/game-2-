import React, { useState, useMemo, useRef } from 'react';
import {
  DeathLogEntry,
  getHazardMeta,
  formatDeathDateTime,
  clearDeathHistory
} from '../game/deathHistory';
import { translations } from '../utils/translations';
import {
  Skull,
  Calendar,
  Clock,
  Search,
  Trash2,
  Play,
  Crown,
  AlertTriangle,
  Flame,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  MoveHorizontal
} from 'lucide-react';

interface DeathHistoryTabProps {
  deathHistory: DeathLogEntry[];
  lang: 'en' | 'bn';
  onPlayLevel: (levelNum: number) => void;
  onClearHistory: () => void;
}

export const DeathHistoryTab: React.FC<DeathHistoryTabProps> = ({
  deathHistory,
  lang,
  onPlayLevel,
  onClearHistory
}) => {
  const [searchLevel, setSearchLevel] = useState<string>('');
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);

  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileContainerRef = useRef<HTMLDivElement | null>(null);

  const t = translations[lang];

  const handleScrollTable = (delta: number) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (mobileContainerRef.current) {
      mobileContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToBottom = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: tableContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    if (mobileContainerRef.current) {
      mobileContainerRef.current.scrollTo({
        top: mobileContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Calculate Metrics
  const stats = useMemo(() => {
    if (deathHistory.length === 0) {
      return { total: 0, today: 0, deadliestLevel: null, deadliestLevelCount: 0, topHazard: null };
    }

    const startOfToday = new Date().setHours(0, 0, 0, 0);
    let todayCount = 0;
    const levelCounts: Record<number, number> = {};
    const hazardCounts: Record<string, number> = {};

    deathHistory.forEach((entry) => {
      if (entry.timestamp >= startOfToday) {
        todayCount++;
      }
      levelCounts[entry.levelNumber] = (levelCounts[entry.levelNumber] || 0) + 1;
      hazardCounts[entry.reason] = (hazardCounts[entry.reason] || 0) + 1;
    });

    let deadliestLevel: number | null = null;
    let maxLevelDeaths = 0;
    Object.entries(levelCounts).forEach(([lvl, count]) => {
      if (count > maxLevelDeaths) {
        maxLevelDeaths = count;
        deadliestLevel = parseInt(lvl, 10);
      }
    });

    let topHazard: string | null = null;
    let maxHazardCount = 0;
    Object.entries(hazardCounts).forEach(([hazard, count]) => {
      if (count > maxHazardCount) {
        maxHazardCount = count;
        topHazard = hazard;
      }
    });

    return {
      total: deathHistory.length,
      today: todayCount,
      deadliestLevel,
      deadliestLevelCount: maxLevelDeaths,
      topHazard
    };
  }, [deathHistory]);

  // Hazards for filter
  const hazardFilters = [
    { id: 'all', labelEn: 'All Hazards', labelBn: 'সকল ফাঁদ', icon: '💀' },
    { id: 'spike', labelEn: 'Spikes', labelBn: 'কাঁটা', icon: '📌' },
    { id: 'saw', labelEn: 'Saws', labelBn: 'করাত', icon: '🪚' },
    { id: 'smasher', labelEn: 'Smashers', labelBn: 'পাথর', icon: '🗿' },
    { id: 'boss', labelEn: 'Bosses', labelBn: 'বস', icon: '👑' },
    { id: 'void', labelEn: 'Void Abyss', labelBn: 'পাতাল', icon: '🕳️' }
  ];

  // Filtered death entries
  const filteredEntries = useMemo(() => {
    return deathHistory.filter((entry) => {
      // Level search filter
      if (searchLevel.trim() !== '') {
        const lvlSearch = parseInt(searchLevel.trim(), 10);
        if (!isNaN(lvlSearch) && entry.levelNumber !== lvlSearch) {
          return false;
        }
      }

      // Hazard type filter
      if (selectedHazard !== 'all' && entry.reason !== selectedHazard) {
        return false;
      }

      return true;
    });
  }, [deathHistory, searchLevel, selectedHazard]);

  const handleClear = () => {
    clearDeathHistory();
    onClearHistory();
    setConfirmClear(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Deaths Logged */}
        <div className="bg-[#181824] border border-[#2b2b3a] rounded-xl p-4 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl shrink-0">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
              {lang === 'bn' ? 'মোট সংরক্ষিত মৃত্যু' : 'Total Deaths Logged'}
            </div>
            <div className="text-lg font-black text-rose-400 tabular-nums">
              {stats.total}
            </div>
          </div>
        </div>

        {/* Today's Deaths */}
        <div className="bg-[#181824] border border-[#2b2b3a] rounded-xl p-4 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
              {t.todayDeaths}
            </div>
            <div className="text-lg font-black text-amber-400 tabular-nums">
              {stats.today}
            </div>
          </div>
        </div>

        {/* Deadliest Level */}
        <div className="bg-[#181824] border border-[#2b2b3a] rounded-xl p-4 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-xl shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
              {t.mostDeadlyLevel}
            </div>
            <div className="text-lg font-black text-neutral-100 tabular-nums">
              {stats.deadliestLevel ? (
                <span>
                  #{stats.deadliestLevel}{' '}
                  <span className="text-xs text-neutral-500 font-normal">
                    ({stats.deadliestLevelCount} 💀)
                  </span>
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        {/* Top Lethal Hazard */}
        <div className="bg-[#181824] border border-[#2b2b3a] rounded-xl p-4 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
              {lang === 'bn' ? 'শীর্ষ প্রাণঘাতী ফাঁদ' : 'Top Killer Hazard'}
            </div>
            <div className="text-sm font-bold text-neutral-100 truncate">
              {stats.topHazard ? (
                <span className="flex items-center gap-1">
                  <span>{getHazardMeta(stats.topHazard).icon}</span>
                  <span>
                    {lang === 'bn'
                      ? getHazardMeta(stats.topHazard).labelBn
                      : getHazardMeta(stats.topHazard).labelEn}
                  </span>
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control & Search Toolbar */}
      <div className="bg-[#181824] border border-[#2b2b3a] rounded-xl p-3 md:p-4 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Hazard filter pills with horizontal mousewheel & touch scroll */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 w-full md:w-auto max-w-full flex-nowrap shrink-0"
        >
          {hazardFilters.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHazard(h.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                selectedHazard === h.id
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60'
              }`}
            >
              <span>{h.icon}</span>
              <span>{lang === 'bn' ? h.labelBn : h.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Level Search & Clear Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchLevel}
              onChange={(e) => setSearchLevel(e.target.value)}
              placeholder={lang === 'bn' ? 'লেভেল নম্বর...' : 'Level #...'}
              className="w-full bg-[#12121a] border border-[#2b2b3a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {deathHistory.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClear}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/60 text-neutral-400 hover:text-red-300 border border-neutral-700 hover:border-red-800/80 transition-colors text-xs cursor-pointer whitespace-nowrap"
                  title={t.clearHistory}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.clearHistory}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Death History Log Records */}
      {filteredEntries.length > 0 ? (
        <div className="bg-[#12121a] border border-[#242434] rounded-2xl overflow-hidden shadow-inner">
          {/* Scroll instruction & interactive controls banner */}
          <div className="px-4 py-2.5 bg-[#181824] border-b border-[#2b2b3a] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-300 text-[11px]">
                {lang === 'bn'
                  ? `মোট ${filteredEntries.length}টি মৃত্যুর রেকর্ড`
                  : `Showing ${filteredEntries.length} deaths`}
              </span>
              <span className="text-neutral-600">|</span>
              <span className="text-amber-400/90 text-[11px] font-mono flex items-center gap-1">
                <MoveHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'স্ক্রলযোগ্য টেবিল' : 'Scrollable Table'}</span>
              </span>
            </div>

            {/* Quick Scroll & View Action Controls */}
            <div className="flex items-center gap-2">
              {/* Horizontal Scroll Left & Right buttons (for desktop/tablet table) */}
              <div className="hidden sm:flex items-center gap-1 bg-[#12121a] p-1 rounded-lg border border-[#2b2b3a]">
                <button
                  onClick={() => handleScrollTable(-220)}
                  className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 rounded transition-colors cursor-pointer"
                  title={t.scrollTableLeft}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-neutral-400 px-1 font-mono">{lang === 'bn' ? 'কলাম' : 'Cols'}</span>
                <button
                  onClick={() => handleScrollTable(220)}
                  className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 rounded transition-colors cursor-pointer"
                  title={t.scrollTableRight}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Jump to Top and Bottom */}
              <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-lg border border-[#2b2b3a]">
                <button
                  onClick={handleScrollToTop}
                  className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 rounded transition-colors cursor-pointer"
                  title={t.scrollTop}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleScrollToBottom}
                  className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 rounded transition-colors cursor-pointer"
                  title={t.scrollBottom}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Full Page View vs Compact Scrollable Container Toggle */}
              <button
                onClick={() => setIsExpandedView(!isExpandedView)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isExpandedView
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-[#12121a] hover:bg-neutral-800 text-neutral-300 border-[#2b2b3a]'
                }`}
                title={isExpandedView ? t.compactLog : t.expandFullLog}
              >
                {isExpandedView ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.compactLog}</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.expandFullLog}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Desktop & Tablet Table View (Smooth horizontal & vertical scrolling without traps) */}
          <div
            ref={tableContainerRef}
            className={`hidden sm:block overflow-x-auto scrollbar-thin transition-all ${
              isExpandedView
                ? 'max-h-none overflow-y-visible'
                : 'max-h-[620px] overflow-y-auto'
            }`}
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#181824] z-20 shadow-sm border-b border-[#2b2b3a]">
                <tr className="text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 bg-[#181824]">{t.level}</th>
                  <th className="py-3 px-4 bg-[#181824]">{t.timeOccurred}</th>
                  <th className="py-3 px-4 bg-[#181824]">{t.hazardCause}</th>
                  <th className="py-3 px-4 bg-[#181824] hidden md:table-cell">{t.tier}</th>
                  <th className="py-3 px-4 bg-[#181824] hidden lg:table-cell">Troll Message</th>
                  <th className="py-3 px-4 bg-[#181824] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2d]">
                {filteredEntries.map((entry) => {
                  const meta = getHazardMeta(entry.reason);
                  const { dateStr, timeStr } = formatDeathDateTime(entry.timestamp, lang);

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#1a1a26] transition-colors group select-none"
                    >
                      {/* Level Number */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black font-mono text-sm px-2.5 py-1 rounded-lg border ${
                              entry.isBoss
                                ? 'bg-rose-950/50 text-rose-300 border-rose-800/80'
                                : 'bg-[#1e1e2d] text-neutral-200 border-neutral-700/80'
                            }`}
                          >
                            #{entry.levelNumber}
                          </span>
                          {entry.isBoss && (
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                              <Crown className="w-3 h-3 fill-current" />
                              <span>BOSS</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date & Exact Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            {dateStr}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            {timeStr}
                          </span>
                        </div>
                      </td>

                      {/* Hazard Cause Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}
                        >
                          <span>{meta.icon}</span>
                          <span>{lang === 'bn' ? meta.labelBn : meta.labelEn}</span>
                        </span>
                      </td>

                      {/* Level Tier */}
                      <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">
                        <span
                          className={`text-[11px] font-semibold ${
                            entry.tier === 'superHard'
                              ? 'text-rose-400'
                              : entry.tier === 'hard'
                              ? 'text-amber-400'
                              : entry.tier === 'medium'
                              ? 'text-sky-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {entry.tier.toUpperCase()}
                        </span>
                      </td>

                      {/* Troll Message / Cause Quote */}
                      <td className="py-3 px-4 hidden lg:table-cell text-neutral-400 text-xs italic max-w-xs truncate">
                        "{entry.message || 'Level Devil caught you off guard.'}"
                      </td>

                      {/* Jump & Retry Level Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onPlayLevel(entry.levelNumber)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 font-bold rounded-lg border border-amber-500/30 hover:border-amber-400 transition-all text-xs cursor-pointer active:scale-95 whitespace-nowrap"
                          title={`Retry Level #${entry.levelNumber}`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{lang === 'bn' ? 'রিট্রাই' : 'Retry'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stream (Fluid touch scroll, responsive to expanded view) */}
          <div
            ref={mobileContainerRef}
            className={`block sm:hidden scrollbar-thin p-3 space-y-2.5 transition-all ${
              isExpandedView
                ? 'max-h-none overflow-y-visible'
                : 'max-h-[600px] overflow-y-auto'
            }`}
          >
            {filteredEntries.map((entry) => {
              const meta = getHazardMeta(entry.reason);
              const { dateStr, timeStr } = formatDeathDateTime(entry.timestamp, lang);

              return (
                <div
                  key={entry.id}
                  className="bg-[#181824] border border-[#2b2b3a] rounded-xl p-3 shadow-md flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black font-mono text-sm px-2.5 py-1 rounded-lg border ${
                          entry.isBoss
                            ? 'bg-rose-950/50 text-rose-300 border-rose-800/80'
                            : 'bg-[#1e1e2d] text-neutral-200 border-neutral-700/80'
                        }`}
                      >
                        #{entry.levelNumber}
                      </span>
                      {entry.isBoss && (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          <Crown className="w-3 h-3 fill-current" />
                          <span>BOSS</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.color}`}
                    >
                      <span>{meta.icon}</span>
                      <span>{lang === 'bn' ? meta.labelBn : meta.labelEn}</span>
                    </span>
                  </div>

                  {/* Date & Time Timestamp */}
                  <div className="flex items-center justify-between text-xs text-neutral-300 bg-[#12121a] px-2.5 py-1.5 rounded-lg border border-[#242434]">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      {dateStr}
                    </span>
                    <span className="flex items-center gap-1 text-neutral-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      {timeStr}
                    </span>
                  </div>

                  {/* Action & Retry */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 italic truncate max-w-[170px]">
                      "{entry.message || 'Level Devil'}"
                    </span>

                    <button
                      onClick={() => onPlayLevel(entry.levelNumber)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded-lg text-xs cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{lang === 'bn' ? 'রিট্রাই' : 'Retry'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#181824] border border-[#2b2b3a] rounded-2xl p-12 text-center text-neutral-400">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl mx-auto mb-3 text-neutral-500">
            💀
          </div>
          <h4 className="text-base font-bold text-neutral-200 mb-1">
            {lang === 'bn' ? 'কোনো মৃত্যুর লগ পাওয়া যায়নি' : 'No Death Logs Found'}
          </h4>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            {deathHistory.length === 0
              ? t.noDeathsYet
              : lang === 'bn'
              ? 'আপনার নির্বাচিত ফিল্টারে কোনো রেকর্ড পাওয়া যায়নি।'
              : 'No entries match your current search or hazard filter.'}
          </p>
        </div>
      )}
    </div>
  );
};
