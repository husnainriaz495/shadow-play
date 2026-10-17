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
     * @param {object} [options]
     * @param {number} [options.edgeColour] border colour; panelEdge by default,
     *        palette.danger for a warning
     */
    constructor(scene, x, y, width, height, {
        edgeColour = CONFIG.palette.panelEdge,
        theatre = false,
        heading = false
    } = {}) {
        this.scene = scene;
        this.restY = y;
        this.width = width;
        this.height = height;

        const p = CONFIG.palette;
        const { panelRadius, panelEdgePx } = CONFIG.ui;

        // Two looks. `theatre` is for anything that STOPS play -- it is
        // the curtain's own wine red with a gold border, so the card
        // belongs to the theatre. The teal default stays for things drawn
        // ON the stage, which must not pull the eye (PALETTE.md).
        const fill = theatre ? p.stagePanel : p.panel;
        const alpha = theatre ? p.stagePanelAlpha : p.panelAlpha;
        const edge = theatre ? p.gold : edgeColour;

        const background = scene.add.graphics();
        background.fillStyle(fill, alpha);
        background.fillRoundedRect(-width / 2, -height / 2, width, height, panelRadius);
        background.lineStyle(panelEdgePx, edge, 1);
        background.strokeRoundedRect(-width / 2, -height / 2, width, height, panelRadius);

        if (theatre && heading !== false) PaperPanel.drawOrnament(background, heading);

        // Starts folded flat and a little crooked; open() unfolds it.
        this.container = scene.add.container(x, y, [background])
            .setScale(1, 0)
            .setAngle(CONFIG.ui.panelTiltDeg);
    }

    /**
     * The little gold rule under a heading: a line, a diamond, a line.
     * It is what makes a card read as a programme rather than a dialog
     * box, and it costs nothing but a few strokes.
     *
     * @param {Phaser.GameObjects.Graphics} g the panel's own background
     * @param {number} y where the heading sits, so the rule goes under it
     */
    static drawOrnament(g, y) {
        const o = CONFIG.ui.ornament;

        g.lineStyle(o.thickness, CONFIG.palette.gold, o.alpha);
        g.lineBetween(-o.width / 2, y, -o.gap / 2, y);
        g.lineBetween(o.gap / 2, y, o.width / 2, y);

        g.fillStyle(CONFIG.palette.gold, o.alpha);
        g.fillTriangle(0, y - o.diamond, -o.diamond, y, 0, y + o.diamond);
        g.fillTriangle(0, y - o.diamond, o.diamond, y, 0, y + o.diamond);
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
        // A panel can be reopened (stage hints): cancel a fold still in
        // progress, and start crooked again if it was fully folded.
        this.scene.tweens.killTweensOf(this.container);
        if (this.container.scaleY === 0) this.container.setAngle(CONFIG.ui.panelTiltDeg);

        this.scene.tweens.add({
            targets: this.container,
            scaleY: 1,
            angle: 0,
            alpha: 1,
            duration: CONFIG.anim.panelInMs,
            ease: CONFIG.anim.easeIn
        });
    }

    /**
     * The WARNING entrance, for danger hints: drop in from above with a
     * slight overshoot (Back.Out), a quick shake, then a gentle pulse that
     * keeps going until close(). Numbers in CONFIG.hint.danger.
     */
    dropIn() {
        const d = CONFIG.hint.danger;
        const c = this.container;

        this.scene.tweens.killTweensOf(c);
        c.setScale(1).setAngle(0).setAlpha(0).setY(this.restY - d.dropPx);

        this.scene.tweens.chain({
            targets: c,
            tweens: [
                { y: this.restY, alpha: 1, duration: d.dropMs, ease: CONFIG.anim.easeIn },
                { x: c.x + d.shakePx, duration: d.shakeMs, yoyo: true, repeat: d.shakeTimes, ease: 'Sine.InOut' },
                { scale: d.pulseScale, duration: d.pulseMs, yoyo: true, repeat: -1, ease: CONFIG.anim.easeLoop }
            ]
        });
    }

    /**
     * Fold away, faster than it opened (exits are always quicker than
     * entrances, PRD 5.1), then call onDone.
     */
    close(onDone) {
        this.scene.tweens.killTweensOf(this.container);
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
