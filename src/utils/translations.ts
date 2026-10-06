// Complete Bilingual Translations for Level Devil 2 (Bengali & English)

export interface LocaleStrings {
  gameTitle: string;
  subtitle: string;
  play: string;
  selectLevel: string;
  dashboard: string;
  home: string;
  pause: string;
  resume: string;
  backToGame: string;
  controls: string;
  restart: string;
  level: string;
  bossLevel: string;
  deaths: string;
  totalDeaths: string;
  tier: string;
  tierNormal: string;
  tierMedium: string;
  tierHard: string;
  tierSuperHard: string;
  tierNormalDesc: string;
  tierMediumDesc: string;
  tierHardDesc: string;
  tierSuperHardDesc: string;
  allLevels: string;
  bossesOnly: string;
  searchPlaceholder: string;
  jump: string;
  left: string;
  right: string;
  victoryTitle: string;
  nextLevel: string;
  retry: string;
  doorLocked: string;
  bossWarning: string;
  soundOn: string;
  soundOff: string;
  bgmOn: string;
  bgmOff: string;
  vibrationOn: string;
  vibrationOff: string;
  vibration: string;
  ghostMode: string;
  ghostOn: string;
  ghostOff: string;
  ghostPb: string;
  newPb: string;
  howToPlay: string;
  progressSummary: string;
  completed: string;
  achievements: string;
  achievementsTab: string;
  levelsTab: string;
  unlocked: string;
  locked: string;
  points: string;
  filterAll: string;
  filterUnlocked: string;
  filterLocked: string;
  totalPoints: string;
  deathHistory: string;
  deathHistoryTab: string;
  deathHistoryDesc: string;
  clearHistory: string;
  clearHistoryConfirm: string;
  hazardCause: string;
  timeOccurred: string;
  mostDeadlyLevel: string;
  todayDeaths: string;
  noDeathsYet: string;
  expandFullLog: string;
  compactLog: string;
  scrollTableLeft: string;
  scrollTableRight: string;
  scrollTop: string;
  scrollBottom: string;
  guideActive: string;
  guideHintPrompt: string;
  guideDoubleTapHint: string;
  enableGuide: string;
  disableGuide: string;
  guideWalkthrough: string;
  jumpHere: string;
  pressSwitch: string;
  exitDoor: string;
  trapWarning: string;
  doorFleesWarning: string;
  instructions: string[];
  deathMessages: string[];
}

