// High-fidelity Pixel Art Mummy Renderer based on user's uploaded character sprite
import { Player, Particle } from '../types/game';
import { GhostFrame } from './ghostManager';

// Exact color palette matching the uploaded mummy sprite
export const MUMMY_PALETTE = {
  outline: '#3b2b23',
  shadow: '#8c7653',
  base: '#cbb68d',
  highlight: '#ebdcb6',
  whiteWrap: '#f8f1de',
  eyeBand: '#1f1614',
  eyeGlow: '#fde047',
  eyeCore: '#f59e0b',
  scarabGold: '#eab308'
};

// Spectral Cyan Palette for Speedrunner Ghost Mummy
export const MUMMY_GHOST_PALETTE = {
  outline: '#0284c7',
  shadow: '#0369a1',
  base: '#38bdf8',
  highlight: '#7dd3fc',
  whiteWrap: '#e0f2fe',
  eyeBand: '#082f49',
  eyeGlow: '#38bdf8',
  eyeCore: '#ffffff'
};

export class MummyRenderer {
  /**
   * Draws the pixel-art mummy on the canvas with bobbing, walking cycles,
   * facing direction, squash & stretch, and glowing eyes.
   */
  public static draw(ctx: CanvasRenderingContext2D, player: Player, tick: number) {
    ctx.save();

    const { x, y, w, h, facing, grounded, vx, vy, isDead } = player;

    if (isDead) {
      ctx.restore();
      return;
    }

    // Determine squash and stretch
    let scaleX = 1;
    let scaleY = 1;

    if (!grounded) {
      if (vy < -1) {
        // Jumping up: stretch vertically
        scaleX = 0.88;
        scaleY = 1.15;
      } else if (vy > 1) {
        // Falling down: slightly stretch
        scaleX = 0.92;
        scaleY = 1.1;
      }
    } else if (Math.abs(vx) > 0.5) {
      // Running bob
      const walkBob = Math.sin(player.walkFrame * 2) * 2;
      scaleY = 1 + walkBob * 0.04;
    }

    const centerX = x + w / 2;
    const centerY = y + h;

    ctx.translate(centerX, centerY);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.scale(scaleX, scaleY);
    ctx.translate(-w / 2, -h);

    // Disable image smoothing for razor-sharp pixel look
    ctx.imageSmoothingEnabled = false;

    // Draw the Mummy pixel by pixel or block by block for 24x32 grid
    const pixelSize = w / 16; // 16 horizontal virtual pixels

    // Virtual pixel grid matrix for mummy
    // 0: transparent, 1: outline, 2: base wrap, 3: highlight wrap, 4: shadow wrap, 5: eyeBand, 6: eyeGlow
    const isWalking = grounded && Math.abs(vx) > 0.3;
    const legPhase = isWalking ? Math.sin(player.walkFrame * 1.5) : 0;

    // Render Mummy Anatomy:
    // 1. Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 1, w * 0.45, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Legs & Feet
    const leftLegY = legPhase > 0 ? -legPhase * 3 : 0;
    const rightLegY = legPhase < 0 ? legPhase * 3 : 0;

    // Left Leg
    this.drawRect(ctx, 4 * pixelSize, (18 + leftLegY) * pixelSize, 3 * pixelSize, 5 * pixelSize, MUMMY_PALETTE.base);
    this.drawRect(ctx, 3 * pixelSize, (22 + leftLegY) * pixelSize, 4 * pixelSize, 2 * pixelSize, MUMMY_PALETTE.shadow);
    this.drawRect(ctx, 4 * pixelSize, (20 + leftLegY) * pixelSize, 3 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.outline);

    // Right Leg
    this.drawRect(ctx, 9 * pixelSize, (18 + rightLegY) * pixelSize, 3 * pixelSize, 5 * pixelSize, MUMMY_PALETTE.base);
    this.drawRect(ctx, 9 * pixelSize, (22 + rightLegY) * pixelSize, 4 * pixelSize, 2 * pixelSize, MUMMY_PALETTE.shadow);
    this.drawRect(ctx, 9 * pixelSize, (20 + rightLegY) * pixelSize, 3 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.outline);

    // 3. Torso / Body Bandages
    // Outer outline
    this.drawRect(ctx, 3 * pixelSize, 10 * pixelSize, 10 * pixelSize, 9 * pixelSize, MUMMY_PALETTE.outline);
    // Body fill
    this.drawRect(ctx, 4 * pixelSize, 11 * pixelSize, 8 * pixelSize, 7 * pixelSize, MUMMY_PALETTE.base);

    // Horizontal bandage strips
    this.drawRect(ctx, 4 * pixelSize, 11 * pixelSize, 8 * pixelSize, 2 * pixelSize, MUMMY_PALETTE.highlight);
    this.drawRect(ctx, 4 * pixelSize, 14 * pixelSize, 8 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.shadow);
    this.drawRect(ctx, 4 * pixelSize, 16 * pixelSize, 7 * pixelSize, 2 * pixelSize, MUMMY_PALETTE.highlight);
    this.drawRect(ctx, 7 * pixelSize, 12 * pixelSize, 1 * pixelSize, 6 * pixelSize, MUMMY_PALETTE.shadow); // diagonal cross wrap

    // 4. Arms
    const armSwing = isWalking ? Math.cos(player.walkFrame * 1.5) * 2 : 0;
    // Back arm (left in front facing)
    this.drawRect(ctx, (2 - armSwing * 0.5) * pixelSize, 11 * pixelSize, 2 * pixelSize, 6 * pixelSize, MUMMY_PALETTE.shadow);
    // Front arm
    this.drawRect(ctx, (12 + armSwing * 0.5) * pixelSize, 11 * pixelSize, 2.5 * pixelSize, 6 * pixelSize, MUMMY_PALETTE.base);
    this.drawRect(ctx, (12 + armSwing * 0.5) * pixelSize, 13 * pixelSize, 2.5 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.outline);

    // Flapping bandage strip from shoulder/waist
    const flutter = Math.sin(tick * 0.15) * 1.5;
    this.drawRect(ctx, 2 * pixelSize, (15 + flutter) * pixelSize, 1.5 * pixelSize, 3 * pixelSize, MUMMY_PALETTE.highlight);

    // 5. Head
    // Head outline
    this.drawRect(ctx, 2.5 * pixelSize, 1 * pixelSize, 11 * pixelSize, 10 * pixelSize, MUMMY_PALETTE.outline);
    // Head main wrap fill
    this.drawRect(ctx, 3.5 * pixelSize, 2 * pixelSize, 9 * pixelSize, 8 * pixelSize, MUMMY_PALETTE.base);

    // Top head wrap layers
    this.drawRect(ctx, 4 * pixelSize, 2 * pixelSize, 8 * pixelSize, 2 * pixelSize, MUMMY_PALETTE.highlight);
    this.drawRect(ctx, 5 * pixelSize, 1 * pixelSize, 6 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.shadow);
    this.drawRect(ctx, 3.5 * pixelSize, 4 * pixelSize, 9 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.shadow);

    // Mummy Eye Slot / Visor (Iconic dark bandage slit)
    this.drawRect(ctx, 3.5 * pixelSize, 5 * pixelSize, 9 * pixelSize, 2.5 * pixelSize, MUMMY_PALETTE.eyeBand);

    // Glowing Eyes inside the dark slot!
    const blink = Math.sin(tick * 0.05) > 0.96;
    if (!blink) {
      // Golden glowing eye
      const eyeX = facing === 'left' ? 5.5 : 8.5;
      this.drawRect(ctx, eyeX * pixelSize, 5.5 * pixelSize, 2 * pixelSize, 1.5 * pixelSize, MUMMY_PALETTE.eyeGlow);
      this.drawRect(ctx, (eyeX + 0.5) * pixelSize, 6 * pixelSize, 1 * pixelSize, 0.8 * pixelSize, MUMMY_PALETTE.eyeCore);

      // Other eye hint
      const secondEyeX = facing === 'left' ? 8.5 : 5.5;
      this.drawRect(ctx, secondEyeX * pixelSize, 5.8 * pixelSize, 1.2 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.eyeCore);
    }

    // Jaw / Chin bandages
    this.drawRect(ctx, 3.5 * pixelSize, 7.5 * pixelSize, 9 * pixelSize, 2 * pixelSize, MUMMY_PALETTE.highlight);
    this.drawRect(ctx, 4 * pixelSize, 9 * pixelSize, 8 * pixelSize, 1 * pixelSize, MUMMY_PALETTE.shadow);

    ctx.restore();
  }

