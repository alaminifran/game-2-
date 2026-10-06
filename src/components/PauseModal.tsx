import React from 'react';
import { translations } from '../utils/translations';
import { Play, RotateCcw, Home, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface PauseModalProps {
  levelNumber: number;
  deaths: number;
  lang: 'en' | 'bn';
  isGuideActive?: boolean;
  onToggleGuide?: () => void;
  onResume: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  isVibrationOn?: boolean;
  onToggleVibration?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  levelNumber,
  deaths,
  lang,
  isGuideActive,
  onToggleGuide,
  onResume,
  onRestart,
  onGoHome,
  isMuted,
  onToggleSound,
  isVibrationOn = true,
  onToggleVibration
}) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#181824] border border-[#2b2b3a] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <h3 className="text-lg font-black text-amber-400 font-pixel tracking-wider mb-2">
          ⏸ {t.pause}
        </h3>

        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mb-6">
          <span>{t.level} #{levelNumber}</span>
          <span>·</span>
          <span>{t.deaths}: {deaths}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Resume */}
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shadow-md active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.resume}</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.restart}</span>
          </button>

          {/* Guide Mode Toggle */}
          {onToggleGuide && (
            <button
              onClick={() => {
                onToggleGuide();
                onResume();
              }}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                isGuideActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400 hover:bg-amber-500/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700'
              }`}
            >
              <span>🎯</span>
              <span>
                {isGuideActive
                  ? (lang === 'bn' ? 'গাইড এরো: চালু (বন্ধ করুন)' : 'Arrow Guide: ON (Turn Off)')
                  : (lang === 'bn' ? 'গাইড এরো চালু করুন' : 'Turn ON Arrow Guide')}
              </span>
            </button>
          )}

          {/* Go to Dashboard / Home */}
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl text-xs transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.dashboard} / {t.home}</span>
          </button>

          {/* Sound & Vibration Controls */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={onToggleSound}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="truncate">{isMuted ? t.soundOff : t.soundOn}</span>
            </button>
            {onToggleVibration && (
              <button
                onClick={onToggleVibration}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs transition-colors border ${
                  isVibrationOn
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800'
                }`}
              >
                <Vibrate className="w-3.5 h-3.5" />
                <span className="truncate">{isVibrationOn ? t.vibrationOn : t.vibrationOff}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
