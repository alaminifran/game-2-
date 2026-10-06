import React, { useEffect } from 'react';
import { Achievement } from '../game/achievements';
import { Award, X } from 'lucide-react';

interface AchievementToastProps {
  achievement: Achievement;
  lang: 'en' | 'bn';
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  lang,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="flex items-center gap-3 bg-[#1e1e2d] border-2 border-amber-400 text-neutral-100 p-3.5 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300 max-w-sm w-full pointer-events-auto">
      <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
        {achievement.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-amber-400 font-pixel">
          <Award className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'অর্জন আনলক হয়েছে!' : 'Achievement Unlocked!'}</span>
        </div>
        <h4 className="text-xs md:text-sm font-bold text-neutral-100 truncate mt-0.5">
          {lang === 'bn' ? achievement.titleBn : achievement.titleEn}
        </h4>
        <p className="text-[11px] text-neutral-400 truncate">
          {lang === 'bn' ? achievement.descBn : achievement.descEn}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={onDismiss}
          className="text-neutral-500 hover:text-neutral-200 transition-colors p-0.5 rounded cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
          +{achievement.points} pts
        </span>
      </div>
    </div>
  );
};
