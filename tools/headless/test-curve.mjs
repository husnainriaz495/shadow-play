/**
 * The difficulty curve is a CONTRACT, not a comment: CONFIG.acts says
 * what each act contains and how hard it is, and this fails if a map
 * disagrees with its row, or if the curve ever stops rising.
 */
import { act1 } from '../../src/levels/act1.js';
import { act2 } from '../../src/levels/act2.js';
import { act3 } from '../../src/levels/act3.js';
import { act4 } from '../../src/levels/act4.js';
import { act5 } from '../../src/levels/act5.js';
import { CONFIG } from '../../src/config.js';

const ACTS = [act1, act2, act3, act4, act5];
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const count = (map, ch) => map.join('').split(ch).length - 1;

console.log('  act                          wax  drain  drops  cps  hints  moths  vents  lures');
ACTS.forEach((act, i) => {
    const row = CONFIG.acts[i];
    const m = act.map;
    console.log('  ' + row.name.padEnd(28)
        + String(row.startWax).padStart(4)
        + ('x' + row.drainScale.toFixed(2)).padStart(7)
        + String(count(m, 'w')).padStart(7)
        + String(count(m, 'k')).padStart(5)
        + String(count(m, '?')).padStart(7)
        + String(count(m, 'm')).padStart(7)
        + String(count(m, '^')).padStart(7)
        + String(count(m, 'l')).padStart(7));
});

console.log('');
ACTS.forEach((act, i) => {
    const row = CONFIG.acts[i];
    const m = act.map;
    const got = { waxDrops: count(m, 'w'), checkpoints: count(m, 'k'),
        hints: count(m, '?'), moths: count(m, 'm'), vents: count(m, '^'), lures: count(m, 'l') };
    const wrong = Object.keys(got).filter((k) => got[k] !== row[k]);

    check(`act ${i + 1} matches its row in CONFIG.acts`, wrong.length === 0,
        wrong.map((k) => `${k}: map has ${got[k]}, table says ${row[k]}`).join('; '));
    // An act with nothing to say leaves `hints` off entirely.
    const hints = act.hints ?? [];

    check(`act ${i + 1}'s hints list matches its ? marks`,
        hints.length === count(m, '?'),
        `${hints.length} hints for ${count(m, '?')} marks`);
});

console.log('');
const drains = CONFIG.acts.map((a) => a.drainScale);
const waxes = CONFIG.acts.map((a) => a.startWax);
check('the candle drains faster every act', drains.every((d, i) => i === 0 || d > drains[i - 1]),
    drains.join(' -> '));
check('...and every act starts with no more wax than the last',
    waxes.every((w, i) => i === 0 || w <= waxes[i - 1]), waxes.join(' -> '));
check('act 1 is the gentlest in the show', drains[0] < 1 && waxes[0] === CONFIG.wax.max);
check('only the act with moths has lure lanterns',
    CONFIG.acts.every((a) => a.lures === 0 || a.moths > 0),
    CONFIG.acts.map((a) => `${a.moths}m/${a.lures}l`).join(' ')); 
check('act 1 is the only act that explains anything',
    CONFIG.acts[0].hints > 0 && CONFIG.acts.slice(1).every((a) => a.hints === 0),
    CONFIG.acts.map((a) => a.hints).join(','));
check('a wax drop is a top-up, not a refill',
    CONFIG.wax.dropAmount <= CONFIG.wax.max / 8,
    `a drop gives ${CONFIG.wax.dropAmount} of ${CONFIG.wax.max}`);
check('the finale is the tightest', drains[4] === Math.max(...drains) && waxes[4] === Math.min(...waxes));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
