import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { GAME_WIDTH } from '../core/constants.js';
import { createSizeState } from '../states/index.js';

/**
 * Moves the candle: switches the player between Tiny, Normal and Huge
 * (PRD 4.2).
 *
 * WHY the hitbox changes at once but the picture tweens: the body must be
 * the new size from the very first frame, or the puppet could walk into a
 * gap it no longer fits. What you SEE eases there over ~200 ms
 * (`visualScale`, which the rig draws from), so the change looks smooth.
 *
 * The feet stay planted because Player.applyBodySize() grows the body
 * upward from them, and the rig is anchored at the feet too.
 *
 * Its own class (composition, CODE_RULES 6.6) so Player stays about
 * movement; it announces SIZE_CHANGED or GROW_BLOCKED and lets everyone
 * else react.
 */
export class SizeChanger {
    /**
     * @param {import('../objects/Player.js').Player} player
     * @param {Phaser.Tilemaps.TilemapLayer} layer the act's tiles, for the room check
     */
    constructor(player, layer) {
        this.player = player;
        this.scene = player.scene;
        this.layer = layer;

        /** The scale the puppet is DRAWN at; eases towards state.scale. */
        this.visualScale = player.state.scale;
        this.tween = null;
    }

    /**
     * Switch to a size. Asking for the size you already are does nothing.
     * @param {number|null} index 0 Tiny, 1 Normal, 2 Huge; null = no request
     */
    request(index) {
        const player = this.player;

        if (index === null || index === player.state.index) return;

        const next = createSizeState(index);

        // Growing needs room; shrinking always fits (PRD 4.2).
        if (next.scale > player.state.scale) {
            const shiftX = this.findRoom(next);

            if (shiftX === null) {
                EventBus.emit(EVENTS.GROW_BLOCKED, { sizeIndex: index });
                return;
            }

            player.x += shiftX;
        }

        const previousIndex = player.state.index;

        player.state.exit(player);
        player.state = next;
        player.state.enter(player);
        player.applyBodySize();

        this.tweenPicture(player.state.scale);

        EventBus.emit(EVENTS.SIZE_CHANGED, { sizeIndex: index, previousIndex });
    }

    /**
     * Is there room for the bigger body, standing on the same feet?
     *
     * Tried centred first, then slid sideways just far enough to sit flush
     * against whatever is beside you. Without the slide, standing next to a
     * wall would forbid growing at all, which feels like a bug -- the wider
     * body only needs to step away from the wall by half its extra width.
     *
     * @returns {number|null} how far to move sideways (0 = centred), or
     *          null when there is no room at all
     */
    findRoom(next) {
        const width = next.bodyWidth;
        const shift = (width - this.player.body.width) / 2;

        return [0, shift, -shift].find((dx) => this.fits(this.player.x + dx, width, next)) ?? null;
    }

    /** True if a body of this size, centred on x with its feet here, touches no solid tile. */
    fits(centreX, width, next) {
        const height = next.bodyHeight - CONFIG.player.bodyClearancePx;
        const left = centreX - width / 2;
        const top = this.player.feetY - height;

        // Off the side of the stage counts as "no room" too.
        if (left < 0 || left + width > GAME_WIDTH) return false;

        // Shrunk by 1 px on every side, so merely TOUCHING the floor or a
        // wall does not count as overlapping it.
        const inset = 1;
        const tiles = this.layer.getTilesWithinWorldXY(
            left + inset, top + inset, width - inset * 2, height - inset * 2,
            { isColliding: true }
        );

        return tiles.length === 0;
    }

    /** Ease the drawn size to the new one, replacing any tween in flight. */
    tweenPicture(scale) {
        this.tween?.stop();

        this.tween = this.scene.tweens.add({
            targets: this,
            visualScale: scale,
            duration: CONFIG.player.sizeTweenMs,
            ease: CONFIG.anim.easeInSoft
        });
    }
}
