import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { Curtain } from '../ui/Curtain.js';

/**
 * Game over: what happens when the wax reaches 0 (PRD 4.3, 4.7, 5.1).
 *
 *   1. the puppet stops obeying the keys and goes limp on its rods
 *   2. a moment later the curtain closes
 *   3. "The candle went out" appears, and R restarts the act
 *
 * R already restarts the act at any time (GameScene.bindKeys), so this
 * system never restarts anything itself -- it only stages the moment.
 *
 * The polished version (flame dying, smoke wisp, ink-written text) is M5;
 * this is the working skeleton it will be built on.
 */
export class CandleOut {
    /**
     * @param {Phaser.Scene} scene
     * @param {import('../core/Listeners.js').Listeners} listeners the scene's
     * @param {import('../objects/Player.js').Player} player
     * @param {import('../objects/PuppetRig.js').PuppetRig} rig
     */
    constructor(scene, listeners, player, rig) {
        this.scene = scene;
        this.player = player;
        this.rig = rig;

        listeners.on(EVENTS.WAX_OUT, this.onWaxOut, this);
    }

    onWaxOut() {
        this.player.controls.enabled = false;
        this.rig.poser.goLimp();

        this.scene.time.delayedCall(CONFIG.candleOut.limpMs, () => {
            new Curtain(this.scene).close(() => this.showMessage());
        });
    }

    /** The words on the closed curtain, fading in. */
    showMessage() {
        const centreX = GAME_WIDTH / 2;
        const centreY = GAME_HEIGHT / 2;

        const lines = [
            this.scene.add.text(centreX, centreY - 30, 'THE CANDLE WENT OUT', CONFIG.text.heading),
            this.scene.add.text(centreX, centreY + 40, 'Press R to try again', CONFIG.text.prompt)
        ];

        lines.forEach((line) => line.setOrigin(0.5).setDepth(DEPTHS.CURTAIN + 1).setAlpha(0));

        this.scene.tweens.add({
            targets: lines,
            alpha: 1,
            duration: CONFIG.candleOut.messageFadeMs,
            ease: CONFIG.anim.easeInSoft
        });
    }
}
