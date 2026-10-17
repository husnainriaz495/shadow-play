import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
const P = `__g.scene.getScene('PauseScene')`;
const T = `__g.scene.getScene('TitleScene')`;
const pick = async (scene, label) => {
    await b.evaluate(`(() => { const m = ${scene}.page.menu;
        const i = m.texts.findIndex(t => t.text.startsWith('${label}'));
        if (i >= 0) m.choose(i); })()`);
    await sleep(900);
};
try {
    await b.goto(URL); await sleep(4400); await b.attachGame();
    await pick(T, 'SETTINGS');
    await b.screenshot(`${out}/settings-dials.png`);
    console.log('title settings:', await b.evaluate(`JSON.stringify(${T}.page.menu.texts.map(t=>t.text))`));
    await pick(T, 'BACK');
    await pick(T, 'START THE SHOW'); await sleep(2600);
    await b.tap('Escape'); await sleep(1000);
    await b.screenshot(`${out}/pause-root.png`);
    console.log('pause root:', await b.evaluate(`JSON.stringify(${P}.page.menu.texts.map(t=>t.text))`));
    await pick(P, 'SETTINGS');
    await b.screenshot(`${out}/pause-settings.png`);
    console.log('pause settings:', await b.evaluate(`JSON.stringify(${P}.page.menu.texts.map(t=>t.text))`));
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
