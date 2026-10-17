/**
 * Act II's TIMED GATE: stepping off the switch buys a few seconds, shown
 * as a shrinking ring and a tick, and the crate is what holds it for good.
 *
 * It proves the act has two answers, not one -- the crate, or the dash.
 */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';

const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
    console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : '  -> ' + detail));
    ok ? pass++ : fail++;
};

const G = `__g.scene.getScene('GameScene')`;
const SW = `${G}.objects.find(o => o.isSwitch)`;
const GATE = `${G}.objects.find(o => o.isGate)`;

/** The switch tile in Act II, and the floor of the notch it sits in. */
const SWITCH_X = 700;
const NOTCH_FLOOR = 600;

const state = async () => JSON.parse(await b.evaluate(`JSON.stringify((() => {
    const s = ${SW}, g = ${GATE};
    return {
        plateDown: s.pressed, holding: s.holding, ticking: s.ring.running,
        ringT: +s.ring.remaining.t.toFixed(2),
        gateOpen: g.isOpen, heldBy: g.heldBy, solid: g.body.enable
    };
})())`));

const startAct2 = async () => {
    await b.evaluate(`${G}.scene.restart({ act: 2 })`);
    await sleep(900);
};

try {
    await b.goto(URL); await sleep(600); await b.seedSave();
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await b.tap('Space'); await sleep(1200);

    console.log('--- 1. standing on it as Huge opens the gate, with no clock ---');
    await startAct2();
    await b.tap('Digit3'); await sleep(600);                 // Huge
    await b.evaluate(`${G}.player.body.reset(${SWITCH_X}, ${NOTCH_FLOOR})`);
    await sleep(600);

    const on = await state();
    check('the plate is down', on.plateDown, JSON.stringify(on));
    check('the gate is open and passable', on.gateOpen && !on.solid, JSON.stringify(on));
    check('nothing is counting down while it is held', !on.ticking, JSON.stringify(on));

    console.log('--- 2. stepping off starts the borrowed time ---');
    await b.evaluate(`${G}.player.body.reset(260, 560)`);     // back on the ledge, well clear
    await sleep(400);

    const off = await state();
    check('the plate springs up', !off.plateDown, JSON.stringify(off));
    check('...but the gate is still open', off.gateOpen && !off.solid, JSON.stringify(off));
    check('...and the ring is counting', off.ticking && off.ringT > 0 && off.ringT < 1, JSON.stringify(off));

    console.log('--- 3. it shuts when the time is up ---');
    // Straight off the running countdown, so the test never has to be
    // kept in step with CONFIG.switchGate.holdSeconds by hand.
    const holdMs = await b.evaluate(`${SW}.ring.tween.duration`);
    console.log('  the gate is held for', holdMs, 'ms after the plate rises');
    await sleep(holdMs + 900);

    const shut = await state();
    check('the gate closed on its own', !shut.gateOpen && shut.solid, JSON.stringify(shut));
    check('the switch let go', !shut.holding && shut.heldBy === 0, JSON.stringify(shut));
    check('the ring is gone', !shut.ticking, JSON.stringify(shut));

    console.log('--- 4. standing back on it stops the clock ---');
    await b.evaluate(`${G}.player.body.reset(${SWITCH_X}, ${NOTCH_FLOOR})`); await sleep(500);
    await b.evaluate(`${G}.player.body.reset(260, 560)`); await sleep(500);
    check('counting again', (await state()).ticking);

    await b.evaluate(`${G}.player.body.reset(${SWITCH_X}, ${NOTCH_FLOOR})`); await sleep(500);
    const back = await state();
    check('the clock stopped and the gate stayed open',
        !back.ticking && back.gateOpen && back.holding, JSON.stringify(back));

    // Hopping on and off must never leave the gate owing a release.
    for (let i = 0; i < 3; i++) {
        await b.evaluate(`${G}.player.body.reset(260, 560)`); await sleep(250);
        await b.evaluate(`${G}.player.body.reset(${SWITCH_X}, ${NOTCH_FLOOR})`); await sleep(250);
    }
    check('hopping on and off never double-counts the gate',
        (await state()).heldBy === 1, JSON.stringify(await state()));

    console.log('--- 5. THE DASH: press it as Huge, shrink, and run it ---');
    await startAct2();
    await b.tap('Digit3'); await sleep(500);
    await b.evaluate(`${G}.player.body.reset(${SWITCH_X}, ${NOTCH_FLOOR})`);
    await sleep(500);
    check('the gate is open to dash through', (await state()).gateOpen);

    // Normal, because Huge (4 tiles) does not fit the 3-tile doorway --
    // then jump out of the notch and run, all inside the borrowed time.
    await b.tap('Digit2');
    await sleep(300);                                         // let the size settle
    await b.down('ArrowRight');
    await sleep(150);
    await b.tap('Space');                                     // out of the notch...
    await sleep(450);
    await b.tap('Space');                                     // ...or on the next step
    await sleep(1500);
    await b.up('ArrowRight');
    await sleep(300);

    const after = await b.evaluate(`JSON.stringify({ x: Math.round(${G}.player.x), size: ${G}.player.state.name })`);
    const dash = JSON.parse(after);
    console.log('  ended at', JSON.stringify(dash));
    check('the puppet got past the gate before it shut', dash.x > 880, after);

    console.log('--- 6. the crate holds it open for good ---');
    await startAct2();
    await b.tap('Digit3'); await sleep(500);
    await b.evaluate(`${G}.player.body.reset(396, 560)`); await sleep(300);
    await b.hold('ArrowRight', 4200);
    await b.evaluate(`${G}.player.body.reset(150, 680)`);     // walk away entirely
    await sleep(2500);

    const crated = await state();
    check('the crate keeps the plate down', crated.plateDown, JSON.stringify(crated));
    check('...so no clock ever starts', !crated.ticking, JSON.stringify(crated));
    check('...and the gate stays open', crated.gateOpen && !crated.solid, JSON.stringify(crated));

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
