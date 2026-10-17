/** A picture of the timed gate's countdown ring, mid-dash. */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const shots = process.argv[3] ?? '../../shots';
const G = `__g.scene.getScene('GameScene')`;
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);
    await b.evaluate(`${G}.scene.restart({ act: 2 })`); await sleep(900);
    await b.tap('Digit3'); await sleep(500);
    await b.evaluate(`${G}.player.body.reset(700, 600)`); await sleep(600);
    await b.screenshot(`${shots}/gate-held.png`);
    await b.evaluate(`${G}.player.body.reset(260, 560)`); await sleep(900);
    await b.screenshot(`${shots}/gate-counting.png`);
    await sleep(1600);
    await b.screenshot(`${shots}/gate-last-second.png`);
    console.log('  wrote gate-held.png, gate-counting.png, gate-last-second.png');
} finally { b.close(); }
