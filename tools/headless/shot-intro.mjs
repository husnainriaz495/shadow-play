import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const scenes = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
try {
    await b.goto(URL); await sleep(500);
    await b.screenshot(`${out}/intro-0-loading.png`);
    await sleep(900); await b.attachGame();
    console.log('at 1.4s:', await scenes());
    await b.screenshot(`${out}/intro-1-curtain.png`);
    await sleep(700);
    await b.screenshot(`${out}/intro-2-opening.png`);
    await sleep(1400);
    console.log('at 3.5s:', await scenes());
    await b.screenshot(`${out}/intro-3-menu.png`);
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
