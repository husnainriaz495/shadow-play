import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
try {
    await b.goto(URL); await sleep(3800); await b.attachGame();
    await b.screenshot(`${out}/scene-title.png`);
    await b.tap('Space'); await sleep(2600);
    await b.tap('Escape'); await sleep(900);
    await b.screenshot(`${out}/scene-pause.png`);
    console.log('pause scene active:', await b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`));
    await b.tap('Escape'); await sleep(700);
    await b.tap('KeyH'); await sleep(500);          // HUD hidden, for the trailer
    await b.screenshot(`${out}/scene-nohud.png`);
    await b.tap('KeyH'); await sleep(300);
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    console.log('console errors:', errors.length ? errors.join(' | ') : 'none');
} finally { b.close(); }
