/**
 * Makes a value wander gently, like candlelight.
 *
 * WHY it is its own tiny class (CODE_RULES.md 6.6, composition over
 * inheritance): the glow on the paper, the HUD flame and later any torch all
 * need "a number that drifts around 1". Rather than a Flame base class that
 * everything inherits from, each of those simply OWNS a Flicker.
 *
 * It layers three sine waves at odd speeds. That looks random to the eye but
 * costs nothing and allocates nothing, so it is safe to call every frame
 * (CODE_RULES.md rule 9).
 */
export class Flicker {
    /**
     * @param {number} amount how far the value may stray from 1 (e.g. 0.06)
     * @param {number} speed  how fast it drifts, per millisecond
     * @param {number} seed   offset so two flickers never move in step
     */
    constructor(amount, speed, seed = 0) {
        this.amount = amount;
        this.speed = speed;
        this.seed = seed;
    }

    /** The multiplier right now: roughly 1, give or take `amount`. */
    valueAt(time) {
        const t = time * this.speed + this.seed;
        const wander = Math.sin(t) * 0.6 + Math.sin(t * 2.3) * 0.3 + Math.sin(t * 5.1) * 0.1;

        return 1 + wander * this.amount;
    }
}
