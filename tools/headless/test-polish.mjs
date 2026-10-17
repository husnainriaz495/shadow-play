import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    const FINALE = await b.actCount();   // the last act; the ending is FINALE + 1
    await b.evaluate(`window.__mod = (path) => import(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(path)).pop())`);
    await b.tap('Space'); await sleep(800);
    await b.evaluate(`(async () => { const { EventBus } = await __mod('/src/core/EventBus.js'); const { EVENTS } = await __mod('/src/core/events.js');
        window.__ign = []; EventBus.on(EVENTS.TILE_IGNITED, (e) => { if (e.row === 17) window.__ign.push({ col: e.col, t: performance.now() }); }); })()`);
    await b.evaluate(`${G}.scene.restart({ act: ${FINALE} })`); await sleep(1000);
    await b.screenshot(`${out}/paper-tiles.png`, { x: 40, y: 600, width: 520, height: 120, scale: 2 });

    // 3. backdrop
    const bg = await b.evaluate(`(() => { const img = ${G}.children.list.find(c => c.texture?.key === 'bg_act5'); return img ? { alpha: img.alpha, bottom: Math.round(img.y + (1 - img.originY) * img.height), top: Math.round(img.y - img.originY * img.height) } : null; })()`);
    check('bg_act5 shows at 20% opacity', bg && Math.abs(bg.alpha - 0.2) < 0.001, JSON.stringify(bg));
    check('it rests on the floor: bottom edge at y 680 (row 17)', bg && bg.bottom === 680, JSON.stringify(bg));

    // 1+2. let the fire run its course; the puppet climbs to safety first
    await b.evaluate(`${G}.player.body.reset(640, 560)`);       // on the stone block, out of the way
    await sleep(5200);
    await b.screenshot(`${out}/fire-front.png`, { x: 40, y: 480, width: 560, height: 240, scale: 1.6 });
    await sleep(6000);
    const ign = await b.evaluate(`__ign.slice().sort((a, b) => a.col - b.col)`);
    const gaps = ign.slice(1).map((e, i) => (e.t - ign[i].t) / 1000);
    console.log('  seconds between neighbouring floor tiles catching:', gaps.map((g) => g.toFixed(2)).join(' '));
    const first = gaps.slice(0, 2).reduce((a, b) => a + b) / 2, last = gaps.slice(-2).reduce((a, b) => a + b) / 2;
    check('front starts near 67 px/s (~0.60 s per tile)', Math.abs(40 / first - 67) < 8, (40 / first).toFixed(1) + ' px/s');
    check('front speeds up towards 90 px/s by the end', 40 / last > 40 / first + 10 && 40 / last <= 92, `${(40 / first).toFixed(1)} -> ${(40 / last).toFixed(1)} px/s`);
    const heat = await b.evaluate(`({ heat: ${G}.paperScreen.heat, shown: +${G}.paperScreen.shownHeat.toFixed(3), tint: ${G}.paperScreen.glow.tintTopLeft.toString(16) })`);
    check('heat reached 1 with all the paper caught', heat.heat === 1, JSON.stringify(heat));
    check('the light is tinted towards red-orange', heat.shown > 0.9 && heat.tint !== 'ffffff', JSON.stringify(heat));
    const route = await b.evaluate(`(() => { const L = ${G}.layer; const v = []; for (let c = 14; c <= 30; c++) v.push(L.getTileAt(c, 17)?.index ?? -1); return v; })()`);
    check('stone floor safety unchanged: cols 14-30 untouched', route.every((v) => v === 0), route.join(','));
    const warns = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    check('no console errors or warnings', warns.length === 0, warns.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
