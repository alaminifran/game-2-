import React from 'react';
import { translations } from '../utils/translations';

interface VictoryModalProps {
  levelNumber: number;
  deaths: number;
  lang: 'en' | 'bn';
  onNextLevel: () => void;
  onSelectLevel: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelNumber,
  deaths,
  lang,
  onNextLevel,
  onSelectLevel
}) => {
  const t = translations[lang];
  const isBoss = levelNumber % 10 === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl p-6 text-center shadow-2xl">
        <div className="text-4xl mb-2">{isBoss ? '👑' : '✨'}</div>

        <h3 className="text-xl font-black text-amber-400 font-pixel tracking-wide mb-1">
          {t.victoryTitle}
        </h3>

        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mt-2 mb-6">
          <span>{t.level} {levelNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{t.deaths}: {deaths}</span>
        </div>

        <p className="text-sm text-neutral-300 mb-6">
          {deaths === 0
            ? (lang === 'bn' ? 'অবিশ্বাস্য! একবারও না মরে পার করেছেন!' : 'Flawless run! Not even a single death!')
            : (lang === 'bn' ? `আপনি ${deaths} বার ট্রলের শিকার হয়েও হাল ছাড়েননি!` : `You endured ${deaths} deaths and survived!`)}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onNextLevel}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-colors shadow-lg active:scale-[0.98] text-sm"
          >
            {t.nextLevel}
          </button>
          <button
            onClick={onSelectLevel}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl transition-colors text-xs"
          >
            {t.selectLevel}
          </button>
        </div>
      </div>
    </div>
  );
};
