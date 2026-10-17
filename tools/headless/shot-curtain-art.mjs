import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const [, , profile, out] = process.argv;
const b = await launch(profile ?? PROFILE);
try {
    await b.goto(URL); await sleep(4000); await b.attachGame();
    for (const k of ['curtain_left', 'curtain_right', 'logo', 'bg_act4']) {
        const src = await b.evaluate(`(() => { const t = __g.textures.get('${k}');
            const img = t.getSourceImage(); return img && img.src ? 'FILE ' + img.src.split('/').pop() : 'drawn in code'; })()`);
        console.log(`  ${k.padEnd(14)} ${src}`);
    }
    await b.tap('Space'); await sleep(900);
    await b.evaluate(`__g.scene.getScene('GameScene').flow.goToAct(2)`); await sleep(1300);
    await b.screenshot(`${out}/real-curtain.png`);
    const errors = b.logs.filter((l) => /error|EXCEPTION|warn/i.test(l));
    console.log('  console:', errors.length ? errors.join(' | ') : 'clean');
} finally { b.close(); }
