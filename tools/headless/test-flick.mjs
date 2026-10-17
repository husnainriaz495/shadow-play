import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const halves = `${G}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key))`;
// How far across the halves are: 0 parked off the sides, 1 fully shut.
const amount = `(() => { const h = ${halves}; return h.length ? h[0].x / h[0].displayWidth : 0; })()`;
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(2400);

    const startX = await b.evaluate(`Math.round(${G}.player.x)`);
    await b.hold('ArrowRight', 600);
    const moved = await b.evaluate(`Math.round(${G}.player.x)`);

    // Watch the whole flick: it must come part-way in and go back out,
    // and must NEVER shut (that is the slow transition, not a retry).
    await b.tap('KeyR');
    const seen = [];
    for (let i = 0; i < 12; i++) { seen.push(await b.evaluate(amount)); await sleep(60); }
    const deepest = Math.max(...seen);

    check('R draws the curtain part-way in', deepest > 0.2, 'deepest ' + deepest.toFixed(2));
    check('...but never shuts it', deepest < 0.75, 'deepest ' + deepest.toFixed(2));
    await sleep(500);
    check('...and it is gone again straight after',
        await b.evaluate(`${halves}.length`) === 0);
    check('the act really restarted', await b.evaluate(`Math.round(${G}.player.x)`) === startX,
        `walked to ${moved}, start is ${startX}`);
    // Holding R (or falling repeatedly) must not stack flicks.
    await b.tap('KeyR'); await b.tap('KeyR'); await sleep(500);
    check('pressing R twice does not stack curtains',
        await b.evaluate(`${halves}.length`) <= 2, await b.evaluate(`${halves}.length`) + ' halves');
    await sleep(600);
    check('and it still ends clean', await b.evaluate(`${halves}.length`) === 0);
    check('the act is playable afterwards', await b.evaluate(`${G}.player.controls.enabled !== false`));

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
