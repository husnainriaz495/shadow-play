import { CONFIG } from '../config.js';

/**
 * Drops of melted wax running down the sides of the HUD candle (PRD 4.3.1).
 *
 * WHY: the candle getting shorter is too slow to notice in a 5-second clip.
 * Drips are not: an occasional drip when Tiny, a steady stream when Huge,
 * so anyone watching can SEE that a bigger shadow burns the candle faster.
 *
 * Like the rest of ui/ it only draws. WaxCandle tells it the burn rate and
 * where the candle is; it never asks the player or the wax system anything.
 */
export class WaxDrips {
    /** @param {Phaser.Scene} scene the UI scene */
    constructor(scene) {
        this.scene = scene;

        // Fractions of a drip owed so far. When it passes 1, a drip falls.
        this.owed = 0;

        // The drips are created ONCE and reused (CODE_RULES.md rule 9): a
        // hidden drip is a free one.
        const { dripPoolSize } = CONFIG.hud;
        this.pool = [];
        for (let i = 0; i < dripPoolSize; i++) {
            this.pool.push(scene.add.image(0, 0, 'wax_drip')
                .setOrigin(0.5, 0)
                .setVisible(false));
        }
    }

    /**
     * Called every frame by WaxCandle.
     *
     * @param {number} delta ms since the last frame
     * @param {number} rate burn speed (0 = not burning, 1 = Normal, 2 = Huge)
     * @param {{ left: number, right: number, top: number, bottom: number }} candle
     *   the wax body's edges, so drips start at the melting top
     */
    update(delta, rate, candle) {
        if (rate <= 0) return;

        // Rate SQUARED, so the difference between sizes is dramatic, not subtle.
        this.owed += (delta / 1000) * CONFIG.hud.dripsPerSecond * rate * rate;

        while (this.owed >= 1) {
            this.owed -= 1;
            this.spawn(rate, candle);
        }
    }

    /** Start one free drip down the left or right edge of the candle. */
    spawn(rate, candle) {
        const drip = this.pool.find((d) => !d.visible);
        if (!drip) return;   // all busy: skipping one drip is invisible

        // Centred just OUTSIDE an edge, so the drip bulges over the side and
        // shows against the background (inside, wax on wax, it is invisible).
        const outset = CONFIG.hud.dripWidth / 2 - 1;
        const x = Math.random() < 0.5 ? candle.left - outset : candle.right + outset;

        drip.setPosition(x, candle.top).setVisible(true).setAlpha(1).setScale(1, 0.5);

        // One tween per drip (a few per second at most), not per frame.
        this.scene.tweens.add({
            targets: drip,
            y: candle.bottom - CONFIG.hud.dripHeight,
            scaleY: 1.2,
            alpha: 0.6,
            duration: CONFIG.hud.dripFallMs / rate,
            ease: CONFIG.anim.easeOut,
            onComplete: () => drip.setVisible(false)
        });
    }

    /** The candle went out or the HUD is hiding: clear every drip at once. */
    clear() {
        this.owed = 0;
        this.pool.forEach((drip) => {
            this.scene.tweens.killTweensOf(drip);
            drip.setVisible(false);
        });
    }
}
