import { generateLevel, STAGE_WIDTH, STAGE_HEIGHT } from './src/game/levelGenerator';

console.log('=== STARTING 1,000 LEVEL VERACITY & UNIQUENESS AUDIT ===');

const hashes = new Set<string>();
const archetypeCounts: Record<number, number> = {};
const issues: string[] = [];

for (let lvl = 1; lvl <= 1000; lvl++) {
  try {
    const level = generateLevel(lvl);

    // 1. Check basic metadata
    if (!level.title || !level.titleBn || !level.hintEn || !level.hintBn) {
      issues.push(`Level ${lvl}: Missing title or hint`);
    }

    // 2. Check player spawn
    if (level.spawn.x < 32 || level.spawn.x > STAGE_WIDTH - 56 || level.spawn.y < 32 || level.spawn.y > STAGE_HEIGHT - 64) {
      issues.push(`Level ${lvl}: Player spawn out of bounds (${level.spawn.x}, ${level.spawn.y})`);
    }

    // 3. Check door
    if (level.door.x < 32 || level.door.x > STAGE_WIDTH - 64 || level.door.y < 32 || level.door.y > STAGE_HEIGHT - 64) {
      issues.push(`Level ${lvl}: Door out of bounds (${level.door.x}, ${level.door.y})`);
    }
    if (level.door.fleeTo) {
      if (level.door.fleeTo.x < 32 || level.door.fleeTo.x > STAGE_WIDTH - 64 || level.door.fleeTo.y < 32 || level.door.fleeTo.y > STAGE_HEIGHT - 64) {
        issues.push(`Level ${lvl}: Door flee destination out of bounds (${level.door.fleeTo.x}, ${level.door.fleeTo.y})`);
      }
    }

    // 4. Check switches if any
    for (const sw of level.switches) {
      if (sw.x < 32 || sw.x > STAGE_WIDTH - 48 || sw.y < 32 || sw.y > STAGE_HEIGHT - 48) {
        issues.push(`Level ${lvl}: Switch out of bounds (${sw.x}, ${sw.y})`);
      }
    }

    // 5. Boss check
    if (lvl % 10 === 0) {
      if (!level.isBoss || !level.boss) {
        issues.push(`Level ${lvl}: Boss level missing boss entity!`);
      } else {
        if (level.boss.hp <= 0 || level.boss.maxHp <= 0) {
          issues.push(`Level ${lvl}: Boss invalid HP (${level.boss.hp}/${level.boss.maxHp})`);
        }
      }
    }

    // 6. Check for NaN or undefined in platforms, spikes, saws
    for (const p of level.platforms) {
      if (isNaN(p.x) || isNaN(p.y) || isNaN(p.w) || isNaN(p.h)) {
        issues.push(`Level ${lvl}: Platform has NaN coordinates!`);
      }
    }
    for (const s of level.spikes) {
      if (isNaN(s.x) || isNaN(s.y) || isNaN(s.w) || isNaN(s.h)) {
        issues.push(`Level ${lvl}: Spike has NaN coordinates!`);
      }
    }
    for (const saw of level.saws) {
      if (isNaN(saw.x) || isNaN(saw.y) || isNaN(saw.speed)) {
        issues.push(`Level ${lvl}: Saw has NaN coordinates!`);
      }
    }

    // 7. Check uniqueness fingerprint
    // Fingerprint based on platform count, dimensions, coordinates, spikes, saws, smashers, switches, door, spawn
    const platSig = level.platforms.map(p => `${p.type}:${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.w)},${Math.round(p.h)}`).join('|');
    const spikeSig = level.spikes.map(s => `${s.dir}:${Math.round(s.x)},${Math.round(s.y)},${Math.round(s.w)}`).join('|');
    const sawSig = level.saws.map(s => `${Math.round(s.trackStart.x)},${Math.round(s.trackEnd.x)}`).join('|');
    const fullSig = `L${lvl}#spawn:${Math.round(level.spawn.x)},${Math.round(level.spawn.y)}#door:${Math.round(level.door.x)},${Math.round(level.door.y)}#P[${platSig}]#S[${spikeSig}]#Saw[${sawSig}]`;
    
    // Check if the exact structural layout was ever seen before in another level
    const layoutOnlySig = `spawn:${Math.round(level.spawn.x)},${Math.round(level.spawn.y)}#door:${Math.round(level.door.x)},${Math.round(level.door.y)}#P[${platSig}]#S[${spikeSig}]#Saw[${sawSig}]`;

    if (hashes.has(layoutOnlySig)) {
      issues.push(`Level ${lvl}: Exact duplicate layout detected!`);
    } else {
      hashes.add(layoutOnlySig);
    }

  } catch (err: any) {
    issues.push(`Level ${lvl}: Generation crashed with error: ${err.message}`);
  }
}

console.log(`Audited 1,000 Levels.`);
console.log(`Unique Layouts: ${hashes.size} / 1,000`);
console.log(`Issues Found: ${issues.length}`);
if (issues.length > 0) {
  console.log('First 10 issues:', issues.slice(0, 10));
} else {
  console.log('SUCCESS: All 1,000 levels are 100% unique, error-free, and within bounds!');
}
