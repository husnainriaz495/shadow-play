import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * The puppeteer's last candle: the wax timer (PRD 4.3).
 *
 * Wax melts every second at CONFIG.wax.baseDrain times the current size's
 * waxMultiplier, so being Huge literally costs time. Wax drops add to it.
 *
 * This system only does the arithmetic and ANNOUNCES the result
 * (CODE_RULES 6.2): the HUD candle listens for WAX_CHANGED, and the curtain
 * and restart listen for WAX_OUT. The one thing it drives directly is the
 * stage light, which dims as the wax runs low (PRD 4.3, 5).
 *
 * It lives in GameScene, so pausing the scene stops the melting too.
 */
export class Candle {
    /**
     * @param {import('../core/Listeners.js').Listeners} listeners the scene's
     * @param {import('../objects/Player.js').Player} player whose size sets the drain
     * @param {import('../objects/PaperScreen.js').PaperScreen} paperScreen the light to dim
     */
    constructor(listeners, player, paperScreen) {
        this.player = player;
        this.paperScreen = paperScreen;

        this.wax = CONFIG.wax.start;
        this.isLow = false;
        this.isOut = false;

        listeners.on(EVENTS.WAX_PICKED_UP, ({ amount }) => this.add(amount), this);
    }

    /** Melt the wax for this frame. Called by GameScene.update. */
    update(delta) {
        if (this.isOut) return;

        const perSecond = CONFIG.wax.baseDrain * this.player.state.waxMultiplier;

        this.wax -= perSecond * (delta / 1000);
        this.announce();
    }

    /**
     * Add wax (a pickup). Capped at a full candle: a drop picked up at 95
     * gives 5, not 20 (NOTES.md open question 9).
     */
    add(amount) {
        if (this.isOut) return;

        this.wax = Math.min(CONFIG.wax.max, this.wax + amount);
        this.announce();
    }

    /** Tell everyone the new wax, and notice the two moments that matter. */
    announce() {
        const { max, lowThreshold } = CONFIG.wax;

        this.wax = Math.max(0, this.wax);
        EventBus.emit(EVENTS.WAX_CHANGED, { wax: this.wax, max });

        // Full brightness until the warning line, then fading to dark.
        this.paperScreen.setLightLevel(this.wax / lowThreshold);

        // WAX_LOW fires once each time the wax crosses the line downwards.
        const low = this.wax < lowThreshold;
        if (low && !this.isLow) EventBus.emit(EVENTS.WAX_LOW);
        this.isLow = low;

        if (this.wax <= 0) {
            this.isOut = true;
            EventBus.emit(EVENTS.WAX_OUT);
        }
    }
}
