import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const C = `__g.scene.getScene('ActCardScene')`;
const active = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(60); }
    throw new Error('timed out waiting for ' + label);
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();

    // --- Title opens the curtain on Act 1 -------------------------------
    await b.tap('Space'); await sleep(250);
    const mid = await b.evaluate(`(() => {
        const c = ${G}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key));
        return JSON.stringify(c.map(o => Math.round(o.x)));
    })()`);
    check('the act starts behind a closed curtain', mid !== '[]' && mid !== undefined, 'halves: ' + mid);
    await sleep(1600);
    const gone = await b.evaluate(`${G}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key)).length`);
    check('the curtain opens and is thrown away', gone === 0, gone + ' halves left');
    check('the act plays normally after it', await b.evaluate(`${G}.player.controls.enabled !== false`));

    // --- The act card between acts --------------------------------------
    // The curtain closes over the finished act first (ActFlow.goToAct).
    await b.evaluate(`${G}.flow.goToAct(2)`);
    await waitFor(`__g.scene.isActive('ActCardScene')`, 4000, 'the act card');
    check('finishing an act shows the act card', (await active()).includes('ActCardScene'), await active());
    const written = await b.evaluate(`${C}.title.text`);
    await sleep(500);
    const later = await b.evaluate(`${C}.title.text`);
    check('the title writes in letter by letter', written.length < later.length, `"${written}" -> "${later}"`);
    check('it is written on a CLOSED curtain',
        await b.evaluate(`Math.round(${C}.curtain.left.x) === Math.round(${C}.curtain.xAt(1).left)`));

    await b.tap('Space'); await sleep(120);
    check('Space finishes the writing at once',
        await b.evaluate(`${C}.title.text`) === 'ACT II — THE GIANT'.replace('II', 'II'),
        await b.evaluate(`${C}.title.text`));
    check('the story line is under it', (await b.evaluate(`${C}.story.text`)).length > 0);

    await b.tap('Space'); await sleep(900);
    check('a second Space starts the act behind the curtain',
        (await active()).includes('GameScene') && await b.evaluate(`${G}.actNumber`) === 2, await active());
    await sleep(1600);
    check('and the curtain opens on it',
        await b.evaluate(`${G}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key)).length`) === 0);

    // --- R must NOT re-run the reveal -----------------------------------
    await b.tap('KeyR'); await sleep(400);
    check('R restarts without the curtain', await b.evaluate(`${G}.curtainClosed`) === false);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
