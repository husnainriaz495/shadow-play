import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const row = (s) => s;
const map = [
  '################################',
  ...Array(15).fill('#..............................#'),
  '#.........P..................D.#',
  '#f~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#'
];
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(800);
    await b.evaluate(`window.__mod = (path) => import(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(path)).pop())`);
    const n = await b.evaluate(`(async () => {
        const { ACTS } = await __mod('/src/levels/index.js');
        const { CONFIG } = await __mod('/src/config.js');
        CONFIG.fire.startDelaySeconds = 0.4; CONFIG.fire.speedStart = 160; CONFIG.fire.speedEnd = 160; CONFIG.fire.burnToHoleSeconds = 0.9;
        ACTS.push({ title: 'Fire test', story: '', hints: [], map: ${JSON.stringify(map)} });
        return ACTS.length; })()`);
    await b.evaluate(`${G}.scene.restart({ act: ${n} })`); await sleep(900);
    const tileAt = (c, r) => `(${G}.layer.getTileAt(${c}, ${r})?.index ?? -1)`;
    const startX = await b.evaluate(`Math.round(${G}.player.x)`);
    const wax0 = await b.evaluate(`${G}.candle.wax`);

    // fire creeps right along the floor: col 1 burning, later cols 2..6 burning or holes
    await sleep(1600);
    const strip = await b.evaluate(`[1,2,3,4,5,6,7,8].map(c => ${tileAt('c', 17)})`);
    console.log('  floor cols 1-8 (0 wall, 1 paper, 2 burning, -1 hole):', strip.join(' '));
    check('fire spread along the paper', strip.slice(1, 6).some((v) => v === 2), strip.join(','));
    check('burnt tiles turned into holes', strip[0] === -1 && strip.slice(1, 4).includes(-1), strip.join(','));

    // the fire reaches the puppet: 15 wax, knocked forward, invulnerable
    let hurtAt = null, events = [];
    await b.evaluate(`(async () => { const { EventBus } = await __mod('/src/core/EventBus.js'); const { EVENTS } = await __mod('/src/core/events.js');
        window.__hurts = []; window.__died = 0;
        EventBus.on(EVENTS.PLAYER_HURT, (e) => window.__hurts.push({ t: performance.now(), amount: e.amount, source: e.source }));
        EventBus.on(EVENTS.PLAYER_DIED, () => window.__died++); })()`);
    for (let i = 0; i < 60; i++) { await sleep(100); const h = await b.evaluate(`__hurts.length`); if (h > 0) { hurtAt = i; break; } }
    const firstHurt = await b.evaluate(`({ hurts: __hurts.slice(), wax: ${G}.candle.wax, vx: Math.round(${G}.player.body.velocity.x), inv: ${G}.player.hurtState.invulnerable })`);
    check('touching the fire hurts (source fire, 15 wax)', firstHurt.hurts[0]?.amount === 15 && firstHurt.hurts[0]?.source === 'fire', JSON.stringify(firstHurt));
    check('the wax actually dropped by ~15', wax0 - firstHurt.wax >= 14, `wax ${wax0} -> ${firstHurt.wax}`);
    check('knocked back (forward, away from the fire)', firstHurt.vx > 0 || firstHurt.inv, JSON.stringify(firstHurt));
    await sleep(500);
    const within = await b.evaluate(`__hurts.filter(h => h.t - __hurts[0].t < 790).length`);
    check('no second hit inside the 0.8 s invulnerability', within === 1, 'hits within 0.8 s: ' + within);

    // eventually the floor under it is gone: falls out, PLAYER_DIED, and
    // the curtain comes down on it like any other death (systems/Death.js).
    let died = 0;
    for (let i = 0; i < 100 && !died; i++) { await sleep(100); died = await b.evaluate(`__died`); }
    check('fell through a hole: PLAYER_DIED announced', died === 1, 'died=' + died);

    for (let i = 0; i < 60 && !(await b.evaluate(`${G}.death.over`)); i++) await sleep(100);
    check('the act stops and the curtain comes down', await b.evaluate(`${G}.death.over`) === true);

    // R is still the fast way back in (PRD 4.8).
    await b.tap('KeyR'); await sleep(1800);
    const after = await b.evaluate(`({ x: Math.round(${G}.player.x), floor: ${tileAt(10, 17)} })`);
    check('R puts the puppet back at the start with the floor whole again',
        after.x === startX && after.floor !== -1, JSON.stringify({ startX, after }));
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
