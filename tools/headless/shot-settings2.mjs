import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const T = `__g.scene.getScene('TitleScene')`;
const pick = async (label) => {
    await b.evaluate(`(() => { const m = ${T}.page.menu;
        const i = m.texts.findIndex(t => t.text.startsWith('${label}'));
        if (i >= 0) m.choose(i); })()`);
    await sleep(900);
};
try {
    await b.goto(URL); await sleep(900);
    await b.evaluate(`localStorage.setItem('shadow-play.save', JSON.stringify({version:1,highestAct:5,settings:{master:9,music:3,sfx:6,reduceMotion:false}}))`);
    await b.goto(URL); await sleep(4600); await b.attachGame();
    await pick('SETTINGS');
    await b.screenshot(`${out}/settings-aligned.png`);
    await pick('BACK');
    await pick('START THE SHOW');
    await b.screenshot(`${out}/start-over.png`);
    console.log('confirm page:', await b.evaluate(`JSON.stringify(${T}.page.menu.texts.map(t=>t.text))`));
    await pick('YES'); await sleep(2600);
    console.log('saved after clear:', await b.evaluate(`localStorage.getItem('shadow-play.save')`));
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
