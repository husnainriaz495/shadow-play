import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { leaveTo } from '../core/transition.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';
import { AudioManager } from '../systems/AudioManager.js';
import { MenuPage } from '../ui/MenuPage.js';
import { TextPage } from '../ui/TextPage.js';
import { SettingsPage } from '../ui/SettingsPage.js';

/**
 * The pause menu, drawn over the frozen act (PRD 4.7).
 *
 * WHY its own scene: Phaser can pause a whole scene -- physics, timers,
 * tweens and input all stop together -- and run another on top. So
 * GameScene is simply paused while this is open, and nothing in the act
 * can move, drain wax or take damage behind the menu.
 *
 * It swaps cards the same way the title screen does, and uses the SAME
 * settings and how-to-play pages: somebody who wants the music quieter
 * in the middle of an act should not have to quit to the menu to do it.
 */
export class PauseScene extends Phaser.Scene {
    constructor() {
        super(SCENES.PAUSE);
    }

    /** The act being played, so "Restart act" knows which one. */
    init(data) {
        this.actNumber = data?.act ?? 1;
        this.leaving = false;
        this.page = null;
        this.swapping = false;
    }

    create() {
        fitCamera(this);

        // The act behind dims (PRD 5.1: "the game dims to 60%").
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, CONFIG.palette.frame)
            .setOrigin(0, 0)
            .setAlpha(CONFIG.ui.pauseDim);

        this.showRoot();

        // The same keys that opened the menu close it again -- but only
        // from the top card, or Esc on the settings page would throw away
        // the act instead of stepping back one.
        CONFIG.controls.pause.forEach((key) => {
            this.input.keyboard.on(`keydown-${key}`, () => this.onPauseKey());
        });
    }

    onPauseKey() {
        if (this.onRoot) this.resume();
        else this.showRoot();
    }

    /** Fold the card that is up away, then open the next one. */
    goToPage(build, onRoot = false) {
        if (this.swapping) return;
        this.swapping = true;
        this.onRoot = onRoot;

        const open = () => {
            this.page = build().open();
            this.swapping = false;
        };

        if (this.page) this.page.close(open);
        else open();
    }

    showRoot() {
        this.goToPage(() => new MenuPage(this, {
            heading: 'PAUSED',
            y: GAME_HEIGHT / 2,
            items: [
                { label: 'RESUME', onSelect: () => this.resume() },
                { label: 'RESTART ACT', onSelect: () => this.restartAct() },
                {
                    label: () => `SOUND: ${AudioManager.isMuted(this.game) ? 'OFF' : 'ON'}`,
                    onSelect: () => this.toggleSound()
                },
                { label: 'SETTINGS', onSelect: () => this.showSettings() },
                { label: 'HOW TO PLAY', onSelect: () => this.showHowToPlay() },
                { label: 'BACK TO TITLE', onSelect: () => this.backToTitle() }
            ],
            onBack: () => this.resume()
        }), true);
    }

    showSettings() {
        this.goToPage(() => new SettingsPage(this, { onBack: () => this.showRoot(), y: GAME_HEIGHT / 2 }));
    }

    showHowToPlay() {
        this.goToPage(() => new TextPage(this, {
            heading: 'HOW TO PLAY',
            lines: CONFIG.title.howToPlay,
            onBack: () => this.showRoot()
        }));
    }

    /** Fold the card away, then let the act carry on exactly where it was. */
    resume() {
        if (this.leaving) return;
        this.leaving = true;

        this.page.close(() => {
            this.scene.resume(SCENES.GAME);
            this.scene.stop();
        });
    }

    /** Starting a paused scene restarts it from scratch, and closes this one. */
    restartAct() {
        if (this.leaving) return;
        this.leaving = true;

        this.scene.start(SCENES.GAME, { act: this.actNumber, reason: 'restarted from the pause menu' });
    }

    toggleSound() {
        AudioManager.toggleMute(this.game);
        this.page.refresh();
    }

    backToTitle() {
        if (this.leaving) return;
        this.leaving = true;

        this.scene.stop(SCENES.UI);
        this.scene.stop(SCENES.GAME);
        leaveTo(this, SCENES.TITLE);
    }
}
