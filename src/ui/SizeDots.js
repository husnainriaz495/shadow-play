import { CONFIG } from '../config.js';

/** How the dots are drawn. Shapes only -- no game rules here. */
const DOTS = {
    radius: 9,
    spacing: 34
};

/**
 * Three dots, bottom-right, showing Tiny / Normal / Huge and which one you
 * are now (PRD 5).
 *
 * WHY it is in ui/ : like WaxCandle it only draws. It is told the size index
 * and renders it; it never asks the player object anything.
 */
export class SizeDots {
    /**
     * @param {Phaser.Scene} scene the UI scene
     * @param {number} x centre of the middle dot
     * @param {number} y centre line of the dots
     */
    /**
     * @param {object} [options]
     * @param {boolean} [options.labelBeside] put the size's name to the LEFT
     *        of the dots instead of under them (the HUD band is short)
     */
    constructor(scene, x, y, { labelBeside = false } = {}) {
        this.x = x;
        this.y = y;

        this.graphics = scene.add.graphics();
        this.label = labelBeside
            ? scene.add.text(x - DOTS.spacing * 1.5 - DOTS.radius, y, CONFIG.player.sizes[1].name, CONFIG.text.hud).setOrigin(1, 0.5)
            : scene.add.text(x, y + 20, CONFIG.player.sizes[1].name, CONFIG.text.hud).setOrigin(0.5, 0);

        this.setSize(1);
    }

    /** @param {number} sizeIndex 0 Tiny, 1 Normal, 2 Huge */
    setSize(sizeIndex) {
        const g = this.graphics;

        g.clear();

        CONFIG.player.sizes.forEach((size, index) => {
            const active = index === sizeIndex;

            // A dot's size hints at what it means: small, medium, large.
            const radius = DOTS.radius * (0.55 + index * 0.3);
            const dotX = this.x + (index - 1) * DOTS.spacing;

            g.fillStyle(active ? CONFIG.palette.accent : CONFIG.palette.dotOff, 1);
            g.fillCircle(dotX, this.y, radius);

            // A light ring marks the active dot, readable on any background.
            if (active) {
                g.lineStyle(2, CONFIG.palette.title, 0.9);
                g.strokeCircle(dotX, this.y, radius + 5);
            }
        });

        this.label.setText(CONFIG.player.sizes[sizeIndex].name);
    }
}
