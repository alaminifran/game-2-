import { generateLevel, STAGE_WIDTH, STAGE_HEIGHT } from './src/game/levelGenerator';

for (let lvl = 1; lvl <= 1000; lvl++) {
  const l = generateLevel(lvl);
  if (l.door.x > STAGE_WIDTH - 70 || l.door.x < 40 || l.door.y > STAGE_HEIGHT - 70 || l.door.y < 40) {
    console.log(`Level ${lvl} (arch ${((lvl - 1) * 11) % 32}) door near/out of bounds: (${l.door.x}, ${l.door.y})`);
  }
}
