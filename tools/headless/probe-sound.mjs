import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
try {
    await b.goto(URL); await sleep(4400); await b.attachGame();
    console.log('--- boot report ---');
    b.logs.filter((l) => /Shadow Play|Standing in|SILENT|->/.test(l)).forEach((l) => console.log(l));
    console.log('--- music ---');
    console.log('musicOn:', await b.evaluate(`(async () => (await __mod('/src/config.js')).CONFIG.audio.musicOn)()`)
        .catch(() => 'n/a'));
} finally { b.close(); }
