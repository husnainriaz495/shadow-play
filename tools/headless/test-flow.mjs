import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const active = () => b.evaluate(`__g.scene.getScenes(true).map(s => s.scene.key).join(',')`);
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(800);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1200);
    await b.hold('ArrowRight', 700);
    const moved = await b.evaluate(`Math.round(${G}.player.x)`);
    await b.tap('KeyR'); await sleep(900);
    check('R restarts the act (puppet back at the start)', await b.evaluate(`Math.round(${G}.player.x)`) === 100, 'was at ' + moved);
    await b.tap('Escape'); await sleep(700);
    check('Esc opens the pause menu', (await active()).includes('PauseScene') && await b.evaluate(`${G}.scene.isPaused()`), await active());
    await b.tap('Escape'); await sleep(700);
    check('Esc again resumes the act', !(await active()).includes('PauseScene') && await b.evaluate(`${G}.scene.isActive()`), await active());
    await b.evaluate(`__g.events.emit('blur')`); await sleep(500);
    check('leaving the window pauses', (await active()).includes('PauseScene'), await active());
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
