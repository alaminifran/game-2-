/**
 * Level Devil 2: Mummy's Curse
 * A rage platformer featuring 1,000 deceptive levels across 4 brutal tiers with boss battles every 10 levels.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GameState } from './types/game';
import { generateLevel, getTierForLevel } from './game/levelGenerator';
import { GameCanvas } from './components/GameCanvas';
import { LevelSelectModal } from './components/LevelSelectModal';
import { VictoryModal } from './components/VictoryModal';
import { DeathOverlay } from './components/DeathOverlay';
import { BossIntroBanner } from './components/BossIntroBanner';
import { DashboardScreen } from './components/DashboardScreen';
import { PauseModal } from './components/PauseModal';
import { sound } from './audio/soundEngine';
import { translations } from './utils/translations';
import {
  Achievement,
  getStoredAchievements,
  evaluateAchievements,
  UnlockedAchievementRecord
} from './game/achievements';
import {
  DeathLogEntry,
  getDeathHistory,
  recordDeath
} from './game/deathHistory';
import { AchievementToast } from './components/AchievementToast';
import {
  Volume2,
  VolumeX,
  Music,
  Vibrate,
  RotateCcw,
  HelpCircle,
  Layers,
  Globe,
  Home,
  Pause,
  Play,
  Trophy
} from 'lucide-react';
import {
  haptics,
  getStoredVibrationSetting,
  saveVibrationSetting
} from './utils/haptics';

export default function App() {
  // Language state (default to Bengali 'bn' as requested by the user, with quick switch to 'en')
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    const saved = localStorage.getItem('leveldevil_lang');
    return saved === 'en' ? 'en' : 'bn';
  });

  const t = translations[lang];

  // Current level state (1 to 1000)
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(() => {
    const saved = localStorage.getItem('leveldevil_current_level');
    const parsed = parseInt(saved || '1', 10);
    return isNaN(parsed) ? 1 : Math.max(1, Math.min(1000, parsed));
  });

  // Highest reached level
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('leveldevil_unlocked_level');
    const parsed = parseInt(saved || '1', 10);
    return isNaN(parsed) ? 1 : Math.max(1, Math.min(1000, parsed));
  });

  // Completed levels record
  const [completedLevels, setCompletedLevels] = useState<Record<number, { deaths: number }>>(() => {
    try {
      const saved = localStorage.getItem('leveldevil_completed_levels');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Death counters
  const [currentLevelDeaths, setCurrentLevelDeaths] = useState<number>(0);
  const [totalDeaths, setTotalDeaths] = useState<number>(() => {
    const saved = localStorage.getItem('leveldevil_total_deaths');
    const parsed = parseInt(saved || '0', 10);
    return isNaN(parsed) ? 0 : parsed;
  });

  // Achievements state
  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, UnlockedAchievementRecord>>(() => getStoredAchievements());
  const [activeToasts, setActiveToasts] = useState<Achievement[]>([]);
  const levelStartTimeRef = useRef<number>(Date.now());

  // Death History log state
  const [deathHistory, setDeathHistory] = useState<DeathLogEntry[]>(() => getDeathHistory());

  // Sound & BGM toggles
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isBgmOn, setIsBgmOn] = useState<boolean>(false);

  // Modals & Overlays (Supports PLAYING, PAUSED, DASHBOARD, DYING, VICTORY)
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [deathMessage, setDeathMessage] = useState<string>('');
  const [canvasKey, setCanvasKey] = useState<number>(0);
  const [isGuideActive, setIsGuideActive] = useState<boolean>(false);
  const [isVibrationOn, setIsVibrationOn] = useState<boolean>(() => getStoredVibrationSetting());

  // Generate current level data deterministically
  const levelData = useMemo(() => {
    return generateLevel(currentLevelNum);
  }, [currentLevelNum]);

  const currentTier = useMemo(() => {
    return getTierForLevel(currentLevelNum);
  }, [currentLevelNum]);

  // Evaluates achievements and triggers fanfare + toast when new ones are earned
  const triggerAchievementCheck = useCallback((context: Parameters<typeof evaluateAchievements>[0]) => {
    const newlyUnlocked = evaluateAchievements(context, getStoredAchievements());
    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(getStoredAchievements());
      sound.playAchievement();
      setActiveToasts((prev) => [...prev, ...newlyUnlocked]);
    }
  }, []);

  // Check achievements on mount against current progress
  useEffect(() => {
    triggerAchievementCheck({
      totalDeaths,
      currentLevelNum,
      currentLevelDeaths: 0,
      unlockedLevel
    });
  }, [triggerAchievementCheck, totalDeaths, currentLevelNum, unlockedLevel]);

  // Save progress changes
  useEffect(() => {
    localStorage.setItem('leveldevil_current_level', String(currentLevelNum));
  }, [currentLevelNum]);

  useEffect(() => {
    localStorage.setItem('leveldevil_unlocked_level', String(unlockedLevel));
  }, [unlockedLevel]);

  useEffect(() => {
    localStorage.setItem('leveldevil_total_deaths', String(totalDeaths));
  }, [totalDeaths]);

  useEffect(() => {
    localStorage.setItem('leveldevil_completed_levels', JSON.stringify(completedLevels));
  }, [completedLevels]);

  const toggleLanguage = () => {
    const next = lang === 'bn' ? 'en' : 'bn';
    setLang(next);
    localStorage.setItem('leveldevil_lang', next);
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (muted) {
      setIsBgmOn(false);
    }
  };

  const handleToggleBgm = () => {
    if (isBgmOn) {
      sound.stopBgm();
      setIsBgmOn(false);
    } else {
      if (isMuted) {
        sound.toggleMute();
        setIsMuted(false);
      }
      sound.startBgm();
      setIsBgmOn(true);
    }
  };

  const handleToggleVibration = () => {
    setIsVibrationOn((prev) => {
      const next = !prev;
      saveVibrationSetting(next);
      if (next) {
        haptics.light(true);
      }
      return next;
    });
  };

  // Handlers for Game Events
  const handlePlayerDeath = (reason: string) => {
    // Trigger mobile death vibration feedback
    haptics.death(isVibrationOn);

    const msg = t.deathMessages[Math.floor(Math.random() * t.deathMessages.length)];
    setDeathMessage(msg);
    const newCurrentDeaths = currentLevelDeaths + 1;
    const newTotalDeaths = totalDeaths + 1;
    setCurrentLevelDeaths(newCurrentDeaths);
    setTotalDeaths(newTotalDeaths);
    setGameState('DYING');

    // Record persistent death history entry
    const updatedHistory = recordDeath(currentLevelNum, currentTier, reason, msg);
    setDeathHistory(updatedHistory);

    triggerAchievementCheck({
      totalDeaths: newTotalDeaths,
      currentLevelNum,
      currentLevelDeaths: newCurrentDeaths,
      unlockedLevel
    });
  };

  const handleRespawn = useCallback(() => {
    levelStartTimeRef.current = Date.now();
    setGameState('PLAYING');
    setCanvasKey((k) => k + 1);
  }, []);

  const handleLevelClear = () => {
    setGameState('VICTORY');
    const durationSeconds = (Date.now() - levelStartTimeRef.current) / 1000;

    // Mark completed
    setCompletedLevels((prev) => ({
      ...prev,
      [currentLevelNum]: { deaths: currentLevelDeaths }
    }));

    const nextUnlocked =
      currentLevelNum >= unlockedLevel && currentLevelNum < 1000
        ? currentLevelNum + 1
        : unlockedLevel;

    if (nextUnlocked > unlockedLevel) {
      setUnlockedLevel(nextUnlocked);
    }

    triggerAchievementCheck({
      totalDeaths,
      currentLevelNum,
      currentLevelDeaths,
      levelCleared: true,
      levelDurationSeconds: durationSeconds,
      isBoss: levelData.isBoss,
      unlockedLevel: nextUnlocked,
      platforms: levelData.platforms,
      traps: levelData.traps
    });
  };

  const handleNextLevel = () => {
    setIsGuideActive(false);
    if (currentLevelNum < 1000) {
      levelStartTimeRef.current = Date.now();
      setCurrentLevelNum((lvl) => lvl + 1);
      setCurrentLevelDeaths(0);
      setGameState('PLAYING');
      setCanvasKey((k) => k + 1);
    } else {
      setGameState('DASHBOARD');
    }
  };

  const handleSelectLevel = (lvl: number) => {
    setIsGuideActive(false);
    levelStartTimeRef.current = Date.now();
    setCurrentLevelNum(lvl);
    setCurrentLevelDeaths(0);
    setGameState('PLAYING');
    setCanvasKey((k) => k + 1);
  };

  const handleQuickRestart = () => {
    const newCurrent = currentLevelDeaths + 1;
    const newTotal = totalDeaths + 1;
    setCurrentLevelDeaths(newCurrent);
    setTotalDeaths(newTotal);

    const updatedHistory = recordDeath(currentLevelNum, currentTier, 'hazard', 'Manual Quick Restart (R)');
    setDeathHistory(updatedHistory);

    triggerAchievementCheck({
      totalDeaths: newTotal,
      currentLevelNum,
      currentLevelDeaths: newCurrent,
      unlockedLevel
    });

    handleRespawn();
  };

  const handleTogglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };

  return (
    <div className="min-h-screen bg-[#111116] text-neutral-100 flex flex-col font-sans select-none">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav links) — Zone 3 (Actions) */}
      <header className="flex items-center justify-between px-3 md:px-8 py-2.5 bg-[#181824] border-b border-[#2b2b3a] shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setGameState('DASHBOARD')}
          className="text-sm md:text-base font-black tracking-tight text-amber-400 font-pixel truncate hover:text-amber-300 transition-colors text-left"
        >
          {t.gameTitle}
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1.5 md:gap-3 text-xs md:text-sm font-medium">
          {/* Dashboard / Home Button */}
          <button
            onClick={() => setGameState(gameState === 'DASHBOARD' ? 'PLAYING' : 'DASHBOARD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap text-xs font-semibold ${
              gameState === 'DASHBOARD'
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
            title="Go to Levels Dashboard"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.dashboard}</span>
            <span className="sm:hidden">{t.home}</span>
          </button>

          {/* Level Selector trigger */}
          <button
            onClick={() => setShowLevelSelect(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs"
            title="Quick Level Jump"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t.selectLevel}</span>
          </button>

          {/* Achievements Button */}
          <button
            onClick={() => setGameState('DASHBOARD')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs font-semibold cursor-pointer"
            title={t.achievements}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t.achievements}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
              {Object.keys(unlockedAchievements).length}
            </span>
          </button>

          {/* Sound & Music Controls */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 md:p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title={isMuted ? t.soundOff : t.soundOn}
            aria-label="Toggle Sound FX"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleToggleBgm}
            className={`p-1.5 md:p-2 rounded-lg transition-colors ${
              isBgmOn
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
            title={isBgmOn ? t.bgmOn : t.bgmOff}
            aria-label="Toggle Background Chiptune"
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Mobile Vibration Haptic Feedback Toggle */}
          <button
            onClick={handleToggleVibration}
            className={`p-1.5 md:p-2 rounded-lg transition-colors ${
              isVibrationOn
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
            }`}
            title={isVibrationOn ? t.vibrationOn : t.vibrationOff}
            aria-label="Toggle Mobile Vibration Feedback"
          >
            <Vibrate className="w-4 h-4" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs font-semibold"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Help Rules Trigger */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 md:p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors hidden sm:block"
            title="Rules & Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Pause & Quick Restart) */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          {gameState !== 'DASHBOARD' && (
            <button
              onClick={handleTogglePause}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                gameState === 'PAUSED'
                  ? 'bg-amber-500 text-neutral-950 border-amber-400'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
              title="Pause Game (P / Esc)"
            >
              {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{gameState === 'PAUSED' ? t.resume : t.pause}</span>
            </button>
          )}

          {/* Restart Button */}
          <button
            onClick={handleQuickRestart}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-sm active:scale-95 whitespace-nowrap"
            title="Restart current level (Shortcut: R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.restart}</span>
            <span className="md:hidden">R</span>
          </button>
        </div>
      </header>

      {/* Main View Router: DASHBOARD vs ACTIVE GAMEPLAY */}
      {gameState === 'DASHBOARD' ? (
        <DashboardScreen
          currentLevel={currentLevelNum}
          unlockedLevel={unlockedLevel}
          totalDeaths={totalDeaths}
          completedLevels={completedLevels}
          unlockedAchievements={unlockedAchievements}
          deathHistory={deathHistory}
          lang={lang}
          onSelectLevel={handleSelectLevel}
          onResumeGame={() => setGameState('PLAYING')}
          onClearDeathHistory={() => setDeathHistory([])}
        />
      ) : (
        <main className="flex-1 flex flex-col items-center justify-between p-2 md:p-3 max-w-6xl w-full mx-auto relative overflow-hidden">
          {/* HUD Metadata */}
          <div className="w-full max-w-[1020px] flex items-center justify-between px-3 py-1 text-xs text-neutral-400">
            {/* Level & Boss Tag */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-100 text-sm">
                {levelData.isBoss ? '👑 ' + t.bossLevel : t.level} #{currentLevelNum}
              </span>
              <span aria-hidden="true">·</span>
              <span className={
                currentTier === 'superHard' ? 'text-rose-400 font-semibold' :
                currentTier === 'hard' ? 'text-amber-400 font-semibold' :
                currentTier === 'medium' ? 'text-sky-400' : 'text-emerald-400'
              }>
                {currentTier === 'normal' ? t.tierNormal :
                 currentTier === 'medium' ? t.tierMedium :
                 currentTier === 'hard' ? t.tierHard : t.tierSuperHard}
              </span>
              <span aria-hidden="true">·</span>
              <span className="hidden sm:inline text-neutral-400">{levelData.title}</span>
            </div>

            {/* Deaths Tally */}
            <div className="flex items-center gap-3 tabular-nums">
              <span className="text-red-400 font-semibold">
                💀 {currentLevelDeaths}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="text-neutral-500 hidden sm:inline text-[11px]">
                {t.totalDeaths}: {totalDeaths}
              </span>
            </div>
          </div>

          {/* Game Canvas Container */}
          <div className="relative w-full flex-1 flex items-center justify-center">
            {/* Boss Appearance Splash Banner */}
            {levelData.isBoss && levelData.boss && (
              <BossIntroBanner
                boss={levelData.boss}
                levelNumber={currentLevelNum}
                lang={lang}
              />
            )}

            {/* Canvas Component with fresh key upon restart */}
            <GameCanvas
              key={canvasKey}
              levelData={levelData}
              gameState={gameState}
              lang={lang}
              isGuideActive={isGuideActive}
              onToggleGuide={() => setIsGuideActive((prev) => !prev)}
              onLevelClear={handleLevelClear}
              onPlayerDeath={handlePlayerDeath}
              onRestart={handleRespawn}
              onPause={handleTogglePause}
              currentLevelDeaths={currentLevelDeaths}
            />

            {/* Death Troll Overlay */}
            {gameState === 'DYING' && (
              <DeathOverlay
                message={deathMessage}
                levelDeaths={currentLevelDeaths}
                lang={lang}
                isGuideActive={isGuideActive}
                onToggleGuide={() => setIsGuideActive((prev) => !prev)}
                onRespawn={handleRespawn}
              />
            )}

            {/* Victory Modal */}
            {gameState === 'VICTORY' && (
              <VictoryModal
                levelNumber={currentLevelNum}
                deaths={currentLevelDeaths}
                lang={lang}
                onNextLevel={handleNextLevel}
                onSelectLevel={() => setShowLevelSelect(true)}
              />
            )}

            {/* Pause Modal */}
            {gameState === 'PAUSED' && (
              <PauseModal
                levelNumber={currentLevelNum}
                deaths={currentLevelDeaths}
                lang={lang}
                isGuideActive={isGuideActive}
                onToggleGuide={() => setIsGuideActive((prev) => !prev)}
                onResume={() => setGameState('PLAYING')}
                onRestart={handleQuickRestart}
                onGoHome={() => setGameState('DASHBOARD')}
                isMuted={isMuted}
                onToggleSound={handleToggleSound}
                isVibrationOn={isVibrationOn}
                onToggleVibration={handleToggleVibration}
              />
            )}
          </div>

          {/* Bottom Desktop Control Hint */}
          <div className="hidden md:flex items-center justify-between w-full max-w-[1020px] text-[11px] text-neutral-500 px-3 py-1 font-mono">
            <span>{t.controls}</span>
            <span>1,000 Levels · 4 Tiers · 100 Bosses</span>
          </div>
        </main>
      )}

      {/* 1,000 Level Selector Modal */}
      {showLevelSelect && (
        <LevelSelectModal
          currentLevel={currentLevelNum}
          unlockedMaxLevel={unlockedLevel}
          lang={lang}
          onSelectLevel={handleSelectLevel}
          onClose={() => setShowLevelSelect(false)}
          completedLevels={completedLevels}
        />
      )}

      {/* Help / Rules Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#181824] border border-[#2b2b3a] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#2b2b3a] pb-3">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span className="text-amber-400">❓</span> {t.howToPlay}
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-2.5 text-xs text-neutral-300 mb-6">
              {t.instructions.map((ins, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">▸</span>
                  <span>{ins}</span>
                </li>
              ))}
            </ul>

            <div className="bg-[#111116] p-3 rounded-xl border border-[#2b2b3a] text-[11px] text-neutral-400 space-y-1 mb-5">
              <div><strong>Normal Tier:</strong> 1 - 250 (250 Levels)</div>
              <div><strong>Medium Tier:</strong> 251 - 500 (250 Levels)</div>
              <div><strong>High Tier:</strong> 501 - 750 (250 Levels)</div>
              <div><strong>Super High Tier:</strong> 751 - 1000 (250 Levels)</div>
              <div className="text-amber-400 pt-1 font-semibold">
                👑 Boss battles occur on levels 10, 20, 30 ... 1000!
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors"
            >
              OK, I am ready!
            </button>
          </div>
        </div>
      )}

      {/* Achievement Unlocked Toasts Stack */}
      {activeToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-3">
          {activeToasts.map((ach) => (
            <AchievementToast
              key={ach.id}
              achievement={ach}
              lang={lang}
              onDismiss={() => {
                setActiveToasts((prev) => prev.filter((item) => item.id !== ach.id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
