import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const E = `__g.scene.getScene('EndScene')`;
const out = process.argv[3];
const active = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(60); }
    throw new Error('timed out waiting for ' + label);
};
const toFin = async () => {
    await b.evaluate(`__g.scene.stop('TitleScene'); __g.scene.start('EndScene')`);
    await waitFor(`${E}.phase === 'bow'`, 6000, 'the bow');
    await b.tap('Space'); await waitFor(`${E}.phase === 'closing'`, 3000, 'the curtain');
    await b.tap('Space'); await waitFor(`${E}.phase === 'writing'`, 3000, 'the writing');
    await b.tap('Space'); await waitFor(`${E}.phase === 'credits'`, 3000, 'the credits');
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(4200); await b.attachGame();
    // The show's last words come from CONFIG.ending.finalWords, so this
    // test keeps working if they are ever said differently.
    const WORDS = await b.config('ending.finalWords');


    await toFin();
    check('the last words lead straight on to the credits, with no key press',
        await b.evaluate(`${E}.fin.text`) === WORDS);
    await waitFor(`${E}.credits != null`, 4000, 'the programme');
    check('the programme is a column, not a list of loose lines',
        await b.evaluate(`${E}.credits.column.list.length`) > 8,
        await b.evaluate(`${E}.credits.column.list.length`) + ' lines');
    check('...and it starts below the stage',
        await b.evaluate(`${E}.credits.column.y`) > 720);

    const first = await b.evaluate(`Math.round(${E}.credits.column.y)`);
    await sleep(1200);
    const later = await b.evaluate(`Math.round(${E}.credits.column.y)`);
    check('it scrolls upward like a programme', later < first, `${first} -> ${later}`);
    if (out) await b.screenshot(`${out}/ending-credits.png`);

    check('it reads as a theatre programme', await b.evaluate(
        `JSON.stringify(${E}.credits.column.list.map(t => t.text))`).then((s) =>
        /SHADOW PLAY/.test(s) && /ENGINE/.test(s) && /Thank you for watching/.test(s)));

    // --- Space runs it to the end, rather than cancelling it -------------
    await b.tap('Space');
    await waitFor(`${E}.phase === 'done'`, 3000, 'the end of the programme');
    check('Space runs the programme to its end', await b.evaluate(
        `Math.round(${E}.credits.column.y) === Math.round(${E}.credits.endY)`));
    check('...and offers the way back', await b.evaluate(`${E}.prompt.alpha`) >= 0);
    if (out) await b.screenshot(`${out}/ending-done.png`);

    await b.tap('Space'); await sleep(1100);
    check('Space then returns to the menu', (await active()).includes('TitleScene'), await active());

    // --- and it gets there on its own if nobody presses anything --------
    await toFin();
    await waitFor(`__g.scene.isActive('TitleScene')`, 60000, 'the ending to finish by itself');
    check('left alone, the ending plays out and returns to the menu by itself',
        (await active()).includes('TitleScene'), await active());

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
