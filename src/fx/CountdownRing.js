import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';

/** A full turn, in radians: the ring starts full and sweeps away to nothing. */
const TURN = Math.PI * 2;

/** Straight up, so the ring empties clockwise from twelve o'clock. */
const START_ANGLE = -Math.PI / 2;

/**
 * A ring of light that shrinks as a few seconds run out, with a tick for
 * each one (PRD 4.4, the timed gate in Act II).
 *
 * WHY it is a shape and not a number: the player is RUNNING when this
 * matters. A ring over the thing that is counting down can be read out of
 * the corner of an eye, from across the stage, while a clock face cannot.
 * It turns from gold to danger red over the last second so the deadline is
 * felt rather than counted.
 *
 * It knows nothing about switches, gates or sound. The owner says how long
 * and hears about each tick and the end, so the ticking noise stays in
 * systems/SoundCues.js like every other sound (CODE_RULES 6.2).
 */
export class CountdownRing {
    /** @param {number} x, y where the ring is centred */
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        this.arc = scene.add.graphics().setDepth(DEPTHS.PROPS + 1).setVisible(false);

        // The same soft halo the wax drops and the door use, so the ring
        // reads as LIGHT rather than as a dial drawn on the stage.
        this.glow = scene.add.image(x, y, 'soft_glow')
            .setTint(CONFIG.palette.accent)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTHS.PROPS)
            .setVisible(false);

        this.glow.setScale((CONFIG.countdownRing.radiusPx * 2) / this.glow.width);
        this.baseGlowScale = this.glow.scale;

        /** Counts 1 -> 0. A tween moves it, so it pauses with the scene. */
        this.remaining = { t: 0 };
        this.tween = null;
        this.ticker = null;
    }

    get running() {
        return Boolean(this.tween);
    }

    /**
     * Start (or restart) the countdown.
     *
     * @param {number} ms how long the player has
     * @param {object} [handlers]
     * @param {Function} [handlers.onTick] once a second, starting at once
     * @param {Function} [handlers.onDone] when the time is up
     */
    start(ms, { onTick, onDone } = {}) {
        this.stop();

        this.remaining.t = 1;
        this.arc.setVisible(true);
        this.glow.setVisible(true);

        this.tween = this.scene.tweens.add({
            targets: this.remaining,
            t: 0,
            duration: ms,
            ease: 'Linear',                  // a clock does not ease
            onUpdate: () => this.draw(),
            onComplete: () => {
                this.stop();
                onDone?.();
            }
        });

        const every = CONFIG.countdownRing.tickMs;

        onTick?.();                          // the first tick is the start
        this.ticker = this.scene.time.addEvent({
            delay: every,
            repeat: Math.max(0, Math.ceil(ms / every) - 2),
            callback: () => onTick?.()
        });

        this.draw();
    }

    /** Stop and hide, without telling anyone the time ran out. */
    stop() {
        this.tween?.stop();
        this.tween = null;
        this.ticker?.remove();
        this.ticker = null;

        this.arc.clear().setVisible(false);
        this.glow.setVisible(false);
    }

    /**
     * One frame of the ring: a faint full circle for the track, the
     * remaining time as an arc on top, and the halo shrinking with it.
     */
    draw() {
        const ring = CONFIG.countdownRing;
        const t = this.remaining.t;
        const radius = ring.radiusPx * (ring.shrinkTo + (1 - ring.shrinkTo) * t);
        const urgent = t <= ring.warnFraction;
        const colour = urgent ? CONFIG.palette.danger : CONFIG.palette.accent;

        this.arc.clear()
            .lineStyle(ring.trackWidthPx, CONFIG.palette.textMuted, ring.trackAlpha)
            .strokeCircle(this.x, this.y, radius)
            // The last seconds are the ones worth seeing, so the arc gets
            // THICKER as it runs out rather than quietly disappearing.
            .lineStyle(ring.widthPx + (urgent ? ring.warnExtraPx : 0), colour, 1)
            .beginPath()
            .arc(this.x, this.y, radius, START_ANGLE, START_ANGLE + TURN * t)
            .strokePath();

        this.glow
            .setTint(colour)
            .setScale(this.baseGlowScale * (ring.shrinkTo + (1 - ring.shrinkTo) * t))
            .setAlpha(ring.glowAlpha * (ring.glowFloor + (1 - ring.glowFloor) * t));
    }

    destroy() {
        this.stop();
        this.arc.destroy();
        this.glow.destroy();
    }
}
