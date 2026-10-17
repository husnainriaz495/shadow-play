import { CONFIG } from '../config.js';
import { SIZE, SYMBOLS } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { WindEffects } from '../fx/WindEffects.js';

/**
 * The draft (map symbols `^` where it blows from, `|` for the shelters):
 * a gust sweeps the stage on a loop, and anything caught in the open is
 * flattened to Tiny, shoved to the right, and burns wax faster while the
 * flame struggles (PRD 4.4, 6.4).
 *
 * The cycle is always the same three beats, so it can be read and planned
 * around rather than dodged by luck:
 *
 *   calm (CONFIG.draft.intervalSeconds) -- a bar counts it down
 *     -> telegraph (1 s: curtains flutter, "GUST!", the first streaks)
 *     -> gust (1.5 s: held Tiny, pushed right, wax draining faster)
 *
 * WHY one wind for the whole act rather than one per `^`: a draft is
 * weather. Several `^` marks are several places the same gust comes
 * FROM -- they decide where the scraps blow from, not how many separate
 * winds there are.
 *
 * The push is the act's PUZZLE, not just its hazard: the floor has a gap
 * too wide for any jump, and a Tiny puppet that jumps into a gust is
 * carried across it (levels/act4.js).
 */
export class DraftWind {
    /**
     * @param {Phaser.Scene} scene
     * @param {import('../objects/Player.js').Player} player
     * @param {object[]} spawns the level's spawn list (for the `^` marks)
     * @param {object[]} objects every spawned object (for the shelters)
     * @param {import('./Candle.js').Candle} candle to burn faster in the open
     * @param {number} [intervalSeconds] seconds of calm between gusts. The
     *        finale overrides it (CONFIG.acts[4].draftIntervalSeconds): it
     *        borrows the gust as one interruption, not as its weather.
     */
    constructor(scene, player, spawns, objects, candle, intervalSeconds) {
        this.scene = scene;
        this.player = player;
        this.candle = candle;
        this.intervalSeconds = intervalSeconds ?? CONFIG.draft.intervalSeconds;
        this.shelters = objects.filter((object) => object.isShelter);
        this.vents = spawns.filter((spot) => spot.symbol === SYMBOLS.DRAFT);

        this.blowing = false;
        this.telegraphing = false;

        /** 0 calm, 1 full gust. Everything visual eases towards it. */
        this.strength = 0;

        this.effects = new WindEffects(scene, this.vents);

        // Deferred by a tick: GameScene builds the act BEFORE UIScene has
        // finished starting, so an event sent right now would be shouted
        // at an empty room and the countdown bar would never appear.
        scene.time.delayedCall(0, () => this.scheduleNext());
    }

    /** Calm, and the HUD's bar is told how long it has to count down. */
    scheduleNext() {
        const seconds = this.intervalSeconds;

        EventBus.emit(EVENTS.DRAFT_SCHEDULED, { seconds });
        this.timer = this.scene.time.delayedCall(seconds * 1000, () => this.telegraph());
    }

    /** One second of warning: curtains wave, "GUST!", the first streaks. */
    telegraph() {
        if (!this.alive) return;

        this.telegraphing = true;
        EventBus.emit(EVENTS.DRAFT_TELEGRAPH, { seconds: CONFIG.draft.telegraphSeconds });
        this.effects.setStreaming(true, false);
        this.effects.flutterWindows();
        this.effects.blowScraps(this.vents, CONFIG.draft.scrap.perTelegraph);

        this.timer = this.scene.time.delayedCall(
            CONFIG.draft.telegraphSeconds * 1000, () => this.gust());
    }

    /** The gust itself. */
    gust() {
        if (!this.alive) return;

        this.telegraphing = false;
        this.blowing = true;
        EventBus.emit(EVENTS.DRAFT_START, { seconds: CONFIG.draft.gustSeconds });
        this.effects.setStreaming(true, true);
        this.effects.blowScraps(this.vents, CONFIG.draft.scrap.perGust);

        this.timer = this.scene.time.delayedCall(
            CONFIG.draft.gustSeconds * 1000, () => this.calm());
    }

    calm() {
        if (!this.alive) return;

        this.blowing = false;
        this.effects.setStreaming(false);
        this.release();
        EventBus.emit(EVENTS.DRAFT_END);
        this.scheduleNext();
    }

    /** The act is still running (an R restart kills the scene mid-cycle). */
    get alive() {
        return this.scene.scene.isActive();
    }

    /** Hand the puppet and the candle back to normal. */
    release() {
        this.player.sizeChanger.heldTiny = false;
        this.player.windPush = 0;
        if (this.candle) this.candle.windFactor = 1;
    }

    /**
     * Called every frame by the scene.
     *
     * A gust only holds the puppet while it is OUT of a shelter, so
     * stepping into one mid-gust frees it and stepping out catches it
     * again -- which is what makes a shelter worth running for rather
     * than a checkbox at the start of the act.
     */
    update(delta) {
        const sheltered = this.shelters.some((shelter) => shelter.holds(this.player));

        this.easeStrength(delta, sheltered);

        // Behind a screen the air is still: the streaks stop, so a
        // sheltered player SEES that they are safe rather than being told.
        if (this.blowing) this.effects.setStreaming(!sheltered, true);

        if (!this.blowing) return;

        this.player.sizeChanger.heldTiny = !sheltered;

        if (sheltered) {
            this.release();
            return;
        }

        this.player.sizeChanger.request(SIZE.TINY);
        this.push();

        // The flame is fighting the draft, so it burns through more wax.
        if (this.candle) this.candle.windFactor = CONFIG.draft.openDrainScale;
    }

    /**
     * How hard the wind LOOKS, eased rather than switched, so the stage
     * leans into the gust and settles afterwards. A sheltered puppet sees
     * a calm stage even mid-gust (the streaks stop at the screen).
     */
    easeStrength(delta, sheltered) {
        const d = CONFIG.draft;
        const want = (this.blowing && !sheltered) ? 1 : (this.telegraphing ? d.telegraphStrength : 0);

        this.strength += (want - this.strength) * d.strengthEasePerFrame;
        this.scene.paperScreen?.setWindLean(this.strength);
        EventBus.emit(EVENTS.DRAFT_STRENGTH, { strength: this.strength });
    }

    /**
     * The shove. A Tiny shadow has nothing to hold it down and is thrown;
     * a bigger one is only leaned on. It ADDS to the puppet's own speed
     * rather than replacing it, so running into the wind still works --
     * it is just slow.
     */
    push() {
        const d = CONFIG.draft;
        const force = this.player.state.index === SIZE.TINY ? d.pushTiny : d.pushNormal;
        const body = this.player.body;
        const airborne = !body.blocked.down && !body.touching.down;

        // In the air there is nothing to brace against, so the wind has
        // far more of the puppet. That is what carries it over the gap.
        const scale = airborne ? d.pushAirborneScale : 1;

        this.player.windPush = Math.min(force * scale, d.maxPushSpeed);
    }
}
