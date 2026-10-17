import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SCENES } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { Curtain } from '../ui/Curtain.js';
import { leaveTo } from '../core/transition.js';
import { SaveProgress } from './SaveProgress.js';
import { DevActKeys } from './DevActKeys.js';
import { ACT_COUNT } from '../levels/index.js';

/**
 * How an act starts again, pauses, and hands over to the next one:
 * R restarts, Esc / P pauses (and so does leaving the tab or window), the
 * exit door moves on to the next act or the ending, and N / B skip acts
 * while DEBUG is on.
 *
 * WHY it is separate from GameScene: GameScene BUILDS the act (stage,
 * puppet, systems); this MOVES between acts. Split out when GameScene grew
 * past CODE_RULES' ~200 lines. GameScene creates it and owns it; it only
 * ever acts on its own scene.
 */
export class ActFlow {
    constructor(scene, actNumber, listeners) {
        this.scene = scene;
        this.actNumber = actNumber;
        this.restarting = false;
        this.leavingAct = false;

        this.bindKeys();
        listeners.on(EVENTS.ACT_COMPLETE, this.onActComplete, this);
    }

    /**
     * Start this act again from the top (R, or falling through a hole),
     * with the "curtain flick" (PRD 5.1): the halves sweep 40% of the way
     * in, the act is rebuilt while they hide the middle of the stage, and
     * the new act finishes drawing them back (GameScene.finishFlick).
     * Under half a second end to end, so a retry never feels slow.
     */
    restart() {
        if (this.restarting || this.leavingAct) return;   // R held, or already leaving
        this.restarting = true;

        EventBus.emit(EVENTS.HIDE_IN_LEVEL_UI);

        new Curtain(this.scene).tweenTo(
            CONFIG.anim.flickAmount,
            CONFIG.anim.quickRestartMs / 2,
            () => {
                EventBus.emit(EVENTS.ACT_RESTARTED, { act: this.actNumber });
                this.scene.scene.restart({
                    act: this.actNumber,
                    flick: true,
                    reason: 'restarted (R or a fall)',
                    restarts: this.scene.restarts + 1,
                    checkpoint: this.scene.checkpoint
                });
            }
        );
    }

    /**
     * Keys come from CONFIG.controls, so remapping them touches no code.
     * Leaving the tab or window pauses too (PRD M1), so an alt-tab never
     * costs wax. Those are GAME-wide events that outlive the scene, so they
     * are removed by hand on shutdown, or a restart would stack duplicates.
     */
    bindKeys() {
        const { scene } = this;
        const keyboard = scene.input.keyboard;

        CONFIG.controls.restart.forEach((key) => keyboard.on(`keydown-${key}`, () => this.restart()));
        CONFIG.controls.pause.forEach((key) => keyboard.on(`keydown-${key}`, () => this.openPause()));

        const pauseOnLeave = () => this.openPause();
        scene.game.events.on(Phaser.Core.Events.BLUR, pauseOnLeave);
        scene.game.events.on(Phaser.Core.Events.HIDDEN, pauseOnLeave);
        scene.events.once('shutdown', () => {
            scene.game.events.off(Phaser.Core.Events.BLUR, pauseOnLeave);
            scene.game.events.off(Phaser.Core.Events.HIDDEN, pauseOnLeave);
        });

        // N / B skip acts, only while CONFIG.DEBUG is on (trailer takes).
        new DevActKeys(scene, this.actNumber, (act) => this.goToAct(act));
    }

    /** Freeze the act and lay the pause menu over it. */
    openPause() {
        if (!this.scene.scene.isActive()) return;   // already paused, or leaving

        this.scene.scene.launch(SCENES.PAUSE, { act: this.actNumber });
        this.scene.scene.pause();
    }

    /** The door was reached: unlock the next act and move on. */
    onActComplete() {
        // The last act's door is the end of the show.
        if (this.actNumber >= ACT_COUNT) SaveProgress.markCompleted();

        SaveProgress.unlockAct(this.actNumber + 1);
        this.goToAct(this.actNumber + 1, `through the door of act ${this.actNumber}`,
            this.scene.stats);
    }

    /**
     * Leave for the next act's card, or the ending after the last one.
     *
     * The curtain CLOSES over the act just finished first (PRD 5.1 "the
     * curtain closes -> the act card"), so one act ends before the next is
     * announced, rather than cutting straight to a card.
     *
     * @param {number} act the act to go to; past the last one is the ending
     * @param {string} reason for the dev log in GameScene (CONFIG.DEBUG)
     * @param {object|null} results how the act just finished went, for the
     *        results card. Null when an act was skipped rather than played.
     */
    goToAct(act, reason = 'act skipped', results = null) {
        if (this.leavingAct) return;   // the door fires on several frames
        this.leavingAct = true;

        // Nothing the player presses during the close should count, and
        // nothing belonging to the level stays on the closing curtain.
        this.scene.player.controls.enabled = false;
        EventBus.emit(EVENTS.HIDE_IN_LEVEL_UI);

        const next = act <= ACT_COUNT ? SCENES.ACT_CARD : SCENES.END;

        new Curtain(this.scene).close(() => {
            this.scene.scene.stop(SCENES.UI);
            leaveTo(this.scene, next, { act, reason, results, curtainClosed: true });
        });
    }
}
