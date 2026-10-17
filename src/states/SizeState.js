import { CONFIG } from '../config.js';

/**
 * What every player size has in common (State pattern, CODE_RULES.md 6.4).
 *
 * WHY: without this, Player would be full of `if (sizeIndex === 2)` checks
 * scattered over movement, crates, moths and switches. Instead Player holds
 * ONE state object and asks it questions: `this.state.canPushCrates`.
 * Adding a fourth size later means adding a file, not editing Player.
 *
 * Every number comes from CONFIG.player.sizes[index] -- a state holds no
 * numbers of its own (CODE_RULES.md rule 5).
 */
export class SizeState {
    /** @param {number} index 0 Tiny, 1 Normal, 2 Huge (see SIZE in constants) */
    constructor(index) {
        this.index = index;
        this.settings = CONFIG.player.sizes[index];
    }

    get name() { return this.settings.name; }
    get scale() { return this.settings.scale; }
    get speed() { return this.settings.speed; }
    get jump() { return this.settings.jump; }
    get waxMultiplier() { return this.settings.waxMultiplier; }
    get canPushCrates() { return this.settings.canPushCrates; }
    get canSwatMoths() { return this.settings.canSwatMoths; }
    get canPressSwitches() { return this.settings.canPressSwitches; }

    /**
     * How wide and tall the body is in this size. Used BEFORE changing size
     * to test whether the bigger shape would fit (PRD 4.2: growing must be
     * refused when there is no room).
     */
    get bodyWidth() { return CONFIG.player.bodyWidth * this.scale; }
    get bodyHeight() { return CONFIG.player.bodyHeight * this.scale; }

    /** Hooks for subclasses that need to do something on the change itself. */
    enter(_player) {}
    exit(_player) {}
}