  /**
   * Draws a semi-transparent, ethereal cyan speedrunner Ghost version of the Mummy.
   * Features glowing spectral aura, animated wisps, and PB timing badge.
   */
  public static drawGhost(
    ctx: CanvasRenderingContext2D,
    ghost: GhostFrame,
    tick: number,
    pbTimeSeconds?: number
  ) {
    ctx.save();

    const { x, y, facing, grounded, walkFrame, isJumping } = ghost;
    const w = 24;
    const h = 32;

    // Ethereal pulsating alpha
    const alpha = 0.48 + Math.sin(tick * 0.12) * 0.08;
    ctx.globalAlpha = alpha;

    // Glowing cyan spirit aura
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    let scaleX = 1;
    let scaleY = 1;

    if (!grounded || isJumping) {
      scaleX = 0.90;
      scaleY = 1.12;
    } else {
      const walkBob = Math.sin(walkFrame * 2) * 1.5;
      scaleY = 1 + walkBob * 0.03;
    }

    const centerX = x + w / 2;
    const centerY = y + h;

    ctx.translate(centerX, centerY);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.scale(scaleX, scaleY);
    ctx.translate(-w / 2, -h);

    ctx.imageSmoothingEnabled = false;
    const pixelSize = w / 16;
    const legPhase = Math.sin(walkFrame * 1.5);

    // 1. Ghost Shadow
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 1, w * 0.4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Ghost Legs
    const leftLegY = legPhase > 0 ? -legPhase * 2.5 : 0;
    const rightLegY = legPhase < 0 ? legPhase * 2.5 : 0;

    this.drawRect(ctx, 4 * pixelSize, (18 + leftLegY) * pixelSize, 3 * pixelSize, 5 * pixelSize, MUMMY_GHOST_PALETTE.base);
    this.drawRect(ctx, 3 * pixelSize, (22 + leftLegY) * pixelSize, 4 * pixelSize, 2 * pixelSize, MUMMY_GHOST_PALETTE.shadow);

    this.drawRect(ctx, 9 * pixelSize, (18 + rightLegY) * pixelSize, 3 * pixelSize, 5 * pixelSize, MUMMY_GHOST_PALETTE.base);
    this.drawRect(ctx, 9 * pixelSize, (22 + rightLegY) * pixelSize, 4 * pixelSize, 2 * pixelSize, MUMMY_GHOST_PALETTE.shadow);

    // 3. Ghost Torso
    this.drawRect(ctx, 3 * pixelSize, 10 * pixelSize, 10 * pixelSize, 9 * pixelSize, MUMMY_GHOST_PALETTE.outline);
    this.drawRect(ctx, 4 * pixelSize, 11 * pixelSize, 8 * pixelSize, 7 * pixelSize, MUMMY_GHOST_PALETTE.base);
    this.drawRect(ctx, 4 * pixelSize, 11 * pixelSize, 8 * pixelSize, 2 * pixelSize, MUMMY_GHOST_PALETTE.highlight);
    this.drawRect(ctx, 4 * pixelSize, 14 * pixelSize, 8 * pixelSize, 1 * pixelSize, MUMMY_GHOST_PALETTE.shadow);
    this.drawRect(ctx, 4 * pixelSize, 16 * pixelSize, 7 * pixelSize, 2 * pixelSize, MUMMY_GHOST_PALETTE.highlight);

    // 4. Ghost Arms
    const armSwing = Math.cos(walkFrame * 1.5) * 1.5;
    this.drawRect(ctx, (2 - armSwing * 0.5) * pixelSize, 11 * pixelSize, 2 * pixelSize, 6 * pixelSize, MUMMY_GHOST_PALETTE.shadow);
    this.drawRect(ctx, (12 + armSwing * 0.5) * pixelSize, 11 * pixelSize, 2.5 * pixelSize, 6 * pixelSize, MUMMY_GHOST_PALETTE.base);

    // 5. Ghost Head
    this.drawRect(ctx, 2.5 * pixelSize, 1 * pixelSize, 11 * pixelSize, 10 * pixelSize, MUMMY_GHOST_PALETTE.outline);
    this.drawRect(ctx, 3.5 * pixelSize, 2 * pixelSize, 9 * pixelSize, 8 * pixelSize, MUMMY_GHOST_PALETTE.base);
    this.drawRect(ctx, 4 * pixelSize, 2 * pixelSize, 8 * pixelSize, 2 * pixelSize, MUMMY_GHOST_PALETTE.highlight);

    // Ghost Eyes Band
    this.drawRect(ctx, 3.5 * pixelSize, 5 * pixelSize, 9 * pixelSize, 2.5 * pixelSize, MUMMY_GHOST_PALETTE.eyeBand);

    // Cyan Ghost Eyes
    const eyeX = facing === 'left' ? 5.5 : 8.5;
    this.drawRect(ctx, eyeX * pixelSize, 5.5 * pixelSize, 2 * pixelSize, 1.5 * pixelSize, MUMMY_GHOST_PALETTE.eyeGlow);
    this.drawRect(ctx, (eyeX + 0.5) * pixelSize, 6 * pixelSize, 1 * pixelSize, 0.8 * pixelSize, MUMMY_GHOST_PALETTE.eyeCore);

    // Chin
    this.drawRect(ctx, 3.5 * pixelSize, 7.5 * pixelSize, 9 * pixelSize, 2 * pixelSize, MUMMY_GHOST_PALETTE.highlight);

    ctx.restore();

    // Floating Speedrunner Badge above Ghost
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha + 0.25);
    const badgeText = pbTimeSeconds !== undefined ? `👻 PB: ${pbTimeSeconds.toFixed(2)}s` : '👻 GHOST';
    ctx.font = 'bold 9px monospace';
    const textWidth = ctx.measureText(badgeText).width;
    const badgeW = textWidth + 10;
    const badgeH = 15;
    const badgeX = x + w / 2 - badgeW / 2;
    const badgeY = y - 18 + Math.sin(tick * 0.1) * 2;

