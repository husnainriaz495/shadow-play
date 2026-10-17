import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const moths = `${G}.objects.filter(o => o.constructor.name === 'Moth')`;
const out = process.argv[3];
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);
    await b.evaluate(`${G}.scene.restart({ act: 3 })`); await sleep(2200);

    check('Act 3 is "Moths to the Flame"',
        /Moths to the Flame/.test(await b.evaluate(`${G}.currentAct.title`)),
        await b.evaluate(`${G}.currentAct.title`));
    check('its moths are on the stage', await b.evaluate(`${moths}.length`) === 4,
        await b.evaluate(`${moths}.length`) + ' moths');
    check('they use the real 2-frame art', await b.evaluate(
        `${moths}[0].texture.key === 'moth' && ${moths}[0].texture.frameTotal > 2`));
    check('they do not fall: they fly', await b.evaluate(`${moths}[0].body.allowGravity`) === false);

    // --- the flight feel (PRD 6.4) --------------------------------------
    const sample = async (ms, n) => {
        const seen = [];
        for (let i = 0; i < n; i++) {
            seen.push(await b.evaluate(`(() => { const m = ${moths}[0];
                return JSON.stringify([Math.round(m.x), Math.round(m.y), Math.round(m.angle),
                                       m.frame.name, +m.scaleY.toFixed(2)]); })()`));
            await sleep(ms);
        }
        return seen.map((s) => JSON.parse(s));
    };
    const flight = await sample(90, 14);
    check('a moth actually moves', new Set(flight.map((f) => f[0] + ',' + f[1])).size > 6,
        new Set(flight.map((f) => f[0] + ',' + f[1])).size + ' distinct positions');
    check('its wings beat (the frame changes)', new Set(flight.map((f) => f[3])).size === 2,
        'frames seen: ' + [...new Set(flight.map((f) => f[3]))].join(','));
    check('it squashes on the downbeat', new Set(flight.map((f) => f[4])).size === 2,
        'scaleY seen: ' + [...new Set(flight.map((f) => f[4]))].join(','));
    check('it banks into its turns, never past 20 degrees',
        flight.some((f) => Math.abs(f[2]) > 1) && flight.every((f) => Math.abs(f[2]) <= 20),
        'angles ' + flight.map((f) => f[2]).join(','));

    // --- two moths must not move identically (flutter) ------------------
    const pair = await b.evaluate(`(() => { const m = ${moths};
        return JSON.stringify([m[0].x - m[1].x, m[0].y - m[1].y]); })()`);
    await sleep(600);
    const pair2 = await b.evaluate(`(() => { const m = ${moths};
        return JSON.stringify([m[0].x - m[1].x, m[0].y - m[1].y]); })()`);
    check('no two moths fly the same path', pair !== pair2, pair + ' then ' + pair2);
    if (out) await b.screenshot(`${out}/act3-moths.png`);

    // --- touching one costs wax; Huge swats it --------------------------
    await b.evaluate(`${G}.candle.wax = 100; ${G}.player.hurtState.invulnerableUntil = -Infinity;
        ${G}.player.body.reset(${moths}[0].x, ${moths}[0].y)`);
    await sleep(500);
    const waxAfter = await b.evaluate(`Math.round(${G}.candle.wax)`);
    check('touching a moth costs wax', waxAfter < 100, 'wax ' + waxAfter);
    check('...and it is still alive', await b.evaluate(`${moths}[0].swatted`) === false);

    await b.tap('Digit3'); await sleep(600);        // grow Huge
    await b.evaluate(`${G}.player.hurtState.invulnerableUntil = -Infinity;
        ${G}.player.body.reset(${moths}[0].x, ${moths}[0].y)`);
    await sleep(500);
    check('a HUGE puppet swats it instead', await b.evaluate(`${moths}[0].swatted`) === true);
    check('the swatted moth falls', await b.evaluate(`${moths}[0].body.allowGravity`) === true);
    check('and it bursts into paper', await b.evaluate(
        `${G}.mothEffects.flakes.getAliveParticleCount() > 0 || ${moths}[0].alpha < 1`));

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
