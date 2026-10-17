import {
    TILE_SIZE, GRID_COLS, GRID_ROWS, TILE_INDEX, SYMBOLS, DEPTHS, SOLID_TILES
} from '../core/constants.js';
import { tileToWorld } from '../core/helpers.js';
import { LevelValidator } from './LevelValidator.js';

/**
 * Which map symbols become TILES in the tilemap, and which tile each one is.
 * Anything not listed here is empty ground as far as the tilemap goes --
 * objects are spawned separately, below.
 */
const TILE_FOR_SYMBOL = {
    [SYMBOLS.WALL]: TILE_INDEX.WALL,
    [SYMBOLS.PAPER]: TILE_INDEX.PAPER,
    [SYMBOLS.FIRE]: TILE_INDEX.BURNING,
    [SYMBOLS.PLATFORM]: TILE_INDEX.PLATFORM
};

/**
 * Turns a level's map strings into a real stage: a Phaser tilemap for the
 * solid parts, plus a list of the things that need spawning.
 *
 * WHY a symbol -> handler TABLE (CODE_RULES.md 6.3): adding a new hazard
 * should mean adding ONE line here, never another branch in a growing
 * if/else chain. Each entry just records where its object goes; GameScene
 * creates the actual objects, because creating things is a scene's job.
 *
 * A tilemap is used rather than loose rectangles so the fire grid can later
 * swap a single tile's index and turn paper into a hole with one call.
 */
export class LevelLoader {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * @param {object} act the level data from src/levels/
     * @param {number} actNumber 1-5, used only in error messages
     * @returns {object} { layer, map, playerStart, spawns, problems }
     */
    load(act, actNumber) {
        const problems = LevelValidator.validate(act, actNumber);

        // Say everything that is wrong, loudly, before anything is built.
        problems.forEach((problem) => console.error(`[Shadow Play] ${problem}`));

        const rows = this.normalise(act?.map ?? []);
        const { layer, map } = this.buildTilemap(rows);
        const { playerStart, spawns } = this.findObjects(rows);

        return { layer, map, playerStart, spawns, problems };
    }

    /**
     * Force the grid to exactly GRID_COLS x GRID_ROWS.
     *
     * A broken level has already been reported above; padding it here means
     * the game still opens so the team can SEE the mistake on screen,
     * instead of a blank page and a stack trace.
     */
    normalise(rows) {
        const fixed = [];

        for (let row = 0; row < GRID_ROWS; row++) {
            const line = typeof rows[row] === 'string' ? rows[row] : '';
            fixed.push(line.padEnd(GRID_COLS, SYMBOLS.EMPTY).slice(0, GRID_COLS));
        }

        return fixed;
    }

    /** Build the tilemap layer and switch collision on for the solid tiles. */
    buildTilemap(rows) {
        const data = rows.map((row) => [...row].map(
            (symbol) => (symbol in TILE_FOR_SYMBOL ? TILE_FOR_SYMBOL[symbol] : TILE_INDEX.EMPTY)
        ));

        const map = this.scene.make.tilemap({
            data,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });

        // 'tileset' is the strip drawn in systems/StageTextures.js.
        const tileset = map.addTilesetImage('tileset', 'tileset', TILE_SIZE, TILE_SIZE);
        const layer = map.createLayer(0, tileset, 0, 0).setDepth(DEPTHS.TILES);

        layer.setCollision(SOLID_TILES);

        // One-way shelves `=` (PRD 4.10): solid on their TOP face only, so
        // you can jump up through one from below and land on it. Dropping
        // back down through it is handled by systems/PlatformDrop.js.
        layer.forEachTile((tile) => {
            if (tile.index === TILE_INDEX.PLATFORM) {
                tile.setCollision(false, false, true, false);
            }
        });

        return { layer, map };
    }

    /**
     * Walk the grid and record where every object goes.
     *
     * Reading order (left to right, top to bottom) matters: it is the order
     * the act's `hints` list is matched against its `?` markers.
     */
    findObjects(rows) {
        // Feet on the FLOOR of the start tile, not floating at its centre.
        const feetOf = (spot) => ({ x: spot.x, y: spot.y + TILE_SIZE / 2 });
        let playerStart = feetOf(tileToWorld(1, GRID_ROWS - 2));
        const spawns = [];
        let hintIndex = 0;

        rows.forEach((row, rowIndex) => {
            [...row].forEach((symbol, colIndex) => {
                const at = tileToWorld(colIndex, rowIndex);

                if (symbol === SYMBOLS.PLAYER) {
                    playerStart = feetOf(at);
                    return;
                }

                if (!SPAWNABLE.has(symbol)) return;

                spawns.push({
                    symbol,
                    x: at.x,
                    y: at.y,
                    col: colIndex,
                    row: rowIndex,
                    hintIndex: symbol === SYMBOLS.HINT ? hintIndex++ : undefined
                });
            });
        });

        return { playerStart, spawns };
    }
}

/**
 * Symbols that become an object rather than a tile.
 *
 * Each one is built from the factory table in systems/ObjectSpawner.js as
 * its milestone arrives: the door now, wax drops in M2, crates, switches
 * and gates in M3, moths, drafts and lanterns in M4.
 */
const SPAWNABLE = new Set([
    SYMBOLS.DOOR,
    SYMBOLS.WAX,
    SYMBOLS.CRATE,
    SYMBOLS.SWITCH,
    SYMBOLS.GATE,
    SYMBOLS.MOTH,
    SYMBOLS.DRAFT,
    SYMBOLS.SHELTER,
    SYMBOLS.CHECKPOINT,
    SYMBOLS.HINT
]);
