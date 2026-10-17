import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const T = `__g.scene.getScene('TitleScene')`;
const active = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
const labels = () => b.evaluate(`JSON.stringify(${T}.page.menu.texts.map(t => t.text))`);
// The browser starts on about:blank, where localStorage is DENIED -- the
// page has to be the game's own origin before the save can be cleared.
const fresh = async () => {
    await b.goto(URL); await sleep(600);
    await b.evaluate(`localStorage.clear()`);
    await b.goto(URL); await sleep(3800); await b.attachGame();
};
await fresh();
const FINALE = await b.actCount();   // the last act; the ending is FINALE + 1

try {
    // --- a first-time player sees one option, and it starts at Act 1 ----
    check('a new player is not offered CONTINUE',
        !(await labels()).includes('CONTINUE') && (await labels()).includes('START THE SHOW'),
        await labels());
    await b.tap('Space'); await sleep(2600);
    check('...which starts at Act 1', await b.evaluate(`${G}.actNumber`) === 1,
        'act ' + await b.evaluate(`${G}.actNumber`));

    // --- finishing an act advances, and the curtain closes over it ------
    await b.evaluate(`${G}.flow.onActComplete()`); await sleep(400);
    check('the curtain closes over the act just finished', await b.evaluate(
        `${G}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key)).length`) === 2);
    check('...and the player cannot act during it',
        await b.evaluate(`${G}.player.controls.enabled`) === false);
    // The close runs for CONFIG.anim.curtainMs (700), then the card is up
    // for about 2.1 s. Sample inside that window, not after it.
    await sleep(900);
    check('then the act card for the NEXT act', (await active()).includes('ActCardScene'), await active());
    // Results card -> act card -> act. Each press finishes one step, so
    // press until the act is actually up rather than counting them.
    for (let i = 0; i < 6; i++) {
        if (await b.evaluate(`${G}.actNumber`) === 2 && await b.evaluate(`${G}.scene.isActive()`)) break;
        await b.tap('Space'); await sleep(700);
    }
    await sleep(1200);
    check('and Act 2 actually loads', await b.evaluate(`${G}.actNumber`) === 2,
        'act ' + await b.evaluate(`${G}.actNumber`));
    check('progress was saved', await b.evaluate(`JSON.parse(localStorage.getItem('shadow-play.save')).highestAct`) === 2);

    // --- coming back offers BOTH, and a new show still means Act 1 ------
    await b.goto(URL); await sleep(3800); await b.attachGame();
    check('a returning player is offered CONTINUE first',
        JSON.parse(await labels())[0] === 'CONTINUE - ACT II', await labels());
    await b.tap('ArrowDown'); await sleep(150);
    await b.tap('Space'); await sleep(900);     // "start over?" -- YES is first
    await b.tap('Space'); await sleep(2600);
    check('choosing a new show starts at Act 1, not the furthest act',
        await b.evaluate(`${G}.actNumber`) === 1, 'act ' + await b.evaluate(`${G}.actNumber`));

    // The step above deliberately threw the progress away, so put some
    // back before asking whether CONTINUE resumes it.
    await b.evaluate(`localStorage.setItem('shadow-play.save', JSON.stringify(
        { version: 1, highestAct: 2, settings: { master: 8, music: 5, sfx: 8, reduceMotion: false } }))`);
    await b.goto(URL); await sleep(3800); await b.attachGame();
    await b.tap('Space'); await sleep(2600);
    check('choosing continue resumes at the furthest act',
        await b.evaluate(`${G}.actNumber`) === 2, 'act ' + await b.evaluate(`${G}.actNumber`));

    // --- every act that exists must be reachable by playing -------------
    const count = await b.evaluate(`${G}.scene.manager.keys.GameScene.constructor.name ? 0 : 0`);
    const expected = Array.from({ length: FINALE }, (_, i) => i + 1).join(',');
    const reached = [];
    await fresh();
    await b.tap('Space'); await sleep(2600);
    for (let i = 0; i < 8; i++) {
        const act = await b.evaluate(`${G}.actNumber ?? null`);
        if (act !== null && !reached.includes(act)) reached.push(act);
        if ((await active()).includes('EndScene')) break;
        await b.evaluate(`(() => { const g = ${G}; if (g?.flow) g.flow.onActComplete(); })()`);
        await sleep(3400);
        await b.tap('Space'); await sleep(200); await b.tap('Space'); await sleep(2400);
    }
    const total = await b.evaluate(`${T} ? 0 : 0`);
    check('playing through reaches every act in order, then the ending',
        reached.join(',') === expected && (await active()).includes('EndScene'),
        'reached ' + reached.join(',') + ' | ended on ' + await active());

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
