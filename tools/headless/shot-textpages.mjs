/** The two reading pages on the title menu: HOW TO PLAY and CREDITS. */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const shots = process.argv[3] ?? '../../shots';
const T = `__g.scene.getScene('TitleScene')`;
const pick = async (label) => {
    for (let i = 0; i < 12; i++) {
        const texts = JSON.parse(await b.evaluate(`JSON.stringify(${T}.page.menu.texts.map(t => t.text))`));
        const at = await b.evaluate(`${T}.page.menu.selected`);
        if (texts[at] === label) { await b.tap('Enter'); return; }
        await b.tap('ArrowDown'); await sleep(140);
    }
    throw new Error('never found ' + label);
};
try {
    await b.goto(URL); await sleep(3800); await b.attachGame();
    await pick('HOW TO PLAY'); await sleep(900);
    await b.screenshot(`${shots}/page-howtoplay.png`);
    // Fresh menu rather than backing out: the page owns the keys while
    // it is open and the main list has to be rebuilt to drive it again.
    await b.evaluate(`__g.scene.stop('TitleScene'); __g.scene.start('TitleScene', {})`);
    await sleep(1800);
    await pick('CREDITS'); await sleep(900);
    await b.screenshot(`${shots}/page-credits.png`);
    console.log('  wrote page-howtoplay.png, page-credits.png');
} finally { b.close(); }
