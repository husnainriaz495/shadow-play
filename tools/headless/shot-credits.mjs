import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const E = `__g.scene.getScene('EndScene')`;
const waitFor = async (expr, ms) => { const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return; await sleep(60); } };
try {
    await b.goto(URL); await sleep(4200); await b.attachGame();
    await b.evaluate(`__g.scene.stop('TitleScene'); __g.scene.start('EndScene')`);
    await waitFor(`${E}.phase === 'bow'`, 6000);
    await b.tap('Space'); await waitFor(`${E}.phase === 'closing'`, 3000);
    await b.tap('Space'); await waitFor(`${E}.phase === 'writing'`, 3000);
    await b.tap('Space'); await waitFor(`${E}.phase === 'credits'`, 3000);
    await sleep(4500); await b.screenshot(`${out}/ending-credits.png`);
    await sleep(5000); await b.screenshot(`${out}/ending-credits2.png`);
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
