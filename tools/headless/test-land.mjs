import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const alive = `${G}.dust.motes.getAliveParticleCount()`;
const out = process.argv[3];
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(500);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1800);

    check('standing still kicks up no dust', await b.evaluate(alive) === 0);

    // A plain hop: too gentle for the camera, but it should raise dust.
    await b.tap('KeyW'); await sleep(260);
    let puffed = 0, shook = false;
    for (let i = 0; i < 14; i++) {
        puffed = Math.max(puffed, await b.evaluate(alive));
        shook = shook || await b.evaluate(`${G}.cameras.main.shakeEffect.isRunning`);
        if (i === 5 && out) await b.screenshot(`${out}/land-dust.png`);
        await sleep(60);
    }
    check('landing a jump kicks up dust', puffed > 0, puffed + ' motes');
    check('...without nudging the camera', !shook);

    await sleep(900);
    check('the dust settles', await b.evaluate(alive) === 0);

    // A real drop: lifted straight up over the puppet's own starting
    // floor, so it can only come down on solid ground. The camera shake
    // lasts ~120 ms, so it is watched from INSIDE the page, every frame,
    // rather than polled over the debugging protocol.
    await b.evaluate(`window.__w = { shook: false, lands: [] };
        const g = ${G};
        g.events.on('postupdate', () => {
            if (g.cameras.main.shakeEffect.isRunning) window.__w.shook = true;
        });
        const real = g.dust.land.bind(g.dust);
        g.dust.land = (s) => { window.__w.lands.push(Math.round(s)); real(s); };`);
    // body.reset, not setPosition: a plain move leaves the body's previous
    // position stale, so Arcade sees a huge step and tunnels through the floor.
    await b.evaluate(`${G}.player.body.reset(${G}.player.x, 120)`);
    await sleep(1600);
    const watched = JSON.parse(await b.evaluate(`JSON.stringify(window.__w)`));
    check('a long drop lands hard', watched.lands.some((s) => s > 700), JSON.stringify(watched.lands));
    check('...and nudges the camera', watched.shook === true, JSON.stringify(watched));

    const pooled = await b.evaluate(`${G}.dust.motes.maxParticles`);
    check('the motes come from one fixed pool', pooled > 0, 'max ' + pooled);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
