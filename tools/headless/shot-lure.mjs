/** A picture of Act III's lure: the moths leaving the puppet for the light. */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const shots = process.argv[3] ?? '../../shots';
const G = `__g.scene.getScene('GameScene')`;
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);
    await b.evaluate(`${G}.scene.restart({ act: 3 })`); await sleep(1100);
    await b.evaluate(`${G}.player.body.reset(620, 680)`); await sleep(2200);
    await b.screenshot(`${shots}/lure-before.png`);
    await b.evaluate(`${G}.objects.filter(o => o.isLantern)[0].onPlayerTouch(${G}.player)`);
    await sleep(2200);
    await b.screenshot(`${shots}/lure-after.png`);
    console.log('  wrote lure-before.png, lure-after.png');
} finally { b.close(); }
