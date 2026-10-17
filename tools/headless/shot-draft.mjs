import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
const waitFor = async (expr, ms) => { const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return; await sleep(40); } };
try {
    await b.goto(URL); await sleep(4200); await b.attachGame();
    await b.tap('Space'); await sleep(1600);
    await b.evaluate(`${G}.scene.restart({ act: 4 })`); await sleep(2000);
    await b.evaluate(`${G}.player.body.reset(560, 660)`); await sleep(300);
    await b.screenshot(`${out}/draft-calm.png`);
    await waitFor(`${G}.wind.telegraphing`, 12000); await sleep(450);
    await b.screenshot(`${out}/draft-telegraph.png`);
    await waitFor(`${G}.wind.blowing`, 4000); await sleep(700);
    await b.screenshot(`${out}/draft-gust.png`);
    // And inside a shelter during a gust.
    await waitFor(`!${G}.wind.blowing`, 4000);
    await b.evaluate(`(() => { const s = ${G}.objects.find(o => o.isShelter && o.bounds.centerX > 500);
        ${G}.player.body.reset(s.bounds.centerX, s.bounds.bottom - 6); })()`);
    await waitFor(`${G}.wind.blowing`, 12000); await sleep(700);
    await b.screenshot(`${out}/draft-sheltered.png`);
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
