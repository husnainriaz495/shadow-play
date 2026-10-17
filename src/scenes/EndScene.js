import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS } from '../core/constants.js';

/**
 * After the last act: the candle burns out by itself, the puppet bows and
 * "Fin." is written on the closed curtain (PRD 4.7).
 *
 * M0 STATUS: the text and the way back to the title. The bow, the slow
 * camera zoom, the applause, the total stats and the scrolling credits are
 * milestone M5 (PRD 4.10, 5.1).
 */
export class EndScene extends Phaser.Scene {
    constructor() {
        super(SCENES.END);
    }

    create() {
        fitCamera(this);

        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, CONFIG.palette.frame)
            .setOrigin(0, 0)
            .setDepth(DEPTHS.CURTAIN);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'FIN.', CONFIG.text.title)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120,
            'Press Space to return to the stage', CONFIG.text.prompt)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start(SCENES.TITLE));
    }
}
