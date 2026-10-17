import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const halves = `${G}.children.list.filter(o => o.texture && /curtain/.test(o.texture.key))`;
const amount = `(() => { const h = ${halves}; return h.length ? Math.max(...h.map(o => o.x / o.width)) : 0; })()`;
// The game-over words now live on a panel (a Container), not loose on
// the scene: systems/Death.js shows the same card for every death.
const texts = `JSON.stringify(${G}.children.list
    .filter(o => o.type === 'Text').map(o => o.text)
    .concat(${G}.children.list.filter(o => o.type === 'Container')
        .flatMap(c => c.list.filter(o => o.type === 'Text').map(o => o.text))))`;
const out = process.argv[3];
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(500);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1800);

    // Burn the candle down to nothing.
    await b.evaluate(`${G}.candle.wax = 0.4`); await sleep(2600);
    check('the puppet goes limp', await b.evaluate(`${G}.rig.poser.limp === true`));
    check('and stops taking keys', await b.evaluate(`${G}.player.controls.enabled === false`));
    check('the curtain comes all the way across',
        await b.evaluate(amount) > 0.95, 'at ' + await b.evaluate(amount));
    const said = await b.evaluate(texts);
    check('"The candle went out" is the reason on it', /candle went out/i.test(said), said);
    check('and it offers a way on', /RETRY ACT/.test(said) && /MAIN MENU/.test(said), said);
    if (out) await b.screenshot(`${out}/gameover.png`);

    await b.tap('KeyR'); await sleep(1400);
    check('R starts the act again', await b.evaluate(`${G}.rig.poser.limp === false`));
    check('...with the keys back', await b.evaluate(`${G}.player.controls.enabled !== false`));
    check('...and no curtain left over', await b.evaluate(`${halves}.length`) === 0,
        await b.evaluate(`${halves}.length`) + ' halves');
    check('...and the wax refilled', await b.evaluate(`${G}.candle.wax`) > 90);
    if (out) await b.screenshot(`${out}/gameover-restarted.png`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
