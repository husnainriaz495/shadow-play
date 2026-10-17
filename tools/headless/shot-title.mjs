import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
try {
    await b.evaluate0 ?? null;
    await b.goto(URL); await sleep(1000);
    await b.evaluate(`localStorage.setItem('shadow-play.save', JSON.stringify({version:1,highestAct:2,settings:{master:8,music:6,sfx:8,reduceMotion:false}}))`);
    await b.goto(URL); await sleep(4000); await b.attachGame();
    await b.screenshot(`${out}/title-menu.png`);
    await b.tap('Space'); await sleep(2600);
    await b.evaluate(`${G}.flow.onActComplete()`); await sleep(3600);
    await b.tap('Space'); await sleep(200); await b.tap('Space'); await sleep(2400);
    console.log('--- dev log lines ---');
    b.logs.filter((l) => /Shadow Play\] Act/.test(l)).forEach((l) => console.log('  ' + l));
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    console.log('console errors:', errors.length ? errors.join(' | ') : 'none');
} finally { b.close(); }
