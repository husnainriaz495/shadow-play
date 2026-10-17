import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const E = `__g.scene.getScene('EndScene')`;
const active = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(60); }
    throw new Error('timed out waiting for ' + label);
};
await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    // The show's last words come from CONFIG.ending.finalWords, so this
    // test keeps working if they are ever said differently.
    const WORDS = await b.config('ending.finalWords');

const FINALE = await b.actCount();   // the last act; the ending is FINALE + 1

// Reach the ending and wait until it is actually taking its bow: the
// curtain closes over the last act, then opens again on the ending.
const toEnding = async () => {
    await b.evaluate(`__g.scene.getScene('GameScene').flow.goToAct(${FINALE + 1})`);
    await waitFor(`__g.scene.isActive('EndScene')`, 5000, 'the ending');
    await waitFor(`${E}.phase === 'bow'`, 5000, 'the bow');
};
try {
    await b.tap('Space'); await sleep(2200);

    // --- 1. mashing Space must never strand the player ------------------
    await toEnding();
    check('the ending starts', (await active()) === 'EndScene', await active());
    for (let i = 0; i < 8; i++) { await b.tap('Space', 40); await sleep(110); }
    await sleep(2500);
    check('mashing Space never strands the player on a dead screen',
        !(await active()).includes('EndScene'), await active());

    // --- 2. one press per step, and it always reaches FIN ---------------
    await b.evaluate(`__g.scene.getScene('GameScene').scene.restart({ act: 1 })`); await sleep(1600);
    await toEnding();
    await b.tap('Space'); await sleep(250);          // cut the bow short
    check('one press cuts the bow short and starts the curtain',
        await b.evaluate(`${E}.phase`) === 'closing', await b.evaluate(`${E}.phase`));
    await b.tap('Space'); await sleep(250);          // snap the curtain shut
    check('the next snaps the curtain shut and starts the writing',
        await b.evaluate(`${E}.phase`) === 'writing', await b.evaluate(`${E}.phase`));
    check('the curtain really IS shut (it is not cancelled mid-sweep)',
        await b.evaluate(`(() => { const h = ${E}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key));
            return h.length === 2 && Math.round(h[0].x) === Math.round(h[0].displayWidth); })()`));
    await b.tap('Space'); await sleep(350);          // land the last letters
    check('the next lands the last words in full', await b.evaluate(`${E}.fin.text`) === WORDS,
        await b.evaluate(`${E}.fin.text`));
    // The last words now hand straight on to the programme (PRD 5.1), so the
    // way out comes after that, not here.
    check('...which rolls the programme', await b.evaluate(`${E}.phase`) === 'credits',
        await b.evaluate(`${E}.phase`));

    await b.tap('Space');
    await waitFor(`${E}.phase === 'done'`, 4000, 'the end of the programme');
    check('the next runs the programme to its end and offers the way out',
        await b.evaluate(`${E}.phase`) === 'done');

    // --- 3. and from there it leaves exactly once ----------------------
    await b.tap('Space'); await sleep(900);
    check('Space then returns to the menu', (await active()).includes('TitleScene'), await active());

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
