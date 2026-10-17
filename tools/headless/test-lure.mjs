/**
 * Act III's LURE LANTERNS: moths go to a light.
 *
 * The point of the act is a choice, so this proves both halves of it --
 * that lighting a lantern really does pull the moths off the puppet and
 * hold them there for a few seconds, and that it wears off.
 */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';

const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
    console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : '  -> ' + detail));
    ok ? pass++ : fail++;
};

const G = `__g.scene.getScene('GameScene')`;
const LANTERNS = `${G}.objects.filter(o => o.isLantern)`;
const MOTHS = `${G}.objects.filter(o => o.constructor.name === 'Moth')`;

/** Each moth's distance to the puppet, and whether it is on a lure. */
const moths = async () => JSON.parse(await b.evaluate(`JSON.stringify(${MOTHS}.map(m => ({
    x: Math.round(m.x), y: Math.round(m.y),
    toPlayer: Math.round(Phaser.Math.Distance.Between(m.x, m.y, ${G}.player.x, ${G}.player.y)),
    lured: Boolean(m.lure)
})))`));

const lanterns = async () => JSON.parse(await b.evaluate(`JSON.stringify(${LANTERNS}.map(l => ({
    x: Math.round(l.x), lit: l.lit, luring: l.luring, frame: l.frame.name
})))`));

const startAct3 = async () => {
    await b.evaluate(`${G}.scene.restart({ act: 3 })`);
    await sleep(1100);
};

try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);
    await b.evaluate(`window.Phaser = (window.__phaserMod.default || window.__phaserMod)`);

    console.log('--- 1. two lanterns, both dark, one at each mouth of the corridor ---');
    await startAct3();
    const dark = await lanterns();
    console.log('  lanterns at x =', dark.map((l) => l.x).join(', '));
    check('there are two of them', dark.length === 2, JSON.stringify(dark));
    check('...both unlit', dark.every((l) => !l.lit && !l.luring), JSON.stringify(dark));
    check('...and neither is pulling anything', (await moths()).every((m) => !m.lured));

    console.log('--- 2. the moths hunt the puppet while the stage is dark ---');
    // Stand in the corridor, where two of them live.
    await b.evaluate(`${G}.player.body.reset(620, 680)`);
    await sleep(2500);

    const hunting = await moths();
    const nearest = Math.min(...hunting.map((m) => m.toPlayer));
    console.log('  nearest moth is', nearest, 'px away');
    check('a moth closes on the puppet', nearest < 260, JSON.stringify(hunting));

    console.log('--- 3. lighting one pulls them off, and holds them ---');
    const lightIt = `(() => { const l = ${LANTERNS}[0]; l.onPlayerTouch(${G}.player); return Math.round(l.x); })()`;
    const litX = await b.evaluate(lightIt);
    console.log('  lit the lantern at x =', litX);
    await sleep(300);

    const justLit = await lanterns();
    check('the lantern is lit and pulling', justLit[0].lit && justLit[0].luring, JSON.stringify(justLit[0]));
    check('...showing its lit frame', justLit[0].frame === 1, JSON.stringify(justLit[0]));

    await sleep(2200);
    const lured = await moths();
    const onLure = lured.filter((m) => m.lured);
    console.log('  moths on the lure:', onLure.length, 'of', lured.length);
    check('moths near it are on the lure, not the puppet', onLure.length >= 2, JSON.stringify(lured));
    check('...and they moved towards it',
        onLure.every((m) => Math.abs(m.x - litX) < 420), JSON.stringify(onLure));

    const after = Math.min(...lured.map((m) => m.toPlayer));
    console.log('  nearest moth now', after, 'px away (was', nearest + ')');
    check('the puppet is left alone while it burns', after > nearest, `${nearest} -> ${after}`);

    console.log('--- 4. it gutters out, and they come back ---');
    const burnMs = await b.evaluate(`(() => {
        const l = ${LANTERNS}[0];
        return Math.max(0, Math.round(l.luresUntil - ${G}.time.now));
    })()`);
    console.log('  it has', burnMs, 'ms left');
    await sleep(burnMs + 1400);

    const spent = await lanterns();
    check('the lantern stopped pulling', !spent[0].luring, JSON.stringify(spent[0]));
    check('...and dropped back to its dark frame', spent[0].frame === 0, JSON.stringify(spent[0]));
    check('no moth is lured any more', (await moths()).every((m) => !m.lured));

    // Measured as CLOSING, not as a distance: a moth that hit the puppet
    // knocks it backwards, so absolute distances drift either way.
    const far = Math.min(...(await moths()).map((m) => m.toPlayer));
    await sleep(1600);
    const near = Math.min(...(await moths()).map((m) => m.toPlayer));

    console.log('  nearest moth closed from', far, 'to', near);
    check('they hunt the puppet again', near < far, `${far} -> ${near}`);

    console.log('--- 5. Huge still swats, so the other answer survives ---');
    // In the OPEN left side: the corridor is 3 tiles and Huge is 4, which
    // is the whole reason the corridor is frightening.
    await startAct3();
    await b.evaluate(`${G}.player.body.reset(200, 680)`);
    await b.tap('Digit3'); await sleep(3400);
    const size = await b.evaluate(`${G}.player.state.name`);
    const swatted = await b.evaluate(`${MOTHS}.filter(m => m.swatted).length`);
    console.log('  as', size + ', swatted', swatted, 'moth(s) by standing there');
    check('Huge fits in the open', size === 'Huge', size);
    check('a Huge puppet still swats a moth that reaches it', swatted >= 1, String(swatted));

    console.log('--- 6. a lured moth really has given up on the puppet ---');
    // NOT measured in wax: a player who simply runs the corridor is never
    // caught either way, because a moth tops out at CONFIG.moth.maxSpeed
    // and the puppet is more than twice that. The lure is insurance for a
    // player who stops, and a thing to watch. So what is checked is the
    // thing that is actually true -- that a lured moth stops hunting.
    await startAct3();
    await b.evaluate(`${G}.player.body.reset(620, 680)`);
    await sleep(1800);
    await b.evaluate(`${LANTERNS}[0].onPlayerTouch(${G}.player)`);
    await sleep(2400);

    const litAt = (await lanterns())[0].x;
    const spread = async () => {
        const pulled = (await moths()).filter((m) => m.lured);

        return {
            count: pulled.length,
            toLantern: Math.round(pulled.reduce((t, m) => t + Math.abs(m.x - litAt), 0) / (pulled.length || 1))
        };
    };

    const early = await spread();
    await sleep(1500);
    const later = await spread();

    console.log(' ', early.count, 'moths on the lure, average', early.toLantern,
        'px from it, then', later.toLantern);
    check('moths are on the lure at all', early.count >= 2, JSON.stringify(early));
    check('...and they are closing on it, not on the puppet',
        later.toLantern < early.toLantern, `${early.toLantern} -> ${later.toLantern}`);

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
