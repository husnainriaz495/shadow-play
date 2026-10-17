import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * The puppeteer's last candle: the wax timer (PRD 4.3).
 *
 * Wax melts every second at CONFIG.wax.baseDrain times the current size's
 * waxMultiplier, so being Huge literally costs time. Wax drops add to it.
 * Later acts start with less and melt it faster (CONFIG.acts).
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
     * @param {number} actNumber which act's difficulty to use (CONFIG.acts)
     */
    constructor(listeners, player, paperScreen, actNumber = 1) {
        const tuning = Candle.tuningFor(actNumber);

        this.player = player;
        this.paperScreen = paperScreen;

        /** Later acts start with less wax and melt it faster (CONFIG.acts). */
        this.drainScale = tuning.drainScale;

        /**
         * Extra drain while something is fighting the flame -- a draft
         * blowing on it out in the open (systems/DraftWind.js). 1 means
         * nothing is.
         */
        this.windFactor = 1;
        this.wax = tuning.startWax;
        this.isLow = false;
        this.isOut = false;

        /** What last took wax off the candle, and when. */
        this.lastHurtSource = null;
        this.hurtAt = -Infinity;

        listeners.on(EVENTS.WAX_PICKED_UP, ({ amount }) => this.add(amount), this);

        // A hazard's cost comes straight out of the wax (PRD 4.4). The
        // candle also remembers WHAT took it, because it is the only
        // thing that can honestly say why the wax ran out -- it is the
        // one subtracting it.
        listeners.on(EVENTS.PLAYER_HURT, ({ amount, source }) => {
            this.lastHurtSource = source;
            this.hurtAt = this.player.scene.time.now;
            this.add(-amount);
        }, this);
    }

    /**
     * This act's difficulty, falling back to the last act's for anything
     * past the end of the table (a dev key, a level added without tuning).
     */
    static tuningFor(actNumber) {
        const table = CONFIG.acts;

        return table[actNumber - 1] ?? table[table.length - 1];
    }

    /** Melt the wax for this frame. Called by GameScene.update. */
    update(delta) {
        if (this.isOut) return;

        const perSecond = CONFIG.wax.baseDrain * this.drainScale * this.windFactor * this.rate;

        this.wax -= perSecond * (delta / 1000);
        this.announce();
    }

    /** How many times faster than Normal the wax is melting right now. */
    get rate() {
        return this.player.state.waxMultiplier;
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
        // `rate` lets the HUD SHOW the burn speed (PRD 4.3.1) without
        // knowing anything about sizes.
        EventBus.emit(EVENTS.WAX_CHANGED, { wax: this.wax, max, rate: this.rate });

        // Full brightness until the warning line, then fading to dark.
        this.paperScreen.setLightLevel(this.wax / lowThreshold);

        // WAX_LOW fires once each time the wax crosses the line downwards.
        const low = this.wax < lowThreshold;
        if (low && !this.isLow) EventBus.emit(EVENTS.WAX_LOW);
        this.isLow = low;

        if (this.wax <= 0) {
            this.isOut = true;

            // A hit moments ago is the real cause; otherwise it simply
            // burnt down. Whoever shows the game-over card says so.
            const recent = this.player.scene.time.now - this.hurtAt < CONFIG.death.blameMs;

            EventBus.emit(EVENTS.WAX_OUT, { cause: recent ? this.lastHurtSource : null });
        }
    }
}
