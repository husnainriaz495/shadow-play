import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
// The leftmost drop ON THE FLOOR. Act 1 also has a bonus drop high in
// the air that only a Huge jump reaches, and walking cannot take that.
const drop = `${G}.objects.filter(o => o.constructor.name === 'WaxDrop' && o.y > 600)
    .sort((a, b) => a.x - b.x)[0]`;
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(800);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1500);
    await b.screenshot(`${out}/drop.png`, { x: 300, y: 610, width: 80, height: 80, scale: 4 });
    const before = await b.evaluate(`(() => { const d = ${drop}; return { glowVisible: d.glow.visible, glowAlpha: +d.glow.alpha.toFixed(2), sameX: d.glow.x === d.x, y: d.y, glowY: d.glow.y }; })()`);
    check('drop has a visible glow at its own position', before.glowVisible && before.sameX && Math.abs(before.y - before.glowY) < 0.01, JSON.stringify(before));
    await sleep(450);
    const later = await b.evaluate(`(() => { const d = ${drop}; return { y: +d.y.toFixed(2), glowY: +d.glow.y.toFixed(2) }; })()`);
    check('glow bobs together with the drop', later.y !== before.y && Math.abs(later.y - later.glowY) < 0.01, JSON.stringify({ before: before.y, later }));
    await b.hold('ArrowRight', 1800);               // real key: walk into the first drop
    await sleep(500);
    const taken = await b.evaluate(`(() => { const d = ${drop}; return { taken: d.taken, dropVisible: d.visible, glowVisible: d.glow.visible }; })()`);
    check('walking into it takes it, and the glow goes with it', taken.taken && !taken.dropVisible && !taken.glowVisible, JSON.stringify(taken));
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
