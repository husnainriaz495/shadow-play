import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const T = `__g.scene.getScene('TitleScene')`;
try {
    await b.goto(URL); await sleep(1000);
    await b.evaluate(`localStorage.clear(); localStorage.setItem('shadow-play.save', JSON.stringify({version:1,highestAct:4,settings:{master:8,music:6,sfx:8,reduceMotion:false}}))`);
    await b.goto(URL); await sleep(4000); await b.attachGame();
    console.log('root items:', await b.evaluate(`JSON.stringify(${T}.page.menu.texts.map(t=>t.text))`));
    await b.screenshot(`${out}/menu-root.png`);
    for (const [label, shot] of [['ACT SELECT','menu-acts'], ['SETTINGS','menu-settings'], ['HOW TO PLAY','menu-howto'], ['CREDITS','menu-credits']]) {
        await b.evaluate(`(() => { const m = ${T}.page.menu; const i = m.texts.findIndex(t => t.text === '${label}'); m.choose(i); })()`);
        await sleep(900);
        await b.screenshot(`${out}/${shot}.png`);
        await b.evaluate(`(() => { const m = ${T}.page.menu; const i = m.texts.findIndex(t => t.text === 'BACK'); m.choose(i); })()`);
        await sleep(900);
    }
    await b.evaluate(`(() => { const m = ${T}.page.menu; const i = m.texts.findIndex(t => t.text === 'QUIT'); m.choose(i); })()`);
    await sleep(2600);
    await b.screenshot(`${out}/menu-quit.png`);
    console.log('after quit:', await b.evaluate(`__g.scene.getScenes(true).map(s=>s.scene.key).join(',')`));
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
