import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const out = process.argv[3];
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(500);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1800);

    const rest = await b.evaluate(`${G}.paperScreen.breath`);
    check('the light sits at rest between size changes', rest === 1, 'breath ' + rest);

    await b.tap('KeyE');                      // grow Huge
    let peak = 0, stamps = 0;
    for (let i = 0; i < 10; i++) {
        peak = Math.max(peak, await b.evaluate(`${G}.paperScreen.breath`));
        stamps = Math.max(stamps, await b.evaluate(
            `${G}.children.list.filter(o => o.type === 'RenderTexture' && o.visible).length`));
        if (i === 2 && out) await b.screenshot(`${out}/size-afterimage.png`);
        await sleep(60);
    }
    check('growing breathes light onto the paper', peak > 1.05, 'peak breath ' + peak.toFixed(3));
    check('and leaves afterimages behind', stamps >= 2, stamps + ' visible');

    await sleep(900);
    check('the light settles back', Math.abs(await b.evaluate(`${G}.paperScreen.breath`) - 1) < 0.01);
    check('and the afterimages are put away', await b.evaluate(
        `${G}.children.list.filter(o => o.type === 'RenderTexture' && o.visible).length`) === 0);

    const pooled = await b.evaluate(`${G}.children.list.filter(o => o.type === 'RenderTexture').length`);
    await b.tap('KeyQ'); await sleep(400); await b.tap('KeyE'); await sleep(900);
    check('the pool is reused, never grown', await b.evaluate(
        `${G}.children.list.filter(o => o.type === 'RenderTexture').length`) === pooled, 'was ' + pooled);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
