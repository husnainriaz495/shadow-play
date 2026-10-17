import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, TILE_SIZE, GAME_HEIGHT } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * A heavy wooden crate (map symbol `C`): solid, and movable ONLY when the
 * puppet is Huge (PRD 4.4). Pushed onto a switch, it holds a gate open.
 *
 * The `C` marks the crate's BOTTOM-LEFT tile: the crate fills that tile,
 * the one to its right and the two above them (it is 2 x 2 tiles).
 *
 * HOW the "only when Huge" rule works: to the puppet the crate is always
 * a wall (`pushable = false`), so Tiny and Normal simply bump into it.
 * When a Huge puppet leans on its side and walks towards it, the crate is
 * given CONFIG.crate.pushSpeed and slides; the puppet, walking faster,
 * follows it. Gravity, the tiles and drag do everything else, so it still
 * drops into holes and stops at walls (CODE_RULES.md rule 1).
 *
 * A crate that falls somewhere it can never come back from (too far below
 * its start, since crates only slide sideways) is quietly returned to its
 * start by a "stagehand", so a puzzle can never be lost for good.
 *
 * WHY not Arcade's own pushing (PRD 6.4 suggested toggling `pushable`):
 * Arcade shares each overlap between the two bodies and the drag ate the
 * rest, so a Huge puppet crawled along at ~20 px/s. A fixed push speed
 * feels heavy but steady, and is easy to tune.
 */
export class Crate extends Phaser.Physics.Arcade.Sprite {
    /** @param {number} x, y the CENTRE of the map tile marked `C` */
    constructor(scene, x, y) {
        // From the centre of the bottom-left tile to the centre of 2 x 2.
        super(scene, x + TILE_SIZE / 2, y - TILE_SIZE / 2, 'crate');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(DEPTHS.PROPS);
        this.body.setSize(TILE_SIZE * 2, TILE_SIZE * 2);
        this.body.setDragX(CONFIG.crate.dragX);
        this.body.setCollideWorldBounds(true);
        this.body.pushable = false;   // the puppet never shoves it by collision

        /** Read by ObjectSpawner: collide with it rather than overlap it. */
        this.isSolid = true;

        /** Read by ObjectSpawner: it moves, so it must collide with the tiles. */
        this.isMovable = true;

        /** Read by Switch: a crate resting on a switch presses it. */
        this.pressesSwitches = true;

        /** Read by SizeChanger: the puppet cannot grow into a crate. */
        this.blocksGrowth = true;

        /** Set by link(); until then nobody can push it. */
        this.player = null;

        /** Where the stagehand puts it back, and the floor it started on. */
        this.home = { x: this.x, y: this.y };
        this.homeBottom = this.y + TILE_SIZE;
        this.returning = false;
    }

    /** Called once every object exists (ObjectSpawner). */
    link({ player }) {
        this.player = player;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.returning) return;

        if (this.isLost()) {
            this.returnHome();
            return;
        }

        const direction = this.pushDirection();
        if (direction !== 0) {
            this.body.velocity.x = direction * CONFIG.crate.pushSpeed;
        }
    }

    /**
     * Resting too far below its start to ever get back: crates cannot climb.
     * Act 2's softlock was exactly this -- pushed left off the first ledge.
     */
    isLost() {
        // Fell out of the bottom of the stage (through a burnt hole).
        if (this.body.top > GAME_HEIGHT) return true;

        const drop = this.body.bottom - this.homeBottom;

        return this.body.blocked.down && drop >= CONFIG.crate.lostDropTiles * TILE_SIZE;
    }

    /**
     * The stagehand: a pause so the player sees it land, a fade out, then
     * the crate reappears at its start. Scene timers and tweens, so a
     * restart cleans them all up (CODE_RULES.md rule 9).
     */
    returnHome() {
        this.returning = true;

        this.scene.time.delayedCall(CONFIG.crate.returnDelayMs, () => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: CONFIG.crate.returnFadeMs,
                onComplete: () => this.reappear()
            });
        });
    }

    /** Back at the start -- but never on top of the puppet; wait instead. */
    reappear() {
        if (this.homeIsOccupied()) {
            this.scene.time.delayedCall(CONFIG.crate.returnRetryMs, () => this.reappear());
            return;
        }

        this.body.reset(this.home.x, this.home.y);
        this.scene.tweens.add({ targets: this, alpha: 1, duration: CONFIG.crate.returnFadeMs });
        this.returning = false;

        EventBus.emit(EVENTS.CRATE_RETURNED);
    }

    /** Is the puppet standing where the crate is about to reappear? */
    homeIsOccupied() {
        const half = TILE_SIZE;
        const them = this.player?.body;
        if (!them) return false;

        return them.right > this.home.x - half && them.left < this.home.x + half &&
            them.bottom > this.home.y - half && them.top < this.home.y + half;
    }

    /**
     * Which way the puppet is pushing this crate: 1 right, -1 left, 0 not.
     * It must be Huge (PRD 4.4), walking towards the crate, and pressed
     * against its side with their heights overlapping. Checked every frame,
     * so shrinking mid-push stops the crate at once.
     */
    pushDirection() {
        const player = this.player;
        if (!player?.state.canPushCrates) return 0;

        const direction = player.controls.direction;
        const me = this.body;
        const them = player.body;
        const { contactPx } = CONFIG.crate;

        const sideBySide = them.bottom > me.top + contactPx && them.top < me.bottom - contactPx;
        if (!sideBySide) return 0;

        if (direction > 0 && Math.abs(them.right - me.left) <= contactPx) return 1;
        if (direction < 0 && Math.abs(them.left - me.right) <= contactPx) return -1;

        return 0;
    }
}
