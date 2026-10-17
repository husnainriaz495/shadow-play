import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * What happens to the puppet's BODY when something hurts it: a knock back
 * away from the danger, a moment where the controls cannot cancel that
 * push, and a short invulnerability so one touch costs wax once, not every
 * frame (PRD 4.4, 4.8 "hit feedback").
 *
 * It announces PLAYER_HURT; the Candle takes the wax, HitFeedback does the
 * flash, blink and shake, SoundCues plays the sizzle. None of them need to
 * know what caused it.
 *
 * Separate from Player so Player stays about moving (CODE_RULES 2).
 */
export class HurtState {
    constructor(player) {
        this.player = player;
        this.invulnerableUntil = -Infinity;
        this.stunnedUntil = -Infinity;
    }

    get now() {
        return this.player.scene.time.now;
    }

    /** Still blinking from the last hit: hazards cannot hurt it. */
    get invulnerable() {
        return this.now < this.invulnerableUntil;
    }

    /** Being knocked back: input must not cancel the push. */
    get stunned() {
        return this.now < this.stunnedUntil;
    }

    /**
     * @param {number} amount wax lost
     * @param {number} fromX the danger's x; the push goes the other way
     * @param {string} source e.g. 'fire', for whoever listens
     * @returns {boolean} false if it was ignored (still invulnerable)
     */
    hurt(amount, fromX, source) {
        if (this.invulnerable) return false;

        const { invulnerableMs, knockbackMs } = CONFIG.player;
        const body = this.player.body;

        // Away from the danger. Dead centre on it: forwards, the way the
        // finale's fire chases you.
        const away = Math.sign(this.player.x - fromX) || 1;

        body.velocity.x = away * CONFIG.wax.knockback;
        body.velocity.y = -CONFIG.wax.knockbackUp;

        this.invulnerableUntil = this.now + invulnerableMs;
        this.stunnedUntil = this.now + knockbackMs;

        EventBus.emit(EVENTS.PLAYER_HURT, { amount, source, invulnerableMs });
        return true;
    }
}
