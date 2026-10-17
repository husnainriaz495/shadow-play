import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const out = process.argv[3];
const lanterns = `${G}.objects.filter(o => o.isLantern)`;
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(45); }
    throw new Error('timed out waiting for ' + label);
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3800); await b.attachGame();
    await b.tap('Space'); await sleep(1500);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1900);

    check('Act 1 is the gentlest act', await b.evaluate(`${G}.candle.drainScale`) === 0.8,
        'drain x' + await b.evaluate(`${G}.candle.drainScale`));
    check('it has two checkpoint lanterns', await b.evaluate(`${lanterns}.length`) === 2,
        await b.evaluate(`${lanterns}.length`) + ' lanterns');
    check('...both unlit to start with',
        await b.evaluate(`${lanterns}.every(l => l.lit === false)`));
    check('...using the real 2-frame art',
        await b.evaluate(`${lanterns}[0].texture.key`) === 'lantern'
        && await b.evaluate(`${lanterns}[0].texture.frameTotal > 2`));

    // --- the bonus drop is out of Normal's reach, not Huge's ------------
    const bonus = await b.evaluate(`(() => {
        const drops = ${G}.objects.filter(o => o.constructor.name === 'WaxDrop');
        const high = drops.reduce((a, d) => (d.y < a.y ? d : a));
        return JSON.stringify([Math.round(high.x), Math.round(high.y)]);
    })()`);
    const [bx, by] = JSON.parse(bonus);
    check('there is a bonus drop on a high ledge', by < 580, `at y=${by}`);

    // Stand BESIDE the ledge, not under it: there is no room to grow in
    // the two tiles beneath it, and no jump goes through a solid floor.
    const tryReach = async (sizeKey) => {
        await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1800);
        await b.evaluate(`${G}.player.body.reset(${bx - 130}, 650)`); await sleep(300);
        await b.tap(sizeKey); await sleep(500);
        await b.down('ArrowRight'); await sleep(90);
        await b.down('Space'); await sleep(340); await b.up('Space');
        await sleep(1100);
        await b.up('ArrowRight');
        // Only the BONUS drop counts: running at the ledge also passes a
        // drop on the floor, and taking that proves nothing.
        return b.evaluate(`(() => {
            const drops = ${G}.objects.filter(o => o.constructor.name === 'WaxDrop');
            const high = drops.reduce((a, d) => (d.y < a.y ? d : a));
            return high.taken;
        })()`);
    };
    check('Normal cannot reach the bonus drop', await tryReach('Digit2') === false);
    check('...but Huge can', await tryReach('Digit3') === true);

    // --- lighting a lantern moves where the act restarts -----------------
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1800);
    const startX = await b.evaluate(`Math.round(${G}.player.x)`);
    const lampX = await b.evaluate(`Math.round(${lanterns}[0].x)`);
    await b.evaluate(`${G}.candle.wax = 70; ${G}.player.body.reset(${lampX}, 660)`);
    await waitFor(`${lanterns}[0].lit === true`, 4000, 'the lantern to light');
    check('walking past a lantern lights it', await b.evaluate(`${lanterns}[0].lit`) === true);
    check('...and it glows', await b.evaluate(`${lanterns}[0].glow.alpha`) > 0);
    check('...and the act now restarts from there',
        await b.evaluate(`${G}.checkpoint != null`));
    if (out) await b.screenshot(`${out}/act1-lantern.png`);

    const savedWax = await b.evaluate(`Math.round(${G}.checkpoint.wax)`);
    await b.tap('KeyR'); await sleep(1900);
    const backAt = await b.evaluate(`Math.round(${G}.player.x)`);
    check('restarting puts the puppet at the lantern, not the start',
        Math.abs(backAt - lampX) < 60 && backAt !== startX,
        `back at x=${backAt}, lantern ${lampX}, start ${startX}`);
    check('...with the wax it had when it got there',
        Math.abs(await b.evaluate(`Math.round(${G}.candle.wax)`) - savedWax) < 6,
        `${savedWax} -> ${await b.evaluate(`Math.round(${G}.candle.wax)`)}`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
