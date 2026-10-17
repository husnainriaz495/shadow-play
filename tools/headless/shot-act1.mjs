import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3800); await b.attachGame();
    await b.tap('Space'); await sleep(1500);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(2000);
    await b.evaluate(`${G}.player.body.reset(200, 650)`); await sleep(400);
    await b.screenshot(`${out}/act1-ledge.png`);
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
