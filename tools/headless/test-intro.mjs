import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const T = `__g.scene.getScene('TitleScene')`;
const P = `__g.scene.getScene('PreloadScene')`;
const scenes = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(50); }
    throw new Error('timed out waiting for ' + label);
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(300); await b.attachGame();
    await b.actCount();   // also sets up __mod, used just below

    // --- the loading screen is actually SEEN -----------------------------
    // Measure how long it stays up rather than sampling at one instant:
    // boot takes a varying moment, and what matters is the HOLD.
    await waitFor(`__g.scene.isActive('PreloadScene')`, 5000, 'the loading screen');
    const shownAt = Date.now();
    check('...with a candle drawn on it', await b.evaluate(
        `__g.scene.getScene('PreloadScene').candle != null`));

    await waitFor(`!__g.scene.isActive('PreloadScene')`, 8000, 'the loading screen to pass');
    const heldMs = Date.now() - shownAt;
    const minMs = await b.evaluate(`(async () => (await __mod('/src/config.js')).CONFIG.loading.minMs)()`);
    check('the loading screen is held, not flashed past', heldMs >= minMs * 0.7,
        `held ${heldMs}ms, CONFIG.loading.minMs is ${minMs}`);

    // --- then the curtain, shut, with the logo on it ---------------------
    await waitFor(`__g.scene.isActive('TitleScene')`, 5000, 'the title');
    const shut = await b.evaluate(`(() => { const t = ${T};
        return JSON.stringify([Math.round(t.left.x), Math.round(t.left.displayWidth)]); })()`);
    const [leftX, halfWidth] = JSON.parse(shut);
    check('the show starts behind a SHUT curtain', leftX >= halfWidth - 2,
        `left edge at ${leftX}, half is ${halfWidth} wide`);
    check('...with the logo lit on it', await b.evaluate(`${T}.header[0].visible`) === true);
    check('...and no menu yet', await b.evaluate(`${T}.page === null`));

    // --- which opens onto the menu ---------------------------------------
    await waitFor(`${T}.page !== null`, 6000, 'the menu');
    check('the curtain draws back and the menu appears', await b.evaluate(
        `${T}.page.menu.texts.length`) > 0);
    check('...parking at the sides as a frame', await b.evaluate(
        `Math.round(${T}.left.x)`) === 150, 'left at ' + await b.evaluate(`Math.round(${T}.left.x)`));

    // --- coming BACK from a game does not replay the intro ---------------
    await b.evaluate(`${T}.begin(1, 'test')`); await sleep(2600);
    await b.evaluate(`__g.scene.getScene('GameScene').scene.start('TitleScene')`); await sleep(1200);
    check('returning to the menu skips the curtain-up',
        await b.evaluate(`${T}.page !== null`) && await b.evaluate(`Math.round(${T}.left.x)`) === 150,
        'left at ' + await b.evaluate(`Math.round(${T}.left.x)`));

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
