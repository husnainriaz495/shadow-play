import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const T = `__g.scene.getScene('TitleScene')`;
const G = `__g.scene.getScene('GameScene')`;
const active = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
const labels = () => b.evaluate(`JSON.stringify(${T}.page.menu.texts.map(t => t.text))`);
const pick = async (label) => {
    await b.evaluate(`(() => { const m = ${T}.page.menu;
        const i = m.texts.findIndex(t => t.text.startsWith('${label}'));
        if (i >= 0) m.choose(i); })()`);
    await sleep(900);
};
const save = (act) => b.evaluate(`localStorage.clear(); localStorage.setItem('shadow-play.save',
    JSON.stringify({version:1,highestAct:${act},settings:{master:8,music:6,sfx:8,reduceMotion:false}}))`);
try {
    await b.goto(URL); await sleep(900);
    await save(3);
    await b.goto(URL); await sleep(4000); await b.attachGame();

    check('the menu offers every page', await labels() ===
        '["CONTINUE - ACT III","START THE SHOW","ACT SELECT","SETTINGS","HOW TO PLAY","CREDITS","QUIT"]',
        await labels());
    check('the logo is the real image, not text',
        await b.evaluate(`${T}.header[0].texture.key`) === 'logo');
    check('the curtain frames it', await b.evaluate(
        `${T}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key)).length`) === 2);
    check('a hand points at the selection', await b.evaluate(`${T}.page.menu.hand.visible`));

    // --- act select only lists what has been reached --------------------
    await pick('ACT SELECT');
    const acts = await labels();
    check('act select lists only the acts reached', acts ===
        '["I.  THE LIGHTING OF THE CANDLE","II.  THE GIANT","III.  MOTHS TO THE FLAME","BACK"]', acts);
    await pick('BACK');
    check('BACK returns to the menu', (await labels()).includes('QUIT'), await labels());

    // --- settings change the sound, and are remembered ------------------
    await pick('SETTINGS');
    check('settings shows the sliders and reduce motion',
        /MUSIC/.test(await labels()) && /REDUCE MOTION: OFF/.test(await labels()), await labels());
    const before = await b.evaluate(`JSON.parse(localStorage.getItem('shadow-play.save')).settings.music`);
    await pick('MUSIC');
    const after = await b.evaluate(`JSON.parse(localStorage.getItem('shadow-play.save')).settings.music`);
    check('a slider moves and is saved at once', after === before + 1, `${before} -> ${after}`);
    await pick('REDUCE MOTION');
    check('reduce motion toggles and is saved',
        await b.evaluate(`JSON.parse(localStorage.getItem('shadow-play.save')).settings.reduceMotion`) === true);
    check('...and the label says so', /REDUCE MOTION: ON/.test(await labels()), await labels());
    await pick('BACK');

    // --- the reading pages ----------------------------------------------
    await pick('HOW TO PLAY');
    check('how to play hides the logo so the page has room',
        await b.evaluate(`${T}.header[0].visible`) === false);
    check('...and is only a page with a way back', await labels() === '["BACK"]', await labels());
    await pick('BACK');
    check('the logo comes back', await b.evaluate(`${T}.header[0].visible`) === true);
    await pick('CREDITS');
    check('credits opens too', await labels() === '["BACK"]', await labels());
    await pick('BACK');

    // --- quit is honest about what a browser can do ---------------------
    await pick('QUIT');
    await sleep(2200);
    check('quit draws the curtain instead of pretending to close the tab',
        (await active()).includes('CurtainCallScene'), await active());
    check('...and thanks the audience', await b.evaluate(
        `__g.scene.getScene('CurtainCallScene').thanks.text`) === 'Thanks for watching the show');
    await b.tap('Space'); await sleep(1200);
    check('...with a way back to the menu', (await active()).includes('TitleScene'), await active());

    // --- a new show asks before throwing progress away ------------------
    await pick('START THE SHOW');
    check('with progress saved, a new show ASKS first', (await labels()).includes('FORGET MY PROGRESS'),
        await labels());
    await pick('NO');
    check('...and "no" goes back, keeping it', (await labels()).includes('CONTINUE'), await labels());

    await pick('START THE SHOW');
    await pick('YES'); await sleep(2400);
    check('START THE SHOW begins at Act 1', await b.evaluate(`${G}.actNumber`) === 1,
        'act ' + await b.evaluate(`${G}.actNumber`));
    check('...and the old progress is gone, so CONTINUE will not linger',
        await b.evaluate(`localStorage.getItem('shadow-play.save')`) === null);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
