import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const G = `__g.scene.getScene('GameScene')`;
const peak = async (sizeKey) => {
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1800);
    await b.evaluate(`${G}.player.body.reset(130, 650)`); await sleep(300);
    await b.tap(sizeKey); await sleep(500);
    await b.down('ArrowRight'); await sleep(90);
    await b.down('Space'); await sleep(340); await b.up('Space');
    let top = 9999;
    for (let i = 0; i < 24; i++) {
        top = Math.min(top, await b.evaluate(`Math.round(${G}.player.body.top)`));
        await sleep(45);
    }
    await b.up('ArrowRight');
    return top;
};
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3800); await b.attachGame();
    await b.tap('Space'); await sleep(1500);
    await b.evaluate(`${G}.scene.restart({ act: 1 })`); await sleep(1800);
    const drops = await b.evaluate(`JSON.stringify(${G}.objects
        .filter(o => o.constructor.name === 'WaxDrop')
        .map(d => [Math.round(d.x), Math.round(d.y), Math.round(d.body.top), Math.round(d.body.bottom)]))`);
    console.log('drops [x,y,top,bottom]:', drops);
    console.log('Normal highest body top:', await peak('Digit2'));
    console.log('Huge   highest body top:', await peak('Digit3'));
} finally { b.close(); }
