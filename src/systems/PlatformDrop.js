import { CONFIG } from '../config.js';
import { TILE_INDEX } from '../core/constants.js';

/**
 * Dropping DOWN through a one-way shelf `=` with Down + Jump (PRD 4.10).
 *
 * The shelf only blocks from above (LevelLoader sets that up), so jumping
 * up through it needs nothing extra. Going down is the opposite: for a
 * moment the shelf must stop holding the player up. This keeps a short
 * "dropping" window open; while it is open, GameScene's collider ignores
 * shelf tiles for the player, and gravity does the rest.
 */
export class PlatformDrop {
    /** @param {Phaser.Tilemaps.TilemapLayer} layer the act's tiles */
    constructor(layer) {
        this.layer = layer;
        this.droppingUntil = -Infinity;
    }

    /** Is the player standing on a one-way shelf right now? */
    isOnPlatform(body) {
        const tile = this.layer.getTileAtWorldXY(body.center.x, body.bottom + 1);
        return Boolean(tile) && tile.index === TILE_INDEX.PLATFORM;
    }

    start(time) {
        this.droppingUntil = time + CONFIG.player.dropThroughMs;
    }

    /** Should this tile let the player through at this moment? */
    letsThrough(tile, time) {
        return tile.index === TILE_INDEX.PLATFORM && time < this.droppingUntil;
    }
}
