import { LevelValidator } from '../../src/systems/LevelValidator.js';
import { act1 } from '../../src/levels/act1.js';

let pass = 0, fail = 0;
const check = (name, got, want) => {
    const ok = want(got);
    console.log(ok ? `  PASS  ${name}` : `  FAIL  ${name}\n        got: ${JSON.stringify(got, null, 2)}`);
    ok ? pass++ : fail++;
};

console.log('--- the real Act 1 must be clean ---');
check('act1 has no problems', LevelValidator.validate(act1, 1), (p) => p.length === 0);

const good = act1.map;

// Act 1's map has three `?` markers, so a test level needs three hints or
// EVERY case also reports a hints mismatch and the "exactly one problem"
// assertions below stop meaning anything. Pass `hints` to break that on
// purpose.
const broken = (mutate, hints = ['one', 'two', 'three']) => {
    const m = [...good];
    mutate(m);
    return { title: 'Test', story: '', hints, map: m };
};

console.log('\n--- each deliberate mistake must be caught, by row number ---');
check('short row is caught and named',
    LevelValidator.validate(broken(m => { m[5] = m[5].slice(0, 31); }), 2),
    (p) => p.length === 1 && p[0].includes('row 5') && p[0].includes('31 characters'));

check('unknown symbol is caught with column',
    LevelValidator.validate(broken(m => { m[3] = 'X' + m[3].slice(1); }), 2),
    (p) => p.length === 1 && p[0].includes('row 3') && p[0].includes('column 0') && p[0].includes('"X"'));

check('missing player start is caught',
    LevelValidator.validate(broken(m => { m[16] = m[16].replace('P', '.'); }), 2),
    (p) => p.length === 1 && p[0].includes('found 0 "P"'));

check('two exit doors are caught',
    LevelValidator.validate(broken(m => { m[14] = m[14].replace('.D.', 'DD.'); }), 2),
    (p) => p.length === 1 && p[0].includes('found 2 "D"'));

check('wrong row count is caught',
    LevelValidator.validate({ title: 'T', story: '', hints: ['one', 'two', 'three'], map: good.slice(0, 17) }, 2),
    (p) => p.some(x => x.includes('17 rows')));

check('hint markers without text are caught',
    LevelValidator.validate(broken(m => { m[2] = '#?' + m[2].slice(2); }, []), 2),
    (p) => p.length === 1 && p[0].includes('4 "?"') && p[0].includes('0 lines'));

check('missing map entirely is caught, not thrown',
    LevelValidator.validate({ title: 'T' }, 4),
    (p) => p.length === 1 && p[0].includes('no map array'));

check('act number and title appear in the message',
    LevelValidator.validate(broken(m => { m[9] = ''; }), 3),
    (p) => p[0].includes('Act 3') && p[0].includes('Test'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
