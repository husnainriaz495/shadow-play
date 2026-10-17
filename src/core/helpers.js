import { TILE_SIZE } from './constants.js';

/**
 * Small helpers shared by several files.
 *
 * WHY: CODE_RULES.md rule 4 -- no duplicated logic. Converting tile
 * coordinates to pixels is needed by the level loader, the fire grid and the
 * draft system, so it is written once, here.
 */

/**
 * Centre of a tile in world pixels.
 * Tile (0,0) is the top-left of the level, and its centre is (20, 20).
 */
export function tileToWorld(col, row) {
    return {
        x: col * TILE_SIZE + TILE_SIZE / 2,
        y: row * TILE_SIZE + TILE_SIZE / 2
    };
}

/** Which tile a world position falls in. */
export function worldToTile(x, y) {
    return {
        col: Math.floor(x / TILE_SIZE),
        row: Math.floor(y / TILE_SIZE)
    };
}

/** Keep a number inside a range, e.g. wax between 0 and 100. */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Cut a generated strip texture into numbered frames.
 *
 * WHY: a real sprite sheet loaded from a PNG gives frames 0, 1, 2...
 * A texture we draw in code is one single frame by default. This adds the
 * same numbered frames to it, so gameplay code can call sprite.setFrame(1)
 * without caring whether the texture came from a file or from Graphics.
 */
export function sliceFrames(scene, key, frameWidth, frameHeight, count) {
    const texture = scene.textures.get(key);

    for (let i = 0; i < count; i++) {
        texture.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
}

/**
 * Turn a Phaser colour number (0xf2d6a2) into a CSS string ('#f2d6a2').
 *
 * WHY: CONFIG.palette stores colours as numbers because Phaser Graphics
 * wants numbers, but the Canvas 2D context used for gradients wants strings.
 */
export function toCssColor(color) {
    return '#' + color.toString(16).padStart(6, '0');
}

/**
 * Blend two colours. `amount` 0 gives `from`, 1 gives `to`.
 *
 * WHY: PALETTE.md defines some colours as mixes of others (the puppet rods
 * are 60% shadow + 40% warm light). Computing them means changing a base
 * colour automatically updates every colour mixed from it.
 */
export function mixColors(from, to, amount) {
    const channel = (shift) => {
        const a = (from >> shift) & 0xff;
        const b = (to >> shift) & 0xff;

        return Math.round(a + (b - a) * amount) << shift;
    };

    return channel(16) | channel(8) | channel(0);
}

/**
 * 1 -> "I", 4 -> "IV". The acts are numbered the way a theatre programme
 * numbers them, so anything that shows an act number ("CONTINUE - ACT III",
 * "ACT III OF V") reads the same as the act titles themselves.
 *
 * Only ever used for small numbers, so the table stops where the acts do.
 */
const NUMERALS = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export function romanNumeral(value) {
    let left = Math.max(0, Math.floor(value));
    let out = '';

    NUMERALS.forEach(([size, letters]) => {
        while (left >= size) {
            out += letters;
            left -= size;
        }
    });

    return out || '0';
}
