import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : '  -> ' + detail)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const crate = `${G}.objects.find(o => o.constructor.name === 'Crate')`;
const crateState = () => b.evaluate(`(() => { const c = ${crate}; return { x: Math.round(c.x), bottom: Math.round(c.body.bottom), alpha: +c.alpha.toFixed(2), returning: c.returning }; })()`);
const startAct2 = async () => {
    await b.evaluate(`${G}.scene.restart({ act: 2 })`); await sleep(900);
    await b.tap('Digit3'); await sleep(700);   // real key: grow Huge at the start
};
const pushLeftUntilItFalls = async (homeBottom) => {
    await b.down('ArrowLeft');
    for (let i = 0; i < 40; i++) { await sleep(250); if ((await crateState()).bottom - homeBottom >= 80) break; }
    await b.up('ArrowLeft');
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);

    console.log('--- 1. pushed LEFT off the first ledge (the softlock) ---');
    await startAct2();
    console.log('  size after pressing 3:', await b.evaluate(`${G}.player.state.name`));
    const home = await crateState();
    await b.evaluate(`${G}.player.body.reset(564, 560)`); await sleep(300);   // Huge, on the ledge, right of the crate
    await pushLeftUntilItFalls(home.bottom);
    const fallen = await crateState();
    check('crate fell off the ledge (3 tiles down)', fallen.bottom - home.bottom >= 80, JSON.stringify(fallen));
    await b.evaluate(`${G}.player.body.reset(150, 680)`);                      // walk the puppet well away
    await sleep(2200);
    const back = await crateState();
    check('stagehand returned it to its start', back.x === home.x && back.bottom === home.bottom && !back.returning, JSON.stringify({ home, back }));
    check('fully visible again', back.alpha === 1, 'alpha ' + back.alpha);

    console.log('--- 2. pushed RIGHT into the notch (the real solution) ---');
    await startAct2();
    await b.evaluate(`${G}.player.body.reset(396, 560)`); await sleep(300);   // left of the crate
    await b.hold('ArrowRight', 4000);
    await sleep(2000);                                                         // longer than the return delay
    const inNotch = await crateState();
    check('crate dropped 1 tile into the notch and STAYED', inNotch.bottom - home.bottom === 40 && !inNotch.returning, JSON.stringify(inNotch));
    const gate = await b.evaluate(`(() => { const g = ${G}.objects.find(o => o.constructor.name === 'Gate'); return { open: g.isOpen ?? g.open, holders: g.holders ?? g.pressedCount ?? null, bodyEnabled: g.body?.enable }; })()`);
    console.log('  gate:', JSON.stringify(gate));

    console.log('--- 3. never reappears on top of the puppet ---');
    await startAct2();
    await b.evaluate(`${G}.player.body.reset(564, 560)`); await sleep(300);
    await pushLeftUntilItFalls(home.bottom);
    await b.evaluate(`${G}.player.body.reset(480, 560)`);                      // stand on the crate's start
    await sleep(2000);
    const waiting = await crateState();
    check('waits while the puppet stands on its start', waiting.returning && waiting.bottom !== home.bottom, JSON.stringify(waiting));
    await b.evaluate(`${G}.player.body.reset(150, 680)`);
    await sleep(800);
    const after = await crateState();
    check('reappears once the puppet steps away', after.x === home.x && after.bottom === home.bottom && !after.returning, JSON.stringify(after));

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
