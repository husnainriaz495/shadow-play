import { clamp } from '../core/helpers.js';

/**
 * One joint that chases a target angle like it is on a spring.
 *
 * WHY springs instead of animation frames (PRD 4.2.1): a real shadow puppet
 * is wood and string, so its limbs lag behind, overshoot and settle. Asking
 * each joint to chase a target gives all of that for free, and switching
 * pose becomes "change the target" rather than "play a different clip" --
 * so poses always blend smoothly and never snap.
 *
 * Its own tiny class because the rig needs four of them and the candle
 * flame may want one later: composition, not inheritance (CODE_RULES 6.6).
 */
export class JointSpring {
    /**
     * @param {number} stiffness how hard it pulls towards the target
     * @param {number} damping   0-1; lower settles faster, higher wobbles more
     * @param {number} min       lowest angle this joint may reach, in degrees
     * @param {number} max       highest angle, in degrees
     */
    constructor(stiffness, damping, min, max) {
        this.stiffness = stiffness;
        this.damping = damping;
        this.min = min;
        this.max = max;

        this.angle = 0;
        this.target = 0;
        this.velocity = 0;
    }

    /** Point the joint at a new angle; it will swing there over a few frames. */
    setTarget(degrees) {
        this.target = clamp(degrees, this.min, this.max);
    }

    /** Drop the joint exactly on its target, with no swing (used on spawn). */
    snap(degrees) {
        this.setTarget(degrees);
        this.angle = this.target;
        this.velocity = 0;
    }

    /**
     * Advance the spring.
     *
     * @param {number} seconds delta in SECONDS, so the motion is identical
     *        at 60 Hz and 144 Hz (PRD 4.8 frame-rate independence)
     */
    update(seconds) {
        this.velocity += (this.target - this.angle) * this.stiffness * seconds;

        // Damping is "per frame at 60 Hz", so it has to be raised to the
        // number of 60 Hz frames this step covered. Multiplying by `damping`
        // once per frame would make the puppet floppier on a fast monitor.
        this.velocity *= Math.pow(this.damping, seconds * 60);

        this.angle = clamp(this.angle + this.velocity * seconds, this.min, this.max);
    }
}
