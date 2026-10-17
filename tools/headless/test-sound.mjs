import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const T = `__g.scene.getScene('TitleScene')`;
const G = `__g.scene.getScene('GameScene')`;
const P = `__g.scene.getScene('PauseScene')`;
const pick = async (scene, label) => {
    await b.evaluate(`(() => { const m = ${scene}.page.menu;
        const i = m.texts.findIndex(t => t.text.startsWith('${label}'));
        if (i >= 0) m.choose(i); })()`);
    await sleep(850);
};
// Through SaveProgress, not raw storage: a fresh player's record is not
// written until something actually changes, which is correct.
const setting = (name) => b.evaluate(
    `(async () => (await __mod('/src/systems/SaveProgress.js')).SaveProgress.getSettings().${name})()`);
try {
    await b.goto(URL); await sleep(900);
    await b.evaluate(`localStorage.clear()`);
    await b.goto(URL); await sleep(4600); await b.attachGame();
    await b.actCount();   // sets up __mod

    // --- music is back on ------------------------------------------------
    check('music is switched back on in config', await b.evaluate(
        `(async () => (await __mod('/src/config.js')).CONFIG.audio.musicOn)()`) === true);

    // --- nothing is silent any more --------------------------------------
    const cover = await b.evaluate(`(async () => {
        const { SynthSounds } = await __mod('/src/systems/SynthSounds.js');
        const { ASSETS } = await __mod('/src/assets.js');
        const missing = ASSETS.sfx.filter((s) => !s.ready);
        return JSON.stringify({
            missing: missing.length,
            stood: missing.filter((s) => SynthSounds.has(s.key)).length
        });
    })()`);
    const { missing, stood } = JSON.parse(cover);
    check('every missing sound effect has a stand-in', stood === missing,
        `${stood} stand-ins for ${missing} missing files`);

    check('the boot report says which files are still missing',
        b.logs.some((l) => /sound files are still missing/.test(l)));
    check('...and which ones have no stand-in at all',
        b.logs.some((l) => /Still SILENT/.test(l) && /music_finale/.test(l)));

    // --- the dials turn BOTH ways ----------------------------------------
    await pick(T, 'SETTINGS');
    const start = await setting('music');
    check('a dial starts at its saved value', start > 0 && start < 10, 'music ' + start);

    await b.evaluate(`${T}.page.menu.turn(1, -1)`); await sleep(200);
    check('a dial turns DOWN', await setting('music') === start - 1,
        'music ' + await setting('music'));
    await b.evaluate(`${T}.page.menu.turn(1, 1)`); await sleep(200);
    check('...and back up', await setting('music') === start);

    // The bug this replaced: it used to wrap from silent back to full.
    for (let i = 0; i < 14; i++) await b.evaluate(`${T}.page.menu.turn(1, -1)`);
    await sleep(250);
    check('turning a dial all the way down STAYS at silent', await setting('music') === 0,
        'music ' + await setting('music'));
    for (let i = 0; i < 14; i++) await b.evaluate(`${T}.page.menu.turn(1, 1)`);
    await sleep(250);
    check('...and all the way up stops at full', await setting('music') === 10,
        'music ' + await setting('music'));

    check('each dial has a - and a + to click', await b.evaluate(
        `${T}.page.panel.container.list.filter(o => o.type === 'Text'
            && (o.text === '+' || o.text === '\u2212')).length`) === 6,
        await b.evaluate(`${T}.page.panel.container.list.filter(o => o.type === 'Text'
            && (o.text === '+' || o.text === '\u2212')).length`) + ' arrows');

    // --- the same page is reachable from the pause menu -------------------
    await pick(T, 'BACK');
    await pick(T, 'START THE SHOW'); await sleep(2600);
    await b.tap('Escape'); await sleep(1000);
    check('the pause menu offers settings and how to play', await b.evaluate(
        `JSON.stringify(${P}.page.menu.texts.map(t => t.text))`) ===
        '["RESUME","RESTART ACT","SOUND: ON","SETTINGS","HOW TO PLAY","BACK TO TITLE"]',
        await b.evaluate(`JSON.stringify(${P}.page.menu.texts.map(t => t.text))`));

    await pick(P, 'SETTINGS');
    check('...and it is the SAME settings page', await b.evaluate(
        `${P}.page.constructor.name`) === 'SettingsPage');
    await b.evaluate(`${P}.page.menu.turn(2, -1)`); await sleep(200);
    check('a dial can be turned down mid-act', await setting('sfx') < 8,
        'sfx ' + await setting('sfx'));

    await pick(P, 'BACK');
    check('BACK returns to the pause card', (await b.evaluate(
        `JSON.stringify(${P}.page.menu.texts.map(t => t.text))`)).includes('RESUME'));
    await b.tap('Escape'); await sleep(900);
    check('Esc from the pause card resumes the act',
        await b.evaluate(`${G}.scene.isActive()`) === true);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
