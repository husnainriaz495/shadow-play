/**
 * The finale's FINAL EXAM: shelter, crate, climb.
 *
 * The one thing that has to be true for the section to mean anything is
 * that the crate is the STEP and not a shortcut -- a four-tile ledge that
 * a Huge jump cannot reach. The rest is that the borrowed pieces (one
 * window, one screen) are really there and really rarer than Act IV's.
 */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';

const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
    console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : '  -> ' + detail));
    ok ? pass++ : fail++;
};

const G = `__g.scene.getScene('GameScene')`;
const feet = async () => (await b.evaluate(`${G}.player?.body ? Math.round(${G}.player.feetY) : null`)) ?? 680;

const startFinale = async (finale) => {
    await b.evaluate(`${G}.scene.restart({ act: ${finale} })`);
    await sleep(1100);
};

try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);

    const finale = await b.actCount();
    await startFinale(finale);
    console.log('  act', finale, '-', await b.evaluate(`${G}.currentAct.title`));

    console.log('--- 1. the borrowed pieces are on the stage ---');
    const parts = JSON.parse(await b.evaluate(`JSON.stringify({
        crates: ${G}.objects.filter(o => o.isMovable).length,
        shelters: ${G}.objects.filter(o => o.isShelter).length,
        wind: Boolean(${G}.wind),
        vents: ${G}.wind ? ${G}.wind.vents.length : 0,
        interval: ${G}.wind ? ${G}.wind.intervalSeconds : null
    })`));
    console.log(' ', JSON.stringify(parts));
    check('one crate to push', parts.crates === 1, JSON.stringify(parts));
    check('one screen to shelter in', parts.shelters === 1, JSON.stringify(parts));
    check('one window, and a wind blowing through it', parts.wind && parts.vents === 1);
    check('its gusts are rarer than Act IV\'s', parts.interval > 6, `every ${parts.interval} s`);

    console.log('--- 2. the last ledge is out of reach, even for Huge ---');
    // Stand in the clear tiles past the slab and jump as hard as the game
    // allows, with the crate taken away rather than left under foot.
    // (Moving it instead is a trap: dropped anywhere inside the stone
    // block its body is born embedded in solid tiles.)
    await b.evaluate(`${G}.objects.find(o => o.isMovable).disableBody(true, true)`);
    await b.evaluate(`${G}.player.body.reset(1000, 680)`);
    await b.tap('Digit3'); await sleep(600);

    const grew = await b.evaluate(`${G}.player.state.name`);
    check('Huge fits in the gap before the ledge', grew === 'Huge', grew);

    const jump = async () => {
        await b.down('Space'); await sleep(340); await b.up('Space');
    };

    let best = 680;
    for (let i = 0; i < 4; i++) {
        await b.down('ArrowRight');
        await jump();
        for (let k = 0; k < 6; k++) { best = Math.min(best, await feet()); await sleep(90); }
        await b.up('ArrowRight');
        await sleep(500);
    }
    const landed = await feet();
    console.log('  ...and it lands back at', landed);
    console.log('  highest the puppet reached:', best, '(the ledge top is 520)');
    check('a Huge jump alone never reaches the ledge', best > 520, `best ${best}, ended ${landed}`);

    console.log('--- 3. with the crate pushed home, it is two easy steps ---');
    // Geometry, not another physics run: solve-act5.mjs already plays the
    // whole route. What matters here is that NEITHER step is bigger than
    // an ordinary jump once the crate is in place.
    await startFinale(finale);
    const step = JSON.parse(await b.evaluate(`JSON.stringify((() => {
        const L = ${G}.layer;
        const crate = ${G}.objects.find(o => o.isMovable);

        // Find the last ledge rather than naming a column: the map moves.
        // It is the first column right of the crate with a solid floor
        // tile, and its top is the highest solid tile in that column.
        let col = Math.floor(crate.body.right / 40);
        while (col < 32 && !L.getTileAt(col, 16)) col++;

        // From row 1: row 0 is the ceiling, and it is solid everywhere.
        let row = 1;
        while (row < 18 && !L.getTileAt(col, row)) row++;

        return { col, floorTop: L.getTileAt(col - 1, 17).pixelY,
            crateTop: crate.body.top, ledgeTop: L.getTileAt(col, row).pixelY };
    })())`));

    const toCrate = step.floorTop - step.crateTop;
    const toLedge = step.crateTop - step.ledgeTop;
    console.log(`  floor ${step.floorTop} -> crate ${step.crateTop} -> ledge ${step.ledgeTop} (column ${step.col})`);
    console.log(`  so the two steps are ${toCrate} px and ${toLedge} px (a tile is 40)`);

    check('the crate is a step up off the floor', toCrate > 0 && toCrate <= 80, `${toCrate} px`);
    check('...and from it the ledge is one more of the same', toLedge > 0 && toLedge <= 80, `${toLedge} px`);
    check('...while the ledge alone is four tiles off the floor',
        step.floorTop - step.ledgeTop === 160, `${step.floorTop - step.ledgeTop} px`);

    console.log('--- 4. the shelter sits where you drop off the stone block ---');
    const where = JSON.parse(await b.evaluate(`JSON.stringify(
        ${G}.objects.filter(o => o.isShelter).map(s => Math.round(s.bounds.centerX)))`));
    console.log('  screen at x =', where.join(', '));
    check('it is past the block and before the slab', where[0] > 720 && where[0] < 800, JSON.stringify(where));

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
