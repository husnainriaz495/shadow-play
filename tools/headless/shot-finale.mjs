/** A picture of the finale's last stretch: screen, slab, crate, ledge. */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const shots = process.argv[3] ?? '../../shots';
const G = `__g.scene.getScene('GameScene')`;
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);
    await b.evaluate(`${G}.scene.restart({ act: ${await b.actCount()} })`); await sleep(1100);
    await b.evaluate(`${G}.player.body.reset(880, 680)`); await sleep(900);
    await b.screenshot(`${shots}/finale-exam.png`);
    console.log('  wrote finale-exam.png');
} finally { b.close(); }
