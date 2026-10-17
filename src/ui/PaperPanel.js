import { CONFIG } from '../config.js';

/**
 * The "paper scrap" every card, menu and dialogue box is drawn on
 * (PRD 5.1: "the same component is used for tutorial hints, act cards, the
 * results card, toasts and dialogue").
 *
 * WHY one component: they should all open, close and look the same. Build
 * it once here and the pause menu, the tutorial and the results card all
 * get the unfold animation and the palette for free (CODE_RULES.md rule 4).
 *
 * It only draws. Whatever goes inside (text, a menu) is added by its owner
 * with add(), and positioned relative to the panel's centre.
 */
export class PaperPanel {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x centre of the panel
     * @param {number} y centre of the panel
     * @param {number} width
     * @param {number} height
     */
    constructor(scene, x, y, width, height) {
        this.scene = scene;

        const { panel, panelAlpha, panelEdge } = CONFIG.palette;
        const { panelRadius, panelEdgePx } = CONFIG.ui;

        const background = scene.add.graphics();
        background.fillStyle(panel, panelAlpha);
        background.fillRoundedRect(-width / 2, -height / 2, width, height, panelRadius);
        background.lineStyle(panelEdgePx, panelEdge, 1);
        background.strokeRoundedRect(-width / 2, -height / 2, width, height, panelRadius);

        // Starts folded flat and a little crooked; open() unfolds it.
        this.container = scene.add.container(x, y, [background])
            .setScale(1, 0)
            .setAngle(CONFIG.ui.panelTiltDeg);
    }

    /** Put something inside the panel; (0, 0) is the panel's centre. */
    add(child) {
        this.container.add(child);
        return this;
    }

    /**
     * Unfold: grow from flat with a slight overshoot and settle straight
     * (PRD 5.1: scaleY 0 -> 1, Back.Out, ~300 ms, tilting and settling).
     */
    open() {
        this.scene.tweens.add({
            targets: this.container,
            scaleY: 1,
            angle: 0,
            duration: CONFIG.anim.panelInMs,
            ease: CONFIG.anim.easeIn
        });
    }

    /**
     * Fold away, faster than it opened (exits are always quicker than
     * entrances, PRD 5.1), then call onDone.
     */
    close(onDone) {
        this.scene.tweens.add({
            targets: this.container,
            scaleY: 0,
            alpha: 0,
            duration: CONFIG.anim.panelOutMs,
            ease: CONFIG.anim.easeOut,
            onComplete: onDone
        });
    }
}
