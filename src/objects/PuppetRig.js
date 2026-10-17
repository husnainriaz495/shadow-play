import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, GAME_HEIGHT } from '../core/constants.js';
import { PuppetPoser } from '../systems/PuppetPoser.js';
import { RigDebugDots } from './RigDebugDots.js';

/** Limb pivots sit near the TOP of the image, where the joint is drawn. */
const JOINT_ORIGIN_Y = 0.06;

/**
 * The puppet you actually see: a jointed cut-out of body, two arms and two
 * legs, hanging from rods, that follows the invisible player body around.
 *
 * WHY it is visual ONLY (PRD 4.2.1): limbs never collide and never change
 * the hitbox. That separation is what lets them overshoot, wobble and
 * follow through without ever affecting where the player can go.
 *
 * Draw order, back to front: far leg, far arm, body, near leg, near arm.
 * Everything is the same black, so the order only shows at the edges.
 */
export class PuppetRig {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Decides the pose and swings the joints; this class just draws it.
        this.poser = new PuppetPoser(player);

        this.parts = this.buildParts(scene);
        this.container = scene.add.container(player.x, player.feetY, [
            this.parts.farLeg,
            this.parts.farArm,
            this.parts.body,
            this.parts.nearLeg,
            this.parts.nearArm
        ]).setDepth(DEPTHS.PLAYER);

        // The puppeteer's rods, redrawn on ONE reused Graphics every frame.
        this.rods = scene.add.graphics().setDepth(DEPTHS.PLAYER - 1);

        // Joint dots for lining the mounts up with the art (F1).
        this.debugDots = new RigDebugDots(scene, this);

        this.facing = 1;

        /** 0-1: how hard the puppet is shivering after a refused grow. */
        this.shake = 0;
    }

    /**
     * Create the five sprites. Limbs are positioned at their mount points
     * and rotate about their own joint, which is why their origin is near
     * the top of the image rather than its centre.
     */
    buildParts(scene) {
        const { mounts, footOffsetY, centreX } = CONFIG.rig;
        const bodyTop = -footOffsetY;

        // Mounts are measured in the body image; the torso's centre line
        // (centreX) is what sits over the middle of the hitbox.
        const limb = (key, mount) => scene.add.image(
            mount.x - centreX,
            bodyTop + mount.y,
            key
        ).setOrigin(0.5, JOINT_ORIGIN_Y);

        const body = scene.add.image(0, bodyTop, 'puppet_body');
        body.setOrigin(centreX / body.width, 0);

        return {
            body,
            farArm: limb('puppet_arm', mounts.shoulderLeft),
            nearArm: limb('puppet_arm', mounts.shoulderRight),
            farLeg: limb('puppet_leg', mounts.hipLeft),
            nearLeg: limb('puppet_leg', mounts.hipRight)
        };
    }

    /** Pose the puppet, then draw it where the player is. */
    update(time, delta) {
        const pose = this.poser.update(time, delta / 1000);

        this.applyAngles(pose);
        this.follow(pose, time);
        this.drawRods();
        this.debugDots.draw();
    }

    /** Push the sprung angles onto the sprites. */
    applyAngles(pose) {
        const { joints } = this.poser;

        this.parts.nearArm.setAngle(joints.nearArm.angle);
        this.parts.farArm.setAngle(joints.farArm.angle);
        this.parts.nearLeg.setAngle(joints.nearLeg.angle);
        this.parts.farLeg.setAngle(joints.farLeg.angle);

        this.parts.body.setAngle(pose.lean ?? 0);
    }

    /**
     * Sit on the player's feet and face the way they are moving.
     * Flipping the whole container mirrors every limb at once.
     *
     * Squash and stretch (jump stretches, landing squashes) is applied to
     * the WHOLE puppet from the feet, which is where the container's origin
     * is -- so a landing presses the puppet down into the floor rather than
     * shrinking the torso up towards the head. Width gives back half of
     * what height loses, so it reads as squashing, not shrinking.
     */
    follow(pose, time) {
        const velocityX = this.player.body.velocity.x;

        if (Math.abs(velocityX) > 10) {
            this.facing = Math.sign(velocityX);
        }

        const tall = pose.stretch ?? pose.squash ?? 1;
        const wide = 1 + (1 - tall) / 2;

        // A refused grow shivers the picture side to side. `shake` is eased
        // from 1 to 0 by SizeEffects; the hitbox never moves.
        const shiver = this.shake * CONFIG.player.blockedShakePx
            * Math.sin(time * CONFIG.player.blockedShakeSpeed);

        // dropPx: a limp puppet sags on its rods (candle out).
        this.container.setPosition(this.player.x + shiver, this.player.feetY + (pose.dropPx ?? 0));
        this.container.setScale(this.facing * this.displayScale * wide, this.displayScale * tall);
    }

    /**
     * How big the art is drawn: the puppet's eased size (it tweens for
     * ~200 ms after a size change) times artScale, because the PNGs are
     * drawn at twice Normal size (ASSETS.md).
     */
    get displayScale() {
        return this.player.sizeChanger.visualScale * CONFIG.rig.artScale;
    }

    /**
     * The rods: a thin line from each hand up and off the top of the screen.
     * They are what sell "this is a puppet on a screen" rather than a
     * character, and they cost one reused Graphics object.
     *
     * The TOP of each rod is fixed above its shoulder, like a puppeteer's
     * hand holding it steady, and only the bottom follows the swinging
     * hand. Drawing the rod straight up from the hand instead made the
     * whole 700 px line slide sideways with every small arm sway, which
     * reads as the rods shaking.
     */
    drawRods() {
        const { rod } = CONFIG.rig;

        this.rods.clear();
        this.rods.lineStyle(rod.width, CONFIG.palette.shadow, rod.alpha);

        [this.parts.nearArm, this.parts.farArm].forEach((armPart) => {
            const { hand, joint } = this.handPosition(armPart);

            this.rods.lineBetween(hand.x, hand.y, joint.x, -GAME_HEIGHT);
        });
    }

    /** Where an arm's shoulder and hand are, in world space, after its swing. */
    handPosition(armPart) {
        // The container's real scale, so the rods stay on the hands even
        // mid-squash. scaleX carries the facing sign; take its size only.
        const scaleX = Math.abs(this.container.scaleX);
        const scaleY = this.container.scaleY;
        const length = armPart.height * (1 - JOINT_ORIGIN_Y);
        const radians = Phaser.Math.DegToRad(armPart.angle);

        // The container's flip has to be applied by hand, because these are
        // world coordinates rather than coordinates inside the container.
        const joint = {
            x: this.container.x + armPart.x * this.facing * scaleX,
            y: this.container.y + armPart.y * scaleY
        };

        return {
            joint,
            hand: {
                // Phaser rotates (x, y) to (x*cos - y*sin, x*sin + y*cos).
                // An arm hanging straight down is (0, length), so its hand
                // lands at (-length*sin, length*cos) -- note the MINUS.
                x: joint.x - Math.sin(radians) * length * scaleX * this.facing,
                y: joint.y + Math.cos(radians) * length * scaleY
            }
        };
    }

    /** Show or hide the joint dots used to align CONFIG.rig.mounts. */
    setDebugVisible(visible) {
        this.debugDots.setVisible(visible);
    }

    destroy() {
        this.container.destroy();
        this.rods.destroy();
        this.debugDots.destroy();
    }
}
