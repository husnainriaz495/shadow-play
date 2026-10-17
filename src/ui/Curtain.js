import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH } from '../core/constants.js';

/**
 * The theatre curtain: two halves that slide in from the sides and meet in
 * the middle (PRD 5.1).
 *
 * WHY in ui/: it only draws and moves. Whoever owns it decides WHEN it
 * closes or opens -- a death (systems/Death.js), the act
 * card between acts (scenes/ActCardScene.js) and the ending.
 *
 * Each half is a little wider than half the screen (ASSETS.md: 660 px), so
 * they overlap at the centre and no gap can ever show between them.
 */
export class Curtain {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} [options]
     * @param {number} [options.closedAmount] how shut it starts: 0 parked
     *        off both sides, 1 fully across. A scene that begins BEHIND the
     *        curtain starts at 1 and opens it; the quick-restart flick
     *        starts part-way across.
     */
    constructor(scene, { closedAmount = 0 } = {}) {
        this.scene = scene;

        this.left = scene.add.image(0, 0, 'curtain_left').setOrigin(1, 0);
        this.right = scene.add.image(GAME_WIDTH, 0, 'curtain_right').setOrigin(0, 0);

        // The two halves must MEET with room to spare. The painted art has
        // soft transparent edges, so butting them up exactly still shows a
        // seam of stage down the middle; they are scaled up until they
        // overlap by CONFIG.curtain.overlapPx. Scaling (rather than sliding
        // them further in) keeps the outer edges past the sides of the
        // stage, or closing the curtain would open a gap at the walls.
        const scale = (GAME_WIDTH + CONFIG.curtain.overlapPx) / (this.left.width * 2);

        [this.left, this.right].forEach((half) => {
            half.setOrigin(half === this.left ? 1 : 0, 0).setScale(scale).setDepth(DEPTHS.CURTAIN);
        });

        this.setClosedAmount(closedAmount);
    }

    /**
     * Where each half sits at `amount`: 0 parked off the side, 1 shut.
     * displayWidth, not width: the halves are scaled (see the constructor).
     */
    xAt(amount) {
        return {
            left: Phaser.Math.Linear(0, this.left.displayWidth, amount),
            right: Phaser.Math.Linear(GAME_WIDTH, GAME_WIDTH - this.right.displayWidth, amount)
        };
    }

    setClosedAmount(amount) {
        const to = this.xAt(amount);

        this.left.x = to.left;
        this.right.x = to.right;
    }

    /**
     * Slide both halves in until they meet.
     * @param {Function} [onClosed] called once the curtain is shut
     */
    close(onClosed) {
        this.tweenTo(1, CONFIG.anim.curtainMs, onClosed);
    }

    /**
     * Draw the halves back off each side. Slower than closing, because this
     * is the reveal: the act is already built and waiting behind it.
     * @param {Function} [onOpened] called once the stage is clear
     */
    open(onOpened) {
        this.tweenTo(0, CONFIG.anim.curtainOpenMs, onOpened);
    }

    /**
     * Move both halves to `amount` over `duration`. One tween each, and
     * only the second one reports back, so the callback fires once.
     */
    tweenTo(amount, duration, onDone) {
        const ease = CONFIG.anim.easeSweep;
        const to = this.xAt(amount);

        this.scene.tweens.add({ targets: this.left, x: to.left, duration, ease });
        this.scene.tweens.add({
            targets: this.right,
            x: to.right,
            duration,
            ease,
            onComplete: () => onDone?.()
        });
    }

    destroy() {
        this.scene.tweens.killTweensOf([this.left, this.right]);
        this.left.destroy();
        this.right.destroy();
    }
}
