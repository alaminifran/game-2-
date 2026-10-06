import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  LevelData,
  Player,
  Particle,
  Platform,
  Spike,
  SawBlade,
  Smasher,
  SwitchButton,
  Boss
} from '../types/game';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../game/levelGenerator';
import { PhysicsEngine, InputState } from '../game/physics';
import { MummyRenderer } from '../game/mummyRenderer';
import { translations } from '../utils/translations';
import { sound } from '../audio/soundEngine';

interface GameCanvasProps {
  levelData: LevelData;
  gameState: GameState;
  lang: 'en' | 'bn';
  isGuideActive?: boolean;
  onToggleGuide?: () => void;
  onLevelClear: () => void;
  onPlayerDeath: (deathMessage: string) => void;
  onRestart: () => void;
  onPause?: () => void;
  currentLevelDeaths: number;
}

function getLevelWalkthroughMessage(level: LevelData, lang: 'en' | 'bn'): string {
  if (level.isBoss) {
    return lang === 'bn'
      ? '🎯 সমাধান: বেদীর রুন সুইচগুলোতে পা দিয়ে বসকে ঘায়েল করুন এবং মুক্ত দরজায় পৌঁছান!'
      : '🎯 Walkthrough: Activate all altar rune switches to defeat boss & unlock exit door!';
  }
  if (level.door.fleeTo && !level.door.hasFled) {
    return lang === 'bn'
      ? '🎯 সমাধান: ধাপ ১: সোনালী সুইচে পা দিয়ে পালানো আটকান ➔ ধাপ ২: আসল দরজায় প্রবেশ করুন!'
      : '🎯 Walkthrough: Step 1: Hit freeze switch ➔ Step 2: Enter true door!';
  }
  if (level.switches.length > 0 && level.switches.some((s) => !s.pressed)) {
    return lang === 'bn'
      ? '🎯 সমাধান: ধাপ ১: বেদীর সুইচে পৌঁছে তালা খুলুন ➔ ধাপ ২: তোরণে প্রবেশ করুন!'
      : '🎯 Walkthrough: Step 1: Reach altar switch to unlock door ➔ Step 2: Enter portal!';
  }
  if (level.platforms.some((p) => p.type === 'bouncy')) {
    return lang === 'bn'
      ? '🎯 সমাধান: সবুজ স্প্রিং প্যাডে পা ফেলে উঁচু দেওয়াল টপকে দরজায় যান!'
      : '🎯 Walkthrough: Bounce high on the green spring pad to vault over the tall wall!';
  }
  if (level.smashers.length > 0) {
    return lang === 'bn'
      ? '🎯 সমাধান: ঝুলন্ত পাথরের সামনে গিয়ে পড়তে দিন, পাথর ওঠার সময় দ্রুত নিচ দিয়ে পার হোন!'
      : '🎯 Walkthrough: Bait falling smashers, then sprint underneath while they slowly rise!';
  }
  if (level.traps.includes('reverseControls')) {
    return lang === 'bn'
      ? '🎯 সমাধান: উল্টো কন্ট্রোল! ডানে যেতে বাঁ তীর এবং বাঁয়ে যেতে ডান তীর বোতাম চাপুন!'
      : '🎯 Walkthrough: Reversed controls! Press Left to go Right, Right to go Left!';
  }
  return lang === 'bn'
    ? '🎯 সমাধান: সোনালী তীরচিহ্ন অনুসরণ করে ফাঁদ এড়িয়ে প্রস্থান দরজায় পৌঁছান!'
    : '🎯 Walkthrough: Follow the golden guide arrows along safe platforms to exit!';
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelData,
  gameState,
  lang,
  isGuideActive,
  onToggleGuide,
  onLevelClear,
  onPlayerDeath,
  onRestart,
  onPause,
  currentLevelDeaths
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Visual Arrow Guide Navigation State (persistent across retries on this level)
  const [localGuideMode, setLocalGuideMode] = useState<boolean>(isGuideActive ?? false);
  const effectiveGuideMode = isGuideActive !== undefined ? isGuideActive : localGuideMode;
  const guideModeRef = useRef<boolean>(effectiveGuideMode);
  guideModeRef.current = effectiveGuideMode;

  const lastHintTapRef = useRef<number>(0);

  const handleToggleGuide = useCallback(() => {
    if (onToggleGuide) {
      onToggleGuide();
      sound.playGuidePing(!effectiveGuideMode);
    } else {
      setLocalGuideMode((prev) => {
        const next = !prev;
        guideModeRef.current = next;
        sound.playGuidePing(next);
        return next;
      });
    }
  }, [onToggleGuide, effectiveGuideMode]);

  const handleHintClick = useCallback(() => {
    const now = Date.now();
    if (now - lastHintTapRef.current < 450) {
      // Double tap / double click detected!
      handleToggleGuide();
      lastHintTapRef.current = 0;
    } else {
      lastHintTapRef.current = now;
    }
  }, [handleToggleGuide]);

  // Screen shake offset
  const shakeRef = useRef(0);

  // Player state
  const playerRef = useRef<Player>({
    x: levelData.spawn.x,
    y: levelData.spawn.y,
    w: 24,
    h: 32,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 'right',
    jumpCount: 0,
    maxJumps: 1,
    gravityScale: 1,
    isDead: false,
    walkFrame: 0,
    animTimer: 0,
    invulnerableTime: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isJumping: false
  });

  // Particles array
  const particlesRef = useRef<Particle[]>([]);

  // Key input state
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jump: false,
    jumpPressed: false
  });

  // Frame tick counter
  const tickRef = useRef(0);

  // Local cloned level data for mutation during play (crumble, traps, doors fleeing, switches)
  const currentLevelRef = useRef<LevelData>(JSON.parse(JSON.stringify(levelData)));

  // Reset player and level data whenever levelData changes or restart is triggered
  const resetLevel = useCallback(() => {
    currentLevelRef.current = JSON.parse(JSON.stringify(levelData));
    playerRef.current = {
      x: levelData.spawn.x,
      y: levelData.spawn.y,
      w: 24,
      h: 32,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 'right',
      jumpCount: 0,
      maxJumps: 1,
      gravityScale: 1,
      isDead: false,
      walkFrame: 0,
      animTimer: 0,
      invulnerableTime: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      isJumping: false
    };
    particlesRef.current = [];
    shakeRef.current = 0;
  }, [levelData]);

  useEffect(() => {
    resetLevel();
  }, [levelData, resetLevel]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inputRef.current.left = true;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inputRef.current.right = true;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        if (!inputRef.current.jump) {
          inputRef.current.jumpPressed = true;
        }
        inputRef.current.jump = true;
        e.preventDefault();
      }
      if (e.code === 'KeyR') {
        resetLevel();
        onRestart();
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (onPause) {
          onPause();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inputRef.current.left = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inputRef.current.right = false;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        inputRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onRestart, resetLevel]);

  // Touch control helper handlers
  const handleTouchStart = (action: 'left' | 'right' | 'jump') => {
    if (action === 'left') inputRef.current.left = true;
    if (action === 'right') inputRef.current.right = true;
    if (action === 'jump') {
      inputRef.current.jumpPressed = true;
      inputRef.current.jump = true;
    }
  };

  const handleTouchEnd = (action: 'left' | 'right' | 'jump') => {
    if (action === 'left') inputRef.current.left = false;
    if (action === 'right') inputRef.current.right = false;
    if (action === 'jump') inputRef.current.jump = false;
  };

  // Main Game Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      tickRef.current++;
      const tick = tickRef.current;
      const player = playerRef.current;
      const level = currentLevelRef.current;
      const particles = particlesRef.current;

      // Decay screen shake
      if (shakeRef.current > 0) {
        shakeRef.current *= 0.88;
        if (shakeRef.current < 0.2) shakeRef.current = 0;
      }

      // Physics update if playing
      if (gameState === 'PLAYING') {
        PhysicsEngine.update(
          player,
          level,
          inputRef.current,
          particles,
          tick,
          (reason) => {
            const msgs = translations[lang].deathMessages;
            const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
            onPlayerDeath(randomMsg);
          },
          () => {
            onLevelClear();
          },
          (amount) => {
            shakeRef.current = amount;
          }
        );
      }

      // Clear jumpPressed flag after physics update cycle
      inputRef.current.jumpPressed = false;

      // Begin Rendering
      ctx.save();

      // Apply screen shake
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current * 2;
        const sy = (Math.random() - 0.5) * shakeRef.current * 2;
        ctx.translate(sx, sy);
      }

      // 1. Draw Clean Dark Level Devil Background
      drawLevelDevilBackground(ctx, level);

      // 2. Draw Platforms & Traps (Monochromatic clean slate blocks)
      drawPlatforms(ctx, level.platforms, tick);

      // 3. Draw Saws
      drawSaws(ctx, level.saws);

      // 4. Draw Smashers
      drawSmashers(ctx, level.smashers);

      // 5. Draw Switches
      drawSwitches(ctx, level.switches);

      // 6. Draw Spikes
      drawSpikes(ctx, level.spikes);

      // 7. Draw Beautiful Animated Level Devil Door
      drawDoor(ctx, level.door, player, tick);

      // 8. Draw Boss (if Boss level)
      if (level.isBoss && level.boss) {
        drawBoss(ctx, level.boss, tick);
      }

      // 9. Draw Particles (bandages, door light sparks, dust)
      drawParticles(ctx, particles);

      // 10. Draw The Mummy Character
      MummyRenderer.draw(ctx, player, tick);

      // 11. Draw Darkness / Torch lighting if darkness trap
      if (level.darkness) {
        drawTorchLighting(ctx, player, tick);
      }

      // 12. Draw Visual Arrow Guide Navigation System (when toggled via double click on hint)
      if (guideModeRef.current) {
        drawArrowGuideSystem(ctx, level, player, tick, lang);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, lang, onLevelClear, onPlayerDeath]);

  // Clean, Solid Dark Background matching Level Devil 2
  const drawLevelDevilBackground = (
    ctx: CanvasRenderingContext2D,
    level: LevelData
  ) => {
    // Pure, solid dark hold background
    ctx.fillStyle = '#14141c';
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    // Subtle edge vignette
    const vig = ctx.createRadialGradient(
      STAGE_WIDTH / 2,
      STAGE_HEIGHT / 2,
      STAGE_WIDTH * 0.35,
      STAGE_WIDTH / 2,
      STAGE_HEIGHT / 2,
      STAGE_WIDTH * 0.7
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  };

  // Monochromatic, Clean Geometric Platforms matching Level Devil 2
  const drawPlatforms = (
    ctx: CanvasRenderingContext2D,
    platforms: Platform[],
    tick: number
  ) => {
    platforms.forEach((plat) => {
      if (plat.fallen) return;

      const { x, y, w, h, type } = plat;

      if (type === 'fake') {
        // Fake platform looks solid, but slightly dimmer
        ctx.fillStyle = '#262633';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#3a3a4c';
        ctx.fillRect(x, y, w, 2);
        return;
      }

      if (type === 'crumble') {
        // Crumbling block: clean slate with crack fissures
        ctx.fillStyle = plat.isCrumbling ? '#452b35' : '#333342';
        ctx.fillRect(x, y, w, h);

        // Top beveled highlight
        ctx.fillStyle = plat.isCrumbling ? '#e11d48' : '#525268';
        ctx.fillRect(x, y, w, 2);

        // Subtle clean cracks
        ctx.strokeStyle = plat.isCrumbling ? '#f43f5e' : '#1f1f28';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.35, y);
        ctx.lineTo(x + w * 0.45, y + h);
        ctx.moveTo(x + w * 0.7, y);
        ctx.lineTo(x + w * 0.6, y + h);
        ctx.stroke();
        return;
      }

      if (type === 'slippery') {
        // Slick cold slate with ice sheen
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(x, y, w, 3);
        return;
      }

      if (type === 'bouncy') {
        // Glowing Emerald Bouncy Trampoline Pad
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x, y, w, 4);

        // Chevron spring chevron arrow
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 8, y + 12);
        ctx.lineTo(x + w / 2, y + 5);
        ctx.lineTo(x + w / 2 + 8, y + 12);
        ctx.stroke();
        return;
      }

      if (type === 'moving') {
        // Brass / Mechanical Ferry Moving Platform
        ctx.fillStyle = '#292524';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x, y, w, 3);

        // Wheels / gear rivets
        ctx.fillStyle = '#78716c';
        ctx.fillRect(x + 8, y + h - 4, 10, 4);
        ctx.fillRect(x + w - 18, y + h - 4, 10, 4);
        return;
      }

      // Standard solid Level Devil platform (clean, unified, muted dark slate)
      ctx.fillStyle = '#323242';
      ctx.fillRect(x, y, w, h);

      // Clean top beveled light edge
      ctx.fillStyle = '#4e4e64';
      ctx.fillRect(x, y, w, 3);

      // Clean bottom drop shadow line
      ctx.fillStyle = '#1c1c24';
      ctx.fillRect(x, y + h - 2, w, 2);
    });
  };

  // Clean, Sharp Geometric Spikes matching Level Devil 2
  const drawSpikes = (ctx: CanvasRenderingContext2D, spikes: Spike[]) => {
    spikes.forEach((spike) => {
      if (spike.hidden) return;

      const { x, y, w, h, dir } = spike;
      const spikeWidth = 14;
      const count = Math.max(1, Math.floor(w / spikeWidth));
      const step = w / count;

      for (let i = 0; i < count; i++) {
        const sx = x + i * step;

        // Base sharp triangle
        ctx.beginPath();
        if (dir === 'up') {
          ctx.moveTo(sx, y + h);
          ctx.lineTo(sx + step / 2, y);
          ctx.lineTo(sx + step, y + h);
        } else if (dir === 'down') {
          ctx.moveTo(sx, y);
          ctx.lineTo(sx + step / 2, y + h);
          ctx.lineTo(sx + step, y);
        }
        ctx.closePath();

        // Dark clean fill matching world
        ctx.fillStyle = '#1f1f2b';
        ctx.fill();

        // Warning crimson tip on spikes
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  };

  const drawSaws = (ctx: CanvasRenderingContext2D, saws: SawBlade[]) => {
    saws.forEach((saw) => {
      // Sleek minimal track
      ctx.strokeStyle = '#2b2b3b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(saw.trackStart.x, saw.trackStart.y);
      ctx.lineTo(saw.trackEnd.x, saw.trackEnd.y);
      ctx.stroke();

      // Spinning saw blade
      ctx.save();
      ctx.translate(saw.x, saw.y);
      ctx.rotate(saw.angle);

      // Main steel blade body
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, 0, saw.radius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp razor teeth
      const teeth = 8;
      ctx.fillStyle = '#cbd5e1';
      for (let t = 0; t < teeth; t++) {
        const a = (Math.PI * 2 * t) / teeth;
        const tx = Math.cos(a) * (saw.radius + 4);
        const ty = Math.sin(a) * (saw.radius + 4);
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center rivet
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  const drawSmashers = (ctx: CanvasRenderingContext2D, smashers: Smasher[]) => {
    smashers.forEach((s) => {
      // Clean monolithic stone thwomp body
      ctx.fillStyle = '#272736';
      ctx.fillRect(s.x, s.y, s.w, s.h);

      // Inner beveled face
      ctx.fillStyle = '#1c1c28';
      ctx.fillRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);

      // Angry glowing red eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.x + 10, s.y + 14, 8, 6);
      ctx.fillRect(s.x + s.w - 18, s.y + 14, 8, 6);

      // Sharp bottom teeth
      ctx.fillStyle = '#e2e8f0';
      const teeth = 3;
      const step = s.w / teeth;
      for (let i = 0; i < teeth; i++) {
        const tx = s.x + i * step;
        ctx.beginPath();
        ctx.moveTo(tx, s.y + s.h);
        ctx.lineTo(tx + step / 2, s.y + s.h + 8);
        ctx.lineTo(tx + step, s.y + s.h);
        ctx.fill();
      }
    });
  };

  const drawSwitches = (ctx: CanvasRenderingContext2D, switches: SwitchButton[]) => {
    switches.forEach((sw) => {
      const { x, y, w, h, pressed } = sw;
      ctx.fillStyle = '#222230';
      ctx.fillRect(x - 3, y + h - 3, w + 6, 4);

      const btnHeight = pressed ? 2 : h;
      const btnY = pressed ? y + h - 2 : y;

      ctx.fillStyle = pressed ? '#22c55e' : '#f59e0b';
      ctx.fillRect(x, btnY, w, btnHeight);
    });
  };

  /**
   * Beautiful, expressive Level Devil Exit Door!
   * Features glowing arch doorway, warm golden radiance,
   * expressive cartoon eyes that look at player or panic when fleeing!
   */
  const drawDoor = (
    ctx: CanvasRenderingContext2D,
    door: LevelData['door'],
    player: Player,
    tick: number
  ) => {
    const { x, y, w, h, locked, hasFled } = door;
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    // 1. Ambient Warm Golden Light radiating onto the floor
    if (!locked) {
      const glowGrad = ctx.createRadialGradient(
        centerX,
        y + h - 4,
        6,
        centerX,
        y + h - 4,
        w * 1.6
      );
      glowGrad.addColorStop(0, 'rgba(250, 204, 21, 0.35)');
      glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, y + h, w * 1.4, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Door Frame (Archway)
    // Outer wooden / golden arch
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 6, w + 8, h + 6, [14, 14, 0, 0]);
    ctx.fillStyle = '#78350f';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // 3. Inner Doorway
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [10, 10, 0, 0]);

    if (locked) {
      // Locked dark door
      ctx.fillStyle = '#1c1917';
      ctx.fill();

      // Chains across door
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x + w, y + h - 10);
      ctx.moveTo(x + w, y + 10);
      ctx.lineTo(x, y + h - 10);
      ctx.stroke();

      // Golden Padlock in center
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(centerX - 7, centerY - 6, 14, 12);
      ctx.strokeStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 6, 5, Math.PI, 0);
      ctx.stroke();
    } else {
      // Warm, radiant glowing portal light!
      const portalGrad = ctx.createLinearGradient(centerX, y, centerX, y + h);
      portalGrad.addColorStop(0, '#fef08a');
      portalGrad.addColorStop(0.5, '#f59e0b');
      portalGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = portalGrad;
      ctx.fill();

      // Upward floating light specks
      for (let i = 0; i < 3; i++) {
        const sparkOffset = ((tick * 1.5 + i * 25) % h);
        const sparkX = centerX + Math.sin(tick * 0.1 + i) * (w * 0.3);
        const sparkY = y + h - sparkOffset;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sparkX, sparkY, 2, 2);
      }

      // Expressive Level Devil Door Eyes!
      // In Level Devil, the door has cute little eyes that look around
      const distToPlayer = Math.hypot(
        player.x + player.w / 2 - centerX,
        player.y + player.h / 2 - centerY
      );
      const isPlayerClose = distToPlayer < 120;
      const eyeDir = player.x < centerX ? -1.5 : 1.5;

      const eyeY = y + 18;
      const eyeLeftX = centerX - 6;
      const eyeRightX = centerX + 6;

      if (hasFled || (door.fleeDistance && isPlayerClose)) {
        // Panicked cartoon eyes right before or during runaway! (O.O)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeLeftX, eyeY, 4.5, 0, Math.PI * 2);
        ctx.arc(eyeRightX, eyeY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eyeLeftX, eyeY, 2, 0, Math.PI * 2);
        ctx.arc(eyeRightX, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Calm curious eyes watching the player
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeLeftX, eyeY, 3.5, 0, Math.PI * 2);
        ctx.arc(eyeRightX, eyeY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eyeLeftX + eyeDir, eyeY, 1.8, 0, Math.PI * 2);
        ctx.arc(eyeRightX + eyeDir, eyeY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Arch Lantern above door
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX, y - 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawBoss = (ctx: CanvasRenderingContext2D, boss: Boss, tick: number) => {
    if (boss.state === 'defeated') return;

    const { x, y, w, h, hp, maxHp, type, projectiles } = boss;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    // Floating aura
    const auraGrad = ctx.createRadialGradient(0, 0, w * 0.3, 0, 0, w * 0.8);
    auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
    auraGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.8, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'pharaoh' || type === 'devilKing') {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.fillStyle = '#1e293b';
      for (let s = -h / 2; s < h / 2; s += 16) {
        ctx.fillRect(-w / 2, s, w, 8);
      }

      ctx.fillStyle = '#fde047';
      ctx.fillRect(-w / 3, -h / 4, (w * 2) / 3, h / 2);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-w / 5, -h / 8, 8, 6);
      ctx.fillRect(w / 5 - 8, -h / 8, 8, 6);

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-6, h / 4, 12, 16);
    } else if (type === 'eyeOfRa') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, w / 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, w / 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#272736';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-12, -10, 8, 8);
      ctx.fillRect(4, -10, 8, 8);
    }

    ctx.restore();

    // HP Bar
    const hpBarW = 140;
    const hpBarH = 10;
    const hpBarX = x + w / 2 - hpBarW / 2;
    const hpBarY = y - 24;

    ctx.fillStyle = '#18181b';
    ctx.fillRect(hpBarX - 2, hpBarY - 2, hpBarW + 4, hpBarH + 4);

    const hpPercent = Math.max(0, hp / maxHp);
    ctx.fillStyle = hpPercent > 0.3 ? '#ef4444' : '#f97316';
    ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lang === 'bn' ? boss.nameBn : boss.name, x + w / 2, y - 32);

    // Boss Projectiles
    projectiles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach((p) => {
      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'bandage') {
        ctx.fillRect(p.x, p.y, p.size * 2, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  };

  const drawTorchLighting = (
    ctx: CanvasRenderingContext2D,
    player: Player,
    tick: number
  ) => {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const radius = 110 + Math.sin(tick * 0.1) * 8;

    const grad = ctx.createRadialGradient(px, py, 20, px, py, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0.99)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  };

  /**
   * Visual Arrow Navigation Guide System
   * Activates when the player double-clicks or double-taps the Hint Box!
   * Shows animated golden arrows, jump arcs, and clear badges pointing step-by-step
   * to victory: switches, true exit door, troll warnings, and fake floor hazards!
   */
  const drawArrowGuideSystem = (
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    player: Player,
    tick: number,
    currentLang: 'en' | 'bn'
  ) => {
    ctx.save();

    // 1. Objectives Detection
    const unpressedSwitch = level.switches.find((s) => !s.pressed);
    const doorDest = level.door.fleeTo
      ? { x: level.door.fleeTo.x + level.door.w / 2, y: level.door.fleeTo.y + level.door.h / 2 }
      : { x: level.door.x + level.door.w / 2, y: level.door.y + level.door.h / 2 };

    const startPt = {
      x: player.x + player.w / 2,
      y: player.y + player.h / 2
    };

    // 2. Safe Platforms Calculation
    const safePlatforms = level.platforms
      .filter((p) => p.type !== 'fake' && !p.fallen)
      .sort((a, b) => a.x - b.x);

    // Build Waypoints Route
    const waypoints: { x: number; y: number; isJump?: boolean; label?: string }[] = [];
    waypoints.push({ x: startPt.x, y: startPt.y });

    // Target for Stage 1
    const target1 = unpressedSwitch
      ? { x: unpressedSwitch.x + unpressedSwitch.w / 2, y: unpressedSwitch.y, isSwitch: true }
      : { x: doorDest.x, y: doorDest.y, isDoor: true };

    const minX1 = Math.min(startPt.x, target1.x);
    const maxX1 = Math.max(startPt.x, target1.x);
    const route1 = safePlatforms.filter(
      (p) => p.x + p.w >= minX1 - 25 && p.x <= maxX1 + 25
    );
    if (target1.x < startPt.x) route1.reverse();

    route1.forEach((p) => {
      const px = Math.max(p.x + 14, Math.min(p.x + p.w - 14, p.x + p.w / 2));
      const py = p.y - 10;
      const last = waypoints[waypoints.length - 1];
      if (Math.hypot(px - last.x, py - last.y) > 35) {
        waypoints.push({ x: px, y: py });
      }
    });

    if (unpressedSwitch) {
      waypoints.push({
        x: target1.x,
        y: target1.y - 8,
        label: currentLang === 'bn' ? '১. সুইচ চাপুন' : '1. Press Switch'
      });

      // Stage 2: from Switch to Door
      const switchX = target1.x;
      const doorX = doorDest.x;
      const minX2 = Math.min(switchX, doorX);
      const maxX2 = Math.max(switchX, doorX);
      const route2 = safePlatforms.filter(
        (p) => p.x + p.w >= minX2 - 25 && p.x <= maxX2 + 25
      );
      if (doorX < switchX) route2.reverse();

      route2.forEach((p) => {
        const px = Math.max(p.x + 14, Math.min(p.x + p.w - 14, p.x + p.w / 2));
        const py = p.y - 10;
        const last = waypoints[waypoints.length - 1];
        if (Math.hypot(px - last.x, py - last.y) > 35) {
          waypoints.push({ x: px, y: py });
        }
      });
    }

    waypoints.push({
      x: doorDest.x,
      y: doorDest.y - 10,
      label: unpressedSwitch
        ? (currentLang === 'bn' ? '২. আসল প্রস্থান দরজা' : '2. Real Exit Door')
        : (currentLang === 'bn' ? 'লক্ষ্য: প্রস্থান দরজা' : 'Goal: Exit Door')
    });

    // 3. Draw Flowing Neon Glowing Path Ribbon
    const dashOffset = -(tick * 2.5) % 28;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = dashOffset;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < waypoints.length; i++) {
      const pt = waypoints[i];
      if (i === 0) {
        ctx.moveTo(pt.x, pt.y);
      } else {
        const prev = waypoints[i - 1];
        if (Math.abs(pt.x - prev.x) > 45 || pt.y < prev.y - 18) {
          const midX = (prev.x + pt.x) / 2;
          const peakY = Math.min(prev.y, pt.y) - 45;
          ctx.quadraticCurveTo(midX, peakY, pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
    }
    ctx.stroke();

    // Reset shadow for badges and clean chevrons
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // 4. Draw Animated Directional Arrowheads along path
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 18) continue;

      const angle = Math.atan2(dy, dx);
      const arrowCount = Math.max(1, Math.floor(dist / 55));

      for (let a = 1; a <= arrowCount; a++) {
        const progress = ((a / (arrowCount + 1)) + (tick * 0.02)) % 1;
        const ax = p1.x + dx * progress;
        const ay = p1.y + dy * progress;

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Draw Jump Badge if high leap or wide gap
      if (p2.y < p1.y - 25 || Math.abs(p2.x - p1.x) > 65) {
        const midX = (p1.x + p2.x) / 2;
        const midY = Math.min(p1.y, p2.y) - 40;

        ctx.fillStyle = 'rgba(234, 179, 8, 0.92)';
        ctx.beginPath();
        ctx.roundRect(midX - 22, midY - 9, 44, 18, 5);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentLang === 'bn' ? '▲ লাফ' : '▲ JUMP', midX, midY);
      }
    }

    // 5. Objective Markers
    if (unpressedSwitch) {
      const swX = unpressedSwitch.x + unpressedSwitch.w / 2;
      const swY = unpressedSwitch.y;
      const pulse = Math.sin(tick * 0.15) * 4;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(swX, swY + 5, 18 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(swX, swY - 3 + pulse);
      ctx.lineTo(swX - 6, swY - 14 + pulse);
      ctx.lineTo(swX + 6, swY - 14 + pulse);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(swX - 44, swY - 32 + pulse, 88, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentLang === 'bn' ? '① সুইচ চাপুন' : '1. Press Switch', swX, swY - 24 + pulse);
    }

    // Exit Door Target Marker
    const doorPulse = Math.sin(tick * 0.12) * 4;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(doorDest.x, doorDest.y, 22 + doorPulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(doorDest.x, doorDest.y - 18 + doorPulse);
    ctx.lineTo(doorDest.x - 7, doorDest.y - 30 + doorPulse);
    ctx.lineTo(doorDest.x + 7, doorDest.y - 30 + doorPulse);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(doorDest.x - 48, doorDest.y - 48 + doorPulse, 96, 17, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      unpressedSwitch
        ? (currentLang === 'bn' ? '② প্রস্থান দরজা' : '2. Exit Door')
        : (currentLang === 'bn' ? 'লক্ষ্য: প্রস্থান' : 'Goal: Exit Door'),
      doorDest.x,
      doorDest.y - 40 + doorPulse
    );

    // 6. Troll Door Detection
    if (level.door.fleeTo && !level.door.hasFled) {
      const fakeX = level.door.x + level.door.w / 2;
      const fakeY = level.door.y;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.roundRect(fakeX - 44, fakeY - 22, 88, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentLang === 'bn' ? '✖ দরজা পালাবে!' : '✖ Door Flees!', fakeX, fakeY - 14);
    }

    // 7. Fake Floors Danger Warning
    level.platforms.forEach((p) => {
      if (p.type === 'fake') {
        const fx = p.x + p.w / 2;
        const fy = p.y;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
        ctx.beginPath();
        ctx.roundRect(fx - 36, fy - 16, 72, 14, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentLang === 'bn' ? '⚠ ভুয়া মেঝে!' : '⚠ Fake Floor!', fx, fy - 9);
      }
    });

    // 8. Bouncy Spring Pad Jump Indicators
    level.platforms.forEach((p) => {
      if (p.type === 'bouncy') {
        const bx = p.x + p.w / 2;
        const by = p.y;
        const bPulse = Math.sin(tick * 0.15) * 3;

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by - 6, 14 + bPulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.roundRect(bx - 38, by - 28 + bPulse, 76, 16, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentLang === 'bn' ? '▲ স্প্রিং লাফ' : '▲ SPRING', bx, by - 20 + bPulse);
      }
    });

    // 9. Smasher Danger Traps Warning
    level.smashers.forEach((s) => {
      const sx = s.x + s.w / 2;
      const sy = s.y + s.h + 12;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.roundRect(sx - 42, sy, 84, 15, 3);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentLang === 'bn' ? '⚠ পাথর ফাঁকি দিন' : '⚠ Bait Smasher', sx, sy + 7.5);
    });

    // 10. On-Canvas Dynamic Step Walkthrough Banner at top center
    const walkthroughMsg = getLevelWalkthroughMessage(level, currentLang);
    ctx.font = 'bold 11px sans-serif';
    const textWidth = ctx.measureText(walkthroughMsg).width;
    const bannerW = Math.max(340, textWidth + 36);
    const bannerH = 26;
    const bannerX = STAGE_WIDTH / 2 - bannerW / 2;
    const bannerY = 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(walkthroughMsg, STAGE_WIDTH / 2, bannerY + bannerH / 2);

    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full max-w-[1020px] mx-auto select-none"
    >
      {/* Canvas Wrapper with Sleek Level Devil Frame */}
      <div className="relative w-full aspect-[16/9] max-h-[580px] bg-[#14141c] rounded-xl overflow-hidden shadow-2xl border-2 border-[#2b2b3a]">
        <canvas
          ref={canvasRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="w-full h-full object-contain block image-rendering-pixelated"
        />

        {/* Scanlines layer for authentic CRT aesthetic */}
        <div className="absolute inset-0 scanlines pointer-events-none opacity-20" />

        {/* In-game Level Devil Hint Banner (Double-clickable to toggle Arrow Guide) */}
        <div
          onClick={handleHintClick}
          onDoubleClick={handleToggleGuide}
          className={`absolute top-2.5 left-3 flex items-center gap-1.5 text-[10px] md:text-[11px] px-2.5 py-1.5 rounded-lg border backdrop-blur-md font-mono max-w-[70%] sm:max-w-md transition-all shadow-md cursor-pointer select-none pointer-events-auto ${
            effectiveGuideMode
              ? 'bg-amber-500/25 text-amber-200 border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20'
              : currentLevelDeaths >= 2
              ? 'bg-black/85 text-amber-300 border-amber-500/70 animate-pulse hover:border-amber-400'
              : 'bg-black/75 text-amber-300/90 border-neutral-700/60 hover:border-amber-500/50'
          }`}
          title={effectiveGuideMode ? translations[lang].guideActive : translations[lang].guideHintPrompt}
        >
          <span className="shrink-0 text-xs">{effectiveGuideMode ? '🎯' : '💡'}</span>
          <span className="truncate">
            {effectiveGuideMode
              ? (lang === 'bn' ? 'এরো গাইড সক্রিয়! (ডাবল ট্যাপে বন্ধ)' : 'Arrow Guide ON (Double-tap to close)')
              : (lang === 'bn' ? levelData.hintBn : levelData.hintEn)}
          </span>
          {!effectiveGuideMode && currentLevelDeaths >= 2 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold hidden sm:inline shrink-0 border border-amber-500/40">
              {lang === 'bn' ? '২× ট্যাপ = এরো' : '2× Tap = Guide'}
            </span>
          )}
        </div>

        {/* Top-Right Quick Guide, Pause & Restart Shortcuts */}
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5 z-20">
          {/* Guide Path Toggle Button */}
          <button
            onClick={handleToggleGuide}
            className={`px-2 py-1 rounded-md border backdrop-blur-xs text-[10px] font-mono transition-all shadow-sm cursor-pointer flex items-center gap-1 ${
              effectiveGuideMode
                ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-amber-500/30 ring-1 ring-amber-300'
                : 'bg-black/75 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/60'
            }`}
            title={effectiveGuideMode ? 'Turn off Guide Arrows' : 'Double-tap Hint or Click here for Guide Arrows'}
          >
            <span>🎯</span>
            <span className="hidden sm:inline">
              {effectiveGuideMode ? (lang === 'bn' ? 'গাইড: চালু' : 'Guide: ON') : (lang === 'bn' ? 'গাইড এরো' : 'Guide')}
            </span>
          </button>

          {/* Pause Button */}
          <button
            onClick={() => onPause && onPause()}
            className="px-2 py-1 bg-black/75 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-md border border-neutral-700/60 backdrop-blur-xs text-[10px] font-mono transition-colors shadow-sm cursor-pointer"
            title="Pause Game (P / Esc)"
          >
            ⏸ {translations[lang].pause}
          </button>
        </div>
      </div>

      {/* Mobile Ergonomic Touch Controls */}
      <div className="w-full mt-3 flex items-center justify-between gap-4 px-2 md:hidden">
        {/* Left & Right D-Pad */}
        <div className="flex items-center gap-3">
          <button
            onPointerDown={() => handleTouchStart('left')}
            onPointerUp={() => handleTouchEnd('left')}
            onPointerLeave={() => handleTouchEnd('left')}
            className="w-16 h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-100 font-bold rounded-lg border border-neutral-700 flex items-center justify-center text-xl shadow-md select-none touch-none"
            aria-label="Move Left"
          >
            ←
          </button>
          <button
            onPointerDown={() => handleTouchStart('right')}
            onPointerUp={() => handleTouchEnd('right')}
            onPointerLeave={() => handleTouchEnd('right')}
            className="w-16 h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-100 font-bold rounded-lg border border-neutral-700 flex items-center justify-center text-xl shadow-md select-none touch-none"
            aria-label="Move Right"
          >
            →
          </button>
        </div>

        {/* Quick Restart & Jump */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetLevel();
              onRestart();
            }}
            className="h-14 px-4 bg-red-950/80 active:bg-red-900 text-red-300 font-medium rounded-lg border border-red-800 flex items-center justify-center text-xs shadow-md select-none"
            aria-label="Restart Level"
          >
            ↺ {translations[lang].restart.split(' ')[0]}
          </button>
          <button
            onPointerDown={() => handleTouchStart('jump')}
            onPointerUp={() => handleTouchEnd('jump')}
            onPointerLeave={() => handleTouchEnd('jump')}
            className="w-24 h-14 bg-amber-600 active:bg-amber-500 text-neutral-950 font-black rounded-lg border border-amber-400 flex items-center justify-center text-sm shadow-lg select-none touch-none tracking-wide"
            aria-label="Jump"
          >
            {translations[lang].jump}
          </button>
        </div>
      </div>
    </div>
  );
};
