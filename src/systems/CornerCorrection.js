import { CONFIG } from '../config.js';
import { SOLID_TILES, TILE_SIZE } from '../core/constants.js';

/** Probe a pixel inside the body's edge, so touching a wall is not "inside" it. */
const EDGE = 1;

/**
 * Forgiveness at corners, borrowed from Celeste (PRD 4.10).
 *
 * Two small, invisible nudges:
 *  - CEILING: jumping up and clipping the corner of a ceiling by only a few
 *    pixels slides you round it instead of stopping the jump dead
 *  - LEDGE: in the air, missing the top of a ledge by a few pixels with your
 *    feet pops you up onto it instead of sliding down its face
 *
 * Players never notice either one. They just stop feeling cheated by jumps
 * they very nearly made. Limits are CONFIG.player.cornerCorrection.
 *
 * It runs BEFORE physics moves the body each frame, looking at where the
 * body is about to go. It only moves the player; it never changes speed
 * sideways, so it cannot fling anyone.
 */
export class CornerCorrection {
    /** @param {Phaser.Tilemaps.TilemapLayer} layer the act's tiles */
    constructor(layer) {
        this.layer = layer;
    }

    /** Is there a fully solid tile at this world point? */
    isSolid(x, y) {
        const tile = this.layer.getTileAtWorldXY(x, y);
        return Boolean(tile) && SOLID_TILES.includes(tile.index);
    }

    /**
     * @param {Player} player
     * @param {number} seconds frame time
     * @param {number} direction -1 left, 0 none, 1 right (the input held)
     * @param {boolean} onGround
     */
    apply(player, seconds, direction, onGround) {
        this.ceiling(player, seconds);

        if (!onGround && direction !== 0) {
            this.ledge(player, direction);
        }
    }

    /**
     * Rising into a ceiling with only ONE top corner blocked means the head
     * is clipping an edge, not hitting a flat ceiling. If the overlap is
     * small, slide sideways just far enough to clear it.
     */
    ceiling(player, seconds) {
        const body = player.body;
        if (body.velocity.y >= 0) return;

        const nextTop = body.top + body.velocity.y * seconds;
        const leftBlocked = this.isSolid(body.left + EDGE, nextTop);
        const rightBlocked = this.isSolid(body.right - EDGE, nextTop);

        // Both clear: nothing above. Both blocked: a real ceiling -- bonk.
        if (leftBlocked === rightBlocked) return;

        const limit = CONFIG.player.cornerCorrection.ceilingPx;

        if (leftBlocked) {
            const tileRight = (Math.floor((body.left + EDGE) / TILE_SIZE) + 1) * TILE_SIZE;
            const shift = tileRight - body.left;

            if (shift <= limit && !this.isSolid(body.right + shift - EDGE, nextTop)) {
                player.x += shift;
            }
        } else {
            const tileLeft = Math.floor((body.right - EDGE) / TILE_SIZE) * TILE_SIZE;
            const shift = body.right - tileLeft;

            if (shift <= limit && !this.isSolid(body.left - shift + EDGE, nextTop)) {
                player.x -= shift;
            }
        }
    }

    /**
     * Moving sideways in the air with the feet just below the top of a
     * ledge: lift the player onto it, if there is room to stand there.
     */
    ledge(player, direction) {
        const body = player.body;
        const frontX = direction > 0 ? body.right + EDGE : body.left - EDGE;
        const footY = body.bottom - EDGE;

        if (!this.isSolid(frontX, footY)) return;

        const ledgeTop = Math.floor(footY / TILE_SIZE) * TILE_SIZE;
        const rise = body.bottom - ledgeTop;

        if (rise <= 0 || rise > CONFIG.player.cornerCorrection.ledgePx) return;

        // Only if the body would actually fit standing on the ledge.
        const roomAbove = !this.isSolid(frontX, ledgeTop - EDGE) &&
            !this.isSolid(frontX, ledgeTop - body.height);

        if (roomAbove) {
            player.y -= rise;
            body.velocity.y = Math.min(body.velocity.y, 0);
        }
    }
}
