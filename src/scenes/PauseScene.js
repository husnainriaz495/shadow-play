import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';
import { AudioManager } from '../systems/AudioManager.js';
import { PaperPanel } from '../ui/PaperPanel.js';
import { MenuList } from '../ui/MenuList.js';

/** The pause card's size. */
const PANEL = { width: 480, height: 380, titleY: -130, menuTop: -40 };

/**
 * The pause menu, drawn over the frozen act (PRD 4.7).
 *
 * WHY its own scene: Phaser can pause a whole scene -- physics, timers,
 * tweens and input all stop together -- and run another on top. So
 * GameScene is simply paused while this is open, and nothing in the act
 * can move, drain wax or take damage behind the menu.
 *
 * M1 items: Resume, Restart act, Sound on/off, Back to title. Act select,
 * Settings and "Reduce motion & flicker" join it in M5.
 */
export class PauseScene extends Phaser.Scene {
    constructor() {
        super(SCENES.PAUSE);
    }

    /** The act being played, so "Restart act" knows which one. */
    init(data) {
        this.actNumber = data?.act ?? 1;
        this.leaving = false;
    }

    create() {
        fitCamera(this);

        // The act behind dims (PRD 5.1: "the game dims to 60%").
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, CONFIG.palette.frame)
            .setOrigin(0, 0)
            .setAlpha(CONFIG.ui.pauseDim);

        this.panel = new PaperPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, PANEL.width, PANEL.height);
        this.panel.add(this.add.text(0, PANEL.titleY, 'PAUSED', CONFIG.text.heading).setOrigin(0.5));

        this.menu = new MenuList(this, this.panel, PANEL.menuTop, [
            { label: 'RESUME', onSelect: () => this.resume() },
            { label: 'RESTART ACT', onSelect: () => this.restartAct() },
            { label: () => `SOUND: ${AudioManager.isMuted(this.game) ? 'OFF' : 'ON'}`, onSelect: () => this.toggleSound() },
            { label: 'BACK TO TITLE', onSelect: () => this.backToTitle() }
        ]);

        this.panel.open();

        // The same keys that opened the menu close it again.
        CONFIG.controls.pause.forEach((key) => {
            this.input.keyboard.on(`keydown-${key}`, () => this.resume());
        });
    }

    /** Fold the card away, then let the act carry on exactly where it was. */
    resume() {
        if (this.leaving) return;
        this.leaving = true;

        this.panel.close(() => {
            this.scene.resume(SCENES.GAME);
            this.scene.stop();
        });
    }

    /** Starting a paused scene restarts it from scratch, and closes this one. */
    restartAct() {
        if (this.leaving) return;
        this.leaving = true;

        this.scene.start(SCENES.GAME, { act: this.actNumber });
    }

    toggleSound() {
        AudioManager.toggleMute(this.game);
        this.menu.refresh();
    }

    backToTitle() {
        if (this.leaving) return;
        this.leaving = true;

        this.scene.stop(SCENES.UI);
        this.scene.stop(SCENES.GAME);
        this.scene.start(SCENES.TITLE);
    }
}
