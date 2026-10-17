import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const E = `__g.scene.getScene('EndScene')`;
const active = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
const out = process.argv[3];
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(60); }
    throw new Error('timed out waiting for ' + label);
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    // The show's last words come from CONFIG.ending.finalWords, so this
    // test keeps working if they are ever said differently.
    const WORDS = await b.config('ending.finalWords');

    const FINALE = await b.actCount();   // the last act; the ending is FINALE + 1
    await b.tap('Space'); await sleep(2200);

    // The last act's door leads here: goToAct(ACT_COUNT + 1). The curtain
    // now closes over that act first, and the ending OPENS it again before
    // the bow, so wait for the bow rather than guessing at the delay.
    await b.evaluate(`__g.scene.getScene('GameScene').flow.goToAct(${FINALE + 1})`);
    await waitFor(`__g.scene.isActive('EndScene')`, 4000, 'the ending to start');
    check('after the last act the ending runs, alone', (await active()) === 'EndScene', await active());
    await waitFor(`${E}.phase === 'bow'`, 4000, 'the curtain to open on the bow');

    // Watch the whole curtain call rather than sampling at fixed moments:
    // it must reach a deep bow AND come back up again (CONFIG.ending.bows).
    const leans = [];
    for (let i = 0; i < 28; i++) {
        leans.push(await b.evaluate(`${E}.puppet.lean`));
        if (i === 9 && out) await b.screenshot(`${out}/ending-bow.png`);
        await sleep(100);
    }
    const deep = Math.max(...leans);
    const afterDeep = leans.slice(leans.indexOf(deep));
    check('the puppet tips into a deep bow', deep > 20, 'deepest ' + deep.toFixed(1));
    check('...and straightens up again', Math.min(...afterDeep) < 5,
        'shallowest after it ' + Math.min(...afterDeep).toFixed(1));
    check('the rods are still on its hands', await b.evaluate(`${E}.puppet.rods.commandBuffer.length > 0`));

    const zoom = await b.evaluate(`${E}.cameras.main.zoom`);
    check('the camera creeps in on the bow', zoom > 2, 'zoom ' + zoom);

    await sleep(2600);
    const light = await b.evaluate(`${E}.lightLevel`);
    check('the candle burns out by itself', light < 0.6, 'light ' + light);

    await sleep(4200);
    check('the curtain then closes',
        await b.evaluate(`${E}.children.list.some(o => o.texture && /curtain/.test(o.texture.key))`));
    await sleep(2200);
    const fin = await b.evaluate(`(() => {
        const t = ${E}.children.list.filter(o => o.type === 'Text').map(o => o.text);
        return JSON.stringify(t);
    })()`);
    check('the last words are written on it', fin.includes(WORDS), `${fin} (expected ${WORDS})`);
    check('and the way back is offered', /Space/.test(fin), fin);
    if (out) await b.screenshot(`${out}/ending-fin.png`);

    // After the last words the programme rolls; Space runs it out, then leaves.
    await b.tap('Space');
    await waitFor(`${E}.phase === 'done'`, 6000, 'the end of the programme');
    await b.tap('Space'); await sleep(1000);
    check('Space returns to the title', (await active()).includes('TitleScene'), await active());

    // Skipping it from the start must not leave the player stuck.
    await b.evaluate(`__g.scene.stop('TitleScene'); __g.scene.start('EndScene')`);
    await waitFor(`${E}.phase === 'bow'`, 5000, 'the bow to start');
    await b.tap('Space');
    const skipped = await (async () => {
        try {
            await waitFor(`${E}.phase === 'done'`, 6000, 'the last words after a skip');
        } catch { /* fall through to the assertion, which reports what IS there */ }
        return b.evaluate(`JSON.stringify(${E}.children.list.filter(o => o.type === 'Text').map(o => o.text))`);
    })();
    check('Space cuts the curtain call short and still reaches the last words',
        skipped.includes(WORDS), `${skipped} (expected ${WORDS})`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
