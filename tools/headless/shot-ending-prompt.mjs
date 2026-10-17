/** What the way-out prompt looks like against the programme. */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const shots = process.argv[3] ?? '../../shots';
const E = `__g.scene.getScene('EndScene')`;
const where = async (label) => {
    const s = await b.evaluate(`JSON.stringify((() => { const e = ${E}; return {
        phase: e.phase, fin: e.fin?.text, finAlpha: +(e.fin?.alpha ?? 0).toFixed(2),
        promptY: Math.round(e.prompt?.y ?? -1), promptAlpha: +(e.prompt?.alpha ?? 0).toFixed(2),
        columnY: Math.round(e.credits?.column?.y ?? -9999) }; })())`);
    console.log(' ', label, s);
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);
    // Stop the act first. Starting EndScene on top of a live GameScene
    // leaves the act running underneath -- its wax hits zero and the
    // death card appears over the curtain call.
    await b.evaluate(`(() => { __g.scene.stop('GameScene'); __g.scene.stop('UIScene'); __g.scene.start('EndScene', {}); })()`);
    await sleep(700);
    // Past the bow and the curtain, but NOT past the programme.
    await b.tap('Space'); await sleep(900);
    await b.tap('Space'); await sleep(900);
    await where('curtain shut, ink writing');

    // Wait for the column to actually exist and be on screen.
    for (let i = 0; i < 80; i++) {
        const rolling = await b.evaluate(`Boolean(${E}.credits) && ${E}.phase === 'credits'`);
        if (rolling) break;
        await sleep(250);
    }
    await sleep(4000);
    await where('credits rolling');
    await b.screenshot(`${shots}/end-credits-rolling.png`);
    await b.tap('Space'); await sleep(900);
    await where('after Space, the way out risen into place');
    await b.screenshot(`${shots}/end-prompt.png`);
} finally { b.close(); }
