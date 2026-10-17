import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const C = `__g.scene.getScene('ActCardScene')`;
const out = process.argv[3];
const texts = () => b.evaluate(`JSON.stringify(${C}.children.list
    .filter(o => o.type === 'Text').map(o => o.text)
    .concat(${C}.resultsCard ? ${C}.resultsCard.panel.container.list
        .filter(o => o.type === 'Text').map(o => o.text) : []))`);
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(60); }
    throw new Error('timed out waiting for ' + label);
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.actCount();   // also sets up __mod, used at the end
    await b.tap('Space'); await sleep(1500);
    await b.evaluate(`${G}.scene.restart({ act: 2 })`); await sleep(1800);

    // Play a little, restart once, then finish: the card must report it.
    await b.hold('ArrowRight', 500);
    await b.tap('KeyR'); await sleep(1500);
    check('a restart is counted', await b.evaluate(`${G}.restarts`) === 1,
        await b.evaluate(`${G}.restarts`) + ' restarts');
    await sleep(1200);
    await b.evaluate(`${G}.flow.onActComplete()`);
    await waitFor(`__g.scene.isActive('ActCardScene')`, 5000, 'the act card scene');
    await waitFor(`${C}.resultsCard != null`, 3000, 'the results card');

    check('the results card is for the act just FINISHED',
        await b.evaluate(`${C}.resultsCard.stats.act`) === 2,
        'act ' + await b.evaluate(`${C}.resultsCard.stats.act`));
    check('...and the next act is not announced over it',
        await b.evaluate(`${C}.title.visible`) === false);

    const early = await texts();
    await waitFor(`${C}.resultsCard.shown === 1`, 3000, 'the numbers to finish');
    const late = await texts();
    check('the numbers count up rather than just appearing', early !== late,
        early + ' -> ' + late);
    check('it reports time, wax and restarts',
        /TIME/.test(late) && /WAX LEFT/.test(late) && /RESTARTS/.test(late), late);
    check('the restart it counted is shown', /"1"/.test(late), late);
    check('and it rates the act out of three candles',
        await b.evaluate(`${C}.resultsCard.candles.length`) === 3
        && await b.evaluate(`${C}.resultsCard.earned`) >= 1
        && await b.evaluate(`${C}.resultsCard.earned`) <= 3,
        'earned ' + await b.evaluate(`${C}.resultsCard.earned`));
    if (out) await b.screenshot(`${out}/results-card.png`);

    // --- it waits for the player, and nothing else is on screen ---------
    await waitFor(`${C}.resultsCard.ready === true`, 6000, 'the Continue prompt');
    // `ready` is set as the prompt STARTS fading in, so give it the fade.
    await waitFor(`${C}.resultsCard.prompt.alpha > 0.3`, 2000, 'the prompt to appear');
    check('it waits on a "Continue" prompt rather than a timer',
        /Continue/.test(await b.evaluate(`${C}.resultsCard.prompt.text`)),
        await b.evaluate(`${C}.resultsCard.prompt.text`));
    check('...and the next act is STILL not announced behind it',
        await b.evaluate(`${C}.title.visible`) === false
        && await b.evaluate(`${C}.story.visible`) === false);
    await sleep(1200);
    check('...and it does not move on by itself', await b.evaluate(`${C}.resultsDone`) !== true);

    // --- then it gets out of the way and the next act is announced ------
    await b.tap('Space');
    await waitFor(`${C}.title.visible === true`, 6000, 'the act card');
    check('the results card is gone before the act card starts',
        await b.evaluate(`${C}.resultsCard.panel.container.scene === undefined
            || ${C}.resultsCard.panel.container.active === false
            || ${C}.resultsCard.panel.container.scaleY === 0`));
    // Wait for the WHOLE title: the ink writes it a letter at a time, so
    // sampling early catches "ACT ".
    await waitFor(`${C}.ink != null && ${C}.ink.timer === null`, 6000, 'the title to finish writing');
    check('then the NEXT act is announced', /ACT III/.test(await b.evaluate(`${C}.title.text`)),
        await b.evaluate(`${C}.title.text`));
    if (out) await b.screenshot(`${out}/results-then-card.png`);

    await b.tap('Space'); await sleep(150); await b.tap('Space'); await sleep(2400);
    check('and the act actually starts', await b.evaluate(`${G}.actNumber`) === 3,
        'act ' + await b.evaluate(`${G}.actNumber`));
    check('with its restart count reset', await b.evaluate(`${G}.restarts`) === 0);

    // --- rating is honest ------------------------------------------------
    const rate = async (waxLeft, restarts) => b.evaluate(
        `(async () => { const { ResultsCard } = await __mod('/src/ui/ResultsCard.js');
          return ResultsCard.rate({ waxLeft: ${waxLeft}, waxMax: 100, restarts: ${restarts} }); })()`);
    check('a clean, wax-rich run earns three', await rate(80, 0) === 3);
    check('a scrappy one earns one', await rate(10, 0) === 1);
    check('restarts cost a candle', await rate(80, 3) === 2);
    check('but finishing is never worth nothing', await rate(1, 9) === 1);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
