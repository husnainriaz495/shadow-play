import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3800); await b.attachGame();
    console.log('scenes:', await b.evaluate(`__g.scene.getScenes(true).map(s=>s.scene.key).join(',')`));
    console.log('mute before:', await b.evaluate(`__g.sound.mute`));
    await b.tap('KeyM'); await sleep(600);
    console.log('mute after M on title:', await b.evaluate(`__g.sound.mute`));
    await b.tap('KeyM'); await sleep(400);
    await b.tap('Space'); await sleep(2600);
    console.log('scenes in act:', await b.evaluate(`__g.scene.getScenes(true).map(s=>s.scene.key).join(',')`));
    await b.tap('KeyM'); await sleep(600);
    console.log('mute after M in act:', await b.evaluate(`__g.sound.mute`));
} finally { b.close(); }
