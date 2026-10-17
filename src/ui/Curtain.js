import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH } from '../core/constants.js';

/**
 * The theatre curtain: two halves that slide in from the sides and meet in
 * the middle (PRD 5.1).
 *
 * WHY in ui/: it only draws and moves. Whoever owns it decides WHEN it
 * closes (the candle going out now; act changes and the quick-restart
 * flick in M5) and what happens once it has.
 *
 * Each half is a little wider than half the screen (ASSETS.md: 660 px), so
 * they overlap at the centre and no gap can ever show between them.
 */
export class Curtain {
    constructor(scene) {
        this.scene = scene;

        // Parked just off each side of the stage, ready to close.
        this.left = scene.add.image(0, 0, 'curtain_left').setOrigin(1, 0);
        this.right = scene.add.image(GAME_WIDTH, 0, 'curtain_right').setOrigin(0, 0);

        [this.left, this.right].forEach((half) => half.setDepth(DEPTHS.CURTAIN));
    }

    /**
     * Slide both halves in until they meet.
     * @param {Function} [onClosed] called once the curtain is shut
     */
    close(onClosed) {
        const { curtainMs } = CONFIG.anim;

        this.scene.tweens.add({
            targets: this.left,
            x: this.left.width,
            duration: curtainMs,
            ease: CONFIG.anim.easeOut
        });

        this.scene.tweens.add({
            targets: this.right,
            x: GAME_WIDTH - this.right.width,
            duration: curtainMs,
            ease: CONFIG.anim.easeOut,
            onComplete: () => onClosed?.()
        });
    }
}
