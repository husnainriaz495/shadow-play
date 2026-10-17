import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
const waitFor = async (expr, ms, label) => { const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(50); }
    throw new Error('timed out: ' + label); };
// Stand just left of the gap (cols 17-21, so x 680-880), jump right.
const attempt = async (duringGust) => {
    await b.evaluate(`${G}.scene.restart({ act: 4 })`); await sleep(1800);
    await b.evaluate(`${G}.player.body.reset(660, 660); ${G}.player.sizeChanger.request(0)`);
    await sleep(400);
    if (duringGust) await waitFor(`${G}.wind.blowing`, 12000, 'a gust');
    else await waitFor(`!${G}.wind.blowing && !${G}.wind.telegraphing`, 12000, 'calm');
    await b.down('ArrowRight'); await sleep(60);
    await b.down('Space'); await sleep(320); await b.up('Space');
    await sleep(1400);
    await b.up('ArrowRight');
    const x = await b.evaluate(`Math.round(${G}.player.x)`);
    const y = await b.evaluate(`Math.round(${G}.player.feetY)`);
    return `x=${x} feet=${y} ${y > 760 ? '(FELL)' : (x > 880 ? '(CROSSED)' : '(short)')}`;
};
try {
    await b.goto(URL); await sleep(4200); await b.attachGame();
    await b.tap('Space'); await sleep(1800);
    console.log('jump in CALM :', await attempt(false));
    console.log('jump in GUST :', await attempt(true));
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
