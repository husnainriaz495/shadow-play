import { CONFIG } from '../config.js';
import { TILE_INDEX, TILE_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { FireEffects } from '../fx/FireEffects.js';

/** The four neighbours fire can jump to: no diagonals. */
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Points just outside the player's body that count as "touching" a tile. */
const TOUCH_OUTSET = 2;

/**
 * Burning paper (PRD 4.4 `~` and `f`; the Fire theme, never cut).
 *
 * Every `f` tile on the map is lit when the act starts. A burning tile
 * lights its paper neighbours one tile's travel time after catching, then
 * burns through to a HOLE (no tile, no collision) after burnToHoleSeconds.
 * The travel speed ramps from CONFIG.fire.speedStart to speedEnd over
 * rampSeconds, so the chase tightens. The floor it passes is gone -- fall
 * through and the act restarts (FallWatch).
 *
 * The look lives in fx/FireEffects.js (glows that flare at the front,
 * embers). This file only decides where fire goes. It also tells the paper
 * how much of the act has caught, so the candle's light warms towards
 * red-orange as the fire spreads (PaperScreen.setHeat).
 *
 * WHY each tile keeps its own timers, not one global "spread every 2.5 s"
 * tick (PRD 4.4's wording): with PRD's numbers a tile becomes a hole after
 * 1 s, long before the next 2.5 s tick, so the fire would put itself out.
 * Per-tile timing keeps the front moving at the configured speed.
 * Timers are the scene's own (CODE_RULES 9), so a restart cancels them all.
 *
 * Touching a burning tile costs wax and knocks the puppet back (PRD 4.4);
 * that is Player.hurt(), which handles invulnerability.
 */
export class FireGrid {
    constructor(scene, layer, player, paperScreen) {
        this.scene = scene;
        this.layer = layer;
        this.player = player;
        this.paperScreen = paperScreen;

        /** How much of the act's paper has caught: drives the warm tint. */
        this.totalPaper = 0;
        this.caught = 0;
        layer.forEachTile((tile) => {
            if (tile.index === TILE_INDEX.PAPER || tile.index === TILE_INDEX.BURNING) this.totalPaper++;
        });

        /** When the front starts moving: the speed ramp counts from here. */
        this.spreadStartsAt = scene.time.now + CONFIG.fire.startDelaySeconds * 1000;
        FireGrid.warnIfFireWouldDie();

        /** Burning tiles, by "col,row". */
        this.burning = new Set();

        this.effects = new FireEffects(scene);

        /** Touch probe points, refilled every frame (no new array per frame). */
        this.probes = new Float32Array(16);

        this.lightStartingFires();

        scene.events.on('update', this.checkTouch, this);
        scene.events.once('shutdown', () => scene.events.off('update', this.checkTouch, this));
    }

    /**
     * Too slow a start for the burn time puts the fire out: every tile
     * would burn through before reaching its neighbour. Said once, loudly,
     * so a tuning change cannot silently break the finale.
     */
    static warnIfFireWouldDie() {
        const { speedStart, burnToHoleSeconds } = CONFIG.fire;

        if (TILE_SIZE / speedStart >= burnToHoleSeconds) {
            console.warn('[Shadow Play] CONFIG.fire: at speedStart ' + speedStart + ' px/s a tile takes ' +
                (TILE_SIZE / speedStart).toFixed(2) + ' s to spread but burns out in ' + burnToHoleSeconds +
                ' s, so the fire will go out. Raise speedStart or burnToHoleSeconds.');
        }
    }

    /** The fire front's speed right now, px/s: ramps up over the act. */
    get speed() {
        const { speedStart, speedEnd, rampSeconds } = CONFIG.fire;
        const elapsed = (this.scene.time.now - this.spreadStartsAt) / 1000;
        const progress = Math.min(1, Math.max(0, elapsed / rampSeconds));

        return speedStart + (speedEnd - speedStart) * progress;
    }

    /** The map's `f` tiles: lit at once, but they wait a moment before spreading. */
    lightStartingFires() {
        const starts = [];
        this.layer.forEachTile((tile) => {
            if (tile.index === TILE_INDEX.BURNING) starts.push([tile.x, tile.y]);
        });

        // A head start, so the player can take in the stage before the chase.
        starts.forEach(([col, row]) => this.burn(col, row, CONFIG.fire.startDelaySeconds));
    }

    /** Set a paper tile alight. Anything else (walls, holes) cannot burn. */
    ignite(col, row) {
        const tile = this.layer.getTileAt(col, row);
        if (!tile || tile.index !== TILE_INDEX.PAPER) return;

        // putTileAt keeps it solid: BURNING is in the layer's colliding set.
        this.layer.putTileAt(TILE_INDEX.BURNING, col, row);
        this.burn(col, row, 0);
        this.effects.ignitionBurst(col, row);
        EventBus.emit(EVENTS.TILE_IGNITED, { col, row });
    }

    /**
     * A tile is burning: show it, spread later, then become a hole.
     * @param {number} delaySeconds extra wait before it spreads and burns through
     */
    burn(col, row, delaySeconds) {
        const key = `${col},${row}`;
        if (this.burning.has(key)) return;

        this.burning.add(key);
        this.effects.tileCaught(col, row, delaySeconds);

        this.caught++;
        this.paperScreen.setHeat(this.caught / Math.max(1, this.totalPaper));

        // One tile's worth of travel at the CURRENT speed, so the front
        // speeds up as the act goes on.
        const { burnToHoleSeconds } = CONFIG.fire;
        const spreadSeconds = TILE_SIZE / this.speed;
        this.scene.time.delayedCall((delaySeconds + spreadSeconds) * 1000, () => this.spreadFrom(col, row));
        this.scene.time.delayedCall((delaySeconds + burnToHoleSeconds) * 1000, () => this.burnThrough(col, row));
    }

    spreadFrom(col, row) {
        NEIGHBOURS.forEach(([dx, dy]) => this.ignite(col + dx, row + dy));
    }

    /** Burnt through: the tile is gone, and so is its floor. */
    burnThrough(col, row) {
        this.burning.delete(`${col},${row}`);
        this.effects.tileGone(col, row);

        this.layer.removeTileAt(col, row);
    }

    /**
     * Is the puppet touching a burning tile? Probes a handful of points just
     * outside its body (under the feet, both sides, above the head) rather
     * than asking for a list of tiles, which would build an array every frame.
     */
    checkTouch() {
        const body = this.player.body;
        if (!body) return;

        const o = TOUCH_OUTSET;
        const p = this.probes;
        const midY = body.center.y;

        // Under the feet (left, middle, right), both sides twice, the head.
        p[0] = body.left + o;   p[1] = body.bottom + o;
        p[2] = body.center.x;   p[3] = body.bottom + o;
        p[4] = body.right - o;  p[5] = body.bottom + o;
        p[6] = body.left - o;   p[7] = midY;
        p[8] = body.right + o;  p[9] = midY;
        p[10] = body.left - o;  p[11] = body.bottom - o;
        p[12] = body.right + o; p[13] = body.bottom - o;
        p[14] = body.center.x;  p[15] = body.top - o;

        for (let i = 0; i < p.length; i += 2) {
            const tile = this.layer.getTileAtWorldXY(p[i], p[i + 1]);

            if (tile && tile.index === TILE_INDEX.BURNING) {
                this.player.hurt(CONFIG.wax.hurtCost.fire, (tile.x + 0.5) * TILE_SIZE, 'fire');
                return;
            }
        }
    }
}
