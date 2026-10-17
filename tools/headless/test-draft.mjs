import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const G = `__g.scene.getScene('GameScene')`;
const U = `__g.scene.getScene('UIScene')`;
const size = () => b.evaluate(`${G}.player.state.name`);
const out = process.argv[3];
const waitFor = async (expr, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(45); }
    throw new Error('timed out waiting for ' + label);
};
const restart = async () => { await b.evaluate(`${G}.scene.restart({ act: 4 })`); await sleep(1900); };
try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(4200); await b.attachGame();
    await b.tap('Space'); await sleep(1600);
    await restart();

    check('Act 4 is "The Draft"', /The Draft/.test(await b.evaluate(`${G}.currentAct.title`)));
    check('it has a wind', await b.evaluate(`${G}.wind !== null`));
    check('...with shelters to hide in',
        await b.evaluate(`${G}.objects.filter(o => o.isShelter).length`) === 3);
    check('...and a window at each vent it blows through',
        await b.evaluate(`${G}.wind.effects.windows.length`) === 2);

    // --- the player is TOLD it is coming ---------------------------------
    await waitFor(`${U}.gustWarning.bar.visible`, 10000, 'the countdown bar');
    const wide = await b.evaluate(`${U}.gustWarning.bar.scaleX`);
    await sleep(900);
    check('a bar counts down to the next gust',
        await b.evaluate(`${U}.gustWarning.bar.scaleX`) < wide,
        `${wide} -> ${await b.evaluate(`${U}.gustWarning.bar.scaleX`)}`);

    await waitFor(`${G}.wind.telegraphing`, 12000, 'the telegraph');
    check('a "GUST!" card warns a second before it hits',
        await b.evaluate(`${U}.gustWarning.panel.container.visible`) === true);
    check('...and the shelter curtains flutter', await b.evaluate(
        `${G}.scene.scene.tweens.getTweens().length > 0`));
    if (out) await b.screenshot(`${out}/draft-telegraph.png`);

    // --- the wind is VISIBLE ---------------------------------------------
    await waitFor(`${G}.wind.blowing`, 4000, 'the gust');
    await sleep(400);
    check('the light leans downwind with the flame',
        await b.evaluate(`${G}.paperScreen.windLean`) > 0.4,
        'lean ' + await b.evaluate(`${G}.paperScreen.windLean`));
    check('streaks of air cross the stage',
        await b.evaluate(`${G}.wind.effects.streaks.getAliveParticleCount()`) > 5,
        await b.evaluate(`${G}.wind.effects.streaks.getAliveParticleCount()`) + ' streaks');
    check('the candle\'s light leans downwind',
        await b.evaluate(`${G}.paperScreen.windLean`) > 0.4,
        'lean ' + await b.evaluate(`${G}.paperScreen.windLean`));
    if (out) await b.screenshot(`${out}/draft-gust.png`);

    // --- it PUSHES, and costs wax ----------------------------------------
    // x=460 is clear of all three shelters (they sit at 180, 580 and 940).
    await b.evaluate(`${G}.player.body.reset(460, 660)`);
    await waitFor(`${G}.wind.blowing`, 12000, 'another gust');
    await sleep(300);
    check('the gust flattens you to Tiny in the open', await size() === 'Tiny', await size());
    check('...and shoves you downwind', await b.evaluate(`${G}.player.windPush`) > 0,
        'push ' + await b.evaluate(`${G}.player.windPush`));
    check('...and the struggling flame burns more wax',
        await b.evaluate(`${G}.candle.windFactor`) > 1,
        'x' + await b.evaluate(`${G}.candle.windFactor`));

    // --- a shelter really shelters ---------------------------------------
    await waitFor(`!${G}.wind.blowing`, 6000, 'calm');
    await b.evaluate(`(() => { const s = ${G}.objects.find(o => o.isShelter && o.bounds.centerX > 500);
        ${G}.player.body.reset(s.bounds.centerX, s.bounds.bottom - 6); })()`);
    await b.evaluate(`${G}.player.sizeChanger.request(1)`); await sleep(300);
    await waitFor(`${G}.wind.blowing`, 12000, 'the next gust');
    await sleep(500);
    check('behind a screen you stay your own size', await size() === 'Normal', await size());
    check('...and are not pushed', await b.evaluate(`${G}.player.windPush`) === 0);
    check('...and the wax burns normally', await b.evaluate(`${G}.candle.windFactor`) === 1);
    check('...and the air is visibly still', await b.evaluate(`${G}.wind.effects.streaks.emitting`) === false);
    if (out) await b.screenshot(`${out}/draft-sheltered.png`);

    // --- THE PUZZLE: the gap is only crossable on a gust ------------------
    const jump = async (duringGust) => {
        await restart();
        await b.evaluate(`${G}.player.body.reset(660, 660); ${G}.player.sizeChanger.request(0)`);
        await sleep(350);
        if (duringGust) await waitFor(`${G}.wind.blowing`, 12000, 'a gust');
        else await waitFor(`!${G}.wind.blowing && !${G}.wind.telegraphing`, 12000, 'calm');
        await b.down('ArrowRight'); await sleep(60);
        await b.down('Space'); await sleep(320); await b.up('Space');
        await sleep(1600);
        await b.up('ArrowRight');

        return {
            x: await b.evaluate(`Math.round(${G}.player.x)`),
            died: await b.evaluate(`${G}.death.over === true`)
        };
    };
    const calm = await jump(false);
    check('the gap is too wide to jump in still air', calm.died === true,
        `landed at x=${calm.x} without falling in`);
    const gust = await jump(true);
    check('riding a gust carries a tiny shadow across it',
        gust.x > 880 && gust.died === false, `x=${gust.x}, died=${gust.died}`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
