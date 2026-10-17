import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
const st = () => b.evaluate(`(() => { const g = ${G}; const scenes = __g.scene.getScenes(true).map(s => s.scene.key).join(','); if (!g?.player?.body) return { scenes }; const p = g.player, c = g.objects.find(o => o.constructor.name === 'Crate');
  return { x: Math.round(p.x), feet: Math.round(p.feetY), size: p.state.name, onGround: p.body.blocked.down, crateBottom: Math.round(c.body.bottom), crateX: Math.round(c.x), scenes }; })()`);
const until = async (cond, ms, label) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (s && cond(s)) return s; await sleep(40); } throw new Error('timed out: ' + label + ' | last ' + JSON.stringify(await st())); };
const log = (step, s) => console.log(`  ${step.padEnd(42)} x=${s.x} feet=${s.feet} ${s.size}`);
let t0;
try {
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);
    await b.evaluate(`${G}.scene.restart({ act: 2 })`); await sleep(1000);
    t0 = Date.now();

    await b.tap('Digit3'); let s = await until((q) => q.size === 'Huge', 1500, 'grow Huge'); log('grew Huge at the start', s);

    await b.down('ArrowRight');
    await until((q) => q.x >= 225, 4000, 'reach the first ledge');
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 560 && q.onGround, 3000, 'land on the first ledge'); log('climbed the 3-tile ledge (Huge jump)', s);

    s = await until((q) => q.crateBottom === 600, 9000, 'crate into the notch'); log('pushed the crate into the notch', s);
    for (let i = 0; i < 6 && (await st()).x < 760; i++) { await b.down('Space'); await sleep(300); await b.up('Space'); await sleep(500); }
    s = await until((q) => q.x >= 760 && q.onGround, 6000, 'past the crate'); log('hopped over the crate', s);
    await b.up('ArrowRight');

    await b.tap('Digit2'); s = await until((q) => q.size === 'Normal', 1500, 'shrink to Normal'); log('shrank to Normal for the doorway', s);
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 975, 6000, 'through the gate'); log('walked through the open gate', s);
    await b.up('ArrowRight'); await sleep(200);

    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 1500, 'grow Huge again'); log('grew Huge again', s);
    await b.down('ArrowRight'); await sleep(150);
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 440 && q.onGround, 3000, 'climb the door ledge'); log('climbed the door ledge', s);
    await until((q) => q.scenes.includes('EndScene') || q.scenes.includes('ActCardScene'), 6000, 'reach the door');
    await b.up('ArrowRight');
    console.log(`\n  SOLVED: reached the door in ${((Date.now() - t0) / 1000).toFixed(1)} s (scripted; a first-timer will be slower)`);
} catch (e) { console.log('\n  STUCK: ' + e.message); process.exitCode = 1; }
finally {
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    console.log('  console errors:', errors.length ? errors.join(' | ') : 'none');
    b.close();
}
