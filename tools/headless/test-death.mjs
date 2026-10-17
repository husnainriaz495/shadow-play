import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const U = `__g.scene.getScene('UIScene')`;
const out = process.argv[3];
const panelTexts = `JSON.stringify(${G}.children.list.filter(o => o.type === 'Container')
    .flatMap(c => c.list.filter(o => o.type === 'Text').map(o => o.text)))`;
const curtainAt = `(() => { const h = ${G}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key));
    return h.length ? h[0].x / h[0].displayWidth : 0; })()`;
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(50); }
    throw new Error('timed out waiting for ' + label);
};
const die = async (act, how) => {
    await b.evaluate(`${G}.scene.restart({ act: ${act} })`); await sleep(1900);
    if (how === 'fall') await b.evaluate(`${G}.player.body.reset(760, 700)`);
    else await b.evaluate(`${G}.candle.wax = 0.2`);
    await waitFor(`${G}.death && ${G}.death.over === true`, 9000, 'the act to stop');
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(4200); await b.attachGame();
    await b.tap('Space'); await sleep(1700);
    // Expose the system the scene owns, for the checks below.
    await b.evaluate(`__g.scene.getScene('GameScene').constructor.prototype.__x = 1`);

    // --- falling in Act 4's gap ------------------------------------------
    await die(4, 'fall');
    await waitFor(`${curtainAt} > 0.95`, 6000, 'the curtain to close fully');
    check('falling closes the curtain ALL the way', await b.evaluate(curtainAt) > 0.95,
        'at ' + await b.evaluate(curtainAt));
    await waitFor(`${panelTexts}.includes('RETRY ACT')`, 5000, 'the death panel');
    const fell = await b.evaluate(panelTexts);
    check('...and shows the same panel, saying why', /fell through the stage/.test(fell), fell);
    check('...with Retry, Act Select and Main Menu',
        /RETRY ACT/.test(fell) && /ACT SELECT/.test(fell) && /MAIN MENU/.test(fell), fell);
    check('the gust warning is gone from the curtain',
        await b.evaluate(`${U}.gustWarning.bar.visible`) === false);
    if (out) await b.screenshot(`${out}/death-fell.png`);

    // --- the candle going out gets the SAME panel ------------------------
    await die(1, 'wax');
    await waitFor(`${panelTexts}.includes('RETRY ACT')`, 7000, 'the death panel');
    const wax = await b.evaluate(panelTexts);
    check('running out of wax shows the same panel', /RETRY ACT/.test(wax), wax);
    check('...with its own reason', /candle went out/.test(wax), wax);
    check('...and the puppet hangs limp', await b.evaluate(`${G}.rig.poser.limp`) === true);

    // --- R still retries instantly ---------------------------------------
    await b.tap('KeyR'); await sleep(1800);
    check('R retries the act', await b.evaluate(`${G}.death.over`) === false
        && await b.evaluate(`${G}.player.controls.enabled !== false`));
    check('...and counts as a restart', await b.evaluate(`${G}.restarts`) >= 1);

    // --- fire names itself ------------------------------------------------
    await b.evaluate(`${G}.scene.restart({ act: 5 })`); await sleep(1900);
    await b.evaluate(`${G}.candle.wax = 12; ${G}.player.hurtState.invulnerableUntil = -Infinity;
        ${G}.player.hurt(20, ${G}.player.x - 40, 'fire')`);
    await waitFor(`${panelTexts}.includes('RETRY ACT')`, 8000, 'the death panel');
    const fire = await b.evaluate(panelTexts);
    check('dying to the fire says so', /fire caught you/.test(fire), fire);
    if (out) await b.screenshot(`${out}/death-fire.png`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
