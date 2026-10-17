import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { JointSpring } from '../systems/JointSpring.js';
import { Lantern } from './Lantern.js';
import { clamp } from '../core/helpers.js';

/**
 * A shadow moth (map symbol `m`): it drifts toward the puppet, and touching
 * it costs wax -- unless the puppet is HUGE, which swats it (PRD 4.4).
 *
 * That is the act's whole decision, and the game's themes meeting in one
 * creature: going Huge is the only way to deal with a moth, and Huge burns
 * the candle twice as fast. Every moth you swat costs you time.
 *
 * The two-frame flap on its own looks stiff, so the flight is procedural
 * on top of it (PRD 6.4, numbers in CONFIG.moth): it flaps harder when it
 * climbs, bobs upward on each wing-beat, squashes as the wings come down,
 * banks into its turns on a spring, and jitters so no two moths move
 * alike. Near the candle it flaps faster, shakes more and catches embers.
 */
export class Moth extends Phaser.Physics.Arcade.Sprite {
    /** @param {number} x, y the CENTRE of the map tile marked `m` */
    constructor(scene, x, y) {
        super(scene, x, y, 'moth');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(DEPTHS.ENEMIES);
        this.body.setAllowGravity(false);   // it flies, until it is swatted
        this.body.setSize(CONFIG.moth.bodyWidth, CONFIG.moth.bodyHeight);

        this.player = null;
        this.swatted = false;

        /** Where it drifts back to when the puppet is far away. */
        this.home = { x, y };

        /** Banking: the same damped spring the puppet's joints use. */
        this.bank = new JointSpring(CONFIG.moth.bankStiffness, CONFIG.moth.bankDamping,
            -CONFIG.moth.bankMaxDeg, CONFIG.moth.bankMaxDeg);

        /** Wing-beat clock, in frames; its whole part picks the frame. */
        this.flapClock = Math.random() * 2;   // so a pair never beats in step
        this.wingsDown = false;

        /** Flutter: eased toward a new random nudge every so often. */
        this.jitter = { x: 0, y: 0 };
        this.jitterTarget = { x: 0, y: 0 };
        this.nextJitterAt = 0;
    }

    /** Called once every object exists (ObjectSpawner). */
    link({ player, objects }) {
        this.player = player;

        /** Lanterns it could be drawn to, lit or not (objects/Lantern.js). */
        this.lanterns = objects.filter((object) => object.isLantern);
    }


    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const seconds = delta / 1000;

        if (this.swatted) {
            // Spinning down to the floor; nothing steers it any more.
            this.angle += CONFIG.moth.swatSpinPerSecond * seconds;
            return;
        }

        const nearness = this.flameNearness();

