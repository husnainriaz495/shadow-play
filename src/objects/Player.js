import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { TILE_SIZE, SIZE } from '../core/constants.js';
import { createSizeState } from '../states/index.js';
import { CornerCorrection } from '../systems/CornerCorrection.js';
import { PlatformDrop } from '../systems/PlatformDrop.js';
import { PlayerInput } from '../systems/PlayerInput.js';
import { SizeChanger } from '../systems/SizeChanger.js';

/**
 * The puppet's physics body and movement.
 *
 * WHY it is INVISIBLE (PRD 4.2.1): what you see is the jointed puppet rig,
 * a container of limbs that follows this body around. Keeping the body and
 * the drawing separate means the limbs can swing, overshoot and wobble
 * without ever changing the hitbox or the collisions.
 *
 * Everything here uses `delta`, so the game plays identically at 60 Hz and
 * 144 Hz (PRD 4.8). Every number comes from CONFIG.player.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
    /** @param {Phaser.Tilemaps.TilemapLayer} layer the act's tiles */
    constructor(scene, x, y, layer) {
        // The texture is never drawn; Arcade sprites simply need one.
        super(scene, x, y, 'puppet_body');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setVisible(false);
        this.setOrigin(0.5, 1);            // measured from the feet

        this.state = createSizeState(SIZE.NORMAL);
        this.applyBodySize();

        // Q/E, 1/2/3 and the wheel switch size through this (PRD 4.2).
        this.sizeChanger = new SizeChanger(this, layer);

        this.body.setCollideWorldBounds(true);

        /** Timestamps that make jumping forgiving (PRD 4.8). */
        this.lastOnGroundAt = -Infinity;
        this.lastJumpPressedAt = -Infinity;
        this.wasOnGround = false;

        /** Distance walked, in tiles -- the tutorial listens for this. */
        this.distanceWalked = 0;

        // Named `controls`, not `input`: Phaser game objects already use `input`.
        this.controls = new PlayerInput(scene);

        // Terrain helpers: forgiving corners and one-way shelves (PRD 4.10).
        this.corners = new CornerCorrection(layer);
        this.platformDrop = new PlatformDrop(layer);
    }

    /**
     * Size the hitbox for the current size state, keeping the FEET in place.
     *
     * Arcade bodies are positioned from their top-left corner, so growing
     * upward means moving the body up by exactly the height it gained --
     * otherwise the puppet would grow down into the floor and be ejected
     * through the ceiling.
     */
    applyBodySize() {
        const width = this.state.bodyWidth;

        // A body exactly as tall as a gap snags on it, so trim a sliver.
        const height = this.state.bodyHeight - CONFIG.player.bodyClearancePx;

        this.body.setSize(width, height, false);

        // The offset is measured from the texture's top-left. Putting the
        // body's bottom edge on the texture's bottom edge is what keeps the
        // feet planted: a taller body then grows UPWARD, never into the floor.
        this.body.setOffset(
            (this.width - width) / 2,
            this.height - height
        );
    }

    /** Where the feet are in world space -- the rig hangs from this point. */
    get feetY() {
        return this.body.bottom;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const seconds = delta / 1000;
        const onGround = this.body.blocked.down || this.body.touching.down;

        this.sizeChanger.request(this.controls.sizeRequest(this.state.index));
        this.trackGround(time, onGround);
        const direction = this.moveHorizontally(seconds);
        this.handleJump(time, onGround);
        this.applyFastFall();
        this.corners.apply(this, seconds, direction, onGround);
    }

    /** Asked by GameScene's collider: should this tile let the player through? */
    letsThrough(tile) {
        return this.platformDrop.letsThrough(tile, this.scene.time.now);
    }

    /** Remember when we were last on the ground, for coyote time. */
    trackGround(time, onGround) {
        if (onGround) {
            this.lastOnGroundAt = time;

            if (!this.wasOnGround) {
                EventBus.emit(EVENTS.PLAYER_LANDED, { fallSpeed: this.body.velocity.y });
            }
        }

        this.wasOnGround = onGround;
    }

    /**
     * Accelerate towards the target speed rather than snapping to it.
     * Reaching full speed in ~0.1 s and stopping in ~0.08 s is the
     * difference between "responsive" and "icy" (PRD 4.8).
     */
    moveHorizontally(seconds) {
        const direction = this.controls.direction;

        const target = direction * this.state.speed;
        const rampMs = direction === 0 ? CONFIG.player.frictionMs : CONFIG.player.accelerationMs;

        // Fraction of the way to the target we travel this frame. Capped at
        // 1 so a long frame cannot overshoot past the target speed.
        const step = Math.min(1, seconds / (rampMs / 1000));

        this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, target, step);

        if (direction !== 0) {
            this.facing = direction;
            this.distanceWalked += Math.abs(this.body.velocity.x) * seconds / TILE_SIZE;
            EventBus.emit(EVENTS.PLAYER_MOVED, { distanceTiles: this.distanceWalked });
        }

        return direction;
    }

    /**
     * Jumping, with the three mercies from PRD 4.8:
     *  - COYOTE TIME: a jump still works just after walking off a ledge
     *  - JUMP BUFFER: a jump pressed just before landing still fires
     *  - VARIABLE HEIGHT: letting go early cuts the rise short
     */
    handleJump(time, onGround) {
        const pressed = this.controls.jumpPressed;   // read once: it is used up
        const held = this.controls.jumpHeld;

        if (pressed) this.lastJumpPressedAt = time;

        // Down + Jump on a one-way shelf drops through it instead of jumping.
        if (pressed && onGround && this.controls.downHeld && this.platformDrop.isOnPlatform(this.body)) {
            this.platformDrop.start(time);
            this.lastJumpPressedAt = -Infinity;
            return;
        }

        const wantsJump = time - this.lastJumpPressedAt <= CONFIG.player.jumpBufferMs;
        const mayJump = onGround || time - this.lastOnGroundAt <= CONFIG.player.coyoteTimeMs;

        if (wantsJump && mayJump) {
            this.body.velocity.y = this.state.jump;

            // Spend both, so one press cannot become two jumps.
            this.lastJumpPressedAt = -Infinity;
            this.lastOnGroundAt = -Infinity;

            EventBus.emit(EVENTS.PLAYER_JUMPED, { sizeIndex: this.state.index });
        }

        // Released early while still rising: cut the jump short.
        if (!held && this.body.velocity.y < 0) {
            this.body.velocity.y *= CONFIG.player.jumpCutMultiplier;
        }
    }

    /**
     * Fall faster than you rise. Real jumps do not do this, but it is what
     * makes a platformer feel snappy instead of floaty (PRD 4.8).
     */
    applyFastFall() {
        const extra = CONFIG.physics.gravity * (CONFIG.physics.fastFallMultiplier - 1);

        this.body.setGravityY(this.body.velocity.y > 0 ? extra : 0);
    }
}
