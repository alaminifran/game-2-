import React, { useEffect } from 'react';
import { translations } from '../utils/translations';

interface DeathOverlayProps {
  message: string;
  levelDeaths: number;
  lang: 'en' | 'bn';
  isGuideActive?: boolean;
  onToggleGuide?: () => void;
  onRespawn: () => void;
}

export const DeathOverlay: React.FC<DeathOverlayProps> = ({
  message,
  levelDeaths,
  lang,
  isGuideActive,
  onToggleGuide,
  onRespawn
}) => {
  const t = translations[lang];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyR' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        onRespawn();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRespawn]);

  return (
    <div
      onClick={onRespawn}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-[2px] cursor-pointer animate-in fade-in duration-150 p-4"
    >
      <div className="bg-neutral-950/90 border border-red-800/80 rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full mx-auto">
        <div className="text-3xl mb-2">💀</div>
        <h4 className="text-lg font-bold text-red-400 font-pixel tracking-wide mb-1">
          {lang === 'bn' ? 'আপনি মারা গেছেন!' : 'YOU DIED!'}
        </h4>

        <p className="text-xs text-neutral-300 italic my-3 px-2">
          &ldquo;{message}&rdquo;
        </p>

        <div className="text-xs text-neutral-400 mb-3">
          {t.deaths}: <span className="text-red-400 font-bold tabular-nums">{levelDeaths}</span>
        </div>

        {/* Guide Prompt or Direct Guide Button */}
        {levelDeaths >= 2 && onToggleGuide && (
          <div className="mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleGuide();
                onRespawn();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow-md ${
                isGuideActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400 hover:bg-amber-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 hover:brightness-110 animate-pulse ring-2 ring-amber-400/50'
              }`}
            >
              <span>🎯</span>
              <span>
                {isGuideActive
                  ? (lang === 'bn' ? 'এরো গাইড চালু আছে (রিস্টার্ট)' : 'Arrow Guide ON (Retry)')
                  : (lang === 'bn' ? 'এরো গাইড চালু করে পুনরায় খেলুন' : 'Turn ON Arrow Guide & Retry')}
              </span>
            </button>
            <p className="text-[10px] text-amber-300/80 mt-1 font-sans">
              {lang === 'bn'
                ? '💡 পরামর্শ: খেলার সময় হিন্টে ডাবল ট্যাপ করেও এরো গাইড দেখা যায়!'
                : '💡 Tip: Double-tap the hint banner in-game anytime for Guide!'}
            </p>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRespawn();
          }}
          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg active:scale-95"
        >
          {t.retry} (R / Space)
        </button>
      </div>
    </div>
  );
};
