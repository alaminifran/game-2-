import { generateLevel } from './src/game/levelGenerator';

const map = new Map<string, number>();

for (let lvl = 1; lvl <= 1000; lvl++) {
  const level = generateLevel(lvl);
  const platSig = level.platforms.map(p => `${p.type}:${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.w)},${Math.round(p.h)}`).join('|');
  const spikeSig = level.spikes.map(s => `${s.dir}:${Math.round(s.x)},${Math.round(s.y)},${Math.round(s.w)}`).join('|');
  const sawSig = level.saws.map(s => `${Math.round(s.trackStart.x)},${Math.round(s.trackEnd.x)}`).join('|');
  const sig = `spawn:${Math.round(level.spawn.x)},${Math.round(level.spawn.y)}#door:${Math.round(level.door.x)},${Math.round(level.door.y)}#P[${platSig}]#S[${spikeSig}]#Saw[${sawSig}]`;

  if (map.has(sig)) {
    console.log(`Level ${lvl} is duplicate of Level ${map.get(sig)}`);
  } else {
    map.set(sig, lvl);
  }
}
