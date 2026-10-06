// Platformer Physics, Troll Triggers, and Game Engine Logic for Level Devil 2
import {
  Player,
  LevelData,
  Platform,
  Spike,
  SawBlade,
  Smasher,
  SwitchButton,
  Particle,
  Boss,
  BossProjectile
} from '../types/game';
import { sound } from '../audio/soundEngine';
import { haptics } from '../utils/haptics';
import { MummyRenderer } from './mummyRenderer';
import { STAGE_WIDTH, STAGE_HEIGHT } from './levelGenerator';

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export class PhysicsEngine {
  public static readonly GRAVITY = 0.50;
  public static readonly MOVE_SPEED = 4.0; // Balanced medium running speed
  public static readonly ACCEL_GROUND = 0.88;
  public static readonly ACCEL_AIR = 0.65; // Responsive air steering
  public static readonly DECEL_GROUND = 0.68;
  public static readonly DECEL_AIR = 0.88; // Controlled horizontal landing
  public static readonly JUMP_FORCE = -11.6; // High, generous jump height that easily clears platforms
  public static readonly TERMINAL_VELOCITY = 13.0;

  public static update(
    player: Player,
    level: LevelData,
    input: InputState,
    particles: Particle[],
    tick: number,
    onPlayerDeath: (reason: string) => void,
    onLevelClear: () => void,
    triggerScreenShake: (amount: number) => void
  ) {
    if (player.isDead) {
      // Update lingering death particles
      this.updateParticles(particles);
      return;
    }

    // 1. Controls (Check for reversed controls trap)
    const isReversed = level.traps.includes('reverseControls');
    const moveLeft = isReversed ? input.right : input.left;
    const moveRight = isReversed ? input.left : input.right;

    // 2. Horizontal Movement & Acceleration (Level Devil snappy precision)
    const currentPlat = this.getStandingPlatform(player, level.platforms);
    const isSlippery = currentPlat?.type === 'slippery';

    let targetVx = 0;
    if (moveLeft && !moveRight) {
      targetVx = -this.MOVE_SPEED;
      player.facing = 'left';
    } else if (moveRight && !moveLeft) {
      targetVx = this.MOVE_SPEED;
      player.facing = 'right';
    }

    if (isSlippery) {
      // Low friction sliding
      player.vx += (targetVx - player.vx) * 0.06;
    } else if (player.grounded) {
      // Ground movement: quick acceleration and immediate stops
      if (targetVx !== 0) {
        player.vx += (targetVx - player.vx) * this.ACCEL_GROUND;
      } else {
        player.vx *= this.DECEL_GROUND;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
      }
    } else {
      // Air movement: responsive steering while maintaining running jump momentum
      if (targetVx !== 0) {
        player.vx += (targetVx - player.vx) * this.ACCEL_AIR;
      } else {
        player.vx *= this.DECEL_AIR;
      }
    }

    // Apply wind gust trap if present
    if (level.traps.includes('sandstormGust') && level.windSpeed) {
      player.vx += level.windSpeed;
    }

    // 3. Timers: Coyote Time & Jump Buffer
    if (player.grounded) {
      player.coyoteTimer = 6; // 6 frames grace period after walking off edges
    } else {
      if (player.coyoteTimer > 0) player.coyoteTimer--;
    }

    if (input.jumpPressed) {
      player.jumpBufferTimer = 6; // Buffer jump press before landing
    } else {
      if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;
    }

    // 4. Vertical Movement, Variable Jump Cut & Gravity
    const gravityDir = level.gravityInverted ? -1 : 1;

    // Can we jump?
    const canJump = (player.grounded || player.coyoteTimer > 0) || (player.jumpCount < player.maxJumps && player.jumpCount > 0);
    const wantsJump = player.jumpBufferTimer > 0;

    if (wantsJump && canJump) {
      player.vy = this.JUMP_FORCE * gravityDir;
      player.jumpCount = player.grounded || player.coyoteTimer > 0 ? 1 : player.jumpCount + 1;
      player.grounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.isJumping = true;
      sound.playJump();

      // Trigger jump-punisher troll spikes
      level.spikes.forEach((spike) => {
        if (spike.triggerOnJump && spike.hidden) {
          spike.hidden = false;
          spike.isRevealed = true;
          sound.playTrapPop();
        }
      });
    }

    // Variable Jump Cut (Ensure a generous minimum jump height of at least 60px even on quick taps)
    if (player.isJumping && !input.jump) {
      if (gravityDir === 1 && player.vy < -5.5) {
        player.vy = -5.5; // Smooth short hop that still clears platforms
      } else if (gravityDir === -1 && player.vy > 5.5) {
        player.vy = 5.5;
      }
      player.isJumping = false;
    }

    // Apply Gravity
    player.vy += this.GRAVITY * gravityDir;
    if (Math.abs(player.vy) > this.TERMINAL_VELOCITY) {
      player.vy = Math.sign(player.vy) * this.TERMINAL_VELOCITY;
    }

    // Walk animation framing
    if (Math.abs(player.vx) > 0.4 && player.grounded) {
      player.animTimer++;
      if (player.animTimer % 3 === 0) {
        player.walkFrame++;
      }
    }

    // 5. Update Moving Obstacles & Traps
    this.updateTraps(level, player, triggerScreenShake);

    // 6. Boss AI & Updates
    if (level.isBoss && level.boss) {
      this.updateBoss(level.boss, player, particles, triggerScreenShake, onPlayerDeath);
    }

    // 7. Platform Collisions (X then Y for rock-solid collision response)
    player.x += player.vx;
    this.handleHorizontalCollisions(player, level.platforms);

    player.y += player.vy;
    player.grounded = false;
    this.handleVerticalCollisions(player, level.platforms);

    // 8. Spike Collisions (including proximity sprout spikes)
    for (const spike of level.spikes) {
      // Proximity reveal
      if (spike.hidden && spike.triggerDistance) {
        const dist = Math.hypot(
          player.x + player.w / 2 - (spike.x + spike.w / 2),
          player.y + player.h / 2 - (spike.y + spike.h / 2)
        );
        if (dist < spike.triggerDistance) {
          spike.hidden = false;
          spike.isRevealed = true;
          sound.playTrapPop();
        }
      }

      // Lethal collision check
      if (!spike.hidden && this.checkSpikeCollision(player, spike)) {
        this.killPlayer(player, particles, onPlayerDeath, triggerScreenShake, 'spike');
        return;
      }
    }

    // 9. Saw Collisions
    for (const saw of level.saws) {
      const sawCenterX = saw.x;
      const sawCenterY = saw.y;
      const playerCenterX = player.x + player.w / 2;
      const playerCenterY = player.y + player.h / 2;
      const dist = Math.hypot(playerCenterX - sawCenterX, playerCenterY - sawCenterY);

      if (dist < saw.radius + player.w * 0.38) {
        this.killPlayer(player, particles, onPlayerDeath, triggerScreenShake, 'saw');
        return;
      }
    }

    // 10. Smasher Collisions
    for (const smasher of level.smashers) {
      if (this.checkAABB(player, smasher)) {
        this.killPlayer(player, particles, onPlayerDeath, triggerScreenShake, 'smasher');
        return;
      }
    }

    // 11. Switch Button Press
    for (const sw of level.switches) {
      if (!sw.pressed && this.checkAABB(player, sw)) {
        sw.pressed = true;
        sound.playSwitch();
        triggerScreenShake(3);

        // Switch actions
        if (sw.targetId === 'door-unlock') {
          level.door.locked = false;
          level.door.fleeDistance = undefined; // Freeze runaway door permanently!
        } else if (sw.targetId.startsWith('boss-damage') && level.boss) {
          this.damageBoss(level.boss, level, particles, triggerScreenShake);
        }
      }
    }

    // 12. Runaway Door & Goal Check
    const door = level.door;
    const distToDoor = Math.hypot(
      player.x + player.w / 2 - (door.x + door.w / 2),
      player.y + player.h / 2 - (door.y + door.h / 2)
    );

    // Runaway Door Troll: Door flees when approached!
    if (door.fleeDistance && !door.hasFled && distToDoor < door.fleeDistance) {
      if (door.fleeTo) {
        door.x = door.fleeTo.x;
        door.y = door.fleeTo.y;
        door.hasFled = true;
        sound.playDoorFlee();
        triggerScreenShake(4);

        // Spawn poof particles at old door location
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: door.x + door.w / 2,
            y: door.y + door.h / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: '#fde047',
            size: 3,
            life: 1,
            maxLife: 22
          });
        }
      }
    }

    // Goal entry collision
    if (!door.locked && this.checkAABB(player, door)) {
      sound.playVictory();
      onLevelClear();
      return;
    }

    // 13. Fall off-screen death
    if (player.y > STAGE_HEIGHT + 40 || player.y < -80) {
      this.killPlayer(player, particles, onPlayerDeath, triggerScreenShake, 'void');
      return;
    }

    // Update particles
    this.updateParticles(particles);
  }

  private static updateTraps(
    level: LevelData,
    player: Player,
    triggerScreenShake: (amount: number) => void
  ) {
    // 1. Moving Platforms
    level.platforms.forEach((plat) => {
      if (plat.type === 'moving') {
        if (plat.vx !== undefined && plat.minX !== undefined && plat.maxX !== undefined) {
          plat.x += plat.vx;
          if (plat.x <= plat.minX) {
            plat.x = plat.minX;
            plat.vx *= -1;
          } else if (plat.x >= plat.maxX) {
            plat.x = plat.maxX;
            plat.vx *= -1;
          }
        }
        if (plat.vy !== undefined && plat.minY !== undefined && plat.maxY !== undefined) {
          plat.y += plat.vy;
          if (plat.y <= plat.minY) {
            plat.y = plat.minY;
            plat.vy *= -1;
          } else if (plat.y >= plat.maxY) {
            plat.y = plat.maxY;
            plat.vy *= -1;
          }
        }
      }
    });

    // 2. Crumbling Platforms
    level.platforms.forEach((plat) => {
      if (plat.type === 'crumble' && plat.isCrumbling && !plat.fallen) {
        plat.shakeTime = (plat.shakeTime || 0) + 1;
        // Crumble vibration
        plat.x += (Math.random() - 0.5) * 2;
        if (plat.shakeTime > 26) {
          plat.fallen = true;
          plat.y += 1000; // Move far away out of collision
          sound.playTrapPop();
          triggerScreenShake(2);
        }
      }
    });

    // 2. Moving Saws along track
    level.saws.forEach((saw) => {
      saw.angle += 0.22;
      const dx = saw.trackEnd.x - saw.trackStart.x;
      const dy = saw.trackEnd.y - saw.trackStart.y;
      const length = Math.hypot(dx, dy) || 1;

      saw.progress += (saw.speed / length) * (saw.forward ? 1 : -1);
      if (saw.progress >= 1) {
        saw.progress = 1;
        saw.forward = false;
      } else if (saw.progress <= 0) {
        saw.progress = 0;
        saw.forward = true;
      }

      saw.x = saw.trackStart.x + dx * saw.progress;
      saw.y = saw.trackStart.y + dy * saw.progress;
    });

    // 3. Ceiling Smashers (Thwomp logic)
    level.smashers.forEach((smasher) => {
      const pX = player.x + player.w / 2;
      if (smasher.state === 'idle') {
        if (pX >= smasher.triggerRange.minX && pX <= smasher.triggerRange.maxX) {
          smasher.state = 'falling';
        }
      } else if (smasher.state === 'falling') {
        smasher.y += 13; // Fast slam!
        if (smasher.y >= smasher.targetY) {
          smasher.y = smasher.targetY;
          smasher.state = 'ground';
          smasher.timer = 0;
          sound.playTrapPop();
          triggerScreenShake(5);
        }
      } else if (smasher.state === 'ground') {
        smasher.timer++;
        if (smasher.timer > 30) {
          smasher.state = 'rising';
        }
      } else if (smasher.state === 'rising') {
        smasher.y -= 2.6; // Slow rise
        if (smasher.y <= smasher.startY) {
          smasher.y = smasher.startY;
          smasher.state = 'idle';
        }
      }
    });
  }

  private static updateBoss(
    boss: Boss,
    player: Player,
    particles: Particle[],
    triggerScreenShake: (amount: number) => void,
    onPlayerDeath: (reason: string) => void
  ) {
    if (boss.state === 'defeated') return;

    boss.attackTimer++;

    // Boss floating hover motion
    boss.y = 80 + Math.sin(boss.attackTimer * 0.05) * 15;
    boss.x += Math.cos(boss.attackTimer * 0.03) * 1.5;

    // Boss Attack Patterns
    if (boss.attackTimer % 85 === 0) {
      sound.playBossRoar();
      triggerScreenShake(3);

      const dx = player.x + player.w / 2 - (boss.x + boss.w / 2);
      const dy = player.y + player.h / 2 - (boss.y + boss.h / 2);
      const dist = Math.hypot(dx, dy) || 1;

      const speed = 4.2;
      boss.projectiles.push({
        x: boss.x + boss.w / 2,
        y: boss.y + boss.h * 0.8,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        radius: 9,
        color: boss.type === 'eyeOfRa' ? '#f59e0b' : '#a855f7',
        life: 0
      });
    }

    // Update boss projectiles
    for (let i = boss.projectiles.length - 1; i >= 0; i--) {
      const proj = boss.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life++;

      const pCenterX = player.x + player.w / 2;
      const pCenterY = player.y + player.h / 2;
      const dist = Math.hypot(pCenterX - proj.x, pCenterY - proj.y);

      if (dist < proj.radius + player.w * 0.38) {
        this.killPlayer(player, particles, onPlayerDeath, triggerScreenShake, 'boss');
        return;
      }

      if (
        proj.life > 180 ||
        proj.x < 0 ||
        proj.x > STAGE_WIDTH ||
        proj.y < 0 ||
        proj.y > STAGE_HEIGHT
      ) {
        boss.projectiles.splice(i, 1);
      }
    }
  }

  private static damageBoss(
    boss: Boss,
    level: LevelData,
    particles: Particle[],
    triggerScreenShake: (amount: number) => void
  ) {
    boss.hp--;
    sound.playBossHit();
    triggerScreenShake(7);

    for (let i = 0; i < 20; i++) {
      particles.push({
        x: boss.x + boss.w / 2,
        y: boss.y + boss.h / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: '#facc15',
        size: 4 + Math.random() * 4,
        life: 1,
        maxLife: 30
      });
    }

    if (boss.hp <= 0) {
      boss.state = 'defeated';
      boss.projectiles = [];
      level.door.locked = false;
      sound.playVictory();
    }
  }

  private static handleHorizontalCollisions(player: Player, platforms: Platform[]) {
    for (const plat of platforms) {
      if (plat.type === 'fake' || plat.fallen) continue;

      if (this.checkAABB(player, plat)) {
        if (player.vx > 0) {
          player.x = plat.x - player.w;
        } else if (player.vx < 0) {
          player.x = plat.x + plat.w;
        }
        player.vx = 0;
      }
    }
  }

  private static handleVerticalCollisions(player: Player, platforms: Platform[]) {
    for (const plat of platforms) {
      if (plat.type === 'fake' || plat.fallen) continue;

      if (this.checkAABB(player, plat)) {
        if (player.vy > 0) {
          player.y = plat.y - player.h;
          player.vy = 0;
          player.grounded = true;
          player.jumpCount = 0;
          player.isJumping = false;

          // Bouncy spring platform launch!
          if (plat.type === 'bouncy') {
            player.vy = -14.8;
            player.grounded = false;
            sound.playJump();
          } else if (plat.type === 'moving' && plat.vx) {
            player.x += plat.vx; // Carry player along on moving platform
          }

          if (plat.type === 'crumble' && !plat.isCrumbling) {
            plat.isCrumbling = true;
            plat.shakeTime = 0;
          }
        } else if (player.vy < 0) {
          player.y = plat.y + plat.h;
          player.vy = 0;
        }
      }
    }
  }

  private static getStandingPlatform(player: Player, platforms: Platform[]): Platform | null {
    const feetY = player.y + player.h + 2;
    for (const plat of platforms) {
      if (plat.type === 'fake' || plat.fallen) continue;
      if (
        player.x + player.w > plat.x &&
        player.x < plat.x + plat.w &&
        Math.abs(feetY - plat.y) < 6
      ) {
        return plat;
      }
    }
    return null;
  }

  private static checkSpikeCollision(player: Player, spike: Spike): boolean {
    const margin = 3;
    return (
      player.x + margin < spike.x + spike.w &&
      player.x + player.w - margin > spike.x &&
      player.y + margin < spike.y + spike.h &&
      player.y + player.h - margin > spike.y
    );
  }

  private static checkAABB(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  private static killPlayer(
    player: Player,
    particles: Particle[],
    onPlayerDeath: (reason: string) => void,
    triggerScreenShake: (amount: number) => void,
    reason: string
  ) {
    if (player.isDead) return;
    player.isDead = true;
    sound.playDeath();
    haptics.death();
    triggerScreenShake(8);

    const deathParticles = MummyRenderer.createDeathParticles(player);
    particles.push(...deathParticles);

    onPlayerDeath(reason);
  }

  private static updateParticles(particles: Particle[]) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'bandage') {
        p.vy += 0.15;
        p.vx *= 0.98;
      } else if (p.type === 'sand') {
        p.vy += 0.08;
      }

      p.life++;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
      }
    }
  }
}
