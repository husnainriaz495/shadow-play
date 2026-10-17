import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const T = `__g.scene.getScene('TitleScene')`;
try {
    await b.goto(URL); await sleep(4200); await b.attachGame();
    console.log('menu ready, left =', await b.evaluate(`Math.round(${T}.left.x)`));
    await b.evaluate(`${T}.begin(1, 'test')`); await sleep(2600);
    await b.evaluate(`__g.scene.getScene('GameScene').scene.start('TitleScene')`);
    for (const t of [300, 600, 1000, 1600, 2400]) {
        await sleep(t === 300 ? 300 : 400);
        console.log(`  +${t}ms left=${await b.evaluate(`Math.round(${T}.left.x)`)}`,
            'curtainClosed=', await b.evaluate(`${T}.curtainClosed`),
            'page=', await b.evaluate(`${T}.page !== null`));
    }
} finally { b.close(); }
