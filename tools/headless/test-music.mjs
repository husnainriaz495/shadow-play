import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const playing = () => b.evaluate(`__g.sound.sounds.filter(s => s.isPlaying).map(s => s.key).join(', ') || '(nothing)'`);
const music = () => b.evaluate(`__g.sound.sounds.some(s => s.key.startsWith('music_') && s.isPlaying)`);
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.actCount();   // also sets up __mod

    // Browsers hold audio until the page has been touched.
    await b.tap('Space'); await sleep(400);
    console.log('  title, after a key press:', await playing());
    check('the theme plays on the menu', await music() === true);

    await sleep(1800);
    console.log('  in an act:', await playing());
    check('...and carries on into the act', await music() === true);

    // M silences everything, and says so.
    await b.tap('KeyM'); await sleep(400);
    check('M mutes the game', await b.evaluate(`__g.sound.mute`) === true);
    await b.tap('KeyM'); await sleep(400);
    check('...and unmutes it again', await b.evaluate(`__g.sound.mute`) === false);

    // The music dial is heard at once, not at the next act.
    const before = await b.evaluate(`__g.sound.sounds.find(s => s.key.startsWith('music_'))?.volume ?? 0`);
    await b.evaluate(`(async () => {
        const { SaveProgress } = await __mod('/src/systems/SaveProgress.js');
        const { AudioManager } = await __mod('/src/systems/AudioManager.js');
        SaveProgress.setSetting('music', 1);
        AudioManager.refreshMusicVolume();
    })()`);
    await sleep(300);
    const after = await b.evaluate(`__g.sound.sounds.find(s => s.key.startsWith('music_'))?.volume ?? 0`);
    check('turning the music dial down is heard straight away', after < before,
        `${before} -> ${after}`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
