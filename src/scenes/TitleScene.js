import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS } from '../core/constants.js';
import { PaperScreen } from '../objects/PaperScreen.js';
import { SaveProgress } from '../systems/SaveProgress.js';
import { GlobalKeys } from '../systems/GlobalKeys.js';
import { AudioManager } from '../systems/AudioManager.js';

/**
 * The title screen: the lit paper, the logo and "press Space".
 *
 * WHY it reuses PaperScreen: the title is the same stage the game is played
 * on, so the look can never drift between the two (CODE_RULES.md rule 4).
 *
 * M0 keeps this deliberately plain. The match-strike opening, curtain
 * sweep, act select, settings and version label are milestone M5
 * (PRD 4.7, 4.10, 5.1).
 */
export class TitleScene extends Phaser.Scene {
    constructor() {
        super(SCENES.TITLE);
    }

    create() {
        fitCamera(this);

        this.paperScreen = new PaperScreen(this);

        // The logo is a real image once someone draws one; until then the
        // placeholder is the title set in the theatre font (ASSETS.md).
        this.add.text(GAME_WIDTH / 2, 210, 'SHADOW PLAY', CONFIG.text.title)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);

        this.add.text(GAME_WIDTH / 2, 320, 'The fire gives you shape. Time takes it away.',
            CONFIG.text.body)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);

        const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 180,
            'Press Space to begin the show', CONFIG.text.prompt)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);

        // A slow pulse, so the screen is never completely still (PRD 5.1).
        this.tweens.add({
            targets: prompt,
            alpha: { from: 0.4, to: 1 },
            duration: 800,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });

        new GlobalKeys(this);
        this.startOnSpace();

        // The theme starts here and carries on into the act (ASSETS.md).
        // Browsers hold sound until the first key press; Phaser then lets
        // it through by itself.
        AudioManager.playMusic(this, 'music_theme');
    }

    /**
     * Space (or a click) begins the show at the furthest act reached.
     * A first-time player has no saved progress, so this is Act 1.
     */
    startOnSpace() {
        const begin = () => this.scene.start(SCENES.GAME, { act: SaveProgress.getHighestAct() });

        this.input.keyboard.once('keydown-SPACE', begin);
        this.input.once('pointerdown', begin);
    }

    update(time, delta) {
        this.paperScreen.update(time, delta);
    }
}
