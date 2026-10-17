import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const U = `__g.scene.getScene('UIScene')`;
const out = process.argv[3];
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    const FINALE = await b.actCount();
    await b.tap('Space'); await sleep(1500);

    // --- the clock tightens act by act ----------------------------------
    const seen = [];
    for (let act = 1; act <= FINALE; act++) {
        await b.evaluate(`${G}.scene.restart({ act: ${act} })`); await sleep(1500);
        seen.push(JSON.parse(await b.evaluate(`(() => { const c = ${G}.candle;
            return JSON.stringify([Math.round(c.wax), c.drainScale]); })()`)));
    }
    console.log('    act:        ' + seen.map((_, i) => String(i + 1).padStart(5)).join(''));
    console.log('    start wax:  ' + seen.map((s) => String(s[0]).padStart(5)).join(''));
    console.log('    drain x:    ' + seen.map((s) => String(s[1]).padStart(5)).join(''));

    const waxes = seen.map((s) => s[0]);
    const drains = seen.map((s) => s[1]);
    check('every act is at least as tight as the one before',
        waxes.every((w, i) => i === 0 || w <= waxes[i - 1])
        && drains.every((d, i) => i === 0 || d >= drains[i - 1]));
    check('and the finale really is the tightest',
        waxes[FINALE - 1] < waxes[0] && drains[FINALE - 1] > drains[0]);
    check('an act past the table still gets a candle (dev keys)',
        await b.evaluate(`(async () => { const { Candle } = await __mod('/src/systems/Candle.js');
            return Candle.tuningFor(99).startWax > 0; })()`));

    // --- the player can SEE where they are ------------------------------
    await b.evaluate(`${G}.scene.restart({ act: 3 })`); await sleep(1600);
    check('the HUD says which act this is', await b.evaluate(`${U}.actTag.text`) === 'ACT III / V',
        await b.evaluate(`${U}.actTag.text`));
    if (out) await b.screenshot(`${out}/hud-act.png`);

    await b.evaluate(`${G}.flow.goToAct(4)`); await sleep(1400);
    const card = await b.evaluate(`JSON.stringify(__g.scene.getScene('ActCardScene')
        .children.list.filter(o => o.type === 'Text').map(o => o.text))`);
    check('the act card says how far through the show you are',
        /ACT IV OF V/.test(card), card);
    if (out) await b.screenshot(`${out}/card-of.png`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
