import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const map = ['################################', ...Array(15).fill('#..............................#'),
  '#....P.......................D.#', '#f~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#'];
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(800);
    await b.evaluate(`window.__mod = (path) => import(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(path)).pop())`);
    const n = await b.evaluate(`(async () => { const { ACTS } = await __mod('/src/levels/index.js'); const { CONFIG } = await __mod('/src/config.js');
        CONFIG.fire.startDelaySeconds = 0.3; CONFIG.fire.spreadSeconds = 0.25; CONFIG.fire.burnToHoleSeconds = 3;
        ACTS.push({ title: 'Hit test', story: '', hints: [], map: ${JSON.stringify(map)} }); return ACTS.length; })()`);
    await b.evaluate(`${G}.scene.restart({ act: ${n} })`); await sleep(700);
    await b.evaluate(`(async () => { const { EventBus } = await __mod('/src/core/EventBus.js'); const { EVENTS } = await __mod('/src/core/events.js');
        window.__hit = null; EventBus.once(EVENTS.PLAYER_HURT, () => { const g = ${G};
          window.__hit = { tinted: Object.values(g.rig.parts).every(p => p.isTinted), shaking: g.cameras.main.shakeEffect.isRunning }; }); })()`);
    let at = null;
    for (let i = 0; i < 80 && !at; i++) { await sleep(50); at = await b.evaluate(`window.__hit`); }
    await sleep(40);
    const right = await b.evaluate(`({ tinted: Object.values(${G}.rig.parts).every(p => p.isTinted), shaking: ${G}.cameras.main.shakeEffect.isRunning, alpha: +${G}.rig.container.alpha.toFixed(2) })`);
    check('a fire hit happened', !!at, 'no hit');
    check('puppet flashes white-hot (all parts tinted)', right.tinted, JSON.stringify(right));
    check('camera shakes', right.shaking, JSON.stringify(right));
    await sleep(80);
    const blinking = await b.evaluate(`+${G}.rig.container.alpha.toFixed(2)`);
    check('puppet blinks while invulnerable', blinking < 1, 'alpha ' + blinking);
    await b.evaluate(`${G}.player.body.reset(1100, 680)`);   // step well away from the fire
    await sleep(1100);
    const after = await b.evaluate(`({ tinted: Object.values(${G}.rig.parts).some(p => p.isTinted), alpha: ${G}.rig.container.alpha, shaking: ${G}.cameras.main.shakeEffect.isRunning })`);
    check('all back to normal afterwards (no tint, solid, still camera)', !after.tinted && after.alpha === 1 && !after.shaking, JSON.stringify(after));
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