    ctx.fillStyle = 'rgba(8, 47, 73, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#bae6fd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, x + w / 2, badgeY + badgeH / 2);
    ctx.restore();
  }

  private static drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /**
   * Generates explosion of bandage strips, sand dust, and yellow eye sparks when mummy dies.
   */
  public static createDeathParticles(player: Player): Particle[] {
    const particles: Particle[] = [];
    const colors = [
      MUMMY_PALETTE.highlight,
      MUMMY_PALETTE.base,
      MUMMY_PALETTE.shadow,
      MUMMY_PALETTE.whiteWrap,
      MUMMY_PALETTE.eyeGlow
    ];

    // Bandage ribbons that spin and float
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 5;
      particles.push({
        x: player.x + player.w / 2 + (Math.random() - 0.5) * 10,
        y: player.y + player.h / 2 + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        life: 1,
        maxLife: 35 + Math.floor(Math.random() * 25),
        type: 'bandage'
      });
    }

    // Sand dust clouds
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: player.x + player.w / 2,
        y: player.y + player.h / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 3 - 1,
        color: '#bfa77b',
        size: 2 + Math.random() * 3,
        life: 1,
        maxLife: 20 + Math.floor(Math.random() * 15),
        type: 'sand'
      });
    }

    // Glowing eye spark
    particles.push({
      x: player.x + player.w / 2,
      y: player.y + player.h / 3,
      vx: (Math.random() - 0.5) * 2,
      vy: -4 - Math.random() * 2,
      color: MUMMY_PALETTE.eyeGlow,
      size: 4,
      life: 1,
      maxLife: 45,
      type: 'eyeGlow'
    });

    return particles;
  }
}
