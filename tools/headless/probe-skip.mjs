import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const E = `__g.scene.getScene('EndScene')`;
try {
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.evaluate(`__g.scene.stop('TitleScene'); __g.scene.start('EndScene')`); await sleep(700);
    console.log('active:', await b.evaluate(`__g.scene.getScenes(true).map(s=>s.scene.key).join(',')`));
    console.log('phase before Space:', await b.evaluate(`${E}.phase`));
    await b.tap('Space'); await sleep(300);
    console.log('phase after Space :', await b.evaluate(`${E}.phase`));
    for (const t of [600, 1200, 2000, 3000]) {
        await sleep(t === 600 ? 600 : 700);
        console.log(`  +${t}ms phase=${await b.evaluate(`${E}.phase`)} texts=${await b.evaluate(`JSON.stringify(${E}.children.list.filter(o=>o.type==='Text').map(o=>o.text))`)}`);
    }
} finally { b.close(); }
