import { CONFIG } from '../config.js';
import { sliceFrames } from '../core/helpers.js';

/**
 * Draws the placeholder textures used by menus, hints and the tutorial:
 * the pointing hand and the gamepad button icons.
 *
 * WHY these are separate from PropTextures (CODE_RULES.md rule 2): they are
 * not things in the world, they are interface pieces. Keeping them apart
 * means neither file grows into a dumping ground.
 *
 * Keyboard key icons, the spotlight, paper panels and the tutorial tick are
 * always drawn in code at runtime (ASSETS.md), so they need no texture here.
 *
 * Runs ONCE in BootScene (CODE_RULES.md rule 8).
 */
export class UiTextures {
    constructor(scene) {
        this.scene = scene;
    }

    generate() {
        this.pointerHand();
        this.gamepadIcons();
        this.windIcon();
    }

    canvas() {
        return this.scene.make.graphics({ add: false });
    }

    bake(graphics, key, width, height) {
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    /**
     * The wind icon on the "GUST!" warning: three curved streaks, the way
     * weather is drawn everywhere. Code-drawn, because a 24 px icon is
     * not worth an asset file.
     */
    windIcon() {
        const { size, stroke } = CONFIG.draft.icon;
        const g = this.canvas();

        g.lineStyle(stroke, CONFIG.palette.title, 1);

        [0.28, 0.5, 0.72].forEach((row, index) => {
            const y = size * row;
            const length = size * (index === 1 ? 0.92 : 0.66);

            g.beginPath();
            g.moveTo(size * 0.04, y);
            g.lineTo(size * 0.04 + length, y);
            // A little hook on the end, so it reads as curling air.
            g.lineTo(size * 0.04 + length - stroke * 2, y - stroke * 2);
            g.strokePath();
        });

        this.bake(g, 'wind_icon', size, size);
    }

    /**
     * The pointing hand that bobs at whatever the tutorial is talking about.
     * The real art is a puppeteer's glove; the placeholder is a plain arrow
     * pointing DOWN, which is the direction the rig and tutorial expect.
     */
    pointerHand() {
        const g = this.canvas();
        g.fillStyle(CONFIG.palette.shadow, 1);

        g.fillTriangle(32, 56, 12, 24, 52, 24);  // arrow head, pointing down
        g.fillRect(25, 6, 14, 20);               // the shaft

        this.bake(g, 'pointer_hand', 64, 64);
    }

    /**
     * Gamepad buttons as a 4-frame strip: A, B, LB, RB (PRD 4.10,
     * device-aware prompts).
     *
     * The placeholder uses SHAPES rather than letters, because Graphics
     * cannot draw text into a texture: A and B are circles (filled and
     * hollow), LB and RB are shoulder-button rectangles pointing left and
     * right. The UI component adds the letter as a Phaser text object on
     * top, so the real icon sheet can drop in later unchanged.
     */
    gamepadIcons() {
        const g = this.canvas();
        const size = 64;

        // Frame 0 -- A: a solid button.
        g.fillStyle(CONFIG.palette.shadow, 1);
        g.fillCircle(32, 32, 22);

        // Frame 1 -- B: the same button, hollow, so the two read differently.
        g.lineStyle(5, CONFIG.palette.shadow, 1);
        g.strokeCircle(size + 32, 32, 22);

        // Frame 2 -- LB: a shoulder button leaning left.
        g.fillStyle(CONFIG.palette.shadow, 1);
        g.fillRoundedRect(size * 2 + 8, 22, 48, 20, 9);
        g.fillTriangle(size * 2 + 8, 32, size * 2 + 22, 14, size * 2 + 22, 50);

        // Frame 3 -- RB: the mirror of LB.
        g.fillRoundedRect(size * 3 + 8, 22, 48, 20, 9);
        g.fillTriangle(size * 3 + 56, 32, size * 3 + 42, 14, size * 3 + 42, 50);

        this.bake(g, 'gamepad_icons', size * 4, size);
        sliceFrames(this.scene, 'gamepad_icons', size, size, 4);
    }
}
