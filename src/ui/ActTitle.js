import { CONFIG } from '../config.js';

/**
 * The act's name at the top of the stage, on a dark plate.
 *
 * WHY the plate: the title is drawn above everything, but a pillar running
 * up behind it still showed between the letters, so it looked as if the
 * wall sliced the title in two (Act 1's centre pillar does exactly this).
 * A rounded plate in the panel colour hides whatever is behind the text,
 * in every level, whatever its walls. It hangs from the top edge like a
 * theatre sign.
 *
 * It only draws: UIScene hands it the title text.
 */
export class ActTitle {
    /**
     * @param {Phaser.Scene} scene the UI scene
     * @param {number} x centre of the title
     * @param {number} y centre of the title
     */
    constructor(scene, x, y) {
        this.x = x;
        this.y = y;

        // The plate is drawn first so the text sits on top of it.
        this.plate = scene.add.graphics();
        this.text = scene.add.text(x, y, '', CONFIG.text.heading).setOrigin(0.5);
    }

    /** Show a new title (titles are uppercase, PALETTE.md "Text"). */
    setTitle(title) {
        this.text.setText(title.toUpperCase());
        this.drawPlate();
    }

    /** Size the plate to the text, so short and long titles both fit. */
    drawPlate() {
        const { titlePadX, titlePadY, panelRadius } = CONFIG.ui;
        const width = this.text.width + titlePadX * 2;
        const height = this.text.height + titlePadY * 2;

        this.plate.clear();
        if (!this.text.text) return;

        this.plate.fillStyle(CONFIG.palette.panel, CONFIG.palette.panelAlpha);
        this.plate.fillRoundedRect(this.x - width / 2, this.y - height / 2, width, height, panelRadius);
    }
}
