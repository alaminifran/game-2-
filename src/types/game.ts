export type GameState = 'MENU' | 'PLAYING' | 'DYING' | 'VICTORY' | 'PAUSED' | 'DASHBOARD';

export type TierType = 'normal' | 'medium' | 'hard' | 'superHard';

export interface TierInfo {
  id: TierType;
  nameEn: string;
  nameBn: string;
  range: [number, number];
  color: string;
  taglineEn: string;
  taglineBn: string;
}

export type TrapType =
  | 'runawayDoor'        // Door flees when approached
  | 'sproutSpike'        // Spikes pop up from ground
  | 'crumblingFloor'     // Floor breaks after 0.2s
  | 'fallingSmasher'     // Thwomp block drops from ceiling
  | 'fakeFloor'          // Phantom platform, you fall through
  | 'jumpPunisher'       // Spike appears above head when jumping
  | 'gravityFlip'        // Reverses gravity
  | 'movingSaw'          // Moving circular saw
  | 'slipperySand'       // Zero-friction zone
  | 'reverseControls'    // Left is Right, Right is Left
  | 'fakeDoor'           // Explodes/teleports if entered
  | 'sandstormGust'      // Periodic wind pushing player
  | 'shadowFog'          // Only small torchlight circle visible
  | 'risingLava'         // Cursed acid sand slowly rising
  | 'teleportPad';       // Portals that trick you

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'crumble' | 'fake' | 'slippery' | 'bouncy' | 'moving';
  vx?: number;
  vy?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  shakeTime?: number;
  isCrumbling?: boolean;
  fallen?: boolean;
  opacity?: number;
}

export interface Spike {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dir: 'up' | 'down' | 'left' | 'right';
  hidden?: boolean;
  isRevealed?: boolean;
  triggerDistance?: number;
  triggerOnJump?: boolean;
}

export interface SawBlade {
  id: string;
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
  trackStart: { x: number; y: number };
  trackEnd: { x: number; y: number };
  progress: number;
  forward: boolean;
}

export interface Door {
  x: number;
  y: number;
  w: number;
  h: number;
  isFake?: boolean;
  hasFled?: boolean;
  targetX?: number;
  targetY?: number;
  fleeDistance?: number;
  fleeTo?: { x: number; y: number };
  locked?: boolean;
}

export interface SwitchButton {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pressed: boolean;
  targetId: string;
  label?: string;
}

export interface Smasher {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  startY: number;
  targetY: number;
  state: 'idle' | 'falling' | 'ground' | 'rising';
  timer: number;
  triggerRange: { minX: number; maxX: number };
}

export interface Boss {
  name: string;
  nameBn: string;
  title: string;
  titleBn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  maxHp: number;
  hp: number;
  phase: number;
  attackTimer: number;
  state: 'intro' | 'idle' | 'attacking' | 'vulnerable' | 'defeated';
  type: 'pharaoh' | 'anubis' | 'eyeOfRa' | 'sphinx' | 'sandGolem' | 'devilKing';
  projectiles: BossProjectile[];
  weakPoint?: { x: number; y: number; w: number; h: number; active: boolean };
}

export interface BossProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  homing?: boolean;
  life: number;
}

export interface LevelData {
  levelNumber: number;
  tier: TierType;
  title: string;
  titleBn: string;
  hintEn: string;
  hintBn: string;
  isBoss: boolean;
  boss?: Boss;
  spawn: { x: number; y: number };
  door: Door;
  fakeDoors?: Door[];
  platforms: Platform[];
  spikes: Spike[];
  saws: SawBlade[];
  smashers: Smasher[];
  switches: SwitchButton[];
  traps: TrapType[];
  gravityInverted?: boolean;
  darkness?: boolean;
  windSpeed?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type?: 'bandage' | 'sand' | 'spark' | 'smoke' | 'blood' | 'eyeGlow';
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 'left' | 'right';
  jumpCount: number;
  maxJumps: number;
  gravityScale: number;
  isDead: boolean;
  walkFrame: number;
  animTimer: number;
  invulnerableTime: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  isJumping: boolean;
}
