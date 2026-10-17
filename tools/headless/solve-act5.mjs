import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, mode] = process.argv;          // mode 'linger': wait on the block for the fire to finish
const b = await launch(profile ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
const st = () => b.evaluate(`(() => { const scenes = __g.scene.getScenes(true).map(s => s.scene.key).join(','); const g = ${G}; if (!g?.player?.body) return { scenes };
  const p = g.player; return { x: Math.round(p.x), feet: Math.round(p.feetY), size: p.state.name, onGround: p.body.blocked.down, wax: Math.round(g.candle.wax), scenes }; })()`);
const until = async (cond, ms, label) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (s && cond(s)) return s; await sleep(30); } throw new Error('timed out: ' + label + ' | last ' + JSON.stringify(await st())); };
const log = (step, s) => console.log(`  ${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ${step.padEnd(40)} x=${s.x} feet=${s.feet} ${s.size} wax=${s.wax}`);
let t0;
try {
    await b.goto(URL); await sleep(3500); await b.attachGame();
    const FINALE = await b.actCount();   // the last act; the ending is FINALE + 1
    await b.evaluate(`window.__mod = (path) => import(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(path)).pop())`);
    await b.tap('Space'); await sleep(800);
    await b.evaluate(`(async () => { const { EventBus } = await __mod('/src/core/EventBus.js'); const { EVENTS } = await __mod('/src/core/events.js');
        window.__hurt = 0; window.__died = 0; EventBus.on(EVENTS.PLAYER_HURT, () => window.__hurt++); EventBus.on(EVENTS.PLAYER_DIED, () => window.__died++); })()`);
    await b.evaluate(`${G}.scene.restart({ act: ${FINALE} })`); await sleep(900);
    t0 = Date.now();
    console.log('  title:', await b.evaluate(`${G}.currentAct.title`), '| backdrop:', await b.evaluate(`__g.textures.exists('bg_act5') ? 'bg_act5' : 'plain paper'`));

    if (mode === 'slow') { console.log('  ...a hesitant player: reads the hint for 2.5 s first'); await sleep(2500); }
    await b.down('ArrowRight');
    let s = await until((q) => q.x >= 300, 3000, 'run to the wall'); log('ran to the crawl wall', s);
    await b.tap('Digit1'); s = await until((q) => q.size === 'Tiny', 1500, 'shrink'); log('shrank to Tiny', s);
    s = await until((q) => q.x >= 440, 3000, 'crawl through'); log('crawled through the gap', s);
    await b.up('ArrowRight');
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 1500, 'grow Huge'); log('grew Huge', s);
    await b.down('ArrowRight'); await sleep(120);
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 560 && q.onGround, 3000, 'onto the block'); log('climbed onto the stone block', s);
    await b.up('ArrowRight');

    if (mode === 'linger') {
        console.log('  ...waiting on the block while the fire burns everything it can (22 s)');
        await sleep(22000);
        const floor = await b.evaluate(`(() => { const L = ${G}.layer; const v = []; for (let c = 1; c <= 30; c++) v.push(L.getTileAt(c, 17)?.index ?? -1); return v; })()`);
        console.log('  floor row 17, cols 1-30 (-1 hole, 0 stone):', floor.join(' '));
        const route = floor.slice(13);                                   // cols 14-30
        console.log(route.every((v) => v === 0) ? '  PASS  the route beyond the block is untouched stone' : '  FAIL  the fire reached the route ahead');
        console.log(floor.slice(0, 13).every((v) => v === -1) ? '  PASS  the paper floor behind has all burnt to holes' : '  note: some paper not yet burnt');
    }

    // Shrink ON the block: the hanging slab starts one tile past its
    // right edge, so a Huge puppet cannot even walk off it that way.
    await b.tap('Digit2'); s = await until((q) => q.size === 'Normal', 1500, 'back to Normal'); log('back to Normal for the passage', s);
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 740 && q.feet === 680 && q.onGround, 4000, 'drop off the block'); log('dropped down past the shelter', s);
    // Only as far as the crate: past the slab there is exactly one free
    // tile to stand in and grow, and then the crate is in the way.
    s = await until((q) => q.x >= 880, 4000, 'through the passage'); log('through the low passage', s);
    await b.up('ArrowRight'); await sleep(150);

    // THE FINAL EXAM: Huge to shove the crate flush against the last
    // ledge, then stand on it -- that ledge is 4 tiles and Huge jumps 3,
    // so the crate is the step, not a shortcut.
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 1500, 'grow Huge again'); log('grew Huge again', s);
    const crate = () => b.evaluate(`Math.round(${G}.objects.find(o => o.isMovable).x)`);
    console.log('  the crate starts at x =', await crate());
    await b.down('ArrowRight');
    await until((q) => q.x >= 920, 6000, 'push the crate to the ledge');
    await sleep(900);
    await b.up('ArrowRight');
    console.log('  ...pushed it to x =', await crate());

    await b.tap('Digit2'); await until((q) => q.size === 'Normal', 1500, 'back to Normal');
    await b.down('ArrowRight'); await sleep(100);
    await b.down('Space'); await sleep(300); await b.up('Space');
    s = await until((q) => q.feet === 600 && q.onGround, 4000, 'onto the crate'); log('climbed onto the crate', s);
    await b.down('Space'); await sleep(320); await b.up('Space');
    s = await until((q) => q.feet === 520 && q.onGround, 4000, 'onto the door ledge'); log('climbed the door ledge', s);
    s = await until((q) => q.scenes.includes('EndScene') || q.scenes.includes('ActCardScene'), 5000, 'reach the door');
    await b.up('ArrowRight');
    console.log(`\n  SOLVED in ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${s.scenes} | hurt ${await b.evaluate('__hurt')}x, fell ${await b.evaluate('__died')}x`);
} catch (e) { console.log('\n  STUCK: ' + e.message); process.exitCode = 1; }
finally {
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    console.log('  console errors:', errors.length ? errors.join(' | ') : 'none');
    b.close();
}
