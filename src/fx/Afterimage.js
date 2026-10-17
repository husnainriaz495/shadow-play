import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';

/**
 * The size-change afterimage (PRD 5.1 "3 fading silhouette copies at the
 * old size"): the shape the puppet was a moment ago is left hanging in
 * the air for a fraction of a second as it grows or shrinks, so the
 * change reads as a surge rather than a scale tween.
 *
 * HOW: a small pool of RenderTextures. Each one stamps a copy of the
 * puppet's container as it looks RIGHT NOW, then fades and drifts. A
 * stamp is a picture, so it keeps the old size and pose no matter what
 * the real puppet does next -- which a second sprite could not.
 *
 * The pool is built once and reused forever (CODE_RULES.md rule 9): a
 * size change may happen several times a second and must never allocate.
 */
export class Afterimage {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        const { count, width, height } = CONFIG.afterimage;

        this.scene = scene;
        this.copies = [];

        for (let i = 0; i < count; i++) {
            // Origin at bottom-centre, the same place a puppet container's
            // own origin is (its feet), so a stamp lines up by position.
            const copy = scene.add.renderTexture(0, 0, width, height)
                .setOrigin(0.5, 1)
                .setDepth(DEPTHS.PLAYER - 1)
                .setVisible(false);

            this.copies.push(copy);
        }
    }

    /**
     * Leave the trail behind `container`, one copy every `gapMs` so they
     * fade in sequence rather than all at once.
     *
     * @param {Phaser.GameObjects.Container} container the puppet rig
     */
    trail(container) {
        const { gapMs } = CONFIG.afterimage;

        this.copies.forEach((copy, index) => {
            if (index === 0) this.stamp(copy, container);
            else this.scene.time.delayedCall(gapMs * index, () => this.stamp(copy, container));
        });
    }

    /** Take one picture of the puppet where it stands, and fade it out. */
    stamp(copy, container) {
        const { width, height, startAlpha, fadeMs, risePx } = CONFIG.afterimage;

        this.scene.tweens.killTweensOf(copy);

        copy.clear();
        copy.setPosition(container.x, container.y).setVisible(true).setAlpha(startAlpha);
        // Draw the container with ITS origin (the feet) at the bottom
        // centre of the texture, so the stamp stands where the puppet does.
        copy.draw(container, width / 2, height);

        this.scene.tweens.add({
            targets: copy,
            alpha: 0,
            y: container.y - risePx,
            duration: fadeMs,
            ease: CONFIG.anim.easeOut,
            onComplete: () => copy.setVisible(false)
        });
    }
}
