import { generateLevel } from './src/game/levelGenerator';

const l3 = generateLevel(3);
const l35 = generateLevel(35);

console.log('L3 platforms:', JSON.stringify(l3.platforms));
console.log('L35 platforms:', JSON.stringify(l35.platforms));

console.log('L3 archetype:', ((3 - 1) * 11) % 32);
console.log('L35 archetype:', ((35 - 1) * 11) % 32);
