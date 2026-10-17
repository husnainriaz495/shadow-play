import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';

/**
 * The landing puff (PRD 5.1 "Landing: small dust puff... light camera
 * nudge only from high falls"): dust kicked sideways from under the
 * puppet's feet when it comes down, and a short camera nudge if the drop
 * was a long one.
 *
 * WHY the camera only sometimes moves: nudging it on every hop would make
 * a walk seasick. `CONFIG.land.nudgeSpeed` is the falling speed a landing
 * has to beat before the camera notices -- a jump off a one-tile step
 * never does, a drop from the top of Act 2's block does.
 *
 * ONE emitter, made once and reused for every landing (CODE_RULES rule 9).
 * How many motes and how fast they fly scales with the puppet's size, so
 * a Huge landing throws up more than a Tiny one.
 */
export class DustPuff {
    /**
     * @param {Phaser.Scene} scene
     * @param {import('../objects/Player.js').Player} player
     */
    constructor(scene, player) {
        const { speedX, speedY, lifeMs, maxMotes } = CONFIG.land;

        this.scene = scene;
        this.player = player;

        /** Falling speed last frame: the body's own is 0 again by landing. */
        this.fallingAt = 0;

        this.motes = scene.add.particles(0, 0, 'dust', {
            emitting: false,
            speedX: { min: -speedX, max: speedX },
            speedY: { min: -speedY, max: -speedY / 3 },
            lifespan: lifeMs,
            scale: { start: 1, end: 0.2 },
            alpha: { start: 0.7, end: 0 },
            gravityY: CONFIG.land.gravityY,
            maxParticles: maxMotes
        }).setDepth(DEPTHS.PARTICLES);
    }

    /**
     * Watch for the moment the feet touch down. Called every frame by the
     * scene: the player's own fall speed is already back to 0 by then, so
     * the speed from the PREVIOUS frame is what says how hard it landed.
     */
    update() {
        const body = this.player.body;
        const onGround = body.blocked.down || body.touching.down;

        if (onGround && this.fallingAt > CONFIG.land.minFallSpeed) {
            this.land(this.fallingAt);
        }

        this.fallingAt = onGround ? 0 : Math.max(0, body.velocity.y);
    }

    /** @param {number} fallSpeed how fast it was dropping, px/s */
    land(fallSpeed) {
        const { motes, nudgeSpeed, nudgeMs } = CONFIG.land;
        const size = this.player.state.scale;

        this.motes.emitParticleAt(this.player.x, this.player.feetY, Math.round(motes * size));

        // Only a real drop moves the camera -- and not at all when the
        // player has asked for less motion (PRD 5.1).
        if (fallSpeed > nudgeSpeed && !this.scene.reduceMotion) {
            this.scene.cameras.main.shake(nudgeMs, CONFIG.anim.shake.land);
        }
    }
}