export const translations: Record<'en' | 'bn', LocaleStrings> = {
  en: {
    gameTitle: 'LEVEL DEVIL 2: MUMMY',
    subtitle: "Rage Platformer with 1,000 Deceptive Levels & 100 Bosses",
    play: 'Play Game',
    selectLevel: 'Level Select',
    dashboard: 'Dashboard',
    home: 'Home',
    pause: 'Pause',
    resume: 'Resume',
    backToGame: 'Back to Game',
    controls: 'Controls: A/D or ←/→ to Move, W/↑/Space to Jump, R to Quick Restart, Esc/P to Pause',
    restart: 'Restart (R)',
    level: 'Level',
    bossLevel: 'BOSS BATTLE',
    deaths: 'Deaths',
    totalDeaths: 'Total Deaths',
    tier: 'Tier',
    tierNormal: 'Normal (1-250)',
    tierMedium: 'Medium (251-500)',
    tierHard: 'High Level (501-750)',
    tierSuperHard: 'Super High (751-1000)',
    tierNormalDesc: '250 Levels. Already brutally hard and full of deceit.',
    tierMediumDesc: '250 Levels. Vanishing floors and runaway portals.',
    tierHardDesc: '250 Levels. Sawblades, crushers, and gravity rifts.',
    tierSuperHardDesc: '250 Levels. The ultimate devil test of reflex & precision.',
    allLevels: 'All Levels (1-1000)',
    bossesOnly: 'Bosses Only (Every 10th)',
    searchPlaceholder: 'Search level (1-1000)...',
    jump: 'Jump',
    left: 'Left',
    right: 'Right',
    victoryTitle: 'LEVEL CLEARED!',
    nextLevel: 'Next Level →',
    retry: 'Try Again',
    doorLocked: 'Door is locked! Find the ancient switch or defeat the boss!',
    bossWarning: 'ANCIENT PHARAOH BOSS AWAKENS!',
    soundOn: 'Sound: ON',
    soundOff: 'Sound: OFF',
    bgmOn: 'Music: ON',
    bgmOff: 'Music: OFF',
    vibrationOn: 'Vibration: ON',
    vibrationOff: 'Vibration: OFF',
    vibration: 'Vibration',
    ghostMode: 'Ghost Mode',
    ghostOn: 'Ghost: ON',
    ghostOff: 'Ghost: OFF',
    ghostPb: 'Best Run',
    newPb: 'NEW PERSONAL BEST!',
    howToPlay: 'Level Devil Rules:',
    progressSummary: 'Level Progress Hub',
    completed: 'Completed',
    achievements: 'Achievements',
    achievementsTab: 'Achievements',
    levelsTab: 'Levels (1-1000)',
    unlocked: 'Unlocked',
    locked: 'Locked',
    points: 'Points',
    filterAll: 'All',
    filterUnlocked: 'Unlocked',
    filterLocked: 'Locked',
    totalPoints: 'Total Score',
    deathHistory: 'Death History',
    deathHistoryTab: 'Death Log',
    deathHistoryDesc: 'A chronological record of every fatal trap, date, timestamp, and level location.',
    clearHistory: 'Clear History',
    clearHistoryConfirm: 'Are you sure you want to clear your death history logs?',
    hazardCause: 'Lethal Hazard',
    timeOccurred: 'Date & Time',
    mostDeadlyLevel: 'Deadliest Level',
    todayDeaths: "Today's Deaths",
    noDeathsYet: 'No deaths recorded yet! Either you are a prodigy or haven\'t started dying.',
    expandFullLog: 'Expand All (View Full Page)',
    compactLog: 'Compact Window',
    scrollTableLeft: 'Scroll Left',
    scrollTableRight: 'Scroll Right',
    scrollTop: 'Top',
    scrollBottom: 'Bottom',
    guideActive: '🎯 GUIDE ARROWS ACTIVE (Double-click hint to turn off)',
    guideHintPrompt: '💡 Double-click hint for visual Arrow Guide',
    guideDoubleTapHint: 'Stuck? Double-click hint for Arrow Guide!',
    enableGuide: 'Enable Arrow Guide',
    disableGuide: 'Turn Off Guide',
    guideWalkthrough: 'Walkthrough Guide',
    jumpHere: 'JUMP',
    pressSwitch: '1. Press Switch',
    exitDoor: '2. Exit Door',
    trapWarning: 'TRAP!',
    doorFleesWarning: 'Door Flees Here!',
    instructions: [
      'The door might flee when you get close.',
      'Innocent-looking ground can sprout deadly spikes.',
      'Floors crumble into the void without warning.',
      'Every 10th level is an interactive Boss fight with ancient runes.',
      'Press [R] anytime to instantly retry, or [P]/[Esc] to Pause!'
    ],
    deathMessages: [
      'Did you really think the floor was safe?',
      'The door had other plans for you.',
      'Classic Level Devil betrayal!',
      'Greed is a deadly sin in the pyramid.',
      'Gravity said: NOPE!',
      'That spike was waiting just for you.',
      'Don\'t trust anything with pixels!',
      'Respawn and pretend that didn\'t happen.'
    ]
  },
  bn: {
    gameTitle: 'লেভেল ডেভিল ২: মামি',
    subtitle: '১,০০০ চরম প্রতারক লেভেল এবং ১০০টি বস লড়াই নিয়ে তৈরি হার্ডকোর গেম',
    play: 'খেলা শুরু করুন',
    selectLevel: 'লেভেল নির্বাচন',
    dashboard: 'ড্যাশবোর্ড',
    home: 'হোম',
    pause: 'পজ',
    resume: 'চালিয়ে যান',
    backToGame: 'গেমে ফিরুন',
    controls: 'কন্ট্রোল: A/D বা ←/→ ডানে-বামে, W/↑/Space লাফাতে, R দ্রুত রিস্টার্ট, Esc/P পজ',
    restart: 'রিস্টার্ট (R)',
    level: 'লেভেল',
    bossLevel: 'বস লড়াই',
    deaths: 'মৃত্যু',
    totalDeaths: 'মোট মৃত্যু',
    tier: 'ধাপ',
    tierNormal: 'নরমাল লেভেল (১-২৫০)',
    tierMedium: 'মিডিয়াম লেভেল (২৫১-৫০০)',
    tierHard: 'হাই লেভেল (৫০১-৭৫০)',
    tierSuperHard: 'সুপার হাই লেভেল (৭৫১-১০০০)',
    tierNormalDesc: '২৫০টি লেভেল। শুরু থেকেই চরম কঠিন ও অপ্রত্যাশিত ট্রল ফাঁদ!',
    tierMediumDesc: '২৫০টি লেভেল। ভেঙে যাওয়া মেঝে এবং পলায়নপর দরজা!',
    tierHardDesc: '২৫০টি লেভেল। মারাত্মক করাত, ছাদ থেকে পড়া পাথর ও ট্র্যাপ!',
    tierSuperHardDesc: '২৫০টি লেভেল। চরম কঠিন ডেভিল লেভেল! নিখুঁত দক্ষতার পরীক্ষা!',
    allLevels: 'সকল লেভেল (১-১০০০)',
    bossesOnly: 'শুধু বস লেভেল (প্রতি ১০ম)',
    searchPlaceholder: 'লেভেল খুঁজুন (১-১০০০)...',
    jump: 'লাফ (Jump)',
    left: 'বামে (Left)',
    right: 'ডানে (Right)',
    victoryTitle: 'লেভেল সম্পন্ন!',
    nextLevel: 'পরবর্তী লেভেল →',
    retry: 'আবার চেষ্টা করুন',
    doorLocked: 'দরজা তালাবদ্ধ! রুন সুইচ চাপুন অথবা বসকে পরাজিত করুন!',
    bossWarning: 'প্রাচীন ফারাও বস জাগ্রত হয়েছে!',
    soundOn: 'সাউন্ড: চালু',
    soundOff: 'সাউন্ড: বন্ধ',
    bgmOn: 'গান: চালু',
    bgmOff: 'গান: বন্ধ',
    vibrationOn: 'ভাইব্রেশন: চালু',
    vibrationOff: 'ভাইব্রেশন: বন্ধ',
    vibration: 'ভাইব্রেশন',
    ghostMode: 'ঘোস্ট মোড (Ghost Mode)',
    ghostOn: 'ঘোস্ট: চালু',
    ghostOff: 'ঘোস্ট: বন্ধ',
    ghostPb: 'সেরা রেকর্ড',
    newPb: 'নতুন ব্যক্তিগত সেরা রেকর্ড!',
    howToPlay: 'লেভেল ডেভিলের নিয়মাবলী:',
    progressSummary: 'লেভেল প্রোগ্রেস ড্যাশবোর্ড',
    completed: 'সম্পন্ন',
    achievements: 'অর্জনসমূহ',
    achievementsTab: 'অর্জনসমূহ (Achievements)',
    levelsTab: 'লেভেলসমূহ (১-১০০০)',
    unlocked: 'আনলকড',
    locked: 'লকড',
    points: 'পয়েন্ট',
    filterAll: 'সকল',
    filterUnlocked: 'অর্জিত',
    filterLocked: 'অনর্জিত',
    totalPoints: 'মোট স্কোর',
    deathHistory: 'মৃত্যুর ইতিহাস',
    deathHistoryTab: 'মৃত্যুর ইতিহাস ও তারিখ',
    deathHistoryDesc: 'প্রতিটি মৃত্যুর তারিখ, সঠিক সময়, লেভেল নম্বর ও ফাঁদের বিস্তারিত ইতিহাস।',
    clearHistory: 'লগ মুছুন',
    clearHistoryConfirm: 'আপনি কি নিশ্চিত যে মৃত্যুর সব লগ মুছে ফেলতে চান?',
    hazardCause: 'মৃত্যুর কারণ ও ফাঁদ',
    timeOccurred: 'তারিখ ও সময়',
    mostDeadlyLevel: 'সবচেয়ে প্রাণঘাতী লেভেল',
    todayDeaths: 'আজকের মৃত্যু',
    noDeathsYet: 'এখনো কোনো মৃত্যু রেকর্ড নেই! আপনি হয় জিনিয়াস, নয়তো খেলা শুরু করেননি।',
    expandFullLog: 'সম্পূর্ণ ইতিহাস দেখুন (ফুল পেজ স্ক্রল)',
    compactLog: 'কম্প্যাক্ট উইন্ডো',
    scrollTableLeft: 'বামে স্ক্রল',
    scrollTableRight: 'ডানে স্ক্রল',
    scrollTop: 'উপরে',
    scrollBottom: 'নিচে',
    guideActive: '🎯 এরো গাইড চালু (হিন্টে ডাবল ক্লিকে বন্ধ করুন)',
    guideHintPrompt: '💡 হিন্টে ডাবল ক্লিক করে এরো গাইড চালু করুন',
    guideDoubleTapHint: 'আটকে গেছেন? হিন্টে ডাবল ক্লিক করুন গাইড এরো দেখতে!',
    enableGuide: 'এরো গাইড চালু করুন',
    disableGuide: 'গাইড বন্ধ করুন',
    guideWalkthrough: 'সমাধান পথনির্দেশ',
    jumpHere: 'লাফ দিন',
    pressSwitch: '১. সুইচ চাপুন',
    exitDoor: '২. আসল প্রস্থান দরজা',
    trapWarning: 'ফাঁদ!',
    doorFleesWarning: 'দরজা এখানে পালাবে!',
    instructions: [
      'কাছে গেলেই দরজা পালিয়ে যেতে পারে!',
      'নিরাপদ দেখতে মাটির ভেতর থেকে হঠাৎ কাঁটা বের হবে।',
      'পা রাখার ০.২ সেকেন্ডের মধ্যে মেঝে অতলে তলিয়ে যাবে।',
      'প্রতি ১০ম লেভেলে প্রাচীন বস লড়াই থাকবে।',
      'যেকোনো সময় [R] দিয়ে রিস্টার্ট এবং [P] বা [Esc] দিয়ে গেম পজ করা যাবে।'
    ],
    deathMessages: [
      'মেঝেটি যে আপনাকে ফেলে দেবে ভাবেননি?',
      'দরজাটি আপনাকে দেখে পালিয়ে গেল!',
      'লেভেল ডেভিলের আসল মজা এখানেই!',
      'ফাঁদটির কোনো দয়ামায়া নেই!',
      'মরলেন তো কী হয়েছে? আবার চেষ্টা করুন!',
      'মাথার ওপর খেয়াল না করলে এমনই হবে!',
      'আরেকবার চেষ্টা কর, এবার পারবে!',
      'হাসতে গিয়ে মরলেন তো?'
    ]
  }
};
