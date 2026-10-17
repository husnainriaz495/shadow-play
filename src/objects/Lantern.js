import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, TILE_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * A lantern: walk into it and it catches, with a flare and a chime.
 *
 * It comes in two kinds, and the map symbol picks which:
 *
 *  - `k`, a CHECKPOINT (Act I, PRD 4.8). The act restarts from here
 *    instead of the beginning, and it saves the WAX as well as the spot
 *    -- without that, a player who reached it on their last drop of wax
 *    would be sent back to it with that same last drop, over and over.
 *    It only announces; systems/Death.js decides what a restart means and
 *    GameScene puts the puppet where the announcement said.
 *
 *  - `l`, a LURE (Act III). It saves nothing. It is simply a light, and
 *    moths go to lights (objects/Moth.js), so lighting one pulls every
 *    moth within CONFIG.moth.lureRadius off the puppet and onto the
 *    lantern for a few seconds. Then it gutters out and they come back.
 *    That is Act III's choice: spend the lure and slip past, or go Huge
 *    and swat, which costs wax because Huge burns twice as fast.
 */
export class Lantern extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {number} x, y the CENTRE of the lantern's map tile
     * @param {object} [options]
     * @param {boolean} [options.checkpoint] true for `k`, false for `l`
     */
    constructor(scene, x, y, { checkpoint = true } = {}) {
        super(scene, x, y + CONFIG.lantern.standOffsetY, 'lantern');

        scene.add.existing(this);
        scene.physics.add.existing(this, true);   // static: it never moves

        this.setDepth(DEPTHS.PROPS).setFrame(0);
        this.lit = false;
        this.isLantern = true;
        this.isCheckpoint = checkpoint;

        /**
         * While `scene.time.now` is under this, moths are drawn to it. A
         * checkpoint burns for the rest of the act; a lure has seconds.
         */
        this.luresUntil = 0;

        this.glow = this.buildGlow();
    }

    /** Dark until it is lit, then a warm pool that breathes. */
    buildGlow() {
        const l = CONFIG.lantern;
        const glow = this.scene.add.image(this.x, this.y, 'soft_glow')
            .setTint(CONFIG.palette.flameOuter)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTHS.PROPS - 1)
            .setAlpha(0);

        glow.setScale((l.glowRadius * 2) / glow.width);

        return glow;
    }

    /** Called when the player overlaps it. Fires once. */
    onPlayerTouch(player) {
        if (this.lit) return;

        this.lit = true;
        this.setFrame(1);

        const l = CONFIG.lantern;

        this.luresUntil = this.isCheckpoint
            ? Number.POSITIVE_INFINITY
            : this.scene.time.now + l.lureSeconds * 1000;

        // A flare, then settling to a steady breathing glow.
        this.scene.tweens.add({
            targets: this.glow,
            alpha: { from: l.flareAlpha, to: l.glowMinAlpha },
            scale: { from: this.glow.scale * l.flareScale, to: this.glow.scale },
            duration: l.flareMs,
            ease: CONFIG.anim.easeOut,
            onComplete: () => this.breathe()
        });

        EventBus.emit(EVENTS.LANTERN_LIT, { lure: !this.isCheckpoint });

        if (!this.isCheckpoint) return;

        EventBus.emit(EVENTS.CHECKPOINT_LIT, {
            x: this.x,
            y: this.y - CONFIG.lantern.standOffsetY,
            wax: player.scene.candle?.wax ?? CONFIG.wax.max
        });
    }

    /**
     * A lure burns out. The frame drops back and the glow dies over a
     * second, so the moths turning round is something the player SEES
     * coming rather than something that just happens to them.
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.luring || time < this.luresUntil) return;

        this.luresUntil = 0;
        this.setFrame(0);
        this.scene.tweens.killTweensOf(this.glow);
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0,
            duration: CONFIG.lantern.lureFadeMs,
            ease: CONFIG.anim.easeOut
        });
    }

    /** Is it pulling moths right now? */
    get luring() {
        return this.lit && this.luresUntil > 0;
    }

    breathe() {
        const l = CONFIG.lantern;

        this.scene.tweens.add({
            targets: this.glow,
            alpha: l.glowMaxAlpha,
            duration: l.glowPulseMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * The nearest lantern pulling on a moth at (x, y), or null.
     *
     * A moth goes to a light, and that is the whole of Act III's second
     * answer: light a lure and every moth near it forgets the puppet for
     * a few seconds -- long enough to walk the corridor instead of
     * fighting through it.
     *
     * It lives here rather than on the moth because what counts as a lure
     * is this class's business, not the moth's (CODE_RULES 6.1).
     */
    static lureNear(lanterns, x, y, radius) {
        let best = null;
        let bestDistance = radius;

        (lanterns ?? []).forEach((lantern) => {
            const point = lantern.lurePoint;
            if (!point) return;

            const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);

            if (distance < bestDistance) {
                best = point;
                bestDistance = distance;
            }
        });

        return best;
    }

    /** Where a moth should be drawn to, or null when it is not pulling. */
    get lurePoint() {
        return this.luring ? { x: this.x, y: this.y } : null;
    }

    /** The tile this stands on, for the checkpoint the act restarts at. */
    get tile() {
        return { col: Math.floor(this.x / TILE_SIZE), row: Math.floor(this.y / TILE_SIZE) };
    }
}
