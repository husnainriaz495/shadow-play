import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, GAME_HEIGHT } from '../core/constants.js';

/** Limb pivots sit near the TOP of the image, as in objects/PuppetRig.js. */
const JOINT_ORIGIN_Y = 0.06;

/**
 * The puppet taking its bow at the end of the show (PRD 4.7): the same
 * five cut-outs on the same rods, tipped forward and straightened again,
 * twice, before the candle goes out.
 *
 * WHY it is not objects/PuppetRig.js: the rig follows a PHYSICS BODY --
 * its pose comes from the player's velocity, size and footing, none of
 * which exist on the ending's empty stage. Rather than invent a fake
 * player for it, this draws the same parts from the same CONFIG.rig
 * numbers. The art, mounts and rods stay in one place; only the reason to
 * move differs.
 *
 * HOW a marionette bows: it does not fold at the waist -- it is a rigid
 * cut-out, so the puppeteer tips the WHOLE figure forward on its rods.
 * That is why the container (whose origin is the puppet's feet) is what
 * rotates, and the arms only counter-swing so they still hang downwards.
 */
export class BowingPuppet {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x centre of the puppet
     * @param {number} y where its feet stand
     */
    constructor(scene, x, y) {
        const { mounts, centreX, footOffsetY } = CONFIG.rig;
        const bodyTop = -footOffsetY;

        this.scene = scene;
        this.scale = CONFIG.rig.artScale * CONFIG.ending.puppetScale;

        const limb = (key, mount) => scene.add.image(mount.x - centreX, bodyTop + mount.y, key)
            .setOrigin(0.5, JOINT_ORIGIN_Y);

        this.body = scene.add.image(0, bodyTop, 'puppet_body');
        this.body.setOrigin(centreX / this.body.width, 0);

        this.arms = [limb('puppet_arm', mounts.shoulderLeft), limb('puppet_arm', mounts.shoulderRight)];
        this.legs = [limb('puppet_leg', mounts.hipLeft), limb('puppet_leg', mounts.hipRight)];

        this.container = scene.add.container(x, y, [
            this.legs[0], this.arms[0], this.body, this.legs[1], this.arms[1]
        ]).setScale(this.scale).setDepth(DEPTHS.PLAYER);

        this.rods = scene.add.graphics().setDepth(DEPTHS.PLAYER - 1);

        // Reused by drawRods every frame; never allocated in update
        // (CODE_RULES.md rule 9).
        this.matrix = new Phaser.GameObjects.Components.TransformMatrix();
        this.jointAt = new Phaser.Math.Vector2();
        this.handAt = new Phaser.Math.Vector2();

        /** What the bow tween moves: the tip forward, and the arm swing. */
        this.lean = 0;
        this.armAngle = CONFIG.rig.poses.stand.arm;

        this.apply();
    }

    /**
     * Bow, straighten, and do it again -- `CONFIG.ending.bows` times, then
     * call onDone. A chain rather than a yoyo, so the puppet can hold the
     * bow at the bottom the way a performer does.
     *
     * @returns {Phaser.Tweens.TweenChain} so the ending can stop it when
     *          the player skips, instead of killing every tween in the scene
     */
    bow(onDone) {
        const { bowInMs, bowHoldMs, bowOutMs, bows } = CONFIG.ending;
        const { bow, stand } = CONFIG.rig.poses;

        return this.scene.tweens.chain({
            targets: this,
            loop: bows - 1,
            tweens: [
                { lean: bow.lean, armAngle: bow.arm, duration: bowInMs, ease: CONFIG.anim.easeInSoft },
                { lean: bow.lean, duration: bowHoldMs },
                { lean: 0, armAngle: stand.arm, duration: bowOutMs, ease: CONFIG.anim.easeInSoft }
            ],
            onComplete: () => onDone?.()
        });
    }

    /** Push this frame's angles onto the parts and redraw the rods. */
    apply() {
        // The whole figure tips on its rods; the arms swing the other way,
        // so they keep hanging towards the floor through the bow.
        this.container.setAngle(this.lean);
        this.arms.forEach((arm) => arm.setAngle(this.armAngle));
        this.drawRods();
    }

    /**
     * One thin rod from each hand straight up and off the top of the
     * screen, as the playing rig draws them. The hand is found through the
     * container's own transform, so the rods stay attached however far the
     * puppet is tipped.
     */
    drawRods() {
        const { rod } = CONFIG.rig;

        this.container.getWorldTransformMatrix(this.matrix);
        this.rods.clear();
        this.rods.lineStyle(rod.width, CONFIG.palette.shadow, rod.alpha);

        this.arms.forEach((arm) => {
            const length = arm.height * (1 - JOINT_ORIGIN_Y);
            const radians = Phaser.Math.DegToRad(arm.angle);

            // Phaser rotates (x, y) to (x*cos - y*sin, x*sin + y*cos): an
            // arm hanging straight down is (0, length), so its hand is at
            // (-length*sin, length*cos) -- note the MINUS.
            this.matrix.transformPoint(arm.x, arm.y, this.jointAt);
            this.matrix.transformPoint(
                arm.x - Math.sin(radians) * length,
                arm.y + Math.cos(radians) * length,
                this.handAt
            );

            this.rods.lineBetween(this.handAt.x, this.handAt.y, this.jointAt.x, -GAME_HEIGHT);
        });
    }

    /**
     * Where the candle is held: in front of the puppet's chest. Measured as
     * a fraction of its own height, so retuning `puppetScale` cannot leave
     * the light down by its knees.
     */
    get lightSource() {
        const height = CONFIG.rig.footOffsetY * this.scale;

        return { x: this.container.x, y: this.container.y - height * CONFIG.ending.lightAtHeight };
    }

    update() {
        this.apply();
    }
}
