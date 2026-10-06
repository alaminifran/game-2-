import React, { useEffect, useState } from 'react';
import { Boss } from '../types/game';

interface BossIntroBannerProps {
  boss: Boss;
  levelNumber: number;
  lang: 'en' | 'bn';
}

export const BossIntroBanner: React.FC<BossIntroBannerProps> = ({
  boss,
  levelNumber,
  lang
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, [boss.name, levelNumber]);

  if (!visible) return null;

  return (
    <div className="absolute inset-x-0 top-12 z-30 flex items-center justify-center pointer-events-none px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-red-950/90 border-y-2 border-red-600 px-8 py-3 text-center shadow-2xl backdrop-blur-md max-w-lg w-full">
        <div className="text-[10px] tracking-widest uppercase text-red-400 font-pixel mb-1">
          ⚠️ {lang === 'bn' ? `বস স্তর ${levelNumber}` : `BOSS ENCOUNTER ${levelNumber}`} ⚠️
        </div>
        <div className="text-xl md:text-2xl font-black text-amber-300 uppercase tracking-wider drop-shadow-md">
          {lang === 'bn' ? boss.nameBn : boss.name}
        </div>
        <div className="text-xs text-neutral-300 font-medium mt-0.5">
          {lang === 'bn' ? boss.titleBn : boss.title}
        </div>
      </div>
    </div>
  );
};
