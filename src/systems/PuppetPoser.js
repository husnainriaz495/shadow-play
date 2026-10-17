import { CONFIG } from '../config.js';
import { JointSpring } from './JointSpring.js';

/**
 * Decides which pose the puppet should be in, and swings its four joints
 * towards it on springs (PRD 4.2.1).
 *
 * WHY separate from PuppetRig: the rig DRAWS the puppet (its parts, where
 * it stands, its rods); this decides how it MOVES. Poses for push, squeeze,
 * hurt, swat, gust, death and the bow arrive with their mechanics, and all
 * of that growth lands here rather than in the drawing code.
 *
 * Every angle comes from CONFIG.rig.poses -- the team can retune a pose
 * without reading this file.
 */
export class PuppetPoser {
    constructor(player) {
        this.player = player;

        const { stiffness, damping, limits } = CONFIG.rig;
        const arm = () => new JointSpring(stiffness, damping, limits.armMin, limits.armMax);
        const leg = () => new JointSpring(stiffness, damping, limits.legMin, limits.legMax);

        this.joints = { farArm: arm(), nearArm: arm(), farLeg: leg(), nearLeg: leg() };

        /** Walk cycle position, advanced by DISTANCE so feet never slide. */
        this.phase = 0;

        /** For the land pose: when the feet left the ground, and touched down. */
        this.airborneSince = null;
        this.landedAt = -Infinity;

        /** When growing was last refused, for the squeeze pose. */
        this.squeezedAt = -Infinity;

        /** True once the candle is out (goLimp). */
        this.limp = false;
    }

    /**
     * The candle is out: the puppeteer lets go (PRD 4.2.1 "Candle out").
     * Every joint aims at hanging straight, on looser springs so the limbs
     * swing a while before they settle. There is no way back: the act
     * restarts with a brand-new poser.
     */
    goLimp() {
        this.limp = true;
        Object.values(this.joints).forEach((joint) => {
            joint.damping = CONFIG.rig.poses.limp.damping;
        });
    }

    /** Growing was refused: pull the arms in tight for a moment (PRD 4.2.1). */
    squeeze(time) {
        this.squeezedAt = time;
    }

    /**
     * Pick this frame's pose, aim the joints at it and step the springs.
     * @returns {object} the pose from CONFIG.rig.poses, for the rig to draw
     */
    update(time, seconds) {
        const pose = CONFIG.rig.poses[this.choosePose(time)];

        // Distance, not time, drives the walk cycle (PRD 4.2.1): walk slowly
        // and the legs swing slowly, at any size, so the feet never skate.
        this.phase += Math.abs(this.player.body.velocity.x) * seconds * CONFIG.rig.strideFactor;

        this.aim(pose, time);
        Object.values(this.joints).forEach((joint) => joint.update(seconds));

        return pose;
    }

    /**
     * Kick every joint after a size change, so the limbs overshoot and
     * settle on their springs over ~0.3 s (PRD 4.2.1). Near and far limbs
     * are kicked opposite ways, so it reads as a wobble, not a wave.
     *
     * @param {number} direction 1 when growing (limbs fly out), -1 shrinking
     */
    wobble(direction) {
        const kick = CONFIG.rig.sizeWobble * direction;

        this.joints.nearArm.velocity -= kick;
        this.joints.farArm.velocity += kick;
        this.joints.nearLeg.velocity += kick / 2;
        this.joints.farLeg.velocity -= kick / 2;
    }

    /** Which pose the player's situation calls for right now. */
    choosePose(time) {
        const body = this.player.body;
        const airborne = !body.blocked.down && !body.touching.down;
        const { land } = CONFIG.rig.poses;

        if (airborne && this.airborneSince === null) {
            this.airborneSince = time;
        }

        // Touching down after a real stretch in the air starts the landing.
        // The minimum air time stops the puppet "landing" when it is first
        // placed on the floor at the start of an act.
        if (!airborne && this.airborneSince !== null) {
            if (time - this.airborneSince >= land.minAirMs) {
                this.landedAt = time;
            }
            this.airborneSince = null;
        }

        if (this.limp) return 'limp';
        if (time - this.squeezedAt < CONFIG.rig.poses.squeeze.durationMs) return 'squeeze';
        if (airborne) return body.velocity.y < 0 ? 'jump' : 'fall';
        if (time - this.landedAt < land.squashMs) return 'land';
        if (this.isPushing()) return 'push';

        return Math.abs(body.velocity.x) > 10 ? 'walk' : 'idle';
    }

    /**
     * Huge, walking, and pressed against a body (a crate) on the side it is
     * walking towards. Tiles set `blocked`, bodies set `touching`, so a
     * plain wall never counts as pushing.
     */
    isPushing() {
        const { body, controls } = this.player;
        const direction = controls.direction;
        const pressing = direction > 0 ? body.touching.right : body.touching.left;

        return this.player.state.canPushCrates && direction !== 0 && pressing;
    }

    /**
     * Set each joint's target for this pose.
     *
     * Legs swing opposite each other, and each arm swings opposite the leg
     * on its own side -- which is simply how walking works.
     */
    aim(pose, time) {
        const { walk, idle } = CONFIG.rig.poses;
        const swing = Math.sin(this.phase);

        if (pose === walk || pose === CONFIG.rig.poses.push) {
            this.joints.nearLeg.setTarget(pose.legSwing * swing);
            this.joints.farLeg.setTarget(-pose.legSwing * swing);
            // Walking swings the arms; pushing holds them out in front.
            this.joints.nearArm.setTarget(pose.armSwing ? -pose.armSwing * swing : pose.arm);
            this.joints.farArm.setTarget(pose.armSwing ? pose.armSwing * swing : pose.arm);
            return;
        }

        if (pose === idle) {
            // A slow sway, so a standing puppet is never completely dead.
            const sway = Math.sin(time / pose.cycleMs * Math.PI * 2);

            this.joints.nearLeg.setTarget(pose.legSwing * sway);
            this.joints.farLeg.setTarget(-pose.legSwing * sway);
            this.joints.nearArm.setTarget(pose.arm + pose.armSwing * sway);
            this.joints.farArm.setTarget(pose.arm - pose.armSwing * sway);
            return;
        }

        // Jump, fall and land are held poses: one fixed angle each.
        this.joints.nearLeg.setTarget(pose.legNear ?? pose.leg ?? 0);
        this.joints.farLeg.setTarget(pose.legFar ?? pose.leg ?? 0);
        this.joints.nearArm.setTarget(pose.arm);
        this.joints.farArm.setTarget(pose.arm);
    }
}
