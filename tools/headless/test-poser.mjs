import { PuppetPoser } from '../../src/systems/PuppetPoser.js';
// A stand-in for the real Player: the poser only ever reads these.
const player = {
    body: { blocked: { down: false }, touching: { down: false }, velocity: { x: 0, y: 0 } },
    controls: { direction: 0 },          // isPushing (M3, crates)
    state: { canPushCrates: false }
};
const poser = new PuppetPoser(player);
const set = (grounded, vx = 0, vy = 0) => { player.body.blocked.down = grounded; player.body.velocity.x = vx; player.body.velocity.y = vy; };
let pass = 0, fail = 0;
const check = (name, got, want) => { const ok = got === want; console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : `  -> got ${got}, want ${want}`)); ok ? pass++ : fail++; };

// Spawn: one frame "in the air" before physics settles, then grounded.
set(false); poser.choosePose(0);
set(true);  check('spawning on the floor does not trigger a landing', poser.choosePose(16), 'idle');

set(false, 0, -500); check('rising is the jump pose', poser.choosePose(1000), 'jump');
set(false, 0, 300);  check('descending is the fall pose', poser.choosePose(1400), 'fall');
set(true);           check('touching down after a real fall: land', poser.choosePose(1500), 'land');
check('still landing 90 ms later', poser.choosePose(1590), 'land');
check('back to idle after 100 ms', poser.choosePose(1601), 'idle');
set(true, 200);      check('walking on the ground', poser.choosePose(1700), 'walk');

// The walk cycle is driven by distance: standing still must not advance it.
const before = poser.phase; set(true, 0); poser.update(2000, 0.5);
check('standing still: walk phase does not move', poser.phase, before);
set(true, 200); poser.update(2500, 0.5);
check('walking 100 px advances the phase by 100 x strideFactor', +(poser.phase - before).toFixed(3), +(100 * 0.055).toFixed(3));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