        this.steer(seconds, time, nearness);
        this.flap(seconds, nearness, time);
        this.leanIntoTheTurn(seconds);
    }

    /**
     * 0 far from the candle, 1 right at it. The candle is wherever the
     * light is, which PaperScreen already tracks for its glow -- so this
     * follows the flame itself rather than guessing from the puppet.
     */
    flameNearness() {
        const glow = this.scene.paperScreen?.glow;
        if (!glow) return 0;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, glow.x, glow.y);

        return 1 - clamp(distance / CONFIG.moth.flameRadius, 0, 1);
    }

    /**
     * Drift toward the puppet, with a slow vertical wobble over the top
     * (PRD 6.4: "simple steering toward the player, sin(time) wobble").
     * With nobody near it returns to the spot it was drawn on, so an act
     * never ends up with every moth bunched in one corner.
     */
    steer(seconds, time, nearness) {
        const m = CONFIG.moth;
        const chasing = this.player
            && Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y) < m.noticeRadius;

        // A lit lantern beats the puppet, every time: that is what makes
        // it worth lighting.
        this.lure = Lantern.lureNear(this.lanterns, this.x, this.y, m.lureRadius);
        const goal = this.lure ?? (chasing ? this.player : this.home);

        const toGoal = new Phaser.Math.Vector2(goal.x - this.x, goal.y - this.y);
        if (toGoal.length() > 1) toGoal.normalize();

        const body = this.body;

        body.velocity.x += toGoal.x * m.accel * seconds;
        body.velocity.y += toGoal.y * m.accel * seconds;

        // The wobble that makes it read as a moth and not a wasp.
        body.velocity.y += Math.sin(time / m.wobbleMs * Math.PI * 2) * m.wobble * seconds;

        this.flutter(seconds, time, nearness);

        // Never faster than CONFIG.moth.maxSpeed, however long it accelerates.
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        if (speed > m.maxSpeed) {
            body.velocity.scale(m.maxSpeed / speed);
        }
    }

    /**
     * Small random nudges, re-aimed every 120-200 ms and eased toward, so
     * two moths on the same screen never move identically. The shake grows
     * near the flame (PRD 6.4 "drawn to the flame").
     */
    flutter(seconds, time, nearness) {
        const m = CONFIG.moth;

        if (time >= this.nextJitterAt) {
            const reach = m.jitter * (1 + nearness * m.flameJitterBoost);

            this.jitterTarget.x = Phaser.Math.FloatBetween(-reach, reach);
            this.jitterTarget.y = Phaser.Math.FloatBetween(-reach, reach);
            this.nextJitterAt = time + Phaser.Math.Between(m.jitterEveryMinMs, m.jitterEveryMaxMs);
        }

        // Ease toward the nudge rather than snapping to it, or it reads as
        // a twitch instead of a flutter.
        this.jitter.x += (this.jitterTarget.x - this.jitter.x) * m.jitterEase;
        this.jitter.y += (this.jitterTarget.y - this.jitter.y) * m.jitterEase;

        this.body.velocity.x += this.jitter.x * seconds * m.jitterPush;
        this.body.velocity.y += this.jitter.y * seconds * m.jitterPush;
    }

    /**
     * Wing-beats. The rate follows EFFORT -- fast while climbing, slow
     * while gliding down -- and each downbeat both lifts the moth a little
     * and squashes it, so the bob and the wings are the same motion
     * (PRD 6.4).
     */
    flap(seconds, nearness, time) {
        const m = CONFIG.moth;
        const climbing = this.body.velocity.y < 0;
        const fps = (climbing ? m.flapFpsClimb : m.flapFpsGlide) * (1 + nearness * m.flameFlapBoost);

        this.flapClock += seconds * fps;

        const down = Math.floor(this.flapClock) % 2 === 0;

        if (down !== this.wingsDown) {
            this.wingsDown = down;
            this.setFrame(down ? 0 : 1);
            // Squash on the downbeat, back to normal on the upbeat.
            this.setScale(down ? m.flapSquashX : 1, down ? m.flapSquashY : 1);
            if (down) this.body.velocity.y -= m.flapLift;
        }

        // Close to the flame it starts shedding embers.
        if (nearness > m.sparkNearness && time >= (this.nextSparkAt ?? 0)) {
            this.nextSparkAt = time + m.spark.everyMs;
            this.scene.mothEffects?.spark(this.x, this.y);
        }
    }

    /** Rotation eases toward where it is actually going, so turns bank. */
    leanIntoTheTurn(seconds) {
        const m = CONFIG.moth;

        this.bank.setTarget(this.body.velocity.x * m.bankPerSpeed);
        this.bank.update(seconds);
        this.setAngle(this.bank.angle);

        // Face the way it is heading, without flipping on every tiny drift.
        if (Math.abs(this.body.velocity.x) > m.facingThreshold) {
            this.setFlipX(this.body.velocity.x < 0);
        }
    }

    /**
     * The puppet touched it. Huge swats it; any smaller size takes the
     * hit. HurtState decides whether the hit actually counts (it ignores
     * one while the puppet is still blinking from the last).
     */
    onPlayerTouch(player) {
        if (this.swatted) return;

        if (player.state.canSwatMoths) this.swat();
        else player.hurt(CONFIG.moth.waxCost, this.x, 'moth');
    }

    /** Swatted: spin, fall, and come apart into paper (PRD 5.1, 6.4). */
    swat() {
        this.swatted = true;
        this.body.setAllowGravity(true);
        this.body.velocity.y = -CONFIG.moth.swatUp;
        this.body.velocity.x *= CONFIG.moth.swatKeepX;

        this.scene.mothEffects?.burst(this.x, this.y);
        EventBus.emit(EVENTS.MOTH_SWATTED, { x: this.x, y: this.y });

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: CONFIG.moth.swatFadeMs,
            ease: CONFIG.anim.easeOut,
            onComplete: () => this.disableBody(true, true)
        });
    }
}
