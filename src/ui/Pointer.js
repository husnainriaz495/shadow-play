import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';

/**
 * The puppeteer's gloved hand, pointing down at something for a moment:
 * "this is where you are going" (PRD 4.9 "arrow over the door", 5.1
 * "Pointer").
 *
 * Animation from PRD 5.1: it slides in towards the target with a slight
 * overshoot, bobs a few pixels towards it, then fades away. A soft accent
 * glow sits behind it, because a black glove over a target in the dark
 * (the exit door usually is) would otherwise be invisible.
 *
 * It removes itself when done; nothing needs to clean it up.
 */
export class Pointer {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x the target's centre
     * @param {number} y the top of the target; the fingertip stops just above
     */
    constructor(scene, x, y) {
        const p = CONFIG.pointer;
        const restY = y - p.gapPx;

        this.glow = scene.add.image(x, restY - p.glowLiftPx, 'soft_glow')
            .setTint(CONFIG.palette.accent)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTHS.HUD - 1)
            .setAlpha(0);
        this.glow.setScale((p.glowRadius * 2) / this.glow.width);

        this.hand = scene.add.image(x, restY - p.slideFromPx, 'pointer_hand')
            .setOrigin(0.5, 1)                    // the fingertip is the bottom
            .setScale(p.scale)
            .setDepth(DEPTHS.HUD)
            .setAlpha(0);

        const parts = [this.hand, this.glow];

        // In: slide down to the target with a little overshoot, fading in.
        scene.tweens.add({ targets: this.hand, y: restY, alpha: 1, duration: p.slideMs, ease: CONFIG.anim.easeIn });
        scene.tweens.add({ targets: this.glow, alpha: p.glowAlpha, duration: p.slideMs });

        // While shown: bob towards the target.
        scene.tweens.add({
            targets: parts,
            y: `+=${p.bobPx}`,
            delay: p.slideMs,
            duration: p.bobMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });

        // Out: fade, faster than it came in (PRD 5.1), then tidy up.
        scene.time.delayedCall(p.showMs, () => {
            scene.tweens.add({
                targets: parts,
                alpha: 0,
                duration: p.fadeMs,
                ease: CONFIG.anim.easeOut,
                onComplete: () => parts.forEach((part) => part.destroy())
            });
        });
    }
}
