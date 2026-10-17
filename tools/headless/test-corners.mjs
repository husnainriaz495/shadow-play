import { CornerCorrection } from '../../src/systems/CornerCorrection.js';
import { PlatformDrop } from '../../src/systems/PlatformDrop.js';
import { TILE_INDEX } from '../../src/core/constants.js';

// A fake tilemap layer: cells[row][col] = tile index (or undefined).
const layerOf = (cells) => ({
    getTileAtWorldXY(x, y) {
        const col = Math.floor(x / 40), row = Math.floor(y / 40);
        const index = cells[row]?.[col];
        return index === undefined ? null : { index };
    }
});
// A fake player whose body is derived from x (centre) and y (feet), like the real one.
const playerAt = (x, y, vx, vy, w = 40, h = 78) => {
    const p = { x, y };
    p.body = {
        velocity: { x: vx, y: vy }, height: h,
        get left() { return p.x - w / 2; }, get right() { return p.x + w / 2; },
        get top() { return p.y - h; }, get bottom() { return p.y; },
        get center() { return { x: p.x, y: p.y - h / 2 }; }
    };
    return p;
};
const W = TILE_INDEX.WALL, P = TILE_INDEX.PLATFORM;
let pass = 0, fail = 0;
const check = (name, ok, detail) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : '  -> ' + detail)); ok ? pass++ : fail++; };
const dt = 1 / 60;

console.log('--- ceiling corner ---');
{   // tile above-left covers x 40-80; body left at 76 clips it by 4 px
    const p = playerAt(96, 123, 0, -600); new CornerCorrection(layerOf({ 0: { 1: W } })).apply(p, dt, 0, false);
    check('clipping a corner by 4 px slides right by 4', p.x === 100, 'x=' + p.x);
}
{   const p = playerAt(88, 123, 0, -600); new CornerCorrection(layerOf({ 0: { 1: W } })).apply(p, dt, 0, false);
    check('clipping by 12 px (over the 8 px limit) is a real bonk: no slide', p.x === 88, 'x=' + p.x);
}
{   // mirror image: tile above-right covers x 120-160; body right at 124
    const p = playerAt(104, 123, 0, -600); new CornerCorrection(layerOf({ 0: { 3: W } })).apply(p, dt, 0, false);
    check('clipping a right-hand corner by 4 px slides left by 4', p.x === 100, 'x=' + p.x);
}
{   const p = playerAt(100, 123, 0, -600); new CornerCorrection(layerOf({ 0: { 2: W } })).apply(p, dt, 0, false);
    check('a flat ceiling over both corners: no slide', p.x === 100, 'x=' + p.x);
}
{   const p = playerAt(96, 123, 0, 200); new CornerCorrection(layerOf({ 0: { 1: W } })).apply(p, dt, 0, false);
    check('falling, not rising: ceiling check does nothing', p.x === 96, 'x=' + p.x);
}
{   const p = playerAt(96, 123, 0, -600); new CornerCorrection(layerOf({ 0: { 1: W }, 2: { 3: W } })).apply(p, dt, 0, false);
    // slide target overlaps nothing at nextTop (row 1 col 2/3 clear) -> still slides
    check('slides when the landing spot is clear', p.x === 100, 'x=' + p.x);
}
{   const p = playerAt(96, 123, 0, -600); new CornerCorrection(layerOf({ 0: { 1: W, 3: W } })).apply(p, dt, 0, false);
    check('a 40 px gap between two walls: slides cleanly into the one-tile shaft', p.x === 100, 'x=' + p.x);
}

console.log('--- ledge corner ---');
{   // ledge tile at col 3, row 10 (top y 400); feet 3 px below the top, moving right, airborne
    const p = playerAt(100, 403, 220, 50); new CornerCorrection(layerOf({ 10: { 3: W } })).apply(p, dt, 1, false);
    check('feet 3 px under a ledge: popped up onto it', p.y === 400 && p.body.velocity.y === 0, 'y=' + p.y + ' vy=' + p.body.velocity.y);
}
{   const p = playerAt(100, 410, 220, 50); new CornerCorrection(layerOf({ 10: { 3: W } })).apply(p, dt, 1, false);
    check('feet 10 px under (over the 6 px limit): no help', p.y === 410, 'y=' + p.y);
}
{   const p = playerAt(100, 403, 220, 50); new CornerCorrection(layerOf({ 10: { 3: W } })).apply(p, dt, 1, true);
    check('on the ground: ledge assist is off', p.y === 403, 'y=' + p.y);
}
{   const p = playerAt(100, 403, 0, 50); new CornerCorrection(layerOf({ 10: { 3: W } })).apply(p, dt, 0, false);
    check('not pushing towards it: no help', p.y === 403, 'y=' + p.y);
}
{   const p = playerAt(100, 403, 220, 50); new CornerCorrection(layerOf({ 10: { 3: W }, 9: { 3: W } })).apply(p, dt, 1, false);
    check('no room to stand on top: no help', p.y === 403, 'y=' + p.y);
}

console.log('--- one-way shelf ---');
{   const drop = new PlatformDrop(layerOf({ 10: { 2: P } }));
    const p = playerAt(100, 400, 0, 0);
    check('standing on a shelf is detected', drop.isOnPlatform(p.body) === true, '');
    check('before dropping, the shelf holds', drop.letsThrough({ index: P }, 1000) === false, '');
    drop.start(1000);
    check('while dropping, the shelf lets go', drop.letsThrough({ index: P }, 1100) === true, '');
    check('walls never let go, even while dropping', drop.letsThrough({ index: W }, 1100) === false, '');
    check('after 250 ms the shelf holds again', drop.letsThrough({ index: P }, 1300) === false, '');
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
