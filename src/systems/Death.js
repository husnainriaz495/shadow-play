import { CONFIG } from '../config.js';
import { SCENES } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { leaveTo } from '../core/transition.js';
import { Curtain } from '../ui/Curtain.js';
import { MenuPage } from '../ui/MenuPage.js';
import { SaveProgress } from './SaveProgress.js';

/**
 * Every way the show can stop, handled the same way (PRD 4.3, 4.7, 5.1).
 *
 * WHY one system: falling through a burnt hole used to half-close the
 * curtain and silently restart, while running out of wax got a proper
 * screen. Two deaths, two completely different answers, and the quiet
 * one read as a bug. Now whatever killed you, the curtain comes all the
 * way across and the same card says what happened and what to do.
 *
 * The REASON is the only thing that differs: it is a line of text, not a
 * different flow.
 */
export class Death {
    /**
     * @param {Phaser.Scene} scene GameScene
     * @param {import('../core/Listeners.js').Listeners} listeners the scene's
     * @param {import('../objects/Player.js').Player} player
     * @param {import('../objects/PuppetRig.js').PuppetRig} rig
     * @param {number} actNumber which act to retry
     */
    constructor(scene, listeners, player, rig, actNumber) {
        this.scene = scene;
        this.player = player;
        this.rig = rig;
        this.actNumber = actNumber;
        this.over = false;

        // The candle says what emptied it (it is the thing subtracting
        // the wax, and it knows before anyone else does).
        listeners
            .on(EVENTS.WAX_OUT, ({ cause } = {}) => this.stop(cause ?? 'wax'), this)
            .on(EVENTS.PLAYER_DIED, () => this.stop('fell'), this);
    }

    /**
     * The act is over. The puppet goes limp on its rods, and a moment
     * later the curtain comes fully across (PRD 4.2.1 "candle out").
     */
    stop(reason) {
        if (this.over) return;
        this.over = true;

        this.player.controls.enabled = false;
        this.rig.poser.goLimp();
        EventBus.emit(EVENTS.HIDE_IN_LEVEL_UI);

        this.scene.time.delayedCall(CONFIG.candleOut.limpMs, () => {
            new Curtain(this.scene).close(() => this.showPanel(reason));
        });

        // R is the fast way out and works the moment the act stops, with
        // no waiting for the curtain (PRD 4.8 "fast restart").
        CONFIG.controls.restart.forEach((key) => {
            this.scene.input.keyboard.once(`keydown-${key}`, () => this.retry());
        });
    }

    /** The same card every time; only the reason line differs. */
    showPanel(reason) {
        this.page = new MenuPage(this.scene, {
            heading: CONFIG.death.heading,
            note: CONFIG.death.reasons[reason] ?? CONFIG.death.reasons.wax,
            width: CONFIG.death.width,
            y: CONFIG.death.y,
            items: [
                { label: 'RETRY ACT', onSelect: () => this.retry() },
                { label: 'ACT SELECT', onSelect: () => this.toMenu('actSelect') },
                { label: 'MAIN MENU', onSelect: () => this.toMenu() }
            ],
            onBack: () => this.retry()
        });

        this.page.panel.container.setDepth(CONFIG.death.depth);
        this.page.open();
    }

    retry() {
        if (this.leaving) return;
        this.leaving = true;

        this.scene.scene.restart({
            act: this.actNumber,
            reason: 'retried after the curtain fell',
            restarts: this.scene.restarts + 1,
            checkpoint: this.scene.checkpoint
        });
    }

    /** Back to the front of house, optionally straight into act select. */
    toMenu(page = null) {
        if (this.leaving) return;
        this.leaving = true;

        SaveProgress.unlockAct(this.actNumber);   // you reached it, so it is open
        this.scene.scene.stop(SCENES.UI);
        leaveTo(this.scene, SCENES.TITLE, { page });
    }
}
